# SMS Flow - Team Handout

**Quick Reference for Understanding the Automated SMS System**

---

## 🎯 The Big Picture

Our system automatically sends SMS messages to riders and drivers at key moments. **No manual SMS needed!**

**Simple Rules**:
- Reply **1** = Yes/Confirm
- Reply **2** = No/Waiting/Cancel
- Reply **3** = Cancel (rider only)

---

## 📱 Complete Flow (Step by Step)

### Step 1: Ride Confirmed

**When**: Dispatcher assigns driver in dashboard

**SMS to Rider & Case Manager**:
```
Ride Confirmed!
Driver: [Driver Name]
Vehicle: [Vehicle Name]
11/7, 2:55:00 PM
Pickup: State Island St
Drop off: 5193 Windsome Ave

To Cancel ride, type 3
```

**What Happens**:
- Status: **100 - Ride Confirmed** ✅
- System schedules 1-hour reminder
- System schedules pickup check

---

### Step 2: One Hour Before Pickup

**When**: Automatically 1 hour before pickup time

**SMS to Rider**:
```
Your driver will arrive in 1 hour.
Reply 1 to confirm ride.
Reply 2 to cancel ride.
```

**What Happens**:
- Rider replies **1** → All good, continue ✅
- Rider replies **2** → Ride canceled, everyone notified ❌

---

### Step 3: At Pickup Time - Driver Arrival

**When**: At exact scheduled pickup time

**SMS to Driver**:
```
Have you arrived at pick up location?
Reply 1 for yes, 2 for no.
```

**What Happens**:

#### If Driver replies **1** (Arrived):
- Status: **200 - Ride Started**
- **Rider & Case Manager get**: "Driver has arrived"
- **Driver immediately gets**: "Have you picked up the rider and started the ride? 1-yes, 2-no"
- Go to Step 4 ✅

#### If Driver replies **2** (Not yet):
- **Rider & Case Manager get**: "Driver is en route"
- Check again in 5 minutes 🔄

---

### Step 4: Pickup Confirmation

**When**: After driver confirms arrival

**SMS to Driver**:
```
Have you picked up the rider and started the ride?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Picked Up):
- Status: **300 - Rider Picked Up** ✅
- System schedules dropoff check
- Go to Step 5 ✅

#### If Driver replies **2** (Waiting):
- **Rider & Case Manager get**:
  ```
  Driver is waiting. Driver will wait up to 5 minute before canceling ride. To cancel ride reply 2.
  ```
- After 5 minutes, ask again
- If driver replies **2** again → Continue asking (does not auto-cancel)

---

### Step 5: Dropoff Check

**When**: At estimated dropoff time (pickup time + travel time)

**SMS to Driver**:
```
Have you dropped off rider?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Dropped Off):
- Status: **400 - Rider Dropped Off** ✅
- **Rider & Case Manager get**: "You have been dropped off"
- **If NOT roundtrip** → Go to Step 7 (Complete) 🎉
- **If roundtrip** → Go to Step 6 🔄

#### If Driver replies **2** (Issue):
- System will **ask again in 5 minutes** 🔄
- Status stays at 300
- No immediate alert to dispatcher (keeps asking)

---

### Step 6: Roundtrip Return (If Applicable)

**When**: After dropoff on roundtrip rides

**SMS to Driver**:
```
Have you picked up the rider and started the return ride?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Return Started):
- Status: **450 - Roundtrip Returning** ✅
- System schedules return dropoff check
- Go to Step 7 ✅

#### If Driver replies **2** (Waiting):
- **Rider & Case Manager get**:
  ```
  Driver is waiting to return you to [pickup location].
  Driver will wait up to another 15 minutes.
  To cancel return ride, reply 2-Cancel.
  ```
- After 15 minutes, ask driver again
- If driver still replies **2** → Goes to Step 8 (Interrupted) ❌

---

### Step 7: Roundtrip Dropoff Check

**When**: At estimated return dropoff time

**SMS to Driver**:
```
Have you dropped off rider?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Completed):
- Status: **475 - Roundtrip Complete** 🎉
- **Rider & Case Manager get**:
  ```
  Your roundtrip is completed.
  Thank you for riding with EastConn
  ```
