# BailBondPro API Documentation

## Overview

The BailBondPro API provides comprehensive endpoints for managing bail bond operations, client management, case tracking, and administrative functions.

**Base URL:** `http://localhost:3000/api`

**Authentication:** Session-based authentication with role-based access control

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "admin|agent|client",
    "firstName": "string",
    "lastName": "string"
  }
}
```

### Logout
```http
POST /api/auth/logout
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "admin|agent|client"
}
```

## Users Management

### Get All Users
```http
GET /api/users
Authorization: Required (admin only)
```

### Get User by ID
```http
GET /api/users/:id
Authorization: Required
```

### Update User
```http
PUT /api/users/:id
Content-Type: application/json
Authorization: Required

{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "admin|agent|client"
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Required (admin only)
```

## Client Management

### Get All Clients
```http
GET /api/clients
Authorization: Required
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
  - search: string
  - status: active|inactive
```

**Response:**
```json
{
  "clients": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "dateOfBirth": "string",
      "ssn": "string",
      "emergencyContact": "string",
      "emergencyPhone": "string",
      "status": "active|inactive",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### Create Client
```http
POST /api/clients
Content-Type: application/json
Authorization: Required

{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zipCode": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "emergencyContact": "string",
  "emergencyPhone": "string"
}
```

### Get Client by ID
```http
GET /api/clients/:id
Authorization: Required
```

### Update Client
```http
PUT /api/clients/:id
Content-Type: application/json
Authorization: Required

{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "status": "active|inactive"
}
```

### Delete Client
```http
DELETE /api/clients/:id
Authorization: Required (admin only)
```

## Case Management

### Get All Cases
```http
GET /api/cases
Authorization: Required
Query Parameters:
  - page: number
  - limit: number
  - status: pending|active|closed
  - clientId: string
```

### Create Case
```http
POST /api/cases
Content-Type: application/json
Authorization: Required

{
  "clientId": "string",
  "caseNumber": "string",
  "court": "string",
  "judge": "string",
  "charges": "string",
  "arrestDate": "string",
  "bailAmount": "number",
  "status": "pending|active|closed"
}
```

### Get Case by ID
```http
GET /api/cases/:id
Authorization: Required
```

### Update Case
```http
PUT /api/cases/:id
Content-Type: application/json
Authorization: Required

{
  "court": "string",
  "judge": "string",
  "charges": "string",
  "bailAmount": "number",
  "status": "pending|active|closed",
  "notes": "string"
}
```

## Bond Management

### Get All Bonds
```http
GET /api/bonds
Authorization: Required
Query Parameters:
  - page: number
  - limit: number
  - status: active|completed|forfeited
  - caseId: string
```

### Create Bond
```http
POST /api/bonds
Content-Type: application/json
Authorization: Required

{
  "caseId": "string",
  "bondAmount": "number",
  "premium": "number",
  "collateral": "string",
  "cosignerName": "string",
  "cosignerPhone": "string",
  "status": "active|completed|forfeited"
}
```

### Get Bond by ID
```http
GET /api/bonds/:id
Authorization: Required
```

### Update Bond Status
```http
PUT /api/bonds/:id/status
Content-Type: application/json
Authorization: Required

{
  "status": "active|completed|forfeited",
  "notes": "string"
}
```

## Payment Management

### Get All Payments
```http
GET /api/payments
Authorization: Required
Query Parameters:
  - page: number
  - limit: number
  - bondId: string
  - method: cash|check|card|transfer
```

### Create Payment
```http
POST /api/payments
Content-Type: application/json
Authorization: Required

{
  "bondId": "string",
  "amount": "number",
  "method": "cash|check|card|transfer",
  "reference": "string",
  "notes": "string"
}
```

### Get Payment by ID
```http
GET /api/payments/:id
Authorization: Required
```

## Document Management

### Upload Document
```http
POST /api/documents
Content-Type: multipart/form-data
Authorization: Required

{
  "file": "File",
  "caseId": "string",
  "type": "contract|id|court_order|other",
  "description": "string"
}
```

### Get Documents
```http
GET /api/documents
Authorization: Required
Query Parameters:
  - caseId: string
  - type: string
```

### Download Document
```http
GET /api/documents/:id/download
Authorization: Required
```

### Delete Document
```http
DELETE /api/documents/:id
Authorization: Required
```

## Activity Tracking

### Get Activities
```http
GET /api/activities
Authorization: Required
Query Parameters:
  - page: number
  - limit: number
  - caseId: string
  - userId: string
  - type: string
```

### Create Activity
```http
POST /api/activities
Content-Type: application/json
Authorization: Required

{
  "caseId": "string",
  "type": "call|meeting|court|payment|other",
  "description": "string",
  "notes": "string"
}
```

## Client Check-ins

### Get Check-ins
```http
GET /api/checkins
Authorization: Required
Query Parameters:
  - clientId: string
  - page: number
  - limit: number
```

### Create Check-in
```http
POST /api/checkins
Content-Type: application/json
Authorization: Required

{
  "clientId": "string",
  "location": "string",
  "notes": "string",
  "method": "phone|in_person|online"
}
```

## Contract Management

### Get Contract Templates
```http
GET /api/contracts/templates
Authorization: Required
```

### Create Contract Template
```http
POST /api/contracts/templates
Content-Type: application/json
Authorization: Required (admin only)

{
  "name": "string",
  "content": "string",
  "variables": ["string"]
}
```

### Generate Contract
```http
POST /api/contracts/generate
Content-Type: application/json
Authorization: Required

{
  "templateId": "string",
  "caseId": "string",
  "variables": {
    "clientName": "string",
    "bondAmount": "number",
    "premium": "number"
  }
}
```

### Get Generated Contracts
```http
GET /api/contracts
Authorization: Required
Query Parameters:
  - caseId: string
```

## Training Management

### Get Training Modules
```http
GET /api/training/modules
Authorization: Required
```

### Create Training Module
```http
POST /api/training/modules
Content-Type: application/json
Authorization: Required (admin only)

{
  "title": "string",
  "description": "string",
  "content": "string",
  "duration": "number",
  "requiredRole": "admin|agent|client"
}
```

### Get User Training Progress
```http
GET /api/training/progress
Authorization: Required
```

### Update Training Progress
```http
POST /api/training/progress
Content-Type: application/json
Authorization: Required

{
  "moduleId": "string",
  "completed": "boolean",
  "score": "number"
}
```

## Standard Operating Procedures

### Get SOPs
```http
GET /api/sops
Authorization: Required
```

### Create SOP
```http
POST /api/sops
Content-Type: application/json
Authorization: Required (admin only)

{
  "title": "string",
  "category": "string",
  "content": "string",
  "version": "string"
}
```

### Update SOP
```http
PUT /api/sops/:id
Content-Type: application/json
Authorization: Required (admin only)

{
  "title": "string",
  "content": "string",
  "version": "string"
}
```

## Reports and Analytics

### Get Dashboard Stats
```http
GET /api/reports/dashboard
Authorization: Required
```

**Response:**
```json
{
  "totalClients": "number",
  "activeCases": "number",
  "totalBonds": "number",
  "monthlyRevenue": "number",
  "pendingPayments": "number",
  "upcomingCourtDates": "number"
}
```

### Get Financial Report
```http
GET /api/reports/financial
Authorization: Required (admin only)
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
```

### Get Case Report
```http
GET /api/reports/cases
Authorization: Required
Query Parameters:
  - startDate: string
  - endDate: string
  - status: string
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": ["Specific validation errors"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:** 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Webhooks

### Available Events
- `case.created`
- `case.updated`
- `bond.created`
- `payment.received`
- `client.checkin`

### Webhook Payload
```json
{
  "event": "string",
  "timestamp": "string",
  "data": {
    // Event-specific data
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install bailbondpro-sdk
```

```javascript
import { BailBondProClient } from 'bailbondpro-sdk';

const client = new BailBondProClient({
  baseUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key'
});

const clients = await client.clients.list();
```

---

For more information or support, contact: support@rjbizsolution.com