import pool from "../../infra/database/db";
import toCamelCase from "../../utils/to-camel-case";

export async function fetchApplications() {
  const result = await pool.query(`
    SELECT id, display_name, maintainer, caption, version, icon_updated_at
    FROM applications
    WHERE status = 'live'`);
  return result.rows.map(toCamelCase);
}

export async function fetchApplicationById(applicationId: string) {
  const result = await pool.query(
    `
    SELECT id, icon_updated_at, display_name, package_name, maintainer, version, download_size_bytes, installed_size_bytes, description, images, homepage, category
    FROM applications
    WHERE id = $1
    AND status = 'live'`,
    [applicationId],
  );

  return toCamelCase(result.rows[0]);
}
