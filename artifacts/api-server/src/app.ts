import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    secret: process.env["SESSION_SECRET"] ?? "owyeah",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

const publicDir = path.join(__dirname, "..", "public");

// ── Clean URL routes (no .html extension) ──
const CLEAN_URLS: Record<string, string> = {
  "/myqr":          "myqr.html",
  "/scan":          "scan.html",
  "/results":       "results.html",
  "/admin":         "admin.html",
  "/officers":      "officers.html",
  "/announcements": "announcements.html",
  "/events":        "events.html",
  "/contact":       "contact.html",
};

const noCache = (res: import("express").Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

for (const [route, file] of Object.entries(CLEAN_URLS)) {
  app.get(route, (_req, res) => {
    noCache(res);
    res.sendFile(path.join(publicDir, file));
  });
}

app.use(express.static(publicDir, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  },
}));

app.get("/", (_req, res) => {
  noCache(res);
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
