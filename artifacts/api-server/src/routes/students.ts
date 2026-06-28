import { Router } from "express";
import { db, studentsTable, insertStudentSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/students", requireAdmin, async (req, res) => {
  try {
    const students = await db.select().from(studentsTable).orderBy(studentsTable.name);
    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.get("/students/:studentNo", async (req, res) => {
  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.studentNo, String(req.params.studentNo)));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(student);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post("/students", requireAdmin, async (req, res) => {
  const parsed = insertStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  try {
    const [student] = await db.insert(studentsTable).values(parsed.data).returning();
    res.status(201).json(student);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      res.status(409).json({ error: "Student number already exists" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

router.delete("/students/:studentNo", requireAdmin, async (req, res) => {
  try {
    await db.delete(studentsTable).where(eq(studentsTable.studentNo, String(req.params.studentNo)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
