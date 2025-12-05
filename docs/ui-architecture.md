# UI Architecture Guide

## Overview

This document describes the UI architecture for the Gacha Game Company Simulator, following Clean Architecture principles with a clear separation between business logic and presentation.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                         │
│  Components only handle rendering and user input events         │
├─────────────────────────────────────────────────────────────────┤
│                    Presentation Layer                            │
│  ViewModels: Transform domain → UI-friendly structures          │
│  Hooks: Connect components to state, expose actions             │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                             │
│  Actions: Command definitions (what can happen)                 │
│  Reducers: State transitions (how state changes)                │
│  State: Game state shape and helpers                            │
├─────────────────────────────────────────────────────────────────┤
│                      Domain Layer                                │
│  Entities: Company, Employee, Game, Gacha                       │
│  Value Objects: Currency, Skills, Quality                       │
│  Business Rules: All game logic                                 │
├─────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                           │
│  Storage: localStorage persistence                              │
│  GameLoop: Tick-based simulation                                │
│  EventBus: Cross-system communication                           │
└─────────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. NO Business Logic in React Components
Components should:
- Render UI based on props/state
- Handle user interactions (clicks, inputs)
- Call hooks for data and actions

Components should NOT:
- Contain calculations or business rules
- Directly manipulate domain entities
- Know about state structure internals

### 2. ViewModels Transform Data for UI
ViewModels take domain models and produce UI-friendly structures:

```typescript
// Domain: Employee has raw skill numbers
interface Employee {
  skills: { programming: number; art: number; ... };
  salary: number;
  morale: number;
}

// ViewModel: Transformed for display
interface EmployeeViewModel {
  id: string;
  displayName: string;
  roleLabel: string;
  primarySkill: { name: string; level: number; color: string };
  skillBars: Array<{ name: string; value: number; color: string }>;
  salaryFormatted: string;
  moraleStatus: 'critical' | 'low' | 'normal' | 'high';
  canTrain: boolean;
  canFire: boolean;
}
```

### 3. Custom Hooks Connect UI to State
Hooks encapsulate:
- Selecting relevant state slices
- Memoizing derived data
- Exposing action dispatchers

```typescript
function useEmployees() {
  const { state, dispatch } = useGame();
  
  // Memoized selectors
  const employees = useMemo(
    () => state.employees.map(toEmployeeViewModel),
    [state.employees]
  );
  
  // Action handlers
  const hire = useCallback((id: string) => 
    dispatch(GameActions.hireEmployee(id)), [dispatch]);
  
  return { employees, hire, fire, train };
}
```

## Data Flow

### Example: Hiring an Employee

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                                       │
│    User clicks "Hire" button on EmployeeCard                             │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. COMPONENT CALLS HOOK                                                   │
│    <Button onClick={() => hire(employee.id)}>Hire</Button>               │
│    └─ useEmployees().hire(id) called                                      │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. ACTION DISPATCHED                                                      │
│    dispatch(GameActions.hireEmployee(id))                                │
│    └─ { type: 'HIRE_EMPLOYEE', payload: { employeeId: 'emp-123' } }      │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. REDUCER UPDATES STATE                                                  │
│    gameReducer handles HIRE_EMPLOYEE:                                    │
│    - Validates funds available                                           │
│    - Calls domain: addEmployeeToCompany(company, employee)               │
│    - Returns new immutable state                                         │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. STATE UPDATE TRIGGERS RE-RENDER                                        │
│    - useReducer detects new state                                        │
│    - React re-renders affected components                                │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. VIEWMODEL RECOMPUTES                                                   │
│    useMemo in useEmployees() recalculates:                               │
│    - New employee list with ViewModels                                   │
│    - Updated company funds display                                       │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. UI UPDATES                                                             │
│    - EmployeesView shows new employee in list                            │
│    - Header shows reduced funds                                          │
│    - Toast notification (optional)                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

## TypeScript Interfaces

