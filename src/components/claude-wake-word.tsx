'use client';

/**
 * ClaudeWakeWord — disabled.
 * Voice is handled globally by GlobalMemelliOrb (Deepgram Aura 2 + SpeechRecognition).
 * This shell is kept for import compatibility.
 */

export interface ClaudeWakeWordProps {
  onWakeWord: () => void;
  onCommand: (text: string) => void;
  enabled: boolean;
  children?: React.ReactNode;
}

export default function ClaudeWakeWord({ children }: ClaudeWakeWordProps) {
  return <>{children}</>;
}
