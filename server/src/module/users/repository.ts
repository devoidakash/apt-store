import pool from "../../infra/database/db";

export async function fetchApplications() {
  const result = await pool.query(`
    SELECT
      id,
      display_name AS "displayName",
      package_name AS "packageName",
      maintainer,
      caption,
      version,
      icon_updated_at AS "iconUpdatedAt"
    FROM applications
    WHERE status = 'live'`);
  return result.rows;
}

export async function fetchApplicationById(applicationId: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      icon_updated_at AS "iconUpdatedAt",
      display_name AS "displayName",
      package_name AS "packageName",
      maintainer,
      version,
      download_size_in_bytes AS "downloadSizeInBytes",
      installed_size_in_bytes AS "installedSizeInBytes",
      description,
      images,
      homepage_uri AS homepage,
      category
    FROM applications
    WHERE id = $1
    AND status = 'live'`,
    [applicationId],
  );

  return result.rows[0];
}
