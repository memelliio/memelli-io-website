"use client";

import { useState } from "react";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Plus,
  Filter,
  Tag,
  CircleAlert,
  CircleCheck,
  Truck,
} from "lucide-react";
import {
  EditorialShell,
  BrandHeader,
  EditorialHero,
  Section,
  PrimaryPill,
  OutlinePill,
  StatusChip,
  Stat,
  Index,
  Eyebrow,
} from "../_skin/Editorial";
import { RED, INK, MUTED, LINE, LINE_SOFT, PAPER, SOFT, GREEN, AMBER } from "../_skin/tokens";

const KPIS = [
  { label: "Revenue · 30d", value: "$84,210", delta: "+18%", tone: "ok" as const },
  { label: "Orders · 30d", value: "412", delta: "+9%", tone: "ok" as const },
  { label: "AOV", value: "$204", delta: "+3%", tone: "ok" as const },
  { label: "Refunds", value: "1.4%", delta: "-0.3%", tone: "muted" as const },
];

const PRODUCTS = [
  { name: "Memelli Editorial Tee", sku: "TEE-001", price: "$38", stock: 124, status: "Active", tone: "ok" as const },
  { name: "Funding Toolkit (PDF)", sku: "PDF-FND", price: "$49", stock: "∞", status: "Active", tone: "ok" as const },
  { name: "Brand Card Pack", sku: "PACK-BR", price: "$22", stock: 8, status: "Low stock", tone: "warn" as const },
  { name: "OS Sticker Set", sku: "STK-OS", price: "$12", stock: 0, status: "Out of stock", tone: "bad" as const },
  { name: "Trifold Brochure", sku: "TRI-001", price: "$8", stock: 220, status: "Active", tone: "ok" as const },
  { name: "Repair Letter Template", sku: "PDF-RP", price: "$29", stock: "∞", status: "Active", tone: "ok" as const },
];

const ORDERS = [
  { id: "MEM-3412", customer: "Maria Santos", items: 3, total: "$118", status: "Paid", tone: "ok" as const, when: "12m" },
  { id: "MEM-3411", customer: "Brian Cole", items: 1, total: "$49", status: "Fulfilled", tone: "ok" as const, when: "42m" },
  { id: "MEM-3410", customer: "Aisha Patel", items: 2, total: "$60", status: "Paid", tone: "ok" as const, when: "1h" },
  { id: "MEM-3409", customer: "Diego Ramirez", items: 4, total: "$142", status: "Shipped", tone: "info" as const, when: "3h" },
  { id: "MEM-3408", customer: "Olivia Brooks", items: 2, total: "$84", status: "Refund req", tone: "bad" as const, when: "5h" },
  { id: "MEM-3407", customer: "Noah Reed", items: 1, total: "$22", status: "Pending", tone: "warn" as const, when: "8h" },
];

const COLLECTIONS = [
  { name: "Editorial Set", products: 6, revenue: "$22,180" },
  { name: "Funding & Credit", products: 4, revenue: "$31,480" },
  { name: "Brand & Print", products: 8, revenue: "$11,920" },
  { name: "Digital Templates", products: 3, revenue: "$18,630" },
];

