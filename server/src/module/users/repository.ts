import pool from "../../infra/database/db";
import { ApplicationId } from "./schema";

// Types and interface
interface ApplicationCardData {
  id: string;
  displayName: string;
  maintainer: string;
  caption: string;
  iconUpdatedAt: Date;
}

interface ApplicationDetails {
  id: string;
  displayName: string;
  sourceType: string;
  maintainer: string;
  caption: string;
  iconUpdatedAt: Date;
  images: string[];
  packageName: string;
  version: string;
  description: string;
  homepage: string;
  category: string;
}

interface RepositoryData {
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  keyContent: string;
}

// Functions
export async function fetchApplications(): Promise<ApplicationCardData[]> {
  const result = await pool.query<ApplicationCardData>(`
    SELECT
      id,
      display_name AS "displayName",
      maintainer,
      caption,
      icon_updated_at AS "iconUpdatedAt"
    FROM applications
    WHERE status = 'published'`);
  return result.rows;
}

export async function fetchApplicationById(
  applicationId: ApplicationId,
): Promise<ApplicationDetails> {
  const result = await pool.query<ApplicationDetails>(
    `
    SELECT
      id,
      icon_updated_at AS "iconUpdatedAt",
      display_name AS "displayName",
      source_type AS sourceType
      maintainer,
      version,
      download_size_in_bytes AS "downloadSizeInBytes",
      installed_size_in_bytes AS "installedSizeInBytes",
      description,
      images,
      homepage_uri AS homepageUri,
      category
    FROM applications
    WHERE id = $1
    AND status = 'published'`,
    [applicationId],
  );

  return result.rows[0];
}

export async function fetchRepositoryByAppId(
  applicationId: ApplicationId,
): Promise<RepositoryData> {
  const result = await pool.query<RepositoryData>(
    `
  SELECT
  package_name AS packageName,
  uri,
  suite,
  component,
  key_content AS keyContent
  WHERE applicationId = $1`,
    [applicationId],
  );
  return result.rows[0];
}
