'use client'

// NAMING NOTE 2026-04-30: "/universe/..." path checks below match the legacy
// route group folder (apps/web/src/app/(universe)/). That surface is the
// cockpit / Command Center — see CLAUDE.md naming note. Path keys kept as-is
// because the route group rename is a separate stage-2 pass.

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  Bot,
  X,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Users,
  ShoppingBag,
  CreditCard,
  GraduationCap,
  Phone,
  Target,
  Globe,
  BarChart3,
  Shield,
  Wrench,
  Briefcase,
  Crown
} from 'lucide-react'
import { useVoice } from '../../hooks/useVoice'

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Agent {
  id: string
  name: string
  role: string
  icon: React.ReactNode
  status: 'active' | 'busy' | 'idle'
}

interface ChatMessage {
  id: string
  sender: 'user' | 'agent'
  text: string
  timestamp: Date
}

interface ContextGroup {
  label: string
  agents: Agent[]
}

// ---------------------------------------------------------------------------
// Context → Agent mapping
// ---------------------------------------------------------------------------

const CONTEXT_MAP: Record<string, ContextGroup> = {
  commerce: {
    label: 'Commerce',
    agents: [
      { id: 'store-manager', name: 'Store Manager', role: 'Oversees storefront operations & layout', icon: <ShoppingBag className="h-4 w-4" />, status: 'active' },
      { id: 'product-cataloger', name: 'Product Cataloger', role: 'Manages product listings & metadata', icon: <Wrench className="h-4 w-4" />, status: 'idle' },
      { id: 'order-processor', name: 'Order Processor', role: 'Handles order fulfillment workflows', icon: <ChevronRight className="h-4 w-4" />, status: 'active' },
      { id: 'inventory-monitor', name: 'Inventory Monitor', role: 'Tracks stock levels & reorder points', icon: <BarChart3 className="h-4 w-4" />, status: 'idle' },
      { id: 'pricing-optimizer', name: 'Pricing Optimizer', role: 'Analyzes & recommends optimal pricing', icon: <Target className="h-4 w-4" />, status: 'busy' },
    ]
  },
  crm: {
    label: 'CRM',
    agents: [
      { id: 'pipeline-manager', name: 'Pipeline Manager', role: 'Manages deal stages & forecasting', icon: <BarChart3 className="h-4 w-4" />, status: 'active' },
      { id: 'deal-closer', name: 'Deal Closer', role: 'Automates closing sequences & follow-ups', icon: <Target className="h-4 w-4" />, status: 'active' },
      { id: 'contact-enricher', name: 'Contact Enricher', role: 'Enriches contact data from public sources', icon: <Users className="h-4 w-4" />, status: 'idle' },
      { id: 'followup-scheduler', name: 'Follow-up Scheduler', role: 'Schedules & tracks follow-up cadences', icon: <MessageSquare className="h-4 w-4" />, status: 'busy' },
      { id: 'segment-builder', name: 'Segment Builder', role: 'Creates audience segments from CRM data', icon: <Shield className="h-4 w-4" />, status: 'idle' },
    ]
  },
  coaching: {
    label: 'Coaching',
    agents: [
      { id: 'program-designer', name: 'Program Designer', role: 'Designs coaching program structures', icon: <Briefcase className="h-4 w-4" />, status: 'active' },
      { id: 'lesson-creator', name: 'Lesson Creator', role: 'Generates lesson content & materials', icon: <GraduationCap className="h-4 w-4" />, status: 'active' },
      { id: 'student-mentor', name: 'Student Mentor', role: 'Provides personalized student guidance', icon: <Users className="h-4 w-4" />, status: 'idle' },
      { id: 'quiz-builder', name: 'Quiz Builder', role: 'Creates assessments & quizzes', icon: <Sparkles className="h-4 w-4" />, status: 'idle' },
      { id: 'certificate-manager', name: 'Certificate Manager', role: 'Issues & tracks certifications', icon: <Crown className="h-4 w-4" />, status: 'busy' },
    ]
  },
  credit: {
    label: 'Credit',
    agents: [
      { id: 'credit-analyst', name: 'Credit Analyst', role: 'Analyzes credit reports & disputes', icon: <CreditCard className="h-4 w-4" />, status: 'active' },
      { id: 'score-monitor', name: 'Score Monitor', role: 'Tracks score changes in real-time', icon: <BarChart3 className="h-4 w-4" />, status: 'active' },
      { id: 'document-verifier', name: 'Document Verifier', role: 'Verifies identity & supporting documents', icon: <Shield className="h-4 w-4" />, status: 'idle' },
      { id: 'decision-engine', name: 'Decision Engine', role: 'Runs automated approval decisions', icon: <Wrench className="h-4 w-4" />, status: 'busy' },
      { id: 'report-generator', name: 'Report Generator', role: 'Generates client credit reports', icon: <Globe className="h-4 w-4" />, status: 'idle' },
    ]
  },
  communications: {
    label: 'Communications',
    agents: [
      { id: 'call-router', name: 'Call Router', role: 'Routes inbound calls to the right agent', icon: <Phone className="h-4 w-4" />, status: 'active' },
      { id: 'sms-manager', name: 'SMS Manager', role: 'Manages SMS campaigns & responses', icon: <MessageSquare className="h-4 w-4" />, status: 'active' },
      { id: 'email-composer', name: 'Email Composer', role: 'Drafts & sends email communications', icon: <Send className="h-4 w-4" />, status: 'idle' },
      { id: 'chat-agent', name: 'Chat Agent', role: 'Handles live chat conversations', icon: <MessageSquare className="h-4 w-4" />, status: 'busy' },
      { id: 'ticket-handler', name: 'Ticket Handler', role: 'Manages support ticket lifecycle', icon: <Wrench className="h-4 w-4" />, status: 'idle' },
    ]
  },
  leads: {
    label: 'Leads',
    agents: [
      { id: 'signal-hunter', name: 'Signal Hunter', role: 'Discovers high-intent lead signals', icon: <Target className="h-4 w-4" />, status: 'active' },
      { id: 'lead-scorer', name: 'Lead Scorer', role: 'Scores & prioritizes incoming leads', icon: <BarChart3 className="h-4 w-4" />, status: 'active' },
      { id: 'outreach-manager', name: 'Outreach Manager', role: 'Manages multi-channel outreach', icon: <Send className="h-4 w-4" />, status: 'busy' },
      { id: 'identity-resolver', name: 'Identity Resolver', role: 'Resolves anonymous visitors to contacts', icon: <Users className="h-4 w-4" />, status: 'idle' },
      { id: 'campaign-builder', name: 'Campaign Builder', role: 'Builds lead generation campaigns', icon: <Sparkles className="h-4 w-4" />, status: 'idle' },
    ]
  },
  seo: {
    label: 'SEO',
    agents: [
      { id: 'question-discoverer', name: 'Question Discoverer', role: 'Finds high-value questions to answer', icon: <Globe className="h-4 w-4" />, status: 'active' },
      { id: 'thread-creator', name: 'Thread Creator', role: 'Creates authority-building threads', icon: <MessageSquare className="h-4 w-4" />, status: 'active' },
      { id: 'discussion-expander', name: 'Discussion Expander', role: 'Expands discussions for reach', icon: <Users className="h-4 w-4" />, status: 'idle' },
      { id: 'indexing-manager', name: 'Indexing Manager', role: 'Manages search engine indexing', icon: <Wrench className="h-4 w-4" />, status: 'busy' },
      { id: 'authority-builder', name: 'Authority Builder', role: 'Builds domain authority signals', icon: <Crown className="h-4 w-4" />, status: 'idle' },
    ]
  },
  executive: {
    label: 'Executive',
    agents: [
      { id: 'ceo', name: 'CEO', role: 'Strategic oversight & decision-making', icon: <Crown className="h-4 w-4" />, status: 'active' },
      { id: 'chief-of-staff', name: 'Chief of Staff', role: 'Coordinates cross-team operations', icon: <Briefcase className="h-4 w-4" />, status: 'active' },
      { id: 'coo', name: 'COO', role: 'Optimizes operational efficiency', icon: <Wrench className="h-4 w-4" />, status: 'active' },
      { id: 'cfo', name: 'CFO', role: 'Financial analysis & forecasting', icon: <BarChart3 className="h-4 w-4" />, status: 'idle' },
      { id: 'cro', name: 'CRO', role: 'Revenue strategy & growth', icon: <Target className="h-4 w-4" />, status: 'busy' },
    ]
  },
  general: {
    label: 'General',
    agents: [
      { id: 'receptionist', name: 'Receptionist', role: 'Greets & directs incoming requests', icon: <Users className="h-4 w-4" />, status: 'active' },
      { id: 'greeter', name: 'Greeter', role: 'Welcomes new users & onboards', icon: <Sparkles className="h-4 w-4" />, status: 'active' },
      { id: 'calendar-manager', name: 'Calendar Manager', role: 'Schedules meetings & events', icon: <Briefcase className="h-4 w-4" />, status: 'idle' },
      { id: 'file-manager', name: 'File Manager', role: 'Organizes & retrieves documents', icon: <Shield className="h-4 w-4" />, status: 'idle' },
      { id: 'help-desk', name: 'Help Desk', role: 'Answers questions & resolves issues', icon: <MessageSquare className="h-4 w-4" />, status: 'active' },
    ]
  }
}

