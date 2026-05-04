'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Type,
  Mail,
  Phone,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Calendar,
  Upload,
  EyeOff,
  Minus,
  Heading,
  Save,
  Eye,
  Globe,
  Code,
  Link2,
  X,
  GripVertical,
  Trash2,
  Settings,
  BarChart3,
  Table,
  Plus,
  FileText,
  Copy,
  Shield,
  Bell,
  Database,
  ExternalLink,
  ClipboardList,
  UserPlus,
  MessageSquare,
  Star,
  Briefcase,
  LayoutTemplate,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'hidden'
  | 'divider'
  | 'heading';

interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';
  value: string;
  message: string;
}

interface FieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  validation: ValidationRule[];
  options: FieldOption[];
  helpText: string;
  defaultValue: string;
}

interface FormSettings {
  name: string;
  successMessage: string;
  redirectUrl: string;
  notificationEmail: string;
  submissionStorage: 'database' | 'email' | 'both';
  spamProtection: boolean;
  published: boolean;
}

interface FormSubmission {
  id: string;
  date: string;
  data: Record<string, string>;
  source: string;
}

interface FormTemplate {
  id: string;
  name: string;
  icon: typeof FileText;
  description: string;
  fields: Omit<FormField, 'id'>[];
}

/* ================================================================= */
/*  Field Library                                                      */
/* ================================================================= */

const FIELD_LIBRARY: { type: FieldType; label: string; icon: typeof Type; group: string }[] = [
  { type: 'text', label: 'Text Input', icon: Type, group: 'Basic' },
  { type: 'email', label: 'Email', icon: Mail, group: 'Basic' },
  { type: 'phone', label: 'Phone', icon: Phone, group: 'Basic' },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft, group: 'Basic' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, group: 'Choice' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, group: 'Choice' },
  { type: 'radio', label: 'Radio Buttons', icon: Circle, group: 'Choice' },
  { type: 'date', label: 'Date Picker', icon: Calendar, group: 'Advanced' },
  { type: 'file', label: 'File Upload', icon: Upload, group: 'Advanced' },
  { type: 'hidden', label: 'Hidden Field', icon: EyeOff, group: 'Advanced' },
  { type: 'divider', label: 'Section Divider', icon: Minus, group: 'Layout' },
  { type: 'heading', label: 'Heading', icon: Heading, group: 'Layout' },
];

/* ================================================================= */
/*  Templates                                                          */
/* ================================================================= */

