# Testing Guide for BailBondPro

This document provides comprehensive testing guidelines and strategies for the BailBondPro bail bond management system.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Strategy](#testing-strategy)
- [Test Types](#test-types)
- [Testing Frameworks](#testing-frameworks)
- [Setup and Configuration](#setup-and-configuration)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing approach follows the **Testing Pyramid** principle:

```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/__________\ Unit Tests (Many)
```

### Core Principles

1. **Fast Feedback**: Tests should run quickly to provide immediate feedback
2. **Reliable**: Tests should be deterministic and not flaky
3. **Maintainable**: Tests should be easy to understand and modify
4. **Comprehensive**: Critical paths should have thorough test coverage
5. **Isolated**: Tests should not depend on external services or state

## Testing Strategy

### Test Coverage Goals

| Test Type | Coverage Target | Purpose |
|-----------|----------------|---------|
| Unit Tests | 80%+ | Test individual functions and components |
| Integration Tests | Critical paths | Test API endpoints and database operations |
| E2E Tests | Main user flows | Test complete user workflows |
| Performance Tests | Key scenarios | Ensure system performance under load |
| Security Tests | All endpoints | Validate security measures |

### Risk-Based Testing

We prioritize testing based on:

- **Business criticality**: Core bail bond operations
- **Complexity**: Complex business logic and calculations
- **Frequency of change**: Areas that change frequently
- **User impact**: Features that directly affect users
- **Regulatory compliance**: Features required for legal compliance

## Test Types

### 1. Unit Tests

Test individual functions, methods, and components in isolation.

**Scope**: 
- Pure functions
- Component logic
- Utility functions
- Business logic

**Example**:
```typescript
// src/utils/bondCalculations.test.ts
import { calculateBondAmount, calculateFeeAmount } from './bondCalculations'

describe('Bond Calculations', () => {
  describe('calculateBondAmount', () => {
    it('should calculate 10% of bail amount for standard bonds', () => {
      const result = calculateBondAmount(10000, 'standard')
      expect(result).toBe(1000)
    })

    it('should calculate 15% for high-risk bonds', () => {
      const result = calculateBondAmount(10000, 'high-risk')
      expect(result).toBe(1500)
    })

    it('should handle minimum bond amounts', () => {
      const result = calculateBondAmount(100, 'standard')
      expect(result).toBe(500) // Minimum $500
    })
  })

  describe('calculateFeeAmount', () => {
    it('should calculate processing fee correctly', () => {
      const result = calculateFeeAmount(1000, 'processing')
      expect(result).toBe(50) // 5% processing fee
    })
  })
})
```

### 2. Integration Tests

Test the interaction between different parts of the system.

**Scope**:
- API endpoints
- Database operations
- External service integrations
- Authentication flows

**Example**:
```typescript
// src/api/bonds.integration.test.ts
import request from 'supertest'
import { app } from '../app'
import { prisma } from '../lib/prisma'
import { createTestUser, createTestClient } from '../test/helpers'

describe('Bonds API', () => {
  let authToken: string
  let testClient: any

  beforeAll(async () => {
    const user = await createTestUser()
    authToken = user.token
    testClient = await createTestClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/bonds', () => {
    it('should create a new bond', async () => {
      const bondData = {
        clientId: testClient.id,
        bailAmount: 10000,
        bondType: 'standard',
        courtDate: '2024-06-01T10:00:00Z'
      }

      const response = await request(app)
        .post('/api/bonds')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bondData)
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        clientId: testClient.id,
        bailAmount: 10000,
        bondAmount: 1000,
        status: 'pending'
      })

      // Verify database state
      const bond = await prisma.bond.findUnique({
        where: { id: response.body.id }
      })
      expect(bond).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bonds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)

      expect(response.body.errors).toContain('clientId is required')
    })
  })

  describe('GET /api/bonds/:id', () => {
    it('should retrieve bond details', async () => {
      const bond = await createTestBond()

      const response = await request(app)
        .get(`/api/bonds/${bond.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: bond.id,
        client: expect.objectContaining({
          name: expect.any(String)
        })
      })
    })
  })
})
```

### 3. End-to-End (E2E) Tests

Test complete user workflows from the browser perspective.

**Scope**:
- User authentication
- Bond creation workflow
- Payment processing
- Document management
- Reporting features

**Example**:
```typescript
// tests/e2e/bond-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Bond Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agent
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'agent@test.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new bond successfully', async ({ page }) => {
    // Navigate to new bond form
    await page.click('[data-testid="new-bond-button"]')
    await expect(page).toHaveURL('/bonds/new')

    // Fill client information
    await page.fill('[data-testid="client-name"]', 'John Doe')
    await page.fill('[data-testid="client-phone"]', '555-0123')
    await page.fill('[data-testid="client-email"]', 'john@example.com')

    // Fill bond details
    await page.fill('[data-testid="bail-amount"]', '10000')
    await page.selectOption('[data-testid="bond-type"]', 'standard')
    await page.fill('[data-testid="court-date"]', '2024-06-01')

    // Submit form
    await page.click('[data-testid="submit-bond"]')

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('.success-message')).toContainText('Bond created successfully')

    // Verify redirect to bond details
    await expect(page).toHaveURL(/\/bonds\/[a-zA-Z0-9-]+/)
    await expect(page.locator('[data-testid="bond-amount"]')).toContainText('$1,000.00')
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/bonds/new')
    
    // Try to submit empty form
    await page.click('[data-testid="submit-bond"]')

    // Check for validation errors
    await expect(page.locator('[data-testid="client-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="bail-amount-error"]')).toBeVisible()
  })

  test('should calculate bond amount correctly', async ({ page }) => {
    await page.goto('/bonds/new')
    
    // Fill minimum required fields
    await page.fill('[data-testid="client-name"]', 'Jane Doe')
    await page.fill('[data-testid="bail-amount"]', '5000')
    await page.selectOption('[data-testid="bond-type"]', 'standard')

    // Check calculated bond amount
    await expect(page.locator('[data-testid="calculated-bond-amount"]')).toContainText('$500.00')

    // Change to high-risk bond
    await page.selectOption('[data-testid="bond-type"]', 'high-risk')
    await expect(page.locator('[data-testid="calculated-bond-amount"]')).toContainText('$750.00')
  })
})
```

### 4. Performance Tests

Test system performance under various load conditions.

**Example**:
```typescript
// tests/performance/load-test.ts
import { check, sleep } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  }
}

