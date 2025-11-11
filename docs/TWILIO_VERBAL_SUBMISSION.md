# Twilio Toll-Free Verification – VERBAL OPT-IN SUBMISSION (Copy/Paste Reference)

This file provides authoritative, copy-paste ready values for each field in Twilio's Toll-Free Verification form after migrating to a **Verbal Opt-In** workflow. Use this version instead of any prior "Web Form" submission to avoid error 30513.

---
## 1. Estimated Monthly Volume
```
1000
```
(Adjust lower if current usage is significantly less; conservative values are fine.)

---
## 2. Opt-In Type
```
Verbal
```

---
## 3. Messaging Use Case Categories
```
Charity/501(c)(3) Nonprofit
```
(Only include categories that truly apply.)

---
## 4. Proof of Consent (Opt-In) Collected
Upload these screenshots (do NOT paste URLs here now):
1. User Detail Modal BEFORE consent – shows: "SMS Consent: Not Opted-In" + "Record Verbal Consent" button.
2. User Detail Modal AFTER consent – shows: "Opted-In" badge, timestamp, method (verbal).
(Optional) 3. Internal dispatcher script page or training PDF.

If Twilio UI requires text:
```
See attached screenshots of admin verbal consent workflow (before/after).
```

---
## 5. Use Case Description (Long Form)
```
We are a nonprofit rural transportation program. Dispatchers and case managers enroll riders by phone. During that call they obtain explicit verbal consent to send transactional SMS ride updates (driver assignment, pickup status, ETAs, completion). Messages are strictly operational, not marketing.
```

### Short Form (If Character-Limited)
```
Nonprofit transportation. Staff enrolls riders by phone, obtains verbal consent for ride status texts only.
```

---
## 6. Sample Messages
```
Your ride for 2:00 PM is scheduled. Driver: Sarah (555) 123-4567. Reply STOP to cancel.
Driver en route. ETA 1:55 PM. Reply STOP to cancel.
Ride complete. Thank you for using Rural Dispatch. Reply STOP to cancel.
```

---
## 7. Additional Information (Verbal Workflow – Copy/Paste)
Recommended full version (contains remediation narrative):
```
Prior submissions (30513) used a web form and were rejected. We removed the web checkbox and now use verbal consent only.
Workflow:
1) Dispatcher or case manager calls rider.
2) Script: "Our service sends ride updates by text message. Do you agree to receive text messages about your rides from Rural Dispatch? Reply STOP to cancel." 
3) If rider says YES, staff clicks "Record Verbal Consent" in admin.
4) System stores timestamp+method=verbal and sends confirmation SMS: "Rural Dispatch: You have been signed up for ride updates. Reply STOP to cancel, HELP for help. Msg&data rates may apply."
5) Rider can opt out via STOP anytime. Service still available by phone if they decline.
Transactional only. No marketing.
```

Shorter fallback (if strict character limit):
```
Staff phone call obtains verbal consent. Admin button records method=verbal, timestamp, sends confirmation SMS. STOP/HELP supported. Nonprofit, transactional only.
```

---
## 8. Opt-In Confirmation Message
```
Rural Dispatch: You have been signed up for ride updates. Reply STOP to cancel, HELP for help. Msg&data rates may apply.
```

---
## 9. Help Message Sample
```
Rural Dispatch: We send ride status texts only. Call (866) 901-7244 or reply STOP to cancel, HELP for help.
```

---
## 10. Privacy Policy URL (Optional)
```
https://ruraldispatch.org/privacy
```

---
## 11. Terms & Conditions URL (Optional)
```
https://ruraldispatch.org/terms
```

---
## 12. Opt-In Keywords (Not Used in Verbal Flow)
Leave blank OR add explanatory note:
```
N/A (Verbal opt-in only; no keyword enrollment.)
```

---
## 13. Compliance Checklist (Internal – Do Not Submit Unless Asked)
- Explicit verbal consent script used by staff.
- Consent action recorded (timestamp + method flag).
- Confirmation SMS sent after consent.
- STOP + HELP implemented in all messaging surfaces.
- No marketing or promotional content.
- Alternative channel available (phone calls) if user declines.
- Opt-out respected immediately; future messages suppressed.

---
## 14. Suggested Reviewer Note (Optional – If Additional Comments Field Exists)
```
This resubmission directly addresses prior 30513 rejection. Web opt-in removed; verbal-only flow implemented with audit trail + confirmation SMS. Screenshots attached.
```

---
## 15. Future Enhancements (Optional, Internal)
- Add staffUserId + staffName to consent record.
- Store confirmation message SID for audit.
- Provide exportable consent audit report.

---
## 16. FAQ (Internal)
Q: Should we still host /sms-consent page?
A: No. Remove or repurpose to describe STOP/HELP policy only.

Q: Can we mix verbal + keyword?
A: Yes, but pick ONE for the submission to keep it unambiguous.

Q: What if rider never answers?
A: They remain un-enrolled; dispatcher provides updates manually by phone.

---
## 17. Quick Copy Block (Minimal Entire Section For Fast Paste)
```
Opt-in Type: Verbal
Use Case: Nonprofit transportation – staff phones rider, obtains verbal consent for transactional ride status texts (driver assignment, pickup/ETA, completion). No marketing.
Workflow: Staff script asks consent, clicks admin "Record Verbal Consent" button, system timestamps + sends confirmation SMS. STOP/HELP supported. Phone alternative available if declined.
Confirmation: "Rural Dispatch: You have been signed up for ride updates. Reply STOP to cancel, HELP for help. Msg&data rates may apply."
Help: "Rural Dispatch: We send ride status texts only. Call (866) 901-7244 or reply STOP to cancel, HELP for help."
Sample: "Your ride for 2:00 PM is scheduled. Driver: Sarah (555) 123-4567. Reply STOP to cancel." + others.
Privacy: https://ruraldispatch.org/privacy
Terms: https://ruraldispatch.org/terms
Keywords: N/A (Verbal only)
```

---
## 18. Submission Strategy Tips
- Always upload BEFORE + AFTER screenshots.
- Keep narrative consistent: verbal-only, transactional, optional, alternate channel present.
- Do NOT include web checkbox references anywhere.
- If rejected again, open a support ticket referencing remediation and attach this doc.

---
## 19. Changelog
- 2025-11-10: Initial verbal opt-in submission file created.

---
**Use only the fields above for Twilio. This supersedes ALL previous web form guidance.**
