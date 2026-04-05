import { access, mkdir, readdir, stat, writeFile } from 'fs/promises';
import path from 'path';
import * as exifr from 'exifr';

const inputDirArg = process.argv[2] ?? './public';
const outputFileArg = process.argv[3] ?? './src/data/photos-exif.json';

const inputDir = path.resolve(inputDirArg);
const outputFile = path.resolve(outputFileArg);

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.tiff', '.heic', '.png']);

async function ensureInputDirectory(directoryPath, displayPath) {
  try {
    await access(directoryPath);
    const directoryStat = await stat(directoryPath);

    if (!directoryStat.isDirectory()) {
      throw new Error('Not a directory');
    }
  } catch {
    console.error(`[ERROR] Directory not found: ${displayPath}`);
    process.exit(1);
  }
}

async function collectImagePaths(directoryPath) {
  const dirEntries = await readdir(directoryPath, { withFileTypes: true });
  const sortedEntries = [...dirEntries].sort((a, b) => a.name.localeCompare(b.name));
  const imagePaths = [];

  for (const entry of sortedEntries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      imagePaths.push(...(await collectImagePaths(entryPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (SUPPORTED_EXTENSIONS.has(extension)) {
      imagePaths.push(entryPath);
    }
  }

  return imagePaths;
}

function formatCamera(make, model) {
  const camera = `${make ?? ''} ${model ?? ''}`.trim();
  return camera || null;
}

function formatAperture(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return `f/${value}`;
}

function formatShutterSpeed(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return null;
  }

  if (value < 1) {
    return `1/${Math.round(1 / value)}s`;
  }

  return `${value}s`;
}

function formatFocalLength(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return `${value}mm`;
}

function formatDateTaken(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function formatDimensions(width, height) {
  const normalizedWidth = typeof width === 'number' && !Number.isNaN(width) ? width : null;
  const normalizedHeight = typeof height === 'number' && !Number.isNaN(height) ? height : null;

  if (normalizedWidth === null && normalizedHeight === null) {
    return null;
  }

  return {
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

function formatIso(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const firstNumericValue = value.find((item) => typeof item === 'number' && !Number.isNaN(item));
    return firstNumericValue ?? null;
  }

  return null;
}

function buildEmptyImageResult(filePath) {
  return {
    fileName: path.basename(filePath),
    relativePath: path.relative(inputDir, filePath),
    camera: null,
    lens: null,
    aperture: null,
    shutterSpeed: null,
    iso: null,
    focalLength: null,
    dateTaken: null,
    dimensions: null,
    raw: {},
  };
}

async function extractExifForImage(filePath) {
  try {
    const raw = await exifr.parse(filePath);
    const normalizedRaw = raw ?? {};

    return {
      fileName: path.basename(filePath),
      relativePath: path.relative(inputDir, filePath),
      camera: formatCamera(normalizedRaw?.Make, normalizedRaw?.Model),
      lens: normalizedRaw?.LensModel?.trim?.() || null,
      aperture: formatAperture(normalizedRaw?.FNumber),
      shutterSpeed: formatShutterSpeed(normalizedRaw?.ExposureTime),
      iso: formatIso(normalizedRaw?.ISOSpeedRatings),
      focalLength: formatFocalLength(normalizedRaw?.FocalLength),
      dateTaken: formatDateTaken(normalizedRaw?.DateTimeOriginal),
      dimensions: formatDimensions(normalizedRaw?.ExifImageWidth, normalizedRaw?.ExifImageHeight),
      raw: normalizedRaw,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WARN] Failed to parse EXIF for ${path.basename(filePath)}: ${message}`);
    return buildEmptyImageResult(filePath);
  }
}

await ensureInputDirectory(inputDir, inputDirArg);

const imagePaths = await collectImagePaths(inputDir);
const images = [];

for (const filePath of imagePaths) {
  images.push(await extractExifForImage(filePath));
}

const result = {
  generatedAt: new Date().toISOString(),
  totalImages: images.length,
  images,
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, JSON.stringify(result, null, 2), 'utf8');

console.log(`[DONE] Extracted EXIF from ${images.length} images → ${outputFileArg}`);
