import axiosClient from "../lib/axios-client";

export type ApplicationStatus = "draft" | "live";

export interface ApplicationSummary {
  id: string;
  package_name: string;
  display_name: string | null;
  version: string;
  category: string | null;
  status: ApplicationStatus;
}

interface ApplicationsResponse {
  success: boolean;
  message: string;
  data: ApplicationSummary[];
}

export async function getApplications(
  status: ApplicationStatus,
  signal?: AbortSignal,
): Promise<ApplicationSummary[]> {
  const response = await axiosClient.get<ApplicationsResponse>(
    "/admin/applications",
    {
      params: { applicationStatus: status },
      signal,
    },
  );

  return response.data.data;
}
