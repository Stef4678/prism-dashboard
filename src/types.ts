export type Mode = "morning" | "day" | "evening" | "night";

export const MODES: Mode[] = ["morning", "day", "evening", "night"];

export interface PluginSettings {
  accentColor: string;
  modeHours: Record<Mode, [number, number]>;
  enabledWidgets: Record<string, boolean>;
  projectBy: "folder" | "tag";
  modeOverride: Mode | null;
}

export interface ActivityRecord {
  lastOpened: number;
  openCount: number;
}

export interface ParsedTask {
  text: string;
  done: boolean;
  path: string;
  due: number | null;
}

export interface OpenTask {
  text: string;
  path: string;
}

export interface OverdueTask {
  text: string;
  path: string;
  hoursOverdue: number;
}

export interface UpcomingDeadline {
  title: string;
  path: string;
  when: number;
  hoursUntil: number;
}

export interface StaleNote {
  title: string;
  path: string;
  days: number;
}

export interface TouchedNote {
  title: string;
  path: string;
  mtime: number;
}

export interface Project {
  kind: "folder" | "tag";
  id: string;
  title: string;
}

export interface EngineData {
  openLoops: OpenTask[];
  overdue: OverdueTask[];
  deadlines: UpcomingDeadline[];
  staleNotes: StaleNote[];
  touchedToday: TouchedNote[];
  recent: TouchedNote[];
  mtimeByPath: Map<string, number>;
  links: Map<string, number>;
}

export interface WidgetContext {
  mode: Mode;
  project: Project | null;
  now: number;
  data: EngineData;
  settings: PluginSettings;
  openFile: (path: string) => void;
  capture: (text: string) => Promise<boolean>;
}

export interface Widget {
  id: string;
  title: string;
  subtitle?: string;
  modes: Mode[];
  priority(ctx: WidgetContext): number;
  render(el: HTMLElement, ctx: WidgetContext): void;
}
