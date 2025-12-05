# Gacha Game Company Simulator

## Project Overview
A web-based simulation game where players run a gacha game development company. Built with TypeScript, React, and follows clean architecture principles.

## Architecture
- **Domain Layer**: Core business logic in `src/domain/`
- **Application Layer**: State management and use cases in `src/application/`
- **Infrastructure Layer**: External concerns in `src/infrastructure/`
- **Presentation Layer**: React components in `src/presentation/`

## Key Commands
- `npm run dev` - Start development server
- `npm test` - Run unit tests
- `npm run build` - Build for production

## Code Style Guidelines
- Use TypeScript strict mode
- Prefer immutable data structures
- Follow SOLID principles
- Write unit tests for domain logic
- Use path aliases (@domain, @application, @infrastructure, @presentation)

## Testing
- Domain and application logic should have comprehensive unit tests
- Use Vitest and React Testing Library
- Test files are located in `src/test/`
