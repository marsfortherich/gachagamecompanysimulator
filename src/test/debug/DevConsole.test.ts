/**
 * Developer Console Tests - Prompt 10.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CommandRegistry,
  CommandDefinition,
  CommandContext,
  createGameCommands,
  getCommandRegistry,
  resetCommandRegistry,
} from '../../infrastructure/debug/CommandRegistry';
import {
  DevConsole,
  isDevConsoleAvailable,
} from '../../infrastructure/debug/DevConsole';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockContext(state: Record<string, unknown> = {}): CommandContext {
  return {
    getState: () => state,
    dispatch: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

// =============================================================================
// Command Registry Tests
// =============================================================================

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('command registration', () => {
    it('should register a command', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test command',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      expect(registry.has('test')).toBe(true);
    });

    it('should overwrite existing command', () => {
      const cmd1: CommandDefinition = {
        name: 'test',
        description: 'First',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'first' }),
      };

      const cmd2: CommandDefinition = {
        name: 'test',
        description: 'Second',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'second' }),
      };

      registry.register(cmd1);
      registry.register(cmd2);

      const context = createMockContext();
      const result = registry.execute('test', context);
      expect(result.message).toBe('second');
    });

    it('should unregister a command', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      expect(registry.has('test')).toBe(true);

      registry.unregister('test');
      expect(registry.has('test')).toBe(false);
    });
  });

  describe('aliases', () => {
    it('should register and resolve aliases', () => {
      const cmd: CommandDefinition = {
        name: 'longcommand',
        description: 'Long command',
        usage: 'longcommand',
        arguments: [],
        execute: () => ({ success: true, message: 'executed' }),
      };

      registry.register(cmd);
      registry.registerAlias('lc', 'longcommand');

      expect(registry.has('lc')).toBe(true);
      expect(registry.getCommand('lc')?.name).toBe('longcommand');
    });

    it('should throw when aliasing non-existent command', () => {
      expect(() => registry.registerAlias('alias', 'nonexistent')).toThrow();
    });

    it('should remove aliases when command is unregistered', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      registry.registerAlias('t', 'test');
      registry.unregister('test');

      expect(registry.has('t')).toBe(false);
    });
  });

  describe('command parsing', () => {
    it('should parse simple command', () => {
      const cmd: CommandDefinition = {
        name: 'hello',
        description: 'Say hello',
        usage: 'hello',
        arguments: [],
        execute: () => ({ success: true, message: 'Hello!' }),
      };

      registry.register(cmd);
      const parsed = registry.parse('hello');
      expect(parsed?.name).toBe('hello');
    });

    it('should parse positional arguments', () => {
      const cmd: CommandDefinition = {
        name: 'add',
        description: 'Add money',
        usage: 'add <amount>',
        arguments: [
          { name: 'amount', type: 'number', required: true, description: 'Amount' },
        ],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const parsed = registry.parse('add 100');
      expect(parsed?.args.amount).toBe(100);
    });

    it('should parse named arguments', () => {
      const cmd: CommandDefinition = {
        name: 'set',
        description: 'Set value',
        usage: 'set --value <n>',
        arguments: [
          { name: 'value', type: 'number', required: true, description: 'Value' },
        ],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const parsed = registry.parse('set --value=50');
      expect(parsed?.args.value).toBe(50);
    });

    it('should parse quoted strings', () => {
      const cmd: CommandDefinition = {
        name: 'echo',
        description: 'Echo message',
        usage: 'echo <message>',
        arguments: [
          { name: 'message', type: 'string', required: true, description: 'Message' },
        ],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const parsed = registry.parse('echo "hello world"');
      expect(parsed?.args.message).toBe('hello world');
    });

    it('should apply default values', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test',
        usage: 'test [--verbose]',
        arguments: [
          { name: 'verbose', type: 'boolean', required: false, description: 'Verbose', default: false },
        ],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const parsed = registry.parse('test');
      expect(parsed?.args.verbose).toBe(false);
    });

    it('should return null for unknown command', () => {
      const parsed = registry.parse('unknown');
      expect(parsed).toBeNull();
    });
  });

  describe('command execution', () => {
    it('should execute command and return result', () => {
      const cmd: CommandDefinition = {
        name: 'greet',
        description: 'Greet',
        usage: 'greet <name>',
        arguments: [
          { name: 'name', type: 'string', required: true, description: 'Name' },
        ],
        execute: (args) => ({
          success: true,
          message: `Hello, ${args.name}!`,
        }),
      };

      registry.register(cmd);
      const context = createMockContext();
      const result = registry.execute('greet Alice', context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Hello, Alice!');
    });

    it('should fail for missing required argument', () => {
      const cmd: CommandDefinition = {
        name: 'add',
        description: 'Add',
        usage: 'add <amount>',
        arguments: [
          { name: 'amount', type: 'number', required: true, description: 'Amount' },
        ],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const context = createMockContext();
      const result = registry.execute('add', context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required argument');
    });

    it('should fail for unknown command', () => {
      const context = createMockContext();
      const result = registry.execute('nonexistent', context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('should handle execution errors', () => {
      const cmd: CommandDefinition = {
        name: 'error',
        description: 'Throws error',
        usage: 'error',
        arguments: [],
        execute: () => {
          throw new Error('Something went wrong');
        },
      };

      registry.register(cmd);
      const context = createMockContext();
      const result = registry.execute('error', context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Something went wrong');
    });
  });

  describe('command history', () => {
    it('should track command history', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const context = createMockContext();

      registry.execute('test', context);
      registry.execute('test', context);

      const history = registry.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should clear history', () => {
      const cmd: CommandDefinition = {
        name: 'test',
        description: 'Test',
        usage: 'test',
        arguments: [],
        execute: () => ({ success: true, message: 'ok' }),
      };

      registry.register(cmd);
      const context = createMockContext();

      registry.execute('test', context);
      expect(registry.getHistory()).toHaveLength(1);

      registry.clearHistory();
      expect(registry.getHistory()).toHaveLength(0);
    });
  });

  describe('built-in commands', () => {
    it('should have help command', () => {
      expect(registry.has('help')).toBe(true);

      const context = createMockContext();
      const result = registry.execute('help', context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available commands');
    });

    it('should show help for specific command', () => {
      const context = createMockContext();
      const result = registry.execute('help help', context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('help');
    });

    it('should have clear command', () => {
      expect(registry.has('clear')).toBe(true);

      const context = createMockContext();
      const result = registry.execute('clear', context);

      expect(result.success).toBe(true);
      expect((result.data as { action: string })?.action).toBe('clear');
    });

    it('should have history command', () => {
      expect(registry.has('history')).toBe(true);
    });
  });
});

// =============================================================================
// Game Commands Tests
// =============================================================================

describe('Game Commands', () => {
  let registry: CommandRegistry;
  let context: CommandContext;
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registry = new CommandRegistry();
    dispatch = vi.fn();
    context = {
      getState: () => ({
        company: {
          employees: [
            { name: 'Alice', role: 'Developer', salary: 80000, skill: 75 },
            { name: 'Bob', role: 'Designer', salary: 70000, skill: 80 },
          ],
        },
        sandbox: {
          flags: {
            infiniteMoney: false,
            instantDevelopment: true,
          },
        },
      }),
      dispatch: dispatch as (action: unknown) => void,
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Register game commands
    for (const cmd of createGameCommands()) {
      registry.register(cmd);
    }
  });

  describe('givemoney', () => {
    it('should dispatch add money action', () => {
      const result = registry.execute('givemoney 1000', context);

      expect(result.success).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DEBUG_ADD_MONEY',
        payload: 1000,
      });
    });

    it('should reject negative amount', () => {
      const result = registry.execute('givemoney -100', context);

      expect(result.success).toBe(false);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('simulatedays', () => {
    it('should dispatch simulate days action', () => {
      const result = registry.execute('simulatedays 7', context);

      expect(result.success).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DEBUG_SIMULATE_DAYS',
        payload: 7,
      });
    });

    it('should reject invalid day count', () => {
      const result = registry.execute('simulatedays 1000', context);
      expect(result.success).toBe(false);
    });
  });

  describe('triggerevent', () => {
    it('should dispatch trigger event action', () => {
      const result = registry.execute('triggerevent market_crash', context);

      expect(result.success).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DEBUG_TRIGGER_EVENT',
        payload: 'market_crash',
      });
    });
  });

  describe('listemployees', () => {
    it('should list employees', () => {
      const result = registry.execute('listemployees', context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Alice');
      expect(result.message).toContain('Bob');
    });

    it('should show verbose info with flag', () => {
      const result = registry.execute('listemployees --verbose', context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Salary');
      expect(result.message).toContain('Skill');
    });
  });

  describe('setreputation', () => {
    it('should dispatch set reputation action', () => {
      const result = registry.execute('setreputation 75', context);

      expect(result.success).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DEBUG_SET_REPUTATION',
        payload: 75,
      });
    });

    it('should reject out of range value', () => {
      const result = registry.execute('setreputation 150', context);
      expect(result.success).toBe(false);
    });
  });

  describe('toggleflag', () => {
    it('should dispatch toggle flag action', () => {
      const result = registry.execute('toggleflag infiniteMoney', context);

      expect(result.success).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_SANDBOX_FLAG',
        payload: 'infiniteMoney',
      });
    });
  });

  describe('listflags', () => {
    it('should list sandbox flags', () => {
      const result = registry.execute('listflags', context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('infiniteMoney');
      expect(result.message).toContain('instantDevelopment');
    });
  });
});

// =============================================================================
// DevConsole Tests
// =============================================================================

describe('DevConsole', () => {
  let console_: DevConsole;
  let context: CommandContext;

  beforeEach(() => {
    localStorage.clear();
    DevConsole.resetInstance();
    resetCommandRegistry();
    
    console_ = new DevConsole({ persistHistory: false });
    context = createMockContext();
  });

  afterEach(() => {
    console_.destroy();
    localStorage.clear();
    DevConsole.resetInstance();
    resetCommandRegistry();
  });

  describe('initialization', () => {
    it('should start closed', () => {
      expect(console_.isOpen()).toBe(false);
    });

    it('should initialize with context', () => {
      console_.initialize(context);
      expect(console_.isEnabled()).toBe(true);
    });
  });

  describe('visibility', () => {
    it('should toggle open/close', () => {
      console_.toggle();
      expect(console_.isOpen()).toBe(true);

      console_.toggle();
      expect(console_.isOpen()).toBe(false);
    });

    it('should open explicitly', () => {
      console_.open();
      expect(console_.isOpen()).toBe(true);
    });

    it('should close explicitly', () => {
      console_.open();
      console_.close();
      expect(console_.isOpen()).toBe(false);
    });
  });

  describe('command execution', () => {
    it('should execute commands', () => {
      console_.initialize(context);
      const result = console_.execute('help');

      expect(result.success).toBe(true);
    });

    it('should fail without initialization', () => {
      const result = console_.execute('help');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not initialized');
    });

    it('should add to output', () => {
      console_.initialize(context);
      console_.execute('help');

      const output = console_.getOutput();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('output management', () => {
    it('should log messages', () => {
      console_.log('info', 'Test message');
      const output = console_.getOutput();

      expect(output).toHaveLength(1);
      expect(output[0].type).toBe('info');
      expect(output[0].message).toBe('Test message');
    });

    it('should clear output', () => {
      console_.log('info', 'Message 1');
      console_.log('info', 'Message 2');
      expect(console_.getOutput()).toHaveLength(2);

      console_.clearOutput();
      expect(console_.getOutput()).toHaveLength(0);
    });

    it('should trim output when over limit', () => {
      const smallConsole = new DevConsole({ maxOutputLines: 5, persistHistory: false });
      
      for (let i = 0; i < 10; i++) {
        smallConsole.log('info', `Message ${i}`);
      }

      expect(smallConsole.getOutput()).toHaveLength(5);
      smallConsole.destroy();
    });
  });

  describe('input history', () => {
    it('should track input history', () => {
      console_.initialize(context);
      console_.execute('help');
      console_.execute('clear');

      const history = console_.getInputHistory();
      expect(history).toContain('help');
      expect(history).toContain('clear');
    });

    it('should navigate history up', () => {
      console_.initialize(context);
      console_.execute('first');
      console_.execute('second');
      console_.execute('third');

      expect(console_.historyUp()).toBe('third');
      expect(console_.historyUp()).toBe('second');
      expect(console_.historyUp()).toBe('first');
    });

    it('should navigate history down', () => {
      console_.initialize(context);
      console_.execute('first');
      console_.execute('second');

      console_.historyUp(); // second
      console_.historyUp(); // first
      expect(console_.historyDown()).toBe('second');
    });
  });

  describe('state subscriptions', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      console_.subscribe(listener);

      console_.toggle();
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = console_.subscribe(listener);

      unsubscribe();
      console_.toggle();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = DevConsole.getInstance();
      const instance2 = DevConsole.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});

// =============================================================================
// Global Registry Tests
// =============================================================================

describe('Global Command Registry', () => {
  beforeEach(() => {
    resetCommandRegistry();
  });

  afterEach(() => {
    resetCommandRegistry();
  });

  it('should return singleton', () => {
    const registry1 = getCommandRegistry();
    const registry2 = getCommandRegistry();
    expect(registry1).toBe(registry2);
  });

  it('should have game commands registered', () => {
    const registry = getCommandRegistry();
    expect(registry.has('givemoney')).toBe(true);
    expect(registry.has('simulatedays')).toBe(true);
    expect(registry.has('triggerevent')).toBe(true);
    expect(registry.has('listemployees')).toBe(true);
  });

  it('should have aliases registered', () => {
    const registry = getCommandRegistry();
    expect(registry.has('gm')).toBe(true); // givemoney
    expect(registry.has('sd')).toBe(true); // simulatedays
    expect(registry.has('?')).toBe(true);  // help
  });
});

// =============================================================================
// Availability Check Tests
// =============================================================================

describe('isDevConsoleAvailable', () => {
  it('should return true in non-production', () => {
    // In test environment, should be available
    expect(isDevConsoleAvailable()).toBe(true);
  });
});
