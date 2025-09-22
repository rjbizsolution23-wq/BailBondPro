# BailBondPro System Architecture

## Overview

BailBondPro is a modern, cloud-native bail bond management system built with a microservices architecture. The system is designed for scalability, security, and compliance with financial and legal regulations.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Design](#database-design)
- [Security Architecture](#security-architecture)
- [Infrastructure](#infrastructure)
- [Integration Architecture](#integration-architecture)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Architecture](#deployment-architecture)
- [Scalability & Performance](#scalability--performance)

## System Overview

### Core Components

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Gateway"
        GATEWAY[API Gateway]
        AUTH[Authentication Service]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Services"
        CLIENT_SVC[Client Service]
        BOND_SVC[Bond Service]
        PAYMENT_SVC[Payment Service]
        DOC_SVC[Document Service]
        NOTIFY_SVC[Notification Service]
        REPORT_SVC[Reporting Service]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(File Storage)]
        SEARCH[(Elasticsearch)]
    end
    
    subgraph "External Services"
        STRIPE[Stripe]
        DOCUSIGN[DocuSign]
        TWILIO[Twilio]
        COURT_API[Court APIs]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    API_CLIENT --> GATEWAY
    
    GATEWAY --> AUTH
    GATEWAY --> RATE
    GATEWAY --> CLIENT_SVC
    GATEWAY --> BOND_SVC
    GATEWAY --> PAYMENT_SVC
    GATEWAY --> DOC_SVC
    GATEWAY --> NOTIFY_SVC
    GATEWAY --> REPORT_SVC
    
    CLIENT_SVC --> POSTGRES
    BOND_SVC --> POSTGRES
    PAYMENT_SVC --> POSTGRES
    DOC_SVC --> S3
    REPORT_SVC --> SEARCH
    
    CLIENT_SVC --> REDIS
    BOND_SVC --> REDIS
    
    PAYMENT_SVC --> STRIPE
    DOC_SVC --> DOCUSIGN
    NOTIFY_SVC --> TWILIO
    BOND_SVC --> COURT_API
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library + Playwright

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **API**: REST + GraphQL (Apollo Server)
- **Authentication**: JWT + Passport.js
- **Validation**: Joi + express-validator
- **ORM**: Prisma
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger

#### Database
- **Primary**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+
- **File Storage**: AWS S3 / MinIO
- **Backup**: Automated daily backups with point-in-time recovery

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Cloud Provider**: AWS / Azure / GCP
- **CDN**: CloudFlare
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **CI/CD**: GitHub Actions

## Architecture Principles

### 1. Domain-Driven Design (DDD)
- Clear domain boundaries
- Ubiquitous language
- Bounded contexts for each business domain

### 2. Microservices Architecture
- Service independence
- Single responsibility principle
- Database per service
- API-first design

### 3. Event-Driven Architecture
- Asynchronous communication
- Event sourcing for audit trails
- CQRS for read/write separation

### 4. Security by Design
- Zero-trust architecture
- End-to-end encryption
- Role-based access control (RBAC)
- Audit logging

### 5. Cloud-Native Principles
- 12-factor app methodology
- Containerization
- Infrastructure as Code (IaC)
- Auto-scaling capabilities

## High-Level Architecture

### System Context Diagram

```mermaid
C4Context
    title System Context Diagram for BailBondPro

    Person(agent, "Bail Agent", "Creates and manages bail bonds")
    Person(client, "Client", "Applies for bail bonds")
    Person(admin, "Administrator", "Manages system and users")
    
    System(bailbondpro, "BailBondPro", "Bail bond management system")
    
    System_Ext(stripe, "Stripe", "Payment processing")
    System_Ext(docusign, "DocuSign", "Document signing")
    System_Ext(twilio, "Twilio", "SMS/Voice notifications")
    System_Ext(courts, "Court Systems", "Court data integration")
    System_Ext(credit, "Credit Bureaus", "Credit checks")
    
    Rel(agent, bailbondpro, "Manages bonds and clients")
    Rel(client, bailbondpro, "Applies for bonds, signs documents")
    Rel(admin, bailbondpro, "Administers system")
    
    Rel(bailbondpro, stripe, "Processes payments")
    Rel(bailbondpro, docusign, "Sends documents for signing")
    Rel(bailbondpro, twilio, "Sends notifications")
    Rel(bailbondpro, courts, "Retrieves court data")
    Rel(bailbondpro, credit, "Performs credit checks")
```

### Container Diagram

```mermaid
C4Container
    title Container Diagram for BailBondPro

    Person(user, "User", "Bail agents, clients, administrators")
    
    Container(web, "Web Application", "Next.js, TypeScript", "Provides web interface")
    Container(mobile, "Mobile App", "React Native", "Provides mobile interface")
    Container(api, "API Gateway", "Express.js", "Routes requests, handles auth")
    
    Container(client_service, "Client Service", "Node.js, Express", "Manages client data")
    Container(bond_service, "Bond Service", "Node.js, Express", "Manages bond operations")
    Container(payment_service, "Payment Service", "Node.js, Express", "Handles payments")
    Container(document_service, "Document Service", "Node.js, Express", "Manages documents")
    Container(notification_service, "Notification Service", "Node.js, Express", "Sends notifications")
    
    ContainerDb(database, "Database", "PostgreSQL", "Stores application data")
    ContainerDb(cache, "Cache", "Redis", "Caches frequently accessed data")
    ContainerDb(files, "File Storage", "AWS S3", "Stores documents and files")
    ContainerDb(search, "Search Engine", "Elasticsearch", "Provides search capabilities")
    
    Rel(user, web, "Uses", "HTTPS")
    Rel(user, mobile, "Uses", "HTTPS")
    Rel(web, api, "Makes API calls", "JSON/HTTPS")
    Rel(mobile, api, "Makes API calls", "JSON/HTTPS")
    
    Rel(api, client_service, "Routes requests", "JSON/HTTP")
    Rel(api, bond_service, "Routes requests", "JSON/HTTP")
    Rel(api, payment_service, "Routes requests", "JSON/HTTP")
    Rel(api, document_service, "Routes requests", "JSON/HTTP")
    Rel(api, notification_service, "Routes requests", "JSON/HTTP")
    
    Rel(client_service, database, "Reads/Writes", "SQL")
    Rel(bond_service, database, "Reads/Writes", "SQL")
    Rel(payment_service, database, "Reads/Writes", "SQL")
    Rel(document_service, files, "Stores/Retrieves", "S3 API")
    Rel(notification_service, cache, "Caches", "Redis Protocol")
```

## Frontend Architecture

### Component Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utility libraries
│   ├── api.ts           # API client
│   ├── auth.ts          # Authentication utilities
│   ├── utils.ts         # General utilities
│   └── validations.ts   # Zod schemas
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

### State Management Strategy

```typescript
// stores/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const response = await api.auth.login(credentials)
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },
      
      refreshToken: async () => {
        const { token } = get()
        if (!token) return
        
        const response = await api.auth.refresh(token)
        set({ token: response.token })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      })
    }
  )
)
```

### API Integration

```typescript
// lib/api.ts
import { QueryClient } from '@tanstack/react-query'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    }

    const response = await fetch(url, { ...options, headers })
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.json())
    }

    return response.json()
  }

  // Client operations
  clients = {
    list: (params?: ClientListParams) => 
      this.request<ClientListResponse>('/clients', {
        method: 'GET',
        body: params ? JSON.stringify(params) : undefined
      }),
    
    get: (id: string) => 
      this.request<Client>(`/clients/${id}`),
    
    create: (data: CreateClientData) => 
      this.request<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: UpdateClientData) => 
      this.request<Client>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  }

  // Bond operations
  bonds = {
    list: (params?: BondListParams) => 
      this.request<BondListResponse>('/bonds'),
    
    create: (data: CreateBondData) => 
      this.request<Bond>('/bonds', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!)
```

## Backend Architecture

### Service Architecture

```
src/
├── services/              # Business logic services
│   ├── client/           # Client management
│   ├── bond/             # Bond operations
│   ├── payment/          # Payment processing
│   ├── document/         # Document management
│   └── notification/     # Notifications
├── controllers/          # HTTP request handlers
├── middleware/           # Express middleware
├── models/              # Database models (Prisma)
├── routes/              # API route definitions
├── utils/               # Utility functions
├── config/              # Configuration files
├── types/               # TypeScript types
└── tests/               # Test files
```

### Service Layer Pattern

```typescript
// services/client/ClientService.ts
import { PrismaClient } from '@prisma/client'
import { CreateClientData, UpdateClientData, ClientFilters } from './types'
import { ValidationError, NotFoundError } from '../errors'

export class ClientService {
  constructor(private prisma: PrismaClient) {}

  async createClient(data: CreateClientData): Promise<Client> {
    // Validate input data
    const validation = createClientSchema.safeParse(data)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues)
    }

    // Check for duplicate email
    const existingClient = await this.prisma.client.findUnique({
      where: { email: data.email }
    })
    
    if (existingClient) {
      throw new ValidationError([{
        path: ['email'],
        message: 'Email already exists'
      }])
    }

    // Create client
    const client = await this.prisma.client.create({
      data: {
        ...data,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Emit event
    await this.eventBus.emit('client.created', { client })

    return client
  }

  async getClient(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        bonds: true,
        payments: true,
        documents: true
      }
    })

    if (!client) {
      throw new NotFoundError('Client not found')
    }

    return client
  }

  async listClients(filters: ClientFilters): Promise<ClientListResponse> {
    const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = filters

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.client.count({ where })
    ])

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}
```

### API Controller Pattern

```typescript
// controllers/ClientController.ts
import { Request, Response, NextFunction } from 'express'
import { ClientService } from '../services/client/ClientService'
import { asyncHandler } from '../utils/asyncHandler'

export class ClientController {
  constructor(private clientService: ClientService) {}

  createClient = asyncHandler(async (req: Request, res: Response) => {
    const client = await this.clientService.createClient(req.body)
    
    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    })
  })

  getClient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const client = await this.clientService.getClient(id)
    
    res.json({
      success: true,
      data: client
    })
  })

  listClients = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query as ClientFilters
    const result = await this.clientService.listClients(filters)
    
    res.json({
      success: true,
      ...result
    })
  })
}
```

### Event-Driven Architecture

```typescript
// events/EventBus.ts
import { EventEmitter } from 'events'

export interface DomainEvent {
  type: string
  aggregateId: string
  data: any
  timestamp: Date
  version: number
}

export class EventBus extends EventEmitter {
  async emit(eventType: string, data: any): Promise<void> {
    const event: DomainEvent = {
      type: eventType,
      aggregateId: data.id || data.aggregateId,
      data,
      timestamp: new Date(),
      version: 1
    }

    // Store event for audit trail
    await this.storeEvent(event)
    
    // Emit to handlers
    super.emit(eventType, event)
  }

  private async storeEvent(event: DomainEvent): Promise<void> {
    // Store in event store for audit and replay
    await prisma.event.create({
      data: {
        type: event.type,
        aggregateId: event.aggregateId,
        data: event.data,
        timestamp: event.timestamp,
        version: event.version
      }
    })
  }
}

// Event handlers
eventBus.on('client.created', async (event: DomainEvent) => {
  // Send welcome email
  await notificationService.sendWelcomeEmail(event.data.client)
  
  // Create audit log
  await auditService.log('CLIENT_CREATED', event.data.client.id, event.data)
})

eventBus.on('bond.created', async (event: DomainEvent) => {
  // Generate bond documents
  await documentService.generateBondDocuments(event.data.bond)
  
  // Schedule court date reminders
  await notificationService.scheduleCourtReminders(event.data.bond)
})
```

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ CLIENTS : manages
    USERS ||--o{ BONDS : creates
    CLIENTS ||--o{ BONDS : has
    BONDS ||--o{ PAYMENTS : receives
    BONDS ||--o{ DOCUMENTS : generates
    CLIENTS ||--o{ DOCUMENTS : signs
    BONDS ||--o{ COLLATERAL : secures
    BONDS ||--o{ COURT_APPEARANCES : schedules
    
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role
        json permissions
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    
    CLIENTS {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone
        date date_of_birth
        string ssn_encrypted
        json address
        json emergency_contact
        enum status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    BONDS {
        uuid id PK
        string bond_number UK
        uuid client_id FK
        decimal amount
        decimal premium
        enum status
        string case_number
        string court_name
        timestamp court_date
        json charges
        json terms
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid bond_id FK
        decimal amount
        enum payment_method
        enum status
        string transaction_id
        json payment_details
        timestamp processed_at
        timestamp created_at
    }
    
    DOCUMENTS {
        uuid id PK
        uuid client_id FK
        uuid bond_id FK
        string document_type
        string file_path
        enum status
        json signature_data
        timestamp signed_at
        timestamp expires_at
        timestamp created_at
    }
    
    COLLATERAL {
        uuid id PK
        uuid bond_id FK
        string type
        string description
        decimal estimated_value
        json details
        enum status
        timestamp created_at
    }
    
    COURT_APPEARANCES {
        uuid id PK
        uuid bond_id FK
        timestamp scheduled_date
        string court_name
        string address
        enum status
        string notes
        timestamp created_at
    }
```

### Database Schema (Prisma)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  firstName     String   @map("first_name")
  lastName      String   @map("last_name")
  role          Role     @default(AGENT)
  permissions   Json     @default("[]")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  clients       Client[]
  bonds         Bond[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Client {
  id               String   @id @default(cuid())
  firstName        String   @map("first_name")
  lastName         String   @map("last_name")
  email            String   @unique
  phone            String?
  dateOfBirth      DateTime? @map("date_of_birth")
  ssnEncrypted     String?  @map("ssn_encrypted")
  address          Json?
  emergencyContact Json?    @map("emergency_contact")
  status           ClientStatus @default(ACTIVE)
  createdBy        String   @map("created_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  creator          User       @relation(fields: [createdBy], references: [id])
  bonds            Bond[]
  documents        Document[]
  payments         Payment[]

  @@map("clients")
}

model Bond {
  id           String     @id @default(cuid())
  bondNumber   String     @unique @map("bond_number")
  clientId     String     @map("client_id")
  amount       Decimal    @db.Decimal(12, 2)
  premium      Decimal    @db.Decimal(12, 2)
  status       BondStatus @default(PENDING)
  caseNumber   String?    @map("case_number")
  courtName    String?    @map("court_name")
  courtDate    DateTime?  @map("court_date")
  charges      Json       @default("[]")
  terms        Json       @default("{}")
  createdBy    String     @map("created_by")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  // Relations
  client       Client           @relation(fields: [clientId], references: [id])
  creator      User             @relation(fields: [createdBy], references: [id])
  payments     Payment[]
  documents    Document[]
  collateral   Collateral[]
  appearances  CourtAppearance[]

  @@map("bonds")
}

model Payment {
  id             String        @id @default(cuid())
  bondId         String?       @map("bond_id")
  clientId       String?       @map("client_id")
  amount         Decimal       @db.Decimal(12, 2)
  paymentMethod  PaymentMethod @map("payment_method")
  status         PaymentStatus @default(PENDING)
  transactionId  String?       @map("transaction_id")
  paymentDetails Json          @map("payment_details")
  processedAt    DateTime?     @map("processed_at")
  createdAt      DateTime      @default(now()) @map("created_at")

  // Relations
  bond           Bond?   @relation(fields: [bondId], references: [id])
  client         Client? @relation(fields: [clientId], references: [id])

  @@map("payments")
}

enum Role {
  ADMIN
  MANAGER
  AGENT
  VIEWER
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ARCHIVED
}

enum BondStatus {
  PENDING
  ACTIVE
  COMPLETED
  FORFEITED
  CANCELLED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  BANK_TRANSFER
  CHECK
  CASH
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}
```

### Data Access Layer

```typescript
// repositories/ClientRepository.ts
import { PrismaClient, Client, Prisma } from '@prisma/client'

export class ClientRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    return this.prisma.client.create({ data })
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        bonds: {
          orderBy: { createdAt: 'desc' }
        },
        documents: true,
        payments: true
      }
    })
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { email }
    })
  }

  async findMany(params: {
    skip?: number
    take?: number
    where?: Prisma.ClientWhereInput
    orderBy?: Prisma.ClientOrderByWithRelationInput
  }): Promise<Client[]> {
    return this.prisma.client.findMany(params)
  }

  async update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data
    })
  }

  async delete(id: string): Promise<Client> {
    return this.prisma.client.delete({
      where: { id }
    })
  }

  async count(where?: Prisma.ClientWhereInput): Promise<number> {
    return this.prisma.client.count({ where })
  }
}
```

## Security Architecture

### Authentication & Authorization

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access token required' }
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await userService.findById(decoded.userId)
    
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or inactive user' }
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    })
  }
}

export const authorize = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || []
    
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('*')
    )

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      })
    }

    next()
  }
}
```

### Data Encryption

```typescript
// utils/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export class EncryptionService {
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, KEY)
    cipher.setAAD(Buffer.from('BailBondPro', 'utf8'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipher(ALGORITHM, KEY)
    decipher.setAAD(Buffer.from('BailBondPro', 'utf8'))
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
```

### Security Middleware

```typescript
// middleware/security.ts
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later' }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// API rate limiting (more restrictive)
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each API key to 1000 requests per hour
  keyGenerator: (req: Request) => {
    return req.header('Authorization') || req.ip
  }
})

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
})

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  if (req.params) {
    req.params = sanitizeObject(req.params)
  }
  
  next()
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key])
    }
    return sanitized
  }
  return obj
}
```

## Infrastructure

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/bailbondpro
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=bailbondpro
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bailbondpro-app
  labels:
    app: bailbondpro
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bailbondpro
  template:
    metadata:
      labels:
        app: bailbondpro
    spec:
      containers:
      - name: app
        image: bailbondpro:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bailbondpro-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: bailbondpro-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: bailbondpro-service
spec:
  selector:
    app: bailbondpro
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Integration Architecture

### External Service Integration

```typescript
// integrations/StripeService.ts
import Stripe from 'stripe'

