import pool from "../../../infra/database/db";
import type { ApplicationStatus, UpdateApplicationData } from "./schema";

export async function fetchApplications(applicationStatus: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      package_name AS "packageName",
      display_name AS "displayName",
      maintainer,
      caption,
      icon_updated_at AS "iconUpdatedAt",
      status
    FROM applications
    WHERE status = $1
  `,
    [applicationStatus],
  );
  return result.rows;
}

export async function fetchApplicationById(applicationId: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      display_name AS "displayName",
      source_type AS "sourceType",
      version,
      maintainer,
      caption,
      description,
      icon_updated_at AS "iconUpdatedAt",
      images,
      category,
      homepage_uri AS homepage,
      download_size_in_bytes AS "downloadSizeInBytes",
      installed_size_in_bytes AS "installedSizeInBytes",
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM applications
    WHERE id = $1
  `,
    [applicationId],
  );

  return result.rows[0];
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
