import mongoose from 'mongoose';

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
  instructions: { type: String, required: true },
  instruction_steps: [{ type: String }],
  tags: [{ type: String, index: true }],
  attribution: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Índices de texto y multicampo para alto rendimiento
ExerciseSchema.index({ name: 'text', target: 'text', equipment: 'text', tags: 'text' });
ExerciseSchema.index({ body_part: 1, target: 1 });

export const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
