"use client";

import React from "react";
import { DbChrome } from "./DbChrome";
import type { ModulePitch } from "../_lib/module-pitches";

type Props = {
  pitch: ModulePitch;
  onClose: () => void;
};

export function ModulePitchModal({ pitch, onClose }: Props): React.ReactElement {
  return <DbChrome nodeName="os-chrome-pitch-modal" payload={{ pitch, onClose }} />;
}