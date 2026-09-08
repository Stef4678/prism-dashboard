import { WidgetContext } from "../types";

export function emptyState(el: HTMLElement, msg: string): void {
  el.createDiv({ cls: "prism-empty", text: msg });
}

export function listItem(
  el: HTMLElement,
  text: string,
  sub?: string,
  onClick?: () => void
): HTMLElement {
  const item = el.createDiv({ cls: "prism-item" });
  if (onClick) item.onClickEvent(onClick);
  item.createDiv({ cls: "prism-item-text", text });
  if (sub) item.createDiv({ cls: "prism-item-sub", text: sub });
  return item;
}

export interface TaskRow {
  text: string;
  sub?: string;
  path: string;
  line: number;
  overdue?: boolean;
}

/**
 * A task row with an inline completion ring. Clicking the ring completes the
 * task in the vault via ctx.toggleTask; clicking the row opens the note.
 */
export function taskItem(
  el: HTMLElement,
  row: TaskRow,
  ctx: WidgetContext
): HTMLElement {
  const item = el.createDiv({
    cls: "prism-item prism-task" + (row.overdue ? " prism-item--overdue" : ""),
  });
  const rowEl = item.createDiv({ cls: "prism-task-row" });
  const check = rowEl.createEl("button", {
    cls: "prism-task-check",
    attr: {
      role: "checkbox",
      "aria-checked": "false",
      "aria-label": "Complete task",
      title: "Complete task",
    },
  });
  check.onClickEvent((ev) => {
    ev.stopPropagation();
    if (check.disabled) return;
    check.disabled = true;
    check.classList.add("is-pending");
    void ctx.toggleTask(row.path, row.line).then((ok) => {
      if (!ok) {
        check.disabled = false;
        check.classList.remove("is-pending");
      }
    });
  });
  const content = rowEl.createDiv({ cls: "prism-task-content" });
  content.createDiv({ cls: "prism-item-text", text: row.text });
  if (row.sub) content.createDiv({ cls: "prism-item-sub", text: row.sub });
  item.onClickEvent(() => ctx.openFile(row.path));
  return item;
}

export function relative(t: number, now = Date.now()): string {
  const s = Math.max(1, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function formatWhen(t: number, now = Date.now()): string {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const today = startToday.getTime();
  if (t >= today && t < today + 86400000) return "today";
  if (t >= today + 86400000 && t < today + 2 * 86400000) return "tomorrow";
  return new Date(t).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
