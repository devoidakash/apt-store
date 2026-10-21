const GLOBAL_ERROR = {
  FILE_TYPE_MISMATCH: {
    statusCode: 400,
    message: "Invalid file type. Only JPEG, JPG, PNG and WebP are allowed.",
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
  FILE_VALIDATION_FAILED: {
    statusCode: 400,
    message: "File validation failed",
    code: "FILE_VALIDATION_FAILED",
  },
} as const;

export default GLOBAL_ERROR;
