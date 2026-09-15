import { Router } from 'express';
import { ExerciseController } from '../controllers/exercise.controller.js';

const router = Router();

// Endpoints de Metadatos
router.get('/body-parts', ExerciseController.getBodyParts);
router.get('/targets', ExerciseController.getTargets);
router.get('/equipments', ExerciseController.getEquipments);
router.get('/muscles', ExerciseController.getMuscles);

// Endpoints de Búsqueda y Rutinas
router.get('/exercises/search', ExerciseController.search);
router.get('/exercises/random', ExerciseController.getRandom);

// Endpoints CRUD de Ejercicios
router.get('/exercises', ExerciseController.getAll);
router.get('/exercises/:id', ExerciseController.getById);

export default router;
