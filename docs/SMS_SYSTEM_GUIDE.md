# SMS System - Complete Guide

**Last Updated**: November 13, 2025
**Version**: 2.0 (with auto-cleanup)

Complete documentation for the interactive SMS notification system in Rural Dispatch.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [System Overview](#system-overview)
3. [Complete Flow](#complete-flow)
4. [Scheduled Tasks](#scheduled-tasks)
5. [Configuration](#configuration)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Interactive SMS Responses

| Response | Meaning | Alternative Text |
|----------|---------|------------------|
| **1** | Yes / Confirm / Accept | "yes", "accept", "confirm" |
| **2** | No / Decline / Waiting | "no", "decline", "reject" |
| **3** | Cancel | "cancel" |

### Task Types

| Icon | Task | When | Who |
|------|------|------|-----|
| 🔔 | 1 Hour Prior | 1h before pickup | Rider |
| ⏰ | Driver Arrival | At pickup time | Driver |
| 📅 | Dropoff Check | At estimated dropoff | Driver |
| 🔄 | Roundtrip Return | After waiting period | Driver |
| ⏱️ | Status Change | 5 min after pickup | Automatic |

---

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────┐
│                 SMS Flow System                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐       ┌──────────────┐       │
│  │   Twilio     │◄─────►│   Vonage     │       │
│  │  (Primary)   │       │  (Fallback)  │       │
│  └──────────────┘       └──────────────┘       │
│         │                        │              │
│         └────────────┬───────────┘              │
│                      │                          │
│         ┌────────────▼───────────┐              │
│         │  notificationService   │              │
│         └────────────┬───────────┘              │
│                      │                          │
│         ┌────────────▼───────────┐              │
│         │   smsResponseHandler   │              │
│         └────────────┬───────────┘              │
│                      │                          │
│         ┌────────────▼───────────┐              │
│         │      Scheduler         │              │
│         │  (auto-cleanup v2.0)   │              │
│         └────────────────────────┘              │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Components

1. **SMS Templates** (`/server/services/smsTemplates.js`)
   - All message templates
   - Dynamic content insertion
   - Multi-recipient support

2. **Response Handler** (`/server/services/smsResponseHandler.js`)
   - Parses incoming SMS
   - Determines context
   - Returns actions to take

3. **Scheduler** (`/server/services/scheduler.js`)
   - Time-based notifications
   - Auto-cleanup after execution ✨ NEW
   - Status change scheduling

4. **Notification Service** (`/server/services/notificationService.js`)
   - Provider abstraction (Twilio/Vonage)
   - Bulk sending
   - Delivery tracking

---

## Complete Flow

### 1. Driver Assignment

**Trigger**: Dispatcher assigns driver to ride

**SMS to Driver**:
```
New ride assigned to you!
Rider: John Doe
Pickup: 123 Main St
11/13, 2:00 PM
Drop off: 456 Park Ave

Accept? 1=Yes, 2=No
```

**Driver Options**:
- **Reply "1"** → Ride Confirmed (Status 100)
  - Rider & case manager notified
  - Schedules: 1-hour prior, arrival check
- **Reply "2"** → Driver Declined
  - Status: Driver Needed (200)
  - Dispatcher notified

---

### 2. One Hour Before Pickup

**Trigger**: Scheduled 1 hour before pickup time

**SMS to Rider**:
```
Hi John, your driver will arrive in 1 hour.
Pickup: 123 Main St at 2:00 PM

Reply 1 to confirm or 2 to cancel
```

**Rider Options**:
- **Reply "1"** → Confirmed, no action
- **Reply "2" or "3"** → Ride Canceled (Status 109)
  - All parties notified
  - Request closed automatically
  - All scheduled tasks canceled

---

### 3. At Pickup Time

**Trigger**: Scheduled at exact pickup time

**SMS to Driver**:
```
Have you arrived at pick up location?
Reply 1 for yes, 2 for no.
```

**Driver Options**:
- **Reply "1"** → Driver Arrived
  - Rider & case manager: "Driver has arrived"
  - Driver: "Have you picked up rider? 1=yes, 2=no"

- **Reply "2"** → Still En Route
  - Rider & case manager: "Driver is en route"
  - Arrival check rescheduled (5 min)

---

### 4. Pickup Confirmation

**Trigger**: After driver confirms arrival

**SMS to Driver**:
```
Have you picked up rider?
Reply 1 for yes, 2 for no.
```

**Driver Options**:
- **Reply "1"** → Rider Picked Up (Status 300)
  - All parties notified
  - **After 5 minutes**: Auto-change to Ride Started (Status 200)
  - Dropoff check scheduled

- **Reply "2"** → Waiting for Rider
  - Rider & case manager: "Driver is waiting"
  - Pickup check rescheduled (5 min)
  - ⚠️ *MVP Note: Auto-cancel after 2nd "No" not yet implemented - dispatcher intervention may be needed*

---

### 5. Dropoff Confirmation

**Trigger**: At estimated dropoff time (pickup + travel time)

**SMS to Driver**:
```
Have you dropped off rider at 456 Park Ave?
Reply 1 for yes, 2 for no.
```

**Driver Options**:
- **Reply "1"** → Rider Dropped Off (Status 400)
  - All parties notified
  - **If not roundtrip**: Ride Complete (Status 500)
  - **If roundtrip**: Schedule return check

- **Reply "2"** → Issue at Dropoff
  - Status: Rider Not Dropped Off (Status 409)
  - Dispatcher alerted
  - Request auto-closed

---

### 6. Roundtrip (If Applicable)

**Trigger**: After waiting period at destination

**SMS to Driver**:
```
Ready to start the return trip from 456 Park Ave?
Reply 1 for yes, 2 for issues.
```

**Driver Options**:
- **Reply "1"** → Return Trip Started (Status 450)
  - Pickup confirmation prompt
  - Return dropoff check scheduled

- **Reply "2"** → Return Interrupted (Status 459)
  - Dispatcher alerted
  - Request auto-closed

---

## Scheduled Tasks

### Dashboard Widget

The **Scheduled Tasks** card shows upcoming SMS and actions:

```
┌─────────────────────────────────┐
│ 🔔 Scheduled Tasks    [2 tasks] │
│ Automated SMS notifications     │
├─────────────────────────────────┤
│ 1 Active Ride    2 Pending Tasks│
├─────────────────────────────────┤
│ Ride #532800                    │
│ • 🔔 1 Hour Prior               │
│ • ⏰ Driver Arrival Check       │
└─────────────────────────────────┘
```

**Features**:
- Auto-refreshes every 30 seconds
- Click header to collapse/expand
- Admin/dispatcher only
- Shows task count even when collapsed

---

### Task Lifecycle

#### When Created

Tasks are scheduled automatically when:

1. **Ride Confirmed** (Status 100)
   - 1-hour prior reminder
   - Driver arrival check

2. **Rider Picked Up** (Status 300)
   - Status change (5 min delay)
   - Dropoff check

3. **Roundtrip Dropoff** (Status 400, roundtrip=true)
   - Return pickup check

#### When Removed ✨ NEW

Tasks automatically disappear after:

1. **✅ Successful Execution**
   - SMS sent → Task removed
   - Status changed → Task removed

2. **❌ Failed Execution**
   - Still removed (error logged)

3. **🗑️ Ride Canceled/Closed**
   - All tasks canceled
   - Ride removed from dashboard

4. **🔄 Server Restart**
   - All tasks cleared (in-memory)

---

### Example Timeline

```
9:00 AM - Driver accepts ride
          → Tasks: 1 Hour Prior, Driver Arrival

10:00 AM - 1 Hour Prior executes
          → SMS sent to rider
          ✅ Task removed from dashboard

11:00 AM - Driver Arrival executes
          → SMS sent to driver
          ✅ Task removed from dashboard

11:05 AM - Driver confirms pickup
          → Tasks: Status Change, Dropoff Check

11:10 AM - Status Change executes
          → Ride status updated
          ✅ Task removed from dashboard

11:30 AM - Dropoff Check executes
          → SMS sent to driver
          ✅ Task removed from dashboard

Dashboard: No tasks (all completed)
```

---

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Twilio (Primary Provider)
TWILIO_MESSAGING_SERVICE_SID=MGxxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/twilio
TWILIO_STATUS_CALLBACK_URL=https://yourdomain.com/api/notifications/status/twilio

# Vonage (Fallback Provider)
VONAGE_API_KEY=xxxxx
VONAGE_API_SECRET=xxxxx
VONAGE_FROM_NUMBER=+1234567890
VONAGE_WEBHOOK_URL=https://yourdomain.com/api/notifications/webhook/vonage

# Optional: Dispatcher alerts
DISPATCHER_PHONE=+1234567890
```

### Webhook Setup

#### Twilio
1. Go to Twilio Console → Phone Numbers
2. Select your number
3. Set Messaging Webhook: `https://yourdomain.com/api/notifications/webhook/twilio`

#### Vonage
1. Go to Vonage Dashboard → Settings
2. Set Inbound Webhook: `https://yourdomain.com/api/notifications/webhook/vonage`

> **⚠️ MVP Limitation**: Vonage webhook currently only forwards messages between rider/driver. Interactive responses (1/2/3) are only processed via Twilio webhook. For full functionality, use Twilio as your primary provider. Vonage interactive response support is planned for a future release.

**Note**: Use ngrok for local testing:
```bash
ngrok http 5000
# Use ngrok URL for webhooks: https://xxxxx.ngrok.io/api/...
```

For detailed setup instructions, see [SMS_SETUP.md](./SMS_SETUP.md).

---

## Testing Guide

### 1. Test Driver Assignment

```bash
# 1. Create a ride and assign driver
# 2. Driver receives: "Accept? 1=Yes, 2=No"
# 3. Send SMS from driver's phone: "1"

# Expected:
# - Ride status → 100 (Confirmed)
# - Rider/case manager receive confirmation
# - Dashboard shows 2 tasks scheduled
```

### 2. Test 1-Hour Prior

```bash
# 1. Create ride with pickup in 5 minutes
# 2. Wait 4 minutes (past 1-hour prior time)

# Expected:
# - Rider receives reminder SMS
# - Task disappears from dashboard
```

### 3. Test Pickup Flow

```bash
# 1. Manually trigger arrival check
# 2. Driver replies "1"

# Expected:
# - Rider: "Driver has arrived"
# - Driver: "Have you picked up rider?"
# - Driver replies "1"
# - Status: 300 (Rider Picked Up)
# - After 5 min: Status auto-changes to 200
```

### 4. Test Auto-Close

```bash
# Update ride status to 109 (Canceled)
curl -X PUT http://localhost:5000/api/riderequests/123 \
  -H "Content-Type: application/json" \
  -d '{"rideStatus": 109}'

# Expected:
# - requestStatus auto-set to 1100 (Closed)
# - All scheduled tasks canceled
# - Ride disappears from scheduler dashboard
```

### 5. Test Roundtrip

```bash
# 1. Create roundtrip ride
# 2. Complete pickup and dropoff
# 3. Check dashboard for return task

# Expected:
# - Roundtrip return check scheduled
# - Driver receives return prompt at estimated time
```

---

## Troubleshooting

### SMS Not Received

**Check**:
1. ✅ Phone numbers in E.164 format (+1234567890)
2. ✅ Twilio/Vonage credentials correct
3. ✅ Webhooks configured correctly
4. ✅ Server logs show SMS sent
5. ✅ Check Twilio/Vonage dashboard for delivery status

**Test**:
```bash
# Check notification service
curl http://localhost:5000/api/notifications/scheduler-status

# Look for errors in console
# Should see: "📨 SMS sent to +1234567890"
```

---

### Tasks Not Scheduling

**Check**:
1. ✅ Ride is confirmed (status >= 100)
2. ✅ Pickup time is in the future
3. ✅ Driver and rider have phone numbers
4. ✅ Check scheduler status endpoint
5. ✅ Server hasn't restarted (tasks are in-memory)

**Debug**:
```bash
# Check scheduler status
curl http://localhost:5000/api/notifications/scheduler-status

# Expected response:
{
  "success": true,
  "scheduler": {
    "totalRides": 1,
    "totalTasks": 2,
    "rides": [...]
  }
}
```

---

### Tasks Not Disappearing

**Check**:
1. ✅ Are you using new scheduler version? (v2.0 with auto-cleanup)
2. ✅ Check console for "✓ Removed completed task" logs
3. ✅ Refresh dashboard (auto-refreshes every 30s)
4. ✅ Verify task actually executed (check SMS sent logs)

**If still showing**:
- Restart server
- Tasks will re-create on next ride confirmation

---

### Response Not Recognized

**Check**:
1. ✅ Message is exactly "1", "2", "3" or text variations
2. ✅ User has active ride
3. ✅ Ride is in correct status for response
4. ✅ Check console for "📥 Incoming SMS" logs

**Valid Responses**:
- ✅ "1", "yes", "Yes", "YES", "accept"
- ✅ "2", "no", "No", "NO", "decline"
- ✅ "3", "cancel", "Cancel", "CANCEL"

---

### Auto-Close Not Working

**Check**:
1. ✅ Status is in closing list (109, 209, 309, 409, 459, 475, 500, 509)
2. ✅ Using ride update endpoint (PUT `/api/riderequests/:uuid`)
3. ✅ Check console for "🔒 Auto-closing" log
4. ✅ Verify requestStatus changed to 1100

**Closing Statuses**:
- 109 - Ride Canceled
- 209 - Ride Interrupted
- 309 - Rider Not Picked Up
- 409 - Rider Not Dropped Off
- 459 - Roundtrip Return Interrupted
- 479 - Roundtrip Completion Interrupted
- 475 - Roundtrip Complete
- 500 - Ride Complete
- 509 - Ride Incomplete

---

## API Endpoints

### Check Scheduler Status

```bash
GET /api/notifications/scheduler-status

Response:
{
  "success": true,
  "scheduler": {
    "totalRides": 2,
    "totalTasks": 5,
    "rides": [
      {
        "rideUuid": "532800",
        "taskCount": 3,
        "tasks": ["1_hour_prior", "driver_arrival_check", "dropoff_check"]
      }
    ]
  },
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

### Send Manual SMS

```bash
POST /api/notifications/send
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Test message",
  "rideUuid": "532800"
}
```

### Update Ride Status

```bash
PUT /api/riderequests/:uuid
Content-Type: application/json

{
  "rideStatus": 100
}

# Auto-closes if status is 109, 209, 309, 409, 459, 475, 479, 500, 509
```

---

## Files & Code

### Backend

| File | Purpose |
|------|---------|
| `/server/services/smsTemplates.js` | All SMS message templates |
| `/server/services/smsResponseHandler.js` | Parse and handle SMS replies |
| `/server/services/scheduler.js` | Time-based notifications + auto-cleanup |
| `/server/services/notificationService.js` | Provider abstraction (Twilio/Vonage) |
| `/server/routes/router.js` | Webhook endpoints, ride updates |
| `/server/constants/rideStatuses.js` | Ride status constants |

### Frontend

| File | Purpose |
|------|---------|
| `/client/src/components/SchedulerStatus.tsx` | Dashboard widget |
| `/client/src/pages/Dashboard.tsx` | Shows widget (admin/dispatcher only) |

---

## Additional Resources

- **Visual Flow**: See [SMS_Flow_Diagram.excalidraw](./SMS_Flow_Diagram.excalidraw)
- **Original Spec**: See [Ride Statuses & SMS Flow.csv](./Ride%20Statuses%20&%20SMS%20Flow.csv)
- **Configuration**: See [SMS_SETUP.md](./SMS_SETUP.md)
- **Toll-Free Verification**: See [TOLL_FREE_VERIFICATION.md](./TOLL_FREE_VERIFICATION.md)

---

## Version History

### v2.0 (November 13, 2025)
- ✨ **NEW**: Auto-cleanup of completed tasks
- ✨ **NEW**: Shorter ride IDs in dashboard (#532800)
- 🐛 **FIX**: Tasks no longer stay forever after execution
- 📝 **DOCS**: Consolidated documentation

### v1.0 (November 12, 2025)
- Initial implementation
- Interactive SMS responses
- Scheduled notifications
- Auto-close on completion
- Roundtrip support

---

---

## ⚠️ Known Limitations (MVP)

### Auto-Cancel After Driver Waiting
**Expected**: After driver waits 5 minutes and responds "2=No" a second time, ride auto-cancels
**Current**: System continues to ask every 5 minutes indefinitely
**Workaround**: Dispatcher can manually cancel ride if needed
**Status**: Planned for post-MVP release

### Vonage Interactive Responses
**Expected**: Both Twilio and Vonage webhooks process interactive responses (1/2/3)
**Current**: Only Twilio webhook processes interactive responses; Vonage webhook only forwards messages
**Recommendation**: Use Twilio as primary provider for full functionality
**Status**: Vonage interactive support planned for post-MVP release

### Impact
These limitations do not prevent the system from functioning. Core SMS flow works correctly with Twilio. Dispatchers have manual controls for edge cases.

---

**Status**: ✅ Production Ready (with noted MVP limitations)
**Last Updated**: November 14, 2025
**Maintainer**: Development Team
