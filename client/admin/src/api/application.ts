import axiosClient from "../lib/axios-client";

export type ApplicationStatus = "draft" | "live";

export interface ApplicationSummary {
  id: string;
  packageName: string;
  displayName: string | null;
  version: string;
  category: string | null;
  status: ApplicationStatus;
}

export interface ApplicationDetail extends ApplicationSummary {
  repositoryId: string;
  description: string | null;
  hasIcon: boolean | null;
  images: string[];
  downloadSizeBytes: number | string;
  installedSizeBytes: number | string;
  homepage: string | null;
  maintainer: string | null;
  missingSince: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateApplicationInput {
  displayName: string | null;
  description: string | null;
  category: string | null;
  homepage: string | null;
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

export async function getApplicationById(
  applicationId: string,
  signal?: AbortSignal,
): Promise<ApplicationDetail> {
  const response = await axiosClient.get<ApplicationDetailResponse>(
    `/admin/applications/${applicationId}`,
    { signal },
  );

  return response.data.data;
}

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationInput,
): Promise<ApplicationDetailResponse> {
  const response = await axiosClient.patch<ApplicationDetailResponse>(
    `/admin/applications/${applicationId}`,
    data,
  );

  return response.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<ApplicationDetailResponse> {
  const response = await axiosClient.patch<ApplicationDetailResponse>(
    `/admin/applications/${applicationId}/status`,
    { status },
  );

  return response.data;
}