const BASE_URL = 'http://localhost:3000'

export function setup() {
  // Login and get auth token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  })
  
  return { token: loginRes.json('token') }
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  }

  // Test various endpoints
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/bonds`, null, { headers }],
    ['GET', `${BASE_URL}/api/clients`, null, { headers }],
    ['GET', `${BASE_URL}/api/payments`, null, { headers }],
  ])

  responses.forEach(response => {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    })
  })

  sleep(1)
}
```

## Testing Frameworks

### Frontend Testing

**Jest + React Testing Library**
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.3.1",
    "jest-environment-jsdom": "^29.3.1"
  }
}
```

**Component Test Example**:
```typescript
// src/components/BondForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BondForm } from './BondForm'

describe('BondForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('should render all form fields', () => {
    render(<BondForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bail amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bond type/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<BondForm onSubmit={mockOnSubmit} />)
    
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should calculate bond amount correctly', async () => {
    const user = userEvent.setup()
    render(<BondForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText(/bail amount/i), '10000')
    await user.selectOptions(screen.getByLabelText(/bond type/i), 'standard')
    
    expect(screen.getByText(/bond amount: \$1,000\.00/i)).toBeInTheDocument()
  })
})
```

### Backend Testing

**Jest + Supertest**
```json
{
  "devDependencies": {
    "jest": "^29.3.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.12"
  }
}
```

### E2E Testing

**Playwright**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**Configuration**:
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Setup and Configuration

### Test Database

Use a separate test database:

```typescript
// src/test/setup.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
})

