import { describe, it, expect } from 'vitest';
import {
  createCurrency,
  addCurrency,
  subtractCurrency,
  hasSufficientCurrency,
} from '../../domain/shared';

describe('Currency', () => {
  describe('createCurrency', () => {
    it('should create currency with default values', () => {
      const currency = createCurrency();
      expect(currency.gems).toBe(0);
      expect(currency.gold).toBe(0);
      expect(currency.tickets).toBe(0);
    });

    it('should create currency with partial values', () => {
      const currency = createCurrency({ gems: 1000 });
      expect(currency.gems).toBe(1000);
      expect(currency.gold).toBe(0);
      expect(currency.tickets).toBe(0);
    });
  });

  describe('addCurrency', () => {
    it('should add two currencies', () => {
      const a = createCurrency({ gems: 100, gold: 500 });
      const b = createCurrency({ gems: 50, gold: 200, tickets: 5 });
      const result = addCurrency(a, b);
      
      expect(result.gems).toBe(150);
      expect(result.gold).toBe(700);
      expect(result.tickets).toBe(5);
    });
  });

  describe('subtractCurrency', () => {
    it('should subtract currency when sufficient', () => {
      const a = createCurrency({ gems: 100, gold: 500 });
      const b = createCurrency({ gems: 30, gold: 200 });
      const result = subtractCurrency(a, b);
      
      expect(result).not.toBeNull();
      expect(result?.gems).toBe(70);
      expect(result?.gold).toBe(300);
    });

    it('should return null when insufficient', () => {
      const a = createCurrency({ gems: 100 });
      const b = createCurrency({ gems: 150 });
      const result = subtractCurrency(a, b);
      
      expect(result).toBeNull();
    });
  });

  describe('hasSufficientCurrency', () => {
    it('should return true when sufficient', () => {
      const a = createCurrency({ gems: 100, gold: 500, tickets: 10 });
      const b = createCurrency({ gems: 50, gold: 200, tickets: 5 });
      
      expect(hasSufficientCurrency(a, b)).toBe(true);
    });

    it('should return false when any currency is insufficient', () => {
      const a = createCurrency({ gems: 100, gold: 100 });
      const b = createCurrency({ gems: 50, gold: 200 });
      
      expect(hasSufficientCurrency(a, b)).toBe(false);
    });

    it('should return true for exact amounts', () => {
      const a = createCurrency({ gems: 100 });
      const b = createCurrency({ gems: 100 });
      
      expect(hasSufficientCurrency(a, b)).toBe(true);
    });
  });
});
