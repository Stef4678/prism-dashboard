import { App, TFile, Vault } from "obsidian";
import {
  EngineData,
  OpenTask,
  OverdueTask,
  ParsedTask,
  StaleNote,
  TouchedNote,
  UpcomingDeadline,
} from "./types";

interface TaskCacheEntry {
  mtime: number;
  tasks: ParsedTask[];
}

const TASK_RE = /^\s*[-*] \[([ xX])\]\s+(.+)$/;
const DUE_RE = /📅\s*(\d{4}-\d{2}-\d{2})/;
const DAY_MS = 86400000;
const STALE_AFTER_DAYS = 7;

export class DataLayer {
  private taskCache = new Map<string, TaskCacheEntry>();
  private vault: Vault;

  constructor(private app: App) {
    this.vault = app.vault;
  }

  getFrontmatterDate(file: TFile): number | null {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm) return null;
    for (const key of ["deadline", "due", "due_date", "date"]) {
      const raw: unknown = fm[key];
      if (raw == null) continue;
      const t =
        typeof raw === "string" || typeof raw === "number"
          ? Date.parse(String(raw))
          : NaN;
      if (!Number.isNaN(t)) return t;
    }
    return null;
  }

  async getFileTasks(file: TFile): Promise<ParsedTask[]> {
    const cached = this.taskCache.get(file.path);
    if (cached && cached.mtime === file.stat.mtime) return cached.tasks;
    const content = await this.vault.cachedRead(file);
    const noteDue = this.getFrontmatterDate(file);
    const tasks: ParsedTask[] = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(TASK_RE);
      if (!m) continue;
      const dueMatch = m[2].match(DUE_RE);
      const due = dueMatch ? Date.parse(dueMatch[1]) : noteDue;
      tasks.push({
        text: m[2].trim(),
        done: m[1] !== " ",
        path: file.path,
        due: Number.isNaN(due) ? null : due,
        line: i,
      });
    }
    this.taskCache.set(file.path, { mtime: file.stat.mtime, tasks });
    return tasks;
  }

  /**
   * Completes (or reopens) the task at `line` in `path` by rewriting the
   * checkbox marker in the vault. Returns false when the file or the line
   * is not a task, or when the content was already in the target state.
   */
  async toggleTask(path: string, line: number, done: boolean): Promise<boolean> {
    const file = this.vault.getFileByPath(path);
    if (!(file instanceof TFile)) return false;
    let changed = false;
    await this.vault.process(file, (content) => {
      const lines = content.split("\n");
      if (line < 0 || line >= lines.length) return content;
      const m = lines[line].match(TASK_RE);
      if (!m) return content;
      const marker = done ? "[x]" : "[ ]";
      const markerRe = /^(\s*[-*] )\[[ xX]\]/;
      if (!markerRe.test(lines[line])) return content;
      lines[line] = lines[line].replace(markerRe, `$1${marker}`);
      changed = true;
      return lines.join("\n");
    });
    if (!changed) return false;
    this.invalidate(path);
    return true;
  }

  invalidate(path: string): void {
    this.taskCache.delete(path);
  }

  async buildEngineData(now = Date.now()): Promise<EngineData> {
    const files = this.vault.getFiles();
    const openLoops: OpenTask[] = [];
    const overdue: OverdueTask[] = [];
    const deadlines: UpcomingDeadline[] = [];
    const staleNotes: StaleNote[] = [];
    const touchedToday: TouchedNote[] = [];
    const recent: TouchedNote[] = [];
    const links = new Map<string, number>();
    const mtimeByPath = new Map<string, number>();
    const tagsByPath = new Map<string, string[]>();
    const projectsByPath = new Map<string, string | null>();

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartMs = dayStart.getTime();
    const staleThreshold = now - STALE_AFTER_DAYS * DAY_MS;
    const HOUR_MS = 3600000;

    for (const file of files) {
      const mtime = file.stat.mtime;
      const title = file.basename;
      mtimeByPath.set(file.path, mtime);
      const outLinks = this.app.metadataCache.resolvedLinks[file.path];
      links.set(file.path, outLinks ? Object.keys(outLinks).length : 0);

      const fileCache = this.app.metadataCache.getFileCache(file);
      const rawTags: string[] = [];
      if (fileCache) {
        for (const t of fileCache.tags ?? []) rawTags.push(t.tag);
        const fmTags: unknown = fileCache.frontmatter?.["tags"];
        if (typeof fmTags === "string") rawTags.push(fmTags);
        else if (Array.isArray(fmTags))
          for (const v of fmTags) if (typeof v === "string") rawTags.push(v);
      }
      const seen = new Set<string>();
      const uniqTags: string[] = [];
      for (const raw of rawTags) {
        const t = raw.trim();
        if (!t) continue;
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        uniqTags.push(t);
      }
      tagsByPath.set(file.path, uniqTags);

      const fmProjectRaw: unknown = fileCache?.frontmatter?.["project"];
      const fmProject =
        typeof fmProjectRaw === "string"
          ? fmProjectRaw.trim()
          : Array.isArray(fmProjectRaw) && typeof fmProjectRaw[0] === "string"
            ? fmProjectRaw[0].trim()
            : null;
      projectsByPath.set(file.path, fmProject || null);

      if (mtime >= dayStartMs) touchedToday.push({ title, path: file.path, mtime });
      recent.push({ title, path: file.path, mtime });

      const fmDate = this.getFrontmatterDate(file);
      if (fmDate !== null && fmDate < now) {
        deadlines.push({
          title,
          path: file.path,
          when: fmDate,
          hoursUntil: (fmDate - now) / HOUR_MS,
          line: null,
        });
      }

      let tasks: ParsedTask[] = [];
      try {
        tasks = await this.getFileTasks(file);
      } catch {
        continue;
      }
      for (const t of tasks) {
        if (t.done) continue;
        if (t.due !== null && t.due < now) {
          overdue.push({
            text: t.text,
            path: t.path,
            line: t.line,
            hoursOverdue: (now - t.due) / HOUR_MS,
          });
        } else {
          openLoops.push({ text: t.text, path: t.path, line: t.line });
          if (t.due !== null && t.due < now + 72 * HOUR_MS) {
            deadlines.push({
              title: t.text,
              path: t.path,
              when: t.due,
              hoursUntil: (t.due - now) / HOUR_MS,
              line: t.line,
            });
          }
        }
      }
    }

    recent.sort((a, b) => b.mtime - a.mtime);
    touchedToday.sort((a, b) => b.mtime - a.mtime);
    openLoops.sort(
      (a, b) => (mtimeByPath.get(b.path) ?? 0) - (mtimeByPath.get(a.path) ?? 0)
    );
    overdue.sort((a, b) => b.hoursOverdue - a.hoursOverdue);
    deadlines.sort((a, b) => a.when - b.when);

    for (const file of files) {
      if (file.stat.mtime < staleThreshold && (links.get(file.path) ?? 0) > 0) {
        staleNotes.push({
          title: file.basename,
          path: file.path,
          days: Math.floor((now - file.stat.mtime) / DAY_MS),
        });
      }
    }
    staleNotes.sort((a, b) => b.days - a.days);

    return {
      openLoops: openLoops.slice(0, 12),
      overdue: overdue.slice(0, 6),
      deadlines: deadlines.slice(0, 8),
      staleNotes: staleNotes.slice(0, 6),
      touchedToday: touchedToday.slice(0, 10),
      recent: recent.slice(0, 20),
      mtimeByPath,
      links,
      tagsByPath,
      projectsByPath,
    };
  }
}
