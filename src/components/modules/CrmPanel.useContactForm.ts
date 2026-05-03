/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — useContactForm hook                                              */
/*  Extracted from useCrmPanel (refactor 2026-04-30, stage 3).                  */
/*  Owns the new-contact form: state, submit. Lifted 1:1. No behavior change.   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useState } from 'react';
import { apiFetch, type Contact } from './CrmPanel.utils';
import type { ContactFormState } from './CrmPanel.QuickAddContact';

interface UseContactFormArgs {
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export interface UseContactFormResult {
  contactForm: ContactFormState;
  contactFormError: string | null;
  contactFormSuccess: boolean;
  savingContact: boolean;
  handleContactFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitContact: (e: React.FormEvent) => Promise<void>;
}

export function useContactForm({
  setContacts,
}: UseContactFormArgs): UseContactFormResult {
  const [contactForm, setContactForm] = useState<ContactFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });
  const [contactFormError, setContactFormError] = useState<string | null>(null);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  const handleContactFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setContactForm((f) => ({ ...f, [e.target.name]: e.target.value }));
      setContactFormError(null);
    },
    []
  );

  const submitContact = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setContactFormError(null);
      if (!contactForm.firstName && !contactForm.email) {
        setContactFormError('First name or email is required.');
        return;
      }
      setSavingContact(true);
      const res = await apiFetch<Contact>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(contactForm),
      });
      setSavingContact(false);

      if (!res) {
        setContactFormError('Failed to create contact. Please try again.');
        return;
      }

      setContacts((prev) => [res, ...prev]);
      setContactFormSuccess(true);
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
      });
      setTimeout(() => setContactFormSuccess(false), 3000);
    },
    [contactForm, setContacts]
  );

  return {
    contactForm,
    contactFormError,
    contactFormSuccess,
    savingContact,
    handleContactFormChange,
    submitContact,
  };
}
