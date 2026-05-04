"use client";

import { useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Receipt,
  Repeat,
  Tag,
  Gavel,
  HandCoins,
  Sparkles,
  Store,
  Settings as Cog,
  BarChart3,
  Truck,
  CircleAlert,
  CircleCheck,
  Clock,
  RefreshCw,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Plug,
  ArrowUpRight,
} from "lucide-react";
import {
  TerminalShell,
  TerminalHeader,
  TerminalTabs,
  TerminalSection,
  TerminalKpi,
  TerminalChip,
  TerminalIndex,
  TerminalButton,
  TerminalTable,
  TerminalThead,
  TerminalTh,
  TerminalTr,
  TerminalTd,
  TFG,
  TFG_DIM,
  TFG_FAINT,
  TLINE,
  TINK_3,
  TGREEN,
  TAMBER,
  TINFO,
  TMONO,
} from "../_skin/Terminal";
import { RED } from "../_skin/tokens";

const NAV = [
  { id: "ops", label: "Ops", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "subs", label: "Subs", icon: Repeat },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "auctions", label: "Auctions", icon: Gavel },
  { id: "affiliates", label: "Affiliates", icon: HandCoins },
  { id: "apparel", label: "Apparel", icon: Sparkles },
  { id: "stores", label: "Stores", icon: Store },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Cog },
] as const;

type Tab = (typeof NAV)[number]["id"];

const KPIS = [
  { label: "Net cash · today", value: "$3,840", delta: "+18% vs yest", tone: "ok" as const },
  { label: "Orders · today", value: "47", delta: "+9 vs yest", tone: "ok" as const },
  { label: "Awaiting fulfillment", value: "9", delta: "Oldest 3h", tone: "warn" as const },
  { label: "Refund queue", value: "2", delta: "$184 total", tone: "bad" as const },
  { label: "Failed payments", value: "1", delta: "$49 retry", tone: "warn" as const },
  { label: "Low stock", value: "4", delta: "Reorder", tone: "warn" as const },
];

const ACTION_QUEUE = [
  { kind: "ship", count: 9, label: "Orders to ship", tone: "warn" as const, age: "Oldest 3h" },
  { kind: "refund", count: 2, label: "Refunds to approve", tone: "bad" as const, age: "$184" },
  { kind: "reorder", count: 4, label: "SKUs to reorder", tone: "warn" as const, age: "Below threshold" },
  { kind: "retry", count: 1, label: "Failed payments", tone: "warn" as const, age: "$49" },
  { kind: "review", count: 3, label: "Reviews", tone: "info" as const, age: "Pending" },
  { kind: "subs", count: 2, label: "Subs past-due", tone: "bad" as const, age: "Cancel risk" },
];

const ORDER_PIPELINE = [
  { id: "pay", label: "Pending", count: 2, tone: "warn" as const },
  { id: "paid", label: "Paid", count: 14, tone: "ok" as const },
  { id: "ful", label: "Fulfilling", count: 9, tone: "warn" as const },
  { id: "ship", label: "Shipped", count: 28, tone: "info" as const },
  { id: "del", label: "Delivered", count: 612, tone: "ok" as const },
  { id: "rfd", label: "Refunded", count: 9, tone: "bad" as const },
];

const RECENT_ORDERS = [
  { id: "MEM-3412", customer: "Maria Santos", items: 3, total: "$118", status: "Fulfilling", tone: "warn" as const, when: "12m" },
  { id: "MEM-3411", customer: "Brian Cole", items: 1, total: "$49", status: "Paid", tone: "ok" as const, when: "42m" },
  { id: "MEM-3410", customer: "Aisha Patel", items: 2, total: "$60", status: "Shipped", tone: "info" as const, when: "1h" },
  { id: "MEM-3409", customer: "Diego Ramirez", items: 4, total: "$142", status: "Refund req", tone: "bad" as const, when: "3h" },
  { id: "MEM-3408", customer: "Olivia Brooks", items: 2, total: "$84", status: "Pending", tone: "warn" as const, when: "5h" },
];

const LOW_STOCK = [
  { sku: "STK-OS", name: "OS Sticker Set", on_hand: 0, threshold: 25, last_sold: "2h" },
  { sku: "PACK-BR", name: "Brand Card Pack", on_hand: 8, threshold: 24, last_sold: "12h" },
  { sku: "TEE-001", name: "Editorial Tee · M", on_hand: 6, threshold: 20, last_sold: "1d" },
  { sku: "CARD-FN", name: "Funding Card · Gold", on_hand: 14, threshold: 30, last_sold: "3h" },
];

