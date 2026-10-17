import sharp from "sharp";

interface ResizeImageOptions {
  width: number;
  height: number;
}

async function resizeImage(
  buffer: Buffer,
  { width, height }: ResizeImageOptions,
): Promise<Buffer> {
  return sharp(buffer)
    .resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();
}

export default resizeImage;
