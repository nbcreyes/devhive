import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 512,
      default: '',
    },
    icon: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8),
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Server', serverSchema);