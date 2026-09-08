import { Widget } from "../types";
import { emptyState, formatWhen, listItem, taskItem } from "./Widget";

export const deadlines: Widget = {
  id: "deadlines",
  title: "Deadlines",
  subtitle: "Approaching due dates",
  modes: ["morning", "day", "evening"],
  priority(ctx) {
    const soon = ctx.data.deadlines.filter((d) => d.hoursUntil > 0);
    if (!soon.length) return 0;
    const nearest = Math.min(...soon.map((d) => d.hoursUntil));
    if (nearest <= 72) return Math.max(1, 500 + Math.round((72 - nearest) * 2));
    return 150;
  },
  render(el, ctx) {
    const list = ctx.data.deadlines.slice(0, 6);
    if (!list.length) {
      emptyState(el, "Nothing on the horizon.");
      return;
    }
    for (const d of list) {
      const past = d.hoursUntil <= 0;
      const sub = formatWhen(d.when) + (past ? " · past" : "");
      if (d.line !== null) {
        // Task deadline: completable in place.
        taskItem(
          el,
          { text: d.title, sub, path: d.path, line: d.line, overdue: past },
          ctx
        );
      } else {
        // Note-level frontmatter date: opens the note.
        listItem(el, d.title, sub, () => ctx.openFile(d.path)).classList.toggle(
          "prism-item--overdue",
          past
        );
      }
    }
  },
};
