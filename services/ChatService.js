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

    /**
     * Report a message
     */
    static async reportMessage(messageId, userId, userName, userRole, reason, description) {
        try {
            const Report = require('../models/Report');
            
            const message = await ChatMessage.findOne({ id: messageId });
            if (!message) {
                throw new Error('Message not found');
            }

            // Check if user already reported this message
            const existingReport = await Report.findOne({
                messageId,
                'reportedBy.userId': userId
            });

            if (existingReport) {
                throw new Error('You have already reported this message');
            }

            // Create or update report
            let report = await Report.findOne({ messageId, status: 'pending' });
            
            if (report) {
                // Add to existing report
                report.reportCount += 1;
                report.reporters.push({
                    userId,
                    reportedAt: new Date()
                });
            } else {
                // Create new report
                report = new Report({
                    id: uuidv4(),
                    messageId,
                    roomId: message.roomId,
                    reportedBy: {
                        userId,
                        userName,
                        userRole
                    },
                    reportedUser: {
                        userId: message.userId,
                        userName: message.userName
                    },
                    reason,
                    description,
                    messageContent: message.content,
                    status: 'pending',
                    reportCount: 1,
                    reporters: [{
                        userId,
                        reportedAt: new Date()
                    }]
                });
            }

            if (mongoose.connection.readyState === 1) {
                await report.save();
            }

            // Update message report count
            await ChatMessage.updateOne(
                { id: messageId },
                {
                    $set: {
                        reportCount: report.reportCount,
                        isReported: true
                    },
                    $push: {
                        reports: {
                            reportId: report.id,
                            reportedBy: userId,
                            reportedAt: new Date(),
                            reason
                        }
                    }
                }
            );

            return report;
        } catch (error) {
            console.error('Error reporting message:', error);
            throw error;
        }
    }

    /**
     * Get all reports (admin/owner only)
     */
    static async getReports(filters = {}, page = 1, limit = 20) {
        try {
            const Report = require('../models/Report');
            
            const skip = (page - 1) * limit;
            const query = {};

            if (filters.status) query.status = filters.status;
            if (filters.roomId) query.roomId = filters.roomId;
            if (filters.reason) query.reason = filters.reason;
            if (filters.reportedUser) query['reportedUser.userId'] = filters.reportedUser;

            const reports = await Report.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Report.countDocuments(query);

            return {
                reports,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting reports:', error);
            throw error;
        }
    }

    /**
     * Resolve a report (admin/owner only)
     */
    static async resolveReport(reportId, action, notes, adminId, adminName) {
        try {
            const Report = require('../models/Report');
            
            const report = await Report.findOne({ id: reportId });
            if (!report) {
                throw new Error('Report not found');
            }

            report.status = 'resolved';
            report.resolution = {
                action,
                notes,
                resolvedBy: adminId,
                resolvedAt: new Date()
            };

            if (mongoose.connection.readyState === 1) {
                await report.save();
            }

            // Handle actions
            if (action === 'message_removed') {
                await ChatMessage.updateOne(
                    { id: report.messageId },
                    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId } }
                );
            } else if (action === 'user_muted') {
                await this.muteUser(report.reportedUser.userId, null, 'report_violation', null, adminId, adminName);
            }

            return report;
        } catch (error) {
            console.error('Error resolving report:', error);
            throw error;
        }
    }

    /**
     * Mute a user globally or in a specific room
     */
    static async muteUser(userId, userName, reason, duration, adminId, adminName, roomId = null) {
        try {
            const MutedUser = require('../models/MutedUser');
            
            // Check if already muted
            const query = {
                mutedUserId: userId,
                isActive: true
            };
            
            if (roomId) {
                query.roomId = roomId;
            }

            let existingMute = await MutedUser.findOne(query);

            if (existingMute) {
                throw new Error('User is already muted');
            }

            const isPermanent = duration === null;
            const expiresAt = isPermanent ? null : new Date(Date.now() + duration);

            const mute = new MutedUser({
                id: uuidv4(),
                mutedUserId: userId,
                mutedUserName: userName,
                roomId: roomId || null,
                muteType: roomId ? 'room' : 'global',
                reason,
                mutedBy: {
                    userId: adminId,
                    userName: adminName,
                    userRole: 'admin'
                },
                mutedAt: new Date(),
                duration: isPermanent ? null : duration,
                expiresAt,
                isPermanent,
                isActive: true
            });

            if (mongoose.connection.readyState === 1) {
                await mute.save();
            }

            return mute;
        } catch (error) {
            console.error('Error muting user:', error);
            throw error;
        }
    }

    /**
     * Unmute a user
     */
    static async unmuteUser(userId, adminId, adminName, roomId = null) {
        try {
            const MutedUser = require('../models/MutedUser');
            
            const query = {
                mutedUserId: userId,
                isActive: true
            };

            if (roomId) {
                query.roomId = roomId;
            }

            const mute = await MutedUser.findOne(query);
            if (!mute) {
                throw new Error('User is not muted');
            }

            mute.isActive = false;
            mute.unmutedBy = adminId;
            mute.unmutedAt = new Date();

            if (mongoose.connection.readyState === 1) {
                await mute.save();
            }

            return mute;
        } catch (error) {
            console.error('Error unmuting user:', error);
            throw error;
        }
    }

    /**
     * Check if user is muted in a room or globally
     */
    static async checkIfUserMuted(userId, roomId = null) {
        try {
            const MutedUser = require('../models/MutedUser');
            
            // Check global mute
            let globalMute = await MutedUser.findOne({
                mutedUserId: userId,
                muteType: 'global',
                isActive: true
            });

            if (globalMute && !globalMute.isPermanent && new Date() > globalMute.expiresAt) {
                // Mute expired, deactivate it
                await MutedUser.updateOne({ id: globalMute.id }, { isActive: false });
                globalMute = null;
            }

            if (globalMute && globalMute.isActive) {
                return {
                    isMuted: true,
                    muteType: 'global',
                    reason: globalMute.reason,
                    expiresAt: globalMute.expiresAt
                };
            }

            // Check room-specific mute if roomId provided
            if (roomId) {
                let roomMute = await MutedUser.findOne({
                    mutedUserId: userId,
                    roomId,
                    muteType: 'room',
                    isActive: true
                });

                if (roomMute && !roomMute.isPermanent && new Date() > roomMute.expiresAt) {
                    // Mute expired, deactivate it
                    await MutedUser.updateOne({ id: roomMute.id }, { isActive: false });
                    roomMute = null;
                }

                if (roomMute && roomMute.isActive) {
                    return {
                        isMuted: true,
                        muteType: 'room',
                        roomId,
                        reason: roomMute.reason,
                        expiresAt: roomMute.expiresAt
                    };
                }
            }

            return { isMuted: false };
        } catch (error) {
            console.error('Error checking muted status:', error);
            throw error;
        }
    }

    /**
     * Get muted users (admin/owner only)
     */
    static async getMutedUsers(filters = {}, page = 1, limit = 20) {
        try {
            const MutedUser = require('../models/MutedUser');
            
            const skip = (page - 1) * limit;
            const query = { isActive: true };

            if (filters.roomId) query.roomId = filters.roomId;
            if (filters.muteType) query.muteType = filters.muteType;

            const mutedUsers = await MutedUser.find(query)
                .sort({ mutedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await MutedUser.countDocuments(query);

            return {
                mutedUsers,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting muted users:', error);
            throw error;
        }
    }

    /**
     * Track violation for a user
     */
    static async trackViolation(userId, violationType, reason) {
        try {
            const MutedUser = require('../models/MutedUser');
            
            await MutedUser.updateOne(
                { mutedUserId: userId, isActive: true },
                {
                    $push: {
                        violations: {
                            type: violationType,
                            reason,
                            date: new Date()
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error tracking violation:', error);
            throw error;
        }
    }

    /**
     * Get expired mutes for cleanup (auto-unmute)
     */
    static async getExpiredMutes() {
        try {
            const MutedUser = require('../models/MutedUser');
            
            return await MutedUser.find({
                isPermanent: false,
                isActive: true,
                expiresAt: { $lt: new Date() }
            });
        } catch (error) {
            console.error('Error getting expired mutes:', error);
            throw error;
        }
    }

    /**
     * Auto-unmute expired users
     */
    static async autoUnmuteExpiredUsers() {
        try {
            const MutedUser = require('../models/MutedUser');
            
            const result = await MutedUser.updateMany(
                {
                    isPermanent: false,
                    isActive: true,
                    expiresAt: { $lt: new Date() }
                },
                { $set: { isActive: false, unmutedAt: new Date() } }
            );

            return result;
        } catch (error) {
            console.error('Error auto-unmuting expired users:', error);
            throw error;
        }
    }
}

module.exports = ChatService;
