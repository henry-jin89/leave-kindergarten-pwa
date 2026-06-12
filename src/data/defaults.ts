import type { Child, Project } from "../domain/types";
import { currentYearCycle } from "../lib/date";

const userId = "demo-user";

export const defaultChildren = (): Child[] => [
  { id: crypto.randomUUID(), userId, name: "孩子 A" },
  { id: crypto.randomUUID(), userId, name: "孩子 B" }
];

export const defaultProjects = (): Project[] => {
  const cycle = currentYearCycle();
  return [
    {
      id: crypto.randomUUID(),
      userId,
      name: "年假",
      type: "annual_leave",
      quotaDays: 10,
      unitMode: "half_or_full_day",
      ...cycle
    },
    {
      id: crypto.randomUUID(),
      userId,
      name: "育儿假",
      type: "parenting_leave",
      quotaDays: 10,
      unitMode: "half_or_full_day",
      ...cycle
    },
    {
      id: crypto.randomUUID(),
      userId,
      name: "幼儿园",
      type: "kindergarten",
      quotaDays: 60,
      unitMode: "whole_child_day",
      ...cycle
    }
  ];
};
