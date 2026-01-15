# Moderation System API Reference

## Quick Start

### For Users (Reporting)

```bash
# Report a message
curl -X POST http://localhost:3000/api/chat/messages/{messageId}/report \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "harassment",
    "description": "User was calling me names"
  }'

# Check if user is muted (UI helper)
curl -X POST http://localhost:3000/api/chat/mute-check \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "roomId": "room-id"}'
```

### For Admins (Management)

```bash
# Get pending reports
curl -X GET "http://localhost:3000/api/chat/reports?status=pending" \
  -H "Authorization: Bearer {admin-token}"

# Resolve a report
curl -X POST http://localhost:3000/api/chat/reports/{reportId}/resolve \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "user_muted",
    "notes": "User violated harassment policy"
  }'

# Mute a user
curl -X POST http://localhost:3000/api/chat/mute \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "userName": "username",
    "reason": "harassment",
    "duration": 604800000,
    "roomId": null
  }'

# Get muted users
curl -X GET "http://localhost:3000/api/chat/muted?muteType=global" \
  -H "Authorization: Bearer {admin-token}"

# Unmute a user
curl -X DELETE "http://localhost:3000/api/chat/mute/user-id" \
  -H "Authorization: Bearer {admin-token}"
```

---

## API Endpoints

### 1. REPORT ENDPOINTS

#### POST /api/chat/messages/{messageId}/report
**Report a message**

```
Endpoint: /api/chat/messages/{messageId}/report
Method: POST
Auth: Required (any authenticated user)
Rate Limit: 10 per hour per user
```

**Request Body:**
```json
{
  "reason": "harassment",
  "description": "Optional details about the report"
}
```

**Valid Reasons:**
- `spam` - Repetitive, unwanted messages
- `harassment` - Abusive or threatening content
- `inappropriate_content` - Adult, violent, or explicit material
- `misinformation` - False or misleading information
- `offensive_language` - Hate speech or slurs
- `advertising` - Unsolicited promotional content
- `other` - Anything not covered above

**Success Response (200):**
```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "messageId": "msg-uuid",
    "reportedBy": {
      "userId": "user-id",
      "userName": "reporter-name",
      "userRole": "standard"
    },
    "reason": "harassment",
    "status": "pending",
    "reportCount": 1,
    "createdAt": "2024-12-10T14:30:00Z"
  },
  "message": "Message reported successfully"
}
```

**Error Responses:**
```json
// 400 - Invalid reason
{
  "success": false,
  "error": "Invalid reason provided"
}

// 400 - Already reported
{
  "success": false,
  "error": "You have already reported this message"
}

// 404 - Message not found
{
  "success": false,
  "error": "Message not found"
}

// 401 - Not authenticated
{
  "success": false,
  "error": "Not authenticated"
}
```

---

#### GET /api/chat/reports
**Get all reports (Admin/Owner only)**

```
Endpoint: /api/chat/reports
Method: GET
Auth: Required (Admin/Owner only)
```

**Query Parameters:**
```
?status=pending              // Filter by status (pending, under_review, resolved, dismissed)
?roomId=room-id            // Filter by room
?reason=harassment         // Filter by reason
?reportedUser=user-id      // Filter by reported user
?page=1                    // Page number (1-based)
?limit=20                  // Items per page (1-50, default 20)
```

**Success Response (200):**
```json
{
  "success": true,
  "reports": [
    {
      "id": "report-uuid-1",
      "messageId": "msg-uuid",
      "roomId": "room-general",
      "reportedBy": {
        "userId": "user-1",
        "userName": "Reporter",
        "userRole": "standard"
      },
      "reportedUser": {
        "userId": "user-2",
        "userName": "Offender"
      },
      "reason": "harassment",
      "description": "User was calling me names",
      "messageContent": "Original message text",
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
  ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

**Error Response (401/403):**
```json
{
  "success": false,
  "error": "Access denied"
}
```

---

#### GET /api/chat/reports/{reportId}
**Get specific report details**

```
Endpoint: /api/chat/reports/{reportId}
Method: GET
Auth: Required (Admin/Owner only)
```

**Success Response (200):**
```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "messageId": "msg-uuid",
    "roomId": "room-general",
    "reportedBy": {
      "userId": "user-1",
      "userName": "Reporter",
      "userRole": "standard"
    },
    "reportedUser": {
      "userId": "user-2",
      "userName": "Offender"
    },
    "reason": "harassment",
    "description": "User was calling me names",
    "messageContent": "Original message text",
    "status": "under_review",
    "reportCount": 3,
    "reporters": [
      { "userId": "user-1", "reportedAt": "2024-12-10T14:30:00Z" },
      { "userId": "user-3", "reportedAt": "2024-12-10T14:35:00Z" },
      { "userId": "user-5", "reportedAt": "2024-12-10T14:40:00Z" }
    ],
    "resolution": null,
    "createdAt": "2024-12-10T14:30:00Z",
    "updatedAt": "2024-12-10T14:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Report not found"
}
```

---

#### POST /api/chat/reports/{reportId}/resolve
**Resolve a report (Admin/Owner only)**

```
Endpoint: /api/chat/reports/{reportId}/resolve
Method: POST
Auth: Required (Admin/Owner only)
```

**Request Body:**
```json
{
  "action": "message_removed",
  "notes": "Message violated community guidelines"
}
```

**Valid Actions:**
- `message_removed` - Remove the message
- `user_muted` - Mute the user
- `warning_sent` - Send user a warning
- `no_action` - Close without action

**Success Response (200):**
```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "status": "resolved",
    "resolution": {
      "action": "message_removed",
      "notes": "Message violated community guidelines",
      "resolvedBy": "admin-id",
      "resolvedAt": "2024-12-10T15:00:00Z"
    }
  },
  "message": "Report resolved successfully"
}
```

**Error Responses:**
```json
// 400 - Invalid action
{
  "success": false,
  "error": "Invalid action provided"
}

