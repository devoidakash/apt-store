export interface ApplicationSummary {
  id: string;
  displayName: string | null;
  packageName?: string | null;
  maintainer: string | null;
  caption: string | null;
  version: string | null;
  icon: string | null;
}

interface ApplicationsResponse {
  success: boolean;
  message: string;
  data: ApplicationSummary[];
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
