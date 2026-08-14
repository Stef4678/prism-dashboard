import { WidgetRegistry } from "../widgetRegistry";
import { openLoops } from "./openLoops";
import { deadlines } from "./deadlines";
import { focusProject } from "./focusProject";
import { quickCapture } from "./quickCapture";
import { workQueue } from "./workQueue";
import { touchedToday } from "./touchedToday";
import { staleNotes } from "./staleNotes";
import { tomorrowPrep } from "./tomorrowPrep";

export const WIDGET_LABELS: Record<string, string> = {
  "open-loops": "Open loops",
  deadlines: "Deadlines",
  "focus-project": "Today's focus",
  "quick-capture": "Quick capture",
  "work-queue": "Work queue",
  "touched-today": "Touched today",
  "stale-notes": "Notes to revisit",
  "tomorrow-prep": "Tomorrow's prep",
};

export function buildRegistry(): WidgetRegistry {
  const registry = new WidgetRegistry();
  registry.register(openLoops);
  registry.register(deadlines);
  registry.register(focusProject);
  registry.register(quickCapture);
  registry.register(workQueue);
  registry.register(touchedToday);
  registry.register(staleNotes);
  registry.register(tomorrowPrep);
  return registry;
}
