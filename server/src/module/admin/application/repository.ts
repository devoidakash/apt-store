import pool from "../../../infra/database/db";
import toCamelCase from "../../../utils/to-camel-case";
import type { ApplicationStatus, UpdateApplicationData } from "./schema";

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

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationData,
) {
  const result = await pool.query(
    `
      UPDATE applications
      SET display_name = $2,
          description = $3,
          category = $4,
          homepage = $5,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      applicationId,
      data.displayName,
      data.description,
      data.category,
      data.homepage,
    ],
  );

  return toCamelCase(result.rows[0]);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const result = await pool.query(
    `
      UPDATE applications
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [applicationId, status],
  );

  return toCamelCase(result.rows[0]);
}
