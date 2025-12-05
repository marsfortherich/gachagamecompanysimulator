/**
 * Represents in-game currency and real money
 */
export interface Currency {
  readonly gems: number;      // Premium currency (bought with real money)
  readonly gold: number;      // Soft currency (earned in-game)
  readonly tickets: number;   // Gacha pull tickets
}

/**
 * Creates a new Currency with default values
 */
export function createCurrency(partial?: Partial<Currency>): Currency {
  return {
    gems: partial?.gems ?? 0,
    gold: partial?.gold ?? 0,
    tickets: partial?.tickets ?? 0,
  };
}

/**
 * Adds two currencies together
 */
export function addCurrency(a: Currency, b: Currency): Currency {
  return {
    gems: a.gems + b.gems,
    gold: a.gold + b.gold,
    tickets: a.tickets + b.tickets,
  };
}

/**
 * Subtracts currency b from a (returns null if insufficient)
 */
export function subtractCurrency(a: Currency, b: Currency): Currency | null {
  const result = {
    gems: a.gems - b.gems,
    gold: a.gold - b.gold,
    tickets: a.tickets - b.tickets,
  };
  
  if (result.gems < 0 || result.gold < 0 || result.tickets < 0) {
    return null;
  }
  
  return result;
}

/**
 * Checks if currency a has at least as much as currency b
 */
export function hasSufficientCurrency(a: Currency, b: Currency): boolean {
  return a.gems >= b.gems && a.gold >= b.gold && a.tickets >= b.tickets;
}