- Ride closes automatically ✅

#### If Driver replies **2** (Issue):
- Status: **479 - Roundtrip Completion Interrupted** ⚠️
- **Dispatcher alerted** - requires intervention
- Ride closes ❌

---

### Step 8: Non-Roundtrip Complete

**When**: After dropoff on non-roundtrip rides

**What Happens**:
- Status: **500 - Ride Complete** 🎉
- **Rider & Case Manager get**:
  ```
  Your ride is complete.
  Thank you for riding with EastConn
  ```
- Ride closes automatically ✅

---

## 🎯 Quick Decision Tree

```
Dispatcher Assigns Driver
    │
    ├── Rider gets "Ride Confirmed"
    │       ├── 1 Hour Prior → Rider gets reminder
    │       │       ├── Confirm (1) → Continue
    │       │       └── Cancel (2) → CANCELED
    │       │
    │       ├── At Pickup Time → Driver gets arrival check
    │       │       ├── Arrived (1) → Status: 200
    │       │       │       ├── Rider gets "Driver has arrived"
    │       │       │       └── Driver gets pickup check
    │       │       │
    │       │       └── En route (2) → Wait 5min, ask again
    │       │
    │       ├── Pickup Check → Driver confirms
    │       │       ├── Picked up (1) → Status: 300
    │       │       └── Waiting (2) → Ask again in 5min
    │       │
    │       └── Dropoff Check → Driver confirms
    │               ├── Dropped off (1) → Status: 400
    │               │       ├── NOT roundtrip → Status: 500 (Complete)
    │               │       └── Roundtrip → Return check
    │               └── Issue (2) → Ask again in 5min
    │
    └── Roundtrip Return → Driver confirms
            ├── Return started (1) → Status: 450 → Dropoff check
            └── Waiting (2) → Wait 15min → Status: 479 (Interrupted)
```

---

## 🔔 Scheduled Notifications Summary

| When | Who Gets SMS | Purpose |
|------|--------------|---------|
| **Immediately** | Rider + Case Manager | Ride confirmed notification |
| **1 hour before** | Rider | Reminder + last chance to cancel |
| **At pickup time** | Driver | Arrival check |
| **After arrival (1)** | Rider + Case Manager | Driver has arrived |
| **After arrival (2)** | Driver | Pickup confirmation |
| **At dropoff time** | Driver | Dropoff confirmation |
| **After waiting** | Driver | Roundtrip return check (if applicable) |
| **At return dropoff** | Driver | Return dropoff check |

---

## 📊 Status Codes Quick Reference

| Code | Status | Meaning | Description |
|------|--------|---------|-------------|
| **0** | Request in Progress | Just created | Initial state |
| **100** | Ride Confirmed | Driver assigned | Ready to go |
| **109** | Canceled by Rider | Rider/case mgr canceled | Ride cancelled |
| **200** | Ride Started | Driver arrived | Driver confirmed arrival |
| **209** | Ride Interrupted | Problem during ride | Requires intervention |
| **300** | Rider Picked Up | In transit | Driver confirmed pickup |
| **309** | Rider Not Picked Up | Pickup failed | Driver couldn't pickup |
| **400** | Rider Dropped Off | At destination | Driver confirmed dropoff |
| **409** | Not Dropped Off | Dropoff issue | Problem at destination |
| **450** | Roundtrip Returning | Return started | Return trip in progress |
| **459** | Roundtrip Return Interrupted | Return issue | Return trip failed |
| **475** | Roundtrip Complete | All done! | Return trip completed |
| **479** | Roundtrip Completion Interrupted | Return issue | Return dropoff failed |
| **500** | Ride Complete | Final status | Non-roundtrip completed |
| **509** | Ride Incomplete | Could not complete | Problem ended ride |

**Note**: Statuses marked with * in code auto-close the ride request.

---

## 🎯 Key Features

### ✅ Automated
- No manual SMS needed
- Right message at right time
- Scheduled automatically

### ✅ Interactive
- Simple responses (1, 2, 3)
- Instant confirmation
- Clear options

