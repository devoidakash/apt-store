import type { PoolClient } from "pg";
import toCamelCase from "../../../utils/to-camel-case";
import pool from "../../../infra/database/db";

export async function fetchRepositories() {
  const result = await pool.query(`
  SELECT r.id , r.name, a.id AS application_id, a.icon_updated_at, a.maintainer
  FROM repositories r
  JOIN applications a ON r.id = a.repository_id
  WHERE a.package_name = ANY(r.package_name)
  `);
  return result.rows.map(toCamelCase);
}

export async function fetchRepositoryById(repositoryId: string) {
  const result = await pool.query(
    `
      SELECT r.*, a.id AS application_id, a.icon_updated_at
      FROM repositories r
      LEFT JOIN applications a ON r.id = a.repository_id
      WHERE r.id = $1
    `,
    [repositoryId],
  );

  return toCamelCase(result.rows[0]);
}

interface RepositoryData {
  name: string;
  packageName: Array<string>;
  uri: string;
  suite: string;
  component: string;
  architecture: string;
  signedBy: string;
}

interface ApplicationData {
  repositoryId: string;
  packageName: string;
  description: string | null;
  version: string;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  homepage: string | null;
  maintainer: string | null;
}

export async function insertIntoRepository(
  client: PoolClient,
  data: RepositoryData,
): Promise<Record<string, unknown> | null> {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO repositories (
        name, package_name, uri, suite, component, architecture, signedBy
      )
      VALUES ($1, $2::text[], $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      data.name,
      data.packageName,
      data.uri,
      data.suite,
      data.component,
      data.architecture,
      data.signedBy,
    ],
  );

  return toCamelCase(result.rows[0]);
}

export async function updateRepository(
  client: PoolClient,
  repositoryId: string,
  data: RepositoryData,
): Promise<Record<string, unknown> | null> {
  const result = await client.query(
    `
      UPDATE repositories
      SET
        name = $2,
        package_name = $3::text[],
        uri = $4,
        suite = $5,
        component = $6,
        architecture = $7,
        signedBy = $8,
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      repositoryId,
      data.name,
      data.packageName,
      data.uri,
      data.suite,
      data.component,
      data.architecture,
      data.signedBy,
    ],
  );

  return toCamelCase(result.rows[0]);
}

export async function insertIntoApplications(
  client: PoolClient,
  data: ApplicationData,
): Promise<void> {
  await client.query(
    `
      INSERT INTO applications (
        repository_id,
        package_name,
        description,
        version,
        download_size_bytes,
        installed_size_bytes,
        homepage,
        maintainer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (repository_id, package_name)
      DO UPDATE SET
        version = EXCLUDED.version,
        download_size_bytes = EXCLUDED.download_size_bytes,
        installed_size_bytes = EXCLUDED.installed_size_bytes,
        missing_since = NULL,
        updated_at = now()
    `,
    [
      data.repositoryId,
      data.packageName,
      data.description,
      data.version,
      data.downloadSizeBytes,
      data.installedSizeBytes,
      data.homepage,
      data.maintainer,
    ],
  );
}