### Domain Layer
```typescript
// Core business entities
interface Company {
  readonly id: string;
  readonly name: string;
  readonly funds: number;
  readonly reputation: number;
  readonly employeeIds: string[];
}

interface Employee {
  readonly id: string;
  readonly name: string;
  readonly role: EmployeeRole;
  readonly skills: SkillSet;
  readonly salary: number;
  readonly morale: number;
}

interface Game {
  readonly id: string;
  readonly name: string;
  readonly genre: GameGenre;
  readonly status: GameStatus;
  readonly developmentProgress: number;
  readonly quality: GameQuality;
}
```

### Application Layer
```typescript
// State shape
interface GameState {
  readonly company: Company | null;
  readonly employees: Employee[];
  readonly games: Game[];
  readonly currentTick: number;
  readonly gameSpeed: GameSpeed;
  readonly isPaused: boolean;
}

// Actions
type GameAction =
  | { type: 'HIRE_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'FIRE_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'START_GAME_PROJECT'; payload: { name: string; genre: string } }
  // ... more actions

// Reducer signature
type GameReducer = (state: GameState, action: GameAction) => GameState;
```

### Presentation Layer (ViewModels)
```typescript
// UI-friendly employee representation
interface EmployeeViewModel {
  id: string;
  displayName: string;
  avatarUrl: string;
  roleLabel: string;
  levelBadge: { text: string; color: string };
  primarySkill: SkillDisplay;
  allSkills: SkillDisplay[];
  salaryFormatted: string;
  moraleIndicator: MoraleDisplay;
  isAssigned: boolean;
  assignedProject: string | null;
  actions: {
    canHire: boolean;
    canFire: boolean;
    canTrain: boolean;
    canAssign: boolean;
  };
}

interface SkillDisplay {
  name: string;
  value: number;
  maxValue: number;
  percentage: number;
  color: string;
  icon: string;
}

interface MoraleDisplay {
  value: number;
  status: 'critical' | 'low' | 'normal' | 'high' | 'excellent';
  color: string;
  icon: string;
}
```

### UI Layer (React)
```typescript
// Component props - only UI concerns
interface EmployeeCardProps {
  employee: EmployeeViewModel;
  onHire?: () => void;
  onFire?: () => void;
  onTrain?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

// Hook return types
interface UseEmployeesReturn {
  employees: EmployeeViewModel[];
  availableForHire: EmployeeViewModel[];
  isLoading: boolean;
  error: string | null;
  hire: (id: string) => void;
  fire: (id: string) => void;
  train: (id: string, skill: string) => void;
  assignToProject: (employeeId: string, projectId: string) => void;
}
```

## Custom Hooks Pattern

### Base Hook: useGame
```typescript
// Central context hook - raw state access
function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
```

### Domain-Specific Hooks
```typescript
// Employees hook with memoization
function useEmployees(): UseEmployeesReturn {
  const { state, dispatch } = useGame();
  
  const employees = useMemo(
    () => state.employees.map(toEmployeeViewModel),
    [state.employees]
  );
  
  const availableForHire = useMemo(
    () => generateHireCandidates(state.currentTick).map(toEmployeeViewModel),
    [state.currentTick]
  );
  
  const hire = useCallback((id: string) => {
    dispatch(GameActions.hireEmployee(id));
  }, [dispatch]);
  
  // ... more actions
  
  return { employees, availableForHire, hire, fire, train };
}

// Company hook
function useCompany(): UseCompanyReturn {
  const { state } = useGame();
  
  const company = useMemo(
    () => state.company ? toCompanyViewModel(state.company) : null,
    [state.company]
  );
  
  const financials = useMemo(
    () => calculateFinancials(state),
    [state.company, state.employees, state.games]
  );
  
  return { company, financials };
}

// Games hook
function useGames(): UseGamesReturn {
  const { state, dispatch } = useGame();
  
  const games = useMemo(
    () => state.games.map(g => toGameViewModel(g, state.employees)),
    [state.games, state.employees]
  );
  
  const startProject = useCallback((name: string, genre: string) => {
    dispatch(GameActions.startGameProject(name, genre));
  }, [dispatch]);
  
  return { games, startProject, launchGame, shutdownGame };
}
```

## Best Practices