function resolveContext(pathname: string): ContextGroup {
  if (pathname.startsWith('/dashboard/commerce') || pathname.startsWith('/universe/commerce')) return CONTEXT_MAP.commerce
  if (pathname.startsWith('/dashboard/crm') || pathname.startsWith('/universe/crm')) return CONTEXT_MAP.crm
  if (pathname.startsWith('/dashboard/coaching') || pathname.startsWith('/universe/coaching')) return CONTEXT_MAP.coaching
  if (pathname.startsWith('/dashboard/credit') || pathname.startsWith('/universe/credit')) return CONTEXT_MAP.credit
  if (pathname.startsWith('/dashboard/communications') || pathname.startsWith('/universe/communications')) return CONTEXT_MAP.communications
  if (pathname.startsWith('/dashboard/leads') || pathname.startsWith('/universe/leads')) return CONTEXT_MAP.leads
  if (pathname.startsWith('/dashboard/seo') || pathname.startsWith('/universe/traffic')) return CONTEXT_MAP.seo
  if (pathname === '/dashboard' || pathname === '/universe' || pathname.startsWith('/universe/')) return CONTEXT_MAP.executive
  return CONTEXT_MAP.general
}

// ---------------------------------------------------------------------------
// Status dot colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<Agent['status'], string> = {
  active: 'bg-emerald-400',
  busy: 'bg-amber-400',
  idle: 'bg-zinc-500'
}

