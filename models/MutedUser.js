const mongoose = require('mongoose');

const mutedUserSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        mutedUserId: {
            type: String,
            required: true,
            index: true
        },
        mutedUserName: String,
        roomId: {
            type: String,
            index: true
        }, // null = globally muted
        muteType: {
            type: String,
            enum: ['global', 'room'],
            default: 'global'
        },
        reason: {
            type: String,
            enum: [
                'spam',
                'harassment',
                'inappropriate_content',
                'repeated_violations',
                'harassment',
                'other'
            ]
        },
        description: String,
        mutedBy: {
            userId: String,
            userName: String,
            userRole: String
        },
        mutedAt: {
            type: Date,
            default: Date.now
        },
        duration: {
            type: Number,
            default: null // null = permanent, otherwise milliseconds
        },
        expiresAt: {
            type: Date,
            index: true
        }, // Auto-unmute after this date
        isPermanent: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        unmuteNotes: String,
        unmutedBy: String,
        unmutedAt: Date,
        violations: [
            {
                type: String,
                description: String,
                date: Date
            }
        ]
    },
    { timestamps: true }
);

// Compound indexes
mutedUserSchema.index({ mutedUserId: 1, roomId: 1, isActive: 1 });
mutedUserSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('MutedUser', mutedUserSchema);
