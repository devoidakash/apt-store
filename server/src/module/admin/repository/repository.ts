import type { PoolClient } from "pg";
import toCamelCase from "../../../utils/to-camel-case";
import pool from "../../../infra/database/db";

export async function fetchRepositories() {
  const result = await pool.query(`
  SELECT id , name
  FROM repositories
  `);
  return result.rows;
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
  description: string;
  version: string;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  homepage: string;
  maintainer: string;
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
