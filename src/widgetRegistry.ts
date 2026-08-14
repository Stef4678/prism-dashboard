import { Widget, WidgetContext } from "./types";

export class WidgetRegistry {
  private widgets: Widget[] = [];

  register(widget: Widget): void {
    this.widgets.push(widget);
  }

  all(): Widget[] {
    return this.widgets;
  }

  ranked(ctx: WidgetContext): Widget[] {
    return this.widgets
      .filter((w) => w.modes.includes(ctx.mode))
      .filter((w) => ctx.settings.enabledWidgets[w.id] !== false)
      .sort((a, b) => b.priority(ctx) - a.priority(ctx));
  }
}