const PAYMENTS = [
  { gateway: "Stripe", amount: "$118", method: "Visa •• 4242", status: "Captured", tone: "ok" as const, when: "12m" },
  { gateway: "Stripe", amount: "$49", method: "Mastercard •• 7211", status: "Failed", tone: "bad" as const, when: "1h" },
  { gateway: "Zelle", amount: "$1,200", method: "Direct deposit", status: "Pending reconcile", tone: "warn" as const, when: "2h" },
  { gateway: "Stripe", amount: "$84", method: "Apple Pay", status: "Refund req", tone: "bad" as const, when: "3h" },
];

const SUBSCRIPTIONS = {
  active: 412, trialing: 38, pastDue: 2, cancelled: 71, mrr: "$92,400", churn: "1.4%",
};

const COUPONS = [
  { code: "MEM10", desc: "10% off everything", uses: 412, cap: 1000, tone: "ok" as const },
  { code: "FUND-FREE", desc: "Free funding toolkit", uses: 88, cap: 250, tone: "ok" as const },
  { code: "MARCH-SPR", desc: "$25 off >$100", uses: 0, cap: 500, tone: "info" as const },
];

const INTEGRATIONS = [
  { name: "Stripe", status: "Connected", tone: "ok" as const, note: "412 charges 30d" },
  { name: "Shippo", status: "Connected", tone: "ok" as const, note: "28 labels 30d" },
  { name: "Klaviyo", status: "Degraded", tone: "warn" as const, note: "99% delivery" },
  { name: "TaxJar", status: "Connected", tone: "ok" as const, note: "8 jurisdictions" },
  { name: "Zelle Webhook", status: "Manual", tone: "warn" as const, note: "12 pending" },
];

export function CommerceAdmin() {
  const [tab, setTab] = useState<Tab>("ops");

  return (
    <TerminalShell>
      <TerminalHeader
        title="Commerce · Admin Console"
        subtitle="memelli-commerce-service"
        right={
          <>
            <TerminalButton variant="ghost" size="sm">
              <Search size={11} strokeWidth={2.2} /> Search
            </TerminalButton>
            <TerminalButton variant="ghost" size="sm">
              <Filter size={11} strokeWidth={2.2} /> Filter
            </TerminalButton>
            <TerminalButton variant="primary" size="sm">
              <Plus size={11} strokeWidth={2.4} /> New
            </TerminalButton>
          </>
        }
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 16px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <TerminalTabs<Tab> tabs={NAV as never} active={tab} onChange={setTab} />

        {tab === "ops" && <OpsView />}
        {tab === "orders" && <OrdersView />}
        {tab === "products" && (
          <TerminalSection title="catalog" hint="GET /api/commerce/products">
            <Empty desc="Catalog grid · variants · pricing tiers · SEO · supplier sync." />
          </TerminalSection>
        )}
        {tab === "customers" && (
          <TerminalSection title="customers" hint="GET /api/commerce/customers">
            <Empty desc="LTV cohorts · last-order · top spenders · email opt-in · churned." />
          </TerminalSection>
        )}
        {tab === "payments" && <PaymentsView />}
        {tab === "invoices" && (
          <TerminalSection title="invoices" hint="GET /api/commerce/invoices">
            <Empty desc="Issued / paid / overdue · auto-collection rules · attached PDFs." />
          </TerminalSection>
        )}
        {tab === "subs" && <SubsView />}
        {tab === "coupons" && <CouponsView />}
        {tab === "auctions" && (
          <TerminalSection title="auctions" hint="GET /api/commerce/auctions">
            <Empty desc="Active lots · bid stream · reserve hits · payout queue." />
          </TerminalSection>
        )}
        {tab === "affiliates" && (
          <TerminalSection title="affiliates" hint="GET /api/commerce/affiliates">
            <Empty desc="Partner links · conversions · payout cycles · tax W-9 status." />
          </TerminalSection>
        )}
        {tab === "apparel" && (
          <TerminalSection title="apparel-studio" hint="POD pipeline">
            <Empty desc="Print-on-demand: design queue · supplier sync · variants · samples." />
          </TerminalSection>
        )}
        {tab === "stores" && (
          <TerminalSection title="stores" hint="multi-store control">
            <Empty desc="Storefront list · per-store theme · domain mapping · catalog scope." />
          </TerminalSection>
        )}
        {tab === "ai" && (
          <TerminalSection title="ai-agent" hint="commerce AI">
            <Empty desc="Auto-reply chat · abandoned-cart · low-stock reorder agent · fraud review." />
          </TerminalSection>
        )}
        {tab === "settings" && (
          <TerminalSection title="settings" hint="commerce config">
            <Empty desc="Tax zones · shipping · currencies · checkout fields · fraud rules." />
          </TerminalSection>
        )}

        <IntegrationsRow />
      </div>
    </TerminalShell>
  );
}

