# 🛠️ Development Guide

Complete guide for developers contributing to BailBondPro. This covers development setup, coding standards, testing, and contribution workflows.

## 🚀 Quick Start for Developers

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 14+
- **Git** for version control
- **VS Code** (recommended) with extensions

### Development Setup

#### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/BailBondPro.git
cd BailBondPro

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration
```

#### 2. Database Setup
```bash
# Start PostgreSQL (if using Docker)
docker run --name bailbondpro-db \
  -e POSTGRES_DB=bailbondpro \
  -e POSTGRES_USER=bailbondpro \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

#### 3. Start Development Servers
```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend development server
npm run dev:client

# Terminal 3: Start database studio (optional)
npm run db:studio
```

#### 4. Verify Setup
- Backend API: http://localhost:3000/api/health
- Frontend: http://localhost:5173
- Database Studio: http://localhost:5555

## 🏗️ Project Architecture

### Directory Structure
```
BailBondPro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── types/         # TypeScript type definitions
│   │   └── styles/        # Global styles and themes
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express.js backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json
├── shared/                # Shared code between client/server
│   ├── schema.ts          # Database schema (Drizzle)
│   ├── types.ts           # Shared TypeScript types
│   └── utils.ts           # Shared utilities
├── docs/                  # Documentation
├── tests/                 # Test files
└── scripts/               # Build and deployment scripts
```

### Technology Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Router** for routing
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** for form handling
- **Zod** for validation

#### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** as primary database
- **JWT** for authentication
- **Stripe** for payment processing
- **Nodemailer** for email services
- **Winston** for logging

#### Development Tools
- **ESLint** and **Prettier** for code formatting
- **Husky** for Git hooks
- **Jest** and **Vitest** for testing
- **Playwright** for E2E testing
- **Docker** for containerization

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string; // Optional properties with ?
}

// Use types for unions and computed types
type ClientStatus = 'active' | 'inactive' | 'suspended';
type ClientWithStatus = Client & { status: ClientStatus };

// Use generics for reusable types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

#### Function Signatures
```typescript
// Prefer explicit return types for public functions
export async function createClient(
  data: CreateClientRequest
): Promise<ApiResponse<Client>> {
  // Implementation
}

// Use proper error handling
export async function getClient(id: string): Promise<Client | null> {
  try {
    const client = await db.select().from(clients).where(eq(clients.id, id));
    return client[0] || null;
  } catch (error) {
    logger.error('Failed to get client', { id, error });
    throw new Error('Database error');
  }
}
```

### React Component Guidelines

#### Component Structure
```typescript
// Use functional components with TypeScript
interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = useCallback(() => {
    onEdit?.(client);
  }, [client, onEdit]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold">
        {client.firstName} {client.lastName}
      </h3>
      <p className="text-gray-600">{client.email}</p>
      
      <div className="mt-4 flex gap-2">
        <Button onClick={handleEdit} variant="outline">
          Edit
        </Button>
        <Button 
          onClick={() => onDelete?.(client.id)} 
          variant="destructive"
          disabled={isLoading}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
```

#### Custom Hooks
```typescript
// Create reusable hooks for common patterns
export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => api.clients.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
```

### Backend Guidelines

#### Route Handlers
```typescript
// Use proper middleware and validation
export const clientRoutes = express.Router();

clientRoutes.get('/', 
  authenticate,
  authorize(['admin', 'agent']),
  validateQuery(GetClientsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const clients = await clientService.getClients({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        userId: req.user.id,
      });
      
      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      logger.error('Failed to get clients', { error, userId: req.user.id });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);
```

#### Service Layer
```typescript
// Separate business logic into services
export class ClientService {
  async createClient(data: CreateClientData, userId: string): Promise<Client> {
    // Validate business rules
    await this.validateClientData(data);
    
    // Check for duplicates
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Client with this email already exists');
    }
    
    // Create client
    const client = await db.insert(clients).values({
      ...data,
      id: generateId(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();
    
    // Log activity
    await this.logActivity('client_created', client[0].id, userId);
    
    return client[0];
  }
  
  private async validateClientData(data: CreateClientData): Promise<void> {
    // Business validation logic
    if (data.dateOfBirth && isMinor(data.dateOfBirth)) {
      throw new ValidationError('Client must be 18 or older');
    }
  }
}
```

### Database Guidelines

#### Schema Design
```typescript
// Use Drizzle schema with proper types
export const clients = pgTable('clients', {
  id: varchar('id', { length: 255 }).primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  ssn: varchar('ssn', { length: 11 }), // Encrypted
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).references(() => users.id),
});

// Define relationships
export const clientsRelations = relations(clients, ({ many }) => ({
  contracts: many(contracts),
  documents: many(documents),
}));
```

#### Migrations
```typescript
// Create migrations for schema changes
import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(255) PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS clients;`);
}
```

## 🧪 Testing Guidelines

### Unit Testing

#### Frontend Tests (Vitest + Testing Library)
```typescript
// Component tests
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientCard } from './ClientCard';

