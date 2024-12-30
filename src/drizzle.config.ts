import {defineConfig} from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        host: "localhost",
        port: 5432,
        database: "miloDB",
        user: "sahu",
        password: "sahu",
        ssl: false,
    }
})