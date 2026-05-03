"use client";

import { Folder, FileText, ImageIcon, Music, Video, ChevronRight } from "lucide-react";
import { useState } from "react";

type Node =
  | { kind: "folder"; name: string; children: Node[] }
  | { kind: "file"; name: string; type: "doc" | "image" | "audio" | "video"; size: string };

const TREE: Node = {
  kind: "folder",
  name: "Home",
  children: [
    {
      kind: "folder",
      name: "Documents",
      children: [
        { kind: "file", name: "welcome.md", type: "doc", size: "2 KB" },
        { kind: "file", name: "memelli-brand.pdf", type: "doc", size: "418 KB" },
      ],
    },
    {
      kind: "folder",
      name: "Pictures",
      children: [
        { kind: "file", name: "screenshot-2026-05-01.png", type: "image", size: "1.2 MB" },
      ],
    },
    {
      kind: "folder",
      name: "Music",
      children: [{ kind: "file", name: "memelli-radio.mp3", type: "audio", size: "4.6 MB" }],
    },
    {
      kind: "folder",
      name: "Videos",
      children: [{ kind: "file", name: "tutorial.mp4", type: "video", size: "82 MB" }],
    },
    { kind: "file", name: "notes.txt", type: "doc", size: "812 B" },
  ],
};

const ICON: Record<string, typeof FileText> = {
  doc: FileText,
  image: ImageIcon,
  audio: Music,
  video: Video,
};

function Row({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  if (node.kind === "folder") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted text-left text-sm"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <ChevronRight
            size={13}
            className="text-ink/40 transition"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0)" }}
          />
          <Folder size={15} className="text-[hsl(var(--primary))]" />
          <span className="text-ink">{node.name}</span>
          <span className="ml-auto text-xs text-ink/50">{node.children.length} items</span>
        </button>
        {open && (
          <div>
            {node.children.map((c, i) => (
              <Row key={i} node={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  const Icon = ICON[node.type];
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted text-sm"
      style={{ paddingLeft: 12 + depth * 16 + 18 }}
    >
      <Icon size={14} className="text-ink/60" />
      <span className="text-ink">{node.name}</span>
      <span className="ml-auto text-xs text-ink/50">{node.size}</span>
    </div>
  );
}

export function Files() {
  return (
    <div className="h-full flex flex-col">
      <div
        className="px-4 py-2 border-b text-xs text-ink/60 flex items-center gap-3"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <span>Home</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <Row node={TREE} depth={0} />
      </div>
    </div>
  );
}
