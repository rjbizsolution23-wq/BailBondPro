# 🔌 API Reference

Complete API documentation for BailBondPro's RESTful API. All endpoints return JSON responses and follow REST conventions.

## 🔐 Authentication

### Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

### Authentication Methods

#### JWT Bearer Token
```http
Authorization: Bearer <your-jwt-token>
```

#### API Key (for integrations)
```http
X-API-Key: <your-api-key>
```

### Getting Started

#### 1. Obtain Access Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "agent",
      "name": "John Doe"
    }
  }
}
```

#### 2. Use Token in Requests
```http
GET /clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👤 Authentication Endpoints

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "rememberMe": "boolean" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string",
    "expiresIn": "number",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "admin|agent|viewer",
      "permissions": ["string"]
    }
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Password Reset
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "string"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

## 👥 Client Management

### List Clients
```http
GET /clients
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name, email, or phone
- `status` (string): Filter by status (active, inactive, suspended)
- `sortBy` (string): Sort field (name, createdAt, lastActivity)
- `sortOrder` (string): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "client_123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-01",
        "ssn": "***-**-1234", // masked
        "address": {
          "street": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zipCode": "12345"
        },
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Get Client by ID
```http
GET /clients/{clientId}
Authorization: Bearer <token>
```

### Create Client
```http
POST /clients
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "string", // YYYY-MM-DD
  "ssn": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relationship": "string"
  }
}
```

### Update Client
```http
PUT /clients/{clientId}
Authorization: Bearer <token>
Content-Type: application/json
```

### Delete Client
```http
DELETE /clients/{clientId}
Authorization: Bearer <token>
```

## 📋 Contract Management

### List Contracts
```http
GET /contracts
Authorization: Bearer <token>
```

**Query Parameters:**
- `clientId` (string): Filter by client ID
- `status` (string): active, completed, cancelled, defaulted
- `dateFrom` (string): Start date filter (YYYY-MM-DD)
- `dateTo` (string): End date filter (YYYY-MM-DD)
- `page` (number): Page number
- `limit` (number): Items per page

### Get Contract by ID
```http
GET /contracts/{contractId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contract_123",
    "clientId": "client_123",
    "bondAmount": 10000,
    "feeAmount": 1000,
    "feePercentage": 10,
    "collateralRequired": 5000,
    "courtDate": "2024-06-01T09:00:00Z",
    "courtLocation": "Superior Court of California",
    "charges": ["Assault", "Battery"],
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "client": {
      "id": "client_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "payments": [
      {
        "id": "payment_123",
        "amount": 500,
        "method": "card",
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Create Contract
```http
POST /contracts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientId": "string",
  "bondAmount": "number",
  "feePercentage": "number", // optional, defaults to system setting
  "collateralRequired": "number",
  "courtDate": "string", // ISO 8601 datetime
  "courtLocation": "string",
  "charges": ["string"],
  "notes": "string" // optional
}
```

### Update Contract
```http
PUT /contracts/{contractId}
Authorization: Bearer <token>
```

### Cancel Contract
```http
POST /contracts/{contractId}/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "string",
  "refundAmount": "number" // optional
}
```

## 💳 Payment Management

### List Payments
```http
GET /payments
Authorization: Bearer <token>
```

**Query Parameters:**
- `contractId` (string): Filter by contract
- `clientId` (string): Filter by client
- `status` (string): pending, completed, failed, refunded
- `method` (string): card, ach, cash, check
- `dateFrom` (string): Start date filter
- `dateTo` (string): End date filter

### Get Payment by ID
```http
GET /payments/{paymentId}
Authorization: Bearer <token>
```

### Create Payment
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "contractId": "string",
  "amount": "number",
  "method": "card|ach|cash|check",
  "paymentMethodId": "string", // for card/ach payments
  "description": "string", // optional
  "metadata": {} // optional key-value pairs
}
```

### Process Refund
```http
POST /payments/{paymentId}/refund
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": "number", // optional, defaults to full amount
  "reason": "string"
}
```

## 📊 Reporting & Analytics

### Dashboard Stats
```http
GET /reports/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClients": 150,
    "activeContracts": 45,
    "monthlyRevenue": 125000,
    "pendingPayments": 15,
    "upcomingCourtDates": 8,
    "recentActivity": [
      {
        "type": "payment",
        "description": "Payment received from John Doe",
        "amount": 500,
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### Financial Report
```http
GET /reports/financial
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string): Report start date (YYYY-MM-DD)
- `endDate` (string): Report end date (YYYY-MM-DD)
- `groupBy` (string): day, week, month, year

### Client Report
```http
GET /reports/clients
Authorization: Bearer <token>
```

### Contract Report
```http
GET /reports/contracts
Authorization: Bearer <token>
```

## 📁 Document Management

### Upload Document
```http
POST /documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Document file (PDF, DOC, DOCX, JPG, PNG)
- `contractId`: Associated contract ID
- `type`: Document type (contract, id, collateral, court_order, other)
- `description`: Document description

### List Documents
```http
GET /documents
Authorization: Bearer <token>
```

**Query Parameters:**
- `contractId` (string): Filter by contract
- `clientId` (string): Filter by client
- `type` (string): Filter by document type

### Download Document
```http
GET /documents/{documentId}/download
Authorization: Bearer <token>
```

### Delete Document
```http
DELETE /documents/{documentId}
Authorization: Bearer <token>
```

## 🔔 Notification Management

### List Notifications
```http
GET /notifications
Authorization: Bearer <token>
```

### Mark as Read
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer <token>
```

### Notification Settings
```http
GET /notifications/settings
Authorization: Bearer <token>
```

```http
PUT /notifications/settings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emailNotifications": {
    "newClient": true,
    "paymentDue": true,
    "courtReminder": true,
    "contractExpiry": true
  },
  "smsNotifications": {
    "urgentReminders": true,
    "paymentConfirmations": false
  }
}
```

## 👨‍💼 User Management (Admin Only)

### List Users
```http
GET /users
Authorization: Bearer <token>
```

### Create User
```http
POST /users
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "role": "admin|agent|viewer",
  "permissions": ["string"],
  "temporaryPassword": "string"
}
```

### Update User
```http
PUT /users/{userId}
Authorization: Bearer <token>
```

### Deactivate User
```http
POST /users/{userId}/deactivate
Authorization: Bearer <token>
```

## ⚙️ System Configuration (Admin Only)

### Get System Settings
```http
GET /system/settings
Authorization: Bearer <token>
```

### Update System Settings
```http
PUT /system/settings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "businessSettings": {
    "companyName": "string",
    "defaultFeePercentage": "number",
    "minimumBondAmount": "number",
    "maximumBondAmount": "number"
  },
  "paymentSettings": {
    "acceptedMethods": ["card", "ach", "cash"],
    "gracePeriodDays": "number",
    "lateFeePercentage": "number"
  },
  "notificationSettings": {
    "emailEnabled": "boolean",
    "smsEnabled": "boolean",
    "reminderDaysBefore": "number"
  }
}
```

## 🔍 Search & Filtering

### Global Search
```http
GET /search
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string): Search query
- `type` (string): clients, contracts, payments (optional)
- `limit` (number): Max results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "client",
        "id": "client_123",
        "title": "John Doe",
        "subtitle": "john.doe@example.com",
        "url": "/clients/client_123"
      }
    ],
    "total": 5
  }
}
```

## 📈 Webhooks

### Webhook Events

BailBondPro can send webhooks for the following events:

- `client.created`
- `client.updated`
- `contract.created`
- `contract.updated`
- `contract.cancelled`
- `payment.completed`
- `payment.failed`
- `court_date.reminder`

### Webhook Payload Example
```json
{
  "event": "payment.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "id": "payment_123",
    "contractId": "contract_123",
    "amount": 500,
    "method": "card",
    "status": "completed"
  }
}
```

### Configure Webhooks
```http
POST /webhooks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/bailbondpro",
  "events": ["payment.completed", "contract.created"],
  "secret": "your-webhook-secret"
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## 📊 Rate Limiting

