import { Widget, UpcomingDeadline } from "../types";
import { emptyState, formatWhen, listItem } from "./Widget";

const HOUR_MS = 3600000;

function landingTomorrow(list: UpcomingDeadline[], now: number): UpcomingDeadline[] {
  const startTomorrow = new Date(now);
  startTomorrow.setHours(24, 0, 0, 0);
  const start = startTomorrow.getTime();
  const end = start + 86400000;
  return list.filter((d) => d.when >= start && d.when < end);
}

export const tomorrowPrep: Widget = {
  id: "tomorrow-prep",
  title: "Tomorrow's prep",
  subtitle: "What lands next",
  modes: ["evening", "night"],
  priority(ctx) {
    return landingTomorrow(ctx.data.deadlines, ctx.now).length ? 250 : 0;
  },
  render(el, ctx) {
    const tomorrow = landingTomorrow(ctx.data.deadlines, ctx.now).slice(0, 4);
    const loops = ctx.data.openLoops.length;
    if (!tomorrow.length && !loops) {
      emptyState(el, "Tomorrow looks clear.");
      return;
    }
    for (const d of tomorrow) {
      listItem(el, d.title, `${formatWhen(d.when, ctx.now)} · ${Math.max(1, Math.round(d.hoursUntil))}h away`, () =>
        ctx.openFile(d.path)
      );
    }
    if (loops) {
      listItem(el, `${loops} open ${loops === 1 ? "loop" : "loops"} carried over`, "keep them close", () => {});
    }
  },
};
