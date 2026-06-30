/**
 * Gera assets de marca otimizados a partir dos PNGs originais.
 * Uso: node scripts/optimize-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets", "brand", "sources");

const SOURCES = {
  stack: path.join(SOURCE_DIR, "logo-stack-source.png"),
  horizontal: path.join(SOURCE_DIR, "logo-horizontal-source.png"),
  icon: path.join(SOURCE_DIR, "logo-icon-source.png"),
};

const BRAND_DIR = path.join(ROOT, "src", "assets", "brand");
const PUBLIC_DIR = path.join(ROOT, "public");

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Remove fundo preto sólido — melhor integração em telas claras. */
async function stripNearBlack(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 28 && g < 28 && b < 28) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function writePair(pipeline, baseName, pngOpts = {}) {
  const pngPath = path.join(BRAND_DIR, `${baseName}.png`);
  const webpPath = path.join(BRAND_DIR, `${baseName}.webp`);

  await pipeline
    .clone()
    .png({ compressionLevel: 9, palette: true, quality: 85, effort: 10, ...pngOpts })
    .toFile(pngPath);
  await pipeline.clone().webp({ quality: 82 }).toFile(webpPath);

  const stat = await sharp(pngPath).metadata();
  console.log(`  ✓ ${baseName} (${stat.width}×${stat.height})`);
}

/**
 * Ícone público com fundo transparente (sem borda branca).
 * @param {object} opts
 * @param {number} [opts.pad=0] — fração de padding transparente (maskable ~0.1)
 */
async function writePublicIcon(source, size, outName, opts = {}) {
  const pad = opts.pad ?? 0;
  const inner = pad > 0 ? Math.round(size * (1 - pad * 2)) : size;

  let pipeline = sharp(source).resize(inner, inner, {
    fit: "contain",
    background: TRANSPARENT,
  });

  if (pad > 0) {
    const margin = Math.round(size * pad);
    pipeline = pipeline.extend({
      top: margin,
      bottom: margin,
      left: margin,
      right: margin,
      background: TRANSPARENT,
    });
  }

  await pipeline
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .png({ compressionLevel: 9, palette: false, quality: 90, effort: 10 })
    .toFile(path.join(PUBLIC_DIR, outName));

  console.log(`  ✓ public/${outName} (${size}px${pad ? `, pad ${Math.round(pad * 100)}%` : ""})`);
}

async function main() {
  await mkdir(BRAND_DIR, { recursive: true });

  console.log("Otimizando logos de marca…\n");

  const iconBase = await stripNearBlack(SOURCES.icon);
  await writePair(
    iconBase.clone().resize(256, 256, {
      fit: "contain",
      background: TRANSPARENT,
    }),
    "icon",
    { palette: false, quality: 90, effort: 10 },
  );

  const stackBase = await stripNearBlack(SOURCES.stack);
  await writePair(
    stackBase.clone().resize({ width: 420, withoutEnlargement: true }),
    "logo-stack",
  );

  const horizontalBase = await stripNearBlack(SOURCES.horizontal);
  await writePair(
    horizontalBase.clone().resize({ width: 300, withoutEnlargement: true }),
    "logo-horizontal",
  );

  console.log("\nÍcones PWA / favicon…\n");
  const iconForPwa = path.join(BRAND_DIR, "icon.png");

  // any — logo ocupa o canvas, sem padding branco
  await writePublicIcon(iconForPwa, 192, "icon-192.png", { pad: 0 });
  await writePublicIcon(iconForPwa, 512, "icon-512.png", { pad: 0 });
  await writePublicIcon(iconForPwa, 180, "apple-touch-icon.png", { pad: 0 });
  await writePublicIcon(iconForPwa, 32, "favicon.png", { pad: 0 });

  // maskable — zona segura transparente (~20% total)
  await writePublicIcon(iconForPwa, 192, "icon-192-maskable.png", { pad: 0.1 });
  await writePublicIcon(iconForPwa, 512, "icon-512-maskable.png", { pad: 0.1 });

  console.log("\nConcluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
