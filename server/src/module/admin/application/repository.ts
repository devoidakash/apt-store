import pool from "../../../infra/database/db";
import toCamelCase from "../../../utils/to-camel-case";
import type { ApplicationStatus, UpdateApplicationData } from "./schema";

export async function fetchApplications(applicationStatus: string) {
  const result = await pool.query(
    `
    SELECT id, package_name, display_name, maintainer, caption, icon_updated_at, status
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
  return await pool.query(
    `
      UPDATE applications
      SET display_name = $2,
          caption = $3,
          description = $4,
          category = $5,
          homepage = $6,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      applicationId,
      data.displayName,
      data.caption,
      data.description,
      data.category,
      data.homepage,
    ],
  );
}

export async function updateApplicationIcon(applicationId: string) {
  return await pool.query(
    `
      UPDATE applications
      SET icon_updated_at = now()
      WHERE id = $1
    `,
    [applicationId],
  );
}

export async function updateApplicationImages(
  applicationId: string,
  images: string[],
) {
  return await pool.query(
    `
      UPDATE applications
      SET images = $2, updated_at = now()
      WHERE id = $1
    `,
    [applicationId, images],
  );
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  return await pool.query(
    `
      UPDATE applications
      SET status = $2, updated_at = now()
      WHERE id = $1
    `,
    [applicationId, status],
  );
}
