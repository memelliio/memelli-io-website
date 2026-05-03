'use client';

import { memo } from 'react';
import { Camera, File, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
}

interface MUAAttachmentsProps {
  screenshot: string | null;
  files: UploadedFile[];
  onRemoveScreenshot: () => void;
  onRemoveFile: (id: string) => void;
}

function MUAAttachments({ screenshot, files, onRemoveScreenshot, onRemoveFile }: MUAAttachmentsProps) {
  if (!screenshot && !files.length) return null;

  return (
    <div className="border-t border-white/[0.04] px-4 py-2 flex flex-wrap gap-1.5 animate-[mua-fade_0.2s_ease-out]">
      {screenshot && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/8 border border-red-500/20 px-2.5 py-1 text-[11px] text-red-300">
          <Camera className="h-3 w-3" /> Screenshot
          <button onClick={onRemoveScreenshot} className="ml-0.5 hover:text-white transition-colors"><X className="h-3 w-3" /></button>
        </span>
      )}
      {files.map(f => (
        <span key={f.id} className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-[11px] text-zinc-300">
          <File className="h-3 w-3" /> <span className="max-w-[60px] truncate">{f.name}</span>
          <button onClick={() => onRemoveFile(f.id)} className="ml-0.5 hover:text-white transition-colors"><X className="h-3 w-3" /></button>
        </span>
      ))}
    </div>
  );
}

export default memo(MUAAttachments);
