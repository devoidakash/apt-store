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
