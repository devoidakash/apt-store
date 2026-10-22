import ApiError from "../../../err/api-error";
import { getIcon, getImages } from "../../../utils/get-images";
import { uploadToR2 } from "../../../utils/r2-operations";
import resizeImage from "../../../utils/resize-image";
import APPLICATION_ERRORS from "./error";
import * as repository from "./repository";
import type {
  ApplicationId,
  ApplicationStatus,
  UpdateApplication,
} from "./schema";

// Functions
export async function getApplications(applicationStatus: ApplicationStatus) {
  const applications = await repository.fetchApplications(applicationStatus);

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
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_NOT_FOUND);
  }

  const { iconUpdatedAt, ...data } = application;
  return {
    ...data,
    icon: getIcon(application.id, iconUpdatedAt),
    images: getImages(application.images),
  };
}

export async function updateApplication(
  applicationId: ApplicationId,
  data: UpdateApplication,
) {
  const application = await repository.updateApplication(applicationId, data);

  if (!application) {
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_NOT_FOUND);
  }

  return;
}

export async function updateApplicationIcon(
  applicationId: ApplicationId,
  file: Express.Multer.File,
) {
  const application = await repository.fetchApplicationById(applicationId);
  if (!application) {
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_NOT_FOUND);
  }

  const iconBuffer = await resizeImage(file.buffer, {
    width: 128,
    height: 128,
  });

  const key = `applications/${applicationId}/icon.webp`;
  await uploadToR2(iconBuffer, key);

  return repository.updateApplicationIcon(applicationId);
}

export async function updateApplicationImages(
  applicationId: ApplicationId,
  files: Express.Multer.File[],
) {
  if (files.length !== 5) {
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_IMAGES_COUNT_INVALID);
  }

  const application = await getApplicationById(applicationId);

  if (!application) {
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_NOT_FOUND);
  }

  const images = files.map(
    (_, index) => `applications/${applicationId}/image-${index + 1}.webp`,
  );

  const imageBuffers = await Promise.all(
    files.map((file) =>
      resizeImage(file.buffer, {
        width: 1920,
        height: 1920,
      }),
    ),
  );

  await Promise.all(
    imageBuffers.map((buffer, index) => uploadToR2(buffer, images[index])),
  );

  return repository.updateApplicationImages(applicationId, images);
}

function validateApplicationForStatusUpdate(
  data: repository.ApplicationDetails,
) {
  const errors: { field: string; message: string }[] = [];

  if (!data.maintainer)
    errors.push({ field: "maintainer", message: "Maintainer is required" });

  if (!data.caption)
    errors.push({ field: "caption", message: "Caption is required" });

  if (!data.description)
    errors.push({ field: "description", message: "Description is required" });

  if (!data.category)
    errors.push({ field: "category", message: "Category is required" });

  if (!data.iconUpdatedAt)
    errors.push({ field: "hasIcon", message: "Icon is required" });

  if (!data.homepageUri)
    errors.push({ field: "homepageUri", message: "Homepage is required" });

  if (!data.images || data.images.length !== 5)
    errors.push({
      field: "images",
      message: "Exactly 5 images are required",
    });

  if (errors.length > 0) {
    throw new ApiError({
      ...APPLICATION_ERRORS.APPLICATION_STATUS_UPDATE_FAILED,
      errors,
    });
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const application = await repository.fetchApplicationById(applicationId);

  if (!application) {
    throw new ApiError(APPLICATION_ERRORS.APPLICATION_NOT_FOUND);
  }

  validateApplicationForStatusUpdate(application);
  return repository.updateApplicationStatus(applicationId, status);
}
