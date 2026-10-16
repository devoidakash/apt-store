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
};

export default ERROR_CODES;
