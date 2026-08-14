import { Widget } from "../types";
import { emptyState, listItem, relative } from "./Widget";

export const touchedToday: Widget = {
  id: "touched-today",
  title: "Touched today",
  subtitle: "Notes you moved",
  modes: ["evening", "night"],
  priority(ctx) {
    return ctx.data.touchedToday.length ? 400 : 0;
  },
  render(el, ctx) {
    const list = ctx.data.touchedToday.slice(0, 8);
    if (!list.length) {
      emptyState(el, "Nothing touched yet.");
      return;
    }
    for (const n of list) {
      listItem(el, n.title, relative(n.mtime), () => ctx.openFile(n.path));
    }
  },
};