beforeAll(async () => {
  await prisma.$connect()
  // Run migrations
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean database before each test
  await prisma.payment.deleteMany()
  await prisma.bond.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
})
```

### Test Helpers

Create reusable test utilities:

```typescript
// src/test/helpers.ts
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function createTestUser(overrides = {}) {
  const userData = {
    email: 'test@example.com',
    password: await hash('password123', 10),
    name: 'Test User',
    role: 'AGENT',
    ...overrides
  }

  const user = await prisma.user.create({ data: userData })
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!)

  return { ...user, token }
}

export async function createTestClient(overrides = {}) {
  const clientData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0123',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    ...overrides
  }

  return prisma.client.create({ data: clientData })
}

export async function createTestBond(clientId?: string, overrides = {}) {
  const client = clientId ? { id: clientId } : await createTestClient()
  
  const bondData = {
    clientId: client.id,
    bailAmount: 10000,
    bondAmount: 1000,
    bondType: 'standard',
    status: 'active',
    courtDate: new Date('2024-06-01'),
    ...overrides
  }

  return prisma.bond.create({ 
    data: bondData,
    include: { client: true }
  })
}
```

## Running Tests

### NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run tests/performance/load-test.js"
  }
}
```

### Running Specific Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- BondForm.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e -- --headed

# Run performance tests
npm run test:performance
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
}
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI tools
- Terminal output shows coverage summary

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bailbondpro_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bailbondpro_test
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bailbondpro_test
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Best Practices

### General Testing Principles

1. **AAA Pattern**: Arrange, Act, Assert
   ```typescript
   it('should calculate bond amount', () => {
     // Arrange
     const bailAmount = 10000
     const bondType = 'standard'
     
     // Act
     const result = calculateBondAmount(bailAmount, bondType)
     
     // Assert
     expect(result).toBe(1000)
   })
   ```

2. **Descriptive Test Names**: Use clear, descriptive test names
   ```typescript
   // Good
   it('should return 400 when client name is missing')
   
   // Bad
   it('should validate input')
   ```

3. **Single Responsibility**: Each test should test one thing
4. **Independent Tests**: Tests should not depend on each other
5. **Fast Tests**: Keep tests fast by mocking external dependencies

### Mocking Guidelines

```typescript
// Mock external services
jest.mock('../services/paymentService', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true })
}))

// Mock database calls
jest.mock('../lib/prisma', () => ({
  prisma: {
    client: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

// Mock environment variables
process.env.JWT_SECRET = 'test-secret'
```

### Test Data Management

1. **Use Factories**: Create test data factories for consistent data
2. **Minimal Data**: Use minimal data required for the test
3. **Clean State**: Ensure clean state between tests
4. **Realistic Data**: Use realistic data that matches production

### Error Testing

```typescript
it('should handle database connection errors', async () => {
  // Mock database error
  jest.spyOn(prisma.client, 'create').mockRejectedValue(
    new Error('Database connection failed')
  )

  const response = await request(app)
    .post('/api/clients')
    .send(validClientData)
    .expect(500)

  expect(response.body.error).toBe('Internal server error')
})
```

## Troubleshooting

### Common Issues

1. **Tests Timing Out**
   - Increase timeout in Jest configuration
   - Check for unresolved promises
   - Ensure proper cleanup in afterEach/afterAll

2. **Database Connection Issues**
   - Verify test database URL
   - Check database is running
   - Ensure proper cleanup between tests

3. **Flaky E2E Tests**
   - Add proper waits for elements
   - Use data-testid attributes
   - Avoid hard-coded delays

4. **Memory Leaks**
   - Close database connections
   - Clear timers and intervals
   - Unmount components properly

### Debugging Tests

```typescript
// Add debug output
console.log('Test data:', testData)

// Use debugger
debugger

// Jest debugging
node --inspect-brk node_modules/.bin/jest --runInBand

// Playwright debugging
npx playwright test --debug
```

### Performance Issues

1. **Slow Tests**: Profile and optimize slow tests
2. **Parallel Execution**: Run tests in parallel when possible
3. **Database Optimization**: Use transactions for faster cleanup
4. **Mock Heavy Operations**: Mock expensive operations

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

For questions or suggestions about testing, please create an issue or reach out to the development team.