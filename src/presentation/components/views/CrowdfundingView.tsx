import { useState } from 'react';
import { useGame } from '../../context';
import { GameActions } from '../../../application/actions';
import { Card, Button, Icon, ProgressBar } from '../common';
import { useI18n } from '../../../infrastructure/i18n';
import { 
  CrowdfundingCampaign,
} from '../../../domain/economy/Crowdfunding';
import { GameGenre } from '../../../domain/game/Game';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDays(ticks: number, currentTick: number): string {
  const days = ticks - currentTick;
  if (days <= 0) return 'Ending soon!';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function calculateProgress(campaign: CrowdfundingCampaign): number {
  if (campaign.fundingGoal <= 0) return 0;
  return Math.min(100, (campaign.currentPledges / campaign.fundingGoal) * 100);
}

import { IconName } from '../common/Icon';

const TIER_ICONS: Record<string, IconName> = {
  'Supporter': 'handshake',
  'Early Bird': 'bird',
  'Founder': 'star',
  'Patron': 'trophy',
  'Executive Producer': 'crown',
};

export function CrowdfundingView() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { company, games, crowdfundingCampaigns, currentTick } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignConfig, setCampaignConfig] = useState({
    name: '',
    description: '',
    genre: 'idle' as GameGenre,
    fundingGoal: 50000,
    durationDays: 30,
  });

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <p className="text-gray-400 text-center">{t.crowdfunding.startCompanyFirst}</p>
        </Card>
      </div>
    );
  }

  const activeCampaigns = crowdfundingCampaigns.filter(c => c.status === 'active');
  const fundedCampaigns = crowdfundingCampaigns.filter(c => c.status === 'funded' || c.status === 'completed');
  const failedCampaigns = crowdfundingCampaigns.filter(c => c.status === 'failed');

  const handleCreateCampaign = () => {
    if (!campaignConfig.name.trim()) return;
    
    dispatch(GameActions.createCrowdfundingCampaign(
      campaignConfig.name,
      campaignConfig.description,
      campaignConfig.genre,
      campaignConfig.fundingGoal,
      campaignConfig.durationDays
    ));
    
    setShowCreateModal(false);
    setCampaignConfig({
      name: '',
      description: '',
      genre: 'idle',
      fundingGoal: 50000,
      durationDays: 30,
    });
  };

  const handleLaunchCampaign = (campaignId: string) => {
    dispatch(GameActions.launchCrowdfundingCampaign(campaignId));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">{t.crowdfunding.title}</h2>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + {t.crowdfunding.newCampaign}
        </Button>
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t.crowdfunding.activeCampaigns}</h3>
          {activeCampaigns.map(campaign => {
            const game = games.find(g => g.id === campaign.gameId);
            const progress = calculateProgress(campaign);
            
            return (
              <Card key={campaign.id} className="border-gacha-purple/30">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-bold text-white">{campaign.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-green-900/50 rounded-full text-green-300">
                        {t.crowdfunding.active}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {game?.name ? `For: ${game.name}` : campaign.genre} • {formatDays(campaign.campaignEndTick, currentTick)}
                    </p>
                    
                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-semibold">{formatCurrency(campaign.currentPledges)}</span>
                        <span className="text-gray-400">of {formatCurrency(campaign.fundingGoal)}</span>
                      </div>
                      <ProgressBar value={progress} color="purple" />
                      <p className="text-xs text-gray-400 mt-1">
                        {campaign.backerCount.toLocaleString()} backers • {progress.toFixed(1)}% funded
                      </p>
                    </div>
                    
                    {/* Milestones */}
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">{t.crowdfunding.milestones}</h5>
                      <div className="space-y-2">
                        {campaign.milestones.map((milestone) => (
                          <div 
                            key={milestone.id} 
                            className={`flex items-center gap-2 text-sm ${
                              milestone.completed ? 'text-green-400' : 'text-gray-400'
                            }`}
                          >
                            <Icon name={milestone.completed ? 'complete' : 'hourglass'} size="sm" />
                            <span>{milestone.name}</span>
                            <span>-</span>
                            <span>{milestone.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tier Breakdown */}
                  <div className="md:w-64 space-y-2">
                    <h5 className="text-sm font-semibold text-gray-300">{t.crowdfunding.rewardTiers}</h5>
                    {campaign.rewardTiers.map((tier) => (
                      <div key={tier.id} className="p-2 bg-gray-800/50 rounded text-sm">
                        <div className="flex items-center gap-1">
                          <Icon name={TIER_ICONS[tier.name] ?? 'gift'} size="sm" className="text-gacha-gold" />
                          <span className="font-semibold text-white">{tier.name}</span>
                          <span className="text-gray-400 ml-auto">{formatCurrency(tier.pledgeAmount)}</span>
                        </div>
                        <p className="text-xs text-gray-400">{tier.backerCount} backers</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Backer Confidence */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">{t.crowdfunding.backerConfidence}</p>
                      <ProgressBar 
                        value={campaign.backerConfidence} 
                        color={campaign.backerConfidence > 70 ? 'green' : campaign.backerConfidence > 40 ? 'gold' : 'red'} 
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{t.crowdfunding.monthlyPayout}</p>
                      <p className="text-lg font-bold text-gacha-gold">{formatCurrency(campaign.monthlyPayout)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Planning Campaigns */}
      {crowdfundingCampaigns.filter(c => c.status === 'planning').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t.crowdfunding.campaignsInPlanning}</h3>
          {crowdfundingCampaigns.filter(c => c.status === 'planning').map(campaign => (
            <Card key={campaign.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">{campaign.name}</h4>
                  <p className="text-sm text-gray-400">
                    {t.crowdfunding.goal}: {formatCurrency(campaign.fundingGoal)} • {campaign.campaignDurationDays} {t.common.days}
                  </p>
                </div>
                <Button variant="primary" onClick={() => handleLaunchCampaign(campaign.id)}>
                  <Icon name="rocket" size="sm" className="mr-1" /> {t.crowdfunding.launch}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Active Campaigns */}
      {activeCampaigns.length === 0 && crowdfundingCampaigns.filter(c => c.status === 'planning').length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Icon name="rocket" size="xl" className="mb-4 mx-auto text-gacha-purple" />
            <h3 className="text-xl font-semibold text-white mb-2">{t.crowdfunding.noActiveCampaigns}</h3>
            <p className="text-gray-400 mb-4">
              {t.crowdfunding.launchCampaignHint}
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              {t.crowdfunding.startFirstCampaign}
            </Button>
          </div>
        </Card>
      )}

      {/* Funded Campaigns */}
      {fundedCampaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t.crowdfunding.fundedCampaigns}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {fundedCampaigns.map(campaign => (
              <Card key={campaign.id} className="border-green-600/30">
                <div className="flex items-center gap-2">
                  <Icon name="confetti" size="lg" className="text-yellow-400" />
                  <div>
                    <h4 className="font-semibold text-white">{campaign.name}</h4>
                    <p className="text-xs text-gray-400">{campaign.genre}</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-300">
                    {campaign.status === 'completed' ? t.crowdfunding.completed : t.crowdfunding.funded}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-white">{formatCurrency(campaign.currentPledges)} {t.crowdfunding.raised}</span>
                  <span className="text-gray-400">{campaign.backerCount} {t.crowdfunding.backers}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Failed Campaigns */}}
      {failedCampaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t.crowdfunding.pastCampaigns}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {failedCampaigns.map(campaign => (
              <Card key={campaign.id} className="border-red-600/30">
                <div className="flex items-center gap-2">
                  <Icon name="frown" size="lg" className="text-red-400" />
                  <div>
                    <h4 className="font-semibold text-white">{campaign.name}</h4>
                    <p className="text-xs text-gray-400">{campaign.genre}</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-300">
                    {t.crowdfunding.failed}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-white">{formatCurrency(campaign.currentPledges)} {t.crowdfunding.raised}</span>
                  <span className="text-gray-400">{campaign.backerCount} {t.crowdfunding.backers}</span></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t.crowdfunding.newCrowdfundingCampaign}</h3>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                <Icon name="times" size="sm" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  {t.crowdfunding.campaignName}
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                  placeholder="My Awesome Game"
                  value={campaignConfig.name}
                  onChange={(e) => setCampaignConfig({ ...campaignConfig, name: e.target.value })}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  {t.crowdfunding.description}
                </label>
                <textarea
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                  placeholder="A revolutionary gacha game..."
                  rows={3}
                  value={campaignConfig.description}
                  onChange={(e) => setCampaignConfig({ ...campaignConfig, description: e.target.value })}
                />
              </div>
              
              {/* Genre */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  {t.crowdfunding.gameGenre}
                </label>
                <select
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                  value={campaignConfig.genre}
                  onChange={(e) => setCampaignConfig({ ...campaignConfig, genre: e.target.value as GameGenre })}
                >
                  <option value="idle">Idle</option>
                  <option value="puzzle">Puzzle</option>
                  <option value="rhythm">Rhythm</option>
                  <option value="card">Card</option>
                  <option value="strategy">Strategy</option>
                  <option value="action">Action</option>
                  <option value="rpg">RPG</option>
                </select>
              </div>
              
              {/* Campaign Goal */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  {t.crowdfunding.fundingGoal}
                </label>
                <div className="flex gap-2">
                  {[25000, 50000, 100000, 250000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setCampaignConfig({ ...campaignConfig, fundingGoal: amount })}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        campaignConfig.fundingGoal === amount
                          ? 'bg-gacha-purple text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-2">
                  {t.crowdfunding.campaignDuration}
                </label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(days => (
                    <button
                      key={days}
                      onClick={() => setCampaignConfig({ ...campaignConfig, durationDays: days })}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        campaignConfig.durationDays === days
                          ? 'bg-gacha-purple text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                {t.common.cancel}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCreateCampaign}
                disabled={!campaignConfig.name.trim()}
              >
                {t.crowdfunding.createCampaign}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
