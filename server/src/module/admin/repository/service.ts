import compareDpkgVersions from "dpkg-compare-versions";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";
import { type PoolClient } from "pg";
import env from "../../../config/env";
import ApiError from "../../../err/api-error";
import ERROR_CODES from "../../../err/error-code";
import pool from "../../../infra/database/db";
import withTransaction from "../../../utils/with-transaction";
import * as repository from "./repository";
import { createRepositoryData } from "./schema";

function getIcon(applicationId: string, iconUpdatedAt: Date | null) {
  return iconUpdatedAt
    ? `${env.r2PublicUrl}/applications/${applicationId}/icon.webp?v=${iconUpdatedAt.getTime()}`
    : null;
}

export async function getRepositories() {
  const repositories = await repository.fetchRepositories();
  return repositories
    .filter((repo) => repo !== null)
    .map((repo) => ({
      ...repo,
      icon: getIcon(
        String(repo.applicationId),
        repo.iconUpdatedAt instanceof Date ? repo.iconUpdatedAt : null,
      ),
    }));
}

export async function getRepositoryById(repositoryId: string) {
  const result = await repository.fetchRepositoryById(repositoryId);
  if (!result) {
    throw new ApiError(ERROR_CODES.REPOSITORY_NOT_FOUND);
  }
  return {
    ...result,
    icon: getIcon(
      String(result.applicationId),
      result.iconUpdatedAt instanceof Date ? result.iconUpdatedAt : null,
    ),
  };
}

function getPackagesObject(text: string): Record<string, string>[] {
  const objects: Record<string, string>[] = [];
  let currentObject: Record<string, string> = {};
  let currentKey: string | undefined;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      if (Object.keys(currentObject).length > 0) {
        objects.push(currentObject);
        currentObject = {};
      }
      currentKey = undefined;
      continue;
    }

    if (/^[ \t]/.test(line) && currentKey) {
      currentObject[currentKey] += `\n${line.slice(1)}`;
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    currentKey = line.slice(0, separator);
    currentObject[currentKey] = line.slice(separator + 1).trimStart();
  }

  if (Object.keys(currentObject).length > 0) {
    objects.push(currentObject);
  }
  return objects;
}

async function getRepositoryMetadata(
  data: createRepositoryData,
): Promise<string> {
  const url = `${data.uri}/dists/${encodeURIComponent(data.suite)}/${encodeURIComponent(data.component)}/binary-${encodeURIComponent(data.architecture)}/Packages.gz`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!res.ok) {
    throw new ApiError({
      statusCode: res.status,
      message: "Repository request failed",
      code: "REPOSITORY_REQUEST_FAILED",
    });
  }

  const gunzipAsync = promisify(gunzip);

  const compressed = Buffer.from(await res.arrayBuffer());
  const decompressed = await gunzipAsync(compressed);
  return decompressed.toString("utf8");
}

interface latestApplication {
  packageName: string;
  description: string | null;
  version: string;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  homepage: string | null;
  maintainer: string | null;
}

function getLatestApplication(
  packageName: string,
  packages: Record<string, string>[],
): latestApplication | null {
  let latestPackage: Record<string, string> | undefined;

  for (const pkg of packages) {
    if (pkg.Package !== packageName || !pkg.Version) {
      continue;
    }

    if (
      !latestPackage ||
      compareDpkgVersions(pkg.Version, latestPackage.Version) > 0
    ) {
      latestPackage = pkg;
    }
  }

  if (!latestPackage) {
    return null;
  }

  const application: latestApplication = {
    packageName: latestPackage.Package,
    description: latestPackage.Description ?? null,
    version: latestPackage.Version,
    downloadSizeBytes: Number.parseInt(latestPackage.Size ?? "0", 10),
    installedSizeBytes:
      Number.parseInt(latestPackage["Installed-Size"] ?? "0", 10) * 1024,
    homepage: latestPackage.Homepage ?? null,
    maintainer:
      latestPackage.Maintainer?.replace(/\s*<[^>]*>/, "").trim() || null,
  };

  return application;
}

async function getRepositoryApplication(
  data: createRepositoryData,
): Promise<latestApplication> {
  const packageName = data.packageName[0];
  if (!packageName) {
    throw new ApiError(ERROR_CODES.PACKAGE_NOT_FOUND);
  }

  const text = await getRepositoryMetadata(data);
  const packages = getPackagesObject(text);

  const application = getLatestApplication(packageName, packages);
  if (!application) {
    throw new ApiError(ERROR_CODES.PACKAGE_NOT_FOUND);
  }
  return application;
}

export async function createRepository(data: createRepositoryData) {
  const application = await getRepositoryApplication(data);

  return withTransaction(pool, async (client: PoolClient) => {
    const newRepository = await repository.insertIntoRepository(client, {
      ...data,
      packageName: data.packageName,
    });

    if (typeof newRepository?.id !== "string") {
      throw new Error("Repository ID is missing or invalid");
    }

    await repository.insertIntoApplications(client, {
      repositoryId: newRepository.id,
      ...application,
    });

    return newRepository;
  });
}

export async function updateRepository(
  repositoryId: string,
  data: createRepositoryData,
) {
  const application = await getRepositoryApplication(data);

  return withTransaction(pool, async (client: PoolClient) => {
    const newRepository = await repository.updateRepository(
      client,
      repositoryId,
      data,
    );

    if (typeof newRepository?.id !== "string") {
      throw new ApiError(ERROR_CODES.REPOSITORY_NOT_FOUND);
    }

    await repository.insertIntoApplications(client, {
      repositoryId: newRepository.id,
      ...application,
    });

    return newRepository;
  });
}
