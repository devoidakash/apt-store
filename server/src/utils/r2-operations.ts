import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import env from "../config/env";
import r2 from "../infra/s3/s3";

export async function uploadToR2(file: Buffer, key: string) {
  const command = new PutObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
    Body: file,
    ContentType: "image/webp",
  });

  await r2.send(command);
}

export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.r2BucketName,
    Key: key,
  });

  await r2.send(command);
}
