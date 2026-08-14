import { TFile, Vault } from "obsidian";
import { ActivityRecord, Mode, PluginSettings, Project } from "./types";

export function classifyMode(now: Date, hours: PluginSettings["modeHours"]): Mode {
  const h = now.getHours();
  const order: Mode[] = ["morning", "day", "evening", "night"];
  for (const mode of order) {
    const [start, end] = hours[mode];
    if (start < end) {
      if (h >= start && h < end) return mode;
    } else {
      if (h >= start || h < end) return mode;
    }
  }
  return "day";
}

export function modeLabel(mode: Mode): string {
  switch (mode) {
    case "morning":
      return "Morning briefing";
    case "day":
      return "Working mode";
    case "evening":
      return "Evening review";
    case "night":
      return "Night desk";
  }
}

export function deriveProject(
  activity: Map<string, ActivityRecord>,
  vault: Vault
): Project | null {
  let best: string | null = null;
  let bestTime = -1;
  for (const [path, rec] of activity) {
    if (rec.lastOpened > bestTime) {
      bestTime = rec.lastOpened;
      best = path;
    }
  }
  if (!best) return null;
  const file = vault.getAbstractFileByPath(best);
  if (file instanceof TFile && file.parent && file.parent.path !== "/") {
    return { kind: "folder", id: file.parent.path, title: file.parent.name };
  }
  return null;
}
