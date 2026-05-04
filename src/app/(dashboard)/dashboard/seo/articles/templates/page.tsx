'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronDown, ChevronUp, BookOpen, List, MessageSquare, BarChart2, Star, Layers } from 'lucide-react';

const TEMPLATE_PREF_KEY = 'seo_template_preference';

interface TemplateSection {
  heading: string;
  description: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  sections: TemplateSection[];
  promptHint: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'how-to',
    name: 'How-To Guide',
    description: 'Step-by-step format that walks readers through a process from start to finish.',
    icon: BookOpen,
    color: 'blue',
    promptHint: 'Write as a step-by-step guide with numbered steps, prerequisites, and a clear outcome.',
    sections: [
      { heading: 'Introduction', description: 'Briefly explain what the reader will accomplish and why it matters.' },
      { heading: 'What You\'ll Need', description: 'List prerequisites, tools, or requirements.' },
      { heading: 'Step 1: [First Action]', description: 'Clear instruction with explanation.' },
      { heading: 'Step 2: [Second Action]', description: 'Continue step-by-step breakdown.' },
      { heading: 'Step 3: [Third Action]', description: 'Additional steps as needed.' },
      { heading: 'Tips & Common Mistakes', description: 'Pro tips and pitfalls to avoid.' },
      { heading: 'Conclusion', description: 'Recap what was accomplished and next steps.' },
    ],
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Numbered list format — easily scannable and highly shareable.',
    icon: List,
    color: 'primary',
    promptHint: 'Write as a numbered list article. Each item should have a heading, 2-3 sentences of explanation, and ideally a concrete example.',
    sections: [
      { heading: 'Introduction', description: 'Hook the reader and preview what the list covers.' },
      { heading: '1. [Item Name]', description: 'Explanation, why it matters, example.' },
      { heading: '2. [Item Name]', description: 'Explanation, why it matters, example.' },
      { heading: '3–N. [Additional Items]', description: 'Continue for all items on the list.' },
      { heading: 'Conclusion', description: 'Summarize the key takeaways and call to action.' },
    ],
  },
  {
    id: 'qa',
    name: 'Q&A Article',
    description: 'Question and answer format — great for FAQ-style content and featured snippets.',
    icon: MessageSquare,
    color: 'green',
    promptHint: 'Structure as a series of questions with clear, concise answers. Format each question as an H2 heading with a direct answer below.',
    sections: [
      { heading: 'Introduction', description: 'Brief context on the topic.' },
      { heading: 'Q: [Core Question]?', description: 'Direct answer in 2-3 sentences, then elaborate.' },
      { heading: 'Q: [Related Question]?', description: 'Another common question with answer.' },
      { heading: 'Q: [Follow-up Question]?', description: 'Additional Q&A pairs as needed.' },
      { heading: 'Summary', description: 'Key points recap and further resources.' },
    ],
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'X vs Y format — helps readers make decisions by comparing two or more options.',
    icon: BarChart2,
    color: 'yellow',
    promptHint: 'Write as a comparison article with a structured breakdown of each option, a features comparison table, and a clear recommendation.',
    sections: [
      { heading: 'Introduction', description: 'Set up the comparison and why it matters.' },
      { heading: 'Overview: Option A', description: 'Key features, pros, and cons.' },
      { heading: 'Overview: Option B', description: 'Key features, pros, and cons.' },
      { heading: 'Head-to-Head Comparison', description: 'Feature-by-feature table or breakdown.' },
      { heading: 'Which Should You Choose?', description: 'Recommendation based on use case.' },
      { heading: 'Conclusion', description: 'Final verdict and call to action.' },
    ],
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Product or service review format with ratings, pros/cons, and a verdict.',
    icon: Star,
    color: 'orange',
    promptHint: 'Write as an in-depth review with a rating system, pros and cons, and a clear verdict. Include real-world use cases.',
    sections: [
      { heading: 'Introduction & Rating', description: 'Overview and overall score (e.g., 4.5/5).' },
      { heading: 'Key Features', description: 'What stands out about this product/service.' },
      { heading: 'Performance & Testing', description: 'How it performs in real use.' },
      { heading: 'Pros', description: 'What we liked — bullet list.' },
      { heading: 'Cons', description: 'What could be improved — bullet list.' },
      { heading: 'Pricing & Value', description: 'Cost analysis and whether it\'s worth it.' },
      { heading: 'Verdict', description: 'Final recommendation and who it\'s best for.' },
    ],
  },
  {
    id: 'ultimate-guide',
    name: 'Ultimate Guide',
    description: 'Long-form comprehensive guide covering everything about a topic.',
    icon: Layers,
    color: 'indigo',
    promptHint: 'Write as a comprehensive ultimate guide with multiple major sections, subheadings, examples, statistics, and actionable advice. Aim for 2000+ words.',
    sections: [
      { heading: 'What You\'ll Learn', description: 'Table of contents and key takeaways.' },
      { heading: 'What Is [Topic]?', description: 'Definition, history, and context.' },
      { heading: 'Why [Topic] Matters', description: 'Benefits and importance.' },
      { heading: 'Getting Started', description: 'Prerequisites and initial setup.' },
      { heading: 'Core Concepts', description: 'Deep dive into the fundamentals.' },
      { heading: 'Advanced Strategies', description: 'Expert-level tips and techniques.' },
      { heading: 'Common Mistakes', description: 'What to avoid.' },
      { heading: 'Tools & Resources', description: 'Recommended tools, links, references.' },
      { heading: 'Conclusion & Next Steps', description: 'Summary and action items.' },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/10', icon: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-300' },
  purple: { border: 'border-primary/20', bg: 'bg-primary/10', icon: 'text-primary', badge: 'bg-primary/10 text-primary/80' },
  green: { border: 'border-green-500/20', bg: 'bg-green-500/10', icon: 'text-green-400', badge: 'bg-green-500/10 text-green-300' },
  yellow: { border: 'border-yellow-500/20', bg: 'bg-yellow-500/10', icon: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-300' },
  orange: { border: 'border-orange-500/20', bg: 'bg-orange-500/10', icon: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-300' },
  indigo: { border: 'border-indigo-500/20', bg: 'bg-indigo-500/10', icon: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300' },
};

export default function ArticleTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(TEMPLATE_PREF_KEY);
    if (saved) setSelectedTemplate(saved);
  }, []);

  function selectTemplate(id: string) {
    setSelectedTemplate(id);
    localStorage.setItem(TEMPLATE_PREF_KEY, id);
  }

  function useTemplate(id: string) {
    selectTemplate(id);
    router.push(`/dashboard/seo/questions?template=${id}`);
  }

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Article Templates</h1>
          <p className="text-muted-foreground leading-relaxed text-sm mt-1">Choose a structure to guide AI content generation</p>
        </div>

        {selectedTemplate && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 backdrop-blur-xl rounded-2xl">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">
              Active template: <span className="text-primary/80 font-medium">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
            </p>
            <button
              onClick={() => { setSelectedTemplate(null); localStorage.removeItem(TEMPLATE_PREF_KEY); }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map(template => {
            const colors = colorMap[template.color];
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            const isExpanded = expandedTemplate === template.id;

            return (
              <div
                key={template.id}
                className={`bg-card backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isSelected ? `${colors.border} ring-1 ring-purple-500/20` : 'border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${colors.bg} border ${colors.border} flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground tracking-tight">{template.name}</h3>
                          {isSelected && (
                            <span className={`px-1.5 py-0.5 rounded-lg text-xs ${colors.badge}`}>Active</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Structure preview */}
                  <div className="mt-4">
                    <button
                      onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Hide' : 'Preview'} structure ({template.sections.length} sections)
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-1.5 bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                        {template.sections.map((section, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-xs text-muted-foreground font-mono w-5 flex-shrink-0">{i + 1}.</span>
                            <div>
                              <p className="text-xs text-foreground font-medium">{section.heading}</p>
                              <p className="text-xs text-muted-foreground">{section.description}</p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-white/[0.04]">
                          <p className="text-xs text-muted-foreground">
                            <span className="text-muted-foreground font-medium">AI prompt hint: </span>
                            {template.promptHint}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => selectTemplate(template.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20 text-primary/80'
                          : 'bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-foreground'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => useTemplate(template.id)}
                      className="flex-1 px-3 py-2 bg-primary hover:bg-primary rounded-xl text-sm text-white font-semibold tracking-tight transition-all duration-200"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <h3 className="font-semibold tracking-tight text-foreground mb-2">How Templates Work</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">1.</span> Select a template to set it as your default for generation</li>
            <li className="flex gap-2"><span className="text-primary">2.</span> When generating articles, the AI follows the template structure</li>
            <li className="flex gap-2"><span className="text-primary">3.</span> Click <span className="text-foreground">&quot;Use Template&quot;</span> to go directly to the question generator with this template pre-selected</li>
            <li className="flex gap-2"><span className="text-primary">4.</span> Your preference is saved in your browser for future sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
