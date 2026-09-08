import { Widget } from "../types";
import { emptyState, taskItem } from "./Widget";

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
      taskItem(
        el,
        {
          text: o.text,
          sub: `${Math.round(o.hoursOverdue)}h overdue`,
          path: o.path,
          line: o.line,
          overdue: true,
        },
        ctx
      );
    }
    for (const t of loops) {
      taskItem(el, { text: t.text, path: t.path, line: t.line }, ctx);
    }
  },
};
