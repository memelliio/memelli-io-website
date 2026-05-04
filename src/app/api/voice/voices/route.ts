import { NextResponse } from "next/server";

const VOICES = [
  { id: "aura-2-aurora-en", name: "Aurora", gender: "female", accent: "American" },
  { id: "aura-2-asteria-en", name: "Asteria", gender: "female", accent: "American" },
  { id: "aura-2-luna-en", name: "Luna", gender: "female", accent: "American" },
  { id: "aura-2-stella-en", name: "Stella", gender: "female", accent: "American" },
  { id: "aura-2-athena-en", name: "Athena", gender: "female", accent: "British" },
  { id: "aura-2-hera-en", name: "Hera", gender: "female", accent: "American" },
  { id: "aura-2-orion-en", name: "Orion", gender: "male", accent: "American" },
  { id: "aura-2-arcas-en", name: "Arcas", gender: "male", accent: "American" },
  { id: "aura-2-perseus-en", name: "Perseus", gender: "male", accent: "American" },
  { id: "aura-2-angus-en", name: "Angus", gender: "male", accent: "Irish" },
  { id: "aura-2-orpheus-en", name: "Orpheus", gender: "male", accent: "American" },
  { id: "aura-2-helios-en", name: "Helios", gender: "male", accent: "British" },
  { id: "aura-2-zeus-en", name: "Zeus", gender: "male", accent: "American" },
] as const;

export async function GET() {
  return NextResponse.json(VOICES);
}
