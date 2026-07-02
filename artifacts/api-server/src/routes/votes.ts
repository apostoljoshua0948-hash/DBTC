import { Router } from "express";
import { db, studentsTable, candidatesTable, votesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/votes", async (req, res) => {
  const { studentNo, votes } = req.body as { studentNo: string; votes: { candidateId: number; position: string }[] };

  if (!studentNo || !Array.isArray(votes) || votes.length === 0) {
    res.status(400).json({ error: "Missing studentNo or votes" });
    return;
  }

  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.studentNo, studentNo));
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }
    if (student.hasVoted) { res.status(409).json({ error: "Student has already voted" }); return; }

    await db.transaction(async (tx) => {
      for (const v of votes) {
        const [candidate] = await tx.select().from(candidatesTable).where(eq(candidatesTable.id, v.candidateId));
        if (!candidate || candidate.position !== v.position) {
          throw new Error(`Invalid candidate ${v.candidateId} for position ${v.position}`);
        }
        await tx.insert(votesTable).values({ studentId: student.id, candidateId: v.candidateId, position: v.position });
      }
      await tx.update(studentsTable).set({ hasVoted: true }).where(eq(studentsTable.id, student.id));
    });

    res.json({ ok: true, message: "Vote recorded successfully" });
  } catch (err: unknown) {
    req.log.error(err);
    const msg = err instanceof Error ? err.message : "Failed to record vote";
    res.status(500).json({ error: msg });
  }
});

router.delete("/votes/:studentNo", requireAdmin, async (req, res) => {
  try {
    const studentNo = String(req.params.studentNo);
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.studentNo, studentNo));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    await db.transaction(async (tx) => {
      await tx.delete(votesTable).where(eq(votesTable.studentId, student.id));
      await tx.update(studentsTable).set({ hasVoted: false }).where(eq(studentsTable.id, student.id));
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reset vote" });
  }
});

router.get("/results", async (req, res) => {
  try {
    const results = await db
      .select({
        candidateId: votesTable.candidateId,
        position: votesTable.position,
        candidateName: candidatesTable.name,
        voteCount: sql<number>`cast(count(*) as int)`,
      })
      .from(votesTable)
      .leftJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .groupBy(votesTable.candidateId, votesTable.position, candidatesTable.name)
      .orderBy(votesTable.position, sql`count(*) desc`);

    const totalVoters = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(studentsTable)
      .where(eq(studentsTable.hasVoted, true));

    const totalStudents = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(studentsTable);

    res.json({ results, totalVoted: totalVoters[0]?.count ?? 0, totalStudents: totalStudents[0]?.count ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