const TEMPLATES: FormTemplate[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    icon: MessageSquare,
    description: 'Simple contact form with name, email, and message',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
    ],
  },
  {
    id: 'lead',
    name: 'Lead Capture',
    icon: UserPlus,
    description: 'Capture leads with company and interest details',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'Jane Smith', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'email', label: 'Work Email', placeholder: 'jane@company.com', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'text', label: 'Company', placeholder: 'Acme Inc.', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'phone', label: 'Phone', placeholder: '(555) 987-6543', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'dropdown', label: 'Interest', placeholder: 'Select...', required: true, validation: [], options: [{ label: 'Product Demo', value: 'demo' }, { label: 'Pricing', value: 'pricing' }, { label: 'Partnership', value: 'partnership' }, { label: 'Other', value: 'other' }], helpText: '', defaultValue: '' },
    ],
  },
  {
    id: 'survey',
    name: 'Survey',
    icon: ClipboardList,
    description: 'Multi-question survey with rating and choices',
    fields: [
      { type: 'heading', label: 'Customer Satisfaction Survey', placeholder: '', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'radio', label: 'How satisfied are you?', placeholder: '', required: true, validation: [], options: [{ label: 'Very Satisfied', value: '5' }, { label: 'Satisfied', value: '4' }, { label: 'Neutral', value: '3' }, { label: 'Dissatisfied', value: '2' }, { label: 'Very Dissatisfied', value: '1' }], helpText: '', defaultValue: '' },
      { type: 'checkbox', label: 'What do you like most?', placeholder: '', required: false, validation: [], options: [{ label: 'Product Quality', value: 'quality' }, { label: 'Customer Service', value: 'service' }, { label: 'Pricing', value: 'pricing' }, { label: 'Ease of Use', value: 'ease' }], helpText: 'Select all that apply', defaultValue: '' },
      { type: 'textarea', label: 'Additional Comments', placeholder: 'Tell us more...', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
    ],
  },
  {
    id: 'registration',
    name: 'Registration',
    icon: UserPlus,
    description: 'Event or account registration form',
    fields: [
      { type: 'text', label: 'First Name', placeholder: 'First', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'text', label: 'Last Name', placeholder: 'Last', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'email', label: 'Email', placeholder: 'you@email.com', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'phone', label: 'Phone', placeholder: '(555) 000-0000', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'dropdown', label: 'Role', placeholder: 'Select your role', required: true, validation: [], options: [{ label: 'Attendee', value: 'attendee' }, { label: 'Speaker', value: 'speaker' }, { label: 'Sponsor', value: 'sponsor' }], helpText: '', defaultValue: '' },
      { type: 'checkbox', label: 'I agree to the terms and conditions', placeholder: '', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback',
    icon: Star,
    description: 'Collect user feedback and ratings',
    fields: [
      { type: 'text', label: 'Name', placeholder: 'Your name', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'email', label: 'Email', placeholder: 'your@email.com', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'radio', label: 'Overall Rating', placeholder: '', required: true, validation: [], options: [{ label: '5 - Excellent', value: '5' }, { label: '4 - Good', value: '4' }, { label: '3 - Average', value: '3' }, { label: '2 - Poor', value: '2' }, { label: '1 - Terrible', value: '1' }], helpText: '', defaultValue: '' },
      { type: 'textarea', label: 'What could we improve?', placeholder: 'Your feedback helps us get better...', required: false, validation: [], options: [], helpText: '', defaultValue: '' },
    ],
  },
  {
    id: 'application',
    name: 'Application',
    icon: Briefcase,
    description: 'Job or program application form',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'Full legal name', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'email', label: 'Email', placeholder: 'you@email.com', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'phone', label: 'Phone', placeholder: '(555) 000-0000', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'dropdown', label: 'Position', placeholder: 'Select position', required: true, validation: [], options: [{ label: 'Software Engineer', value: 'swe' }, { label: 'Designer', value: 'design' }, { label: 'Product Manager', value: 'pm' }, { label: 'Marketing', value: 'marketing' }], helpText: '', defaultValue: '' },
      { type: 'textarea', label: 'Why are you a good fit?', placeholder: 'Tell us about yourself...', required: true, validation: [], options: [], helpText: '', defaultValue: '' },
      { type: 'file', label: 'Resume', placeholder: '', required: true, validation: [], options: [], helpText: 'PDF or DOCX, max 5MB', defaultValue: '' },
    ],
  },
];

/* ================================================================= */
/*  Helpers                                                            */
/* ================================================================= */

let fieldIdCounter = 0;
function genId(): string {
  fieldIdCounter += 1;
  return `field_${Date.now()}_${fieldIdCounter}`;
}

function createField(type: FieldType): FormField {
  const lib = FIELD_LIBRARY.find((f) => f.type === type);
  return {
    id: genId(),
    type,
    label: lib?.label || type,
    placeholder: '',
    required: false,
    validation: [],
    options: type === 'dropdown' || type === 'radio' || type === 'checkbox'
      ? [{ label: 'Option 1', value: 'option_1' }, { label: 'Option 2', value: 'option_2' }]
      : [],
    helpText: '',
    defaultValue: '',
  };
}

function fieldIcon(type: FieldType) {
  const lib = FIELD_LIBRARY.find((f) => f.type === type);
  if (!lib) return Type;
  return lib.icon;
}

/* ================================================================= */
/*  Mock Submissions                                                   */
/* ================================================================= */

