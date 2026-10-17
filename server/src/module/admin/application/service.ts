import env from "../../../config/env";
import ApiError from "../../../err/api-error";
import ERROR_CODES from "../../../err/error-code";
import { uploadToR2 } from "../../../utils/r2-operations";
import resizeImage from "../../../utils/resize-image";
import * as repository from "./repository";
import type { ApplicationStatus, UpdateApplicationData } from "./schema";

function getIcon(applicationId: string, iconUpdatedAt: Date | null) {
  if (!iconUpdatedAt) return null;

  return `${env.r2PublicUrl}/applications/${applicationId}/icon.webp?v=${iconUpdatedAt.getTime()}`;
}

function getImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.map((image) => `${env.r2PublicUrl}/${image}`);
}

export async function getApplications(applicationStatus: string) {
  const applications = await repository.fetchApplications(applicationStatus);

  if (!applications?.length) return [];

  return applications
    .filter((application) => application !== null)
    .map((application) => ({
      ...application,
      icon: getIcon(
        String(application.id),
        application.iconUpdatedAt instanceof Date
          ? application.iconUpdatedAt
          : null,
      ),
    }));
}

export async function getApplicationById(applicationId: string) {
  const application = await repository.fetchApplicationById(applicationId);

  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  return {
    ...application,
    icon: getIcon(
      applicationId,
      application.iconUpdatedAt instanceof Date
        ? application.iconUpdatedAt
        : null,
    ),
    images: getImageUrls(application.images),
  };
}

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationData,
) {
  return await repository.updateApplication(applicationId, data);
}

export async function updateApplicationIcon(
  applicationId: string,
  file: Express.Multer.File,
) {
  const application = await repository.fetchApplicationById(applicationId);
  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
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
  applicationId: string,
  files: Express.Multer.File[],
) {
  if (files.length !== 5) {
    throw new ApiError({
      ...ERROR_CODES.FILE_VALIDATION_FAILED,
    });
  }

  const application = await getApplicationById(applicationId);

  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  const images = files.map(
    (_, index) => `applications/${applicationId}/images/image-${index + 1}`,
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
    imageBuffers.map((buffer, index) => uploadToR2(buffer, images[index]!)),
  );

  return repository.updateApplicationImages(applicationId, images);
}

interface ApplicationForStatusValidation {
  displayName: string | null;
  packageName: string;
  caption: string | null;
  description: string | null;
  version: string;
  iconUpdatedAt: Date | string | null;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  category: string | null;
  homepage: string | null;
  maintainer: string;
  status: string | null;
  images: string[];
}

function validateApplicationForStatusUpdate(
  data: ApplicationForStatusValidation,
) {
  const errors: { field: string; message: string }[] = [];

  if (!data.displayName)
    errors.push({ field: "displayName", message: "Display name is required" });
  if (!data.packageName)
    errors.push({ field: "packageName", message: "Package name is required" });
  if (!data.caption)
    errors.push({ field: "caption", message: "Caption is requied" });
  if (!data.description)
    errors.push({ field: "description", message: "Description is required" });
  if (!data.version)
    errors.push({ field: "version", message: "Version is required" });
  if (!data.iconUpdatedAt)
    errors.push({ field: "hasIcon", message: "Icon is required" });
  if (data.downloadSizeBytes == null)
    errors.push({
      field: "downloadSizeBytes",
      message: "Download size is required",
    });
  if (data.installedSizeBytes == null)
    errors.push({
      field: "installedSizeBytes",
      message: "Installed size is required",
    });
  if (!data.category)
    errors.push({ field: "category", message: "Category is required" });
  if (!data.homepage)
    errors.push({ field: "homepage", message: "Homepage is required" });
  if (!data.maintainer)
    errors.push({ field: "maintainer", message: "Maintainer is required" });
  if (!data.status)
    errors.push({ field: "status", message: "Status is required" });

  if (data.images.length !== 5) {
    errors.push({ field: "images", message: "Exactly 5 images are required" });
  }

  if (errors.length > 0) {
    throw new ApiError({
      ...ERROR_CODES.FILE_VALIDATION_FAILED,
    });
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const application = (await repository.fetchApplicationById(
    applicationId,
  )) as ApplicationForStatusValidation | null;

  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  validateApplicationForStatusUpdate(application);

  return repository.updateApplicationStatus(applicationId, status);
}
