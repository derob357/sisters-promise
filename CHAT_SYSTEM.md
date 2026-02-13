# Sister's Promise - Central Chat System Documentation

## Overview

The Central Chat System is a real-time messaging platform exclusively for **VIP members, admins, and owners** to collaborate and communicate. It features WebSocket-based real-time messaging, multiple chat channels, presence tracking, and comprehensive moderation tools.

**Launch Date:** January 2026
**Status:** Production Ready

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Chat Channels](#chat-channels)
5. [Getting Started](#getting-started)
6. [API Endpoints](#api-endpoints)
7. [WebSocket Events](#websocket-events)
8. [Client Implementation](#client-implementation)
9. [Security](#security)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Features

### Real-Time Messaging
- **WebSocket Protocol**: Instant message delivery with automatic fallback to polling
- **Message Status**: Tracks sent, delivered, and read statuses
- **Typing Indicators**: Shows when users are composing messages
- **Presence Awareness**: Real-time online/offline status indicators
- **Message Delivery**: Guaranteed delivery with acknowledgments

### Chat Organization
- **Multiple Channels**: Separate channels for different teams and topics
- **Default Channels**:
  - 👥 **General Discussion**: For all VIP/admin members
  - 🎯 **VIP Exclusive**: VIP members only
  - ⚙️ **Admin Operations**: Admin and owner only
  - 📦 **Product Updates**: Announcements and updates
  - 💳 **Payments & Billing**: Financial discussions

### Message Management
- **Edit Messages**: Modify messages within 24 hours with edit history
- **Delete Messages**: Remove messages permanently (admins can delete any)
- **Pinned Messages**: Highlight important messages (admin/owner only)
- **Message Search**: Full-text search across all messages
- **Rich Text**: Support for formatting, emojis, and links
- **Reactions**: Add emoji reactions to messages
- **Attachments**: Share files and images (future enhancement)

### User Management
- **Member Lists**: See who's in each channel
- **Role Display**: Identify admins, owners, and VIP members by badges
- **Mention Support**: @mention users to notify them
- **Admin Controls**: Add/remove members from channels
- **Moderation**: Delete spam, mute disruptive users

### Notifications
- **In-App Alerts**: Get notified of new messages
- **Unread Badges**: See count of unread messages
- **Desktop Notifications**: Browser push notifications
- **Mute Options**: Silence specific channels when needed
- **Selective Notifications**: Choose which channels to get alerts for

---

## Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Real-Time Protocol | WebSocket (ws/wss) | Native |
| HTTP Fallback | Long Polling | Express.js |
| Database | MongoDB | 4.4+ |
| Authentication | JWT + bcryptjs | jsonwebtoken 9.0.3 |
| Encryption | TLS 1.2+ | HTTPS enabled |
| Server | Express.js | 4.22.1 |
| Client Support | Web, iOS, Android | React Native |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│  (Web, iOS App, Android App)                            │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    WebSocket (wss)        HTTP REST API
    Real-time Messages    Fallback/Other APIs
         │                       │
    ┌────────────────────────────────────────┐
    │      Sister's Promise Chat Server       │
    │  (Express.js with SSL/TLS)             │
    └─────┬──────────────────────────┬───────┘
          │                          │
    ┌─────────────────┐    ┌──────────────────┐
    │   WebSocket     │    │  REST Endpoints  │
    │   Handlers      │    │  (19 endpoints)  │
    └────────┬────────┘    └────────┬─────────┘
             │                      │
    ┌────────────────────────────────────────┐
    │       Chat Service Layer               │
    │  (Message, Room, Presence, Search)     │
    └─────┬──────────────────────────┬───────┘
          │                          │
    ┌─────────────────────────────────────────┐
    │         MongoDB Database                │
    │  - ChatMessage (indexed)                │
    │  - ChatRoom (indexed)                   │
    │  - User Presence (in-memory)            │
    └─────────────────────────────────────────┘
```

### Data Models

#### ChatRoom
```javascript
{
  id: String (UUID),
  name: String,
  description: String,
  roomType: 'general' | 'vip' | 'admin' | 'owner' | 'private' | 'group',
  icon: String (emoji),
  accessLevel: 'public' | 'vip' | 'admin' | 'owner',
  isPrivate: Boolean,
  members: [{
    userId: String,
    userName: String,
    role: 'member' | 'moderator' | 'admin',
    joinedAt: Date,
    isMuted: Boolean
  }],
  createdBy: { userId, userName },
  createdAt: Date,
  lastMessageAt: Date,
  messageCount: Number,
  isPinned: Boolean,
  isArchived: Boolean
}
```

#### ChatMessage
```javascript
{
  id: String (UUID),
  roomId: String,
  userId: String,
  userName: String,
  userRole: 'vip' | 'admin' | 'owner',
  content: String (max 10,000 chars),
  status: 'sent' | 'delivered' | 'read',
  readBy: [{ userId, readAt }],
  editHistory: [{ originalContent, editedContent, editedAt }],
  reactions: [{ emoji, users: [userId] }],
  isPinned: Boolean,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

---

## User Roles & Permissions

### Owner Role (Denise, etc.)
- ✅ Create channels
- ✅ Send messages
- ✅ Edit own messages (24h limit)
- ✅ Delete any message
- ✅ Pin/unpin messages
- ✅ Manage all members
- ✅ Moderate conversations
- ✅ Archive channels
- ✅ Export chat logs
- ✅ View all analytics

### Admin Role (Admin team)
- ✅ Create channels
- ✅ Send messages
- ✅ Edit own messages (24h limit)
- ✅ Delete any message
- ✅ Pin/unpin messages
- ✅ Manage channel members
- ✅ Moderate conversations
- ✅ Archive channels
- ✅ View channel analytics

### VIP Role (VIP Members)
- ✅ Send messages
- ✅ Edit own messages (24h limit)
- ✅ Delete own messages
- ✅ Add reactions
- ✅ Mute channels
- ❌ Create channels (limited)
- ❌ Manage other members
- ❌ Delete others' messages
- ❌ Pin messages

### Standard Users
- ❌ Access chat (no access)
- ❌ Cannot participate
- *Can upgrade to VIP for access*

---

## Chat Channels

### Built-In Channels

#### 👥 General Discussion
- **Access**: All VIP, Admin, Owner
- **Type**: Public discussion
- **Members**: 5+
- **Purpose**: General announcements, team updates, casual chat
- **Guidelines**: Professional tone, on-topic discussions

#### 🎯 VIP Exclusive
- **Access**: VIP Members, Admin, Owner
- **Type**: VIP-only channel
- **Members**: 12+
- **Purpose**: VIP rewards, exclusive deals, member benefits
- **Guidelines**: VIP-specific content only

#### ⚙️ Admin Operations
- **Access**: Admin and Owner only
- **Type**: Private channel
- **Members**: 3-5
- **Purpose**: Internal operations, system updates, decisions
- **Guidelines**: Confidential business matters

#### 📦 Product Updates
- **Access**: All VIP, Admin, Owner
- **Type**: Announcement channel
- **Members**: Open
- **Purpose**: New products, promotions, announcements
- **Guidelines**: Official updates only (admin posts)

#### 💳 Payments & Billing
- **Access**: Admin and Owner only
- **Type**: Private financial channel
- **Members**: 2-3
- **Purpose**: Payment processing, billing issues, financial reports
- **Guidelines**: Confidential financial data

---

## Getting Started

### For Users

#### Accessing Chat
1. Open Sister's Promise app (web/iOS/Android)
2. Navigate to Chat section (💬 icon)
3. View list of available channels
4. Click on channel to open conversation
5. Type message and send

#### First Channel
- New VIP members automatically join **General Discussion**
- Admin/Owner can manually add users to other channels
- Visit channel info to see guidelines and members

#### Notifications
1. Tap notification to go directly to message
2. Mute channels with notification toggle
3. Enable desktop notifications in settings

### For Admins

#### Creating a New Channel
```
1. Click "Create Channel" button
2. Enter channel name and description
3. Select access level (public/vip/admin/owner)
4. Add initial members
5. Set channel rules
6. Click Create
```

#### Adding Members
```
1. Open channel
2. Click "Members" or "Info"
3. Select "Add Member"
4. Choose user and role
5. Confirm addition
```

#### Moderating Content
```
1. Hover over message
2. Click "..." menu
3. Options:
   - Edit (if your message)
   - Pin (admin only)
   - React (emoji)
   - Report/Delete (admin only)
```

---

## API Endpoints

### Chat Rooms

#### Create Room
```
POST /api/chat/rooms
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request:
{
  "name": "Sales Team",
  "description": "Sales coordination channel",
  "roomType": "group",
  "icon": "💼",
  "accessLevel": "public"
}

Response (201):
{
  "success": true,
  "message": "Chat room created successfully",
  "room": {
    "id": "uuid-xxx",
    "name": "Sales Team",
    "members": [...],
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

#### List Rooms
```
GET /api/chat/rooms
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "count": 5,
  "rooms": [
    {
      "id": "uuid-xxx",
      "name": "General Discussion",
      "roomType": "general",
      "members": [{ ... }],
      "lastMessageAt": "2026-01-15T10:30:00Z"
    },
    ...
  ]
}
```

#### Get Room Details
```
GET /api/chat/rooms/:roomId
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "room": {
    "id": "uuid-xxx",
    "name": "General Discussion",
    "description": "...",
    "members": 5,
    "createdAt": "2026-01-15T10:30:00Z",
    "settings": { ... }
  }
}
```

### Messages

#### Send Message
```
POST /api/chat/messages
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request:
{
  "roomId": "uuid-xxx",
  "content": "Hello everyone! 👋",
  "attachments": []
}

Response (201):
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid-xxx",
    "roomId": "uuid-xxx",
    "userId": "user-id",
    "content": "Hello everyone! 👋",
    "status": "sent",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

#### Get Messages
```
GET /api/chat/messages/:roomId?limit=50&skip=0
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "count": 50,
  "messages": [
    {
      "id": "uuid-xxx",
      "userId": "user-id",
      "userName": "Sarah",
      "content": "Great news!",
      "status": "read",
      "createdAt": "2026-01-15T10:30:00Z"
    },
    ...
  ]
}
```

#### Edit Message
```
PUT /api/chat/messages/:messageId
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request:
{
  "content": "Updated message content"
}

Response (200):
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "id": "uuid-xxx",
    "content": "Updated message content",
    "editHistory": [
      {
        "originalContent": "Original content",
        "editedAt": "2026-01-15T10:35:00Z"
      }
    ]
  }
}
```

#### Delete Message
```
DELETE /api/chat/messages/:messageId
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "message": "Message deleted successfully"
}
```

#### Mark as Read
```
POST /api/chat/messages/:messageId/read
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "message": "Message marked as read"
}
```

#### Pin Message
```
POST /api/chat/messages/:messageId/pin
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

Request:
{
  "roomId": "uuid-xxx"
}

Response (200):
{
  "success": true,
  "message": "Message pinned successfully"
}
```

### Search & Notifications

#### Search Messages
```
GET /api/chat/search?q=project&roomId=uuid-xxx
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "count": 12,
  "results": [
    {
      "id": "uuid-xxx",
      "content": "The project is on track",
      "userName": "Sarah",
      "roomId": "uuid-xxx"
    },
    ...
  ]
}
```

#### Get Unread Count
```
GET /api/chat/unread?roomId=uuid-xxx
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "unreadCount": 5
}
```

---

## WebSocket Events

### Client → Server

#### Authenticate
```javascript
ws.send(JSON.stringify({
  type: 'auth',
  payload: {
    token: 'JWT_TOKEN'
  }
}));
```

#### Send Message
```javascript
ws.send(JSON.stringify({
  type: 'message',
  payload: {
    roomId: 'uuid-xxx',
    content: 'Hello world!'
  }
}));
```

#### Subscribe to Room
```javascript
ws.send(JSON.stringify({
  type: 'subscribe:room',
  payload: {
    roomId: 'uuid-xxx'
  }
}));
```

#### Typing Status
```javascript
ws.send(JSON.stringify({
  type: 'typing',
  payload: {
    roomId: 'uuid-xxx',
    isTyping: true
  }
}));
```

#### Mark as Read
```javascript
ws.send(JSON.stringify({
  type: 'read:message',
  payload: {
    messageId: 'uuid-xxx',
    roomId: 'uuid-xxx'
  }
}));
```

#### Add Reaction
```javascript
ws.send(JSON.stringify({
  type: 'reaction',
  payload: {
    messageId: 'uuid-xxx',
    roomId: 'uuid-xxx',
    emoji: '👍',
    action: 'add'
  }
}));
```

### Server → Client

#### Auth Success
```javascript
{
  type: 'auth:success',
  userId: 'user-id',
  userName: 'Sarah',
  userRole: 'vip',
  timestamp: new Date()
}
```

#### New Message
```javascript
{
  type: 'message:new',
  message: {
    id: 'uuid-xxx',
    roomId: 'uuid-xxx',
    userId: 'user-id',
    userName: 'Sarah',
    content: 'Hello everyone!',
    status: 'delivered',
    createdAt: new Date()
  },
  timestamp: new Date()
}
```

#### User Typing
```javascript
{
  type: 'user:typing',
  userId: 'user-id',
  userName: 'Sarah',
  isTyping: true,
  timestamp: new Date()
}
```

#### User Online/Offline
```javascript
{
  type: 'presence:online',
  userId: 'user-id',
  userName: 'Sarah',
  userRole: 'admin',
  timestamp: new Date()
}

{
  type: 'presence:offline',
  userId: 'user-id',
  userName: 'Sarah',
  timestamp: new Date()
}
```

---

## Client Implementation

### Web Client (JavaScript/React)

```javascript
// Initialize WebSocket connection
class ChatClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.rooms = new Map();
    this.messages = new Map();
  }

  connect(wsUrl) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.authenticate();
        resolve();
      };

      this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
      this.ws.onerror = (error) => reject(error);
      this.ws.onclose = () => console.log('WebSocket closed');
    });
  }

  authenticate() {
    this.ws.send(JSON.stringify({
      type: 'auth',
      payload: { token: this.token }
    }));
  }

  subscribeToRoom(roomId) {
    this.ws.send(JSON.stringify({
      type: 'subscribe:room',
      payload: { roomId }
    }));
  }

  sendMessage(roomId, content) {
    this.ws.send(JSON.stringify({
      type: 'message',
      payload: { roomId, content }
    }));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'auth:success':
        console.log('Authenticated:', message.userId);
        break;
      case 'message:new':
        this.onNewMessage(message.message);
        break;
      case 'user:typing':
        this.onUserTyping(message);
        break;
      case 'presence:online':
        this.onUserOnline(message);
        break;
      case 'presence:offline':
        this.onUserOffline(message);
        break;
    }
  }

  onNewMessage(message) {
    // Update UI with new message
    console.log('New message:', message);
  }

  onUserTyping(data) {
    // Show typing indicator
    console.log(`${data.userName} is typing...`);
  }

  onUserOnline(data) {
    // Update presence in UI
    console.log(`${data.userName} came online`);
  }

  onUserOffline(data) {
    // Update presence in UI
    console.log(`${data.userName} went offline`);
  }
}

// Usage
const chat = new ChatClient(jwtToken);
await chat.connect('wss://localhost:443/ws/chat');
chat.subscribeToRoom('room-id-123');
chat.sendMessage('room-id-123', 'Hello!');
```

### Mobile Client (React Native)

```javascript
import { useState, useEffect } from 'react';

export function ChatScreen({ roomId, token }) {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const webSocket = new WebSocket('wss://localhost:443/ws/chat');

    webSocket.onopen = () => {
      webSocket.send(JSON.stringify({
        type: 'auth',
        payload: { token }
      }));

      webSocket.send(JSON.stringify({
        type: 'subscribe:room',
        payload: { roomId }
      }));
    };

    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message:new') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'user:typing') {
        setIsTyping(data.isTyping);
      }
    };

    setWs(webSocket);

    return () => webSocket.close();
  }, [roomId, token]);

  const sendMessage = (content) => {
    ws?.send(JSON.stringify({
      type: 'message',
      payload: { roomId, content }
    }));
  };

  return (
    <View>
      <MessageList messages={messages} isTyping={isTyping} />
      <MessageInput onSend={sendMessage} />
    </View>
  );
}
```

---

## Security

### Encryption
- **In Transit**: TLS 1.2+ (HTTPS/WSS only)
- **At Rest**: Database encryption enabled
- **Message Auth**: JWT validation on all messages

### Access Control
- **Role-Based Access**: Only VIP, Admin, Owner can access
- **Channel Permissions**: Granular per-channel access control
- **Rate Limiting**: 100 messages per 15 minutes per user
- **Input Validation**: Maximum 10,000 characters per message

### Privacy
- **Private Channels**: Visible only to members
- **Presence Tracking**: Only within subscribed rooms
- **No Data Logging**: Messages not logged to external services
- **GDPR Compliant**: Users can export/delete their data

### Moderation
- **Admin Controls**: Delete inappropriate messages
- **Spam Prevention**: Automatic spam detection
- **User Banning**: Remove disruptive users from channels
- **Audit Trail**: All actions logged with timestamps

---

## Best Practices

### For Users

1. **Professional Communication**
   - Use appropriate language
   - Stay on-topic in each channel
   - Use threads for related discussions

2. **Notification Management**
   - Mute channels during work to reduce distractions
   - Review unread badges periodically
   - Set notifications for important channels

3. **Search Effectively**
   - Use specific keywords for better results
   - Search within specific rooms if needed
   - Review pinned messages for important info

4. **Message Editing**
   - Fix typos within 24 hours
   - Don't significantly alter meaning after sending
   - Use reactions for quick acknowledgments

### For Admins

1. **Channel Management**
   - Create channels for specific purposes
   - Set clear guidelines for each channel
   - Archive inactive channels after 90 days
   - Regular member list audits

2. **Moderation**
   - Review flagged messages promptly
   - Warn before removing members
   - Document moderation actions
   - Keep admin operations private

3. **Communication**
   - Use system messages for announcements
   - Pin important messages
   - Provide timely updates
   - Respond to member questions

4. **Performance**
   - Limit rooms to under 100 members for performance
   - Archive old rooms periodically
   - Monitor database size
   - Regular backups

---

## Troubleshooting

### WebSocket Connection Issues

**Problem**: WebSocket connects then immediately closes
```
Solution:
1. Verify JWT token is valid and not expired
2. Check network connectivity
3. Ensure WSS (secure) is enabled
4. Check browser console for errors
```

**Problem**: Messages not sending
```
Solution:
1. Verify you're subscribed to the room
2. Check message length (max 10,000 chars)
3. Ensure authentication succeeded
4. Try fallback to HTTP polling
```

### Message Visibility

**Problem**: Messages from other users not appearing
```
Solution:
1. Refresh chat page/app
2. Unsubscribe and resubscribe to room
3. Clear browser cache
4. Check user's internet connection
```

**Problem**: My message appears but others don't see it
```
Solution:
1. Check message status (should be "delivered")
2. Verify room access permissions
3. Try sending again
4. Contact admin if issue persists
```

### Performance Issues

**Problem**: Chat is slow or laggy
```
Solution:
1. Disable read receipts if not needed
2. Limit displayed messages (pagination)
3. Reduce typing indicators
4. Check network latency
```

**Problem**: Typing indicators show constantly
```
Solution:
1. Disable typing indicators in settings
2. Clear browser cache
3. Restart WebSocket connection
4. Check for browser extensions interfering
```

### Access Issues

**Problem**: Can't see certain channels
```
Solution:
1. Check your user role (must be VIP, Admin, or Owner)
2. Verify you've been added to the channel
3. Check if channel is archived
4. Contact admin for access request
```

**Problem**: Can't send messages
```
Solution:
1. Verify authentication is active
2. Check user role has send permission
3. Ensure channel is not read-only
4. Verify message passes validation
```

---

## Performance Metrics

### Target Performance
- Message delivery: < 100ms
- Connection establish: < 500ms
- Search query: < 1s
- Room list load: < 500ms

### Capacity
- Concurrent connections: 1,000+
- Messages per room: Unlimited
- Members per channel: 500+
- Max file size: 50MB (future)

### Monitoring
- Message throughput: 100+ msgs/sec
- Connection uptime: 99.9%
- Database query time: < 50ms avg
- WebSocket heartbeat: 30s interval

---

## Future Enhancements

### Phase 2 (Q2 2026)
- Video/Audio calls
- Screen sharing
- File upload and sharing
- Scheduled messages
- Message templates

### Phase 3 (Q3 2026)
- Integration with CRM
- Chatbots and automated responses
- Advanced analytics
- Custom webhooks
- Message reactions gallery

### Phase 4 (Q4 2026)
- End-to-end encryption
- Message retention policies
- Advanced moderation tools
- Multi-workspace support
- Mobile app deep linking

---

## Support & Feedback

**Issues or Questions?**
- Admin: admin@sisterspromise.com
- Owner: denise@sisterspromise.com
- Support Hours: 9 AM - 5 PM EST, Monday-Friday

**Reporting Bugs**
1. Include error message/screenshot
2. Provide steps to reproduce
3. Note device/browser details
4. Send to support email

**Feature Requests**
Submit ideas to: feedback@sisterspromise.com

---

## Changelog

### v1.0.0 (January 2026)
✅ WebSocket real-time messaging
✅ 5 default channels
✅ 19 REST API endpoints
✅ Message search and filtering
✅ Emoji reactions
✅ Message pinning
✅ User presence tracking
✅ Edit history
✅ Read receipts
✅ Typing indicators
✅ Admin moderation tools
✅ HTTPS/TLS encryption
✅ JWT authentication

---

**Last Updated:** January 15, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
