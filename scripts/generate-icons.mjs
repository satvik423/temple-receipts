// Regenerates the app logo + all favicon/PWA icon sizes from a single source
// image (ideally a high-res PNG with a transparent background).
//
// Usage:
//   node scripts/generate-icons.mjs path/to/logo.png

import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/generate-icons.mjs <path-to-source-logo.png>");
  process.exit(1);
}

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function squareIcon(outPath, size, paddingRatio) {
  const inner = size - Math.round(size * paddingRatio) * 2;
  const pad = Math.round((size - inner) / 2);
  await sharp(src)
    .resize(inner, inner, { fit: "contain", background: WHITE })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toFile(outPath);
  const check = await sharp(outPath).metadata();
  if (check.width !== size || check.height !== size) {
    throw new Error(`${outPath}: expected ${size}x${size}, got ${check.width}x${check.height}`);
  }
  console.log("wrote", outPath, `${size}x${size}`);
}

// Full-resolution logo for on-page/print use (keeps transparency, moderate size for web)
await sharp(src).resize({ width: 500 }).png().toFile("public/logo.png");
console.log("wrote public/logo.png");

// Favicon / PWA icons (white background, centered, standard sizes)
await squareIcon("src/app/icon.png", 512, 0.1);
await squareIcon("src/app/apple-icon.png", 180, 0.1);
await squareIcon("public/icons/apple-touch-icon.png", 180, 0.1);
await squareIcon("public/icons/favicon-32.png", 32, 0.05);
await squareIcon("public/icons/icon-192.png", 192, 0.1);
await squareIcon("public/icons/icon-512.png", 512, 0.1);
await squareIcon("public/icons/icon-maskable-512.png", 512, 0.2);

console.log("done");
