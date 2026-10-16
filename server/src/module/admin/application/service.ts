import ApiError from "../../../err/api-error";
import ERROR_CODES from "../../../err/error-code";
import * as repository from "./repository";

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
