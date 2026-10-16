import { Pool } from "pg";
import env from "../../config/env";

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

export default pool;
