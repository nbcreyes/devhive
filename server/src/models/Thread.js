import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

threadSchema.index({ parentMessage: 1, createdAt: 1 });

export default mongoose.model('Thread', threadSchema);