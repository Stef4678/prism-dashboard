import { App, PluginSettingTab, Setting, type SettingDefinitionItem } from "obsidian";
import type PrismPlugin from "../main";
import { MODES, PluginSettings } from "./types";
import { WIDGET_LABELS } from "./widgets";

export const DEFAULT_SETTINGS: PluginSettings = {
  accentColor: "#7c6cff",
  modeHours: {
    morning: [5, 11],
    day: [11, 17],
    evening: [17, 21],
    night: [21, 5],
  },
  enabledWidgets: {
    "open-loops": true,
    deadlines: true,
    "focus-project": true,
    "quick-capture": true,
    "work-queue": true,
    "touched-today": true,
    "stale-notes": true,
    "tomorrow-prep": true,
  },
  projectBy: "folder",
  modeOverride: null,
};

export class PrismSettingTab extends PluginSettingTab {
  plugin: PrismPlugin;

  constructor(app: App, plugin: PrismPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Obsidian 1.13.0+: used for rendering and settings search. display() is
  // still called on older versions, so the two stay in sync.
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: "Prism",
        items: [
          {
            name: "Accent color",
            desc: "A context-adaptive dashboard that refracts to your day. Drives the gradient and glow across the dashboard.",
            control: { type: "color", key: "accentColor" },
          },
          {
            name: "Active project by",
            desc: "How Prism decides the current project from your most recent file.",
            control: {
              type: "dropdown",
              key: "projectBy",
              options: { folder: "Folder", tag: "Tag" },
            },
          },
        ],
      },
      {
        type: "group",
        heading: "Mode hours",
        items: MODES.map((mode) => ({
          name: mode,
          desc: "24h start and end hour for this mode.",
          render: (setting) => {
            const [start, end] = this.plugin.settings.modeHours[mode];
            setting.addText((t) =>
              t.setPlaceholder("start").setValue(String(start)).onChange(async (v) => {
                const n = parseInt(v, 10);
                if (!Number.isNaN(n)) {
                  this.plugin.settings.modeHours[mode][0] = n;
                  await this.plugin.saveSettings();
                }
              })
            );
            setting.addText((t) =>
              t.setPlaceholder("end").setValue(String(end)).onChange(async (v) => {
                const n = parseInt(v, 10);
                if (!Number.isNaN(n)) {
                  this.plugin.settings.modeHours[mode][1] = n;
                  await this.plugin.saveSettings();
                }
              })
            );
          },
        })),
      },
      {
        type: "group",
        heading: "Widgets",
        items: Object.entries(this.plugin.settings.enabledWidgets).map(([id, enabled]) => ({
          name: WIDGET_LABELS[id] ?? id,
          render: (setting) => {
            setting.addToggle((t) =>
              t.setValue(enabled).onChange(async (v) => {
                this.plugin.settings.enabledWidgets[id] = v;
                await this.plugin.saveSettings();
              })
            );
          },
        })),
      },
    ];
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Prism").setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "A context-adaptive dashboard that refracts to your day.",
    });

    new Setting(containerEl)
      .setName("Accent color")
      .setDesc("Drives the gradient and glow across the dashboard.")
      .addColorPicker((cp) =>
        cp.setValue(this.plugin.settings.accentColor).onChange(async (value) => {
          this.plugin.settings.accentColor = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Active project by")
      .setDesc("How Prism decides the current project from your most recent file.")
      .addDropdown((dd) =>
        dd
          .addOption("folder", "Folder")
          .addOption("tag", "Tag")
          .setValue(this.plugin.settings.projectBy)
          .onChange(async (value) => {
            this.plugin.settings.projectBy = value as "folder" | "tag";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Mode hours").setHeading();
    for (const mode of MODES) {
      const [start, end] = this.plugin.settings.modeHours[mode];
      const row = new Setting(containerEl)
        .setName(mode)
        .setDesc("24h start and end hour for this mode.");
      row.addText((t) =>
        t
          .setPlaceholder("start")
          .setValue(String(start))
          .onChange(async (v) => {
            const n = parseInt(v, 10);
            if (!Number.isNaN(n)) {
              this.plugin.settings.modeHours[mode][0] = n;
              await this.plugin.saveSettings();
            }
          })
      );
      row.addText((t) =>
        t
          .setPlaceholder("end")
          .setValue(String(end))
          .onChange(async (v) => {
            const n = parseInt(v, 10);
            if (!Number.isNaN(n)) {
              this.plugin.settings.modeHours[mode][1] = n;
              await this.plugin.saveSettings();
            }
          })
      );
    }

    new Setting(containerEl).setName("Widgets").setHeading();
    for (const [id, enabled] of Object.entries(this.plugin.settings.enabledWidgets)) {
      new Setting(containerEl)
        .setName(WIDGET_LABELS[id] ?? id)
        .addToggle((t) =>
          t.setValue(enabled).onChange(async (v) => {
            this.plugin.settings.enabledWidgets[id] = v;
            await this.plugin.saveSettings();
          })
        );
    }
  }
}
