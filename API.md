# BailBondPro API Documentation

## Overview

The BailBondPro API is a RESTful web service that provides comprehensive bail bond management functionality. This API enables secure access to client management, bond processing, payment handling, and administrative features.

## Table of Contents

- [Authentication](#authentication)
- [Base URL & Versioning](#base-url--versioning)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
- [Webhooks](#webhooks)
- [SDKs](#sdks)
- [Examples](#examples)

## Authentication

### API Key Authentication

All API requests require authentication using an API key in the request header:

```http
Authorization: Bearer your_api_key_here
```

### JWT Token Authentication

For user-specific operations, use JWT tokens:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication Endpoints

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "agent",
      "permissions": ["read:clients", "write:bonds"]
    }
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer your_jwt_token
```

## Base URL & Versioning

- **Production**: `https://api.bailbondpro.com`
- **Staging**: `https://api-staging.bailbondpro.com`
- **Current Version**: `v1`

All endpoints are prefixed with `/api/v1/`

## Request/Response Format

### Content Type
All requests and responses use JSON format:
```http
Content-Type: application/json
```

### Standard Response Structure
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789",
    "version": "1.0.0"
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## Error Handling

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
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `VALIDATION_ERROR` | Input validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing error |
| `EXTERNAL_SERVICE_ERROR` | Third-party service error |

## Rate Limiting

- **Default Limit**: 1000 requests per hour per API key
- **Burst Limit**: 100 requests per minute
- **Headers**: Rate limit information is included in response headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Endpoints

### Clients

#### List Clients
```http
GET /api/v1/clients
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search by name, email, or phone
- `status` (string): Filter by status (active, inactive, suspended)
- `sort` (string): Sort field (name, created_at, updated_at)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "client_123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Client
```http
GET /api/v1/clients/{client_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-15",
    "ssn": "***-**-1234",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    },
    "emergency_contact": {
      "name": "Jane Doe",
      "phone": "+1234567891",
      "relationship": "spouse"
    },
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Create Client
```http
POST /api/v1/clients
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "ssn": "123-45-6789",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "spouse"
  }
}
```

#### Update Client
```http
PUT /api/v1/clients/{client_id}
Content-Type: application/json

{
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak Ave",
    "city": "Newtown",
    "state": "CA",
    "zip": "54321"
  }
}
```

#### Delete Client
```http
DELETE /api/v1/clients/{client_id}
```

### Bonds

#### List Bonds
```http
GET /api/v1/bonds
```

**Query Parameters:**
- `client_id` (string): Filter by client ID
- `status` (string): Filter by status (pending, active, completed, forfeited)
- `court_date_from` (date): Filter by court date range start
- `court_date_to` (date): Filter by court date range end
- `amount_min` (number): Minimum bond amount
- `amount_max` (number): Maximum bond amount

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bond_123",
      "client_id": "client_123",
      "bond_number": "BB-2024-001",
      "amount": 10000.00,
      "premium": 1000.00,
      "court_date": "2024-02-15T09:00:00Z",
      "court_name": "Superior Court of California",
      "case_number": "CR-2024-001",
      "charges": ["DUI", "Reckless Driving"],
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Bond
```http
GET /api/v1/bonds/{bond_id}
```

#### Create Bond
```http
POST /api/v1/bonds
Content-Type: application/json

{
  "client_id": "client_123",
  "amount": 10000.00,
  "premium": 1000.00,
  "court_date": "2024-02-15T09:00:00Z",
  "court_name": "Superior Court of California",
  "case_number": "CR-2024-001",
  "charges": ["DUI", "Reckless Driving"],
  "collateral": [
    {
      "type": "vehicle",
      "description": "2020 Honda Civic",
      "value": 15000.00
    }
  ]
}
```

#### Update Bond Status
```http
PATCH /api/v1/bonds/{bond_id}/status
Content-Type: application/json

{
  "status": "completed",
  "notes": "Case dismissed, bond exonerated"
}
```

### Payments

#### List Payments
```http
GET /api/v1/payments
```

**Query Parameters:**
- `client_id` (string): Filter by client ID
- `bond_id` (string): Filter by bond ID
- `status` (string): Filter by status (pending, completed, failed, refunded)
- `date_from` (date): Filter by date range start
- `date_to` (date): Filter by date range end

#### Create Payment
```http
POST /api/v1/payments
Content-Type: application/json

{
  "bond_id": "bond_123",
  "amount": 1000.00,
  "payment_method": "credit_card",
  "payment_details": {
    "card_token": "tok_1234567890",
    "billing_address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    }
  }
}
```

#### Process Refund
```http
POST /api/v1/payments/{payment_id}/refund
Content-Type: application/json

{
  "amount": 500.00,
  "reason": "Partial bond exoneration"
}
```

### Documents

#### List Documents
```http
GET /api/v1/documents
```

**Query Parameters:**
- `client_id` (string): Filter by client ID
- `bond_id` (string): Filter by bond ID
- `type` (string): Filter by document type
- `status` (string): Filter by status (pending, signed, expired)

#### Upload Document
```http
POST /api/v1/documents
Content-Type: multipart/form-data

file: [binary file data]
client_id: client_123
bond_id: bond_123
type: contract
description: Bail bond agreement
```

#### Get Document
```http
GET /api/v1/documents/{document_id}
```

#### Sign Document
```http
POST /api/v1/documents/{document_id}/sign
Content-Type: application/json

{
  "signature_type": "electronic",
  "signer_email": "john.doe@example.com",
  "return_url": "https://yourapp.com/documents/signed"
}
```

### Reports

#### Financial Report
```http
GET /api/v1/reports/financial
```

**Query Parameters:**
- `date_from` (date): Report period start
- `date_to` (date): Report period end
- `group_by` (string): Group by period (day, week, month, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_bonds": 150,
      "total_amount": 1500000.00,
      "total_premium": 150000.00,
      "active_bonds": 45,
      "completed_bonds": 100,
      "forfeited_bonds": 5
    },
    "by_period": [
      {
        "period": "2024-01",
        "bonds_count": 25,
        "total_amount": 250000.00,
        "total_premium": 25000.00
      }
    ]
  }
}
```

#### Client Activity Report
```http
GET /api/v1/reports/client-activity
```

#### Bond Performance Report
```http
GET /api/v1/reports/bond-performance
```

### Users

#### List Users
```http
GET /api/v1/users
```

#### Create User
```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "agent",
  "permissions": ["read:clients", "write:bonds", "read:payments"]
}
```

#### Update User Permissions
```http
PATCH /api/v1/users/{user_id}/permissions
Content-Type: application/json

{
  "permissions": ["read:clients", "write:bonds", "read:payments", "write:reports"]
}
```

### System

#### Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "database": "connected",
    "redis": "connected",
    "external_services": {
      "stripe": "connected",
      "docusign": "connected",
      "twilio": "connected"
    }
  }
}
```

#### System Statistics
```http
GET /api/v1/system/stats
```

## Webhooks

BailBondPro can send webhook notifications for various events.

### Webhook Configuration

Configure webhooks in your account settings or via API:

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/bailbondpro",
  "events": ["bond.created", "payment.completed", "document.signed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

#### Bond Events
- `bond.created` - New bond created
- `bond.updated` - Bond information updated
- `bond.status_changed` - Bond status changed
- `bond.court_date_reminder` - Court date reminder

#### Payment Events
- `payment.completed` - Payment successfully processed
- `payment.failed` - Payment processing failed
- `payment.refunded` - Payment refunded

#### Document Events
- `document.uploaded` - New document uploaded
- `document.signed` - Document electronically signed
- `document.expired` - Document signature expired

#### Client Events
- `client.created` - New client created
- `client.updated` - Client information updated
- `client.status_changed` - Client status changed

### Webhook Payload

```json
{
  "id": "evt_123456789",
  "type": "bond.created",
  "created": 1642248000,
  "data": {
    "object": {
      "id": "bond_123",
      "client_id": "client_123",
      "amount": 10000.00,
      "status": "active"
    }
  }
}
```

### Webhook Verification

Verify webhook authenticity using the signature header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## SDKs

### JavaScript/Node.js SDK

```bash
npm install bailbondpro-sdk
```

```javascript
const BailBondPro = require('bailbondpro-sdk');

const client = new BailBondPro({
  apiKey: 'your_api_key',
  environment: 'production' // or 'staging'
});

// Create a client
const newClient = await client.clients.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890'
});

// Create a bond
const bond = await client.bonds.create({
  client_id: newClient.id,
  amount: 10000.00,
  premium: 1000.00,
  court_date: '2024-02-15T09:00:00Z'
});
```

### Python SDK

```bash
pip install bailbondpro-python
```

```python
import bailbondpro

client = bailbondpro.Client(
    api_key='your_api_key',
    environment='production'
)

# Create a client
new_client = client.clients.create({
    'first_name': 'John',
    'last_name': 'Doe',
    'email': 'john.doe@example.com',
    'phone': '+1234567890'
})

# Create a bond
bond = client.bonds.create({
    'client_id': new_client['id'],
    'amount': 10000.00,
    'premium': 1000.00,
    'court_date': '2024-02-15T09:00:00Z'
})
```

### PHP SDK

```bash
composer require bailbondpro/php-sdk
```

```php
<?php
require_once 'vendor/autoload.php';

use BailBondPro\Client;

$client = new Client([
    'api_key' => 'your_api_key',
    'environment' => 'production'
]);

// Create a client
$newClient = $client->clients->create([
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john.doe@example.com',
    'phone' => '+1234567890'
]);

// Create a bond
$bond = $client->bonds->create([
    'client_id' => $newClient['id'],
    'amount' => 10000.00,
    'premium' => 1000.00,
    'court_date' => '2024-02-15T09:00:00Z'
]);
?>
```

## Examples

### Complete Bond Processing Workflow

```javascript
// 1. Create a client
const client = await api.clients.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  date_of_birth: '1990-01-15',
  ssn: '123-45-6789'
});

// 2. Create a bond
const bond = await api.bonds.create({
  client_id: client.id,
  amount: 10000.00,
  premium: 1000.00,
  court_date: '2024-02-15T09:00:00Z',
  court_name: 'Superior Court',
  case_number: 'CR-2024-001'
});

// 3. Process payment
const payment = await api.payments.create({
  bond_id: bond.id,
  amount: 1000.00,
  payment_method: 'credit_card',
  payment_details: {
    card_token: 'tok_1234567890'
  }
});

// 4. Upload contract document
const document = await api.documents.upload({
  client_id: client.id,
  bond_id: bond.id,
  type: 'contract',
  file: contractFile
});

// 5. Send for electronic signature
const signature = await api.documents.sign(document.id, {
  signer_email: client.email,
  return_url: 'https://yourapp.com/signed'
});
```

### Batch Operations

```javascript
// Batch create clients
const clients = await api.clients.batchCreate([
  { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
]);

// Batch update bond statuses
const updates = await api.bonds.batchUpdate([
  { id: 'bond_123', status: 'completed' },
  { id: 'bond_124', status: 'forfeited' }
]);
```

### Search and Filtering

```javascript
// Advanced client search
const clients = await api.clients.list({
  search: 'john doe',
  status: 'active',
  created_after: '2024-01-01',
  sort: 'created_at',
  order: 'desc',
  limit: 50
});

// Complex bond filtering
const bonds = await api.bonds.list({
  status: ['active', 'pending'],
  amount_min: 5000,
  amount_max: 50000,
  court_date_from: '2024-01-01',
  court_date_to: '2024-12-31'
});
```

## Testing

### Test Environment

Use the staging environment for testing:
- **Base URL**: `https://api-staging.bailbondpro.com`
- **Test API Key**: Available in your dashboard

### Test Data

The staging environment includes test data:
- Test clients with various statuses
- Sample bonds and payments
- Mock external service responses

### Postman Collection

Import our Postman collection for easy API testing:
```
https://api.bailbondpro.com/postman/collection.json
```

## Support

### Documentation
- **API Reference**: https://docs.bailbondpro.com/api
- **Guides**: https://docs.bailbondpro.com/guides
- **SDKs**: https://docs.bailbondpro.com/sdks

### Support Channels
- **Email**: api-support@bailbondpro.com
- **Chat**: Available in your dashboard
- **Phone**: +1 (555) 123-API1 (business hours)

### Status Page
Monitor API status and incidents:
- **Status Page**: https://status.bailbondpro.com
- **RSS Feed**: https://status.bailbondpro.com/feed.xml

---

**API Version**: 1.0  
**Last Updated**: January 2024  
**Next Version**: Q2 2024