import compareDpkgVersions from "dpkg-compare-versions";
import { type PoolClient } from "pg";
import ApiError from "../../../err/api-error";
import pool from "../../../infra/database/db";
import withTransaction from "../../../utils/with-transaction";
import * as repository from "./repository";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

export async function getRepositories() {
  return repository.fetchRepositories();
}

interface createRepositoryData {
  name: string;
  packageName: Array<string>;
  uri: string;
  suite: string;
  component: string;
  architecture: string;
  signedBy: string;
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

interface latestApplication {
  packageName: string;
  description: string;
  version: string;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  homepage: string;
  maintainer: string;
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
    maintainer: (latestPackage.Maintainer ?? null)
      .replace(/\s*<[^>]*>/, "")
      .trim(),
  };

  return application;
}

export async function createRepository(data: createRepositoryData) {
  const url = `${data.uri}/dists/${data.suite}/${data.component}/binary-${data.architecture}/Packages.gz`;
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
  const text = decompressed.toString("utf8");

  const packages = getPackagesObject(text);
  const application = getLatestApplication(data.packageName[0], packages);
  if (!application) {
    throw new ApiError({
      statusCode: 404,
      message: "Package not found in repository",
      code: "PACKAGE_NOT_FOUND",
    });
  }

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
