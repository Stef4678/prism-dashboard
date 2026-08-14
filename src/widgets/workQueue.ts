import { Widget } from "../types";
import { emptyState, listItem } from "./Widget";

export const workQueue: Widget = {
  id: "work-queue",
  title: "Work queue",
  subtitle: "Open tasks by freshness",
  modes: ["day", "night"],
  priority(ctx) {
    return ctx.data.openLoops.length ? 500 : 0;
  },
  render(el, ctx) {
    const list = ctx.data.openLoops.slice(0, 8);
    if (!list.length) {
      emptyState(el, "Queue is clear.");
      return;
    }
    for (const t of list) {
      listItem(el, t.text, undefined, () => ctx.openFile(t.path));
    }
  },
};
