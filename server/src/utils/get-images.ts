import env from "../config/env";

export function getIcon(
  applicationId: string,
  iconUpdatedAt: Date | null,
): string | null {
  if (!iconUpdatedAt) return null;

  return `${env.r2PublicUrl}/applications/${applicationId}/icon.webp?v=${iconUpdatedAt.getTime()}`;
}

export function getImages(images: string[]): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((image) => `${env.r2PublicUrl}/${image}`);
}
