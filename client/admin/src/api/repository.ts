import axiosClient from "../lib/axios-client";

export type RepositoryApplicationStatus = "draft" | "published";

export interface CreateRepositoryRequest {
  displayName: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  key_uri: string;
  fingerprint: string;
}

export interface CreateRepositoryResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
  };
}

export interface Repository {
  id: string;
  displayName: string;
  icon: string | null;
  maintainer: string | null;
}

export interface RepositoryDetail extends Repository {
  applicationId: string | null;
  displayName: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  keyContent: string | null;
  keyUri: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRepositoryRequest {
  displayName: string;
  packageName: string;
  uri: string;
  suite: string;
  component: string;
  key_uri: string;
  fingerprint: string;
}

export interface UpdateRepositoryResponse {
  success: boolean;
  message: string;
  data: RepositoryDetail;
}

interface RepositoryListResponse {
  success: boolean;
  message: string;
  data: Repository[];
}

export async function getRepositories(
  status: RepositoryApplicationStatus,
  signal?: AbortSignal,
): Promise<Repository[]> {
  const response = await axiosClient.get<RepositoryListResponse>(
    "/admin/repositories",
    {
      params: { applicationStatus: status },
      signal,
    },
  );

  return response.data.data;
}

export async function getRepositoryById(
  repositoryId: string,
  signal?: AbortSignal,
): Promise<RepositoryDetail | null> {
  const response = await axiosClient.get<{
    success: boolean;
    message: string;
    data: RepositoryDetail | null;
  }>(`/admin/repositories/${repositoryId}`, { signal });

  return response.data.data;
}

export async function updateRepository(
  repositoryId: string,
  repository: UpdateRepositoryRequest,
): Promise<UpdateRepositoryResponse> {
  const response = await axiosClient.patch<UpdateRepositoryResponse>(
    `/admin/repositories/${repositoryId}`,
    repository,
  );

  return response.data;
}

export async function createRepository(
  repository: CreateRepositoryRequest,
): Promise<CreateRepositoryResponse> {
  const response = await axiosClient.post<CreateRepositoryResponse>(
    "/admin/repositories",
    repository,
  );

  return response.data;
}
