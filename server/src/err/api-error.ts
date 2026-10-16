interface ApiErrorDetail {
  field: string;
  message: string;
}

interface ApiErrorData {
  message: string;
  statusCode: number;
  code: string;
  errors?: ApiErrorDetail[] | null;
}

export default class ApiError extends Error {
  statusCode: number;
  code: string;
  errors: ApiErrorDetail[] | null;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.statusCode = data.statusCode;
    this.code = data.code;
    this.errors = data.errors ?? null;
  }
}
