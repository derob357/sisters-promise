# Moderation System Documentation

## Overview

The Sister's Promise moderation system provides comprehensive tools for managing community safety through user muting and post reporting. It's designed to maintain a healthy community environment while respecting user rights and maintaining transparency.

**Version**: 1.0.0  
**Date**: December 2024  
**Status**: Production Ready

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Reporting System](#user-reporting-system)
3. [User Muting System](#user-muting-system)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Database Models](#database-models)
7. [Admin Dashboard](#admin-dashboard)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────┐
│      User Interface (React Native/Web)      │
│  - Report buttons on messages               │
│  - Report modal form                        │
│  - Moderation dashboard                     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         WebSocket & REST API Layer          │
│  - /api/chat/messages/:id/report            │
│  - /api/chat/reports (GET/POST)             │
│  - /api/chat/mute (POST/DELETE)             │
│  - /api/chat/muted (GET)                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      ChatService & Business Logic           │
│  - reportMessage()                          │
│  - muteUser()                               │
│  - unmuteUser()                             │
│  - resolveReport()                          │
│  - checkIfUserMuted()                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│       MongoDB Database Layer                │
│  - Report Collection                        │
│  - MutedUser Collection                     │
│  - ChatMessage (updated)                    │
└─────────────────────────────────────────────┘
```

### Key Features

- **Report Aggregation**: Multiple users can report the same message
- **Auto-Expiration**: Temporary mutes automatically expire
- **Audit Trail**: Complete history of moderation actions
- **Role-Based Access**: Only admins/owners can resolve reports
- **Dual Scope Muting**: Global (platform-wide) or room-specific muting
- **Real-Time Updates**: WebSocket integration for live moderation
- **Mute Enforcement**: Users cannot post while muted

---

## User Reporting System

### Overview

Any member of the community can report inappropriate messages. Reports are aggregated and tracked for admin review.

### Report Workflow

```
User Clicks "Report"
        ↓
Report Modal Opens
        ↓
User Selects Reason & Optional Details
        ↓
Report Submitted to Server
        ↓
Check if Already Reported by User
        ├─ Yes: Return Error
        └─ No: Continue
        ↓
Create/Update Report Document
        ├─ New Report: status = "pending"
        ├─ Existing Report: Increment reportCount, Add Reporter
        ↓
Update ChatMessage with Report Count
        ↓
Success Response to User
        ↓
Admin Notified (if > 3 reports)
```

### Report Reasons

Reports can be categorized with the following reasons:

| Reason | Description | Action |
|--------|-------------|--------|
| **Spam** | Repetitive, unwanted messages | Usually removal |
| **Harassment** | Abusive or threatening content | User muting |
| **Inappropriate Content** | Adult, violent, or explicit material | Message removal + muting |
| **Misinformation** | False or misleading information | Message removal |
| **Offensive Language** | Hate speech or slurs | User muting |
| **Advertising** | Unsolicited promotional content | Message removal |
| **Other** | Anything not covered above | Case-by-case review |

### Report Status Workflow

```
pending (Initial state)
   ↓
under_review (Admin reviewing)
   ↓
┌─ resolved (Action taken)
├─ dismissed (No action needed)
└─ escalated (Needs higher review)
```

### Example Report Document

```json
{
  "id": "report-uuid-123",
  "messageId": "msg-uuid-456",
  "roomId": "room-general",
  "reportedBy": {
    "userId": "user-1",
    "userName": "Reporter123",
    "userRole": "standard"
  },
  "reportedUser": {
    "userId": "user-2",
    "userName": "OffensiveUser"
  },
  "reason": "harassment",
  "description": "User was calling me names",
  "messageContent": "You're terrible at using this product!",
  "status": "pending",
  "reportCount": 3,
  "reporters": [
    { "userId": "user-1", "reportedAt": "2024-12-10T14:30:00Z" },
    { "userId": "user-3", "reportedAt": "2024-12-10T14:35:00Z" },
    { "userId": "user-5", "reportedAt": "2024-12-10T14:40:00Z" }
  ],
  "resolution": null,
  "createdAt": "2024-12-10T14:30:00Z"
}
```

---

## User Muting System

### Overview

Admins and owners can mute users to prevent them from posting. Muting can be global (entire platform) or room-specific.

### Mute Types

#### 1. Global Mute
- User cannot post **anywhere** on the platform
- Visible across all chat rooms
- Typically used for severe violations

#### 2. Room-Specific Mute
- User cannot post in **specific room(s)**
- User can still post in other rooms
- Used for channel-specific issues

### Mute Duration Options

| Duration | Description | Use Case |
|----------|-------------|----------|
| Permanent | Indefinite | Severe violations, spammers |
| 1 Hour | Short-term | Testing/cooling off period |
| 24 Hours | One day | First-time violations |
| 7 Days | One week | Repeated violations |
| 30 Days | One month | Serious incidents |
| Custom | Any duration | Special cases |

### Mute Workflow

```
Admin Selects User to Mute
        ↓
Specify Mute Type (Global/Room)
        ↓
Select Duration (Permanent/Temporary)
        ↓
Choose Reason
        ↓
Optional: Add Description/Notes
        ↓
Submit Mute Request
        ↓
System Creates MutedUser Document
        ├─ If Permanent: expiresAt = null
        ├─ If Temporary: expiresAt = now + duration
        ↓
WebSocket Notification Sent to Muted User
        ↓
Muted User Cannot Post
        ├─ Error Message: "You have been muted"
        ├─ Shows Reason
        ├─ Shows Expiration (if temporary)
        ↓
(Temporary Mutes Only) Auto-Unmute After Expiration
        ├─ Background Job Runs
        ├─ Sets isActive = false
        ├─ User Notified
```

### Mute Reasons

| Reason | Severity | Auto-Duration |
|--------|----------|--------------|
| Spam | Low | 1 hour (temporary) |
| Harassment | High | 7 days (temporary) |
| Inappropriate Content | High | Permanent |
| Repeated Violations | Medium | 24 hours (temporary) |
| Other | Variable | Admin decides |

### Example MutedUser Document

```json
{
  "id": "mute-uuid-789",
  "mutedUserId": "user-2",
  "mutedUserName": "OffensiveUser",
  "roomId": null,
  "muteType": "global",
  "reason": "harassment",
  "description": "Multiple harassment complaints from community members",
  "mutedBy": {
    "userId": "admin-1",
    "userName": "Admin",
    "userRole": "admin"
  },
  "mutedAt": "2024-12-10T14:45:00Z",
  "duration": 604800000,
  "expiresAt": "2024-12-17T14:45:00Z",
  "isPermanent": false,
  "isActive": true,
  "violations": [
    { "type": "harassment", "date": "2024-12-10T14:30:00Z" },
    { "type": "harassment", "date": "2024-12-09T10:15:00Z" }
  ],
  "unmutedBy": null,
  "unmutedAt": null,
  "createdAt": "2024-12-10T14:45:00Z"
}
```

---

## API Endpoints

### Report Endpoints

#### POST /api/chat/messages/:messageId/report
**Report a message**

```javascript
// Request
{
  "reason": "harassment",  // Required: One of the 7 reasons
  "description": "User was calling me names"  // Optional, max 500 chars
}

// Response
{
  "success": true,
  "report": { /* Report document */ },
  "message": "Message reported successfully"
}

// Errors
400: Invalid reason
400: You have already reported this message
404: Message not found
```

**Permissions**: All authenticated users

---

#### GET /api/chat/reports
**Get all reports (paginated, filterable)**

```javascript
// Query Parameters
?status=pending
?roomId=room-uuid
?reason=harassment
?reportedUser=user-id
?page=1&limit=20

// Response
{
  "success": true,
  "reports": [ /* Array of Report documents */ ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

**Permissions**: Admin/Owner only  
**Sorting**: By creation date (newest first)  
**Default Limit**: 20 per page

---

#### GET /api/chat/reports/:reportId
**Get specific report details**

```javascript
// Response
{
  "success": true,
  "report": { /* Full Report document with all details */ }
}

// Errors
404: Report not found
```

**Permissions**: Admin/Owner only

---

#### POST /api/chat/reports/:reportId/resolve
**Resolve a report (take action)**

```javascript
// Request
{
  "action": "message_removed",  // Required: One of 4 actions
  "notes": "Message violated community guidelines"  // Optional
}

// Valid Actions
- "message_removed"  // Remove the message
- "user_muted"       // Mute the user
- "warning_sent"     // Send user a warning
- "no_action"        // Close without action

// Response
{
  "success": true,
  "report": {
    /* Updated Report document with resolution */
    "status": "resolved",
    "resolution": {
      "action": "message_removed",
      "notes": "...",
      "resolvedBy": "admin-1",
      "resolvedAt": "2024-12-10T15:00:00Z"
    }
  },
  "message": "Report resolved successfully"
}
```

**Permissions**: Admin/Owner only

---

### Mute Endpoints

#### POST /api/chat/mute
**Mute a user**

```javascript
// Request
{
  "userId": "user-id",           // Required
  "userName": "Username",        // Required
  "reason": "harassment",        // Required
  "duration": 604800000,         // Optional, milliseconds (null = permanent)
  "roomId": "room-id"            // Optional (null = global mute)
}

// Response
{
  "success": true,
  "mute": { /* MutedUser document */ },
  "message": "User muted successfully"
}

// Errors
400: User is already muted
400: Invalid reason
```

**Permissions**: Admin/Owner only

---

#### DELETE /api/chat/mute/:userId
**Unmute a user**

```javascript
// Query Parameters
?roomId=room-id  // Optional (for room-specific unmute)

// Response
{
  "success": true,
  "mute": {
    /* MutedUser document with unmute info */
    "isActive": false,
    "unmutedBy": "admin-1",
    "unmutedAt": "2024-12-10T15:05:00Z"
  },
  "message": "User unmuted successfully"
}

// Errors
400: User is not muted
```

**Permissions**: Admin/Owner only

---

#### GET /api/chat/muted
**Get list of muted users**

```javascript
// Query Parameters
?muteType=global    // Filter: "global" or "room"
?roomId=room-id     // Filter by specific room
?page=1&limit=20    // Pagination

// Response
{
  "success": true,
  "mutedUsers": [ /* Array of MutedUser documents */ ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

**Permissions**: Admin/Owner only

---

#### POST /api/chat/mute-check
**Check if user is muted (for UI)**

```javascript
// Request
{
  "userId": "user-id",    // Required
  "roomId": "room-id"     // Optional
}

// Response - If Muted
{
  "success": true,
  "isMuted": true,
  "muteType": "global",  // or "room"
  "reason": "harassment",
  "expiresAt": "2024-12-17T14:45:00Z"  // null if permanent
}

// Response - If Not Muted
{
  "success": true,
  "isMuted": false
}
```

**Permissions**: Authenticated users

---

#### POST /api/chat/violations
**Track violations for a user**

```javascript
// Request
{
  "userId": "user-id",              // Required
  "violationType": "harassment",    // Required
  "reason": "Harassed other user"   // Optional
}

// Response
{
  "success": true,
  "message": "Violation tracked"
}
```

**Permissions**: Authenticated users (internal use primarily)

---

## WebSocket Events

### Client → Server

#### report-message
**Report a message via WebSocket**

```javascript
{
  "type": "report-message",
  "payload": {
    "messageId": "msg-uuid",
    "reason": "harassment",
    "description": "Optional details"
  }
}
```

### Server → Client

#### report-success
**Confirmation of successful report**

```javascript
{
  "type": "report-success",
  "message": "Message reported successfully",
  "reportId": "report-uuid",
  "reportCount": 3
}
```

#### user-muted
**Notification that user is muted**

```javascript
{
  "type": "user-muted",
  "message": "You have been muted from the platform",
  "reason": "harassment",
  "expiresAt": "2024-12-17T14:45:00Z",  // null if permanent
  "muteType": "global"  // or "room"
}
```

#### user-unmuted
**Notification that mute has been lifted**

```javascript
{
  "type": "user-unmuted",
  "message": "Your mute has been lifted",
  "unmuteReason": "Optional explanation"
}
```

#### moderation-action
**Notification of moderation action (for admins)**

```javascript
{
  "type": "moderation-action",
  "action": "user-muted",
  "targetUserId": "user-id",
  "performedBy": "admin-id",
  "details": {
    "reason": "harassment",
    "duration": 604800000
  }
}
```

---

## Database Models

### Report Model

```javascript
{
  id: String (UUID, unique, indexed),
  messageId: String (indexed),
  roomId: String (indexed),
  reportedBy: {
    userId: String,
    userName: String,
    userRole: String
  },
  reportedUser: {
    userId: String,
    userName: String
  },
  reason: String (enum),
  description: String (max 500),
  messageContent: String,
  status: String (pending, under_review, resolved, dismissed),
  reportCount: Number (default: 1),
  reporters: [{
    userId: String,
    reportedAt: Date
  }],
  resolution: {
    action: String,
    notes: String,
    resolvedBy: String,
    resolvedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { roomId: 1, status: 1, createdAt: -1 }
- { reportedUser.userId: 1, status: 1 }
- { messageId: 1, status: 1 }
```

### MutedUser Model

```javascript
{
  id: String (UUID, unique, indexed),
  mutedUserId: String (indexed),
  mutedUserName: String,
  roomId: String (null = global),
  muteType: String (global, room),
  reason: String (enum),
  description: String,
  mutedBy: {
    userId: String,
    userName: String,
    userRole: String
  },
  mutedAt: Date,
  duration: Number (milliseconds, null = permanent),
  expiresAt: Date (indexed, null = permanent),
  isPermanent: Boolean,
  isActive: Boolean (indexed),
  violations: [{
    type: String,
    reason: String,
    date: Date
  }],
  unmutedBy: String,
  unmutedAt: Date,
  unmuteNotes: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { mutedUserId: 1, roomId: 1, isActive: 1 }
- { isActive: 1, expiresAt: 1 }
```

---

## Admin Dashboard

### Features

The admin dashboard provides comprehensive moderation tools:

### 1. Reports Section

**View all reports with:**
- Pending/Under Review/Resolved/Dismissed filters
- Filter by reason, room, or reported user
- Search functionality
- Report count and reporter list
- Message preview
- One-click resolution

**Actions:**
- View full report details
- Resolve with action selection
- Add resolution notes
- View reporter identities
- Message history for reported user

### 2. Muted Users Section

**View all muted users:**
- Global vs Room-specific filter
- Active/Inactive status
- Mute reason and duration
- Unmute button
- Muted by (admin/owner)
- Violation history

**Actions:**
- Unmute immediately
- View mute details
- See violation history
- Check mute expiration

### 3. Statistics Dashboard

**Key metrics:**
- Pending reports count
- Resolved reports count
- Active muted users count
- Temporary mutes expiring soon
- Reports by reason (chart)
- Most reported users
- Busiest channels

### 4. Moderation Logs

**Audit trail of:**
- All mutes applied/removed
- All reports submitted/resolved
- Actions taken (by admin/owner)
- Timestamps
- Reasons and notes

---

## Best Practices

### For Users

1. **Report Appropriately**
   - Use correct category for reason
   - Don't report disagreements (report rule violations)
   - Provide context in description

2. **Appeal Process**
   - If muted incorrectly, contact admin
   - Provide evidence of misunderstanding
   - Be respectful in appeals

### For Admins

1. **Report Review**
   - Review all pending reports daily
   - Assess validity before taking action
   - Document reasoning in resolution notes
   - Escalate complex cases

2. **Muting Policy**
   - Start with shorter durations
   - Increase severity for repeat offenders
   - Prefer room-specific mutes first
   - Reserve global mutes for serious cases

3. **Communication**
   - Notify users why they're muted
   - Explain duration and appeal process
   - Be consistent in enforcement

### Community Guidelines

1. **Zero Tolerance**
   - Hate speech → Permanent mute
   - Threats → Immediate removal
   - Harassment → 7-day mute (escalate)

2. **Education First**
   - First offense → Warning
   - Second offense → 24-hour mute
   - Third offense → 7-day mute
   - Fourth offense → Permanent mute

3. **Transparency**
   - Document all actions
   - Create public appeals process
   - Regular moderation reports

---

## Troubleshooting

### Issues

#### User Reports Not Saving
**Cause**: Database connection issue  
**Solution**: 
- Check MongoDB connection
- Verify database name
- Check for storage quota

#### Muted Users Can Still Post
**Cause**: Check not enforced on message send  
**Solution**:
- Verify `checkIfUserMuted()` is called before `sendMessage()`
- Check WebSocket handler for mute check
- Verify indexes on MutedUser collection

#### Temporary Mutes Not Expiring
**Cause**: Auto-unmute job not running  
**Solution**:
- Implement scheduled job using node-cron
- Add to server startup
- Verify job runs every 5 minutes

#### Reports Not Aggregating
**Cause**: New reports created instead of updating  
**Solution**:
- Check for existing pending report before creating new
- Verify reportCount increment
- Check reporters array update

### Common Commands

**Get all pending reports:**
```javascript
GET /api/chat/reports?status=pending
```

**View muted users:**
```javascript
GET /api/chat/muted?muteType=global
```

**Emergency: Unmute all users:**
```javascript
// Run in server console
await MutedUser.updateMany({}, { isActive: false });
```

**Clear old resolved reports (30+ days):**
```javascript
// Run in server console
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
await Report.deleteMany({ 
  status: 'resolved', 
  updatedAt: { $lt: thirtyDaysAgo } 
});
```

---

## Security Considerations

1. **Authorization**
   - All moderation endpoints protected with adminOrOwner middleware
   - Report submission available to all users
   - Mute check available to authenticated users

2. **Data Protection**
   - Reports contain user data (handle as sensitive)
   - Mute reasons logged (audit trail)
   - Message snapshots archived

3. **Rate Limiting**
   - Limit reports per user per message (1)
   - Rate limit report submissions (10/hour per user)
   - Rate limit mute actions (admin only, no limit)

4. **Privacy**
   - Reporter identities shown to admins only
   - Users notified when muted
   - Appeal information available

---

## Performance Optimization

### Indexes
- Report: `{roomId, status, createdAt}` - Admin queries
- Report: `{reportedUser.userId, status}` - User violations
- MutedUser: `{mutedUserId, roomId, isActive}` - Mute checks
- MutedUser: `{isActive, expiresAt}` - Auto-unmute queries

### Query Optimization
- Paginate reports (default 20/page)
- Use lean queries for read-only operations
- Cache active mutes in Redis (optional)
- Archive old reports quarterly

### Background Tasks
```javascript
// Auto-unmute expired mutes (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  await ChatService.autoUnmuteExpiredUsers();
});

// Archive old reports (daily)
cron.schedule('0 2 * * *', async () => {
  // Move resolved reports > 90 days to archive
});
```

---

## Future Enhancements

1. **Automated Detection**
   - Keyword filtering
   - Spam pattern detection
   - Auto-mute for repeated patterns

2. **Advanced Analytics**
   - User reputation scoring
   - Moderation team performance
   - Community health metrics

3. **Appeal System**
   - User appeal form
   - Admin review queue
   - Appeal history tracking

4. **Integration**
   - External moderation services
   - Slack notifications
   - Email alerts for critical reports

---

## Support

For issues or questions:
- Email: moderation@sisterspromise.app
- Admin Contact: admin-team@sisterspromise.app
- Report System Status: https://status.sisterspromise.app/moderation