const MOCK_SUBMISSIONS: FormSubmission[] = [
  { id: 's1', date: '2026-03-15T10:23:00Z', data: { name: 'Alice Johnson', email: 'alice@example.com', message: 'Interested in your services' }, source: 'Direct' },
  { id: 's2', date: '2026-03-14T16:45:00Z', data: { name: 'Bob Smith', email: 'bob@corp.com', message: 'Need a demo' }, source: 'Google Ads' },
  { id: 's3', date: '2026-03-13T09:12:00Z', data: { name: 'Carol Davis', email: 'carol@startup.io', message: 'Partnership inquiry' }, source: 'Referral' },
  { id: 's4', date: '2026-03-12T14:30:00Z', data: { name: 'Dan Lee', email: 'dan@tech.co', message: 'Pricing question' }, source: 'Organic' },
  { id: 's5', date: '2026-03-11T11:05:00Z', data: { name: 'Eva Martin', email: 'eva@agency.com', message: 'White label options?' }, source: 'Social Media' },
];

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function FormBuilderPage() {
  // -- Form state --
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FormSettings>({
    name: 'Untitled Form',
    successMessage: 'Thank you for your submission!',
    redirectUrl: '',
    notificationEmail: '',
    submissionStorage: 'database',
    spamProtection: true,
    published: false,
  });

  // -- UI state --
  const [bottomTab, setBottomTab] = useState<'submissions' | 'analytics'>('submissions');
  const [showPreview, setShowPreview] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceType, setDragSourceType] = useState<FieldType | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [showShareCopied, setShowShareCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );

  // -- Field operations --
  const addField = useCallback((type: FieldType, atIndex?: number) => {
    const field = createField(type);
    setFields((prev) => {
      const next = [...prev];
      if (atIndex !== undefined && atIndex >= 0) {
        next.splice(atIndex, 0, field);
      } else {
        next.push(field);
      }
      return next;
    });
    setSelectedFieldId(field.id);
    setShowTemplates(false);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedFieldId((prev) => (prev === id ? null : prev));
  }, []);

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const reorderFields = useCallback((fromIndex: number, toIndex: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const loadTemplate = useCallback((template: FormTemplate) => {
    const newFields = template.fields.map((f) => ({ ...f, id: genId() }));
    setFields(newFields);
    setSettings((prev) => ({ ...prev, name: template.name }));
    setSelectedFieldId(null);
    setShowTemplates(false);
  }, []);

  // -- Drag handlers (sidebar -> canvas) --
  const handleSidebarDragStart = useCallback((e: React.DragEvent, type: FieldType) => {
    e.dataTransfer.setData('fieldType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDragSourceType(type);
    setDragSourceIndex(null);
  }, []);

  // -- Drag handlers (canvas reorder) --
  const handleCanvasDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('canvasIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDragSourceIndex(index);
    setDragSourceType(null);
  }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragSourceType ? 'copy' : 'move';
    setDragOverIndex(index);
  }, [dragSourceType]);

  const handleCanvasDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    const canvasIndex = e.dataTransfer.getData('canvasIndex');

    if (fieldType) {
      addField(fieldType, dropIndex);
    } else if (canvasIndex !== '') {
      const fromIndex = parseInt(canvasIndex, 10);
      if (fromIndex !== dropIndex) {
        reorderFields(fromIndex, dropIndex > fromIndex ? dropIndex - 1 : dropIndex);
      }
    }
    setDragSourceType(null);
    setDragSourceIndex(null);
  }, [addField, reorderFields]);

  // Drop on empty canvas
  const handleEmptyCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (fieldType) {
      addField(fieldType);
    }
    setDragSourceType(null);
    setDragSourceIndex(null);
  }, [addField]);

  const handleEmptyCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // -- Share link --
  const handleCopyShareLink = useCallback(() => {
    const slug = settings.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigator.clipboard.writeText(`https://universe.memelli.com/forms/${slug}`);
    setShowShareCopied(true);
    setTimeout(() => setShowShareCopied(false), 2000);
  }, [settings.name]);

  // -- Embed code --
  const embedCode = useMemo(() => {
    const slug = settings.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<iframe src="https://universe.memelli.com/forms/${slug}/embed" width="100%" height="600" frameborder="0"></iframe>`;
  }, [settings.name]);

  // -- Analytics mock --
  const analytics = useMemo(() => ({
    totalSubmissions: 147,
    conversionRate: 34.2,
    dropOffField: fields.length > 2 ? fields[Math.floor(fields.length * 0.6)]?.label || 'N/A' : 'N/A',
  }), [fields]);

  /* ================================================================= */
  /*  Render                                                             */
  /* ================================================================= */

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      {/* ============ TOP BAR ============ */}
      <div className="flex items-center justify-between border-b border-white/[0.04] bg-card backdrop-blur-xl px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/10">
            <FileText className="h-4 w-4 text-red-400" />
          </div>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
            className="bg-transparent text-lg font-semibold text-foreground border-none outline-none focus:ring-0 placeholder:text-muted-foreground w-64"
            placeholder="Form name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { /* Save logic */ }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            onClick={() => setSettings((s) => ({ ...s, published: !s.published }))}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
              settings.published
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'border border-white/[0.06] bg-white/[0.03] text-muted-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {settings.published ? 'Published' : 'Publish'}
          </button>
          <button
            onClick={() => setShowEmbed(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Code className="h-3.5 w-3.5" />
            Embed
          </button>
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Link2 className="h-3.5 w-3.5" />
            {showShareCopied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* ============ MAIN AREA (3 columns) ============ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---- LEFT SIDEBAR: Field Library ---- */}
        <div className="w-64 shrink-0 border-r border-white/[0.04] bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Field Library</h3>
            {(['Basic', 'Choice', 'Advanced', 'Layout'] as const).map((group) => (
              <div key={group} className="mb-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</div>
                <div className="space-y-1">
                  {FIELD_LIBRARY.filter((f) => f.group === group).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleSidebarDragStart(e, item.type)}
                        onClick={() => addField(item.type)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Templates */}
          <div className="border-t border-white/[0.04] p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
            </h3>
            <div className="space-y-1">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => loadTemplate(tmpl)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all w-full text-left"
                  >
                    <Icon className="h-3.5 w-3.5 text-red-400/60" />
                    {tmpl.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- CENTER: Form Canvas ---- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6" ref={canvasRef}>
            {fields.length === 0 && showTemplates ? (
              /* Empty state with templates */
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.06] mx-auto mb-4">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Build Your Form</h2>
                  <p className="text-sm text-muted-foreground mt-1">Drag fields from the sidebar or start with a template</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => loadTemplate(tmpl)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 hover:border-red-500/20 hover:bg-white/[0.03] transition-all text-left group"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{tmpl.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : fields.length === 0 ? (
              /* Empty canvas drop zone */
              <div
                onDrop={handleEmptyCanvasDrop}
                onDragOver={handleEmptyCanvasDragOver}
                className="flex flex-col items-center justify-center h-full border-2 border-dashed border-white/[0.06] rounded-2xl"
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Drop fields here to build your form</p>
              </div>
            ) : (
              /* Fields on canvas */
              <div className="max-w-2xl mx-auto space-y-0">
                {fields.map((field, index) => {
                  const Icon = fieldIcon(field.type);
                  const isSelected = selectedFieldId === field.id;
                  const isDragOver = dragOverIndex === index;
                  return (
                    <div key={field.id}>
                      {/* Drop indicator */}
                      {isDragOver && (
                        <div className="h-1 bg-red-500 rounded-full mx-4 my-1 transition-all" />
                      )}
                      <div
                        draggable
                        onDragStart={(e) => handleCanvasDragStart(e, index)}
                        onDragOver={(e) => handleCanvasDragOver(e, index)}
                        onDragLeave={handleCanvasDragLeave}
                        onDrop={(e) => handleCanvasDrop(e, index)}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`group relative flex items-start gap-3 rounded-xl border p-4 mb-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-500/30 bg-red-500/[0.03] shadow-lg shadow-red-500/5'
                            : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]'
                        } ${dragSourceIndex === index ? 'opacity-40' : ''}`}
                      >
                        {/* Grip handle */}
                        <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-muted-foreground transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Field content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{field.label}</span>
                            {field.required && <span className="text-red-400 text-xs">*</span>}
                            <span className="text-[10px] text-muted-foreground bg-white/[0.03] rounded px-1.5 py-0.5">{field.type}</span>
                          </div>

                          {/* Field preview */}
                          {field.type === 'divider' ? (
                            <div className="border-t border-white/[0.06] mt-2" />
                          ) : field.type === 'heading' ? (
                            <div className="text-base font-semibold text-foreground mt-1">{field.label}</div>
                          ) : field.type === 'textarea' ? (
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground h-16 mt-1">{field.placeholder || 'Enter text...'}</div>
                          ) : field.type === 'dropdown' ? (
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground mt-1 flex items-center justify-between">
                              <span>{field.placeholder || 'Select...'}</span>
                              <ChevronDown className="h-3 w-3" />
                            </div>
                          ) : field.type === 'checkbox' ? (
                            <div className="space-y-1.5 mt-1">
                              {field.options.length > 0 ? field.options.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="h-3.5 w-3.5 rounded border border-white/[0.1] bg-white/[0.02]" />
                                  {opt.label}
                                </div>
                              )) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="h-3.5 w-3.5 rounded border border-white/[0.1] bg-white/[0.02]" />
                                  {field.label}
                                </div>
                              )}
                            </div>
                          ) : field.type === 'radio' ? (
                            <div className="space-y-1.5 mt-1">
                              {field.options.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="h-3.5 w-3.5 rounded-full border border-white/[0.1] bg-white/[0.02]" />
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          ) : field.type === 'file' ? (
                            <div className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] px-3 py-3 text-xs text-muted-foreground mt-1 text-center">
                              <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              Click or drag to upload
                            </div>
                          ) : field.type === 'date' ? (
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {field.placeholder || 'Select date...'}
                            </div>
                          ) : field.type === 'hidden' ? (
                            <div className="text-xs text-muted-foreground italic mt-1">Hidden field: {field.defaultValue || '(no value)'}</div>
                          ) : (
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground mt-1">{field.placeholder || 'Enter value...'}</div>
                          )}
                          {field.helpText && <div className="text-[10px] text-muted-foreground mt-1">{field.helpText}</div>}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Drop zone at the end */}
                <div
                  onDrop={(e) => handleCanvasDrop(e, fields.length)}
                  onDragOver={(e) => handleCanvasDragOver(e, fields.length)}
                  onDragLeave={handleCanvasDragLeave}
                  className={`border-2 border-dashed rounded-xl py-6 text-center transition-all mt-2 ${
                    dragOverIndex === fields.length
                      ? 'border-red-500/30 bg-red-500/[0.03]'
                      : 'border-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <Plus className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Drop field here</span>
                </div>
              </div>
            )}
          </div>

          {/* ---- BOTTOM: Submissions / Analytics ---- */}
          <div className="border-t border-white/[0.04] bg-card">
            <div className="flex items-center gap-0 border-b border-white/[0.04]">
              <button
                onClick={() => setBottomTab('submissions')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${
                  bottomTab === 'submissions'
                    ? 'border-red-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-muted-foreground'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                Submissions
              </button>
              <button
                onClick={() => setBottomTab('analytics')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${
                  bottomTab === 'analytics'
                    ? 'border-red-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-muted-foreground'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </button>
            </div>

            <div className="h-48 overflow-y-auto">
              {bottomTab === 'submissions' ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left text-muted-foreground font-medium px-4 py-2">Date</th>
                      <th className="text-left text-muted-foreground font-medium px-4 py-2">Data</th>
                      <th className="text-left text-muted-foreground font-medium px-4 py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SUBMISSIONS.map((sub) => (
                      <tr key={sub.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(sub.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5 text-foreground truncate max-w-xs">
                          {Object.entries(sub.data).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 text-muted-foreground">{sub.source}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-3 gap-4 p-4">
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Submissions</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{analytics.totalSubmissions}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">+12 this week</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conversion Rate</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{analytics.conversionRate}%</div>
                    <div className="text-[10px] text-emerald-400 mt-1">+2.1% from last month</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Drop-off Field</div>
                    <div className="text-lg font-bold text-foreground mt-1 truncate">{analytics.dropOffField}</div>
                    <div className="text-[10px] text-amber-400 mt-1">Highest abandonment</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- RIGHT PANEL: Field Config / Form Settings ---- */}
        <div className="w-80 shrink-0 border-l border-white/[0.04] bg-card overflow-y-auto">
          {selectedField ? (
            /* Field Configuration */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Settings</h3>
                <button
                  onClick={() => setSelectedFieldId(null)}
                  className="text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Label */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>

                {/* Placeholder */}
                {!['divider', 'heading', 'checkbox', 'radio'].includes(selectedField.type) && (
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Placeholder</label>
                    <input
                      type="text"
                      value={selectedField.placeholder}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                  </div>
                )}

                {/* Help Text */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Help Text</label>
                  <input
                    type="text"
                    value={selectedField.helpText}
                    onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                    placeholder="Optional helper text"
                  />
                </div>

                {/* Default Value (for hidden fields) */}
                {selectedField.type === 'hidden' && (
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Default Value</label>
                    <input
                      type="text"
                      value={selectedField.defaultValue}
                      onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                  </div>
                )}

                {/* Required toggle */}
                {!['divider', 'heading'].includes(selectedField.type) && (
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Required</label>
                    <button
                      onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                      className={`relative h-5 w-9 rounded-full transition-colors ${selectedField.required ? 'bg-red-500' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${selectedField.required ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}

                {/* Options (for dropdown, radio, checkbox) */}
                {['dropdown', 'radio', 'checkbox'].includes(selectedField.type) && (
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Options</label>
                    <div className="space-y-1.5">
                      {selectedField.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newOptions = [...selectedField.options];
                              newOptions[i] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                              updateField(selectedField.id, { options: newOptions });
                            }}
                            className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-foreground focus:border-red-500/30 focus:outline-none transition-all"
                          />
                          <button
                            onClick={() => {
                              const newOptions = selectedField.options.filter((_, idx) => idx !== i);
                              updateField(selectedField.id, { options: newOptions });
                            }}
                            className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOptions = [...selectedField.options, { label: `Option ${selectedField.options.length + 1}`, value: `option_${selectedField.options.length + 1}` }];
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors mt-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add option
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Rules */}
                {!['divider', 'heading', 'hidden', 'file'].includes(selectedField.type) && (
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Validation Rules</label>
                    <div className="space-y-1.5">
                      {selectedField.validation.map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <select
                            value={rule.type}
                            onChange={(e) => {
                              const newRules = [...selectedField.validation];
                              newRules[i] = { ...rule, type: e.target.value as ValidationRule['type'] };
                              updateField(selectedField.id, { validation: newRules });
                            }}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs text-foreground focus:outline-none"
                          >
                            <option value="minLength">Min Length</option>
                            <option value="maxLength">Max Length</option>
                            <option value="pattern">Pattern</option>
                          </select>
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => {
                              const newRules = [...selectedField.validation];
                              newRules[i] = { ...rule, value: e.target.value };
                              updateField(selectedField.id, { validation: newRules });
                            }}
                            placeholder="Value"
                            className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const newRules = selectedField.validation.filter((_, idx) => idx !== i);
                              updateField(selectedField.id, { validation: newRules });
                            }}
                            className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newRules = [...selectedField.validation, { type: 'minLength' as const, value: '', message: '' }];
                          updateField(selectedField.id, { validation: newRules });
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add rule
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete field */}
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="flex items-center gap-1.5 w-full rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-xs text-red-400 hover:bg-red-500/[0.06] transition-all mt-4"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Field
                </button>
              </div>
            </div>
          ) : (
            /* Form Settings */
            <div className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Form Settings
              </h3>

              <div className="space-y-4">
                {/* Form Name */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Form Name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>

                {/* Success Message */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Success Message</label>
                  <textarea
                    value={settings.successMessage}
                    onChange={(e) => setSettings((s) => ({ ...s, successMessage: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                  />
                </div>

                {/* Redirect URL */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Redirect URL
                  </label>
                  <input
                    type="url"
                    value={settings.redirectUrl}
                    onChange={(e) => setSettings((s) => ({ ...s, redirectUrl: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                    placeholder="https://..."
                  />
                </div>

                {/* Notification Email */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings((s) => ({ ...s, notificationEmail: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                    placeholder="notify@example.com"
                  />
                </div>

                {/* Submission Storage */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Submission Storage
                  </label>
                  <select
                    value={settings.submissionStorage}
                    onChange={(e) => setSettings((s) => ({ ...s, submissionStorage: e.target.value as FormSettings['submissionStorage'] }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none transition-all"
                  >
                    <option value="database">Database</option>
                    <option value="email">Email Only</option>
                    <option value="both">Database + Email</option>
                  </select>
                </div>

                {/* Spam Protection */}
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Spam Protection
                  </label>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, spamProtection: !s.spamProtection }))}
                    className={`relative h-5 w-9 rounded-full transition-colors ${settings.spamProtection ? 'bg-red-500' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.spamProtection ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Field count */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Fields</span>
                    <span className="text-foreground font-medium">{fields.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-muted-foreground">Required Fields</span>
                    <span className="text-foreground font-medium">{fields.filter((f) => f.required).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${settings.published ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {settings.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ PREVIEW MODAL ============ */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">{settings.name} - Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No fields added yet</p>
              ) : (
                fields.map((field) => (
                  <div key={field.id}>
                    {field.type === 'divider' ? (
                      <hr className="border-white/[0.06] my-4" />
                    ) : field.type === 'heading' ? (
                      <h2 className="text-lg font-semibold text-foreground mt-2">{field.label}</h2>
                    ) : field.type === 'hidden' ? null : (
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none resize-none"
                          />
                        ) : field.type === 'dropdown' ? (
                          <select className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:outline-none">
                            <option value="">{field.placeholder || 'Select...'}</option>
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <div className="space-y-2">
                            {field.options.length > 0 ? field.options.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <input type="checkbox" className="rounded border-border bg-card text-red-500 focus:ring-red-500/20" />
                                {opt.label}
                              </label>
                            )) : (
                              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <input type="checkbox" className="rounded border-border bg-card text-red-500 focus:ring-red-500/20" />
                                {field.label}
                              </label>
                            )}
                          </div>
                        ) : field.type === 'radio' ? (
                          <div className="space-y-2">
                            {field.options.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <input type="radio" name={field.id} className="border-border bg-card text-red-500 focus:ring-red-500/20" />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'file' ? (
                          <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
                            <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Click or drag file to upload</p>
                          </div>
                        ) : field.type === 'date' ? (
                          <input
                            type="date"
                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-red-500/30 focus:outline-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none"
                          />
                        )}
                        {field.helpText && <p className="text-[10px] text-muted-foreground mt-1">{field.helpText}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
              {fields.length > 0 && (
                <button className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-medium text-white mt-4">
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ EMBED MODAL ============ */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">Embed Code</h3>
              <button onClick={() => setShowEmbed(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-muted-foreground mb-3">Copy and paste this code into your website:</p>
              <div className="relative">
                <pre className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <button
                  onClick={() => { navigator.clipboard.writeText(embedCode); }}
                  className="absolute top-2 right-2 rounded-md bg-white/[0.05] border border-white/[0.06] p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
