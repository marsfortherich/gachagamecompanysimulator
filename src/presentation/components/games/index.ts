/**
 * Games Components exports
 */
export {
  PhaseTimeline,
  GameCard,
  TeamAvatars,
  MonetizationSummary,
  ProgressRing,
  GamesPipelineView,
  GamesListView,
  GameDetailPanel,
} from './GameProgress';

export type {
  PhaseTimelineProps,
  GameCardProps,
  GamesPipelineViewProps,
  GamesListViewProps,
  GameDetailPanelProps,
} from './GameProgress';

// Phase Info / Help System
export {
  PHASE_INFO,
  calculateTeamEffectivenessBreakdown,
  PhaseInfoTooltip,
  ProgressBreakdownPanel,
  PhaseHelpModal,
  GameProgressWithHelp,
} from './PhaseInfo';

export type {
  PhaseInfoData,
  TeamEffectivenessBreakdown,
  TeamMemberForCalculation,
  PhaseInfoTooltipProps,
  ProgressBreakdownPanelProps,
  PhaseHelpModalProps,
  GameProgressWithHelpProps,
} from './PhaseInfo';
