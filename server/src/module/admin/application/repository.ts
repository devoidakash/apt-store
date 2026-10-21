import pool from "../../../infra/database/db";
import type {
  ApplicationId,
  ApplicationStatus,
  UpdateApplication,
} from "./schema";

// Types and interfaces
interface ApplicationCardData {
  id: string;
  displayName: string;
  maintainer: string | null;
  caption: string | null;
  iconUpdatedAt: Date | null;
  status: ApplicationStatus;
}

export interface ApplicationDetails {
  id: string;
  displayName: string;
  sourceType: string;
  version: string;
  maintainer: string | null;
  caption: string | null;
  description: string | null;
  iconUpdatedAt: Date | null;
  images: string[];
  category: string | null;
  homepageUri: string | null;
  downloadSizeInBytes: number;
  installedSizeInBytes: number;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Functions
export async function fetchApplications(
  applicationStatus: ApplicationStatus,
): Promise<ApplicationCardData[]> {
  const result = await pool.query<ApplicationCardData>(
    `
    SELECT
      id,
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

export async function fetchApplicationById(
  applicationId: ApplicationId,
): Promise<ApplicationDetails | undefined> {
  const result = await pool.query<ApplicationDetails>(
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
      homepage_uri AS homepageUri,
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
  data: UpdateApplication,
) {
  const result = await pool.query(
    `
      UPDATE applications
      SET display_name = $2,
          caption = $3,
          description = $4,
          category = $5,
          homepage_uri = $6,
          updated_at = now()
      WHERE id = $1
      RETURNING id
    `,
    [
      applicationId,
      data.displayName,
      data.caption,
      data.description,
      data.category,
      data.homepageUri,
    ],
  );
  return result.rows[0];
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
  applicationId: ApplicationId,
  images: string[],
) {
  return pool.query(
    `
      UPDATE applications
      SET images = $2, updated_at = now()
      WHERE id = $1
    `,
    [applicationId, images],
  );
}

export async function updateApplicationStatus(
  applicationId: ApplicationId,
  status: ApplicationStatus,
) {
  return pool.query(
    `
      UPDATE applications
      SET status = $2, updated_at = now()
      WHERE id = $1
    `,
    [applicationId, status],
  );
}
