# Overview

BailBond Pro is a comprehensive bail bonds management system designed to streamline operations for bail bond agencies. The application provides a complete workflow for managing clients, cases, bonds, payments, and documents while offering financial tracking and reporting capabilities. Built as a full-stack web application, it features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and integrating with external APIs for enhanced functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas shared between frontend and backend
- **API Design**: RESTful endpoints organized by resource (clients, cases, bonds, payments)
- **Error Handling**: Centralized error middleware with structured error responses

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Secondary Integration**: Gibson AI API for external data operations
- **Schema Structure**: 
  - Users table for authentication and role management
  - Clients table for defendant information
  - Cases table linked to clients for legal case tracking
  - Bonds table connecting cases with financial instruments
  - Payments table for tracking financial transactions
  - Documents and Activities tables for comprehensive record keeping
- **Data Relationships**: Foreign key constraints maintain referential integrity across entities

## Authentication & Authorization
- **User Roles**: Admin, Agent, and Staff with different permission levels
- **Session Management**: Prepared for cookie-based sessions with PostgreSQL storage
- **Security**: Password hashing and role-based access control patterns implemented

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Unstyled accessible UI primitives
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Integration with Zod validation schemas

### Development & Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with Autoprefixer

### External API Integration
- **Gibson AI API**: External data service integration at `https://api.gibsonai.com`
- **Custom API Key**: Configured via environment variables for secure access
- **Fallback Patterns**: Local database operations with external API enhancement

### Chart & Visualization
- **Recharts**: React charting library for financial and analytical visualizations
- **Date-fns**: Date manipulation and formatting utilities

### UI Enhancement Libraries
- **class-variance-authority**: Utility for creating component variants
- **clsx & tailwind-merge**: Conditional CSS class composition
- **cmdk**: Command palette component for search functionality
- **embla-carousel-react**: Carousel component for UI interactions

The architecture emphasizes type safety, developer experience, and maintainability while providing a scalable foundation for bail bond management operations.