# Documentation Index

Welcome to Rural Dispatch documentation! This guide helps you find what you need quickly.

---

## 🚀 Getting Started

New to the project? Start here:

1. **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup, installation, running locally
2. **[Authentication](./AUTHENTICATION.md)** - Login, roles, permissions
3. **[Seeding Guide](./SEEDING.md)** - Populate database with demo data
4. **[API Reference](./API_REFERENCE.md)** - All API endpoints

---

## 📚 Core Documentation

### System Features

| Document | What's Inside | When to Use |
|----------|---------------|-------------|
| **[SMS System Guide](./SMS_SYSTEM_GUIDE.md)** | Complete SMS flow documentation | ⭐ Main SMS reference |
| **[Authentication](./AUTHENTICATION.md)** | Two-layer auth, roles, permissions | Understanding user access |
| **[API Reference](./API_REFERENCE.md)** | All endpoints, request/response formats | Building integrations |

### Development

| Document | What's Inside | When to Use |
|----------|---------------|-------------|
| **[Development Guide](./DEVELOPMENT_GUIDE.md)** | Local setup, dev workflow, commands | Starting development |
| **[Deployment Guide](./DEPLOYMENT.md)** | Railway/Render deployment | Going to production |
| **[Seeding Guide](./SEEDING.md)** | Database seeding commands | Populating test data |

### Frontend

| Document | What's Inside | When to Use |
|----------|---------------|-------------|
| **[UI Design System](./UI_DESIGN_SYSTEM.md)** | shadcn/ui components, design patterns | Building UI components |
| **[Zod Validation](./ZOD_VALIDATION.md)** | Form validation with React Hook Form | Creating forms |
| **[Shared Schemas](./SHARED_SCHEMAS.md)** | Shared types between client/server | Understanding data structures |

---

## 🔧 Configuration Guides

### SMS & Notifications

| Document | What's Inside | When to Use |
|----------|---------------|-------------|
| **[SMS Setup](./SMS_SETUP.md)** | Twilio/Vonage configuration | Setting up SMS providers |
| **[Toll-Free Verification](./TOLL_FREE_VERIFICATION.md)** | TCPA compliance, verification process | Twilio toll-free setup |

---

## 📖 Reference Materials

### Visual & Specs

| File | Type | Description |
|------|------|-------------|
| **[SMS Flow Diagram](./SMS_Flow_Diagram.excalidraw)** | Excalidraw | Visual SMS flow (open at excalidraw.com) |
| **[Ride Statuses & SMS Flow](./RideStatusesSMSFlow.csv)** | CSV | Original specification |

### Presentation Materials

| File | Type | Description |
|------|------|-------------|
| **[SMS Flow Presentation Guide](./SMS_FLOW_PRESENTATION_GUIDE.md)** | Guide | How to present SMS flow to your team |
| **[SMS Flow Team Handout](./SMS_FLOW_TEAM_HANDOUT.md)** | Handout | Quick reference for team members |

---

## 📋 Quick Links by Task

### "I want to..."

#### Set up the project locally
→ **[Development Guide](./DEVELOPMENT_GUIDE.md)**
→ **[Seeding Guide](./SEEDING.md)**

#### Understand how SMS works
→ **[SMS System Guide](./SMS_SYSTEM_GUIDE.md)** ⭐
→ **[SMS Flow Diagram](./SMS_Flow_Diagram.excalidraw)**

#### Configure Twilio/Vonage
→ **[SMS Setup](./SMS_SETUP.md)**
→ **[Toll-Free Verification](./TOLL_FREE_VERIFICATION.md)**

#### Deploy to production
→ **[Deployment Guide](./DEPLOYMENT.md)**

#### Build a new form
→ **[Zod Validation](./ZOD_VALIDATION.md)**
→ **[UI Design System](./UI_DESIGN_SYSTEM.md)**

#### Understand user roles
→ **[Authentication](./AUTHENTICATION.md)**

#### Add API endpoints
→ **[API Reference](./API_REFERENCE.md)**

---

## 🎯 Most Important Docs

If you only read 3 documents, read these:

1. **[SMS System Guide](./SMS_SYSTEM_GUIDE.md)** - Core feature documentation
2. **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Get up and running
3. **[Authentication](./AUTHENTICATION.md)** - Understanding user access

---

## 📊 Documentation Structure

```
/docs/
│
├── README.md (you are here!)
│
├── Getting Started
│   ├── DEVELOPMENT_GUIDE.md
│   ├── DEPLOYMENT.md
│   └── SEEDING.md
│
├── Core Systems
│   ├── SMS_SYSTEM_GUIDE.md ⭐
│   ├── AUTHENTICATION.md
│   └── API_REFERENCE.md
│
├── Configuration
│   ├── SMS_SETUP.md
│   └── TOLL_FREE_VERIFICATION.md
│
├── Frontend
│   ├── UI_DESIGN_SYSTEM.md
│   ├── ZOD_VALIDATION.md
│   └── SHARED_SCHEMAS.md
│
├── Presentation
│   ├── SMS_FLOW_PRESENTATION_GUIDE.md
│   └── SMS_FLOW_TEAM_HANDOUT.md
│
└── Reference
    ├── SMS_Flow_Diagram.excalidraw
    └── RideStatusesSMSFlow.csv
```

---

## 🔍 Find What You Need

### By Role

**Developers**:
- Development Guide
- API Reference
- Shared Schemas
- Zod Validation

**DevOps**:
- Deployment Guide
- SMS Setup
- Toll-Free Verification

**Product/Design**:
- SMS System Guide
- UI Design System
- SMS Flow Diagram

**QA/Testing**:
- SMS System Guide (Testing section)
- Seeding Guide
- Authentication

---

## 📝 Documentation Notes

### File Formats

- **Markdown (*.md)**: Text documentation
- **Excalidraw (*.excalidraw)**: Visual diagrams (open at excalidraw.com)
- **CSV (*.csv)**: Specifications and data

### Viewing Excalidraw Files

1. Go to https://excalidraw.com
2. Click "Open"
3. Select the `.excalidraw` file
4. View/edit the diagram

### Contributing to Docs

When updating documentation:
- Keep this README in sync
- Update version numbers in files
- Add "Last Updated" dates
- Link related documents

---

## 🎉 New Features (v2.0)

### SMS System Updates
- ✨ Auto-cleanup of completed tasks
- ✨ Shorter ride IDs (#532800)
- 🐛 Fixed tasks staying forever after execution

See [SMS_SYSTEM_GUIDE.md](./SMS_SYSTEM_GUIDE.md) for details.

---

## 🆘 Need Help?

- **Can't find what you need?** Check the table of contents above
- **Something unclear?** Open an issue or ask the team
- **Want to contribute?** Submit a pull request with doc improvements

---

## 📌 Quick Command Reference

```bash
# Run development server
npm run dev

# Seed database
npm run seed

# Build for production
npm run build

# Check scheduler status
curl http://localhost:5000/api/notifications/scheduler-status
```

---

**Last Updated**: November 13, 2025
**Documentation Version**: 2.0
