# Frontend Rules — React + TypeScript

Rules for all code in `frontend/src/`. Apply these when writing, reviewing, or refactoring frontend code.

## Component Structure

### File Organisation
```
frontend/src/
  components/         # Reusable, domain-agnostic UI components
    Button/
      Button.tsx
      Button.test.tsx
      index.ts        # re-exports Button as default
  features/           # Domain-specific feature modules
    wells/
      WellList.tsx
      WellDetail.tsx
      hooks/
        useWells.ts
  hooks/              # Shared custom hooks
  pages/              # Route-level components (thin, orchestrate features)
  types/              # Shared TypeScript interfaces and types
  utils/              # Pure utility functions
  api/                # API client functions (axios calls)
```

### Component Rules
- One component per file
- Component files use PascalCase: `WellCard.tsx`
- Max ~200 lines per component — split if longer
- Props interface must be defined above the component and named `<ComponentName>Props`
- Export the component as a named export, not default (except for pages/routes)

```tsx
// Good
interface WellCardProps {
  wellId: string;
  status: 'active' | 'inactive';
}

export const WellCard: React.FC<WellCardProps> = ({ wellId, status }) => { ... };
```

## TypeScript

- Strict mode must be enabled (`"strict": true` in `tsconfig.json`)
- No `any` — use `unknown` and narrow the type explicitly
- API response types must be defined in `src/types/` and kept in sync with backend Pydantic schemas
- Use `type` for unions and intersections; use `interface` for object shapes
- Prefer explicit return types on non-trivial functions

## State Management

- Component-local state: `useState`
- Derived state: compute it during render, do not sync it into another `useState`
- Shared state within a feature: React Context with a custom hook wrapping `useContext`
- Server state (API data): use a data-fetching hook (e.g. custom hook with `axios` + `useState`/`useEffect`, or React Query if added)
- Do not put server state into application-level context

## Hooks

- Custom hooks live in `src/hooks/` (shared) or `src/features/<name>/hooks/` (feature-scoped)
- Hook names always start with `use`
- Hooks must not return JSX
- Always specify dependency arrays for `useEffect`, `useMemo`, and `useCallback` — never leave them empty without a comment explaining why

## API Calls

- All `axios` calls live in `src/api/` — never make API calls directly inside components
- API functions are async and return typed promises
- Handle loading and error states explicitly in every component that fetches data

```ts
// src/api/wells.ts
export async function fetchWells(): Promise<Well[]> {
  const response = await apiClient.get<Well[]>('/wells');
  return response.data;
}
```

## Styling Conventions

- Use CSS Modules (`.module.css`) for component-scoped styles
- Class names use camelCase in CSS Modules: `styles.wellCard`
- No inline styles except for truly dynamic values (e.g. width as a percentage from data)
- No global styles except in `src/index.css` for resets and CSS variables
- Use CSS custom properties (variables) for the design system (colours, spacing, typography)

## Error Handling

- Every component that calls an API must handle three states: loading, error, and success
- Show meaningful error messages to the user — not "Something went wrong"
- Log unexpected errors to the console in development; send to an error tracking service in production

## Routing

- Routes are defined in `App.tsx` only
- Use `React.lazy` + `Suspense` for route-level code splitting
- Protect authenticated routes with a wrapper component, not ad-hoc checks inside pages

## Do Not

- Do not use `document.getElementById` or direct DOM manipulation — use React refs
- Do not mutate state directly — always use the setter function
- Do not import from `react-scripts` internals
- Do not commit `console.log` statements
