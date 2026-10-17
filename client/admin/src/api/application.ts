import axiosClient from "../lib/axios-client";

export type ApplicationStatus = "draft" | "live";

export interface ApplicationSummary {
  id: string;
  packageName: string;
  displayName: string | null;
  caption: string | null;
  maintainer: string | null;
  icon: string | null;
  version: string;
  category: string | null;
  status: ApplicationStatus;
}

export interface ApplicationDetail extends ApplicationSummary {
  repositoryId: string;
  description: string | null;
  iconUpdatedAt: string | null;
  images: string[];
  downloadSizeBytes: number | string;
  installedSizeBytes: number | string;
  homepage: string | null;
  missingSince: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateApplicationInput {
  displayName?: string;
  caption?: string;
  description?: string;
  category?: string;
  homepage?: string;
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

interface ActionResponse {
  success: boolean;
  message: string;
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

export function getApplicationicon(icon: string) {
  return axiosClient.getUri({ url: icon });
}

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationInput,
): Promise<ActionResponse> {
  const response = await axiosClient.patch<ActionResponse>(
    `/admin/applications/${applicationId}`,
    data,
  );

  return response.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<ActionResponse> {
  const response = await axiosClient.patch<ActionResponse>(
    `/admin/applications/${applicationId}/status`,
    { status },
  );

  return response.data;
}

export async function updateApplicationIcon(
  applicationId: string,
  file: File,
): Promise<ActionResponse> {
  const formData = new FormData();
  formData.append("icon", file);

  const response = await axiosClient.patch<ActionResponse>(
    `/admin/applications/${applicationId}/icon`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

export async function updateApplicationImages(
  applicationId: string,
  files: File[],
): Promise<ActionResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const response = await axiosClient.post<ActionResponse>(
    `/admin/applications/${applicationId}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}