export class StripeService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })
  }

  async createPaymentIntent(amount: number, currency = 'usd'): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true
      }
    })
  }

  async processPayment(paymentMethodId: string, amount: number): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.APP_URL}/payments/return`
    })
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    })
  }
}

// integrations/DocuSignService.ts
import { ApiClient, EnvelopesApi, EnvelopeDefinition } from 'docusign-esign'

export class DocuSignService {
  private apiClient: ApiClient
  private envelopesApi: EnvelopesApi

  constructor() {
    this.apiClient = new ApiClient()
    this.apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH!)
    this.envelopesApi = new EnvelopesApi(this.apiClient)
  }

  async sendDocumentForSigning(
    documentPath: string,
    signerEmail: string,
    signerName: string
  ): Promise<string> {
    const envelope: EnvelopeDefinition = {
      emailSubject: 'Please sign this document',
      documents: [{
        documentBase64: await this.getDocumentBase64(documentPath),
        name: 'Contract',
        fileExtension: 'pdf',
        documentId: '1'
      }],
      recipients: {
        signers: [{
          email: signerEmail,
          name: signerName,
          recipientId: '1',
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '100'
            }]
          }
        }]
      },
      status: 'sent'
    }

    const result = await this.envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID!,
      { envelopeDefinition: envelope }
    )

    return result.envelopeId!
  }

  private async getDocumentBase64(filePath: string): Promise<string> {
    const fs = require('fs').promises
    const fileBuffer = await fs.readFile(filePath)
    return fileBuffer.toString('base64')
  }
}
```

