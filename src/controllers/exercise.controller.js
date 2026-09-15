import { ExerciseService } from '../services/exercise.service.js';

export class ExerciseController {
  /**
   * GET /api/v1/exercises
   */
  static async getAll(req, res, next) {
    try {
      const result = await ExerciseService.getExercises(req.query);
      res.json({
        success: true,
        data: result.items,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/exercises/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const exercise = await ExerciseService.getExerciseById(id);

      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `No se encontró ningún ejercicio con el id '${id}'.`
          }
        });
      }

      res.json({
        success: true,
        data: exercise
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/exercises/search
   */
  static async search(req, res, next) {
    try {
      const { q } = req.query;
      const result = await ExerciseService.searchExercises(q, req.query);
      res.json({
        success: true,
        data: result.items,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/exercises/random
   */
  static async getRandom(req, res, next) {
    try {
      const { count, body_part, equipment, target } = req.query;
      const exercises = await ExerciseService.getRandomExercises(count, { body_part, equipment, target });
      res.json({
        success: true,
        data: exercises,
        meta: {
          count: exercises.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/body-parts
   */
  static async getBodyParts(req, res, next) {
    try {
      const items = await ExerciseService.getDistinctBodyParts();
      res.json({
        success: true,
        data: items,
        meta: { total: items.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/targets
   */
  static async getTargets(req, res, next) {
    try {
      const { body_part } = req.query;
      const items = await ExerciseService.getDistinctTargets(body_part);
      res.json({
        success: true,
        data: items,
        meta: { total: items.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/equipments
   */
  static async getEquipments(req, res, next) {
    try {
      const items = await ExerciseService.getDistinctEquipments();
      res.json({
        success: true,
        data: items,
        meta: { total: items.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/muscles
   */
  static async getMuscles(req, res, next) {
    try {
      const items = await ExerciseService.getDistinctMuscles();
      res.json({
        success: true,
        data: items,
        meta: { total: items.length }
      });
    } catch (error) {
      next(error);
    }
  }
}
