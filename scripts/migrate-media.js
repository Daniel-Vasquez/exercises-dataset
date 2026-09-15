import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'exercises';
const MAPPING_FILE = path.join(__dirname, 'media_mapping.json');
const CONCURRENCY_LIMIT = 8; // Número de subidas simultáneas

// 2. Cargar mapeo existente (soporte para reanudar si se interrumpe)
let mediaMapping = {};
if (fs.existsSync(MAPPING_FILE)) {
  try {
    mediaMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    console.log(`📦 Se cargó mapeo previo con ${Object.keys(mediaMapping).length} elementos ya subidos.`);
  } catch (e) {
    console.warn('⚠️ No se pudo leer media_mapping.json, iniciando nuevo mapeo.');
  }
}

function saveMapping() {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mediaMapping, null, 2), 'utf-8');
}

// 3. Subir archivo individual con reintentos
async function uploadToCloudinary(filePath, folder, resourceType = 'image', maxRetries = 3) {
  const publicId = path.basename(filePath, path.extname(filePath));
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `${CLOUDINARY_FOLDER}/${folder}`,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });
      return result.secure_url;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Fallo tras ${maxRetries} intentos al subir ${filePath}: ${error.message}`);
      }
      console.warn(`   ⚠️ Reintentando (${attempt}/${maxRetries}) para ${path.basename(filePath)}...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// 4. Procesador concurrente
async function runWithConcurrency(items, fn, limit = CONCURRENCY_LIMIT) {
  const results = [];
  let index = 0;
  let active = 0;
  let completed = 0;

  return new Promise((resolve, reject) => {
    function next() {
      if (index >= items.length && active === 0) {
        return resolve(results);
      }

      while (active < limit && index < items.length) {
        const itemIndex = index++;
        const item = items[itemIndex];
        active++;

        fn(item, itemIndex)
          .then((res) => {
            results[itemIndex] = res;
            completed++;
            if (completed % 50 === 0 || completed === items.length) {
              const pct = ((completed / items.length) * 100).toFixed(1);
              console.log(`⏳ Progreso: ${completed}/${items.length} (${pct}%)`);
              saveMapping(); // Guardar checkpoint
            }
          })
          .catch((err) => {
            console.error(`❌ Error en item ${itemIndex}:`, err);
          })
          .finally(() => {
            active--;
            next();
          });
      }
    }
    next();
  });
}

// 5. Función principal de migración
async function startMigration() {
  console.log('====================================================');
  console.log('🚀 INICIANDO MIGRACIÓN MULTIMEDIA A CLOUDINARY');
  console.log('====================================================\n');

  const imagesDir = path.join(rootDir, 'images');
  const videosDir = path.join(rootDir, 'videos');

  const imageFiles = fs.readdirSync(imagesDir).filter((f) => /\.(jpe?g|png)$/i.test(f));
  const videoFiles = fs.readdirSync(videosDir).filter((f) => /\.gif$/i.test(f));

  console.log(`📁 Archivos detectados:`);
  console.log(`   - Imágenes (.jpg/.png): ${imageFiles.length}`);
  console.log(`   - Animaciones (.gif):    ${videoFiles.length}`);
  console.log(`   - Hilos concurrentes:   ${CONCURRENCY_LIMIT}\n`);

  // Extraer todos los IDs únicos (ej. "0001-2gPfomN")
  const allMediaIds = new Set();
  imageFiles.forEach((f) => allMediaIds.add(path.basename(f, path.extname(f))));
  videoFiles.forEach((f) => allMediaIds.add(path.basename(f, path.extname(f))));

  const pendingItems = Array.from(allMediaIds).filter((mediaId) => {
    const existing = mediaMapping[mediaId];
    return !existing || !existing.image_url || !existing.gif_url;
  });

  console.log(`⚡ Elementos pendientes por procesar: ${pendingItems.length} (Ya completados: ${allMediaIds.size - pendingItems.length})\n`);

  if (pendingItems.length === 0) {
    console.log('✅ ¡Todos los archivos ya han sido migrados previamente!');
    console.log(`Archivo generado: ${MAPPING_FILE}`);
    return;
  }

  await runWithConcurrency(pendingItems, async (mediaId) => {
    if (!mediaMapping[mediaId]) {
      mediaMapping[mediaId] = {};
    }

    // 1. Subir imagen si falta
    if (!mediaMapping[mediaId].image_url) {
      const imgPath = path.join(imagesDir, `${mediaId}.jpg`);
      if (fs.existsSync(imgPath)) {
        const url = await uploadToCloudinary(imgPath, 'images', 'image');
        mediaMapping[mediaId].image_url = url;
      }
    }

    // 2. Subir GIF si falta
    if (!mediaMapping[mediaId].gif_url) {
      const gifPath = path.join(videosDir, `${mediaId}.gif`);
      if (fs.existsSync(gifPath)) {
        const url = await uploadToCloudinary(gifPath, 'videos', 'image');
        mediaMapping[mediaId].gif_url = url;
      }
    }

    return mediaMapping[mediaId];
  });

  saveMapping();
  console.log('\n====================================================');
  console.log('🎉 ¡MIGRACIÓN MULTIMEDIA COMPLETADA CON ÉXITO!');
  console.log(`Mapeo guardado en: ${MAPPING_FILE}`);
  console.log(`Total de recursos mapeados: ${Object.keys(mediaMapping).length}`);
  console.log('====================================================');
}

startMigration();
