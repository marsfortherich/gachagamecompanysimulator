/**
 * Test Utilities - Builders
 * 
 * Fluent builders for creating test entities with sensible defaults.
 * Use these to create test data in a readable, maintainable way.
 */

import { 
  Company, 
  OfficeLevel, 
} from '@domain/company';
import { 
  Employee, 
  EmployeeRole, 
  SkillSet, 
  createEmployee,
  CreateEmployeeParams,
} from '@domain/employee';
import { 
  Game, 
  GameGenre, 
  GameStatus, 
  GameQuality, 
  GameMonetization,
  GachaRates,
  createDefaultGachaRates,
  createDefaultQuality,
  createDefaultMonetization,
} from '@domain/game';
import { 
  GachaBanner, 
  GachaItem, 
  Rarity, 
  ItemType,
  createGachaBanner,
  createGachaItem,
  PullCost,
} from '@domain/gacha';
import { generateId } from '@domain/shared';

/**
 * Builder for Company entities
 */
export class CompanyBuilder {
  private _name = 'Test Studios';
  private _funds = 100000;
  private _reputation = 50;
  private _foundedDate = 0;
  private _headquarters = 'Tokyo';
  private _officeLevel: OfficeLevel = 1;
  private _researchPoints = 0;
  private _employeeIds: string[] = [];
  private _employees: Employee[] = [];
  private _monthlyExpenses = 1000;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withFunds(funds: number): this {
    this._funds = funds;
    return this;
  }

  withBudget(budget: number): this {
    return this.withFunds(budget);
  }

  withReputation(reputation: number): this {
    this._reputation = reputation;
    return this;
  }

  withFoundedDate(date: number): this {
    this._foundedDate = date;
    return this;
  }

  withHeadquarters(hq: string): this {
    this._headquarters = hq;
    return this;
  }

  withOfficeLevel(level: OfficeLevel): this {
    this._officeLevel = level;
    return this;
  }

  withResearchPoints(points: number): this {
    this._researchPoints = points;
    return this;
  }

  withEmployeeIds(ids: string[]): this {
    this._employeeIds = ids;
    return this;
  }

  withEmployee(employee: Employee): this {
    this._employees.push(employee);
    this._employeeIds.push(employee.id);
    return this;
  }

  withEmployees(employees: Employee[]): this {
    for (const emp of employees) {
      this.withEmployee(emp);
    }
    return this;
  }

  withMonthlyExpenses(expenses: number): this {
    this._monthlyExpenses = expenses;
    return this;
  }

  /**
   * Preset: A startup with minimal resources
   */
  asStartup(): this {
    return this
      .withFunds(50000)
      .withOfficeLevel(1)
      .withReputation(30);
  }

  /**
   * Preset: A large established company
   */
  asEstablished(): this {
    return this
      .withFunds(1000000)
      .withOfficeLevel(4)
      .withReputation(75);
  }

  /**
   * Preset: A bankrupt company
   */
  asBankrupt(): this {
    return this
      .withFunds(0)
      .withReputation(10);
  }

  build(): Company {
    return {
      id: generateId(),
      name: this._name,
      funds: this._funds,
      reputation: this._reputation,
      foundedDate: this._foundedDate,
      headquarters: this._headquarters,
      officeLevel: this._officeLevel,
      researchPoints: this._researchPoints,
      employeeIds: this._employeeIds,
      monthlyExpenses: this._monthlyExpenses,
    };
  }

  /**
   * Returns both the company and any employees added
   */
  buildWithEmployees(): { company: Company; employees: Employee[] } {
    return {
      company: this.build(),
      employees: this._employees,
    };
  }
}

/**
 * Builder for Employee entities
 */
export class EmployeeBuilder {
  private _name = 'Test Employee';
  private _role: EmployeeRole = 'Programmer';
  private _skills: Partial<SkillSet> = {};
  private _salary = 5000;
  private _morale = 80;
  private _experience = 3;
  private _hiredDate = 0;
  private _isAvailable = true;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withRole(role: EmployeeRole): this {
    this._role = role;
    return this;
  }

  withSkills(skills: Partial<SkillSet>): this {
    this._skills = { ...this._skills, ...skills };
    return this;
  }

  withSkillLevel(skill: keyof SkillSet, level: number): this {
    this._skills[skill] = level;
    return this;
  }

  withSalary(salary: number): this {
    this._salary = salary;
    return this;
  }

  withMorale(morale: number): this {
    this._morale = morale;
    return this;
  }

  withExperience(years: number): this {
    this._experience = years;
    return this;
  }

  withHiredDate(date: number): this {
    this._hiredDate = date;
    return this;
  }

  asAvailable(): this {
    this._isAvailable = true;
    return this;
  }

