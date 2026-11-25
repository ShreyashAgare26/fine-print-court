// Shared app state: which screen is showing and the trial in progress.
import type { Case } from "./charges";
import type { Fighter } from "./characters";
import { $ } from "./util";

export type Screen = "intake" | "trial" | "report";

export interface Trial {
  case: Case;
  /** How many charges are acted out; the rest only appear in the report. */
  size: number;
  judge: Fighter;
  prosecutor: Fighter;
  /** The clause in the dock right now. */
  accused: Fighter | null;
  /** Everyone on stage, for animation and labels. */
  cast: Fighter[];
  /** Index of the next charge to hear. */
  idx: number;
}

export const app = {
  trial: null as Trial | null,
  /** A scripted sequence is playing. */
  busy: false,
  screen: "intake" as Screen,
};
export function trial(): Trial {
  if (!app.trial) throw new Error("No trial in progress");
  return app.trial;
}

const PANELS: Record<Screen, string> = { intake: "intake", trial: "hud", report: "verdict" };
export function showScreen(name: Screen): void {
  app.screen = name;
  for (const id of ["intake", "hud", "verdict"]) $(id).classList.toggle("hidden", PANELS[name] !== id);
}
