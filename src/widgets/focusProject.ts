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
    const project = ctx.project;
    const inProject = ctx.data.recent.filter((r) => {
      if (project.kind === "folder") {
        return r.path.startsWith(project.id + "/");
      }
      const tags = ctx.data.tagsByPath.get(r.path) ?? [];
      const fm = ctx.data.projectsByPath.get(r.path) ?? null;
      const want = project.id.toLowerCase();
      return (
        (fm !== null && fm.toLowerCase() === want) ||
        tags.some((t) => t.toLowerCase() === want)
      );
    });
    if (!inProject.length) {
      emptyState(el, "Nothing in this project recently.");
      return;
    }
    for (const n of inProject.slice(0, 5)) {
      listItem(el, n.title, relative(n.mtime), () => ctx.openFile(n.path));
    }
  },
};
