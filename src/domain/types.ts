export type ProjectType = "annual_leave" | "parenting_leave" | "kindergarten" | "custom";
export type UnitMode = "half_or_full_day" | "whole_child_day";

export interface Project {
  id: string;
  userId: string;
  name: string;
  type: ProjectType;
  quotaDays: number;
  cycleStart: string;
  cycleEnd: string;
  unitMode: UnitMode;
}

export interface Child {
  id: string;
  userId: string;
  name: string;
}

export interface Entry {
  id: string;
  projectId: string;
  date: string;
  amountDays: number;
  note?: string;
  childIds: string[];
  createdAt: string;
}

export interface ProjectSummary {
  project: Project;
  usedDays: number;
  remainingDays: number;
  entriesInCycle: Entry[];
}