  asAssigned(): this {
    this._isAvailable = false;
    return this;
  }

  /**
   * Preset: A junior developer
   */
  asJunior(): this {
    return this
      .withExperience(1)
      .withSalary(3000)
      .withSkills({ programming: 40, art: 20, game_design: 30 });
  }

  /**
   * Preset: A senior developer
   */
  asSenior(): this {
    return this
      .withExperience(10)
      .withSalary(12000)
      .withSkills({ programming: 85, art: 40, game_design: 70 });
  }

  /**
   * Preset: A demoralized employee
   */
  asDemoralized(): this {
    return this.withMorale(20);
  }

  /**
   * Preset: A highly motivated employee
   */
  asMotivated(): this {
    return this.withMorale(95);
  }

  build(): Employee {
    const params: CreateEmployeeParams = {
      name: this._name,
      role: this._role,
      experience: this._experience,
      hiredDate: this._hiredDate,
      skills: this._skills,
      salary: this._salary,
    };
    
    const employee = createEmployee(params);
    
    // Override with any custom values
    return {
      ...employee,
      salary: this._salary,
      morale: this._morale,
      isAvailable: this._isAvailable,
      skills: {
        ...employee.skills,
        ...this._skills,
      },
    };
  }
}

/**
 * Builder for Game entities
 */
export class GameBuilder {
  private _name = 'Test Game';
  private _genre: GameGenre = 'rpg';
  private _status: GameStatus = 'development';
  private _quality: Partial<GameQuality> = {};
  private _monetization: Partial<GameMonetization> = {};
  private _developmentProgress = 0;
  private _startDate = 0;
  private _launchDate: number | null = null;
  private _assignedEmployees: string[] = [];

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withGenre(genre: GameGenre): this {
    this._genre = genre;
    return this;
  }

  withStatus(status: GameStatus): this {
    this._status = status;
    return this;
  }

  withQuality(quality: Partial<GameQuality>): this {
    this._quality = { ...this._quality, ...quality };
    return this;
  }

  withMonetization(monetization: Partial<GameMonetization>): this {
    this._monetization = { ...this._monetization, ...monetization };
    return this;
  }

  withGachaRates(rates: GachaRates): this {
    this._monetization = { ...this._monetization, gachaRates: rates };
    return this;
  }

  withDailyActiveUsers(dau: number): this {
    this._monetization = { ...this._monetization, dailyActiveUsers: dau };
    return this;
  }

  withMonthlyRevenue(revenue: number): this {
    this._monetization = { ...this._monetization, monthlyRevenue: revenue };
    return this;
  }

  withPlayerSatisfaction(satisfaction: number): this {
    this._monetization = { ...this._monetization, playerSatisfaction: satisfaction };
    return this;
  }

  withProgress(progress: number): this {
    this._developmentProgress = progress;
    return this;
  }

  withStartDate(date: number): this {
    this._startDate = date;
    return this;
  }

  withLaunchDate(date: number): this {
    this._launchDate = date;
    return this;
  }

  withAssignedEmployees(employeeIds: string[]): this {
    this._assignedEmployees = employeeIds;
    return this;
  }

  /**
   * Preset: A game in early development
   */
  asEarlyDevelopment(): this {
    return this
      .withStatus('development')
      .withProgress(20);
  }

  /**
   * Preset: A game ready for launch
   */
  asReadyForLaunch(): this {
    return this
      .withStatus('testing')
      .withProgress(100)
      .withQuality({ graphics: 70, gameplay: 75, story: 60, sound: 65, polish: 70 });
  }

  /**
   * Preset: A live game with active players
   */
  asLive(): this {
    return this
      .withStatus('live')
      .withProgress(100)
      .withDailyActiveUsers(50000)
      .withMonthlyRevenue(100000)
      .withPlayerSatisfaction(70);
  }

  /**
   * Preset: A struggling game
   */
  asStruggling(): this {
    return this
      .withStatus('live')
      .withDailyActiveUsers(1000)
      .withMonthlyRevenue(5000)
      .withPlayerSatisfaction(35);
  }

  build(): Game {
    return {
      id: generateId(),
      name: this._name,
      genre: this._genre,
      status: this._status,
      quality: {
        ...createDefaultQuality(),
        ...this._quality,
      },
      monetization: {
        ...createDefaultMonetization(),
        ...this._monetization,
      },
      developmentProgress: this._developmentProgress,
      startDate: this._startDate,
      launchDate: this._launchDate,
      assignedEmployees: this._assignedEmployees,
    };
  }
}

/**
 * Builder for GachaBanner entities
 */
