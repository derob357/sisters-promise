const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        messageId: {
            type: String,
            required: true,
            index: true
        },
        roomId: {
            type: String,
            required: true,
            index: true
        },
        reportedBy: {
            userId: String,
            userName: String,
            userRole: String
        },
        reportedUser: {
            userId: String,
            userName: String
        },
        reason: {
            type: String,
            enum: [
                'spam',
                'harassment',
                'inappropriate_content',
                'misinformation',
                'offensive_language',
                'advertising',
                'other'
            ],
            required: true
        },
        description: {
            type: String,
            maxlength: 500
        },
        messageContent: String, // Store content at time of report (in case deleted)
        messageAuthor: String,
        status: {
            type: String,
            enum: ['pending', 'under_review', 'resolved', 'dismissed'],
            default: 'pending',
            index: true
        },
        resolution: {
            action: {
                type: String,
                enum: ['message_removed', 'user_muted', 'warning_sent', 'no_action'],
                default: 'no_action'
            },
            notes: String,
            resolvedBy: String,
            resolvedAt: Date
        },
        reportCount: {
            type: Number,
            default: 1
        },
        reporters: [{
            userId: String,
            reportedAt: {
                type: Date,
                default: Date.now
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index for efficient queries
reportSchema.index({ roomId: 1, status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ messageId: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
