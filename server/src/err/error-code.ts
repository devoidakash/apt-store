const ERROR_CODES = {
  REPOSITORY_NOT_FOUND: {
    statusCode: 404,
    message: "Repository not found",
    code: "REPOSITORY_NOT_FOUND",
  },
  PACKAGE_NOT_FOUND: {
    statusCode: 404,
    message: "At least one package name is required",
    code: "PACKAGE_NAME_REQUIRED",
  },
  FILE_TYPE_MISMATCH: {
    statusCode: 400,
    message: "Invalid file type. Only JPEG, JPG and PNG are allowed.",
    code: "FILE_TYPE_MISMATCH",
  },
  FILE_REQUIRED: {
    statusCode: 400,
    message: "File is required",
    code: "FILE_REQUIRED",
  },
  INVALID_FILE_CONTENT: {
    statusCode: 400,
    message: "Unable to determine file type.",
    code: "INVALID_FILE_CONTENT",
  },
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
  FILE_VALIDATION_FAILED: {
    statusCode: 400,
    message: "File validation failed",
    code: "FILE_VALIDATION_FAILED",
  },
  ICON_REQUIRED: {
    statusCode: 400,
    message: "Icon file is required",
    code: "ICON_REQUIRED",
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
};

export default ERROR_CODES;
