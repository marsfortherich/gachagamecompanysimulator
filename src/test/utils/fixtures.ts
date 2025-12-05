/**
 * Test Utilities - Fixtures
 * 
 * Pre-configured test data for common scenarios.
 * Use these for quick test setup when you don't need customization.
 */

import { Company } from '@domain/company';
import { Employee } from '@domain/employee';
import { Game } from '@domain/game';
import { GachaBanner, GachaItem } from '@domain/gacha';
import { 
  CompanyBuilder, 
  EmployeeBuilder, 
  GameBuilder, 
  BannerBuilder,
  GachaItemBuilder,
  createItemPool,
} from './builders';

// ============================================================================
// Company Fixtures
// ============================================================================

/**
 * Default company with standard starting resources
 */
export const defaultCompany: Company = new CompanyBuilder().build();

/**
 * A startup company with minimal resources
 */
export const startupCompany: Company = new CompanyBuilder()
  .asStartup()
  .withName('Indie Dreams')
  .build();

/**
 * A well-funded established company
 */
export const establishedCompany: Company = new CompanyBuilder()
  .asEstablished()
  .withName('Big Games Corp')
  .build();

/**
 * A company on the brink of bankruptcy
 */
export const bankruptCompany: Company = new CompanyBuilder()
  .asBankrupt()
  .withName('Failed Studios')
  .build();

/**
 * A company with high reputation
 */
export const reputableCompany: Company = new CompanyBuilder()
  .withReputation(90)
  .withName('Trusted Games')
  .build();

/**
 * A company with damaged reputation
 */
export const disreputableCompany: Company = new CompanyBuilder()
  .withReputation(15)
  .withName('Shady Games Inc')
  .build();

// ============================================================================
// Employee Fixtures
// ============================================================================

/**
 * A standard programmer
 */
export const defaultEmployee: Employee = new EmployeeBuilder().build();

/**
 * A junior developer
 */
export const juniorDeveloper: Employee = new EmployeeBuilder()
  .asJunior()
  .withName('Alex Junior')
  .withRole('Programmer')
  .build();

/**
 * A senior developer
 */
export const seniorDeveloper: Employee = new EmployeeBuilder()
  .asSenior()
  .withName('Sam Senior')
  .withRole('Programmer')
  .build();

/**
 * An experienced artist
 */
export const experiencedArtist: Employee = new EmployeeBuilder()
  .withName('Maya Artist')
  .withRole('Artist')
  .withExperience(7)
  .withSkills({ art: 85, game_design: 50 })
  .build();

/**
 * A skilled game designer
 */
export const gameDesigner: Employee = new EmployeeBuilder()
  .withName('Dan Designer')
  .withRole('Designer')
  .withExperience(5)
  .withSkills({ game_design: 80, writing: 60 })
  .build();

/**
 * A marketing specialist
 */
export const marketer: Employee = new EmployeeBuilder()
  .withName('Mark Marketer')
  .withRole('Marketer')
  .withSkills({ marketing: 75 })
  .build();

/**
 * A demoralized employee
 */
export const demoralizedEmployee: Employee = new EmployeeBuilder()
  .asDemoralized()
  .withName('Unhappy Worker')
  .build();

/**
 * A highly motivated employee
 */
export const motivatedEmployee: Employee = new EmployeeBuilder()
  .asMotivated()
  .withName('Happy Worker')
  .build();

/**
 * A team of 5 diverse employees
 */
export const smallTeam: Employee[] = [
  new EmployeeBuilder().withRole('Programmer').withName('Prog 1').build(),
  new EmployeeBuilder().withRole('Artist').withName('Artist 1').build(),
  new EmployeeBuilder().withRole('Designer').withName('Designer 1').build(),
  new EmployeeBuilder().withRole('Marketer').withName('Marketer 1').build(),
  new EmployeeBuilder().withRole('Producer').withName('Producer 1').build(),
];

// ============================================================================
// Game Fixtures
// ============================================================================

/**
 * A game in development
 */
export const defaultGame: Game = new GameBuilder().build();

/**
 * An RPG in early development
 */
export const earlyRPG: Game = new GameBuilder()
  .withName('Epic Quest')
  .withGenre('rpg')
  .asEarlyDevelopment()
  .build();

