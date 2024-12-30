import { Pool } from "pg";

import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool(
    {
        connectionString: "postgresql://sahu:sahu@db:5432/miloDB"        
    }
);

export const db = drizzle(pool); 