### Message Queue Integration

```typescript
// queues/JobProcessor.ts
import Bull from 'bull'
import { EmailService } from '../services/EmailService'
import { DocumentService } from '../services/DocumentService'

// Email queue
export const emailQueue = new Bull('email processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

emailQueue.process('send-email', async (job) => {
  const { to, subject, template, data } = job.data
  await EmailService.sendEmail(to, subject, template, data)
})

// Document processing queue
export const documentQueue = new Bull('document processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

documentQueue.process('generate-contract', async (job) => {
  const { bondId, templateId } = job.data
  await DocumentService.generateContract(bondId, templateId)
})

documentQueue.process('send-for-signature', async (job) => {
  const { documentId, signerEmail } = job.data
  await DocumentService.sendForSignature(documentId, signerEmail)
})

// Schedule jobs
export const scheduleEmailJob = (data: any, delay?: number) => {
  return emailQueue.add('send-email', data, {
    delay,
    attempts: 3,
    backoff: 'exponential'
  })
}

export const scheduleDocumentJob = (type: string, data: any) => {
  return documentQueue.add(type, data, {
    attempts: 3,
    backoff: 'exponential'
  })
}
```

## Monitoring & Observability

### Logging Configuration

```typescript
// utils/logger.ts
import winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL
  },
  index: 'bailbondpro-logs'
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'bailbondpro-api',
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new ElasticsearchTransport(esTransportOpts)
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    })
  })
  
  next()
}
```

