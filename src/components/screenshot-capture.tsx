'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
} from 'react';
import { Camera, X, Image as ImageIcon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Hook: useScreenshotCapture                                               */
/*                                                                           */
/*  Returns screenshot state + handlers for paste and screen capture.        */
/*  Designed to integrate with jessica-provider's pendingScreenshot state.   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface UseScreenshotCaptureOptions {
  /** Max width to resize captured images (default 1280) */
  maxWidth?: number;
  /** JPEG quality 0-1 (default 0.7) */
  quality?: number;
  /** Whether the hook should listen for global paste events (default true) */
  listenForPaste?: boolean;
}

export interface UseScreenshotCaptureReturn {
  /** Base64 data URL of the captured screenshot, or null */
  screenshot: string | null;
  /** Whether a screen capture is currently in progress */
  isCapturing: boolean;
  /** Whether getDisplayMedia is supported in this browser */
  isDisplayCaptureSupported: boolean;
  /** Capture screen via getDisplayMedia (single frame) */
  captureScreen: () => Promise<void>;
  /** Clear the current screenshot */
  clearScreenshot: () => void;
  /** Handle a paste event — extract image from clipboard */
  handlePaste: (e: ClipboardEvent | ReactClipboardEvent) => void;
}

/**
 * Converts an image source (blob, video frame) to a compressed base64 data URL.
 */
function imageToDataUrl(
  source: HTMLVideoElement | HTMLImageElement,
  maxWidth: number,
  quality: number,
): string {
  const canvas = document.createElement('canvas');
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

  const scale = sw > maxWidth ? maxWidth / sw : 1;
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export function useScreenshotCapture(
  options: UseScreenshotCaptureOptions = {},
): UseScreenshotCaptureReturn {
  const { maxWidth = 1280, quality = 0.7, listenForPaste = true } = options;

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const isDisplayCaptureSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getDisplayMedia;

  /* ── Cleanup any lingering stream on unmount ── */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  /* ── Capture via getDisplayMedia ── */
  const captureScreen = useCallback(async () => {
    if (!isDisplayCaptureSupported) {
      console.warn('[ScreenshotCapture] getDisplayMedia not supported');
      return;
    }
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve();
        video.play();
      });

      // Small delay for the frame to render
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = imageToDataUrl(video, maxWidth, quality);
      setScreenshot(dataUrl);

      // Stop all tracks immediately — we only need one frame
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;
    } catch (err) {
      // User cancelled or permission denied — not an error
      if ((err as DOMException)?.name !== 'AbortError') {
        console.error('[ScreenshotCapture] capture failed:', err);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isDisplayCaptureSupported, maxWidth, quality]);

  /* ── Handle paste event — extract image from clipboard ── */
  const handlePaste = useCallback(
    (e: ClipboardEvent | ReactClipboardEvent) => {
      const clipboardData =
        'clipboardData' in e && e.clipboardData
          ? e.clipboardData
          : (e as ClipboardEvent).clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;

      const blob = imageItem.getAsFile();
      if (!blob) return;

      // Prevent the paste from inserting into text fields
      e.preventDefault();

      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const dataUrl = imageToDataUrl(img, maxWidth, quality);
          setScreenshot(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    },
    [maxWidth, quality],
  );

  /* ── Global paste listener ── */
  useEffect(() => {
    if (!listenForPaste) return;
    const handler = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [listenForPaste, handlePaste]);

  /* ── Clear ── */
  const clearScreenshot = useCallback(() => {
    setScreenshot(null);
  }, []);

  return {
    screenshot,
    isCapturing,
    isDisplayCaptureSupported,
    captureScreen,
    clearScreenshot,
    handlePaste,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ScreenshotPreview — thumbnail preview above chat input                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ScreenshotPreviewProps {
  screenshot: string | null;
  onRemove: () => void;
}

export function ScreenshotPreview({ screenshot, onRemove }: ScreenshotPreviewProps) {
  return (
    <AnimatePresence>
      {screenshot && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 px-4 py-2.5"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Thumbnail */}
          <div className="relative group shrink-0">
            <div
              className="w-16 h-12 rounded-lg overflow-hidden"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(24, 24, 27, 0.6)',
              }}
            >
              {screenshot.startsWith('data:image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={onRemove}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-90"
              style={{
                background: 'rgba(39, 39, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <X className="h-3 w-3 text-zinc-400" />
            </button>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-medium text-zinc-400 tracking-wide">
              Screenshot attached
            </span>
            <span className="text-[10px] text-zinc-600 truncate">
              Will be sent with your next message
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ScreenshotCaptureButton — camera button with capture menu                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ScreenshotCaptureButtonProps {
  onCapture: () => Promise<void>;
  isCapturing: boolean;
  isDisplayCaptureSupported: boolean;
  className?: string;
}

export function ScreenshotCaptureButton({
  onCapture,
  isCapturing,
  isDisplayCaptureSupported,
  className = '',
}: ScreenshotCaptureButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (isDisplayCaptureSupported) {
            onCapture();
          } else {
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 3000);
          }
        }}
        disabled={isCapturing}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
          isCapturing
            ? 'text-amber-400/80 bg-amber-500/10 animate-pulse'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'
        }`}
        title={
          isCapturing
            ? 'Capturing...'
            : isDisplayCaptureSupported
              ? 'Capture screen'
              : 'Paste a screenshot (Cmd+V)'
        }
      >
        {isCapturing ? (
          <Monitor className="h-3.5 w-3.5 animate-pulse" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Tooltip for paste fallback */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] text-zinc-300 pointer-events-none"
            style={{
              background: 'rgba(24, 24, 27, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            Take a screenshot, then paste here (Cmd+V)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ScreenshotCapture — all-in-one wrapper (preview + capture button)        */
/*                                                                           */
/*  Drop this into any chat interface. It manages its own state via the      */
/*  useScreenshotCapture hook, or accepts external state via props.          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ScreenshotCaptureProps {
  /** External screenshot state (if managed by parent, e.g. jessica-provider) */
  screenshot?: string | null;
  /** Called when a screenshot is captured — use to sync with parent state */
  onCapture?: (dataUrl: string) => void;
  /** Called when the screenshot is cleared */
  onClear?: () => void;
  /** Show the capture button (default true) */
  showButton?: boolean;
  /** Show the preview (default true) */
  showPreview?: boolean;
}

export default function ScreenshotCapture({
  screenshot: externalScreenshot,
  onCapture,
  onClear,
  showButton = true,
  showPreview = true,
}: ScreenshotCaptureProps) {
  const hook = useScreenshotCapture();

  // Use external screenshot if provided, otherwise internal
  const activeScreenshot = externalScreenshot !== undefined
    ? externalScreenshot
    : hook.screenshot;

  // Sync internal captures to parent callback
  useEffect(() => {
    if (hook.screenshot && onCapture) {
      onCapture(hook.screenshot);
    }
    // Only fire when internal screenshot changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hook.screenshot]);

  const handleClear = useCallback(() => {
    hook.clearScreenshot();
    onClear?.();
  }, [hook, onClear]);

  return (
    <>
      {showPreview && (
        <ScreenshotPreview
          screenshot={activeScreenshot}
          onRemove={handleClear}
        />
      )}
      {showButton && (
        <ScreenshotCaptureButton
          onCapture={hook.captureScreen}
          isCapturing={hook.isCapturing}
          isDisplayCaptureSupported={hook.isDisplayCaptureSupported}
        />
      )}
    </>
  );
}
