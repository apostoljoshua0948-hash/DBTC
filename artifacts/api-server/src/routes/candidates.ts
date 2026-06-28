import { Router } from "express";
import { db, candidatesTable, insertCandidateSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/candidates", async (req, res) => {
  try {
    const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.position, candidatesTable.name);
    res.json(candidates);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

router.post("/candidates", async (req, res) => {
  const parsed = insertCandidateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const [candidate] = await db.insert(candidatesTable).values(parsed.data).returning();
    res.status(201).json(candidate);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add candidate" });
  }
});

router.delete("/candidates/:id", async (req, res) => {
  try {
    await db.delete(candidatesTable).where(eq(candidatesTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

export default router;
