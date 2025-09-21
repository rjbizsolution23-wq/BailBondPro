# 🏛️ BailBondPro - Professional Bail Bond Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A comprehensive, enterprise-grade bail bond management system designed for bail bond agencies to streamline operations, manage clients, track bonds, and ensure regulatory compliance.

## 🚀 Features

### 📊 Core Management
- **Client Management**: Complete client profiles with contact information, emergency contacts, and portal access
- **Case Tracking**: Detailed case management with court dates, charges, and legal documentation
- **Bond Processing**: Full bond lifecycle management from issuance to exoneration
- **Payment Processing**: Comprehensive payment tracking with multiple payment methods
- **Document Management**: Secure document storage and organization by category

### 🔐 Client Portal
- **Self-Service Portal**: Clients can log in to view their bond status and make payments
- **Check-in System**: GPS-enabled client check-ins with photo verification
- **Real-time Updates**: Instant notifications for court dates and payment reminders

### 📋 Compliance & Training
- **Contract Templates**: Bilingual contract generation with variable substitution
- **Training Modules**: Comprehensive staff training system with progress tracking
- **Standard Operating Procedures**: Digital SOP management with version control
- **Activity Logging**: Complete audit trail for compliance requirements

### 📈 Analytics & Reporting
- **Financial Dashboard**: Revenue tracking, payment analytics, and profitability reports
- **Risk Assessment**: Client risk scoring and bond performance metrics
- **Compliance Reports**: Automated reporting for regulatory requirements

### 🌐 Multi-language Support
- **Bilingual Interface**: Full English and Spanish language support
- **Localized Content**: All templates, training materials, and SOPs available in both languages

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **React Hook Form** with Zod validation
- **TanStack Query** for data fetching

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **JWT** for authentication
- **Multer** for file uploads
- **OpenAI** integration for AI features

### Infrastructure
- **Docker** ready for containerization
- **Vite** for development server
- **ESBuild** for production builds
- **Rate limiting** and security middleware

## 📋 Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/rjbizsolution23-wq/BailBondPro.git
cd BailBondPro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bailbondpro"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
SESSION_SECRET="your-session-secret"

# OpenAI (optional)
OPENAI_API_KEY="your-openai-api-key"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Server
PORT=3000
NODE_ENV=development
```

### 4. Database Setup
```bash
# Push database schema
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
BailBondPro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── db.ts             # Database configuration
│   ├── services/         # Business logic services
│   └── index.ts          # Server entry point
├── shared/               # Shared code between client/server
│   ├── schema.ts         # Database schema & types
│   └── i18n.ts          # Internationalization
└── uploads/             # File upload directory
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## 🗄️ Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: System users (agents, staff, admins)
- **Clients**: Bail bond clients with portal access
- **Cases**: Legal cases associated with clients
- **Bonds**: Bail bonds with payment tracking
- **Payments**: Payment transactions and history
- **Documents**: File storage and categorization
- **Activities**: System activity logging
- **Client Check-ins**: GPS-enabled client check-ins
- **Contract Templates**: Bilingual contract management
- **Training Modules**: Staff training system
- **SOPs**: Standard Operating Procedures

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, agent, and staff roles
- **Session Management**: Secure session handling
- **Rate Limiting**: API rate limiting protection
- **File Upload Security**: Secure file handling with type validation
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM

## 🌍 Internationalization

The system supports English and Spanish languages:
- UI translations
- Contract templates
- Training materials
- Standard Operating Procedures

## 📱 Client Portal Features

- Secure client login system
- Bond status viewing
- Payment history
- Court date reminders
- GPS-enabled check-ins
- Photo verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@rjbizsolution.com
- GitHub Issues: [Create an issue](https://github.com/rjbizsolution23-wq/BailBondPro/issues)

## 🏗️ Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with court systems
- [ ] Automated compliance reporting
- [ ] AI-powered risk assessment
- [ ] Multi-tenant architecture

---

**Built with ❤️ by Rick Jefferson Solutions**