// ---------------------------------------------------------------------------
// Mock agent responses
// ---------------------------------------------------------------------------

const MOCK_RESPONSES = [
  "I'm analyzing your current data now. Give me a moment...",
  "Based on the latest metrics, I'd recommend we focus on the top 3 performing channels.",
  "I've identified 4 action items that need your attention today.",
  "Running that report now. It should be ready in about 30 seconds.",
  "Great question! Let me pull up the relevant data for you.",
  "I've already started working on that. Here's what I have so far...",
  "I'll coordinate with the other agents to get this done faster.",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentHub() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [context, setContext] = useState<ContextGroup>(() => resolveContext(pathname))

  // Voice input
  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setInputValue(text)
    // Auto-send after a short delay so the user sees the transcript
    setTimeout(() => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, userMsg])
      setInputValue('')
      // Mock agent response
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, agentMsg])
      }, 800 + Math.random() * 1200)
    }, 300)
  }, [])

  const { state: voiceState, startListening, stopListening } = useVoice(handleVoiceTranscript)

  // Update context when pathname changes
  useEffect(() => {
    setContext(resolveContext(pathname))
    setSelectedAgent(null)
    setMessages([])
  }, [pathname])

  // Clear unread when panel opens
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    setMessages([
      {
        id: 'welcome',
        sender: 'agent',
        text: `Hi, I'm ${agent.name}. ${agent.role}. How can I help you today?`,
        timestamp: new Date()
      },
    ])
  }, [])

  const handleBack = useCallback(() => {
    setSelectedAgent(null)
    setMessages([])
  }, [])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !selectedAgent) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')

    // Mock agent response after a short delay
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, agentMsg])
    }, 800 + Math.random() * 1200)
  }, [inputValue, selectedAgent])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Floating trigger button                                           */}
      {/* ----------------------------------------------------------------- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Open AI Agent Hub"
        >
          <Bot className="h-6 w-6" />

          {/* Pulse ring */}
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-25" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Expanded panel                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex w-[400px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all duration-300 ${
          isOpen ? 'h-[500px] translate-y-0 opacity-100' : 'pointer-events-none h-0 translate-y-8 opacity-0'
        }`}
      >
        {/* ----- Header ----- */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {selectedAgent ? (
              <>
                <button
                  onClick={handleBack}
                  className="mr-1 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label="Back to agent list"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                  {selectedAgent.icon}
                </div>
                <span className="text-sm font-semibold text-white">{selectedAgent.name}</span>
                <span className={`ml-1 h-2 w-2 rounded-full ${STATUS_COLORS[selectedAgent.status]}`} />
              </>
            ) : (
              <>
                <Bot className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-semibold text-white">AI Agents</span>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">
                  {context.label}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              setSelectedAgent(null)
              setMessages([])
            }}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ----- Body ----- */}
        {selectedAgent ? (
          /* ---- Chat view ---- */
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedAgent.name}...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                />
                <button
                  onClick={() => {
                    if (voiceState === 'listening') {
                      stopListening()
                    } else {
                      startListening()
                    }
                  }}
                  className={`rounded-lg p-1.5 transition-colors ${
                    voiceState === 'listening'
                      ? 'bg-red-600 text-white animate-pulse'
                      : voiceState === 'thinking'
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                  aria-label={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}
                >
                  {voiceState === 'thinking' ? (
                    <LoadingGlobe size="sm" />
                  ) : voiceState === 'listening' ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="rounded-lg bg-blue-600 p-1.5 text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ---- Agent list view ---- */
          <>
            <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
              {context.agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-800"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition-colors group-hover:bg-blue-600/20 group-hover:text-blue-400">
                    {agent.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{agent.name}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[agent.status]}`} />
                    </div>
                    <p className="truncate text-xs text-zinc-500">{agent.role}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                </button>
              ))}
            </div>

            {/* View all link */}
            <div className="border-t border-zinc-800 px-4 py-2">
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-zinc-800 hover:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                View All Agents
              </button>
            </div>
          </>
        )}

        {/* ----- Footer ----- */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          <span className="text-[10px] text-zinc-600">Powered by Memelli AI</span>
          <a
            href="/dashboard/ai"
            className="text-[10px] font-medium text-blue-500 transition-colors hover:text-blue-400"
          >
            Full AI Assistant
          </a>
        </div>
      </div>
    </>
  )
}

export default AgentHub