// 404 - Report not found
{
  "success": false,
  "error": "Report not found"
}
```

---

### 2. MUTE ENDPOINTS

#### POST /api/chat/mute
**Mute a user (Admin/Owner only)**

```
Endpoint: /api/chat/mute
Method: POST
Auth: Required (Admin/Owner only)
```

**Request Body:**
```json
{
  "userId": "user-id",
  "userName": "username",
  "reason": "harassment",
  "duration": 604800000,
  "roomId": null
}
```

**Parameters:**
- `userId` (required): ID of user to mute
- `userName` (required): Name of user to mute
- `reason` (required): Reason for mute
  - `spam`
  - `harassment`
  - `inappropriate_content`
  - `repeated_violations`
  - `other`
- `duration` (optional): Duration in milliseconds
  - `null` = permanent
  - `3600000` = 1 hour
  - `86400000` = 1 day
  - `604800000` = 7 days
  - `2592000000` = 30 days
- `roomId` (optional): Room ID for room-specific mute
  - `null` = global mute
  - `"room-id"` = room-specific mute

**Success Response (200):**
```json
{
  "success": true,
  "mute": {
    "id": "mute-uuid",
    "mutedUserId": "user-id",
    "mutedUserName": "username",
    "roomId": null,
    "muteType": "global",
    "reason": "harassment",
    "description": "",
    "mutedBy": {
      "userId": "admin-id",
      "userName": "Admin",
      "userRole": "admin"
    },
    "mutedAt": "2024-12-10T14:45:00Z",
    "duration": 604800000,
    "expiresAt": "2024-12-17T14:45:00Z",
    "isPermanent": false,
    "isActive": true
  },
  "message": "User muted successfully"
}
```

**Error Responses:**
```json
// 400 - Already muted
{
  "success": false,
  "error": "User is already muted"
}

// 400 - Missing required fields
{
  "success": false,
  "error": "userId and userName are required"
}

