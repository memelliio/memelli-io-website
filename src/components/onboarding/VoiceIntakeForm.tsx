// [LEGACY-COMMENTED 2026-05-01] Old voice-driven intake form (firstName,
// lastName, phone, email, smartCreditUsername, smartCreditPassword). The
// prequal flow now lives in the locked editorial design at
// apps/web/src/app/os/_apps/PreQual.tsx. Export shape kept so existing
// imports (homepage page.tsx, api/ai/dev-voice/route.ts) still compile.
// Original implementation is in git history.

interface VoiceIntakeFormProps {
  onComplete: () => void;
}

export function VoiceIntakeForm(_props: VoiceIntakeFormProps) {
  return null;
}
