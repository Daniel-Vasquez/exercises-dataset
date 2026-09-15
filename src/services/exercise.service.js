import { Exercise } from '../models/Exercise.js';
import { connectDB } from '../config/db.js';

export class ExerciseService {
  /**
   * Obtiene lista paginada y filtrada de ejercicios.
   */
  static async getExercises(queryParams) {
    await connectDB();

    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (queryParams.body_part) {
      filter.body_part = queryParams.body_part.toLowerCase();
    }
    if (queryParams.target) {
      filter.target = queryParams.target.toLowerCase();
    }
    if (queryParams.equipment) {
      filter.equipment = queryParams.equipment.toLowerCase();
    }
    if (queryParams.muscle_group) {
      filter.muscle_group = queryParams.muscle_group.toLowerCase();
    }
    if (queryParams.tag) {
      filter.tags = queryParams.tag.toLowerCase();
    }

    // Proyección de campos específicos si se solicita (ej. 'id,name,media')
    let projection = null;
    if (queryParams.fields) {
      projection = queryParams.fields.split(',').map((f) => f.trim()).join(' ');
    }

    const [items, total] = await Promise.all([
      Exercise.find(filter, projection).sort({ id: 1 }).skip(skip).limit(limit).lean(),
      Exercise.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    };
  }

  /**
   * Busca un ejercicio por su ID único de 4 dígitos o por _id de MongoDB.
   */
  static async getExerciseById(id) {
    await connectDB();

    let exercise = await Exercise.findOne({ id }).lean();
    if (!exercise && id.match(/^[0-9a-fA-F]{24}$/)) {
      exercise = await Exercise.findById(id).lean();
    }
    return exercise;
  }

  /**
   * Búsqueda por texto completo indexado.
   */
  static async searchExercises(query, queryParams) {
    await connectDB();

    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 20));
    const skip = (page - 1) * limit;

    if (!query || query.trim() === '') {
      return this.getExercises(queryParams);
    }

    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { target: { $regex: query, $options: 'i' } },
        { equipment: { $regex: query, $options: 'i' } },
        { muscle_group: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };

    const [items, total] = await Promise.all([
      Exercise.find(filter).sort({ id: 1 }).skip(skip).limit(limit).lean(),
      Exercise.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        query,
        total,
        page,
        limit,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    };
  }

  /**
   * Obtiene ejercicios aleatorios.
   */
  static async getRandomExercises(count = 1, filterParams = {}) {
    await connectDB();

    const sampleSize = Math.min(20, Math.max(1, parseInt(count) || 1));
    const matchStage = {};

    if (filterParams.body_part) {
      matchStage.body_part = filterParams.body_part.toLowerCase();
    }
    if (filterParams.equipment) {
      matchStage.equipment = filterParams.equipment.toLowerCase();
    }
    if (filterParams.target) {
      matchStage.target = filterParams.target.toLowerCase();
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push({ $sample: { size: sampleSize } });

    return await Exercise.aggregate(pipeline);
  }

  /**
   * Obtiene lista única de partes del cuerpo.
   */
  static async getDistinctBodyParts() {
    await connectDB();
    return await Exercise.distinct('body_part');
  }

  /**
   * Obtiene lista única de músculos objetivo (targets).
   */
  static async getDistinctTargets(body_part) {
    await connectDB();
    const filter = body_part ? { body_part: body_part.toLowerCase() } : {};
    return await Exercise.distinct('target', filter);
  }

  /**
   * Obtiene lista única de equipamiento.
   */
  static async getDistinctEquipments() {
    await connectDB();
    return await Exercise.distinct('equipment');
  }

  /**
   * Obtiene lista única de grupos musculares.
   */
  static async getDistinctMuscles() {
    await connectDB();
    return await Exercise.distinct('muscle_group');
  }
}