export function Ecommerce() {
  const [tab, setTab] = useState<"products" | "orders" | "collections">(
    "products",
  );

  return (
    <EditorialShell>
      <BrandHeader
        app="Storefront"
        right={
          <>
            <OutlinePill>
              <Filter size={12} strokeWidth={2.2} /> Filter
            </OutlinePill>
            <PrimaryPill>
              <Plus size={12} strokeWidth={2.4} /> New product
            </PrimaryPill>
          </>
        }
      />

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 24px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <EditorialHero
          eyebrow="Storefront"
          title={
            <>
              Sell anything, ship anywhere — <span style={{ color: RED }}>one shop.</span>
            </>
          }
          redLabel="Live"
          grayLabel="Storefront"
          inkLeft="Ecommerce"
          inkRight={`${PRODUCTS.length} products`}
          meta={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                gap: "4px 14px",
              }}
            >
              <Stat label="Today" value="$3,840" />
              <Stat label="MTD" value="$84,210" accent />
            </div>
          }
        />

        {/* KPI strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${KPIS.length}, 1fr)`,
            gap: 10,
          }}
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              style={{
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: 12,
                padding: 14,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                }}
              >
                <Index i={i + 1} total={KPIS.length} />
              </div>
              <Eyebrow>{k.label}</Eyebrow>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: "-0.02em",
                  marginTop: 2,
                }}
              >
                {k.value}
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  color:
                    k.tone === "ok"
                      ? GREEN
                      : k.tone === "muted"
                        ? MUTED
                        : RED,
                }}
              >
                {k.delta}
              </span>
            </div>
          ))}
        </div>

        {/* Tab pills */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: PAPER,
            border: `1px solid ${LINE}`,
            borderRadius: 9999,
            padding: 4,
            alignSelf: "flex-start",
          }}
        >
          {(["products", "orders", "collections"] as const).map((id) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 9999,
                  border: 0,
                  background: active
                    ? `linear-gradient(135deg, ${RED}, #A8182F)`
                    : "transparent",
                  color: active ? PAPER : MUTED,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {id}
              </button>
            );
          })}
        </div>

        {tab === "products" && (
          <Section
            eyebrow="Products"
            title="Catalog"
            icon={<Package size={11} />}
          >
            <div
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 100px 80px 80px 110px 36px",
                  background: INK,
                  color: PAPER,
                }}
              >
                <div style={th}>#</div>
                <div style={th}>Product</div>
                <div style={th}>SKU</div>
                <div style={th}>Price</div>
                <div style={th}>Stock</div>
                <div style={th}>Status</div>
                <div style={th}></div>
              </div>
              {PRODUCTS.map((p, i) => (
                <div
                  key={p.sku}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 100px 80px 80px 110px 36px",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderTop: i ? `1px solid ${LINE_SOFT}` : 0,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = SOFT)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = PAPER)
                  }
                >
                  <Index i={i + 1} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "rgba(196,30,58,0.08)",
                        color: RED,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Tag size={12} strokeWidth={2.2} />
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      fontFamily: "ui-monospace, monospace",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {p.sku}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.price}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        p.tone === "ok"
                          ? INK
                          : p.tone === "warn"
                            ? AMBER
                            : RED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.stock}
                  </span>
                  <StatusChip tone={p.tone}>
                    {p.tone === "ok" && <CircleCheck size={10} strokeWidth={2.4} />}
                    {p.tone === "warn" && <CircleAlert size={10} strokeWidth={2.4} />}
                    {p.tone === "bad" && <CircleAlert size={10} strokeWidth={2.4} />}
                    {p.status}
                  </StatusChip>
                  <ArrowUpRight size={13} strokeWidth={2.2} color={MUTED} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "orders" && (
          <Section
            eyebrow="Orders"
            title="Recent Orders"
            icon={<ShoppingBag size={11} />}
            accent
          >
            <div
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 110px 1fr 60px 90px 110px 70px",
                  background: INK,
                  color: PAPER,
                }}
              >
                <div style={th}>#</div>
                <div style={th}>Order</div>
                <div style={th}>Customer</div>
                <div style={th}>Items</div>
                <div style={th}>Total</div>
                <div style={th}>Status</div>
                <div style={th}>When</div>
              </div>
              {ORDERS.map((o, i) => (
                <div
                  key={o.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 110px 1fr 60px 90px 110px 70px",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderTop: i ? `1px solid ${LINE_SOFT}` : 0,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = SOFT)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = PAPER)
                  }
                >
                  <Index i={i + 1} />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      color: INK,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {o.id}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: INK,
                    }}
                  >
                    {o.customer}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: MUTED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {o.items}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {o.total}
                  </span>
                  <StatusChip tone={o.tone}>
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
                      <CircleAlert size={10} strokeWidth={2.4} />
                    )}
                    {o.status === "Fulfilled" && (
                      <CircleCheck size={10} strokeWidth={2.4} />
                    )}
                    {o.status}
                  </StatusChip>
                  <span
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {o.when}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "collections" && (
          <Section
            eyebrow="Collections"
            title="Storefront Collections"
            icon={<TrendingUp size={11} />}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {COLLECTIONS.map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    background: PAPER,
                    border: `1px solid ${LINE}`,
                    borderRadius: 12,
                    padding: 14,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                    }}
                  >
                    <Index i={i + 1} total={COLLECTIONS.length} />
                  </div>
                  <Eyebrow>Collection</Eyebrow>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 6,
                      borderTop: `1px solid ${LINE_SOFT}`,
                      marginTop: 4,
                    }}
                  >
                    <Stat label="Products" value={c.products} />
                    <Stat label="Revenue" value={c.revenue} accent />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section
          eyebrow="Today"
          title="Cash & Fulfillment"
          icon={<DollarSign size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {[
              { label: "Net cash", value: "$3,840", tone: "ok" as const },
              { label: "Refunds today", value: "$112", tone: "warn" as const },
              { label: "To ship", value: "9 orders", tone: "info" as const },
              { label: "Awaiting payment", value: "2 orders", tone: "warn" as const },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  background: PAPER,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", top: 8, right: 10 }}>
                  <Index i={i + 1} total={4} />
                </div>
                <Eyebrow accent={s.tone === "warn"}>{s.label}</Eyebrow>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: INK,
                    letterSpacing: "-0.01em",
                    marginTop: 2,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </EditorialShell>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 9.5,
  letterSpacing: "0.18em",
  fontWeight: 700,
  textTransform: "uppercase",
};
