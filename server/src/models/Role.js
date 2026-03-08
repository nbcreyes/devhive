import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    color: {
      type: String,
      default: '#99aab5',
    },
    permissions: {
      manageServer: { type: Boolean, default: false },
      manageChannels: { type: Boolean, default: false },
      manageMembers: { type: Boolean, default: false },
      manageMessages: { type: Boolean, default: false },
      sendMessages: { type: Boolean, default: true },
      readMessages: { type: Boolean, default: true },
      connectVoice: { type: Boolean, default: true },
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);