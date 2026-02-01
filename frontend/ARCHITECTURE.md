# Zenith Lite Frontend Architecture

## Table of Contents
1. [Code Organization](#code-organization)
2. [Naming Conventions](#naming-conventions)
3. [Versioning Strategy](#versioning-strategy)
4. [Type Safety Guidelines](#type-safety-guidelines)
5. [Testing Standards](#testing-standards)
6. [Git Workflow](#git-workflow)

## Code Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (routes)/          # Route groupings
│   ├── components/        # Shared page components
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── FrenlyAI/         # AI assistant components
│   └── ui/               # Base UI components
├── hooks/                 # Custom React hooks
│   └── __tests__/        # Hook tests
├── lib/                   # Utility libraries
│   ├── api.ts            # API client
│   ├── constants.ts      # App constants
│   └── logger.ts         # Logging utility
├── services/             # Business logic services
│   ├── __tests__/        # Service tests
│   └── *.ts              # Service implementations
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
│   ├── index.ts          # Type exports
│   ├── graph.ts          # Graph/Network types
│   ├── next-auth.d.ts    # NextAuth extensions
│   └── global.d.ts       # Global type declarations
├── test/                 # Test utilities and setup
│   ├── setup.ts          # Vitest configuration
│   └── utils.tsx         # Test helpers
└── workers/              # Web Workers
```

### Key Principles

1. **Feature-Based Organization**: Group related files by feature/domain
2. **Co-location**: Keep tests close to the code they test
3. **Barrel Exports**: Use `index.ts` files for clean imports
4. **Separation of Concerns**: UI, logic, and data fetching are separated

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with 'use' prefix | `useProject.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Services | PascalCase + Service | `ProjectService.ts` |
| Types | camelCase + types | `graph.ts` |
| Tests | Original name + .test | `useProject.test.ts` |
| Styles | kebab-case | `user-profile.css` |

### Variables & Functions

- **Constants**: UPPER_SNAKE_CASE for true constants
- **Components**: PascalCase
- **Hooks**: camelCase with `use` prefix
- **Event Handlers**: Prefix with `handle` (e.g., `handleClick`)
- **Boolean Variables**: Use `is`, `has`, `should` prefixes
- **Arrays**: Plural nouns (e.g., `projects`, `users`)

### CSS/Tailwind Classes

- Use semantic class names
- Group related Tailwind classes
- Extract repeated patterns to components

## Versioning Strategy

### API Version Prevention

To prevent API version drift and maintain code quality:

1. **ESLint Rule**: Added `no-restricted-imports` rule blocking `.v2.ts` imports
   ```javascript
   'no-restricted-imports': ['error', {
     patterns: [{
       group: ['*.v2', '**/*.v2', '*.v2.ts', '**/*.v2.ts'],
       message: 'Importing from .v2.ts files is prohibited.',
     }],
   }]
   ```

2. **Standardized API Layer**: All API calls go through:
   - `src/lib/api.ts` - Core API utilities
   - `src/services/apiRoutes.ts` - Centralized route definitions

3. **No Version Suffixes**: Never create files with version suffixes like:
   - ❌ `ProjectService.v2.ts`
   - ❌ `api.v2.ts`
   - ❌ `types.v2.ts`

4. **Migration Strategy**: When APIs change:
   - Update existing services incrementally
   - Use feature flags for gradual rollouts
   - Document breaking changes in commit messages

### Component Versioning

- Components are versioned through the component library
- Use composition over inheritance
- Deprecate old components with `@deprecated` JSDoc tags

## Type Safety Guidelines

### Strict TypeScript Configuration

Our `tsconfig.json` enforces:
- `"strict": true` - All strict type-checking options
- `"noImplicitAny": true` - No implicit `any` types
- `"strictNullChecks": true` - Null safety

### Type Definition Rules

1. **No `as any` Assertions** (Eliminated in Phase 2)
   - All 13 `as any` assertions have been replaced with proper types
   - See `src/types/graph.ts` for new Graph types
   - See `src/types/global.d.ts` for global type extensions

2. **Interface vs Type**
   - Use `interface` for object shapes that may be extended
   - Use `type` for unions, tuples, and mapped types

3. **Export Pattern**
   ```typescript
   // types/index.ts
   export * from './graph';
   export * from './websocket';
   ```

4. **Component Props**
   ```typescript
   interface ButtonProps {
     variant?: 'primary' | 'secondary';
     size?: 'sm' | 'md' | 'lg';
     onClick?: () => void;
   }
   ```

5. **API Response Types**
   ```typescript
   interface ApiResponse<T> {
     data: T;
     status: number;
     message?: string;
   }
   ```

### Common Type Patterns

```typescript
// Graph Types (ForceGraph2D)
interface GraphNode {
  id: string;
  name: string;
  risk?: number;
  // ... other properties
}

// Async Functions
async function fetchData(): Promise<DataType> { }

// Event Handlers
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => { };

// Generic Hooks
function useApi<T>(endpoint: string): UseApiResult<T> { }
```

## Testing Standards

### Test File Location

- Co-located with source files in `__tests__/` directories
- Example: `src/hooks/__tests__/useProject.test.ts`

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FeatureName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FunctionName', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Testing Requirements

1. **Unit Tests**: All hooks, utilities, and services
2. **Integration Tests**: Complex component interactions
3. **Coverage Thresholds**: 70% minimum for all metrics

### Mocking Strategy

```typescript
// Mock external services
vi.mock('../../services/ProjectService', () => ({
  ProjectService: {
    fetchProjects: vi.fn(),
  },
}));

// Mock with proper types
const mockedFetch = authenticatedFetch as MockedFunction<typeof authenticatedFetch>;
```

## Git Workflow

### Pre-Commit Hooks

Husky runs automatically via the `prepare` script:

1. **lint-staged**: Formats and lints staged files
2. **Type Check**: Runs `tsc --noEmit` to catch type errors
3. **Test**: Runs relevant tests for changed files

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

## Code Quality Checklist

Before committing, ensure:

- [ ] No `as any` type assertions
- [ ] All TypeScript errors resolved (`tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] No `.v2.ts` imports
- [ ] Proper types defined in `src/types/`
- [ ] Components have proper prop interfaces
- [ ] API calls use `authenticatedFetch`

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
