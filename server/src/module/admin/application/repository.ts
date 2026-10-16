import pool from "../../../infra/database/db";

export async function fetchApplications(applicationStatus: string) {
  const result = await pool.query(
    `
    SELECT id, package_name, display_name, version, category, status
    FROM applications
    WHERE status = $1
  `,
    [applicationStatus],
  );
  return result.rows;
}
