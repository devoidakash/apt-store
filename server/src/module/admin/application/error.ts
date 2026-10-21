const APPLICATION_ERRORS = {
  APPLICATIONS_NOT_FOUND: {
    statusCode: 404,
    message: "No applications found",
    code: "APPLICATIONS_NOT_FOUND",
  },
  APPLICATION_NOT_FOUND: {
    statusCode: 404,
    message: "Application not found",
    code: "APPLICATION_NOT_FOUND",
  },
  APPLICATION_STATUS_UPDATE_FAILED: {
    statusCode: 500,
    message: "Failed to update application status",
    code: "APPLICATION_STATUS_UPDATE_FAILED",
  },
  APPLICATION_ICON_NOT_FOUND: {
    statusCode: 404,
    message: "Application icon not found",
    code: "APPLICATION_ICON_NOT_FOUND",
  },
  APPLICATION_IMAGES_NOT_ARRAY: {
    statusCode: 400,
    message: "Application images should be an array",
    code: "APPLICATION_IMAGES_NOT_ARRAY",
  },
  APPLICATION_IMAGES_COUNT_INVALID: {
    statusCode: 400,
    message: "Exactly 5 images are required",
    code: "APPLICATION_IMAGES_COUNT_INVALID",
  },
};

export default APPLICATION_ERRORS;
