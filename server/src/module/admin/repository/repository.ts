import type { PoolClient } from "pg";
import pool from "../../../infra/database/db";
import { LatestApplication } from "./helpers/apt-metadata";
import { CreateRepositoryType } from "./schema";

// Types and interfaces
interface RepositoryCardData {
  id: string;
  applicationId: string;
  displayName: string;
  iconUpdatedAt: Date | null;
  maintainer: string | null;
}

interface RepositoryDetails {
  id: string;
  applicationId: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  keyUri: string;
  keyContent: string;
  fingerprint: string;
  createdAt: Date;
  updatedAt: Date;
  iconUpdatedAt: Date | null;
}

export interface ApplicationData extends LatestApplication {
  displayName: string;
}

interface CreateRepositoryData extends CreateRepositoryType {
  applicationId: string;
  keyContent: string;
}

interface UpdateApplication extends ApplicationData {
  applicationId: string;
  displayName: string;
}

interface UpdateRepositoryData {
  repositoryId: string;
  data: CreateRepositoryType;
  keyContent: string;
}

// Functions
export async function fetchRepositories(): Promise<RepositoryCardData[]> {
  const result = await pool.query<RepositoryCardData>(`
    SELECT
      r.id,
      a.id AS "applicationId",
      a.display_name AS "displayName",
      a.icon_updated_at AS "iconUpdatedAt",
      a.maintainer
    FROM repositories r
    JOIN applications a ON r.application_id = a.id
  `);

  return result.rows;
}

export async function fetchRepositoryById(
  repositoryId: string,
): Promise<RepositoryDetails | undefined> {
  const result = await pool.query<RepositoryDetails>(
    `
      SELECT
        a.display_name as "displayName",
        a.icon_updated_at AS "iconUpdatedAt",
        r.id,
        r.application_id AS "applicationId",
        r.package_name AS "packageName",
        r.uri,
        r.suite,
        r.component,
        r.key_uri AS "keyUri",
        r.key_content AS "keyContent",
        r.fingerprint,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
      FROM repositories r
      JOIN applications a ON r.application_id = a.id
      WHERE r.id = $1
    `,
    [repositoryId],
  );

  return result.rows[0];
}

export async function insertIntoApplications(
  client: PoolClient,
  data: ApplicationData,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO applications (
        display_name,
        source_type,
        version,
        maintainer,
        description,
        download_size_in_bytes,
        installed_size_in_bytes,
        homepage_uri
      )
      VALUES ($1, 'repository', $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      data.displayName,
      data.version,
      data.maintainer,
      data.description,
      data.downloadSizeInBytes,
      data.installedSizeInBytes,
      data.homepageUri,
    ],
  );
  return result.rows[0].id;
}

export async function insertIntoRepository(
  client: PoolClient,
  data: CreateRepositoryData,
): Promise<{ id: string }> {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO repositories (
        application_id, package_name, uri, suite, component,
        key_uri, key_content, fingerprint
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      data.applicationId,
      data.packageName,
      data.uri,
      data.suite,
      data.component,
      data.key_uri,
      data.keyContent,
      data.fingerprint,
    ],
  );

  return result.rows[0];
}

export async function updateApplicationById(
  client: PoolClient,
  data: UpdateApplication,
): Promise<void> {
  await client.query(
    `
      UPDATE applications
      SET
        display_name = $2,
        version = $3,
        maintainer = $4,
        description = $5,
        download_size_in_bytes = $6,
        installed_size_in_bytes = $7,
        homepage_uri = $8,
        updated_at = now()
      WHERE id = $1
    `,
    [
      data.applicationId,
      data.displayName,
      data.version,
      data.maintainer,
      data.description,
      data.downloadSizeInBytes,
      data.installedSizeInBytes,
      data.homepageUri,
    ],
  );
}

export async function updateRepository(
  client: PoolClient,
  data: UpdateRepositoryData,
): Promise<{ id: string }> {
  const result = await client.query<{ id: string }>(
    `
      UPDATE repositories
      SET
        package_name = $2,
        uri = $3,
        suite = $4,
        component = $5,
        key_uri = $6,
        key_content = $7,
        fingerprint = $8,
        updated_at = now()
      WHERE id = $1
      RETURNING id
    `,
    [
      data.repositoryId,
      data.data.packageName,
      data.data.uri,
      data.data.suite,
      data.data.component,
      data.data.key_uri,
      data.keyContent,
      data.data.fingerprint,
    ],
  );

  return result.rows[0];
}
