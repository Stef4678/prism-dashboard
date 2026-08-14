import { ItemView, Notice, setIcon, WorkspaceLeaf } from "obsidian";
import type PrismPlugin from "../main";
import { classifyMode, deriveProject, modeLabel } from "./contextEngine";
import { MODES, Mode, WidgetContext } from "./types";

export const VIEW_TYPE = "prism-dashboard";

const MODE_SUBTITLES: Record<Mode, string> = {
  morning: "Open loops, deadlines, and where to start.",
  day: "The queue and what's moving.",
  evening: "What you touched, what to revisit.",
  night: "Quiet desk — the queue and capture.",
};

export class DashboardView extends ItemView {
  private refreshTimer: number | null = null;
  private tickTimer: number | null = null;
  private lastTopId: string | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: PrismPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Prism Dashboard";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async onOpen(): Promise<void> {
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.scheduleRefresh(250))
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.scheduleRefresh(500))
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.scheduleRefresh(400))
    );
    this.tickTimer = window.setInterval(() => {
      void this.refresh();
    }, 60000);
    await this.refresh();
  }

  async onClose(): Promise<void> {
    if (this.tickTimer !== null) window.clearInterval(this.tickTimer);
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.contentEl.empty();
  }

  private scheduleRefresh(delay: number): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refresh();
    }, delay);
  }

  private async buildContext(): Promise<WidgetContext> {
    const now = Date.now();
    const settings = this.plugin.settings;
    const mode =
      settings.modeOverride ?? classifyMode(new Date(now), settings.modeHours);
    const project = deriveProject(this.plugin.activity.recent, this.app.vault);
    const data = await this.plugin.dataLayer.buildEngineData(now);
    return {
      mode,
      project,
      now,
      data,
      settings,
      openFile: (path) => {
        void this.app.workspace.openLinkText(path, "");
      },
      capture: async (text) => {
        try {
          await this.plugin.capture(text);
          return true;
        } catch (err) {
          new Notice(
            `Capture failed — ${err instanceof Error ? err.message : String(err)}`,
            5000
          );
          return false;
        }
      },
    };
  }

  private async refresh(): Promise<void> {
    const ctx = await this.buildContext();
    this.render(ctx);
  }

  private render(ctx: WidgetContext): void {
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "prism" });
    root.dataset.mode = ctx.mode;
    root.style.setProperty("--prism-accent", ctx.settings.accentColor);

    const brand = root.createDiv({ cls: "prism-brand" });
    const brandLogo = brand.createSpan({ cls: "prism-brand-logo" });
    setIcon(brandLogo, "layout-dashboard");
    brand.createSpan({ cls: "prism-brand-text", text: "Prism Dashboard" });
    const toolbar = root.createDiv({ cls: "prism-toolbar" });
    const modes = toolbar.createDiv({ cls: "prism-modes" });
    const autoBtn = modes.createEl("button", {
      cls:
        "prism-mode-btn prism-mode-btn--auto" +
        (ctx.settings.modeOverride === null ? " is-active" : ""),
      text: "Auto",
    });
    autoBtn.onClickEvent(() => {
      this.plugin.settings.modeOverride = null;
      void this.plugin.saveSettings().then(() => this.refresh());
    });
    for (const mode of MODES) {
      const btn = modes.createEl("button", {
        cls:
          "prism-mode-btn" +
          (ctx.settings.modeOverride === mode ? " is-active" : ""),
        text: modeLabel(mode),
      });
      btn.onClickEvent(() => {
        this.plugin.settings.modeOverride = mode;
        void this.plugin.saveSettings().then(() => this.refresh());
      });
    }

    const hero = root.createDiv({ cls: "prism-hero" });
    const clockRow = hero.createDiv({ cls: "prism-hero-row" });
    clockRow.createDiv({
      cls: "prism-clock",
      text: new Date(ctx.now).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    clockRow.createDiv({ cls: "prism-date", text: new Date(ctx.now).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) });
    hero.createDiv({ cls: "prism-mode-label", text: modeLabel(ctx.mode) });
    const sub = hero.createDiv({ cls: "prism-mode-sub", text: MODE_SUBTITLES[ctx.mode] });
    if (ctx.project) {
      sub.appendText("  ");
      sub.createSpan({ cls: "prism-project-chip", text: ctx.project.title });
    }

    const grid = root.createDiv({ cls: "prism-grid" });
    const ranked = this.plugin.registry.ranked(ctx);
    let topId: string | null = null;
    ranked.forEach((widget, i) => {
      const card = grid.createDiv({ cls: "prism-card" });
      card.dataset.widget = widget.id;
      card.style.transitionDelay = `${i * 60}ms`;
      const head = card.createDiv({ cls: "prism-card-head" });
      head.createDiv({ cls: "prism-card-title", text: widget.title });
      if (widget.subtitle) head.createDiv({ cls: "prism-card-sub", text: widget.subtitle });
      widget.render(card.createDiv({ cls: "prism-card-body" }), ctx);
      if (i === 0) {
        card.classList.add("is-top");
        topId = widget.id;
        if (this.lastTopId !== null && this.lastTopId !== widget.id) {
          card.classList.add("is-pulse");
        }
      }
    });
    this.lastTopId = topId;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.add("is-visible"));
    });
  }
}
