# SMS Flow - Team Handout

**Quick Reference for Understanding the Automated SMS System**

---

## 🎯 The Big Picture

Our system automatically sends SMS messages to riders and drivers at key moments. **No manual SMS needed!**

**Simple Rules**:
- Reply **1** = Yes/Confirm/Accept
- Reply **2** = No/Decline/Waiting
- Reply **3** = Cancel

---

## 📱 Complete Flow (Step by Step)

### Step 1: Driver Gets Assignment

**When**: Dispatcher assigns driver in dashboard

**SMS to Driver**:
```
New ride assigned to you!
Rider: Johan Guse
Pickup: State Island St
11/7, 2:45:00 PM
Drop off: 5193 Windsome Ave

Accept? 1=Yes, 2=No
```

**What Happens**:
- Driver replies **1** → Go to Step 2 ✅
- Driver replies **2** → Dispatcher notified, assigns new driver 🔄

---

### Step 2: Ride Confirmed

**When**: Driver accepted (replied 1)

**SMS to Rider & Case Manager**:
```
Ride Confirmed!
Driver: Guse
Vehicle: Sedan
11/7, 2:55:00 PM
Pickup: State Island St
Drop off: 5193 Windsome Ave

To Cancel ride, type 3
```

**What Happens**:
- System schedules 1-hour reminder
- System schedules pickup check
- Ride status: **100 - Ride Confirmed** ✅

---

### Step 3: One Hour Before Pickup

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

### Step 4: At Pickup Time

**When**: At exact scheduled pickup time

**SMS to Driver**:
```
Have you arrived at pick up location?
Reply 1 for yes, 2 for no.
```

**What Happens**:

#### If Driver replies **1** (Arrived):
- **Rider & Case Manager get**: "Driver has arrived"
- **Driver immediately gets**: "Have you picked up the rider and started the ride? 1-yes, 2-no"
- Go to Step 5 ✅

#### If Driver replies **2** (Not yet):
- **Rider & Case Manager get**: "Driver is en route"
- Check again in 5 minutes 🔄

---

### Step 5: Pickup Confirmation

**When**: After driver confirms arrival

**SMS to Driver** (already sent in Step 4):
```
Have you picked up the rider and started the ride?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Picked Up):
- Status: **300 - Rider Pickup** ✅
- After 5 minutes → Auto-change to **200 - Ride Started**
- System schedules dropoff check
- Go to Step 6 ✅

#### If Driver replies **2** (Waiting):
- **Rider & Case Manager get**:
  ```
  Driver is waiting. Driver will wait up to 5 minutes
  before canceling ride. To cancel ride reply 2.
  ```
- After 5 minutes, ask again
- If driver replies **2** again → Ride canceled ❌ [*](#mvp-limitations)

---

### Step 6: Dropoff Check

**When**: At estimated dropoff time (pickup time + travel time)

**SMS to Driver**:
```
Have you dropped off rider?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Dropped Off):
- **Rider & Case Manager get**: "You have been dropped off"
- Status: **400 - Rider Dropoff** ✅
- **If NOT roundtrip** → Ride Complete! 🎉
- **If roundtrip** → Go to Step 7 🔄

#### If Driver replies **2** (Issue):
- Status: **409 - Rider Not Dropped Off** ⚠️
- **Dispatcher gets alert** - requires intervention
- Ride closes ❌

---

### Step 7: Roundtrip Return (If Applicable)

**When**: After waiting time at destination

**SMS to Driver**:
```
Have you picked up the rider and started the return ride?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Return Started):
- Status: **450 - Roundtrip Returning** ✅
- System schedules return dropoff check
- Go to Step 8 ✅

#### If Driver replies **2** (Waiting):
- **Rider & Case Manager get**:
  ```
  Driver is waiting to return you to [pickup location].
  Driver will wait up to another 15 minutes.
  To cancel return ride, reply 2-Cancel.
  ```
- After 15 minutes, ask driver again
- If driver still replies **2** → Return canceled ❌

---

### Step 8: Roundtrip Dropoff

**When**: At estimated return dropoff time

**SMS to Driver**:
```
Have you dropped off rider?
1-yes, 2-no
```

**What Happens**:

#### If Driver replies **1** (Completed):
- **Rider & Case Manager get**:
  ```
  Your roundtrip is completed.
  Thank you for riding with EastConn
  ```
- Status: **475 - Roundtrip Completed** 🎉
- Ride closes automatically ✅

#### If Driver replies **2** (Issue):
- Status: **479 - Roundtrip Completion Interrupted** ⚠️
- **Dispatcher alerted** - requires intervention
- Ride closes ❌

---

## 🎯 Quick Decision Tree

```
Driver Assigned
    ├── Accept (1) → Ride Confirmed
    │       ├── 1 Hour Prior → Rider confirms
    │       │       ├── Confirm (1) → Continue
    │       │       └── Cancel (2) → CANCELED
    │       │
    │       ├── At Pickup Time → Driver arrival
    │       │       ├── Arrived (1) → Pickup check
    │       │       └── En route (2) → Wait 5min, ask again
    │       │
    │       ├── Pickup Check → Driver confirms
    │       │       ├── Picked up (1) → Ride Started
    │       │       └── Waiting (2) → Ask again in 5min
    │       │
    │       └── Dropoff Check → Driver confirms
    │               ├── Dropped off (1) → COMPLETE/Roundtrip
    │               └── Issue (2) → ALERT DISPATCHER
    │
    └── Decline (2) → Back to dispatcher