describe('ClientCard', () => {
  const mockClient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  it('renders client information', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ClientCard client={mockClient} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockClient);
  });
});

// Hook tests
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClient } from './useClient';

describe('useClient', () => {
  it('fetches client data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useClient('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClient);
  });
});
```

#### Backend Tests (Jest)
```typescript
// Service tests
import { ClientService } from './ClientService';
import { db } from '../db';

describe('ClientService', () => {
  let clientService: ClientService;

  beforeEach(() => {
    clientService = new ClientService();
  });

  afterEach(async () => {
    await db.delete(clients);
  });

  describe('createClient', () => {
    it('creates a new client', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const client = await clientService.createClient(clientData, 'user1');

      expect(client).toMatchObject(clientData);
      expect(client.id).toBeDefined();
      expect(client.createdAt).toBeDefined();
    });

    it('throws error for duplicate email', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await clientService.createClient(clientData, 'user1');

      await expect(
        clientService.createClient(clientData, 'user1')
      ).rejects.toThrow('Client with this email already exists');
    });
  });
});

// API route tests
import request from 'supertest';
import { app } from '../app';

describe('GET /api/clients', () => {
  it('returns clients for authenticated user', async () => {
    const token = await getAuthToken();
    
    const response = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.clients).toBeInstanceOf(Array);
  });

  it('returns 401 for unauthenticated request', async () => {
    await request(app)
      .get('/api/clients')
      .expect(401);
  });
});
```

### Integration Testing

#### E2E Tests (Playwright)
```typescript
// tests/e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new client', async ({ page }) => {
    await page.goto('/clients');
    await page.click('[data-testid=add-client-button]');

    await page.fill('[data-testid=first-name]', 'John');
    await page.fill('[data-testid=last-name]', 'Doe');
    await page.fill('[data-testid=email]', 'john.doe@example.com');
    await page.fill('[data-testid=phone]', '555-0123');

    await page.click('[data-testid=save-button]');

    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should edit existing client', async ({ page }) => {
    await page.goto('/clients');
    await page.click('[data-testid=client-row]:first-child [data-testid=edit-button]');

    await page.fill('[data-testid=phone]', '555-9999');
    await page.click('[data-testid=save-button]');

    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
  });
});
```

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development Tools

### VS Code Setup

#### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright"
  ]
}
```

#### Workspace Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

#### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/src/index.ts",
      "outFiles": ["${workspaceFolder}/server/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/client-management
feature/payment-processing

# Bug fixes
fix/login-validation
fix/payment-calculation

# Hotfixes
hotfix/security-patch
hotfix/critical-bug

# Releases
release/v1.2.0
```

#### Commit Messages
```bash
# Format: type(scope): description

feat(client): add client search functionality
fix(payment): resolve Stripe webhook validation
docs(api): update authentication documentation
test(client): add unit tests for client service
refactor(db): optimize query performance
style(ui): update button component styling
```

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## 🚀 Build and Deployment

### Build Process
```bash
# Build for production
npm run build

# Build specific parts
npm run build:client
npm run build:server

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Environment Management
```bash
# Development
cp .env.example .env.local

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

### Docker Development
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 5173

# Start development servers
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: bailbondpro
      POSTGRES_USER: bailbondpro
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Process
1. **Create Issue**: Create an issue describing the feature/bug
2. **Branch**: Create a branch from `main`
3. **Develop**: Implement changes with tests
4. **Test**: Ensure all tests pass
5. **Document**: Update documentation if needed
6. **PR**: Submit pull request with clear description
7. **Review**: Address review feedback
8. **Merge**: Maintainer will merge when approved

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Mobile responsiveness maintained

## 🐛 Debugging

### Common Issues

#### Database Connection
```bash
# Check database status
npm run db:status

# Reset database
npm run db:reset

# View logs
npm run logs:db
```

#### Frontend Issues
```bash
# Clear cache
rm -rf node_modules/.cache
rm -rf client/dist

# Restart dev server
npm run dev:client
```

#### Backend Issues
```bash
# Check server logs
npm run logs:server

# Restart server
npm run dev:server

# Debug mode
npm run dev:server:debug
```

### Logging
```typescript
// Use structured logging
import { logger } from '../utils/logger';

logger.info('Client created', {
  clientId: client.id,
  userId: req.user.id,
  timestamp: new Date().toISOString(),
});

logger.error('Payment processing failed', {
  paymentId: payment.id,
  error: error.message,
  stack: error.stack,
});
```

## 📚 Resources

### Documentation
- **[Installation Guide](Installation)** - Setup instructions
- **[Configuration Guide](Configuration)** - Environment setup
- **[API Reference](API-Reference)** - API documentation
- **[User Guide](User-Guide)** - End-user documentation

### External Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy Coding!** 🎉 You're now ready to contribute to BailBondPro. If you have questions, please check our documentation or reach out to the team.