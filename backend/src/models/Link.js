const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
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
            required: [true, 'Link title is required'],
            trim: true,
            maxlength: [200, 'Link title cannot exceed 200 characters'],
        },
        url: {
            type: String,
            required: [true, 'URL is required'],
            trim: true,
            validate: {
                validator: function (v) {
                    try {
                        new URL(v);
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                message: props => `${props.value} is not a valid URL!`
            }
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        image: {
            type: String,
            trim: true,
        },
        siteName: {
            type: String,
            trim: true,
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
linkSchema.index({ userId: 1, listId: 1, updatedAt: -1 });
linkSchema.index({ userId: 1, isArchived: 1 });
linkSchema.index({ userId: 1, tags: 1 });

// Transform output
linkSchema.methods.toJSON = function () {
    const link = this.toObject();
    delete link.__v;
    return link;
};

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
