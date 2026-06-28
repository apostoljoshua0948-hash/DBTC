import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, adminsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  if (typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters." });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }
  try {
    const [{ total }] = await db.select({ total: count() }).from(adminsTable);
    const isFirst = Number(total) === 0;
    const passwordHash = await bcrypt.hash(password, 10);
    const [admin] = await db.insert(adminsTable).values({
      username: username.trim().toLowerCase(),
      passwordHash,
      isApproved: isFirst,
      isSuperAdmin: isFirst,
    }).returning();
    if (isFirst) {
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      req.session.isSuperAdmin = true;
    }
    res.status(201).json({ ok: true, pending: !isFirst, isFirst });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Username already taken. Please choose another." });
    } else {
      req.log.error(err);
      res.status(500).json({ error: "Registration failed." });
    }
  }
});

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, String(username).trim().toLowerCase()));
    if (!admin) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }
    const ok = await bcrypt.compare(String(password), admin.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }
    if (!admin.isApproved) {
      res.status(403).json({ error: "Your account is pending approval by an existing admin." });
      return;
    }
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.isSuperAdmin = admin.isSuperAdmin;
    res.json({ ok: true, username: admin.username, isSuperAdmin: admin.isSuperAdmin });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session?.adminId) {
    res.status(401).json({ error: "Not logged in." });
    return;
  }
  res.json({ adminId: req.session.adminId, username: req.session.adminUsername, isSuperAdmin: req.session.isSuperAdmin });
});

export default router;
