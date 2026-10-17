import "dotenv/config";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} missing from .env`);
  }
  return value;
}

const env = {
  port: requiredEnv("PORT"),
  databaseUrl: requiredEnv("DATABASE_URL"),
  r2BucketName: requiredEnv("R2_BUCKET_NAME"),
  r2PublicUrl: requiredEnv("R2_PUBLIC_URL"),
  r2Endpoint: requiredEnv("R2_ACCOUNT_ID"),
  r2AccessKeyId: requiredEnv("R2_ACCESS_KEY"),
  r2SecretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
};

export default env;
