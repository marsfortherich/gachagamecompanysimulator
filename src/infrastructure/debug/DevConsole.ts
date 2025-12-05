/**
 * Developer Console Manager - Prompt 10.2
 * 
 * Manages the developer console visibility, keyboard shortcuts,
 * and command execution. Disabled in production builds.
 */

import { CommandRegistry, CommandContext, CommandResult, getCommandRegistry } from './CommandRegistry';

// =============================================================================
// Types
// =============================================================================

export interface DevConsoleConfig {
  readonly enabled: boolean;
  readonly keyCombo: KeyCombo;
  readonly maxOutputLines: number;
  readonly persistHistory: boolean;
}

export interface KeyCombo {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface ConsoleOutput {
  readonly timestamp: number;
  readonly type: 'input' | 'output' | 'error' | 'warning' | 'info';
  readonly message: string;
}

export type DevConsoleListener = (state: DevConsoleState) => void;

export interface DevConsoleState {
  readonly isOpen: boolean;
  readonly output: ConsoleOutput[];
  readonly inputHistory: string[];
  readonly historyIndex: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_KEY_COMBO: KeyCombo = {
  key: '`',         // Backtick (tilde key)
  ctrlKey: false,
  shiftKey: true,
  altKey: false,
  metaKey: false,
};

const DEFAULT_CONFIG: DevConsoleConfig = {
  enabled: true,
  keyCombo: DEFAULT_KEY_COMBO,
  maxOutputLines: 200,
  persistHistory: true,
};

// =============================================================================
// Environment Check
// =============================================================================

function isProduction(): boolean {
  // Check Vite's production mode
  if (typeof import.meta !== 'undefined') {
    return (import.meta as { env?: { PROD?: boolean } }).env?.PROD === true;
  }
  return false;
}

// =============================================================================
// Developer Console Class
// =============================================================================

export class DevConsole {
  private static instance: DevConsole | null = null;

  private readonly config: DevConsoleConfig;
  private readonly registry: CommandRegistry;
  private readonly listeners: Set<DevConsoleListener>;
  
  private state: DevConsoleState;
  private context: CommandContext | null;
  private keyHandler: ((e: KeyboardEvent) => void) | null;
  private isInitialized: boolean;

  constructor(config: Partial<DevConsoleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = getCommandRegistry();
    this.listeners = new Set();
    this.context = null;
    this.keyHandler = null;
    this.isInitialized = false;

    this.state = {
      isOpen: false,
      output: [],
      inputHistory: [],
      historyIndex: -1,
    };

    // Load persisted history
    if (this.config.persistHistory) {
      this.loadHistory();
    }
  }

  // ===========================================================================
  // Singleton Access
  // ===========================================================================

  static getInstance(config?: Partial<DevConsoleConfig>): DevConsole {
    if (!DevConsole.instance) {
      DevConsole.instance = new DevConsole(config);
    }
    return DevConsole.instance;
  }

  static resetInstance(): void {
    if (DevConsole.instance) {
      DevConsole.instance.destroy();
      DevConsole.instance = null;
    }
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize the dev console with application context
   */
  initialize(context: CommandContext): void {
    // Disable in production
    if (isProduction()) {
      console.log('DevConsole disabled in production build');
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.context = context;
    this.setupKeyboardListener();
    this.isInitialized = true;

    this.log('info', 'Developer console initialized. Press Shift+` to toggle.');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.keyHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyHandler);
    }
    this.keyHandler = null;
    this.context = null;
    this.isInitialized = false;
    this.listeners.clear();
  }

