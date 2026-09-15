import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Definición del Esquema Mongoose en Español
const ExerciseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true, trim: true },
  category: { type: String, required: true, index: true },
  body_part: { 
    type: String, 
    required: true, 
    index: true,
    enum: [
      "back", "cardio", "chest", "lower arms", "lower legs", 
      "neck", "shoulders", "upper arms", "upper legs", "waist"
    ]
  },
  target: { type: String, required: true, index: true },
  muscle_group: { type: String, required: true, index: true },
  secondary_muscles: [{ type: String, index: true }],
  equipment: { type: String, required: true, index: true },
  media_id: { type: String, required: true },
  media: {
    image_url: { type: String, required: true },
    gif_url: { type: String, required: true }
  },
  instructions: { type: String, required: true }, // Texto continuo en español
  instruction_steps: [{ type: String }],          // Pasos detallados en español
  tags: [{ type: String, index: true }],
  attribution: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices para búsquedas eficientes
ExerciseSchema.index({ name: 'text', target: 'text', equipment: 'text', tags: 'text' });
ExerciseSchema.index({ body_part: 1, target: 1 });
ExerciseSchema.index({ equipment: 1 });

const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);

// 2. Función de Sembrado
async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 INICIANDO POBLADO DE BASE DE DATOS (ESPAÑOL)');
  console.log('====================================================\n');

  const exercisesPath = path.join(rootDir, 'data', 'exercises.json');
  const mappingPath = path.join(__dirname, 'media_mapping.json');

  if (!fs.existsSync(exercisesPath)) {
    console.error(`❌ No se encontró el archivo de datos en: ${exercisesPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(mappingPath)) {
    console.error(`❌ No se encontró el mapeo multimedia en: ${mappingPath}`);
    console.error('👉 Ejecuta primero "npm run migrate:media" para subir imágenes y GIFs.');
    process.exit(1);
  }

  const rawExercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf-8'));
  const mediaMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

  console.log(`📊 Registros en exercises.json: ${rawExercises.length}`);
  console.log(`🖼️  Recursos en media_mapping.json: ${Object.keys(mediaMapping).length}\n`);

  console.log('⏳ Conectando a MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB Atlas.');

  // Transformar datos seleccionando únicamente español (es)
  console.log('⚙️  Transformando registros al modelo en español...');
  const transformed = rawExercises.map((item) => {
    // Media key basada en image o media_id (ej. "0001-2gPfomN")
    const mediaKey = item.image ? path.basename(item.image, path.extname(item.image)) : `${item.id}-${item.media_id}`;
    const mediaObj = mediaMapping[mediaKey] || {
      image_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/exercises/images/${mediaKey}.jpg`,
      gif_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/exercises/videos/${mediaKey}.gif`
    };

    // Extraer instrucciones en español (con fallback a inglés si no existiera)
    const spanishInstructions = (item.instructions && item.instructions.es) || (item.instructions && item.instructions.en) || '';
    const spanishSteps = (item.instruction_steps && item.instruction_steps.es) || (item.instruction_steps && item.instruction_steps.en) || [];

    // Generar tags automáticos
    const tagSet = new Set([
      item.body_part,
      item.target,
      item.equipment,
      item.muscle_group,
      ...(item.secondary_muscles || [])
    ]);

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      body_part: item.body_part,
      target: item.target,
      muscle_group: item.muscle_group,
      secondary_muscles: item.secondary_muscles || [],
      equipment: item.equipment,
      media_id: item.media_id,
      media: mediaObj,
      instructions: spanishInstructions,
      instruction_steps: spanishSteps,
      tags: Array.from(tagSet).filter(Boolean),
      attribution: item.attribution || 'Open Exercise Dataset'
    };
  });

  console.log('🧹 Limpiando colección previa de ejercicios...');
  await Exercise.deleteMany({});

  console.log('📥 Insertando registros en bloques...');
  const BATCH_SIZE = 200;
  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    await Exercise.insertMany(batch);
    console.log(`   - Insertados: ${Math.min(i + BATCH_SIZE, transformed.length)} / ${transformed.length}`);
  }

  console.log('⚡ Creando índices...');
  await Exercise.syncIndexes();

  const totalCount = await Exercise.countDocuments();
  console.log('\n====================================================');
  console.log(`🎉 ¡BASE DE DATOS POBLADA EXITOSAMENTE! Total: ${totalCount} ejercicios.`);
  console.log('====================================================');

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('❌ Error durante el sembrado:', err);
  mongoose.disconnect();
  process.exit(1);
});
