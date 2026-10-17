import pool from "../../infra/database/db";
import toCamelCase from "../../utils/to-camel-case";

export async function fetchApplications() {
  const result = await pool.query(`
    SELECT id, display_name, maintainer, caption, version, icon_updated_at
    FROM applications
    WHERE status = 'live'`);
  return result.rows.map(toCamelCase);
}
