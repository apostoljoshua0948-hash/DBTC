import { defineConfig } from "drizzle-kit";
import path from "path";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_2wRTupVt3mMn@ep-restless-sky-aw6v0xj5-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
