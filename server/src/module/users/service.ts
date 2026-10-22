import ApiError from "../../err/api-error";
import GLOBAL_ERROR from "../../err/error-code";
import { getIcon, getImages } from "../../utils/get-images";
import * as repository from "./repository";
import { ApplicationId } from "./schema";

export async function getApplications() {
  const applications = await repository.fetchApplications();

  return applications.map((application) => {
    const { iconUpdatedAt, ...data } = application;
    return {
      ...data,
      icon: getIcon(application.id, iconUpdatedAt),
    };
  });
}

export async function getApplicationById(applicationId: ApplicationId) {
  const application = await repository.fetchApplicationById(applicationId);

  if (!application) {
    throw new ApiError(GLOBAL_ERROR.APPLICATION_NOT_FOUND);
  }

  if (application.sourceType === "repository") {
    const repoData = await repository.fetchApplicationById(applicationId);
    const { iconUpdatedAt, ...data } = application;

    return {
      application: {
        ...application,
        icon: getIcon(applicationId, iconUpdatedAt),
        images: getImages(application.images),
      },
      repository: repoData,
    };
  }
}
