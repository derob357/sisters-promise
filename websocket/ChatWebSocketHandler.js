const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const ChatService = require('../services/ChatService');

// Store active connections and user presence
const activeConnections = new Map(); // Map of userId -> Set of WebSocket connections
const userPresence = new Map(); // Map of userId -> { name, role, lastSeen }
const roomSubscriptions = new Map(); // Map of roomId -> Set of userIds

class ChatWebSocketHandler {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws/chat' });
        this.setupServer();
    }

    setupServer() {
        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws) {
        let userId = null;
        let userName = null;
        let userRole = null;
        let subscribedRooms = new Set();

        // Send ping every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 30000);

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                await this.handleMessage(message, ws, {
                    userId,
                    userName,
                    userRole,
                    subscribedRooms,
                }, (updates) => {
                    userId = updates.userId || userId;
                    userName = updates.userName || userName;
                    userRole = updates.userRole || userRole;
                    if (updates.subscribedRooms) {
                        subscribedRooms = updates.subscribedRooms;
                    }
                });
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                }));
            }
        });

        ws.on('pong', () => {
            if (userId) {
                // Update presence
                if (!userPresence.has(userId)) {
                    userPresence.set(userId, {});
                }
                const presence = userPresence.get(userId);
                presence.lastSeen = new Date();
            }
        });

        ws.on('close', () => {
            clearInterval(heartbeatInterval);

            // Remove from active connections
            if (userId) {
                const connections = activeConnections.get(userId);
                if (connections) {
                    connections.delete(ws);
                    if (connections.size === 0) {
                        activeConnections.delete(userId);

                        // Notify rooms that user went offline
                        for (const roomId of subscribedRooms) {
                            this.broadcastToRoom(roomId, {
                                type: 'presence:offline',
                                userId,
                                userName,
                                timestamp: new Date(),
                            }, userId);
                        }

                        // Update presence
                        if (userPresence.has(userId)) {
                            userPresence.delete(userId);
                        }
                    }
                }
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Handle incoming WebSocket message
     */
    async handleMessage(message, ws, userContext, updateContext) {
        const { type, payload = {} } = message;

        switch (type) {
            case 'auth':
                await this.handleAuth(ws, payload, userContext, updateContext);
                break;

            case 'message':
                await this.handleNewMessage(ws, payload, userContext);
                break;

            case 'subscribe:room':
                await this.handleRoomSubscribe(ws, payload, userContext, updateContext);
                break;

            case 'unsubscribe:room':
                await this.handleRoomUnsubscribe(ws, payload, userContext, updateContext);
                break;

            case 'typing':
                await this.handleTypingStatus(ws, payload, userContext);
                break;

            case 'read:message':
                await this.handleMessageRead(ws, payload, userContext);
                break;

            case 'reaction':
                await this.handleReaction(ws, payload, userContext);
                break;

            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${type}`,
                }));
        }
    }

    /**
     * Handle authentication
     */
    async handleAuth(ws, payload, userContext, updateContext) {
        const { token } = payload;

        if (!token) {
            ws.send(JSON.stringify({
                type: 'auth:failed',
                message: 'Token required',
            }));
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            updateContext({
                userId: decoded.id,
                userName: decoded.name,
                userRole: decoded.role,
            });

            // Add to active connections
            if (!activeConnections.has(decoded.id)) {
                activeConnections.set(decoded.id, new Set());
            }
            activeConnections.get(decoded.id).add(ws);

            // Update presence
            userPresence.set(decoded.id, {
                name: decoded.name,
                role: decoded.role,
                lastSeen: new Date(),
            });

            ws.send(JSON.stringify({
                type: 'auth:success',
                userId: decoded.id,
                userName: decoded.name,
                userRole: decoded.role,
                timestamp: new Date(),
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'auth:failed',
                message: 'Invalid or expired token',
            }));
        }
    }

    /**
     * Handle new message
     */
    async handleNewMessage(ws, payload, userContext) {
        const { roomId, content } = payload;
        const { userId, userName, userRole } = userContext;

        if (!userId) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated',
            }));
            return;
        }

        if (!roomId || !content) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Room ID and content are required',
            }));
            return;
        }

        try {
            // Validate access
            const hasAccess = await ChatService.validateRoomAccess(roomId, userId, userRole);
            if (!hasAccess) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'No access to this room',
                }));
                return;
            }

            // Save message
            const message = await ChatService.sendMessage(
                roomId,
                userId,
                userName,
                userRole,
                content.substring(0, 10000)
            );

            // Broadcast to room
            this.broadcastToRoom(roomId, {
                type: 'message:new',
                message: {
                    id: message.id,
                    roomId: message.roomId,
                    userId: message.userId,
                    userName: message.userName,
                    userRole: message.userRole,
                    content: message.content,
                    status: message.status,
                    createdAt: message.createdAt,
                },
                timestamp: new Date(),
            });

            // Notify sender of successful delivery
            ws.send(JSON.stringify({
                type: 'message:sent',
                messageId: message.id,
                status: 'delivered',
                timestamp: new Date(),
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message,
            }));
        }
    }

    /**
     * Handle room subscription
     */
    async handleRoomSubscribe(ws, payload, userContext, updateContext) {
        const { roomId } = payload;
        const { userId, userRole } = userContext;

        if (!userId) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated',
            }));
            return;
        }

        try {
            // Validate access
            const hasAccess = await ChatService.validateRoomAccess(roomId, userId, userRole);
            if (!hasAccess) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'No access to this room',
                }));
                return;
            }

            // Add to subscriptions
            if (!roomSubscriptions.has(roomId)) {
                roomSubscriptions.set(roomId, new Set());
            }
            roomSubscriptions.get(roomId).add(userId);

            // Update context
            const newSubscribed = new Set(userContext.subscribedRooms);
            newSubscribed.add(roomId);
            updateContext({ subscribedRooms: newSubscribed });

            // Notify room of user presence
            this.broadcastToRoom(roomId, {
                type: 'presence:online',
                userId,
                userName: userContext.userName,
                userRole,
                timestamp: new Date(),
            }, userId);

            ws.send(JSON.stringify({
                type: 'subscribe:room:success',
                roomId,
                timestamp: new Date(),
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message,
            }));
        }
    }

    /**
     * Handle room unsubscription
     */
    async handleRoomUnsubscribe(ws, payload, userContext, updateContext) {
        const { roomId } = payload;
        const { userId } = userContext;

        if (!userId) return;

        const roomUsers = roomSubscriptions.get(roomId);
        if (roomUsers) {
            roomUsers.delete(userId);
            if (roomUsers.size === 0) {
                roomSubscriptions.delete(roomId);
            }
        }

        // Update context
        const newSubscribed = new Set(userContext.subscribedRooms);
        newSubscribed.delete(roomId);
        updateContext({ subscribedRooms: newSubscribed });

        ws.send(JSON.stringify({
            type: 'unsubscribe:room:success',
            roomId,
            timestamp: new Date(),
        }));
    }

    /**
     * Handle typing status
     */
    async handleTypingStatus(ws, payload, userContext) {
        const { roomId, isTyping } = payload;
        const { userId, userName } = userContext;

        if (!userId || !roomId) return;

        this.broadcastToRoom(roomId, {
            type: 'user:typing',
            userId,
            userName,
            isTyping,
            timestamp: new Date(),
        }, userId); // Don't send to self
    }

    /**
     * Handle message read receipt
     */
    async handleMessageRead(ws, payload, userContext) {
        const { messageId, roomId } = payload;
        const { userId } = userContext;

        if (!userId || !messageId) return;

        try {
            await ChatService.markMessageAsRead(messageId, userId);

            this.broadcastToRoom(roomId, {
                type: 'message:read',
                messageId,
                userId,
                timestamp: new Date(),
            }, userId);
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    /**
     * Handle emoji reaction
     */
    async handleReaction(ws, payload, userContext) {
        const { messageId, roomId, emoji, action } = payload;
        const { userId } = userContext;

        if (!userId || !messageId || !emoji || !action) return;

        try {
            let message;
            if (action === 'add') {
                message = await ChatService.addReaction(messageId, emoji, userId);
            } else if (action === 'remove') {
                message = await ChatService.removeReaction(messageId, emoji, userId);
            } else {
                return;
            }

            if (message) {
                this.broadcastToRoom(roomId, {
                    type: 'message:reaction',
                    messageId,
                    emoji,
                    userId,
                    action,
                    reactions: message.reactions,
                    timestamp: new Date(),
                });
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    }

    /**
     * Broadcast message to all users in a room
     */
    broadcastToRoom(roomId, data, excludeUserId = null) {
        const roomUsers = roomSubscriptions.get(roomId);
        if (!roomUsers) return;

        for (const userId of roomUsers) {
            if (excludeUserId && userId === excludeUserId) continue;

            const connections = activeConnections.get(userId);
            if (connections) {
                for (const ws of connections) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(data));
                    }
                }
            }
        }
    }

    /**
     * Get online users
     */
    getOnlineUsers() {
        return Array.from(userPresence.entries()).map(([userId, presence]) => ({
            userId,
            ...presence,
        }));
    }

    /**
     * Get online users in a room
     */
    getOnlineUsersInRoom(roomId) {
        const roomUsers = roomSubscriptions.get(roomId) || new Set();
        return Array.from(roomUsers).map(userId => ({
            userId,
            ...userPresence.get(userId),
        }));
    }
}

module.exports = ChatWebSocketHandler;
