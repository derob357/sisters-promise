const { v4: uuidv4 } = require('uuid');
const ChatMessage = require('../models/ChatMessage');
const ChatRoom = require('../models/ChatRoom');
const mongoose = require('mongoose');

class ChatService {
    /**
     * Create a new chat room
     */
    static async createRoom(roomData, creator) {
        try {
            const room = new ChatRoom({
                id: uuidv4(),
                name: roomData.name,
                description: roomData.description || '',
                roomType: roomData.roomType || 'group',
                icon: roomData.icon || '💬',
                isPrivate: roomData.isPrivate || false,
                accessLevel: roomData.accessLevel || 'public',
                createdBy: {
                    userId: creator.id,
                    userName: creator.name
                },
                members: [{
                    userId: creator.id,
                    userName: creator.name,
                    role: 'admin'
                }],
                settings: roomData.settings || {}
            });

            if (mongoose.connection.readyState === 1) {
                await room.save();
            } else {
                // Fallback to file storage
                console.log('MongoDB not connected, room created in memory:', room);
            }

            return room;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    }

    /**
     * Get all rooms accessible by user
     */
    static async getUserRooms(userId, userRole) {
        try {
            const query = {
                isArchived: false,
                $or: [
                    { 'members.userId': userId },
                    { accessLevel: 'public' },
                    { accessLevel: userRole }
                ]
            };

            if (mongoose.connection.readyState === 1) {
                return await ChatRoom.find(query)
                    .sort({ lastMessageAt: -1 })
                    .select('id name description roomType icon accessLevel members lastMessageAt messageCount');
            }
            return [];
        } catch (error) {
            console.error('Error fetching user rooms:', error);
            throw error;
        }
    }

    /**
     * Get room details with members
     */
    static async getRoomDetails(roomId) {
        try {
            if (mongoose.connection.readyState === 1) {
                return await ChatRoom.findOne({ id: roomId });
            }
            return null;
        } catch (error) {
            console.error('Error fetching room details:', error);
            throw error;
        }
    }

    /**
     * Add user to room
     */
    static async addMemberToRoom(roomId, userId, userName, role = 'member') {
        try {
            if (mongoose.connection.readyState === 1) {
                const room = await ChatRoom.findOneAndUpdate(
                    { id: roomId, 'members.userId': { $ne: userId } },
                    {
                        $push: {
                            members: {
                                userId,
                                userName,
                                role,
                                joinedAt: new Date()
                            }
                        }
                    },
                    { new: true }
                );
                return room;
            }
            return null;
        } catch (error) {
            console.error('Error adding member to room:', error);
            throw error;
        }
    }

    /**
     * Send a message to a room
     */
    static async sendMessage(roomId, userId, userName, userRole, content, attachments = []) {
        try {
            // Validate content length
            if (content.length > 10000) {
                throw new Error('Message exceeds maximum length of 10,000 characters');
            }

            const message = new ChatMessage({
                id: uuidv4(),
                roomId,
                userId,
                userName,
                userRole,
                content,
                messageType: 'text',
                status: 'sent',
                attachments,
                createdAt: new Date()
            });

            if (mongoose.connection.readyState === 1) {
                await message.save();

                // Update room's last message info
                await ChatRoom.findOneAndUpdate(
                    { id: roomId },
                    {
                        lastMessageAt: new Date(),
                        lastMessageId: message.id,
                        $inc: { messageCount: 1 }
                    }
                );
            }

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Get messages for a room with pagination
     */
    static async getRoomMessages(roomId, limit = 50, skip = 0) {
        try {
            if (mongoose.connection.readyState === 1) {
                const messages = await ChatMessage.find({
                    roomId,
                    isDeleted: false
                })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip(skip)
                    .select('-editHistory -readBy');

                return messages.reverse();
            }
            return [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * Edit a message
     */
    static async editMessage(messageId, newContent, editorId, editorName) {
        try {
            if (mongoose.connection.readyState === 1) {
                const message = await ChatMessage.findOne({ id: messageId });

                if (!message) {
                    throw new Error('Message not found');
                }

                // Only allow editing within 24 hours of creation
                const hoursSinceCreation = (new Date() - message.createdAt) / (1000 * 60 * 60);
                if (hoursSinceCreation > 24 && !['admin', 'owner'].includes(editorId)) {
                    throw new Error('Messages can only be edited within 24 hours');
                }

                // Add to edit history
                message.editHistory.push({
                    originalContent: message.content,
                    editedContent: newContent,
                    editedAt: new Date(),
                    editedBy: editorId
                });

                message.content = newContent;
                message.updatedAt = new Date();
                await message.save();

                return message;
            }
            return null;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    }

    /**
     * Delete a message
     */
    static async deleteMessage(messageId, deleterId, deleterRole) {
        try {
            if (mongoose.connection.readyState === 1) {
                const message = await ChatMessage.findOne({ id: messageId });

                if (!message) {
                    throw new Error('Message not found');
                }

                // Users can only delete their own messages; admins can delete any
                if (message.userId !== deleterId && !['admin', 'owner'].includes(deleterRole)) {
                    throw new Error('You do not have permission to delete this message');
                }

                message.isDeleted = true;
                message.deletedAt = new Date();
                message.deletedBy = deleterId;
                message.content = '[Message deleted]';

                await message.save();
                return message;
            }
            return null;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    static async markMessageAsRead(messageId, userId) {
        try {
            if (mongoose.connection.readyState === 1) {
                await ChatMessage.findOneAndUpdate(
                    { id: messageId, 'readBy.userId': { $ne: userId } },
                    {
                        $push: {
                            readBy: {
                                userId,
                                readAt: new Date()
                            }
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    /**
     * Search messages in a room
     */
    static async searchMessages(roomId, searchTerm, limit = 50) {
        try {
            if (mongoose.connection.readyState === 1) {
                return await ChatMessage.find(
                    {
                        roomId,
                        isDeleted: false,
                        $text: { $search: searchTerm }
                    },
                    { score: { $meta: 'textScore' } }
                )
                    .sort({ score: { $meta: 'textScore' } })
                    .limit(limit);
            }
            return [];
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    }

    /**
     * Pin a message
     */
    static async pinMessage(messageId, roomId, userId, userRole) {
        try {
            // Only admins and owners can pin
            if (!['admin', 'owner'].includes(userRole)) {
                throw new Error('Only admins can pin messages');
            }

            if (mongoose.connection.readyState === 1) {
                await ChatMessage.findOneAndUpdate(
                    { id: messageId },
                    {
                        isPinned: true,
                        pinnedAt: new Date(),
                        pinnedBy: userId
                    }
                );

                await ChatRoom.findOneAndUpdate(
                    { id: roomId, 'pinnedMessages.id': { $ne: messageId } },
                    { $push: { pinnedMessages: messageId } }
                );
            }
        } catch (error) {
            console.error('Error pinning message:', error);
            throw error;
        }
    }

    /**
     * Get unread message count for user
     */
    static async getUnreadCount(userId, roomId = null) {
        try {
            if (mongoose.connection.readyState === 1) {
                const query = {
                    'readBy.userId': { $ne: userId },
                    isDeleted: false
                };

                if (roomId) {
                    query.roomId = roomId;
                }

                return await ChatMessage.countDocuments(query);
            }
            return 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Archive a room
     */
    static async archiveRoom(roomId, archiverId) {
        try {
            if (mongoose.connection.readyState === 1) {
                return await ChatRoom.findOneAndUpdate(
                    { id: roomId },
                    {
                        isArchived: true,
                        archivedAt: new Date(),
                        archivedBy: archiverId
                    },
                    { new: true }
                );
            }
            return null;
        } catch (error) {
            console.error('Error archiving room:', error);
            throw error;
        }
    }

    /**
     * Mute a room for user
     */
    static async muteRoom(roomId, userId) {
        try {
            if (mongoose.connection.readyState === 1) {
                return await ChatRoom.findOneAndUpdate(
                    { id: roomId, 'members.userId': userId },
                    { $set: { 'members.$.isMuted': true } },
                    { new: true }
                );
            }
            return null;
        } catch (error) {
            console.error('Error muting room:', error);
            throw error;
        }
    }

    /**
     * Unmute a room for user
     */
    static async unmuteRoom(roomId, userId) {
        try {
            if (mongoose.connection.readyState === 1) {
                return await ChatRoom.findOneAndUpdate(
                    { id: roomId, 'members.userId': userId },
                    { $set: { 'members.$.isMuted': false } },
                    { new: true }
                );
            }
            return null;
        } catch (error) {
            console.error('Error unmuting room:', error);
            throw error;
        }
    }

    /**
     * Add reaction to message
     */
    static async addReaction(messageId, emoji, userId) {
        try {
            if (mongoose.connection.readyState === 1) {
                const message = await ChatMessage.findOne({ id: messageId });

                if (!message) {
                    throw new Error('Message not found');
                }

                let reaction = message.reactions.find(r => r.emoji === emoji);

                if (!reaction) {
                    reaction = { emoji, users: [] };
                    message.reactions.push(reaction);
                }

                if (!reaction.users.includes(userId)) {
                    reaction.users.push(userId);
                }

                await message.save();
                return message;
            }
            return null;
        } catch (error) {
            console.error('Error adding reaction:', error);
            throw error;
        }
    }

    /**
     * Remove reaction from message
     */
    static async removeReaction(messageId, emoji, userId) {
        try {
            if (mongoose.connection.readyState === 1) {
                const message = await ChatMessage.findOne({ id: messageId });

                if (!message) {
                    throw new Error('Message not found');
                }

                message.reactions = message.reactions.map(r => {
                    if (r.emoji === emoji) {
                        r.users = r.users.filter(u => u !== userId);
                    }
                    return r;
                }).filter(r => r.users.length > 0);

                await message.save();
                return message;
            }
            return null;
        } catch (error) {
            console.error('Error removing reaction:', error);
            throw error;
        }
    }

    /**
     * Validate user has access to room
     */
    static async validateRoomAccess(roomId, userId, userRole) {
        try {
            if (mongoose.connection.readyState === 1) {
                const room = await ChatRoom.findOne({ id: roomId });

                if (!room) {
                    throw new Error('Room not found');
                }

                // Check if user is member
                const isMember = room.members.some(m => m.userId === userId);
                if (isMember) {
                    return true;
                }

                // Check access level
                if (room.accessLevel === 'public') {
                    return true;
                }

                if (room.accessLevel === userRole) {
                    return true;
                }

                return false;
            }
            return false;
        } catch (error) {
            console.error('Error validating room access:', error);
            throw error;
        }
    }
}

module.exports = ChatService;
