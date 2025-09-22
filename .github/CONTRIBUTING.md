# 🤝 Contributing to BailBondPro

Thank you for your interest in contributing to BailBondPro! This guide will help you get started with contributing to our bail bond management system.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to `conduct@bailbondpro.com`.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.30.0 or higher)
- **Docker** (v20.10.0 or higher) - for containerized development
- **PostgreSQL** (v14.0 or higher) - for local database development

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/BailBondPro.git
   cd BailBondPro
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/kalivibecoding/BailBondPro.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

6. **Set up the database**:
   ```bash
   npm run db:setup
   # or
   yarn db:setup
   ```

7. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🛠️ Development Setup

### Using Docker (Recommended)

For a consistent development environment, we recommend using Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Development

If you prefer local development:

```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# In another terminal, start the API server
npm run api:dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Reset database |

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🧪 **Test improvements**
- 🔧 **Tooling and infrastructure**

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Create an issue** for significant changes to discuss the approach
3. **Follow our coding standards** and conventions
4. **Write tests** for new functionality
5. **Update documentation** as needed

### Branching Strategy

We use a Git Flow-inspired branching strategy:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation branches

### Branch Naming Convention

```
feature/BBP-123-add-client-search
bugfix/BBP-456-fix-payment-calculation
hotfix/BBP-789-security-patch
docs/BBP-101-update-api-documentation
```

## 🔄 Pull Request Process

### Creating a Pull Request

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/BBP-123-your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Run the test suite**:
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat(client): add advanced search functionality"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/BBP-123-your-feature-name
   ```

7. **Create a pull request** on GitHub

### Pull Request Requirements

- ✅ **Descriptive title** and detailed description
- ✅ **Link to related issue(s)**
- ✅ **All tests passing**
- ✅ **Code coverage maintained** (minimum 80%)
- ✅ **No linting errors**
- ✅ **Documentation updated** (if applicable)
- ✅ **Screenshots/GIFs** for UI changes
- ✅ **Breaking changes documented**

### Pull Request Template

When creating a pull request, please use our template and fill out all relevant sections:

- Summary of changes
- Type of change
- Related issues
- Testing performed
- Screenshots (for UI changes)
- Checklist completion

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing** in staging environment
4. **Approval** from code owners
5. **Merge** using squash and merge strategy

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the FAQ** and documentation
3. **Try the latest version** to see if the issue persists
4. **Gather relevant information** (browser, OS, version, etc.)

### Issue Types

We use issue templates for different types of issues:

- **🐛 Bug Report** - Report a bug or unexpected behavior
- **✨ Feature Request** - Suggest a new feature or enhancement
- **📚 Documentation** - Improvements to documentation
- **❓ Question** - Ask questions about usage or implementation

### Writing Good Issues

- **Clear, descriptive title**
- **Detailed description** of the problem or request
- **Steps to reproduce** (for bugs)
- **Expected vs. actual behavior**
- **Environment information**
- **Screenshots or code examples**
- **Possible solutions** (if you have ideas)

## 💻 Coding Standards

### TypeScript/JavaScript

We follow strict coding standards to maintain code quality:

```typescript
// ✅ Good
interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const createClient = async (data: ClientData): Promise<Client> => {
  const client = await clientService.create(data);
  return client;
};

// ❌ Bad
const createClient = async (data: any) => {
  const client = await clientService.create(data);
  return client;
};
```

### Code Style Guidelines

- **Use TypeScript** for all new code
- **Prefer functional components** with hooks
- **Use meaningful variable names**
- **Write self-documenting code**
- **Add comments for complex logic**
- **Follow the single responsibility principle**
- **Use async/await** instead of promises
- **Handle errors appropriately**

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── forms/          # Form components
├── pages/              # Next.js pages
├── hooks/              # Custom React hooks
├── services/           # API services and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── styles/             # Global styles and themes
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **CSS Classes**: `kebab-case`

## 🧪 Testing Requirements

### Testing Strategy

We maintain high test coverage with different types of tests:

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test component interactions
- **E2E Tests** - Test complete user workflows
- **API Tests** - Test API endpoints and business logic

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientForm } from './ClientForm';

describe('ClientForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ClientForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'John'
    });
  });
});
```

### Test Requirements

- **Minimum 80% code coverage**
- **Test all public APIs**
- **Test error conditions**
- **Test edge cases**
- **Use descriptive test names**
- **Follow AAA pattern** (Arrange, Act, Assert)

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test ClientForm.test.tsx
```

## 📚 Documentation

### Documentation Types

- **README** - Project overview and quick start
- **API Documentation** - Endpoint documentation
- **Component Documentation** - Component usage and props
- **Architecture Documentation** - System design and decisions
- **User Documentation** - End-user guides and tutorials

### Writing Documentation

- **Use clear, concise language**
- **Include code examples**
- **Add screenshots for UI features**
- **Keep documentation up-to-date**
- **Use proper markdown formatting**
- **Link to related documentation**

### Documentation Tools

- **Storybook** - Component documentation
- **JSDoc** - Code documentation
- **OpenAPI** - API documentation
- **Docusaurus** - User documentation site

## 🌟 Recognition

We appreciate all contributions and recognize contributors in various ways:

- **Contributors list** in README
- **Release notes** mention significant contributions
- **Social media** recognition for major features
- **Swag and rewards** for outstanding contributions

### Hall of Fame

Outstanding contributors may be invited to join our:

- **Core Contributors** team
- **Technical Advisory Board**
- **Beta Testing Program**
- **Speaking Opportunities** at conferences

## 🤔 Getting Help

### Community Support

- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time chat with the community
- **Stack Overflow** - Tag questions with `bailbondpro`
- **Twitter** - Follow [@BailBondPro](https://twitter.com/bailbondpro) for updates

### Maintainer Support

- **Email** - `developers@bailbondpro.com`
- **Office Hours** - Weekly video calls (schedule TBD)
- **1:1 Mentoring** - For significant contributions

### Resources

- **Development Guide** - Detailed development setup
- **Architecture Guide** - System architecture overview
- **API Reference** - Complete API documentation
- **Design System** - UI components and guidelines

## 📄 License

By contributing to BailBondPro, you agree that your contributions will be licensed under the same license as the project. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Thank you to all our contributors who help make BailBondPro better:

- **Core Team** - Full-time maintainers
- **Contributors** - Community members who contribute code
- **Testers** - Users who report bugs and test features
- **Designers** - UI/UX contributors
- **Documentarians** - Documentation contributors

---

**Questions?** Feel free to reach out to us at `developers@bailbondpro.com` or create a discussion on GitHub.

**Happy Contributing!** 🎉