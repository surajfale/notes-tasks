const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Note title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      default: '',
      maxlength: [50000, 'Note body cannot exceed 50000 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (tags) {
            return tags.length <= 20;
          },
          message: 'Cannot have more than 20 tags',
        },
        {
          validator: function (tags) {
            return tags.every((tag) => tag.length <= 30);
          },
          message: 'Each tag cannot exceed 30 characters',
        },
      ],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
noteSchema.index({ userId: 1, listId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, isArchived: 1 });
noteSchema.index({ userId: 1, tags: 1 });

// Transform output
noteSchema.methods.toJSON = function () {
  const note = this.toObject();
  delete note.__v;
  return note;
};

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
