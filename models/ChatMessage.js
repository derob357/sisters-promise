const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        roomId: {
            type: String,
            required: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        userName: {
            type: String,
            required: true
        },
        userRole: {
            type: String,
            enum: ['vip', 'admin', 'owner', 'standard'],
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 10000
        },
        messageType: {
            type: String,
            enum: ['text', 'system', 'notification'],
            default: 'text'
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        },
        readBy: [{
            userId: String,
            readAt: Date
        }],
        editHistory: [{
            originalContent: String,
            editedContent: String,
            editedAt: Date,
            editedBy: String
        }],
        reactions: [{
            emoji: String,
            users: [String]
        }],
        mentions: [String], // user IDs of mentioned users
        isPinned: {
            type: Boolean,
            default: false
        },
        pinnedAt: Date,
        pinnedBy: String,
        repliesCount: {
            type: Number,
            default: 0
        },
        attachments: [{
            type: {
                type: String,
                enum: ['image', 'file', 'link']
            },
            url: String,
            name: String,
            size: Number
        }],
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        deletedAt: Date,
        deletedBy: String,
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Compound index for efficient queries
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ isPinned: 1, roomId: 1 });
chatMessageSchema.index({ isDeleted: 1, createdAt: -1 });

// Text index for search functionality
chatMessageSchema.index({ content: 'text', userName: 'text' });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