### Rate Limits
- **Authentication endpoints**: 5 requests per minute
- **General API**: 100 requests per 15 minutes
- **File uploads**: 10 requests per minute
- **Webhooks**: 1000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🧪 Testing

### API Testing with cURL

#### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

#### Get Clients Example
```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Postman Collection

Import our Postman collection for easy API testing:
```
https://api.postman.com/collections/bailbondpro-api
```

## 📚 SDK & Libraries

### JavaScript/TypeScript SDK
```bash
npm install @bailbondpro/sdk
```

```typescript
import { BailBondProClient } from '@bailbondpro/sdk';

const client = new BailBondProClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.bailbondpro.com'
});

// Get clients
const clients = await client.clients.list();

// Create contract
const contract = await client.contracts.create({
  clientId: 'client_123',
  bondAmount: 10000,
  courtDate: '2024-06-01T09:00:00Z'
});
```

### Python SDK
```bash
pip install bailbondpro-python
```

```python
from bailbondpro import BailBondProClient

client = BailBondProClient(
    api_key='your-api-key',
    base_url='https://api.bailbondpro.com'
)

# Get clients
clients = client.clients.list()

# Create contract
contract = client.contracts.create(
    client_id='client_123',
    bond_amount=10000,
    court_date='2024-06-01T09:00:00Z'
)
```

## 🔗 Related Documentation

- **[Installation Guide](Installation)** - Set up the API
- **[Configuration Guide](Configuration)** - Configure API settings
- **[User Guide](User-Guide)** - Learn the web interface
- **[Deployment Guide](Deployment)** - Deploy to production

---

**API Reference Complete!** 🎉 You now have comprehensive documentation for integrating with BailBondPro's API.