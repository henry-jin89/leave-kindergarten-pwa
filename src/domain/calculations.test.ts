import { describe, expect, it } from "vitest";
import type { Entry, Project } from "./types";
import { createEntryDraft, summarizeProject } from "./calculations";

const baseProject = (overrides: Partial<Project> = {}): Project => ({
  id: "project-1",
  userId: "user-1",
  name: "年假",
  type: "annual_leave",
  quotaDays: 10,
  cycleStart: "2026-01-01",
  cycleEnd: "2026-12-31",
  unitMode: "half_or_full_day",
  ...overrides
});

const entry = (overrides: Partial<Entry>): Entry => ({
  id: "entry-1",
  projectId: "project-1",
  date: "2026-06-10",
  amountDays: 1,
  childIds: [],
  createdAt: "2026-06-10T00:00:00.000Z",
  ...overrides
});

describe("summarizeProject", () => {
  it("subtracts annual leave half-day and full-day entries from quota", () => {
    const summary = summarizeProject(baseProject(), [
      entry({ id: "entry-1", amountDays: 1 }),
      entry({ id: "entry-2", amountDays: 0.5 })
    ]);

    expect(summary.usedDays).toBe(1.5);
    expect(summary.remainingDays).toBe(8.5);
  });

  it("leaves parenting leave at full quota when no records exist", () => {
    const summary = summarizeProject(
      baseProject({ name: "育儿假", type: "parenting_leave" }),
      []
    );

    expect(summary.usedDays).toBe(0);
    expect(summary.remainingDays).toBe(10);
  });

  it("supports parenting leave half-day entries", () => {
    const summary = summarizeProject(
      baseProject({ name: "育儿假", type: "parenting_leave" }),
      [entry({ amountDays: 0.5 })]
    );

    expect(summary.usedDays).toBe(0.5);
    expect(summary.remainingDays).toBe(9.5);
  });

  it("counts kindergarten attendance as whole child-days", () => {
    const project = baseProject({
      name: "幼儿园",
      type: "kindergarten",
      quotaDays: 60,
      unitMode: "whole_child_day"
    });
    const draft = createEntryDraft(project, {
      date: "2026-06-10",
      childIds: ["child-1", "child-2"]
    });

    expect(draft.amountDays).toBe(2);
    expect(summarizeProject(project, [entry(draft)]).usedDays).toBe(2);
  });

  it("rejects half-day kindergarten entries", () => {
    const project = baseProject({
      type: "kindergarten",
      unitMode: "whole_child_day"
    });

    expect(() =>
      createEntryDraft(project, {
        date: "2026-06-10",
        amountDays: 0.5,
        childIds: ["child-1"]
      })
    ).toThrow("幼儿园记录只能按整天孩子人次计算");
  });

  it("ignores records outside the current cycle", () => {
    const summary = summarizeProject(baseProject(), [
      entry({ id: "entry-1", date: "2026-06-10", amountDays: 1 }),
      entry({ id: "entry-2", date: "2027-01-01", amountDays: 1 })
    ]);

    expect(summary.usedDays).toBe(1);
    expect(summary.remainingDays).toBe(9);
  });
});
