export interface ApplicationSummary {
  id: string;
  displayName: string | null;
  packageName?: string | null;
  maintainer: string | null;
  caption: string | null;
  version: string | null;
  icon: string | null;
}

export interface ApplicationDetail extends ApplicationSummary {
  downloadSizeBytes: number | string;
  installedSizeBytes: number | string;
  description: string | null;
  images: string[];
  homepage: string | null;
  category: string | null;
}

interface ApplicationsResponse {
  success: boolean;
  message: string;
  data: ApplicationSummary[];
}

interface ApplicationDetailResponse {
  success: boolean;
  message: string;
  data: ApplicationDetail;
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
  return result.data;
}
