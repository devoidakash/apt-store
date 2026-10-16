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
  r2Endpoint: requiredEnv("R2_ENDPOINT"),
  r2AccessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
};

export default env;
