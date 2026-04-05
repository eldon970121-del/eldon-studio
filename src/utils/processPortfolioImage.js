import imageCompression from "browser-image-compression";

const MAX_IMAGE_DIMENSION = 1920;
const OUTPUT_FILE_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.8;
const WATERMARK_TEXT = "© Eldon Studio";

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    image.src = objectUrl;
  });
}

function addWatermarkToBlob(blob) {
  return new Promise(async (resolve, reject) => {
    try {
      const image = await loadImageFromBlob(blob);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("canvas-context-unavailable"));
        return;
      }

      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const watermarkFontSize = Math.max(24, Math.round(canvas.width * 0.024));
      const horizontalPadding = Math.max(24, Math.round(canvas.width * 0.028));
      const verticalPadding = Math.max(24, Math.round(canvas.height * 0.032));

      context.font = `600 ${watermarkFontSize}px sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.lineJoin = "round";
      context.strokeStyle = "rgba(15, 16, 20, 0.35)";
      context.lineWidth = Math.max(3, Math.round(watermarkFontSize * 0.12));
      context.strokeText(
        WATERMARK_TEXT,
        canvas.width - horizontalPadding,
        canvas.height - verticalPadding,
      );
      context.fillStyle = "rgba(255, 255, 255, 0.45)";
      context.fillText(
        WATERMARK_TEXT,
        canvas.width - horizontalPadding,
        canvas.height - verticalPadding,
      );

      canvas.toBlob(
        (nextBlob) => {
          if (!nextBlob) {
            reject(new Error("watermark-export-failed"));
            return;
          }

          resolve(nextBlob);
        },
        OUTPUT_FILE_TYPE,
        OUTPUT_QUALITY,
      );
    } catch (error) {
      reject(error);
    }
  });
}

function buildOutputFileName(fileName = "portfolio-image") {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "portfolio-image";
  return `${baseName}.webp`;
}

export async function processPortfolioImageFile(file) {
  const compressedFile = await imageCompression(file, {
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    initialQuality: OUTPUT_QUALITY,
    fileType: OUTPUT_FILE_TYPE,
    useWebWorker: true,
  });
  const watermarkedBlob = await addWatermarkToBlob(compressedFile);

  return new File([watermarkedBlob], buildOutputFileName(file?.name), {
    type: OUTPUT_FILE_TYPE,
    lastModified: Date.now(),
  });
}