/**
 * A puzzle game ready for launch
 */
export const readyPuzzleGame: Game = new GameBuilder()
  .withName('Brain Teaser')
  .withGenre('puzzle')
  .asReadyForLaunch()
  .build();

/**
 * A successful live game
 */
export const successfulGame: Game = new GameBuilder()
  .withName('Mega Gacha')
  .withGenre('rpg')
  .asLive()
  .withDailyActiveUsers(100000)
  .withMonthlyRevenue(500000)
  .withPlayerSatisfaction(85)
  .build();

/**
 * A struggling live game
 */
export const strugglingGame: Game = new GameBuilder()
  .withName('Forgotten Lands')
  .asStruggling()
  .build();

/**
 * An idle game
 */
export const idleGame: Game = new GameBuilder()
  .withName('Idle Empire')
  .withGenre('idle')
  .asLive()
  .build();

// ============================================================================
// Gacha Fixtures
// ============================================================================

/**
 * Standard item pool with typical distribution
 */
export const standardItemPool = createItemPool({
  legendary: 3,
  epic: 8,
  rare: 15,
  uncommon: 24,
  common: 30,
});

/**
 * A standard gacha banner
 */
export const defaultBanner: GachaBanner = new BannerBuilder()
  .withItemPool(standardItemPool.itemIds)
  .build();

/**
 * A generous banner with good rates
 */
export const generousBanner: GachaBanner = new BannerBuilder()
  .asGenerous()
  .withName('Celebration Banner')
  .withItemPool(standardItemPool.itemIds)
  .build();

/**
 * A predatory banner with low rates
 */
export const predatoryBanner: GachaBanner = new BannerBuilder()
  .asPredatory()
  .withName('Whale Bait')
  .withItemPool(standardItemPool.itemIds)
  .build();

/**
 * A limited-time banner
 */
export const limitedBanner: GachaBanner = new BannerBuilder()
  .asLimited()
  .withName('Limited Event')
  .withDuration(7) // 1 week
  .withItemPool(standardItemPool.itemIds)
  .build();

/**
 * A legendary character item
 */
export const legendaryCharacter: GachaItem = new GachaItemBuilder()
  .asLegendary()
  .withName('Ultimate Hero')
  .withDescription('The strongest hero in the game')
  .build();

/**
 * A common weapon
 */
export const commonWeapon: GachaItem = new GachaItemBuilder()
  .asCommonWeapon()
  .withName('Basic Sword')
  .build();

// ============================================================================
// Scenario Fixtures
// ============================================================================

/**
 * Complete setup for a new game studio
 */
export function createNewStudioScenario() {
  const company = new CompanyBuilder()
    .asStartup()
    .withName('New Studio')
    .build();
  
  const employees = [
    new EmployeeBuilder().asJunior().withRole('Programmer').build(),
    new EmployeeBuilder().asJunior().withRole('Artist').build(),
  ];

  return { company, employees };
}

/**
 * Complete setup for a live game scenario
 */
export function createLiveGameScenario() {
  const company = new CompanyBuilder()
    .asEstablished()
    .build();
  
  const game = new GameBuilder()
    .asLive()
    .withDailyActiveUsers(50000)
    .build();
  
  const { items, itemMap, itemIds } = createItemPool({
    legendary: 5,
    epic: 10,
    rare: 20,
    uncommon: 30,
    common: 40,
  });

  const banner = new BannerBuilder()
    .withGameId(game.id)
    .withItemPool(itemIds)
    .withFeaturedItems([items[0].id]) // First legendary as featured
    .build();

  return { company, game, items, itemMap, banner };
}

/**
 * Complete setup for testing gacha pity system
 */
export function createPityTestScenario(pityCounter = 90) {
  const { items, itemMap, itemIds } = createItemPool({
    legendary: 3,
    epic: 5,
    rare: 10,
    uncommon: 15,
    common: 20,
  });

  const legendaryItems = items.filter(i => i.rarity === 'legendary');
  
  const banner = new BannerBuilder()
    .withPityCounter(pityCounter)
    .withItemPool(itemIds)
    .withFeaturedItems([legendaryItems[0].id])
    .build();

  return { items, itemMap, itemIds, banner, legendaryItems };
}
