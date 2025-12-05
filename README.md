# Gacha Game Company Simulator

A web-based simulation game where you run your own gacha game development company. Build games, design gacha systems, hire employees, and grow your gaming empire!

## 🎮 Features

- **Company Management**: Found and manage your game development company
- **Game Development**: Create games across multiple genres (RPG, Action, Card, etc.)
- **Employee System**: Hire and manage developers, artists, designers, and more
- **Gacha System Design**: Configure gacha rates and banners for your games
- **Economy Simulation**: Manage finances, revenue, and player engagement

## 🏗️ Architecture

This project follows **Clean Architecture** principles with a modular, layered structure:

```
src/
├── domain/          # Core business logic (entities, value objects)
│   ├── company/     # Company entity and operations
│   ├── employee/    # Employee skills, management
│   ├── game/        # Game development, quality metrics
│   ├── gacha/       # Gacha system, banners, pulls
│   └── shared/      # Common types, utilities
├── application/     # Use cases and state management
│   ├── actions/     # Redux-like action creators
│   ├── reducers/    # State reducers
│   └── state/       # Game state definitions
├── infrastructure/  # External concerns
│   ├── storage/     # LocalStorage persistence
│   └── gameLoop/    # Game tick management
└── presentation/    # React UI components
    ├── components/  # UI components
    ├── context/     # React context providers
    └── hooks/       # Custom React hooks
```

### Design Principles

- **SOLID**: Single responsibility, dependency injection
- **Immutability**: All state changes produce new objects
- **Separation of Concerns**: Logic isolated from UI
- **Test-Driven**: Comprehensive unit tests for domain logic

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🧪 Testing

The project uses **Vitest** for unit testing with React Testing Library for component tests.

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

## 🎯 Game Mechanics

### Company

- **Funds**: Money used to hire employees and develop games
- **Reputation**: Affects player acquisition and employee hiring pool

### Employees

- **Skills**: Programming, Art, Game Design, Marketing, Management, Sound, Writing
- **Morale**: Affects work effectiveness
- **Salary**: Monthly cost to maintain

### Games

- **Development Progress**: 0-100% completion
- **Quality Metrics**: Graphics, Gameplay, Story, Sound, Polish
- **Status**: Planning → Development → Testing → Live

### Gacha System

- **Rarities**: Common, Uncommon, Rare, Epic, Legendary
- **Rates**: Configurable pull rates (must sum to 100%)
- **Pity System**: Guaranteed after X pulls
- **Banners**: Limited-time events with rate-ups

## 🛠️ Tech Stack

- **TypeScript**: Type-safe development
- **React**: UI library
- **Vite**: Build tool with production optimization
- **Tailwind CSS**: Responsive styling
- **Vitest**: Unit testing (700+ tests)
- **PWA**: Progressive Web App support

## 🚀 Deployment

The project supports multiple deployment targets:

- **GitHub Pages**: Automated via GitHub Actions
- **Netlify**: Zero-config deployment
- **Vercel**: Optimized for React apps

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - Clean Architecture design
- [Deployment Guide](docs/DEPLOYMENT.md) - Build and deploy instructions
- [Glossary](docs/GLOSSARY.md) - Domain terminology
- [How-To Guides](docs/HOWTO.md) - Step-by-step tutorials
- [Modding Guide](docs/MODDING.md) - Create custom content packs

## 🎨 Modding Support

Create custom content packs to extend the game:

- Add new events and storylines
- Define custom items and equipment
- Adjust game balance
- Add translations

See [docs/MODDING.md](docs/MODDING.md) for the complete modding guide.

## 📱 Responsive Design

The app is designed to work on both desktop and mobile devices:

- Desktop: Full sidebar navigation, detailed views
- Mobile: Bottom navigation, touch-optimized UI

## 📜 License

MIT License
