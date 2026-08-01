import { Router } from "express";
import { db, commentsTable, studentsTable, candidatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// GET all comments for a candidate
router.get("/candidates/:id/comments", async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId)) { res.status(400).json({ error: "Invalid candidate ID" }); return; }

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.candidateId, candidateId))
      .orderBy(commentsTable.createdAt);

    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST a comment — student identifies by student number
router.post("/candidates/:id/comments", async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId)) { res.status(400).json({ error: "Invalid candidate ID" }); return; }

    const { studentNo, content } = req.body;
    if (!studentNo || typeof studentNo !== "string") {
      res.status(400).json({ error: "Student number is required" }); return;
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "Comment cannot be empty" }); return;
    }
    if (content.trim().length > 300) {
      res.status(400).json({ error: "Comment is too long (max 300 characters)" }); return;
    }

    // Verify candidate exists
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, candidateId));
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

    // Verify student exists
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.studentNo, studentNo.trim()));
    if (!student) { res.status(404).json({ error: "Student not found. Check your student number." }); return; }

    // One comment per student per candidate
    const existing = await db
      .select()
      .from(commentsTable)
      .where(and(eq(commentsTable.candidateId, candidateId), eq(commentsTable.studentNo, student.studentNo)));
    if (existing.length > 0) {
      res.status(409).json({ error: "You have already commented on this candidate." }); return;
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({ candidateId, studentNo: student.studentNo, studentName: student.name, content: content.trim() })
      .returning();

    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// DELETE a comment — admin only
router.delete("/comments/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid comment ID" }); return; }
    await db.delete(commentsTable).where(eq(commentsTable.id, id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
