import { Widget } from "../types";
import { emptyState, listItem } from "./Widget";

export const openLoops: Widget = {
  id: "open-loops",
  title: "Open loops",
  subtitle: "Tasks not yet closed",
  modes: ["morning", "day", "night"],
  priority(ctx) {
    if (ctx.data.overdue.length) {
      const max = Math.max(...ctx.data.overdue.map((o) => o.hoursOverdue));
      return 1000 + Math.round(max * 10);
    }
    if (ctx.data.openLoops.length) return 600;
    return 0;
  },
  render(el, ctx) {
    const overdue = ctx.data.overdue.slice(0, 4);
    const loops = ctx.data.openLoops.slice(0, 8);
    if (!overdue.length && !loops.length) {
      emptyState(el, "No open loops. Breathe.");
      return;
    }
    for (const o of overdue) {
      listItem(el, o.text, `${Math.round(o.hoursOverdue)}h overdue`, () =>
        ctx.openFile(o.path)
      ).classList.add("prism-item--overdue");
    }
    for (const t of loops) {
      listItem(el, t.text, undefined, () => ctx.openFile(t.path));
    }
  },
};
