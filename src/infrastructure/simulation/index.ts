/**
 * Infrastructure Simulation Index
 * Exports simulation scheduling and worker utilities
 */

export {
  // SimulationScheduler
  SimulationScheduler,
  type SimulationState,
  type TickProcessor,
  type SchedulerConfig,
  type SchedulerMetrics,
  type IdleDetection,
  
  // Speed utilities
  EXTENDED_SPEED_MULTIPLIERS,
  type ExtendedGameSpeed,
  calculateTicksForSpeed,
  
  // Throttled updates
  createThrottledUpdate,
} from './SimulationScheduler';

export {
  // SimulationWorker
  SimulationWorkerManager,
  simulationWorker,
  createSimulationWorker,
  
  // Worker types
  type WorkerCommand,
  type WorkerResponse,
  type WorkerConfig,
  type WorkerMetrics,
} from './SimulationWorker';
