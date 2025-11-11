# Twilio Toll-Free Verification - FINAL SUBMISSION (Web Form)

## ✅ Complete Form - Copy-Paste Ready

**CRITICAL:** Opt-in type is **Web Form** (not Verbal) to match your UserForm.tsx checkbox implementation.

---

## 📋 Form Fields

### **Estimated monthly volume**
```
1000
```

---

### **Opt-in type**
```
Web Form
```

---

### **Messaging use case categories**
```
Charity/501(c)(3) Nonprofit
```

---

### **Proof of consent (opt-in) collected** ⭐
```
https://ruraldispatch.org/sms-consent
https://ruraldispatch.org/sms
```

**Why these URLs:** 
- `/sms-consent` - Interactive opt-in page with checkbox (shows how written consent is collected)
- `/sms` - Main SMS policy page (tells the full story: verbal + written opt-in, optional, STOP/HELP)
- Both URLs are public and demonstrate your complete opt-in workflow

---

### **Messaging use case description** (KEY FIX FOR 30513)

```
We send transactional SMS ride updates to riders/drivers in a nonprofit rural dispatch program. Messages are sent only after the rider opts in via web form during registration. SMS is optional; riders can receive ride info by phone instead.
```

**Why this works:**
- ✅ Matches opt-in type: "Web Form"
- ✅ Clearly states SMS is **optional**
- ✅ Explains it's **transactional** (ride-related only)
- ✅ States riders can use phone **instead**
- ✅ Fixes error 30513 (consent not a requirement)

---

### **Sample message**
```
Your ride for 2:00 PM is scheduled. Driver: Sarah, phone: (555) 123-4567. Reply YES to confirm, STOP to cancel texts.
```

**Why this works:**
- ✅ Clearly ride-related
- ✅ Shows actual workflow
- ✅ Gives opt-out option

---

### **E-mail for notifications**
```
dev@swarmnyc.com
```

---

### **Additional information** ⭐ (KEY FIX FOR 30498)
**Character limit: 500 chars**

```
Web form opt-in workflow:

1) Rider registers online at ruraldispatch.org
2) During registration, sees checkbox: "I consent to receive SMS text messages from Rural Dispatch"
3) Description states: "SMS is NOT required to use Rural Dispatch services"
4) If checked: consent recorded with timestamp, rider receives confirmation SMS
5) If unchecked: rider still gets full service via phone calls

Sample messages sent only for active rides.

Learn more: ruraldispatch.org/sms
```
**Character count: 461 chars** ✅

**Why this works:**
- ✅ Matches opt-in type: "Web Form"
- ✅ Describes exact UserForm.tsx checkbox workflow
- ✅ Says "NOT required" → fixes 30513
- ✅ Shows what happens if unchecked (service continues)
- ✅ Matches sample messages → fixes 30498
- ✅ Includes link to full SMS policy
- ✅ Under 500 character limit

---

### **Opt-In Confirmation Message** (REQUIRED - was blank)

```
Rural Dispatch: you're signed up to get ride updates by text. Reply STOP to cancel, HELP for help. Msg&data rates may apply.
```

**Why:** Filled fields show reviewers you have a complete process.

---

### **Help Message Sample** (REQUIRED - was blank)

```
Rural Dispatch: we send texts only about your scheduled transportation. Call (866) 901-7244 or reply STOP to cancel.
```

**Why:** Complete help workflow for riders.

---

### **Privacy Policy URL - optional**
```
https://ruraldispatch.org/privacy
```

---

### **Terms & Conditions URL - optional**
```
https://ruraldispatch.org/terms
```

---

### **Opt-In Keywords - optional**
```
START, YES, UNSTOP
```

---

## 🎯 Summary of Fixes

| Error | Problem | Solution |
|-------|---------|----------|
| **30498** | "Opt-in workflow doesn't match" | Changed description from "verbal" to "web form" to match opt-in type |
| **30513** | "SMS sounds required for service" | Added "SMS is NOT required to use Rural Dispatch services" |
| **30498 + 30513** | "Workflow contradiction" | Aligned all fields to describe web form checkbox in UserForm.tsx |

---

## ✅ Verification Checklist

Before submitting:

- [ ] Opt-in type is **Web Form** (matches checkbox in UserForm.tsx)
- [ ] URLs are `https://ruraldispatch.org/sms-consent` and `https://ruraldispatch.org/sms`
- [ ] Description says "opts in via web form" (not "verbal")
- [ ] Additional info describes checkbox workflow
- [ ] Language says "NOT required" (fixes 30513)
- [ ] Confirmation message is filled
- [ ] Help message is filled
- [ ] Sample message matches workflow
- [ ] All opt-in keywords are filled
- [ ] Privacy and Terms URLs are correct

---

## 🚀 What to Expect

**Timeline:** 5-7 days for response (resubmission)

**Why this should pass:**
- ✅ Opt-in type "Web Form" matches description (no contradiction)
- ✅ SMS clearly marked as "NOT required"
- ✅ Exact web form workflow described (UserForm.tsx checkbox)
- ✅ All required fields filled
- ✅ Messages match the workflow
- ✅ Consistent story across all fields

---

## 📞 Key Phrases Twilio Wants to See

✅ **"SMS is NOT required"** ← You have this now (in UserForm checkbox)  
✅ **"Riders can receive info by phone instead"** ← You have this now  
✅ **"Web form opt-in"** ← Matches your actual implementation  
✅ **"Transactional SMS only"** ← You have this now  
✅ **"Consent recorded with timestamp"** ← Your backend does this  

---

## 🎉 Ready to Submit!

Use the exact values above and you should get approved. The key was:

1. **Matching opt-in type to description** (Web Form = web form, not "verbal")
2. Making it crystal clear SMS ≠ Service (fixes 30513)
3. Describing the exact UserForm.tsx checkbox workflow (fixes 30498)
4. Filling all fields consistently (no contradictions)

Good luck! 🚀

---

**Credit:** Thanks to your co-worker for nailing down the exact issue and solution!
