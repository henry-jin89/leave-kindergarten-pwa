import type { Child, Project } from "../domain/types";

const userId = "demo-user";

export const defaultProjectSpecs = [
  {
    name: "年假",
    type: "annual_leave",
    quotaDays: 10,
    unitMode: "half_or_full_day",
    cycleStart: "2026-03-01",
    cycleEnd: "2027-03-31"
  },
  {
    name: "育儿假",
    type: "parenting_leave",
    quotaDays: 10,
    unitMode: "half_or_full_day",
    cycleStart: "2026-05-01",
    cycleEnd: "2027-05-31"
  },
  {
    name: "幼儿园",
    type: "kindergarten",
    quotaDays: 60,
    unitMode: "whole_child_day",
    cycleStart: "2025-01-01",
    cycleEnd: "2028-12-31"
  }
] satisfies Array<Omit<Project, "id" | "userId">>;

export const defaultChildren = (): Child[] => [
  { id: crypto.randomUUID(), userId, name: "孩子 A" },
  { id: crypto.randomUUID(), userId, name: "孩子 B" }
];

export const defaultProjects = (): Project[] =>
  defaultProjectSpecs.map((project) => ({
    ...project,
    id: crypto.randomUUID(),
    userId
  }));
