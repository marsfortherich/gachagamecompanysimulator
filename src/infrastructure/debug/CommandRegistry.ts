/**
 * Command Registry - Prompt 10.2
 * 
 * Registry pattern for developer console commands.
 * Allows registering, parsing, and executing debug commands.
 */

// =============================================================================
// Types
// =============================================================================

export interface CommandArgument {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean';
  readonly required: boolean;
  readonly description: string;
  readonly default?: string | number | boolean;
}

export interface CommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly arguments: CommandArgument[];
  readonly execute: (args: Record<string, unknown>, context: CommandContext) => CommandResult;
}

export interface CommandContext {
  readonly getState: () => unknown;
  readonly dispatch: (action: unknown) => void;
  readonly log: (message: string) => void;
  readonly warn: (message: string) => void;
  readonly error: (message: string) => void;
}

export interface CommandResult {
  readonly success: boolean;
  readonly message: string;
  readonly data?: unknown;
}

export interface ParsedCommand {
  readonly name: string;
  readonly args: Record<string, unknown>;
  readonly raw: string;
}

// =============================================================================
// Command Registry
// =============================================================================

export class CommandRegistry {
  private commands: Map<string, CommandDefinition>;
  private aliases: Map<string, string>;
  private history: string[];
  private maxHistory: number;

  constructor(maxHistory = 100) {
    this.commands = new Map();
    this.aliases = new Map();
    this.history = [];
    this.maxHistory = maxHistory;

    // Register built-in commands
    this.registerBuiltInCommands();
  }

  // ===========================================================================
  // Command Registration
  // ===========================================================================

  /**
   * Register a new command
   */
  register(command: CommandDefinition): void {
    if (this.commands.has(command.name)) {
      console.warn(`Command '${command.name}' already registered, overwriting`);
    }
    this.commands.set(command.name, command);
  }

  /**
   * Register an alias for a command
   */
  registerAlias(alias: string, commandName: string): void {
    if (!this.commands.has(commandName)) {
      throw new Error(`Cannot create alias for unknown command '${commandName}'`);
    }
    this.aliases.set(alias, commandName);
  }

  /**
   * Unregister a command
   */
  unregister(name: string): boolean {
    // Remove any aliases pointing to this command
    for (const [alias, target] of this.aliases.entries()) {
      if (target === name) {
        this.aliases.delete(alias);
      }
    }
    return this.commands.delete(name);
  }

  /**
   * Check if a command exists
   */
  has(name: string): boolean {
    return this.commands.has(name) || this.aliases.has(name);
  }

  /**
   * Get all registered commands
   */
  getCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get command by name (resolves aliases)
   */
  getCommand(name: string): CommandDefinition | undefined {
    const actualName = this.aliases.get(name) ?? name;
    return this.commands.get(actualName);
  }

  // ===========================================================================
  // Command Parsing
  // ===========================================================================

