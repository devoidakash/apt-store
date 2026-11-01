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
  const componentPath = data.component
    ? `/${encodeURIComponent(data.component)}`
    : "";

  const isFlatRepo = data.suite === "./";

  let baseUrl: string;

  if (isFlatRepo) {
    baseUrl = data.uri.replace(/\/+$/, "");
  } else {
    baseUrl = `${data.uri.replace(/\/+$/, "")}/dists/${data.suite.replace(/^\/+|\/+$/g, "")}${componentPath}/binary-amd64`;
  }

  let res = await fetch(`${baseUrl}/Packages.gz`, {
    signal: AbortSignal.timeout(10000),
  });

  let packages: string;

  if (res.status === 404) {
    res = await fetch(`${baseUrl}/Packages`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new ApiError({
        statusCode: res.status,
        message: "Failed to fetch repository URIs",
        code: "REPOSITORY_URI_FETCH_FAILED",
      });
    }

    packages = Buffer.from(await res.arrayBuffer()).toString("utf8");
  } else {
    if (!res.ok) {
      throw new ApiError({
        statusCode: res.status,
        message: "Failed to fetch repository URIs",
        code: "REPOSITORY_URI_FETCH_FAILED",
      });
    }

    const compressed = Buffer.from(await res.arrayBuffer());
    packages = (await promisify(gunzip)(compressed)).toString("utf8");
  }

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