### Metrics Collection

```typescript
// utils/metrics.ts
import client from 'prom-client'

// Create a Registry
const register = new client.Registry()

// Add default metrics
client.collectDefaultMetrics({ register })

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
})

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
})

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
})

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table']
})

// Register metrics
register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestTotal)
register.registerMetric(activeConnections)
register.registerMetric(databaseQueryDuration)

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration)
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc()
  })
  
  next()
}

// Metrics endpoint
export const getMetrics = async (): Promise<string> => {
  return register.metrics()
}
```

### Health Checks

```typescript
// utils/healthCheck.ts
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  checks: {
    database: 'up' | 'down'
    redis: 'up' | 'down'
    external_services: {
      stripe: 'up' | 'down'
      docusign: 'up' | 'down'
      twilio: 'up' | 'down'
    }
  }
  uptime: number
  version: string
  timestamp: string
}

export class HealthCheckService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkDocuSign(),
      this.checkTwilio()
    ])

    const [database, redis, stripe, docusign, twilio] = checks.map(
      result => result.status === 'fulfilled' ? result.value : 'down'
    )

    const allHealthy = [database, redis, stripe, docusign, twilio].every(
      status => status === 'up'
    )

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: {
        database,
        redis,
        external_services: {
          stripe,
          docusign,
          twilio
        }
      },
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    }
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return 'up'
    } catch {
      return 'down'
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.redis.ping()
      return 'up'
    } catch {
      return 'down'
    }
  }

  private async checkStripe(): Promise<'up' | 'down'> {
    try {
      // Simple API call to check Stripe connectivity
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      })
      return response.ok ? 'up' : 'down'
    } catch {
      return 'down'
    }
  }

  private async checkDocuSign(): Promise<'up' | 'down'> {
    // Implement DocuSign health check
    return 'up'
  }

  private async checkTwilio(): Promise<'up' | 'down'> {
    // Implement Twilio health check
    return 'up'
  }
}
```

