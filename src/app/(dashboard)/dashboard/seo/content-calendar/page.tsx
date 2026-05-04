'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Download, Calendar } from 'lucide-react';
import { API_URL as API } from '@/lib/config';

async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Article {
  id: string;
  title: string;
  keyword?: string;
  status: string;
  publishedAt?: string;
  published_at?: string;
  createdAt?: string;
  created_at?: string;
}

interface Question {
  id: string;
  question: string;
  keyword?: string;
  status: string;
  targetDate?: string;
  target_date?: string;
  createdAt?: string;
  created_at?: string;
}

interface DayItems {
  publishedArticles: Article[];
  draftArticles: Article[];
  questions: Question[];
}

interface PlanModalState {
  open: boolean;
  date: string;
  questionId: string;
  newQuestion: string;
  targetDate: string;
  submitting: boolean;
  error: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Monday=0
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ContentCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [articles, setArticles] = useState<Article[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<PlanModalState>({
    open: false, date: '', questionId: '', newQuestion: '', targetDate: '', submitting: false, error: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, qRes] = await Promise.all([
        api('/api/seo/articles?perPage=100').catch(() => ({ data: [] })),
        api('/api/seo/questions?status=PENDING&perPage=100').catch(() => ({ data: { items: [] } })),
      ]);
      // Articles: { success, data: [...], meta } — raw api gives full envelope
      const aData = aRes?.data ?? aRes;
      const aList: Article[] = Array.isArray(aData) ? aData : aData?.articles ?? aData?.items ?? [];
      // Questions: { success, data: { items: [...], total } }
      const qData = qRes?.data ?? qRes;
      const qList: Question[] = qData?.items ?? (Array.isArray(qData) ? qData : []);
      setArticles(aList);
      setQuestions(qList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  const cells = getMonthDays(year, month);
  const todayKey = dateKey(today);

  function getItemsForDate(d: Date): DayItems {
    const key = dateKey(d);
    return {
      publishedArticles: articles.filter(a => {
        const dt = a.publishedAt ?? a.published_at;
        return dt && dt.startsWith(key) && a.status === 'PUBLISHED';
      }),
      draftArticles: articles.filter(a => {
        const dt = a.createdAt ?? a.created_at;
        return dt && dt.startsWith(key) && a.status !== 'PUBLISHED';
      }),
      questions: questions.filter(q => {
        const dt = q.targetDate ?? q.target_date ?? q.createdAt ?? q.created_at;
        return dt && dt.startsWith(key);
      }),
    };
  }

  const selectedItems = selectedDate
    ? getItemsForDate(new Date(selectedDate + 'T12:00:00'))
    : null;

  function exportCSV() {
    const rows = [['Date', 'Type', 'Title/Question', 'Status', 'Keyword']];
    articles.forEach(a => {
      const dt = (a.publishedAt ?? a.published_at ?? a.createdAt ?? a.created_at ?? '').split('T')[0];
      rows.push([dt, 'Article', a.title, a.status, a.keyword ?? '']);
    });
    questions.forEach(q => {
      const dt = (q.targetDate ?? q.target_date ?? q.createdAt ?? q.created_at ?? '').split('T')[0];
      rows.push([dt, 'Question', q.question, q.status, q.keyword ?? '']);
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'content-calendar.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function submitPlan() {
    setPlanModal(m => ({ ...m, submitting: true, error: null }));
    try {
      if (planModal.newQuestion.trim()) {
        // POST /api/seo/questions expects { question, keyword?, clusterId? }
        await api('/api/seo/questions', {
          method: 'POST',
          body: JSON.stringify({
            question: planModal.newQuestion.trim(),
          }),
        });
      } else if (planModal.questionId) {
        // Approve the existing question via the status endpoint
        await api(`/api/seo/questions/${planModal.questionId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'APPROVED' }),
        });
      }
      setPlanModal(m => ({ ...m, open: false }));
      load();
    } catch (e) {
      setPlanModal(m => ({ ...m, submitting: false, error: e instanceof Error ? e.message : 'Failed' }));
    }
  }

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl tracking-tight font-semibold text-foreground">Content Calendar</h1>
            <p className="text-muted-foreground leading-relaxed text-sm mt-1">Plan and track your content publishing schedule</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-foreground transition-all duration-200"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setPlanModal({ open: true, date: todayKey, questionId: '', newQuestion: '', targetDate: todayKey, submitting: false, error: null })}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl text-sm text-white font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Plan Article
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Published</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Draft / Planned</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/80 inline-block" /> Pending Question</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-all duration-200">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h2 className="tracking-tight font-semibold text-foreground">{formatMonthYear(year, month)}</h2>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-all duration-200">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/[0.04]">
              {DAYS.map(d => (
                <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  if (!cell) {
                    return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-white/[0.03] bg-card" />;
                  }
                  const key = dateKey(cell);
                  const items = getItemsForDate(cell);
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDate;
                  const hasItems = items.publishedArticles.length + items.draftArticles.length + items.questions.length > 0;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedDate(isSelected ? null : key)}
                      className={`min-h-[90px] border-b border-r border-white/[0.03] p-1.5 cursor-pointer transition-all duration-150 ${
                        isSelected ? 'bg-primary/80/[0.08]' : hasItems ? 'hover:bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-primary text-white' : 'text-muted-foreground'
                      }`}>
                        {cell.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {items.publishedArticles.slice(0, 2).map(a => (
                          <div key={a.id} className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg text-xs truncate">
                            {a.title}
                          </div>
                        ))}
                        {items.draftArticles.slice(0, 2).map(a => (
                          <div key={a.id} className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-xs truncate">
                            {a.title}
                          </div>
                        ))}
                        {items.questions.slice(0, 1).map(q => (
                          <div key={q.id} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary/80 rounded-lg text-xs truncate">
                            {q.question}
                          </div>
                        ))}
                        {items.publishedArticles.length + items.draftArticles.length + items.questions.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{items.publishedArticles.length + items.draftArticles.length + items.questions.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day detail panel */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm tracking-tight font-semibold text-foreground">
                  {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                </h3>
              </div>
              {selectedDate && (
                <button
                  onClick={() => setPlanModal({ open: true, date: selectedDate, questionId: '', newQuestion: '', targetDate: selectedDate, submitting: false, error: null })}
                  className="p-1 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="p-4">
              {!selectedDate && (
                <p className="text-sm text-muted-foreground text-center py-8">Click a date to see its content</p>
              )}
              {selectedDate && selectedItems && (
                <div className="space-y-4">
                  {selectedItems.publishedArticles.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">Published</p>
                      {selectedItems.publishedArticles.map(a => (
                        <a key={a.id} href={`/dashboard/seo/articles/${a.id}`} className="block px-3 py-2 bg-green-500/[0.06] border border-green-500/15 rounded-xl mb-2 hover:bg-green-500/10 transition-all duration-200">
                          <p className="text-xs text-foreground font-medium line-clamp-2">{a.title}</p>
                          {a.keyword && <p className="text-xs text-muted-foreground mt-0.5">{a.keyword}</p>}
                        </a>
                      ))}
                    </div>
                  )}
                  {selectedItems.draftArticles.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">Draft / Planned</p>
                      {selectedItems.draftArticles.map(a => (
                        <a key={a.id} href={`/dashboard/seo/articles/${a.id}`} className="block px-3 py-2 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl mb-2 hover:bg-blue-500/10 transition-all duration-200">
                          <p className="text-xs text-foreground font-medium line-clamp-2">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{a.status.toLowerCase()}</p>
                        </a>
                      ))}
                    </div>
                  )}
                  {selectedItems.questions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Planned Questions</p>
                      {selectedItems.questions.map(q => (
                        <div key={q.id} className="px-3 py-2 bg-primary/80/[0.06] border border-primary/15 rounded-xl mb-2">
                          <p className="text-xs text-foreground font-medium line-clamp-2">{q.question}</p>
                          {q.keyword && <p className="text-xs text-muted-foreground mt-0.5">{q.keyword}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedItems.publishedArticles.length === 0 && selectedItems.draftArticles.length === 0 && selectedItems.questions.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">No content planned</p>
                      <button
                        onClick={() => setPlanModal({ open: true, date: selectedDate, questionId: '', newQuestion: '', targetDate: selectedDate, submitting: false, error: null })}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        + Plan an article
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Modal */}
      {planModal.open && (
        <div className="fixed inset-0 bg-background backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <h2 className="tracking-tight font-semibold text-foreground">Plan Article</h2>
              <button onClick={() => setPlanModal(m => ({ ...m, open: false }))} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Target Publish Date</label>
                <input
                  type="date"
                  value={planModal.targetDate}
                  onChange={e => setPlanModal(m => ({ ...m, targetDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Link Existing Question ID (optional)</label>
                <input
                  type="text"
                  value={planModal.questionId}
                  onChange={e => setPlanModal(m => ({ ...m, questionId: e.target.value }))}
                  placeholder="Question ID..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Or create a new question</label>
                <textarea
                  value={planModal.newQuestion}
                  onChange={e => setPlanModal(m => ({ ...m, newQuestion: e.target.value }))}
                  placeholder="Enter question text..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground resize-none"
                />
              </div>
              {planModal.error && <p className="text-xs text-muted-foreground leading-relaxed">{planModal.error}</p>}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setPlanModal(m => ({ ...m, open: false }))}
                className="flex-1 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitPlan}
                disabled={planModal.submitting || (!planModal.questionId && !planModal.newQuestion.trim())}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                {planModal.submitting ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
