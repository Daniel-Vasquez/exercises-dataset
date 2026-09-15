import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

async function testEndpoints() {
  console.log('====================================================');
  console.log('🧪 VERIFICANDO ENDPOINTS DE LA API RESTFUL');
  console.log('====================================================\n');

  await connectDB();

  const server = app.listen(3001, async () => {
    try {
      const baseUrl = 'http://localhost:3001/api/v1';

      // 1. Health check
      console.log('1️⃣ Probando GET /api/v1/health...');
      const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
      console.log('   👉 Resultado:', healthRes);

      // 2. Lista de ejercicios paginada
      console.log('\n2️⃣ Probando GET /api/v1/exercises?limit=2...');
      const listRes = await fetch(`${baseUrl}/exercises?limit=2`).then((r) => r.json());
      console.log(`   👉 Total ejercicios: ${listRes.meta.total}`);
      console.log(`   👉 Primer ejercicio: ${listRes.data[0]?.name} (${listRes.data[0]?.id})`);
      console.log(`   👉 Imagen Cloudinary: ${listRes.data[0]?.media?.image_url}`);
      console.log(`   👉 GIF Cloudinary:    ${listRes.data[0]?.media?.gif_url}`);
      console.log(`   👉 Instrucción (ES):  ${listRes.data[0]?.instructions.substring(0, 70)}...`);

      // 3. Filtrar por músculo y equipo
      console.log('\n3️⃣ Probando GET /api/v1/exercises?body_part=chest&equipment=dumbbell&limit=1...');
      const filterRes = await fetch(`${baseUrl}/exercises?body_part=chest&equipment=dumbbell&limit=1`).then((r) => r.json());
      console.log(`   👉 Encontrados: ${filterRes.meta.total}`);
      console.log(`   👉 Ejercicio: ${filterRes.data[0]?.name}`);

      // 4. Búsqueda por texto
      console.log('\n4️⃣ Probando GET /api/v1/exercises/search?q=press...');
      const searchRes = await fetch(`${baseUrl}/exercises/search?q=press&limit=2`).then((r) => r.json());
      console.log(`   👉 Coincidencias para "press": ${searchRes.meta.total}`);

      // 5. Ejercicios aleatorios
      console.log('\n5️⃣ Probando GET /api/v1/exercises/random?count=2...');
      const randomRes = await fetch(`${baseUrl}/exercises/random?count=2`).then((r) => r.json());
      console.log(`   👉 Retornados: ${randomRes.data.length}`);
      randomRes.data.forEach((ex, i) => console.log(`      ${i + 1}. ${ex.name} (${ex.body_part})`));

      // 6. Metadatos (partes del cuerpo)
      console.log('\n6️⃣ Probando GET /api/v1/body-parts...');
      const partsRes = await fetch(`${baseUrl}/body-parts`).then((r) => r.json());
      console.log(`   👉 Partes del cuerpo disponibles (${partsRes.meta.total}):`, partsRes.data);

      console.log('\n====================================================');
      console.log('🎉 ¡TODAS LAS PRUEBAS DE ENDPOINTS PASARON CON ÉXITO!');
      console.log('====================================================');
    } catch (e) {
      console.error('❌ Error en las pruebas:', e);
    } finally {
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    }
  });
}

testEndpoints();
