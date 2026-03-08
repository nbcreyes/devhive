import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
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
    isCode: {
      type: Boolean,
      default: false,
    },
    codeLanguage: {
      type: String,
      default: null,
    },
    attachments: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    threadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ server: 1 });

export default mongoose.model('Message', messageSchema);