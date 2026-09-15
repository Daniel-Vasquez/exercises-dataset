import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Base de datos conectada.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📚 Endpoints disponibles en http://localhost:${PORT}/api/v1/exercises`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