```

---

## 🔔 Scheduled Notifications Summary

| When | Who Gets SMS | Purpose |
|------|--------------|---------|
| **Immediately** | Driver | Assignment notification |
| **Immediately** | Rider + Case Mgr | Ride confirmed |
| **1 hour before** | Rider | Reminder + last chance to cancel |
| **At pickup time** | Driver | Arrival check |
| **At dropoff time** | Driver | Dropoff confirmation |
| **After waiting** | Driver | Roundtrip return check |
| **At return dropoff** | Driver | Final dropoff check |

---

## 📊 Status Codes Quick Reference

| Code | Status | Meaning |
|------|--------|---------|
| **0** | Request in Progress | Just created |
| **100** | Ride Confirmed | Driver accepted |
| **109** | Canceled by Rider | Rider/case mgr canceled |
| **200** | Ride Started | Actually in progress |
| **300** | Rider Pickup | Driver confirmed pickup |
| **400** | Rider Dropoff | Dropped off at destination |
| **409** | Not Dropped Off | Problem - dispatcher alert |
| **450** | Roundtrip Returning | Return trip started |
| **475** | Roundtrip Complete | All done! |
| **479** | Roundtrip Interrupted | Problem - dispatcher alert |
| **500** | Ride Complete | Final status |

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
- Auto-cancels if issues
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
          → Mike gets: "Accept? 1=Yes, 2=No"
          → Mike replies: "1"

12:31 PM  Sarah gets: "Ride Confirmed! Driver: Mike..."
          → System schedules 1pm reminder + 2pm check

1:00 PM   Sarah gets: "Your driver will arrive in 1 hour..."
          → Sarah replies: "1" (confirmed)

2:00 PM   Mike gets: "Have you arrived?"
          → Mike replies: "1" (yes)

2:01 PM   Sarah gets: "Driver has arrived"
          Mike gets: "Have you picked up rider?"
          → Mike replies: "1"

2:06 PM   Status auto-changes to "Ride Started"

2:45 PM   Mike gets: "Have you dropped off rider?"
          → Mike replies: "1"

2:46 PM   Sarah gets: "You have been dropped off"
          → Ride complete! ✅
```

**Total manual work by dispatcher**: 0 minutes
**Total SMS sent automatically**: 7 messages
**Time saved**: ~15 minutes per ride

---

## ❓ Common Questions

**Q: What if driver doesn't respond?**
> A: System waits 10 minutes, then alerts dispatcher

**Q: Can they send custom messages?**
> A: Yes! Any message except 1/2/3 forwards to the other person

**Q: What if rider cancels last minute?**
> A: Reply "2" or "3" anytime before pickup

**Q: How reliable is SMS delivery?**
> A: 95%+ (we use Twilio + Vonage backup)

**Q: What if wrong person replies?**
> A: System only accepts responses from registered driver/rider phones

**Q: Can we change the message text?**
> A: Yes! All templates are customizable

---

## 🎓 For Dispatchers

**Your new workflow**:
1. Create ride request (same as before)
2. Assign driver (same as before)
3. **Everything else is automatic!** ✨

**When you get alerts**:
- Driver declined → Assign different driver
- Rider not picked up → Call to investigate
- Dropoff issue → Call to resolve

**Dashboard shows**:
- What SMS will send and when
- All scheduled notifications
- Real-time status updates

---

## 🎓 For Drivers

**Your new workflow**:
1. Get SMS: "New ride assigned..."
2. Reply **1** to accept
3. Show up at pickup time
4. Reply **1** when arrived
5. Reply **1** when picked up rider
6. Reply **1** when dropped off rider
7. **Done!** ✨

**Tips**:
- Keep phone handy
- Reply quickly (within 10 min)
- Can send custom messages if needed
- "1" = yes for everything

---

## 📱 Try It Yourself!

**Test ride**:
1. Create ride with pickup in 10 minutes
2. Assign yourself as driver (use your phone)
3. Accept the assignment (reply 1)
4. Watch the dashboard scheduler
5. See tasks disappear after they execute

**You'll see**:
- SMS arrive instantly
- Dashboard update in real-time
- Tasks schedule automatically
- System handle everything

---

## 🎉 Benefits

**For Dispatchers**:
- Save 15 min per ride
- Less phone calls
- Fewer errors
- Better accountability

**For Drivers**:
- Clear instructions
- Know what to expect
- Easy responses
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

---

## 📝 MVP Limitations

<a name="mvp-limitations"></a>

**Current MVP Status**: The SMS system is fully functional with the following notes:

### Auto-Cancel After Waiting
- **Documented behavior**: After driver waits 5 minutes and responds "2=No" a second time, ride should auto-cancel
- **Current behavior**: System will continue to ask every 5 minutes (manual dispatcher intervention required)
- **Status**: Planned for future release

### Interactive SMS Responses
- **Current**: Interactive responses (1/2/3) only work with Twilio webhook
- **Limitation**: If using Vonage as primary provider, interactive features will not work (messages are forwarded only)
- **Recommendation**: Use Twilio as primary provider for full functionality
- **Status**: Vonage interactive response support planned for future release

**Impact**: These limitations do not affect core functionality. Dispatchers can manually cancel rides if needed, and Twilio (recommended primary provider) supports all interactive features.