  private setupKeyboardListener(): void {
    if (typeof document === 'undefined') return;

    this.keyHandler = (e: KeyboardEvent) => {
      const { keyCombo } = this.config;
      
      if (
        e.key === keyCombo.key &&
        e.ctrlKey === keyCombo.ctrlKey &&
        e.shiftKey === keyCombo.shiftKey &&
        e.altKey === keyCombo.altKey &&
        e.metaKey === keyCombo.metaKey
      ) {
        e.preventDefault();
        this.toggle();
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  // ===========================================================================
  // Console Visibility
  // ===========================================================================

  /**
   * Toggle console visibility
   */
  toggle(): void {
    this.state = {
      ...this.state,
      isOpen: !this.state.isOpen,
    };
    this.notifyListeners();
  }

  /**
   * Open the console
   */
  open(): void {
    if (!this.state.isOpen) {
      this.state = { ...this.state, isOpen: true };
      this.notifyListeners();
    }
  }

  /**
   * Close the console
   */
  close(): void {
    if (this.state.isOpen) {
      this.state = { ...this.state, isOpen: false };
      this.notifyListeners();
    }
  }

  /**
   * Check if console is open
   */
  isOpen(): boolean {
    return this.state.isOpen;
  }

  /**
   * Check if console is enabled (not production)
   */
  isEnabled(): boolean {
    return !isProduction() && this.config.enabled;
  }

  // ===========================================================================
  // Command Execution
  // ===========================================================================

  /**
   * Execute a command
   */
  execute(input: string): CommandResult {
    if (!this.context) {
      return {
        success: false,
        message: 'Console not initialized',
      };
    }

    // Log the input
    this.log('input', `> ${input}`);

    // Add to input history
    const inputHistory = [...this.state.inputHistory];
    if (inputHistory[inputHistory.length - 1] !== input) {
      inputHistory.push(input);
      if (inputHistory.length > 100) {
        inputHistory.shift();
      }
    }
    this.state = {
      ...this.state,
      inputHistory,
      historyIndex: -1,
    };

    // Execute command
    const result = this.registry.execute(input, this.context);

    // Handle special commands
    if (result.data && typeof result.data === 'object') {
      const data = result.data as { action?: string };
      if (data.action === 'clear') {
        this.clearOutput();
        return result;
      }
    }

    // Log the result
    if (result.success) {
      if (result.message) {
        this.log('output', result.message);
      }
    } else {
      this.log('error', result.message);
    }

    // Persist history
    if (this.config.persistHistory) {
      this.saveHistory();
    }

    this.notifyListeners();
    return result;
  }

  // ===========================================================================
  // Output Management
  // ===========================================================================

  /**
   * Add a log entry
   */
  log(type: ConsoleOutput['type'], message: string): void {
    const entry: ConsoleOutput = {
      timestamp: Date.now(),
      type,
      message,
    };

    const output = [...this.state.output, entry];
    
    // Trim if over limit
    while (output.length > this.config.maxOutputLines) {
      output.shift();
    }

    this.state = { ...this.state, output };
    this.notifyListeners();
  }

  /**
   * Clear output
   */
  clearOutput(): void {
    this.state = { ...this.state, output: [] };
    this.notifyListeners();
  }

  /**
   * Get current output
   */
  getOutput(): readonly ConsoleOutput[] {
    return this.state.output;
  }

  // ===========================================================================
  // Input History Navigation
  // ===========================================================================

  /**
   * Navigate up in history
   */
  historyUp(): string {
    const { inputHistory, historyIndex } = this.state;
    if (inputHistory.length === 0) return '';

    const newIndex = historyIndex < 0 
      ? inputHistory.length - 1 
      : Math.max(0, historyIndex - 1);

    this.state = { ...this.state, historyIndex: newIndex };
    return inputHistory[newIndex] ?? '';
  }

  /**
   * Navigate down in history
   */
  historyDown(): string {
    const { inputHistory, historyIndex } = this.state;
    if (historyIndex < 0) return '';

    const newIndex = historyIndex + 1;
    if (newIndex >= inputHistory.length) {
      this.state = { ...this.state, historyIndex: -1 };
      return '';
    }

    this.state = { ...this.state, historyIndex: newIndex };
    return inputHistory[newIndex] ?? '';
  }

  /**
   * Get input history
   */
  getInputHistory(): readonly string[] {
    return this.state.inputHistory;
  }

  // ===========================================================================
  // State Management
  // ===========================================================================

  /**
   * Get current state
   */
  getState(): Readonly<DevConsoleState> {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: DevConsoleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // ===========================================================================
  // Persistence
  // ===========================================================================

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('dev_console_history');
      if (stored) {
        const history = JSON.parse(stored) as string[];
        this.state = { ...this.state, inputHistory: history };
      }
    } catch {
      // Ignore errors
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(
        'dev_console_history',
        JSON.stringify(this.state.inputHistory)
      );
    } catch {
      // Ignore errors
    }
  }

  // ===========================================================================
  // Registry Access
  // ===========================================================================

  /**
   * Get the command registry
   */
  getRegistry(): CommandRegistry {
    return this.registry;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Get the global dev console instance
 */
export function getDevConsole(): DevConsole {
  return DevConsole.getInstance();
}

/**
 * Initialize the dev console with app context
 */
export function initDevConsole(context: CommandContext): void {
  getDevConsole().initialize(context);
}

/**
 * Check if dev console is available (not production)
 */
export function isDevConsoleAvailable(): boolean {
  return !isProduction();
}
