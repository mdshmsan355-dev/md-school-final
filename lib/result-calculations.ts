export type ScoreEntry = {
  student_id: string;
  subject_id: string;
  term: "first" | "second";
  exam_score: number | null;
  coursework_score: number | null;
};

export type ResultStudent = { id: string; full_name: string; student_number: number; section_name?: string };
export type ResultSubject = { id: string; name: string; sort_order: number };

export type CalculatedResult = {
  student: ResultStudent;
  subjectScores: Array<{ subject: ResultSubject; score: number; passed: boolean; complete: boolean }>;
  total: number;
  maximum: number;
  percentage: number;
  passed: boolean;
  complete: boolean;
  rank: number;
  repeatedRank: boolean;
  isTopFive: boolean;
  failedSubjectCount: number;
};

export function calculateResults(
  students: ResultStudent[], subjects: ResultSubject[], scores: ScoreEntry[], period: "first" | "second" | "final", termMaximum: number, termPassMark: number,
): CalculatedResult[] {
  const requiredTerms: Array<"first" | "second"> = period === "final" ? ["first", "second"] : [period];
  const maximumPerSubject = termMaximum * requiredTerms.length;
  const passPerSubject = termPassMark * requiredTerms.length;
  const rows = students.map((student) => {
    const subjectScores = subjects.map((subject) => {
      const entries = scores.filter((entry) => entry.student_id === student.id && entry.subject_id === subject.id && requiredTerms.includes(entry.term));
      const byTerm = new Map(entries.map((entry) => [entry.term, entry]));
      const complete = requiredTerms.every((requiredTerm) => {
        const entry = byTerm.get(requiredTerm);
        return !!entry && entry.exam_score !== null && entry.coursework_score !== null;
      });
      const score = entries.reduce((sum, entry) => sum + (entry.exam_score ?? 0) + (entry.coursework_score ?? 0), 0);
      return { subject, score, passed: complete && score >= passPerSubject, complete };
    });
    const complete = subjectScores.length > 0 && subjectScores.every((item) => item.complete);
    const total = subjectScores.reduce((sum, item) => sum + item.score, 0);
    const maximum = maximumPerSubject * subjects.length;
    const failedSubjectCount = complete ? subjectScores.filter((item) => !item.passed).length : 0;
    return { student, subjectScores, total, maximum, percentage: maximum ? (total / maximum) * 100 : 0, passed: complete && failedSubjectCount === 0, complete, rank: 0, repeatedRank: false, isTopFive: false, failedSubjectCount };
  });

  // Dense ranking: 1, 1, 2, 3 ... (never 1, 1, 3).
  const ranked = rows.filter((row) => row.complete && row.passed).sort((a, b) => b.total - a.total || b.percentage - a.percentage || a.student.full_name.localeCompare(b.student.full_name, "ar"));
  let denseRank = 0;
  let previousTotal: number | null = null;
  for (const row of ranked) {
    if (previousTotal === null || row.total !== previousTotal) denseRank += 1;
    row.isTopFive = denseRank <= 5;
    row.rank = row.isTopFive ? denseRank : 0;
    previousTotal = row.total;
  }
  const rankCounts = new Map<number, number>();
  for (const row of ranked) rankCounts.set(row.rank, (rankCounts.get(row.rank) ?? 0) + 1);
  for (const row of ranked) row.repeatedRank = row.isTopFive && (rankCounts.get(row.rank) ?? 0) > 1;

  return rows.sort((a, b) => (a.rank || 999) - (b.rank || 999) || b.total - a.total || a.student.full_name.localeCompare(b.student.full_name, "ar"));
}
