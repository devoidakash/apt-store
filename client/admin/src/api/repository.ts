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
  const response = await axiosClient.post<CreateRepositoryResponse>(
    "/admin/repositories",
    repository,
  );

  return response.data;
}