// ── OPS ─────────────────────────────────────────────────────────

function OpsView() {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${KPIS.length}, 1fr)`,
          gap: 8,
        }}
      >
        {KPIS.map((k, i) => (
          <TerminalKpi
            key={k.label}
            index={i + 1}
            total={KPIS.length}
            label={k.label}
            value={k.value}
            delta={k.delta}
            tone={k.tone}
          />
        ))}
      </div>

      <TerminalSection
        title="action-queue"
        hint="today's must-do"
        accent
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {ACTION_QUEUE.map((a, i) => (
            <ActionTile
              key={a.kind}
              index={i + 1}
              total={ACTION_QUEUE.length}
              {...a}
            />
          ))}
        </div>
      </TerminalSection>

      <TerminalSection title="pipeline" hint="orders · status">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${ORDER_PIPELINE.length}, 1fr)`,
            gap: 6,
          }}
        >
          {ORDER_PIPELINE.map((s, i) => (
            <div
              key={s.id}
              style={{
                background: TINK_3,
                border: `1px solid ${TLINE}`,
                borderRadius: 6,
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <TerminalIndex i={i + 1} total={ORDER_PIPELINE.length} />
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 9999,
                    background:
                      s.tone === "ok"
                        ? TGREEN
                        : s.tone === "bad"
                          ? RED
                          : s.tone === "warn"
                            ? TAMBER
                            : TINFO,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: TFG_DIM,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: TFG,
                  fontFamily: TMONO,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.count}
              </div>
            </div>
          ))}
        </div>
      </TerminalSection>

      <TerminalSection title="recent-orders" hint="last 5">
        <OrdersTable />
      </TerminalSection>

      <TerminalSection
        title="inventory"
        hint="low-stock alerts"
        accent
      >
        <LowStockTable />
      </TerminalSection>

      <TerminalSection title="subscriptions" hint="recurring health">
        <SubsKpis />
      </TerminalSection>
    </>
  );
}

function OrdersView() {
  return (
    <TerminalSection title="orders" hint="GET /api/commerce/orders">
      <OrdersTable />
    </TerminalSection>
  );
}

function OrdersTable() {
  return (
    <TerminalTable cols="44px 110px 1fr 60px 90px 110px 70px 36px">
      <TerminalThead>
        <TerminalTh>#</TerminalTh>
        <TerminalTh>Order</TerminalTh>
        <TerminalTh>Customer</TerminalTh>
        <TerminalTh>Items</TerminalTh>
        <TerminalTh>Total</TerminalTh>
        <TerminalTh>Status</TerminalTh>
        <TerminalTh>When</TerminalTh>
        <TerminalTh></TerminalTh>
      </TerminalThead>
      {RECENT_ORDERS.map((o, i) => (
        <TerminalTr
          key={o.id}
          rail={
            o.tone === "bad" ? RED : o.tone === "warn" ? TAMBER : undefined
          }
        >
          <TerminalTd mono color={TFG_FAINT}>
            {String(i + 1).padStart(2, "0")}
          </TerminalTd>
          <TerminalTd mono bold>
            {o.id}
          </TerminalTd>
          <TerminalTd bold>{o.customer}</TerminalTd>
          <TerminalTd mono color={TFG_DIM}>
            {o.items}
          </TerminalTd>
          <TerminalTd mono bold>
            {o.total}
          </TerminalTd>
          <TerminalTd>
            <TerminalChip tone={o.tone}>
              {o.status === "Shipped" && (
                <Truck size={10} strokeWidth={2.4} />
              )}
              {o.status === "Paid" && (
                <CircleCheck size={10} strokeWidth={2.4} />
              )}
              {o.status === "Refund req" && (
                <CircleAlert size={10} strokeWidth={2.4} />
              )}
              {o.status === "Pending" && (
                <Clock size={10} strokeWidth={2.4} />
              )}
              {o.status === "Fulfilling" && (
                <RefreshCw size={10} strokeWidth={2.4} />
              )}
              {o.status}
            </TerminalChip>
          </TerminalTd>
          <TerminalTd mono color={TFG_DIM}>
            {o.when}
          </TerminalTd>
          <TerminalTd>
            <ArrowUpRight size={12} strokeWidth={2.2} color={TFG_DIM} />
          </TerminalTd>
        </TerminalTr>
      ))}
    </TerminalTable>
  );
}

