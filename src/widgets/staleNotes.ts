import { Widget } from "../types";
import { emptyState, listItem } from "./Widget";

export const staleNotes: Widget = {
  id: "stale-notes",
  title: "Notes to revisit",
  subtitle: "Gathering dust, still connected",
  modes: ["evening", "night"],
  priority(ctx) {
    const top = ctx.data.staleNotes[0];
    return top ? 300 + top.days * 3 : 0;
  },
  render(el, ctx) {
    const list = ctx.data.staleNotes.slice(0, 6);
    if (!list.length) {
      emptyState(el, "Nothing stale.");
      return;
    }
    for (const n of list) {
      listItem(el, n.title, `${n.days}d untouched`, () => ctx.openFile(n.path));
    }
  },
};
