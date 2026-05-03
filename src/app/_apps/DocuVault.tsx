"use client";

import { useState } from "react";
import {
  FileText,
  ImageIcon,
  Folder,
  Upload,
  Search,
  Lock,
  ShieldCheck,
  MoreVertical,
  Plus,
  FileSpreadsheet,
  FileSignature,
} from "lucide-react";
import {
  EditorialShell,
  BrandHeader,
  EditorialHero,
  Section,
  PrimaryPill,
  OutlinePill,
  StatusChip,
} from "../_skin/Editorial";
import { RED, INK, MUTED, LINE, LINE_SOFT, GRAY_MID, PAPER, SOFT } from "../_skin/tokens";

type DocKind = "id" | "ssn" | "bill" | "bank" | "letter" | "image" | "spreadsheet";

const FOLDERS = [
  { name: "Identity", count: 4, accent: RED },
  { name: "Disputes — Round 1", count: 12, accent: INK },
  { name: "Income & Bank", count: 7, accent: INK },
  { name: "Contracts", count: 3, accent: INK },
  { name: "Archived", count: 22, accent: GRAY_MID },
];

const DOCS: {
  name: string;
  kind: DocKind;
  size: string;
  added: string;
  encrypted?: boolean;
  tag?: string;
  folder: string;
}[] = [
  { name: "Drivers-License.pdf", kind: "id", size: "1.4 MB", added: "Mar 14", encrypted: true, tag: "ID", folder: "Identity" },
  { name: "SSN-Card.pdf", kind: "ssn", size: "812 KB", added: "Mar 14", encrypted: true, tag: "Sensitive", folder: "Identity" },
  { name: "Utility-Feb2026.pdf", kind: "bill", size: "640 KB", added: "Mar 12", folder: "Identity" },
  { name: "Bank-Stmt-Feb2026.pdf", kind: "bank", size: "1.1 MB", added: "Mar 11", folder: "Income & Bank" },
  { name: "Capital-One-Dispute.pdf", kind: "letter", size: "320 KB", added: "Mar 10", folder: "Disputes — Round 1" },
  { name: "Verizon-Dispute.pdf", kind: "letter", size: "298 KB", added: "Mar 10", folder: "Disputes — Round 1" },
  { name: "Synchrony-Dispute.pdf", kind: "letter", size: "412 KB", added: "Mar 09", folder: "Disputes — Round 1" },
  { name: "FTC-Identity-Theft.pdf", kind: "letter", size: "180 KB", added: "Mar 08", tag: "FTC", folder: "Disputes — Round 1" },
  { name: "Service-Agreement.pdf", kind: "letter", size: "224 KB", added: "Feb 28", folder: "Contracts" },
  { name: "Income-Verification.xlsx", kind: "spreadsheet", size: "92 KB", added: "Feb 22", folder: "Income & Bank" },
];

const KIND_ICON: Record<DocKind, typeof FileText> = {
  id: FileSignature,
  ssn: ShieldCheck,
  bill: FileText,
  bank: FileSpreadsheet,
  letter: FileText,
  image: ImageIcon,
  spreadsheet: FileSpreadsheet,
};

const KIND_TINT: Record<DocKind, string> = {
  id: "rgba(99,102,241,0.10)",
  ssn: "rgba(196,30,58,0.10)",
  bill: "rgba(15,17,21,0.06)",
  bank: "rgba(16,185,129,0.10)",
  letter: "rgba(245,158,11,0.10)",
  image: "rgba(99,102,241,0.10)",
  spreadsheet: "rgba(16,185,129,0.10)",
};

const KIND_FG: Record<DocKind, string> = {
  id: "#6366F1",
  ssn: RED,
  bill: INK,
  bank: "#10B981",
  letter: "#F59E0B",
  image: "#6366F1",
  spreadsheet: "#10B981",
};

