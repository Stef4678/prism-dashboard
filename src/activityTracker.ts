import { ActivityRecord } from "./types";

export class ActivityTracker {
  private records = new Map<string, ActivityRecord>();
  private timer: number | null = null;

  constructor(private persist: (records: Record<string, ActivityRecord>) => void) {}

  get recent(): Map<string, ActivityRecord> {
    return this.records;
  }

  load(saved: Record<string, ActivityRecord> | undefined): void {
    if (saved) this.records = new Map(Object.entries(saved));
  }

  record(path: string): void {
    const prev = this.records.get(path);
    this.records.set(path, {
      lastOpened: Date.now(),
      openCount: (prev?.openCount ?? 0) + 1,
    });
    this.scheduleSave();
  }

  snapshot(): Record<string, ActivityRecord> {
    return Object.fromEntries(this.records);
  }

  private scheduleSave(): void {
    if (this.timer !== null) return;
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.persist(this.snapshot());
    }, 2000);
  }

  flush(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.persist(this.snapshot());
  }
}
