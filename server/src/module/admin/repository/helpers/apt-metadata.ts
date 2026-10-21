import { parse } from "debian-control";
import compareDpkgVersions from "dpkg-compare-versions";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";
import ApiError from "../../../../err/api-error";
import REPOSITORY_ERRORS from "../error";
import { CreateRepositoryType } from "../schema";

// Types
export type LatestApplication = {
  packageName: string;
  version: string;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  description: string | null;
  homepageUri: string | null;
  maintainer: string | null;
};

export type Package = {
  Package: string;
  Version: string;
  Size?: string | null;
  "Installed-Size"?: string | null;
  Description?: string[] | null;
  Homepage?: string | null;
  Maintainer?: string | null;
  [key: string]: string | string[] | null | undefined;
};

// Functions
export async function processRepositoryMetadata(
  data: CreateRepositoryType,
): Promise<LatestApplication> {
  const packages = await fetchRepositoryMetadata(data);
  return findLatestApplication(data.packageName, packages);
}

async function fetchRepositoryMetadata(
  data: CreateRepositoryType,
): Promise<Package[]> {
  const url = `${data.uri}/dists/${encodeURIComponent(data.suite)}/${encodeURIComponent(data.component)}/binary-amd64/Packages.gz`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!res.ok) {
    throw new ApiError({
      statusCode: res.status,
      message: "Failed to fetch repository URIs",
      code: "REPOSITORY_URI_FETCH_FAILED",
    });
  }

  const compressed = Buffer.from(await res.arrayBuffer());
  const gunzipAsync = promisify(gunzip);
  const decompressed = await gunzipAsync(compressed);
  const text = decompressed.toString("utf8");
  const packages = text
    .trim()
    .split(/\r?\n[ \t]*\r?\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => parse(paragraph));

  return packages;
}

function findLatestApplication(
  packageName: string,
  packages: Package[],
): LatestApplication {
  let latestPackage: Package | undefined;

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
    throw new ApiError(REPOSITORY_ERRORS.LATEST_PACKAGE_NOT_FOUND);
  }

  return {
    packageName: latestPackage.Package,
    version: latestPackage.Version,
    downloadSizeBytes: Number.parseInt(latestPackage.Size ?? "0", 10),
    installedSizeBytes:
      Number.parseInt(latestPackage["Installed-Size"] ?? "0", 10) * 1024,
    description: latestPackage.Description?.[0] ?? null,
    homepageUri: latestPackage.Homepage ?? null,
    maintainer:
      latestPackage.Maintainer?.replace(/\s*<[^>]*>/, "").trim() || null,
  };
}
