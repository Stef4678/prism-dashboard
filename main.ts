import { Notice, Plugin, TFile } from "obsidian";
import { DashboardView, VIEW_TYPE } from "./src/DashboardView";
import { ActivityTracker } from "./src/activityTracker";
import { DataLayer } from "./src/dataLayer";
import { DEFAULT_SETTINGS, PrismSettingTab } from "./src/settings";
import { ActivityRecord, PluginSettings } from "./src/types";
import { buildRegistry } from "./src/widgets";

interface PersistedData {
  settings?: Partial<PluginSettings>;
  activity?: Record<string, ActivityRecord>;
}

export default class PrismPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  dataLayer!: DataLayer;
  activity!: ActivityTracker;
  registry!: ReturnType<typeof buildRegistry>;

  async onload(): Promise<void> {
    const saved = (await this.loadData()) as PersistedData | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved?.settings ?? {});
    this.dataLayer = new DataLayer(this.app);
    this.activity = new ActivityTracker(() => this.persist());
    this.activity.load(saved?.activity);
    this.registry = buildRegistry();

    this.registerView(VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    this.addRibbonIcon("layout-dashboard", "Open Prism dashboard", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-prism-dashboard",
      name: "Open Prism dashboard",
      callback: () => {
        void this.activateView();
      },
    });
    this.addSettingTab(new PrismSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (file) this.activity.record(file.path);
      })
    );
  }

  onunload(): void {
    this.activity.flush();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async capture(text: string): Promise<void> {
    const existing = this.app.vault.getFileByPath("Capture.md");
    if (existing) {
      await this.app.vault.process(existing, (content) =>
        content.replace(/\s*$/, "") + `\n- ${text}\n`
      );
    } else {
      await this.app.vault.create("Capture.md", `# Capture\n\n- ${text}\n`);
    }
    new Notice("Captured → Capture.md");
  }

  async saveSettings(): Promise<void> {
    await this.persist();
  }

  private persist(): Promise<void> {
    return this.saveData({
      settings: this.settings,
      activity: this.activity.snapshot(),
    });
  }
}
