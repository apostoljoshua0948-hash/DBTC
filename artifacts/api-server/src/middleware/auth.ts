import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    adminUsername?: string;
    isSuperAdmin?: boolean;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  next();
}
