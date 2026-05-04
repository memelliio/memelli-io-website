'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input, Button, Select, Combobox, Modal } from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  source?: string | null;
}

interface ContactFormProps {
  contact?: Contact | null;
  onClose: () => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
}

const typeOptions = [
  { value: 'PERSON', label: 'Person' },
  { value: 'COMPANY', label: 'Company' },
];

const commonTags = [
  { value: 'vip', label: 'VIP' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Customer' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
];

export function ContactForm({ contact, onClose }: ContactFormProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const [type, setType] = useState(contact?.type ?? 'PERSON');
  const [firstName, setFirstName] = useState(contact?.firstName ?? '');
  const [lastName, setLastName] = useState(contact?.lastName ?? '');
  const [companyName, setCompanyName] = useState(contact?.companyName ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [tags, setTags] = useState<string[]>(contact?.tags ?? []);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (type === 'PERSON' && !firstName.trim() && !lastName.trim()) {
      newErrors.firstName = 'First or last name is required';
    }
    if (type === 'COMPANY' && !companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [type, firstName, lastName, companyName, email]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        type,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        tags,
      };

      if (isEditing) {
        const res = await api.patch(`/api/crm/contacts/${contact.id}`, body);
        if (res.error) throw new Error(res.error);
        return res.data;
      } else {
        const res = await api.post(`/api/crm/contacts`, body);
        if (res.error) throw new Error(res.error);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Contact updated' : 'Contact created');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['contact', contact.id] });
      }
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || (isEditing ? 'Failed to update contact' : 'Failed to create contact'));
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      mutation.mutate();
    },
    [validate, mutation],
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add Contact'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Type"
          options={typeOptions}
          value={type}
          onChange={(val: string) => setType(val as 'PERSON' | 'COMPANY')}
          size="md"
        />

        {type === 'PERSON' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              error={errors.firstName}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              error={errors.lastName}
              placeholder="Doe"
            />
          </div>
        ) : (
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
            }}
            error={errors.companyName}
            placeholder="Acme Inc."
          />
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          placeholder="john@example.com"
        />

        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          error={errors.phone}
          placeholder="+1 (555) 000-0000"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Tags</label>
          <Combobox
            options={commonTags}
            values={tags}
            onChange={setTags}
            placeholder="Add tags..."
            creatable
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={mutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