export class BannerBuilder {
  private _name = 'Test Banner';
  private _gameId = 'game-1';
  private _featuredItems: string[] = [];
  private _itemPool: string[] = [];
  private _startDate = 0;
  private _duration = 14; // 2 weeks
  private _rates: GachaRates = createDefaultGachaRates();
  private _rateUpMultiplier = 2.0;
  private _pullCost: PullCost = { gems: 300, tickets: 1 };
  private _pityCounter = 90;
  private _isLimited = false;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withGameId(gameId: string): this {
    this._gameId = gameId;
    return this;
  }

  withFeaturedItems(itemIds: string[]): this {
    this._featuredItems = itemIds;
    return this;
  }

  withItemPool(itemIds: string[]): this {
    this._itemPool = itemIds;
    return this;
  }

  withStartDate(date: number): this {
    this._startDate = date;
    return this;
  }

  withDuration(duration: number): this {
    this._duration = duration;
    return this;
  }

  withRates(rates: GachaRates): this {
    this._rates = rates;
    return this;
  }

  withRateUpMultiplier(multiplier: number): this {
    this._rateUpMultiplier = multiplier;
    return this;
  }

  withPullCost(cost: PullCost): this {
    this._pullCost = cost;
    return this;
  }

  withPityCounter(pity: number): this {
    this._pityCounter = pity;
    return this;
  }

  asLimited(): this {
    this._isLimited = true;
    return this;
  }

  asStandard(): this {
    this._isLimited = false;
    return this;
  }

  /**
   * Preset: A generous banner with high rates
   */
  asGenerous(): this {
    return this
      .withRates({
        common: 0.50,
        uncommon: 0.25,
        rare: 0.15,
        epic: 0.07,
        legendary: 0.03,
      })
      .withPityCounter(50);
  }

  /**
   * Preset: A predatory banner with low rates
   */
  asPredatory(): this {
    return this
      .withRates({
        common: 0.75,
        uncommon: 0.15,
        rare: 0.07,
        epic: 0.025,
        legendary: 0.005,
      })
      .withPityCounter(200);
  }

  build(): GachaBanner {
    return createGachaBanner({
      name: this._name,
      gameId: this._gameId,
      featuredItems: this._featuredItems,
      itemPool: this._itemPool,
      startDate: this._startDate,
      duration: this._duration,
      rates: this._rates,
      rateUpMultiplier: this._rateUpMultiplier,
      pullCost: this._pullCost,
      pityCounter: this._pityCounter,
      isLimited: this._isLimited,
    });
  }
}

/**
 * Builder for GachaItem entities
 */
export class GachaItemBuilder {
  private _name = 'Test Item';
  private _rarity: Rarity = 'rare';
  private _type: ItemType = 'character';
  private _description = 'A test item';
  private _artCost?: number;
  private _designCost?: number;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withRarity(rarity: Rarity): this {
    this._rarity = rarity;
    return this;
  }

  withType(type: ItemType): this {
    this._type = type;
    return this;
  }

  withDescription(desc: string): this {
    this._description = desc;
    return this;
  }

  withArtCost(cost: number): this {
    this._artCost = cost;
    return this;
  }

  withDesignCost(cost: number): this {
    this._designCost = cost;
    return this;
  }

  /**
   * Preset: A legendary character
   */
  asLegendary(): this {
    return this
      .withRarity('legendary')
      .withType('character');
  }

  /**
   * Preset: A common weapon
   */
  asCommonWeapon(): this {
    return this
      .withRarity('common')
      .withType('weapon');
  }

  build(): GachaItem {
    return createGachaItem({
      name: this._name,
      rarity: this._rarity,
      type: this._type,
      description: this._description,
      artCost: this._artCost,
      designCost: this._designCost,
    });
  }
}

/**
 * Helper to create multiple items at once
 */
export function createItemPool(config: {
  legendary?: number;
  epic?: number;
  rare?: number;
  uncommon?: number;
  common?: number;
}): { items: GachaItem[]; itemMap: Map<string, GachaItem>; itemIds: string[] } {
  const items: GachaItem[] = [];
  
  const addItems = (rarity: Rarity, count: number) => {
    for (let i = 0; i < count; i++) {
      items.push(
        new GachaItemBuilder()
          .withName(`${rarity}_item_${i + 1}`)
          .withRarity(rarity)
          .build()
      );
    }
  };

  addItems('legendary', config.legendary ?? 2);
  addItems('epic', config.epic ?? 5);
  addItems('rare', config.rare ?? 10);
  addItems('uncommon', config.uncommon ?? 15);
  addItems('common', config.common ?? 20);

  const itemMap = new Map(items.map(item => [item.id, item]));
  const itemIds = items.map(item => item.id);

  return { items, itemMap, itemIds };
}
