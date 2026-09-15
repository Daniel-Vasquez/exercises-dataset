import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

console.log('====================================================');
console.log('🔍 INICIANDO TEST DE CONECTIVIDAD DE SERVICIOS CLOUD');
console.log('====================================================\n');

// 1. Validar variables de entorno requeridas
const requiredEnvVars = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Faltan las siguientes variables en tu archivo .env:`);
  missingVars.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

// 2. Probar Cloudinary
async function testCloudinary() {
  console.log('⏳ Probando conexión con Cloudinary...');
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary conectado con éxito:', pingResult);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Cloudinary:', error.message);
    return false;
  }
}

// 3. Probar MongoDB Atlas
async function testMongoDB() {
  console.log('\n⏳ Probando conexión con MongoDB Atlas...');
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Atlas conectado con éxito:`);
    console.log(`   - Host: ${conn.connection.host}`);
    console.log(`   - Base de datos: ${conn.connection.name}`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB Atlas:', error.message);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('   👉 Tip: Verifica que el usuario y contraseña en MONGODB_URI sean correctos.');
    } else if (error.message.includes('whitelist') || error.message.includes('timed out')) {
      console.error('   👉 Tip: Asegúrate de tener habilitada la IP 0.0.0.0/0 en MongoDB Atlas (Network Access).');
    }
    return false;
  }
}

// Ejecutar ambos tests
async function runTests() {
  const cloudinaryOk = await testCloudinary();
  const mongoOk = await testMongoDB();

  console.log('\n====================================================');
  if (cloudinaryOk && mongoOk) {
    console.log('🎉 ¡TODAS LAS CONEXIONES ESTÁN ACTIVAS Y FUNCIONALES!');
    console.log('Podemos proceder con la migración multimedia y de datos.');
  } else {
    console.log('⚠️  Una o más conexiones fallaron. Por favor revisa los errores arriba.');
  }
  console.log('====================================================');
  process.exit(cloudinaryOk && mongoOk ? 0 : 1);
}

runTests();
