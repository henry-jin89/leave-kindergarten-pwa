import type { Child, Entry, Project } from "../domain/types";
import { defaultChildren, defaultProjects } from "./defaults";
import { supabase } from "./supabaseClient";

export interface LedgerData {
  projects: Project[];
  children: Child[];
  entries: Entry[];
}

export interface LedgerStore {
  mode: "demo" | "supabase";
  load(userId: string): Promise<LedgerData>;
  saveProject(project: Project): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  saveChild(child: Child): Promise<Child>;
  saveEntry(entry: Entry): Promise<Entry>;
  deleteEntry(entryId: string): Promise<void>;
}

const storageKey = "leave-kindergarten-ledger-v1";

const emptyData = (): LedgerData => ({
  projects: defaultProjects(),
  children: defaultChildren(),
  entries: []
});

const readDemoData = (): LedgerData => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    const seeded = emptyData();
    localStorage.setItem(storageKey, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as LedgerData;
};

const writeDemoData = (data: LedgerData) => {
  localStorage.setItem(storageKey, JSON.stringify(data));
};

export const createDemoStore = (): LedgerStore => ({
  mode: "demo",
  async load() {
    return readDemoData();
  },
  async saveProject(project) {
    const data = readDemoData();
    const exists = data.projects.some((item) => item.id === project.id);
    data.projects = exists
      ? data.projects.map((item) => (item.id === project.id ? project : item))
      : [...data.projects, project];
    writeDemoData(data);
    return project;
  },
  async deleteProject(projectId) {
    const data = readDemoData();
    data.projects = data.projects.filter((item) => item.id !== projectId);
    data.entries = data.entries.filter((item) => item.projectId !== projectId);
    writeDemoData(data);
  },
  async saveChild(child) {
    const data = readDemoData();
    const exists = data.children.some((item) => item.id === child.id);
    data.children = exists
      ? data.children.map((item) => (item.id === child.id ? child : item))
      : [...data.children, child];
    writeDemoData(data);
    return child;
  },
  async saveEntry(entry) {
    const data = readDemoData();
    const exists = data.entries.some((item) => item.id === entry.id);
    data.entries = exists
      ? data.entries.map((item) => (item.id === entry.id ? entry : item))
      : [...data.entries, entry];
    writeDemoData(data);
    return entry;
  },
  async deleteEntry(entryId) {
    const data = readDemoData();
    data.entries = data.entries.filter((item) => item.id !== entryId);
    writeDemoData(data);
  }
});

const toProject = (row: Record<string, unknown>): Project => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string,
  type: row.type as Project["type"],
  quotaDays: Number(row.quota_days),
  cycleStart: row.cycle_start as string,
  cycleEnd: row.cycle_end as string,
  unitMode: row.unit_mode as Project["unitMode"]
});

const fromProject = (project: Project) => ({
  id: project.id,
  user_id: project.userId,
  name: project.name,
  type: project.type,
  quota_days: project.quotaDays,
  cycle_start: project.cycleStart,
  cycle_end: project.cycleEnd,
  unit_mode: project.unitMode
});

const toChild = (row: Record<string, unknown>): Child => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string
});

const fromChild = (child: Child) => ({
  id: child.id,
  user_id: child.userId,
  name: child.name
});

const toEntry = (row: Record<string, unknown>): Entry => ({
  id: row.id as string,
  projectId: row.project_id as string,
  date: row.date as string,
  amountDays: Number(row.amount_days),
  note: (row.note as string | null) ?? "",
  childIds: (row.child_ids as string[] | null) ?? [],
  createdAt: row.created_at as string
});

const fromEntry = (entry: Entry) => ({
  id: entry.id,
  project_id: entry.projectId,
  date: entry.date,
  amount_days: entry.amountDays,
  note: entry.note ?? "",
  child_ids: entry.childIds,
  created_at: entry.createdAt
});

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export const createSupabaseStore = (): LedgerStore => {
  if (!supabase) return createDemoStore();
  const client = supabase;

  return {
    mode: "supabase",
    async load(userId) {
      const [projectsResult, childrenResult, entriesResult] = await Promise.all([
        client.from("projects").select("*").order("created_at"),
        client.from("children").select("*").order("created_at"),
        client.from("entries").select("*").order("date", { ascending: false })
      ]);
      throwIfError(projectsResult.error);
      throwIfError(childrenResult.error);
      throwIfError(entriesResult.error);

      let projects = (projectsResult.data ?? []).map(toProject);
      let children = (childrenResult.data ?? []).map(toChild);
      const entries = (entriesResult.data ?? []).map(toEntry);

      if (projects.length === 0) {
        const seededProjects = defaultProjects().map((project) => ({ ...project, userId }));
        await Promise.all(seededProjects.map((project) => this.saveProject(project)));
        projects = seededProjects;
      }

      if (children.length === 0) {
        const seededChildren = defaultChildren().map((child) => ({ ...child, userId }));
        await Promise.all(seededChildren.map((child) => this.saveChild(child)));
        children = seededChildren;
      }

      return { projects, children, entries };
    },
    async saveProject(project) {
      const { error } = await client.from("projects").upsert(fromProject(project));
      throwIfError(error);
      return project;
    },
    async deleteProject(projectId) {
      const { error } = await client.from("projects").delete().eq("id", projectId);
      throwIfError(error);
    },
    async saveChild(child) {
      const { error } = await client.from("children").upsert(fromChild(child));
      throwIfError(error);
      return child;
    },
    async saveEntry(entry) {
      const { error } = await client.from("entries").upsert(fromEntry(entry));
      throwIfError(error);
      return entry;
    },
    async deleteEntry(entryId) {
      const { error } = await client.from("entries").delete().eq("id", entryId);
      throwIfError(error);
    }
  };
};
