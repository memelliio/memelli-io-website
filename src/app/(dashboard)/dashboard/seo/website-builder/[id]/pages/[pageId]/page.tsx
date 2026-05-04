'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Image,
  MousePointer,
} from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@memelli/ui';
import { useApi } from '../../../../../../../../hooks/useApi';

interface ContentBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'cta' | 'faq' | 'testimonial';
  content: string;
  metadata?: Record<string, string>;
}

interface PageDetail {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  blocks: ContentBlock[];
  updatedAt: string;
}

const BLOCK_TYPES = [
  { value: 'heading', label: 'Heading', icon: Type },
  { value: 'text', label: 'Text', icon: Type },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'cta', label: 'Call to Action', icon: MousePointer },
  { value: 'faq', label: 'FAQ', icon: Type },
  { value: 'testimonial', label: 'Testimonial', icon: Type },
];

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: ContentBlock;
  onChange: (updated: ContentBlock) => void;
  onRemove: () => void;
}) {
  const typeLabel = BLOCK_TYPES.find((t) => t.value === block.type)?.label ?? block.type;

  return (
    <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Badge variant="default">{typeLabel}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-400 hover:bg-white/[0.04] transition-all duration-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {block.type === 'cta' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Button Text</label>
              <Input
                value={block.content}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Get Started"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Button URL</label>
              <Input
                value={block.metadata?.url ?? ''}
                onChange={(e) => onChange({ ...block, metadata: { ...block.metadata, url: e.target.value } })}
                placeholder="/contact"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Style</label>
              <Select
                value={block.metadata?.style ?? 'primary'}
                onChange={(v) => onChange({ ...block, metadata: { ...block.metadata, style: v } })}
                options={[
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'outline', label: 'Outline' },
                ]}
              />
            </div>
          </div>
        ) : block.type === 'image' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Image URL</label>
              <Input
                value={block.content}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Alt Text</label>
              <Input
                value={block.metadata?.alt ?? ''}
                onChange={(e) => onChange({ ...block, metadata: { ...block.metadata, alt: e.target.value } })}
                placeholder="Descriptive alt text"
              />
            </div>
          </div>
        ) : (
          <Textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={block.type === 'heading' ? 2 : 6}
            placeholder={`Enter ${typeLabel.toLowerCase()} content...`}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function PageEditorPage() {
  const params = useParams();
  const siteId = params.id as string;
  const pageId = params.pageId as string;
  const api = useApi();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<ContentBlock[] | null>(null);
  const [metaTitle, setMetaTitle] = useState<string | null>(null);
  const [metaDescription, setMetaDescription] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PageDetail>({
    queryKey: ['page-detail', siteId, pageId],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the PageDetail object)
      const res = await api.get<PageDetail>(
        `/api/seo/websites/${siteId}/pages/${pageId}`
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      if (blocks !== null) body.blocks = blocks;
      if (metaTitle !== null) body.metaTitle = metaTitle;
      if (metaDescription !== null) body.metaDescription = metaDescription;
      const res = await api.patch(`/api/seo/websites/${siteId}/pages/${pageId}`, body);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-detail', siteId, pageId] });
      setBlocks(null);
      setMetaTitle(null);
      setMetaDescription(null);
    },
  });

  const pageData = data;

  if (isLoading) {
    return (
      <div className="bg-card min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="bg-card min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-muted-foreground leading-relaxed">Page not found.</p>
        </div>
      </div>
    );
  }

  const currentBlocks = blocks ?? pageData.blocks;

  const updateBlock = (index: number, updated: ContentBlock) => {
    const next = [...currentBlocks];
    next[index] = updated;
    setBlocks(next);
  };

  const removeBlock = (index: number) => {
    const next = currentBlocks.filter((_, i) => i !== index);
    setBlocks(next);
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `new-${Date.now()}`,
      type,
      content: '',
      metadata: {},
    };
    setBlocks([...currentBlocks, newBlock]);
  };

  const hasChanges = blocks !== null || metaTitle !== null || metaDescription !== null;

  return (
    <div className="bg-card min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PageHeader
          title={pageData.title}
          subtitle={`/${pageData.slug}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'SEO', href: '/dashboard/seo' },
            { label: 'Website Builder', href: '/dashboard/seo/website-builder' },
            { label: 'Site', href: `/dashboard/seo/website-builder/${siteId}` },
            { label: pageData.title },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/seo/website-builder/${siteId}`}>
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
                  Back
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-3.5 w-3.5" />}
                onClick={() => saveMutation.mutate()}
                disabled={!hasChanges || saveMutation.isPending}
              >
                Save
              </Button>
            </div>
          }
          className="mb-8"
        />

        {/* SEO Meta */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">SEO Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">Meta Title</label>
              <Input
                value={metaTitle ?? pageData.metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Page title for search engines"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">Meta Description</label>
              <Textarea
                value={metaDescription ?? pageData.metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Description for search engine results"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks */}
        <div className="space-y-6 mb-8">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Content Blocks</h3>
          {currentBlocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={(updated) => updateBlock(i, updated)}
              onRemove={() => removeBlock(i)}
            />
          ))}
        </div>

        {/* Add block buttons */}
        <div className="flex flex-wrap gap-3">
          {BLOCK_TYPES.map((type) => (
            <Button
              key={type.value}
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3 w-3" />}
              onClick={() => addBlock(type.value as ContentBlock['type'])}
              className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}