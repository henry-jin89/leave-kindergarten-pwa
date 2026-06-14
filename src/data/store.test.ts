import { describe, expect, it } from "vitest";
import type { Entry, Project } from "../domain/types";
import { dedupeDefaultProjects } from "./store";

const project = (overrides: Partial<Project> = {}): Project => ({
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

const entry = (overrides: Partial<Entry> = {}): Entry => ({
  id: "entry-1",
  projectId: "project-2",
  date: "2026-06-10",
  amountDays: 0.5,
  note: "",
  childIds: [],
  createdAt: "2026-06-10T00:00:00.000Z",
  ...overrides
});

describe("dedupeDefaultProjects", () => {
  it("keeps one default project per type and cycle", () => {
    const result = dedupeDefaultProjects(
      [
        project({ id: "project-1" }),
        project({ id: "project-2" }),
        project({ id: "project-3", name: "育儿假", type: "parenting_leave" })
      ],
      [entry()]
    );

    expect(result.projects.map((item) => item.id)).toEqual(["project-1", "project-3"]);
    expect(result.entries[0].projectId).toBe("project-1");
    expect(result.duplicateProjectRemaps).toEqual([
      { duplicateId: "project-2", canonicalId: "project-1" }
    ]);
  });

  it("also dedupes built-in projects accidentally saved as custom", () => {
    const result = dedupeDefaultProjects(
      [
        project({ id: "project-1", type: "annual_leave" }),
        project({ id: "project-2", type: "custom" })
      ],
      []
    );

    expect(result.projects).toHaveLength(1);
    expect(result.duplicateProjectRemaps).toEqual([
      { duplicateId: "project-2", canonicalId: "project-1" }
    ]);
  });

  it("keeps ordinary custom projects", () => {
    const result = dedupeDefaultProjects(
      [
        project({ id: "custom-1", name: "病假", type: "custom" }),
        project({ id: "custom-2", name: "病假", type: "custom" })
      ],
      []
    );

    expect(result.projects.map((item) => item.id)).toEqual(["custom-1", "custom-2"]);
    expect(result.duplicateProjectRemaps).toEqual([]);
  });
});
