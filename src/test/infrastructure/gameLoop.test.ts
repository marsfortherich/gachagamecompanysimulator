import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GameLoop,
  DeterministicTimeProvider,
} from '../../infrastructure/gameLoop/GameLoop';

describe('GameLoop', () => {
  describe('DeterministicTimeProvider', () => {
    it('should start at time 0', () => {
      const provider = new DeterministicTimeProvider();
      expect(provider.now()).toBe(0);
    });

    it('should advance time manually', () => {
      const provider = new DeterministicTimeProvider();
      provider.advanceTime(1000);
      expect(provider.now()).toBe(1000);
      
      provider.advanceTime(500);
      expect(provider.now()).toBe(1500);
    });

    it('should trigger frame callbacks when advancing', () => {
      const provider = new DeterministicTimeProvider();
      const callback = vi.fn();
      
      provider.requestFrame(callback);
      expect(callback).not.toHaveBeenCalled();
      
      provider.advanceTime(16);
      expect(callback).toHaveBeenCalledWith(16);
    });

    it('should reset correctly', () => {
      const provider = new DeterministicTimeProvider();
      provider.advanceTime(1000);
      provider.reset();
      
      expect(provider.now()).toBe(0);
    });
  });

  describe('GameLoop with DeterministicTimeProvider', () => {
    let timeProvider: DeterministicTimeProvider;
    let gameLoop: GameLoop;
    
    beforeEach(() => {
      timeProvider = new DeterministicTimeProvider();
      gameLoop = new GameLoop(timeProvider);
    });

    afterEach(() => {
      gameLoop.stop();
    });

    it('should start and track running state', () => {
      const onTick = vi.fn();
      
      expect(gameLoop.getIsRunning()).toBe(false);
      gameLoop.start({ onTick });
      expect(gameLoop.getIsRunning()).toBe(true);
    });

    it('should process ticks based on time', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      // Default is 1 tick per second (1000ms)
      timeProvider.advanceTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);
      
      timeProvider.advanceTime(2000);
      expect(onTick).toHaveBeenCalledTimes(3);
    });

    it('should track current tick count', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      expect(gameLoop.getCurrentTick()).toBe(0);
      
      timeProvider.advanceTime(1000);
      expect(gameLoop.getCurrentTick()).toBe(1);
      
      timeProvider.advanceTime(3000);
      expect(gameLoop.getCurrentTick()).toBe(4);
    });

    it('should support manual tick for testing', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      gameLoop.manualTick();
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(gameLoop.getCurrentTick()).toBe(1);
    });

    it('should pause and resume', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      timeProvider.advanceTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);
      
      gameLoop.pause();
      expect(gameLoop.getIsRunning()).toBe(false);
      
      timeProvider.advanceTime(2000);
      expect(onTick).toHaveBeenCalledTimes(1); // Still 1, paused
      
      gameLoop.resume();
      timeProvider.advanceTime(1000);
      expect(onTick).toHaveBeenCalledTimes(2);
    });

    it('should apply speed multiplier', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      gameLoop.setSpeed('fast');
      timeProvider.advanceTime(500); // Half second at 2x speed = 1 tick
      
      expect(onTick).toHaveBeenCalled();
    });
  });

  describe('Event Scheduling', () => {
    let timeProvider: DeterministicTimeProvider;
    let gameLoop: GameLoop;
    
    beforeEach(() => {
      timeProvider = new DeterministicTimeProvider();
      gameLoop = new GameLoop(timeProvider);
    });

    afterEach(() => {
      gameLoop.stop();
    });

    it('should schedule and trigger events', () => {
      const onTick = vi.fn();
      const eventCallback = vi.fn();
      
      gameLoop.start({ onTick });
      gameLoop.scheduleEvent('test-event', 3, eventCallback);
      
      gameLoop.manualTick(); // Tick 1
      expect(eventCallback).not.toHaveBeenCalled();
      
      gameLoop.manualTick(); // Tick 2
      expect(eventCallback).not.toHaveBeenCalled();
      
      gameLoop.manualTick(); // Tick 3
      expect(eventCallback).toHaveBeenCalledTimes(1);
      
      gameLoop.manualTick(); // Tick 4
      expect(eventCallback).toHaveBeenCalledTimes(1); // Only once
    });

    it('should support recurring events', () => {
      const onTick = vi.fn();
      const eventCallback = vi.fn();
      
      gameLoop.start({ onTick });
      gameLoop.scheduleEvent('recurring', 2, eventCallback, true, 2);
      
      gameLoop.manualTick(); // Tick 1
      expect(eventCallback).not.toHaveBeenCalled();
      
      gameLoop.manualTick(); // Tick 2
      expect(eventCallback).toHaveBeenCalledTimes(1);
      
      gameLoop.manualTick(); // Tick 3
      gameLoop.manualTick(); // Tick 4
      expect(eventCallback).toHaveBeenCalledTimes(2);
    });

    it('should cancel scheduled events', () => {
      const onTick = vi.fn();
      const eventCallback = vi.fn();
      
      gameLoop.start({ onTick });
      gameLoop.scheduleEvent('cancelable', 2, eventCallback);
      
      gameLoop.manualTick(); // Tick 1
      gameLoop.cancelEvent('cancelable');
      
      gameLoop.manualTick(); // Tick 2
      gameLoop.manualTick(); // Tick 3
      
      expect(eventCallback).not.toHaveBeenCalled();
    });

    it('should set and restore tick count', () => {
      const onTick = vi.fn();
      gameLoop.start({ onTick });
      
      gameLoop.setCurrentTick(100);
      expect(gameLoop.getCurrentTick()).toBe(100);
      
      gameLoop.manualTick();
      expect(gameLoop.getCurrentTick()).toBe(101);
    });
  });
});
