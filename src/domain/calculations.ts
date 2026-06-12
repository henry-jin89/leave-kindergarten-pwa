import type { Entry, Project, ProjectSummary } from "./types";

type EntryDraftInput = {
  date: string;
  amountDays?: number;
  childIds?: string[];
  note?: string;
};

const isWithinCycle = (date: string, project: Project) =>
  date >= project.cycleStart && date <= project.cycleEnd;

const roundToHalf = (value: number) => Math.round(value * 2) / 2;

export function createEntryDraft(project: Project, input: EntryDraftInput): Omit<Entry, "id" | "createdAt"> {
  const childIds = input.childIds ?? [];

  if (project.unitMode === "whole_child_day") {
    if (input.amountDays !== undefined && input.amountDays !== childIds.length) {
      throw new Error("幼儿园记录只能按整天孩子人次计算");
    }

    return {
      projectId: project.id,
      date: input.date,
      amountDays: childIds.length,
      childIds,
      note: input.note
    };
  }

  if (input.amountDays !== 0.5 && input.amountDays !== 1) {
    throw new Error("请假记录只能选择 0.5 天或 1 天");
  }

  return {
    projectId: project.id,
    date: input.date,
    amountDays: input.amountDays,
    childIds: [],
    note: input.note
  };
}

export function summarizeProject(project: Project, entries: Entry[]): ProjectSummary {
  const entriesInCycle = entries.filter(
    (entry) => entry.projectId === project.id && isWithinCycle(entry.date, project)
  );
  const usedDays = roundToHalf(
    entriesInCycle.reduce((sum, entry) => sum + entry.amountDays, 0)
  );

  return {
    project,
    usedDays,
    remainingDays: roundToHalf(project.quotaDays - usedDays),
    entriesInCycle
  };
}

export function formatDays(value: number) {
  return Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`;
}