function PaymentsView() {
  return (
    <TerminalSection title="payments" hint="gateway activity">
      <TerminalTable cols="44px 80px 100px 1fr 130px 80px 36px">
        <TerminalThead>
          <TerminalTh>#</TerminalTh>
          <TerminalTh>Gateway</TerminalTh>
          <TerminalTh>Amount</TerminalTh>
          <TerminalTh>Method</TerminalTh>
          <TerminalTh>Status</TerminalTh>
          <TerminalTh>When</TerminalTh>
          <TerminalTh></TerminalTh>
        </TerminalThead>
        {PAYMENTS.map((p, i) => (
          <TerminalTr key={`${p.gateway}-${i}`}>
            <TerminalTd mono color={TFG_FAINT}>
              {String(i + 1).padStart(2, "0")}
            </TerminalTd>
            <TerminalTd bold>{p.gateway}</TerminalTd>
            <TerminalTd mono bold>
              {p.amount}
            </TerminalTd>
            <TerminalTd mono color={TFG_DIM}>
              {p.method}
            </TerminalTd>
            <TerminalTd>
              <TerminalChip tone={p.tone}>{p.status}</TerminalChip>
            </TerminalTd>
            <TerminalTd mono color={TFG_DIM}>
              {p.when}
            </TerminalTd>
            <TerminalTd>
              <ArrowUpRight size={12} strokeWidth={2.2} color={TFG_DIM} />
            </TerminalTd>
          </TerminalTr>
        ))}
      </TerminalTable>
    </TerminalSection>
  );
}

function SubsView() {
  return (
    <TerminalSection title="subscriptions" hint="recurring revenue">
      <SubsKpis />
    </TerminalSection>
  );
}

function SubsKpis() {
  const cells = [
    { label: "Active", value: SUBSCRIPTIONS.active, tone: "ok" as const },
    { label: "Trialing", value: SUBSCRIPTIONS.trialing, tone: "info" as const },
    { label: "Past-due", value: SUBSCRIPTIONS.pastDue, tone: "bad" as const },
    { label: "Cancelled · 30d", value: SUBSCRIPTIONS.cancelled, tone: "muted" as const },
    { label: "MRR", value: SUBSCRIPTIONS.mrr, tone: "ok" as const },
    { label: "Churn · 30d", value: SUBSCRIPTIONS.churn, tone: "warn" as const },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 8,
      }}
    >
      {cells.map((c, i) => (
        <TerminalKpi
          key={c.label}
          index={i + 1}
          total={cells.length}
          label={c.label}
          value={c.value}
          tone={c.tone}
        />
      ))}
    </div>
  );
}

function CouponsView() {
  return (
    <TerminalSection title="coupons" hint="active codes">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 8,
        }}
      >
        {COUPONS.map((c, i) => (
          <div
            key={c.code}
            style={{
              background: TINK_3,
              border: `1px solid ${TLINE}`,
              borderRadius: 6,
              padding: 12,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 8,
              }}
            >
              <TerminalIndex i={i + 1} total={COUPONS.length} />
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: TFG_FAINT,
                marginBottom: 4,
              }}
            >
              Code
            </div>
            <div
              style={{
                fontSize: 14,
                fontFamily: TMONO,
                fontWeight: 800,
                color: TFG,
                letterSpacing: "0.04em",
              }}
            >
              {c.code}
            </div>
            <div
              style={{
                fontSize: 11,
                color: TFG_DIM,
                marginTop: 2,
              }}
            >
              {c.desc}
            </div>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${TLINE}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: TFG_DIM,
                  fontFamily: TMONO,
                }}
              >
                {c.uses} / {c.cap}
              </span>
              <TerminalChip tone={c.tone}>Active</TerminalChip>
            </div>
          </div>
        ))}
      </div>
    </TerminalSection>
  );
}

