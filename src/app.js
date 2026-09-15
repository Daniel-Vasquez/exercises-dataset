import express from 'express';
import cors from 'cors';
import exerciseRoutes from './routes/exercise.routes.js';
import { connectDB } from './config/db.js';

const app = express();

// 1. CORS Middleware
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Parsers
app.use(express.json());

// 3. Middleware de Caché para CDN (Vercel Edge Network)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const cacheTtl = process.env.CDN_CACHE_TTL_SECONDS || 86400; // 24h
    const swrTtl = process.env.CDN_SWR_TTL_SECONDS || 43200;    // 12h
    res.setHeader('Cache-Control', `public, s-maxage=${cacheTtl}, stale-while-revalidate=${swrTtl}`);
  }
  next();
});

// 4. Health Check
app.get('/api/v1/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 5. Rutas Principales de la API
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(apiPrefix, exerciseRoutes);

// 6. Raíz con documentación rápida
app.get('/', (req, res) => {
  res.json({
    name: 'Exercises Dataset RESTful API',
    version: '1.0.0',
    endpoints: {
      health: `${apiPrefix}/health`,
      exercises: `${apiPrefix}/exercises`,
      search: `${apiPrefix}/exercises/search?q=bench`,
      random: `${apiPrefix}/exercises/random?count=3`,
      body_parts: `${apiPrefix}/body-parts`,
      targets: `${apiPrefix}/targets`,
      equipments: `${apiPrefix}/equipments`,
      muscles: `${apiPrefix}/muscles`
    }
  });
});

// 7. Middleware de Ruta No Encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `La ruta '${req.originalUrl}' no existe.`
    }
  });
});

// 8. Manejador Global de Errores (500)
app.use((err, req, res, next) => {
  console.error('❌ Error no controlado en la API:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Ocurrió un error inesperado en el servidor.'
    }
  });
});

export default app;
