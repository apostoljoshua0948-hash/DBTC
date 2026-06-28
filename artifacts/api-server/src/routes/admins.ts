import { Router } from "express";
import { db, adminsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/admins", requireAdmin, async (req, res) => {
  try {
    const admins = await db.select({
      id: adminsTable.id,
      username: adminsTable.username,
      isApproved: adminsTable.isApproved,
      isSuperAdmin: adminsTable.isSuperAdmin,
      createdAt: adminsTable.createdAt,
    }).from(adminsTable).orderBy(adminsTable.createdAt);
    res.json(admins);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch admins." });
  }
});

router.patch("/admins/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [admin] = await db.update(adminsTable).set({ isApproved: true }).where(eq(adminsTable.id, id)).returning();
    if (!admin) { res.status(404).json({ error: "Admin not found." }); return; }
    res.json({ ok: true, admin });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve admin." });
  }
});

router.delete("/admins/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.adminId) {
    res.status(400).json({ error: "You cannot delete your own account." });
    return;
  }
  try {
    await db.delete(adminsTable).where(eq(adminsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete admin." });
  }
});

export default router;
