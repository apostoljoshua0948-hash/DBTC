import { Router } from "express";
import { db, studentsTable, candidatesTable, votesTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [totalStudentsRow] = await db.select({ count: count() }).from(studentsTable);
    const [votedRow] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.hasVoted, true));
    const [candidatesRow] = await db.select({ count: count() }).from(candidatesTable);

    const positionRows = await db
      .select({ position: candidatesTable.position })
      .from(candidatesTable)
      .groupBy(candidatesTable.position);

    const byYearLevel = await db
      .select({
        yearLevel: studentsTable.yearLevel,
        total: count(),
        voted: sql<number>`cast(sum(case when ${studentsTable.hasVoted} then 1 else 0 end) as int)`,
      })
      .from(studentsTable)
      .groupBy(studentsTable.yearLevel)
      .orderBy(studentsTable.yearLevel);

    // Recent votes (last 10)
    const recentVotes = await db
      .select({
        studentName: studentsTable.name,
        position: votesTable.position,
        candidateName: candidatesTable.name,
        votedAt: votesTable.votedAt,
      })
      .from(votesTable)
      .leftJoin(studentsTable, eq(votesTable.studentId, studentsTable.id))
      .leftJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .orderBy(sql`${votesTable.votedAt} desc`)
      .limit(10);

    const totalStudents = Number(totalStudentsRow.count);
    const totalVoted = Number(votedRow.count);

    res.json({
      totalStudents,
      totalVoted,
      totalNotVoted: totalStudents - totalVoted,
      turnoutPercent: totalStudents > 0 ? Math.round((totalVoted / totalStudents) * 100) : 0,
      totalCandidates: Number(candidatesRow.count),
      totalPositions: positionRows.length,
      byYearLevel,
      recentVotes,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
