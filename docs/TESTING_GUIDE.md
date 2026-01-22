# Testing Guide

This guide explains how to set up and run tests for the Rural Dispatch application.

## 🧪 Testing Stack

- **Vitest**: Fast, TypeScript-native test runner
- **@vitest/ui**: Interactive test UI
- **c8/v8**: Code coverage reporting
- **Supertest**: HTTP endpoint testing (Fastify)
- **@testing-library/react**: React component testing

## 📦 Installation

### Backend (server-fastify)
```bash
cd server-fastify
bun add -D vitest @vitest/ui @types/node
```

### Frontend (client)
```bash
cd client
bun add -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

## 🏃 Running Tests

### Backend Tests
```bash
cd server-fastify

# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run tests with UI
bun test:ui
```

### Frontend Tests
```bash
cd client

# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

## 📝 Test Structure

### Backend Tests

```
server-fastify/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── smsResponseHandler.test.ts     # Unit tests
│   │   │   ├── notificationService.test.ts
│   │   │   └── scheduler.test.ts
│   ├── routes/
│   │   ├── __tests__/
│   │   │   ├── notificationWebhook.test.ts    # Integration tests
│   │   │   ├── rideRequestRoutes.test.ts
│   │   │   └── userRoutes.test.ts
│   └── utils/
│       └── __tests__/
│           └── dateUtils.test.ts
└── vitest.config.ts
```

### Frontend Tests

```
client/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── AssignDriver.test.tsx
│   │   │   ├── RideRequestForm.test.tsx
│   │   │   └── VehicleSearch.test.tsx
│   ├── utils/
│   │   └── __tests__/
│   │       └── dateUtils.test.ts
└── vitest.config.ts
```

## ✍️ Writing Tests

### Unit Test Example (SMS Response Handler)

```typescript
import { describe, it, expect } from 'vitest';
import { parseResponse } from '../smsResponseHandler.js';

describe('parseResponse', () => {
  it('should parse "1" as yes', () => {
    expect(parseResponse('1')).toBe(1);
  });

  it('should parse "yes" as 1', () => {
    expect(parseResponse('yes')).toBe(1);
  });
});
```

### Integration Test Example (Webhook)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { build } from '../../app.js';

describe('Twilio Webhook', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeEach(async () => {
    app = await build();
  });

  it('should handle incoming SMS', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/notifications/webhook/twilio',
      payload: {
        From: '+15551234567',
        Body: '1',
        MessageSid: 'SM123',
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

### Component Test Example (React)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignDriver from '../AssignDriver';

describe('AssignDriver', () => {
  it('should render driver and vehicle search', () => {
    render(<AssignDriver selectedRideRequestId="test-123" cancelFn={() => {}} />);

    expect(screen.getByText(/Select Driver/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Vehicle/i)).toBeInTheDocument();
  });

  it('should enable submit when both selected', async () => {
    const user = userEvent.setup();
    render(<AssignDriver selectedRideRequestId="test-123" cancelFn={() => {}} />);

    // Simulate selecting driver and vehicle
    const submitButton = screen.getByRole('button', { name: /Assign to Ride/i });
    expect(submitButton).toBeDisabled();
  });
});
```

## 🎯 Testing Best Practices

### 1. **Test the Critical Paths First**
   - SMS response handling (driver replies 1/2/3)
   - Ride status transitions
   - Webhook processing
   - Scheduler task creation

### 2. **Mock External Dependencies**
   ```typescript
   // Mock Prisma
   vi.mock('./prisma.client.js', () => ({
     prisma: {
       ride: {
         findUnique: vi.fn(),
         update: vi.fn(),
       },
     },
   }));

   // Mock Twilio/Vonage
   vi.mock('./services/smsProviders/TwilioProvider.js');
   ```

### 3. **Test Edge Cases**
   - Missing data (no driver, no rider)
   - Completed rides
   - Invalid phone numbers
   - Malformed SMS responses

### 4. **Use Descriptive Test Names**
   ```typescript
   ✅ it('should send "en route" notification when driver replies "2"')
   ❌ it('test driver response')
   ```

### 5. **Test SMS Flow Scenarios**

   ```typescript
   describe('Complete SMS Flow', () => {
     it('should handle full pickup flow', async () => {
       // 1. Driver assigned → status 100
       // 2. Driver arrival check sent
       // 3. Driver replies "1" (arrived) → notifications sent
       // 4. Driver pickup check sent
       // 5. Driver replies "1" (picked up) → status 300
       // 6. After 5 min → status 200
     });
   });
   ```

## 📊 Coverage Goals

Aim for:
- **Unit Tests**: >80% coverage for business logic
- **Integration Tests**: Cover all API endpoints
- **Critical Paths**: 100% coverage for SMS flow and status changes

## 🔍 Debugging Tests

```bash
# Run single test file
bun test smsResponseHandler.test.ts

# Run tests matching pattern
bun test --grep "driver arrival"

# Debug with UI
bun test:ui
```

## 🚀 CI/CD Integration

Add to your CI pipeline (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run backend tests
        run: cd server-fastify && bun test

      - name: Run frontend tests
        run: cd client && bun test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

## 🎓 Next Steps

1. **Add package.json scripts** (see below)
2. **Write tests for SMS response handler** (already created!)
3. **Add webhook integration tests**
4. **Test ride status transitions**
5. **Add frontend component tests**
6. **Set up CI/CD**

## 📦 Package.json Scripts

Add these to your `server-fastify/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

And to your `client/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```