// 400 - Invalid reason
{
  "success": false,
  "error": "Invalid reason provided"
}
```

---

#### DELETE /api/chat/mute/{userId}
**Unmute a user (Admin/Owner only)**

```
Endpoint: /api/chat/mute/{userId}
Method: DELETE
Auth: Required (Admin/Owner only)
Query Params: ?roomId=room-id (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "mute": {
    "id": "mute-uuid",
    "mutedUserId": "user-id",
    "isActive": false,
    "unmutedBy": "admin-id",
    "unmutedAt": "2024-12-10T15:05:00Z"
  },
  "message": "User unmuted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User is not muted"
}
```

---

#### GET /api/chat/muted
**Get list of muted users (Admin/Owner only)**

```
Endpoint: /api/chat/muted
Method: GET
Auth: Required (Admin/Owner only)
```

**Query Parameters:**
```
?muteType=global          // Filter: "global" or "room"
?roomId=room-id          // Filter by specific room
?page=1                  // Page number (1-based)
?limit=20                // Items per page (1-50, default 20)
```

**Success Response (200):**
```json
{
  "success": true,
  "mutedUsers": [
    {
      "id": "mute-uuid-1",
      "mutedUserId": "user-id",
      "mutedUserName": "DisruptiveUser",
      "roomId": null,
      "muteType": "global",
      "reason": "harassment",
      "description": "Multiple harassment complaints",
      "mutedBy": {
        "userId": "admin-id",
        "userName": "Admin",
        "userRole": "admin"
      },
      "mutedAt": "2024-12-08T14:45:00Z",
      "duration": 604800000,
      "expiresAt": "2024-12-15T14:45:00Z",
      "isPermanent": false,
      "isActive": true,
      "violations": [
        { "type": "harassment", "date": "2024-12-10T14:30:00Z" },
        { "type": "harassment", "date": "2024-12-09T10:15:00Z" }
      ]
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### 3. UTILITY ENDPOINTS

#### POST /api/chat/mute-check
**Check if user is muted (for UI)**

```
Endpoint: /api/chat/mute-check
Method: POST
Auth: Required (any authenticated user)
```

**Request Body:**
```json
{
  "userId": "user-id",
  "roomId": "room-id"
}
```

**Success Response - User Muted (200):**
```json
{
  "success": true,
  "isMuted": true,
  "muteType": "global",
  "reason": "harassment",
  "expiresAt": "2024-12-17T14:45:00Z"
}
```

**Success Response - User Not Muted (200):**
```json
{
  "success": true,
  "isMuted": false
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "userId is required"
}
```

---

#### POST /api/chat/violations
**Track violation for a user**

```
Endpoint: /api/chat/violations
Method: POST
Auth: Required (authenticated users)
```

**Request Body:**
```json
{
  "userId": "user-id",
  "violationType": "harassment",
  "reason": "Harassed other user"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Violation tracked"
}
```

---

## WebSocket Integration

### Client → Server Events

#### report-message
```javascript
{
  type: "report-message",
  payload: {
    messageId: "msg-uuid",
    reason: "harassment",
    description: "Optional details"
  }
}
```

### Server → Client Events

#### report-success
```javascript
{
  type: "report-success",
  message: "Message reported successfully",
  reportId: "report-uuid",
  reportCount: 3
}
```

#### user-muted
```javascript
{
  type: "user-muted",
  message: "You have been muted from the platform",
  reason: "harassment",
  expiresAt: "2024-12-17T14:45:00Z",
  muteType: "global"
}
```

#### user-unmuted
```javascript
{
  type: "user-unmuted",
  message: "Your mute has been lifted"
}
```

#### message-post-error (if user is muted)
```javascript
{
  type: "error",
  message: "You have been muted from the platform",
  muteReason: "harassment",
  expiresAt: "2024-12-17T14:45:00Z"
}
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer {jwt_token}
```

Token format:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "standard|vip|admin|owner",
  "iat": 1702250000,
  "exp": 1702336400
}
```

---

## Authorization

| Role | Can Report | Can Resolve | Can Mute | Can View Mutes |
|------|-----------|-----------|---------|----------------|
| standard | ✅ | ❌ | ❌ | ❌ |
| vip | ✅ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ |
| owner | ✅ | ✅ | ✅ | ✅ |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/chat/messages/:id/report | 1 per message per user | Forever |
| POST /api/chat/messages/:id/report | 10 total | 1 hour |
| POST /api/chat/mute | Unlimited (admin) | N/A |
| GET /api/chat/reports | 50 | 1 minute |
| GET /api/chat/muted | 50 | 1 minute |

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common error messages:
- "Not authenticated" - Missing or invalid token
- "Access denied" - Insufficient permissions
- "Invalid reason provided" - Invalid enum value
- "User is already muted" - Mute already exists
- "Message not found" - Message doesn't exist
- "You have already reported this message" - Duplicate report

---

## Implementation Examples

### JavaScript/Node.js

```javascript
// Report a message
async function reportMessage(messageId, reason, description) {
  const response = await fetch(`/api/chat/messages/${messageId}/report`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason, description })
  });
  
  return await response.json();
}

// Mute a user (admin)
async function muteUser(userId, userName, reason, duration) {
  const response = await fetch('/api/chat/mute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      userName,
      reason,
      duration
    })
  });
  
  return await response.json();
}

// Check if muted
async function checkMuteStatus(userId, roomId) {
  const response = await fetch('/api/chat/mute-check', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, roomId })
  });
  
  return await response.json();
}
```

### React Native

```javascript
// Report message
const reportMessage = async (messageId, reason) => {
  try {
    const response = await fetch(`${API_URL}/api/chat/messages/${messageId}/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason,
        description: ''
      })
    });
    
    const data = await response.json();
    if (data.success) {
      Alert.alert('Success', 'Message reported successfully');
    } else {
      Alert.alert('Error', data.error);
    }
  } catch (error) {
    console.error('Report error:', error);
  }
};
```

---

## Versioning

**Current Version**: 1.0.0  
**API Stability**: Stable  
**Last Updated**: December 2024

Future breaking changes will be communicated with 30-day notice.
