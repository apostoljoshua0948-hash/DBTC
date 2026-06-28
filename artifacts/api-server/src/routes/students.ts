import { Router } from "express";
import { db, studentsTable, insertStudentSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/students", async (req, res) => {
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
      .where(eq(studentsTable.studentNo, req.params.studentNo));
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post("/students", async (req, res) => {
  const parsed = insertStudentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const [student] = await db.insert(studentsTable).values(parsed.data).returning();
    res.status(201).json(student);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Student number already exists" });
    req.log.error(err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

router.delete("/students/:studentNo", async (req, res) => {
  try {
    await db.delete(studentsTable).where(eq(studentsTable.studentNo, req.params.studentNo));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
