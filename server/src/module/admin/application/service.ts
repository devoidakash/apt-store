import ApiError from "../../../err/api-error";
import ERROR_CODES from "../../../err/error-code";
import * as repository from "./repository";
import type { ApplicationStatus, UpdateApplicationData } from "./schema";

interface ApplicationForStatusValidation {
  displayName: string | null;
  packageName: string | null;
  description: string | null;
  version: string | null;
  hasIcon: boolean | null;
  downloadSizeBytes: number | string | null;
  installedSizeBytes: number | string | null;
  category: string | null;
  homepage: string | null;
  maintainer: string | null;
  status: string | null;
  images: string[];
}

export async function getApplications(applicationStatus: string) {
  const applications = await repository.fetchApplications(applicationStatus);

  if (!applications) {
    throw new ApiError(ERROR_CODES.APPLICATIONS_NOT_FOUND);
  }

  return applications;
}

export async function getApplicationById(applicationId: string) {
  const application = await repository.fetchApplicationById(applicationId);

  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  return application;
}

export async function updateApplication(
  applicationId: string,
  data: UpdateApplicationData,
) {
  const application = await repository.updateApplication(applicationId, data);

  if (!application) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  return application;
}

function validateApplicationForStatusUpdate(
  data: ApplicationForStatusValidation,
) {
  const errors: { field: string; message: string }[] = [];

  if (!data.displayName)
    errors.push({ field: "displayName", message: "Display name is required" });
  if (!data.packageName)
    errors.push({ field: "packageName", message: "Package name is required" });
  if (!data.description)
    errors.push({ field: "description", message: "Description is required" });
  if (!data.version)
    errors.push({ field: "version", message: "Version is required" });
  if (!data.hasIcon)
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
      ...ERROR_CODES.APPLICATION_VALIDATION_FAILED,
      errors,
    });
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const data = (await repository.fetchApplicationById(
    applicationId,
  )) as ApplicationForStatusValidation | null;

  if (!data) {
    throw new ApiError(ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  validateApplicationForStatusUpdate(data);

  const application = await repository.updateApplicationStatus(
    applicationId,
    status,
  );

  return application;
}
