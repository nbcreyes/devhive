import mongoose from 'mongoose';

const kanbanCardSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 256 },
  description: { type: String, maxlength: 2048, default: '' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  labels: [{ type: String, trim: true }],
  dueDate: { type: Date, default: null },
  position: { type: Number, default: 0 },
});

const kanbanColumnSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 128 },
  position: { type: Number, default: 0 },
  cards: [kanbanCardSchema],
});

const kanbanSchema = new mongoose.Schema(
  {
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
      unique: true,
    },
    columns: [kanbanColumnSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Kanban', kanbanSchema);