## Deployment Architecture

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Generate Prisma client
      run: npx prisma generate
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Build application
      run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run SAST scan
      uses: github/super-linter@v4
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v1
      with:
        manifests: |
          k8s/deployment.yaml
          k8s/service.yaml
        images: |
          ghcr.io/${{ github.repository }}:latest
```

### Infrastructure as Code

```hcl
# terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "bailbondpro-vpc"
  }
}

# Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "bailbondpro-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 101}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "bailbondpro-public-${count.index + 1}"
  }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  identifier     = "bailbondpro-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "bailbondpro"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "bailbondpro-final-snapshot"
  
  tags = {
    Name = "bailbondpro-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "bailbondpro-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "bailbondpro-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "bailbondpro-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "bailbondpro-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}
```

## Scalability & Performance

### Caching Strategy

```typescript
// utils/cache.ts
import Redis from 'ioredis'

export class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }
}

// Cache decorator
export function Cacheable(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }
      
      // Execute method and cache result
      const result = await method.apply(this, args)
      await cacheService.set(cacheKey, result, ttl)
      
      return result
    }
  }
}
```

### Database Optimization

```typescript
// Database connection pooling
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
})

// Query optimization with indexes
export class OptimizedQueries {
  // Efficient pagination with cursor-based approach
  async getPaginatedClients(cursor?: string, take: number = 20) {
    return prisma.client.findMany({
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        bonds: {
          select: {
            id: true,
            status: true,
            amount: true
          }
        }
      }
    })
  }

  // Optimized search with full-text search
  async searchClients(query: string) {
    return prisma.$queryRaw`
      SELECT c.*, ts_rank(search_vector, plainto_tsquery(${query})) as rank
      FROM clients c
      WHERE search_vector @@ plainto_tsquery(${query})
      ORDER BY rank DESC
      LIMIT 50
    `
  }

  // Batch operations for better performance
  async createMultiplePayments(payments: CreatePaymentData[]) {
    return prisma.$transaction(
      payments.map(payment => 
        prisma.payment.create({ data: payment })
      )
    )
  }
}
```

### Load Balancing

```typescript
// Load balancer configuration
import { createProxyMiddleware } from 'http-proxy-middleware'

