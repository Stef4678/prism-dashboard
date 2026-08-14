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
