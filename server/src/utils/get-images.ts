import env from "../config/env";
import { ApplicationId } from "../module/admin/application/schema";

export function getIcon(
  applicationId: ApplicationId,
  iconUpdatedAt: Date | null,
): string | null {
  if (!iconUpdatedAt) return null;

  return `${env.r2PublicUrl}/applications/${applicationId}/icon.webp?v=${iconUpdatedAt.getTime()}`;
}

export function getImages(images: string[] | null): string[] {
  return (images ?? []).map((image) => `${env.r2PublicUrl}/${image}`);
}
