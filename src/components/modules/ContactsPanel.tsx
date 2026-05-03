'use client';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — orchestrator                                                */
/*  Refactored 2026-04-30: split god-component (851L) into siblings:            */
/*    • ContactsPanel.utils.tsx          — types, helpers, Avatar/TagPill/      */
/*                                          SkeletonRows                        */
/*    • ContactsPanel.DetailPanel.tsx    — selected-contact drawer + edit/     */
/*                                          delete                              */
/*    • ContactsPanel.NewContactModal.tsx — create-contact modal                */
/*  This file owns search/page state, list rendering and panel composition.    */
/*  No behavior changes from the pre-split version.                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import {
  PAGE_SIZE,
  SkeletonRows,
  type Contact,
} from './ContactsPanel.utils';
import { DetailPanel } from './ContactsPanel.DetailPanel';
import { NewContactModal } from './ContactsPanel.NewContactModal';
import { ContactListRow } from './ContactsPanel.ListRow';
import { ContactsPagination } from './ContactsPanel.Pagination';

export function ContactsPanel() {
  const api = useApi();

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);

  // Debounce search 300ms
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(val);
        setPage(1);
      }, 300);
    },
    []
  );

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(page));
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

    const res = await api.get<{ data: Contact[]; total: number }>(
      `/api/contacts?${params}`
    );
    setLoading(false);

    if (res.error) {
      setLoadError(res.error);
      return;
    }

    // Handle both wrapped { data, total } and direct array responses
    const payload = res.data;
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      Array.isArray((payload as any).data)
    ) {
      setContacts((payload as any).data as Contact[]);
      setTotal(
        typeof (payload as any).total === 'number'
          ? (payload as any).total
          : (payload as any).data.length
      );
    } else if (Array.isArray(payload)) {
      setContacts(payload as Contact[]);
      setTotal((payload as Contact[]).length);
    } else {
      setContacts([]);
      setTotal(0);
    }
  }, [api, page, debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Keep selectedContact in sync after updates
  const handleUpdated = useCallback((updated: Contact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedContact(updated);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    setSelectedContact(null);
  }, []);

  const handleCreated = useCallback((c: Contact) => {
    setContacts((prev) => [c, ...prev]);
    setTotal((prev) => prev + 1);
    setSelectedContact(c);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex flex-col gap-2.5 px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-zinc-100 text-base font-semibold tracking-tight">
              Contacts
            </h2>
            {total > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full text-[10px] font-mono font-semibold text-teal-300 min-w-[22px] h-[18px] px-1.5"
                style={{
                  background: 'rgba(45,212,191,0.12)',
                  border: '1px solid rgba(45,212,191,0.2)',
                }}
              >
                {total}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setShowNewContact(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-black transition-colors hover:opacity-90"
            style={{ background: '#2dd4bf' }}
          >
            <Plus size={11} />
            New Contact
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={12} className="text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search contacts..."
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setPage(1);
              }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Contact list */}
        <div
          className="flex flex-col flex-1 min-w-0 min-h-0"
          style={selectedContact ? { maxWidth: '60%' } : {}}
        >
          <div className="flex-1 overflow-y-auto px-4 py-1">
            {loading ? (
              <SkeletonRows count={8} />
            ) : loadError ? (
              <p className="text-[11px] text-red-400 font-mono text-center py-8">
                {loadError}
              </p>
            ) : contacts.length === 0 ? (
              <p className="text-[11px] text-zinc-600 font-mono text-center py-8">
                {debouncedSearch
                  ? 'No contacts match your search.'
                  : 'No contacts yet.'}
              </p>
            ) : (
              contacts.map((c) => {
                const isSelected = selectedContact?.id === c.id;
                return (
                  <ContactListRow
                    key={c.id}
                    contact={c}
                    isSelected={isSelected}
                    onSelect={() =>
                      setSelectedContact(isSelected ? null : c)
                    }
                  />
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!loading && !loadError && total > 0 && (
            <ContactsPagination
              page={page}
              totalPages={totalPages}
              showingFrom={showingFrom}
              showingTo={showingTo}
              total={total}
              onPageChange={setPage}
            />
          )}
        </div>

        {/* Detail panel (slides in on right) */}
        {selectedContact && (
          <div
            className="shrink-0 overflow-hidden py-2 pr-4 pl-2"
            style={{ width: '40%', minWidth: 240 }}
          >
            <DetailPanel
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <NewContactModal
          onClose={() => setShowNewContact(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