const servers = [
  'http://app-1:3000',
  'http://app-2:3000',
  'http://app-3:3000'
]

let currentServer = 0

export const loadBalancer = createProxyMiddleware({
  target: () => {
    const server = servers[currentServer]
    currentServer = (currentServer + 1) % servers.length
    return server
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Service temporarily unavailable' })
  }
})
```

### Auto-scaling Configuration

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bailbondpro-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bailbondpro-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms | 95th percentile |
| Database Query Time | < 50ms | Average |
| Page Load Time | < 2s | First Contentful Paint |
| Time to Interactive | < 3s | Lighthouse metric |
| Throughput | > 1000 RPS | Concurrent requests |
| Availability | 99.9% | Monthly uptime |
| Error Rate | < 0.1% | 4xx/5xx responses |

### Performance Testing

```typescript
// tests/performance/load-test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  }
}

export default function() {
  const response = http.get('http://localhost:3000/api/clients')
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  })
}
```

## Conclusion

This architecture document provides a comprehensive overview of the BailBondPro system design. The architecture emphasizes:

1. **Scalability**: Microservices architecture with horizontal scaling capabilities
2. **Security**: Multi-layered security with encryption, authentication, and audit trails
3. **Performance**: Optimized database queries, caching, and load balancing
4. **Reliability**: Health checks, monitoring, and automated recovery
5. **Maintainability**: Clean code architecture with comprehensive testing
6. **Compliance**: Built-in audit trails and regulatory compliance features

The system is designed to handle the complex requirements of bail bond management while providing a modern, user-friendly experience for all stakeholders.

For implementation details, refer to the specific service documentation and API specifications in the `/docs` directory.