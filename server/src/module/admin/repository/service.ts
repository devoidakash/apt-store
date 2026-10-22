import { type PoolClient } from "pg";
import ApiError from "../../../err/api-error";
import pool from "../../../infra/database/db";
import { getIcon } from "../../../utils/get-images";
import withTransaction from "../../../utils/with-transaction";
import REPOSITORY_ERRORS from "./error";
import { processRepositoryMetadata } from "./helpers/apt-metadata";
import { verifyRepositoryKey } from "./helpers/gpg-keys";
import * as repository from "./repository";
import { CreateRepositoryType } from "./schema";

export async function getRepositories() {
  const repositories = await repository.fetchRepositories();

  return repositories.map((repo) => {
    const { iconUpdatedAt, ...data } = repo;

    return {
      ...data,
      icon: getIcon(repo.applicationId, iconUpdatedAt),
    };
  });
}

export async function getRepositoryById(repositoryId: string) {
  const result = await repository.fetchRepositoryById(repositoryId);
  if (!result) {
    throw new ApiError(REPOSITORY_ERRORS.REPOSITORY_NOT_FOUND);
  }
  const { iconUpdatedAt, ...data } = result;
  return {
    ...data,
    icon: getIcon(result.applicationId, result.iconUpdatedAt),
  };
}

export async function createRepository(
  data: CreateRepositoryType,
): Promise<{ id: string }> {
  const keyContent = await verifyRepositoryKey(data.key_uri, data.fingerprint);
  const application = await processRepositoryMetadata(data);

  return withTransaction(pool, async (client: PoolClient) => {
    const applicationId = await repository.insertIntoApplications(client, {
      displayName: data.displayName,
      ...application,
    });
    return repository.insertIntoRepository(client, {
      applicationId,
      ...data,
      keyContent,
    });
  });
}

export async function updateRepository(
  repositoryId: string,
  data: CreateRepositoryType,
) {
  const repositoryRecord = await getRepositoryById(repositoryId);

  if (!repositoryRecord) {
    throw new ApiError(REPOSITORY_ERRORS.REPOSITORY_NOT_FOUND);
  }

  const keyContent = await verifyRepositoryKey(data.key_uri, data.fingerprint);
  const application = await processRepositoryMetadata(data);

  return withTransaction(pool, async (client: PoolClient) => {
    await repository.updateApplicationById(client, {
      applicationId: repositoryRecord.applicationId,
      displayName: data.displayName,
      ...application,
    });
    return repository.updateRepository(client, {
      repositoryId,
      data,
      keyContent,
    });
  });
}