### 1. Memoize Expensive Computations
```typescript
// ✅ Good - memoized
const sortedEmployees = useMemo(
  () => [...employees].sort((a, b) => b.salary - a.salary),
  [employees]
);

// ❌ Bad - recalculates every render
const sortedEmployees = [...employees].sort((a, b) => b.salary - a.salary);
```

### 2. Use Callback for Actions
```typescript
// ✅ Good - stable reference
const handleHire = useCallback((id: string) => {
  dispatch(GameActions.hireEmployee(id));
}, [dispatch]);

// ❌ Bad - new function every render
const handleHire = (id: string) => {
  dispatch(GameActions.hireEmployee(id));
};
```

### 3. Keep Components Pure
```typescript
// ✅ Good - pure rendering
function EmployeeCard({ employee, onHire }: Props) {
  return (
    <div>
      <h3>{employee.displayName}</h3>
      <Button onClick={onHire}>Hire</Button>
    </div>
  );
}

// ❌ Bad - business logic in component
function EmployeeCard({ employee, company }: Props) {
  const canAfford = company.funds >= employee.salary * 3;
  const skillMatch = calculateSkillMatch(employee, company.needs);
  // ... too much logic
}
```

### 4. Colocate Related Code
```
src/presentation/
├── viewmodels/
│   ├── EmployeeViewModel.ts    # Employee transformation
│   ├── GameViewModel.ts        # Game transformation
│   └── CompanyViewModel.ts     # Company transformation
├── hooks/
│   ├── useEmployees.ts         # Employee state & actions
│   ├── useGames.ts             # Game state & actions
│   └── useCompany.ts           # Company state & actions
└── components/
    ├── employees/
    │   ├── EmployeeCard.tsx
    │   ├── EmployeeList.tsx
    │   └── HireModal.tsx
    └── games/
        ├── GameCard.tsx
        └── GameProgress.tsx
```

## State Management Details

### Current Implementation
- **React Context + useReducer**: Simple, built-in, good for medium complexity
- **Immutable updates**: All state changes return new objects
- **Action creators**: Type-safe action creation

### Features Supported
- ✅ Save/Load (localStorage)
- ✅ Pause/Resume simulation
- ✅ Speed controls
- ⏳ Undo/Redo (planned)
- ⏳ Time-travel debugging (planned)
- ⏳ Middleware support (planned)

### Persistence Flow
```
User clicks Save
  → saveGame() in GameContext
  → storageService.save(state)
  → JSON.stringify(state)
  → localStorage.setItem('gameState', json)
  → Confirmation toast

User clicks Load
  → loadGame() in GameContext
  → storageService.load()
  → localStorage.getItem('gameState')
  → JSON.parse(json)
  → dispatch(GameActions.loadState(state))
  → UI re-renders with loaded state
```

## Testing Strategy

### ViewModels
```typescript
describe('toEmployeeViewModel', () => {
  it('should format salary correctly', () => {
    const employee = createEmployee({ salary: 50000 });
    const vm = toEmployeeViewModel(employee);
    expect(vm.salaryFormatted).toBe('$50,000/mo');
  });
  
  it('should calculate morale status', () => {
    const lowMorale = createEmployee({ morale: 25 });
    expect(toEmployeeViewModel(lowMorale).moraleIndicator.status).toBe('low');
  });
});
```

### Hooks
```typescript
describe('useEmployees', () => {
  it('should return transformed employees', () => {
    const { result } = renderHook(() => useEmployees(), {
      wrapper: GameProviderWithState({ employees: [testEmployee] })
    });
    
    expect(result.current.employees).toHaveLength(1);
    expect(result.current.employees[0].displayName).toBe('John Doe');
  });
});
```

### Components
```typescript
describe('EmployeeCard', () => {
  it('should render employee info', () => {
    const vm = createEmployeeViewModel({ displayName: 'Jane' });
    render(<EmployeeCard employee={vm} />);
    
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });
  
  it('should call onHire when button clicked', () => {
    const onHire = vi.fn();
    render(<EmployeeCard employee={vm} onHire={onHire} />);
    
    fireEvent.click(screen.getByText('Hire'));
    expect(onHire).toHaveBeenCalled();
  });
});
```
