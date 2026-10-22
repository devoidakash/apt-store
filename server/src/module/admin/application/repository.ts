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
  repositoryId: string;
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
      r.id AS "repositoryId",
      a.id,
      a.display_name AS "displayName",
      a.source_type AS "sourceType",
      a.version,
      a.maintainer,
      a.caption,
      a.description,
      a.icon_updated_at AS "iconUpdatedAt",
      a.images,
      a.category,
      a.homepage_uri AS "homepageUri",
      a.download_size_in_bytes AS "downloadSizeInBytes",
      a.installed_size_in_bytes AS "installedSizeInBytes",
      a.status,
      a.created_at AS "createdAt",
      a.updated_at AS "updatedAt"
    FROM applications a
    JOIN repositories r ON a.id = r.application_id
    WHERE a.id = $1
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
