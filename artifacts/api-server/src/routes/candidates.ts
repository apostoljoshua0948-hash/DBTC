import { Router } from "express";
import { db, candidatesTable, insertCandidateSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

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

router.post("/candidates", requireAdmin, async (req, res) => {
  const parsed = insertCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  try {
    const [candidate] = await db.insert(candidatesTable).values(parsed.data).returning();
    res.status(201).json(candidate);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add candidate" });
  }
});

router.delete("/candidates/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(candidatesTable).where(eq(candidatesTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

export default router;
