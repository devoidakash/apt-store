export interface ApplicationSummary {
  id: string;
  displayName: string;
  packageName: string;
  maintainer: string;
  caption: string;
  version: string;
  icon: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  downloadSizeInBytes: number;
  installedSizeInBytes: number;
  description: string;
  images: string[];
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

interface ApplicationsResponse {
  success: boolean;
  message: string;
  data: ApplicationSummary[];
}

interface ApplicationDetailResponse {
  success: boolean;
  message: string;
  data: {
    application: ApplicationDetail;
    repository: RepositoryData;
  };
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function getApplications(signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/applications`, { signal });

  if (!response.ok) {
    throw new Error(`Could not load applications (${response.status}).`);
  }

  const result = (await response.json()) as ApplicationsResponse;
  return result.data;
}

export async function getApplicationById(
  applicationId: string,
  signal?: AbortSignal,
) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Could not load application (${response.status}).`);
  }

  const result = (await response.json()) as ApplicationDetailResponse;
  return {
    application: {
      ...result.data.application,
      packageName: result.data.repository.packageName,
      images: result.data.application.images ?? [],
    },
    repository: result.data.repository,
  };
}
