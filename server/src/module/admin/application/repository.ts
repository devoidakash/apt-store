import pool from "../../../infra/database/db";
import toCamelCase from "../../../utils/to-camel-case";

export async function fetchApplications(applicationStatus: string) {
  const result = await pool.query(
    `
    SELECT id, package_name, display_name, version, category, status
    FROM applications
    WHERE status = $1
  `,
    [applicationStatus],
  );
  return result.rows.map(toCamelCase);
}

export async function fetchApplicationById(applicationId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM applications
    WHERE id = $1
  `,
    [applicationId],
  );

  return toCamelCase(result.rows[0]);
}
