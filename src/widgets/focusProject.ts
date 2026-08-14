import { Widget } from "../types";
import { emptyState, listItem, relative } from "./Widget";

export const focusProject: Widget = {
  id: "focus-project",
  title: "Today's focus",
  subtitle: "Active project",
  modes: ["morning", "day"],
  priority(ctx) {
    return ctx.project ? 200 : 0;
  },
  render(el, ctx) {
    if (!ctx.project) {
      emptyState(el, "No active project yet — open a note.");
      return;
    }
    el.createDiv({ cls: "prism-project-title", text: ctx.project.title });
    const prefix = ctx.project.id + "/";
    const inProject = ctx.data.recent
      .filter((r) => r.path.startsWith(prefix))
      .slice(0, 5);
    if (!inProject.length) {
      emptyState(el, "Nothing in this folder recently.");
      return;
    }
    for (const n of inProject) {
      listItem(el, n.title, relative(n.mtime), () => ctx.openFile(n.path));
    }
  },
};