### ✅ Smart
- Keeps asking if no response
- Reschedules checks if needed
- Closes automatically when done

### ✅ Monitored
- Dashboard shows scheduled tasks
- Tasks disappear after execution
- Real-time visibility

---

## 💡 Example Scenario

**Sarah needs a doctor appointment ride at 2:00 PM**

```
12:30 PM  Dispatcher assigns Mike (driver)
          → Sarah gets: "Ride Confirmed! Driver: Mike..."
          → System schedules 1pm reminder + 2pm check

1:00 PM   Sarah gets: "Your driver will arrive in 1 hour..."
          → Sarah replies: "1" (confirmed)

2:00 PM   Mike gets: "Have you arrived?"
          → Mike replies: "1" (yes)
          → Status changes to 200 (Ride Started)

2:01 PM   Sarah gets: "Driver has arrived"
          Mike gets: "Have you picked up rider?"
          → Mike replies: "1"
          → Status changes to 300 (Rider Picked Up)

2:45 PM   Mike gets: "Have you dropped off rider?"
          → Mike replies: "1"
          → Status changes to 400 (Rider Dropped Off)
          → Status changes to 500 (Ride Complete)

2:46 PM   Sarah gets: "You have been dropped off"
          → Ride complete! ✅
```

**Total manual work by dispatcher**: 1 assignment
**Total SMS sent automatically**: 6-8 messages
**Time saved**: ~10-15 minutes per ride

---

## ❓ Common Questions

**Q: What if driver doesn't respond?**
> A: System waits and asks again in 5 minutes. Keeps asking.

**Q: Can they send custom messages?**
> A: Yes! Any message except 1/2/3 can be forwarded.

**Q: What if rider cancels last minute?**
> A: Reply "2" or "3" anytime before pickup.

**Q: How reliable is SMS delivery?**
> A: 95%+ via Twilio

**Q: What if wrong person replies?**
> A: System only accepts responses from registered driver/rider phones.

**Q: Can we change the message text?**
> A: Yes! All templates are in `/server-fastify/src/services/smsTemplates.ts`

**Q: What happens if driver says they haven't dropped off rider (reply 2)?**
> A: System asks again in 5 minutes. Does not alert dispatcher immediately.

---

## 🎓 For Dispatchers

**Your new workflow**:
1. Create ride request
2. Assign driver
3. **Everything else is automatic!** ✨

**When you get alerts**:
- Roundtrip interrupted (479) → Call to investigate
- Ride interrupted (209) → Call to resolve
- Rider not picked up (309) → Follow up
- Rider not dropped off (409) → Check status

**Dashboard shows**:
- Current ride status
- Scheduled notifications
- SMS conversation history

---

## 🎓 For Drivers

**Your new workflow**:
1. Show up at pickup time
2. Reply **1** when arrived
3. Reply **1** when picked up rider
4. Reply **1** when dropped off rider
5. **Done!** ✨

**Tips**:
- Keep phone handy
- Reply within a few minutes
- Reply "1" for yes to everything
- Reply "2" if still en route or waiting

---

## 📱 Try It Yourself!

**Test ride**:
1. Create ride with pickup in 10 minutes
2. Assign yourself as driver (use your phone)
3. Wait for arrival check SMS
4. Reply "1" when it arrives
5. Reply "1" to pickup check
6. Reply "1" to dropoff check

**You'll see**:
- SMS arrive at scheduled times
- Status updates automatically
- System handle everything

---

## 🎉 Benefits

**For Dispatchers**:
- Save 10-15 min per ride
- Less phone calls
- Fewer errors
- Better accountability

**For Drivers**:
- Clear instructions
- Know what to expect
- Easy responses (just "1")
- Can focus on driving

**For Riders**:
- Timely updates
- Know driver is coming
- Last-minute cancel option
- Professional experience

**For Organization**:
- Scale better
- Lower costs
- Higher satisfaction
- TCPA compliant

---

**Questions?** Ask anytime!

**Want to learn more?** See `/docs/SMS_SYSTEM_GUIDE.md`

**Ready to test?** See `/docs/SMS_FLOW_PRESENTATION_GUIDE.md`
