const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            index: true
        },
        description: String,
        roomType: {
            type: String,
            enum: ['general', 'vip', 'admin', 'owner', 'private', 'group'],
            default: 'group',
            index: true
        },
        icon: String, // emoji or icon representation
        isPrivate: {
            type: Boolean,
            default: false
        },
        accessLevel: {
            type: String,
            enum: ['public', 'vip', 'admin', 'owner'],
            default: 'public'
        },
        members: [{
            userId: {
                type: String,
                required: true
            },
            userName: String,
            role: {
                type: String,
                enum: ['member', 'moderator', 'admin'],
                default: 'member'
            },
            joinedAt: {
                type: Date,
                default: Date.now
            },
            lastReadMessageId: String,
            lastReadAt: Date,
            isMuted: {
                type: Boolean,
                default: false
            }
        }],
        createdBy: {
            userId: String,
            userName: String
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        lastMessageAt: Date,
        lastMessageId: String,
        messageCount: {
            type: Number,
            default: 0
        },
        settings: {
            allowReactions: {
                type: Boolean,
                default: true
            },
            allowMentions: {
                type: Boolean,
                default: true
            },
            allowAttachments: {
                type: Boolean,
                default: true
            },
            autoArchiveAfterDays: {
                type: Number,
                default: 90
            }
        },
        pinnedMessages: [String], // message IDs
        isArchived: {
            type: Boolean,
            default: false
        },
        archivedAt: Date,
        archivedBy: String,
        rules: String, // Channel rules/guidelines
        tags: [String], // Channel tags for categorization
        metadata: {
            headerImage: String,
            customColor: String
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
chatRoomSchema.index({ accessLevel: 1, createdAt: -1 });
chatRoomSchema.index({ 'members.userId': 1, isArchived: 1 });
chatRoomSchema.index({ roomType: 1, isArchived: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
