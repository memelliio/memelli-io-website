'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Download, Plus, Filter } from 'lucide-react';
import {
  PageHeader,
  Button,
  Modal,
  Select,
  Card,
  CardContent,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Certificate {
  id: string;
  issuedAt: string;
  pdfUrl?: string;
  templateType?: string;
  enrollment: {
    id: string;
    contact: { id: string; firstName?: string; lastName?: string; email?: string };
    program: { id: string; name: string };
  };
}

interface Program {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface EnrollmentOption {
  id: string;
  status: string;
  program?: { id: string; name: string };
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function contactName(cert: Certificate): string {
  const c = cert.enrollment?.contact;
  if (!c) return 'Unknown';
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return name || c.email || 'Unknown';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CertificatesPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [programFilter, setProgramFilter] = useState<string>('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');

  /* ---- Data fetching ---- */

  const { data: certsData, isLoading } = useQuery({
    queryKey: ['coaching', 'certificates'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/certificates');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Certificate[];
    },
  });

  const { data: programsData } = useQuery({
    queryKey: ['coaching', 'programs'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/programs');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Program[];
    },
  });

  const { data: enrollmentsForIssue } = useQuery({
    queryKey: ['coaching', 'enrollments', 'for-certificate'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/enrollments?status=COMPLETED');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as EnrollmentOption[];
    },
    enabled: showIssueModal,
  });

  const certificates = certsData ?? [];
  const programs = programsData ?? [];
  const enrollmentOptions = enrollmentsForIssue ?? [];

  /* ---- Filtering ---- */

  const filtered = useMemo(() => {
    if (!programFilter) return certificates;
    return certificates.filter((c) => c.enrollment?.program?.id === programFilter);
  }, [certificates, programFilter]);

  const programOptions = useMemo(
    () => [
      ...programs.map((p) => ({ value: p.id, label: p.name })),
    ],
    [programs],
  );

  const enrollmentSelectOptions = useMemo(
    () =>
      enrollmentOptions.map((e) => {
        const c = e.contact;
        const name = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || e.id : e.id;
        const programName = e.program?.name ?? 'Unknown';
        return { value: e.id, label: `${name} — ${programName}` };
      }),
    [enrollmentOptions],
  );

  /* ---- Issue certificate mutation ---- */

  const issueMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>('/api/coaching/certificates', {
        enrollmentId: selectedEnrollmentId,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'certificates'] });
      setShowIssueModal(false);
      setSelectedEnrollmentId('');
    },
  });

  /* ---- Loading skeleton ---- */

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton variant="line" className="h-8 w-48" />
        <Skeleton variant="line" className="h-4 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Certificates"
        subtitle="Issue and manage coaching certificates"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'Certificates' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowIssueModal(true)}
          >
            Issue Certificate
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-white/30" />
        <div className="w-64">
          <Select
            options={[
              { value: '', label: 'All Programs' },
              ...programOptions,
            ]}
            value={programFilter}
            onChange={(v) => setProgramFilter(v)}
            placeholder="Filter by program"
            size="sm"
          />
        </div>
        {programFilter && (
          <Button size="sm" variant="ghost" onClick={() => setProgramFilter('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Certificate grid */}
      {filtered.length === 0 ? (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground leading-relaxed">
              <Award className="mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No certificates found</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {programFilter
                  ? 'Try clearing the program filter.'
                  : 'Issue your first certificate to get started.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cert) => (
            <Card
              key={cert.id}
              className="group bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl transition-all duration-200 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5"
            >
              <CardContent className="space-y-4 p-5">
                {/* Header: student + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {contactName(cert)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground leading-relaxed">
                      {cert.enrollment?.program?.name ?? 'Unknown Program'}
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0">
                    Issued
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground leading-relaxed">Issued</span>
                    <span className="text-muted-foreground leading-relaxed">{formatDate(cert.issuedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground leading-relaxed">Certificate ID</span>
                    <span
                      className="font-mono text-xs text-muted-foreground leading-relaxed"
                      title={cert.id}
                    >
                      {truncateId(cert.id)}
                    </span>
                  </div>
                  {cert.templateType && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground leading-relaxed">Template</span>
                      <span className="capitalize text-muted-foreground leading-relaxed">{cert.templateType}</span>
                    </div>
                  )}
                </div>

                {/* Download button */}
                <div className="border-t border-white/[0.04] pt-3">
                  {cert.pdfUrl ? (
                    <a
                      href={cert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                      >
                        Download PDF
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full cursor-not-allowed opacity-50"
                      disabled
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                    >
                      PDF Unavailable
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setSelectedEnrollmentId('');
        }}
        title="Issue Certificate"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a completed enrollment to issue a certificate.
          </p>

          <Select
            label="Enrollment"
            options={enrollmentSelectOptions}
            value={selectedEnrollmentId}
            onChange={setSelectedEnrollmentId}
            placeholder="Select a completed enrollment..."
            searchable
          />

          {issueMutation.isError && (
            <p className="text-sm text-primary/80">
              {issueMutation.error instanceof Error
                ? issueMutation.error.message
                : 'Failed to issue certificate'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowIssueModal(false);
                setSelectedEnrollmentId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => issueMutation.mutate()}
              disabled={!selectedEnrollmentId || issueMutation.isPending}
            >
              {issueMutation.isPending ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
