import ApiError from "../../err/api-error";
import GLOBAL_ERROR from "../../err/error-code";
import { getIcon, getImages } from "../../utils/get-images";
import * as repository from "./repository";

export async function getApplications() {
  const applications = await repository.fetchApplications();

  return applications.map((application) => {
    if (!application) return null;

    return {
      ...application,
      icon: getIcon(
        String(application.id),
        application.iconUpdatedAt instanceof Date
          ? application.iconUpdatedAt
          : null,
      ),
    };
  });
}

export async function getApplicationById(applicationId: string) {
  const application = await repository.fetchApplicationById(applicationId);

  if (!application) {
    throw new ApiError(GLOBAL_ERROR.APPLICATION_NOT_FOUND);
  }

  if (!Array.isArray(application.images)) {
    throw new ApiError(GLOBAL_ERROR.APPLICATION_IMAGES_NOT_ARRAY);
  }

  return {
    ...application,
    icon: getIcon(
      applicationId,
      application.iconUpdatedAt instanceof Date
        ? application.iconUpdatedAt
        : null,
    ),
    images: getImages(application.images),
  };
}
