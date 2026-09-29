import { describe, expect, test } from "bun:test";
import { calculateResults } from "@/lib/result-calculations";

describe("Md School official ranking", () => {
  test("uses dense ranking 1,1,2 and stops official top ranks at five", () => {
    const students = [98, 98, 97, 96, 95, 94, 93].map((total, index) => ({
      id: String(index + 1),
      full_name: `طالب ${index + 1}`,
      student_number: index + 1,
    }));
    const subjects = [{ id: "s1", name: "المادة", sort_order: 1 }];
    const scores = students.flatMap((student, index) => {
      const total = [98, 98, 97, 96, 95, 94, 93][index]!;
      const first = Math.floor(total / 2);
      const second = total - first;
      return [
        { student_id: student.id, subject_id: "s1", term: "first" as const, exam_score: first, coursework_score: 0 },
        { student_id: student.id, subject_id: "s1", term: "second" as const, exam_score: second, coursework_score: 0 },
      ];
    });
    const results = calculateResults(students, subjects, scores, "final", 50, 25);
    expect(results.filter((r) => r.isTopFive).map((r) => r.rank)).toEqual([1, 1, 2, 3, 4, 5]);
    expect(results.find((r) => r.student.id === "7")?.isTopFive).toBe(false);
    expect(results.find((r) => r.student.id === "7")?.passed).toBe(true);
  });
});
