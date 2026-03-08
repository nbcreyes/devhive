import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export default mongoose.model('DirectMessage', directMessageSchema);