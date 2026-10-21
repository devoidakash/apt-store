const REPOSITORY_ERRORS = {
  REPOSITORY_KEY_FINGERPRINT_MISMATCH: {
    statusCode: 400,
    message: "Key fingerprint does not match",
    code: "REPOSITORY_KEY_FINGERPRINT_MISMATCH",
  },
  REPOSITORY_KEY_REVOKED: {
    statusCode: 400,
    message: "Repository key has been revoked",
    code: "REPOSITORY_KEY_REVOKED",
  },
  LATEST_PACKAGE_NOT_FOUND: {
    statusCode: 404,
    message: "Latest pacakage not found",
    code: "LATEST_PACKAGE_NOT_FOUND",
  },
  REPOSITORY_NOT_FOUND: {
    statusCode: 404,
    message: "Repository not found",
    code: "REPOSITORY_NOT_FOUND",
  },
  PACKAGE_NOT_FOUND: {
    statusCode: 404,
    message: "Package not found",
    code: "PACKAGE_NOT_FOUND",
  },
};

export default REPOSITORY_ERRORS;
