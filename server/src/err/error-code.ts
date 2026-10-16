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
};

export default ERROR_CODES;
