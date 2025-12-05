/**
 * Analytics event types for tracking user behavior and game metrics
 */
export type AnalyticsEventType =
  // Session events
  | 'session_start'
  | 'session_end'
  // Game progression
  | 'company_created'
  | 'game_started'
  | 'game_launched'
  | 'employee_hired'
  // Feature usage
  | 'feature_used'
  | 'menu_opened'
  | 'settings_changed'
  // Economy
  | 'funds_earned'
  | 'funds_spent'
  // Milestones
  | 'milestone_reached'
  | 'achievement_unlocked';

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent {
  readonly type: AnalyticsEventType;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly properties: Record<string, string | number | boolean>;
}

/**
 * Analytics service interface
 * Allows for different implementations (local, cloud, etc.)
 */
export interface IAnalyticsService {
  track(event: AnalyticsEventType, properties?: Record<string, string | number | boolean>): void;
  identify(userId: string, traits?: Record<string, string | number | boolean>): void;
  startSession(): void;
  endSession(): void;
  getEvents(): readonly AnalyticsEvent[];
  flush(): Promise<void>;
}

/**
 * Local analytics service - stores events in memory
 * Can be extended to send to a backend or analytics service
 */
export class LocalAnalyticsService implements IAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string = '';
  private sessionStart: number = 0;
  private userId: string | null = null;
  private userTraits: Record<string, string | number | boolean> = {};

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  track(
    type: AnalyticsEventType,
    properties: Record<string, string | number | boolean> = {}
  ): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      properties: {
        ...properties,
        userId: this.userId ?? 'anonymous',
      },
    };

    this.events.push(event);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', type, properties);
    }
  }

  identify(userId: string, traits: Record<string, string | number | boolean> = {}): void {
    this.userId = userId;
    this.userTraits = { ...this.userTraits, ...traits };
  }

  startSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.track('session_start', {
      sessionId: this.sessionId,
    });
  }

  endSession(): void {
    const duration = Date.now() - this.sessionStart;
    this.track('session_end', {
      sessionId: this.sessionId,
      durationMs: duration,
      eventCount: this.events.filter(e => e.sessionId === this.sessionId).length,
    });
  }

  getEvents(): readonly AnalyticsEvent[] {
    return [...this.events];
  }

  async flush(): Promise<void> {
    // In a real implementation, this would send events to a backend
    // For now, just log the count
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Flushed ${this.events.length} events`);
    }
  }

  /**
   * Get aggregated metrics for the current session
   */
  getSessionMetrics(): {
    duration: number;
    eventCount: number;
    topEvents: { type: string; count: number }[];
  } {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    const eventCounts = new Map<string, number>();

    for (const event of sessionEvents) {
      eventCounts.set(event.type, (eventCounts.get(event.type) ?? 0) + 1);
    }

    const topEvents = Array.from(eventCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      duration: Date.now() - this.sessionStart,
      eventCount: sessionEvents.length,
      topEvents,
    };
  }
}

/**
 * Singleton analytics service instance
 */
export const analyticsService = new LocalAnalyticsService();

/**
 * Helper function to track feature usage
 */
export function trackFeatureUsage(featureName: string, additionalProps?: Record<string, string | number | boolean>): void {
  analyticsService.track('feature_used', {
    feature: featureName,
    ...additionalProps,
  });
}