export function DocuVault() {
  const [folder, setFolder] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = DOCS.filter((d) => {
    if (folder && d.folder !== folder) return false;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <EditorialShell>
      <BrandHeader
        app="DocuVault"
        right={
          <>
            <OutlinePill>
              <Search size={12} strokeWidth={2.2} />
              Search
            </OutlinePill>
            <PrimaryPill>
              <Upload size={12} strokeWidth={2.4} />
              Upload
            </PrimaryPill>
          </>
        }
      />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 24px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <EditorialHero
          eyebrow="DocuVault"
          title={
            <>
              Encrypted vault for every <span style={{ color: RED }}>file you ship.</span>
            </>
          }
          redLabel="Vault"
          grayLabel="Encrypted"
          inkLeft="Live"
          inkRight={`${DOCS.length} files`}
          meta={
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: MUTED,
                textTransform: "uppercase",
                textAlign: "right",
                lineHeight: 1.7,
              }}
            >
              <div>Storage</div>
              <div style={{ color: INK, fontWeight: 800 }}>3.2 GB / 10 GB</div>
            </div>
          }
        />

        <Section
          eyebrow="Folders"
          title="Vault Folders"
          icon={<Folder size={11} />}
          right={
            <OutlinePill>
              <Plus size={11} strokeWidth={2.4} />
              New folder
            </OutlinePill>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <FolderCard
              index={0}
              total={FOLDERS.length}
              name="All files"
              count={DOCS.length}
              accent={INK}
              active={folder === null}
              onClick={() => setFolder(null)}
            />
            {FOLDERS.map((f, i) => (
              <FolderCard
                key={f.name}
                index={i + 1}
                total={FOLDERS.length}
                name={f.name}
                count={f.count}
                accent={f.accent}
                active={folder === f.name}
                onClick={() => setFolder(f.name)}
              />
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Files"
          title={folder ? folder : "Recent Files"}
          icon={<FileText size={11} />}
          right={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              style={{
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${LINE}`,
                background: PAPER,
                color: INK,
                outline: "none",
                width: 160,
                fontFamily: "inherit",
              }}
            />
          }
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
                gridTemplateColumns: "44px auto 1fr 110px 90px 90px 36px",
                background: INK,
                color: PAPER,
              }}
            >
              <div style={th}>#</div>
              <div style={th}></div>
              <div style={th}>File</div>
              <div style={th}>Folder</div>
              <div style={th}>Size</div>
              <div style={th}>Added</div>
              <div style={th}></div>
            </div>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: MUTED,
                  fontSize: 12,
                  background: SOFT,
                }}
              >
                No files match.
              </div>
            ) : (
              filtered.map((d, i) => {
                const Icon = KIND_ICON[d.kind];
                return (
                  <div
                    key={d.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px auto 1fr 110px 90px 90px 36px",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderTop: i ? `1px solid ${LINE_SOFT}` : 0,
                      cursor: "pointer",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = SOFT)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = PAPER)
                    }
                  >
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        color: MUTED,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: KIND_TINT[d.kind],
                        color: KIND_FG[d.kind],
                        display: "grid",
                        placeItems: "center",
                        marginRight: 10,
                      }}
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: INK,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.name}
                        </span>
                        {d.encrypted && (
                          <Lock size={10} strokeWidth={2.4} color={RED} />
                        )}
                        {d.tag && (
                          <StatusChip
                            tone={d.tag === "Sensitive" ? "bad" : d.tag === "FTC" ? "warn" : "info"}
                          >
                            {d.tag}
                          </StatusChip>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                        fontWeight: 600,
                      }}
                    >
                      {d.folder}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {d.size}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {d.added}
                    </span>
                    <button
                      type="button"
                      aria-label="More"
                      style={{
                        background: "transparent",
                        border: 0,
                        color: MUTED,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <MoreVertical size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Section>

        <Section
          eyebrow="Upload"
          title="Drop a new file"
          icon={<Upload size={11} />}
          accent
        >
          <div
            style={{
              border: `1.5px dashed ${LINE}`,
              borderRadius: 14,
              padding: "28px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              background: SOFT,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: "rgba(196,30,58,0.08)",
                color: RED,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Upload size={20} strokeWidth={2.2} />
            </span>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: INK,
              }}
            >
              Drop file here or click to upload
            </div>
            <div
              style={{
                fontSize: 11,
                color: MUTED,
              }}
            >
              PDF, JPG, PNG — encrypted at rest, ≤25 MB per file
            </div>
            <PrimaryPill>
              <Upload size={12} strokeWidth={2.4} />
              Choose file
            </PrimaryPill>
          </div>
        </Section>
      </div>
    </EditorialShell>
  );
}

function FolderCard({
  index,
  total,
  name,
  count,
  accent,
  active,
  onClick,
}: {
  index: number;
  total: number;
  name: string;
  count: number;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(196,30,58,0.04)" : PAPER,
        border: `1px solid ${active ? RED : LINE}`,
        borderRadius: 12,
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "relative",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: "0.16em",
          color: active ? RED : MUTED,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: `${accent}1f`,
          color: accent,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Folder size={14} strokeWidth={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: MUTED,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {count} files
        </div>
      </div>
    </button>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 9.5,
  letterSpacing: "0.18em",
  fontWeight: 700,
  textTransform: "uppercase",
};
