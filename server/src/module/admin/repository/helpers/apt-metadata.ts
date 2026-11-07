import { parse } from "debian-control";
import compareDpkgVersions from "dpkg-compare-versions";
import ApiError from "../../../../err/api-error";
import REPOSITORY_ERRORS from "../error";
import { CreateRepositoryType } from "../schema";

// Types
export type LatestApplication = {
  packageName: string;
  version: string;
  downloadSizeInBytes: number;
  installedSizeInBytes: number;
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
  const res = await fetch(data.metadataUri, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new ApiError({
      statusCode: res.status,
      message:
        res.status === 404
          ? "Metadata url not found"
          : "Failed to fetch repository metadata",
      code: "REPOSITORY_URI_FETCH_FAILED",
    });
  }

  const packages = await res.text();
  return packages
    .trim()
    .split(/\r?\n[ \t]*\r?\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => parse(paragraph));
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
    downloadSizeInBytes: Number.parseInt(latestPackage.Size ?? "0", 10),
    installedSizeInBytes:
      Number.parseInt(latestPackage["Installed-Size"] ?? "0", 10) * 1024,
    description: latestPackage.Description?.[0] ?? null,
    homepageUri: latestPackage.Homepage ?? null,
    maintainer:
      latestPackage.Maintainer?.replace(/\s*<[^>]*>/, "").trim() || null,
  };
}
