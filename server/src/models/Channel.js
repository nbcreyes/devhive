import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['text', 'voice', 'code'],
      default: 'text',
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    topic: {
      type: String,
      maxlength: 256,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Channel', channelSchema);