function ActionTile({
  label,
  count,
  tone,
  age,
  index,
  total,
}: {
  kind: string;
  label: string;
  count: number;
  tone: "ok" | "warn" | "bad" | "info";
  age: string;
  index: number;
  total: number;
}) {
  const fg =
    tone === "bad"
      ? RED
      : tone === "warn"
        ? TAMBER
        : tone === "info"
          ? TINFO
          : TGREEN;
  return (
    <div
      style={{
        background: TINK_3,
        border: `1px solid ${TLINE}`,
        borderRadius: 6,
        padding: 12,
        position: "relative",
        boxShadow: `inset 3px 0 0 ${fg}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 8,
        }}
      >
        <TerminalIndex i={index} total={total} />
      </div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: TFG_FAINT,
        }}
      >
        {age}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: fg,
            fontFamily: TMONO,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TFG,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <TerminalChip tone={tone}>Open queue →</TerminalChip>
      </div>
    </div>
  );
}

function LowStockTable() {
  return (
    <TerminalTable cols="44px 100px 1fr 70px 90px 90px 110px">
      <TerminalThead>
        <TerminalTh>#</TerminalTh>
        <TerminalTh>SKU</TerminalTh>
        <TerminalTh>Product</TerminalTh>
        <TerminalTh>On hand</TerminalTh>
        <TerminalTh>Threshold</TerminalTh>
        <TerminalTh>Last sold</TerminalTh>
        <TerminalTh></TerminalTh>
      </TerminalThead>
      {LOW_STOCK.map((s, i) => {
        const out = s.on_hand === 0;
        return (
          <TerminalTr key={s.sku} rail={out ? RED : TAMBER}>
            <TerminalTd mono color={TFG_FAINT}>
              {String(i + 1).padStart(2, "0")}
            </TerminalTd>
            <TerminalTd mono bold>
              {s.sku}
            </TerminalTd>
            <TerminalTd bold>{s.name}</TerminalTd>
            <TerminalTd mono bold color={out ? RED : TAMBER} align="left">
              {s.on_hand}
            </TerminalTd>
            <TerminalTd mono color={TFG_DIM}>
              {s.threshold}
            </TerminalTd>
            <TerminalTd mono color={TFG_DIM}>
              {s.last_sold}
            </TerminalTd>
            <TerminalTd>
              <TerminalButton variant="primary" size="sm">
                <RefreshCw size={11} strokeWidth={2.4} /> Reorder
              </TerminalButton>
            </TerminalTd>
          </TerminalTr>
        );
      })}
    </TerminalTable>
  );
}

function IntegrationsRow() {
  return (
    <TerminalSection title="integrations" hint="connected services">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
        }}
      >
        {INTEGRATIONS.map((it, i) => (
          <div
            key={it.name}
            style={{
              background: TINK_3,
              border: `1px solid ${TLINE}`,
              borderRadius: 6,
              padding: 10,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 8,
              }}
            >
              <TerminalIndex i={i + 1} total={INTEGRATIONS.length} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plug size={12} strokeWidth={2.2} color={TFG_DIM} />
              <span
                style={{ fontSize: 12.5, fontWeight: 700, color: TFG }}
              >
                {it.name}
              </span>
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: TFG_FAINT,
                marginTop: 4,
                fontFamily: TMONO,
              }}
            >
              {it.note}
            </div>
            <div style={{ marginTop: 6 }}>
              <TerminalChip tone={it.tone}>{it.status}</TerminalChip>
            </div>
          </div>
        ))}
      </div>
    </TerminalSection>
  );
}

function Empty({ desc }: { desc: string }) {
  return (
    <div
      style={{
        padding: "16px 4px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <AlertTriangle size={14} strokeWidth={2.2} color={TAMBER} />
      <span
        style={{
          fontSize: 11.5,
          color: TFG_DIM,
          letterSpacing: "0.02em",
        }}
      >
        {desc}
      </span>
    </div>
  );
}