  /**
   * Parse a command string into a ParsedCommand
   */
  parse(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Split by whitespace, respecting quoted strings
    const parts = this.tokenize(trimmed);
    if (parts.length === 0) return null;

    const name = parts[0].toLowerCase();
    const command = this.getCommand(name);
    
    if (!command) {
      return null;
    }

    // Parse arguments
    const args: Record<string, unknown> = {};
    const argParts = parts.slice(1);
    let argIndex = 0;

    for (let i = 0; i < argParts.length; i++) {
      const part = argParts[i];

      // Named argument (--name=value or --name value)
      if (part.startsWith('--')) {
        const eqIndex = part.indexOf('=');
        if (eqIndex !== -1) {
          const argName = part.slice(2, eqIndex);
          const argValue = part.slice(eqIndex + 1);
          const argDef = command.arguments.find(a => a.name === argName);
          args[argName] = this.coerceValue(argValue, argDef?.type ?? 'string');
        } else {
          const argName = part.slice(2);
          const argDef = command.arguments.find(a => a.name === argName);
          if (argDef?.type === 'boolean') {
            args[argName] = true;
          } else if (i + 1 < argParts.length) {
            args[argName] = this.coerceValue(argParts[++i], argDef?.type ?? 'string');
          }
        }
      } else {
        // Positional argument
        if (argIndex < command.arguments.length) {
          const argDef = command.arguments[argIndex];
          args[argDef.name] = this.coerceValue(part, argDef.type);
          argIndex++;
        }
      }
    }

    // Apply defaults for missing optional arguments
    for (const argDef of command.arguments) {
      if (args[argDef.name] === undefined && argDef.default !== undefined) {
        args[argDef.name] = argDef.default;
      }
    }

    return { name, args, raw: trimmed };
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const char of input) {
      if (inQuote) {
        if (char === quoteChar) {
          inQuote = false;
          tokens.push(current);
          current = '';
        } else {
          current += char;
        }
      } else {
        if (char === '"' || char === "'") {
          inQuote = true;
          quoteChar = char;
        } else if (char === ' ' || char === '\t') {
          if (current) {
            tokens.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  private coerceValue(value: string, type: 'string' | 'number' | 'boolean'): unknown {
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      default:
        return value;
    }
  }

  // ===========================================================================
  // Command Execution
  // ===========================================================================

  /**
   * Execute a command string
   */
  execute(input: string, context: CommandContext): CommandResult {
    // Add to history
    this.history.push(input);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Parse command
    const parsed = this.parse(input);
    if (!parsed) {
      return {
        success: false,
        message: `Unknown command: ${input.split(' ')[0]}. Type 'help' for available commands.`,
      };
    }

    const command = this.getCommand(parsed.name);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${parsed.name}`,
      };
    }

    // Validate required arguments
    for (const argDef of command.arguments) {
      if (argDef.required && parsed.args[argDef.name] === undefined) {
        return {
          success: false,
          message: `Missing required argument: ${argDef.name}\nUsage: ${command.usage}`,
        };
      }
    }

    // Execute
    try {
      return command.execute(parsed.args, context);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ===========================================================================
  // History
  // ===========================================================================

  /**
   * Get command history
   */
  getHistory(): readonly string[] {
    return [...this.history];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
  }

  // ===========================================================================
  // Built-in Commands
  // ===========================================================================

  private registerBuiltInCommands(): void {
    // Help command
    this.register({
      name: 'help',
      description: 'Show available commands',
      usage: 'help [command]',
      arguments: [
        {
          name: 'command',
          type: 'string',
          required: false,
          description: 'Command to get help for',
        },
      ],
      execute: (args, _context) => {
        const cmdName = args.command as string | undefined;
        
        if (cmdName) {
          const cmd = this.getCommand(cmdName);
          if (!cmd) {
            return { success: false, message: `Unknown command: ${cmdName}` };
          }
          
          const lines = [
            `${cmd.name}: ${cmd.description}`,
            `Usage: ${cmd.usage}`,
            '',
            'Arguments:',
          ];
          
          for (const arg of cmd.arguments) {
            const req = arg.required ? '(required)' : `(optional, default: ${arg.default})`;
            lines.push(`  ${arg.name}: ${arg.type} - ${arg.description} ${req}`);
          }
          
          return { success: true, message: lines.join('\n') };
        }

        const lines = ['Available commands:', ''];
        for (const cmd of this.commands.values()) {
          lines.push(`  ${cmd.name.padEnd(20)} - ${cmd.description}`);
        }
        lines.push('', "Type 'help <command>' for more info");
        
        return { success: true, message: lines.join('\n') };
      },
    });

    // Clear command
    this.register({
      name: 'clear',
      description: 'Clear the console output',
      usage: 'clear',
      arguments: [],
      execute: () => {
        return { success: true, message: '', data: { action: 'clear' } };
      },
    });

    // History command
    this.register({
      name: 'history',
      description: 'Show command history',
      usage: 'history [count]',
      arguments: [
        {
          name: 'count',
          type: 'number',
          required: false,
          description: 'Number of commands to show',
          default: 10,
        },
      ],
      execute: (args) => {
        const count = args.count as number;
        const recent = this.history.slice(-count);
        const lines = recent.map((cmd, i) => `${i + 1}. ${cmd}`);
        return { success: true, message: lines.join('\n') || 'No command history' };
      },
    });
  }
}

// =============================================================================
// Game-Specific Commands Factory
// =============================================================================

/**
 * Create game-specific debug commands
 */
export function createGameCommands(): CommandDefinition[] {
  return [
    // Give Money
    {
      name: 'givemoney',
      description: 'Add money to the company',
      usage: 'givemoney <amount>',
      arguments: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          description: 'Amount of money to add',
        },
      ],
      execute: (args, context) => {
        const amount = args.amount as number;
        if (amount <= 0) {
          return { success: false, message: 'Amount must be positive' };
        }
        
        context.dispatch({ type: 'DEBUG_ADD_MONEY', payload: amount });
        return { success: true, message: `Added $${amount.toLocaleString()} to company funds` };
      },
    },

    // Simulate Days
    {
      name: 'simulatedays',
      description: 'Fast-forward simulation by N days',
      usage: 'simulatedays <days>',
      arguments: [
        {
          name: 'days',
          type: 'number',
          required: true,
          description: 'Number of days to simulate',
        },
      ],
      execute: (args, context) => {
        const days = Math.floor(args.days as number);
        if (days <= 0 || days > 365) {
          return { success: false, message: 'Days must be between 1 and 365' };
        }
        
        context.dispatch({ type: 'DEBUG_SIMULATE_DAYS', payload: days });
        return { success: true, message: `Simulating ${days} day(s)...` };
      },
    },

    // Trigger Event
    {
      name: 'triggerevent',
      description: 'Trigger a specific game event',
      usage: 'triggerevent <eventId>',
      arguments: [
        {
          name: 'eventId',
          type: 'string',
          required: true,
          description: 'ID of the event to trigger',
        },
      ],
      execute: (args, context) => {
        const eventId = args.eventId as string;
        context.dispatch({ type: 'DEBUG_TRIGGER_EVENT', payload: eventId });
        return { success: true, message: `Triggered event: ${eventId}` };
      },
    },

    // List Employees
    {
      name: 'listemployees',
      description: 'List all employees',
      usage: 'listemployees [--verbose]',
      arguments: [
        {
          name: 'verbose',
          type: 'boolean',
          required: false,
          description: 'Show detailed info',
          default: false,
        },
      ],
      execute: (args, context) => {
        const verbose = args.verbose as boolean;
        const state = context.getState() as { company?: { employees?: unknown[] } };
        const employees = state?.company?.employees ?? [];
        
        if (employees.length === 0) {
          return { success: true, message: 'No employees' };
        }

        const lines = [`Employees (${employees.length}):`];
        for (const emp of employees as Array<{ name: string; role: string; salary?: number; skill?: number }>) {
          if (verbose) {
            lines.push(`  - ${emp.name} (${emp.role}) - Salary: $${emp.salary ?? 0}, Skill: ${emp.skill ?? 0}`);
          } else {
            lines.push(`  - ${emp.name} (${emp.role})`);
          }
        }
        
        return { success: true, message: lines.join('\n') };
      },
    },

    // Set Reputation
    {
      name: 'setreputation',
      description: 'Set company reputation',
      usage: 'setreputation <value>',
      arguments: [
        {
          name: 'value',
          type: 'number',
          required: true,
          description: 'Reputation value (0-100)',
        },
      ],
      execute: (args, context) => {
        const value = args.value as number;
        if (value < 0 || value > 100) {
          return { success: false, message: 'Reputation must be between 0 and 100' };
        }
        
        context.dispatch({ type: 'DEBUG_SET_REPUTATION', payload: value });
        return { success: true, message: `Set reputation to ${value}` };
      },
    },

    // Complete Research
    {
      name: 'completeresearch',
      description: 'Complete current research instantly',
      usage: 'completeresearch',
      arguments: [],
      execute: (_args, context) => {
        context.dispatch({ type: 'DEBUG_COMPLETE_RESEARCH' });
        return { success: true, message: 'Research completed' };
      },
    },

    // Add Player
    {
      name: 'addplayers',
      description: 'Add players to the active game',
      usage: 'addplayers <count>',
      arguments: [
        {
          name: 'count',
          type: 'number',
          required: true,
          description: 'Number of players to add',
        },
      ],
      execute: (args, context) => {
        const count = Math.floor(args.count as number);
        if (count <= 0) {
          return { success: false, message: 'Count must be positive' };
        }
        
        context.dispatch({ type: 'DEBUG_ADD_PLAYERS', payload: count });
        return { success: true, message: `Added ${count.toLocaleString()} players` };
      },
    },

    // Toggle Flag
    {
      name: 'toggleflag',
      description: 'Toggle a sandbox flag',
      usage: 'toggleflag <flagName>',
      arguments: [
        {
          name: 'flagName',
          type: 'string',
          required: true,
          description: 'Name of the sandbox flag to toggle',
        },
      ],
      execute: (args, context) => {
        const flagName = args.flagName as string;
        context.dispatch({ type: 'TOGGLE_SANDBOX_FLAG', payload: flagName });
        return { success: true, message: `Toggled flag: ${flagName}` };
      },
    },

    // List Flags
    {
      name: 'listflags',
      description: 'List all sandbox flags and their values',
      usage: 'listflags',
      arguments: [],
      execute: (_, context) => {
        const state = context.getState() as { sandbox?: { flags?: Record<string, boolean | number> } };
        const flags = state?.sandbox?.flags ?? {};
        
        const lines = ['Sandbox Flags:'];
        for (const [name, value] of Object.entries(flags)) {
          const indicator = value ? '✓' : '✗';
          lines.push(`  ${indicator} ${name}: ${value}`);
        }
        
        return { success: true, message: lines.join('\n') };
      },
    },

    // Dump State
    {
      name: 'dumpstate',
      description: 'Dump current game state to console',
      usage: 'dumpstate [--section]',
      arguments: [
        {
          name: 'section',
          type: 'string',
          required: false,
          description: 'State section to dump (company, games, market, etc.)',
        },
      ],
      execute: (args, context) => {
        const section = args.section as string | undefined;
        const state = context.getState() as Record<string, unknown>;
        
        if (section) {
          const data = state[section];
          if (!data) {
            return { success: false, message: `Unknown state section: ${section}` };
          }
          console.log(`State.${section}:`, data);
          return { success: true, message: `Dumped state.${section} to browser console` };
        }
        
        console.log('Full Game State:', state);
        return { success: true, message: 'Dumped full state to browser console' };
      },
    },
  ];
}

// =============================================================================
// Singleton Registry Instance
// =============================================================================

let globalRegistry: CommandRegistry | null = null;

export function getCommandRegistry(): CommandRegistry {
  if (!globalRegistry) {
    globalRegistry = new CommandRegistry();
    
    // Register game commands
    for (const cmd of createGameCommands()) {
      globalRegistry.register(cmd);
    }
    
    // Register aliases
    globalRegistry.registerAlias('gm', 'givemoney');
    globalRegistry.registerAlias('sd', 'simulatedays');
    globalRegistry.registerAlias('te', 'triggerevent');
    globalRegistry.registerAlias('le', 'listemployees');
    globalRegistry.registerAlias('?', 'help');
  }
  
  return globalRegistry;
}

export function resetCommandRegistry(): void {
  globalRegistry = null;
}
