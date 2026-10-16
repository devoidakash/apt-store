import axiosClient from "../lib/axios-client";

export interface CreateRepositoryRequest {
  package_name: string;
  uri: string;
  suite: string;
  component: string;
  architecture: string;
  signedBy: string;
}

export interface CreateRepositoryResponse {
  success: boolean;
  message: string;
}

export interface Repository {
  id: string;
  name: string;
}

interface RepositoryListResponse {
  success: boolean;
  message: string;
  data: Repository[];
}

export async function getRepositories(
  signal?: AbortSignal,
): Promise<Repository[]> {
  const response = await axiosClient.get<RepositoryListResponse>(
    "/admin/repositories",
    { signal },
  );

  return response.data.data;
}

export async function createRepository(
  repository: CreateRepositoryRequest,
): Promise<CreateRepositoryResponse> {
  const { package_name, ...repositoryData } = repository;
  const response = await axiosClient.post<CreateRepositoryResponse>(
    "/admin/repositories",
    {
      ...repositoryData,
      name: package_name,
      packageName: [package_name],
    },
  );

  return response.data;
}
