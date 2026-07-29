import { defineConfig } from "drizzle-kit";
import path from "path";

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL must be set. Add your Neon connection string as a Replit secret.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
