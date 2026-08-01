import { Router } from "express";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// In-memory election state — persists while server is running
let votingOpen = false;

router.get("/settings/voting-status", (_req, res) => {
  res.json({ votingOpen });
});

router.put("/settings/voting-status", requireAdmin, (req, res) => {
  const { votingOpen: newState } = req.body;
  if (typeof newState !== "boolean") {
    res.status(400).json({ error: "votingOpen must be a boolean" });
    return;
  }
  votingOpen = newState;
  res.json({ votingOpen });
});

export { votingOpen };
export default router;
