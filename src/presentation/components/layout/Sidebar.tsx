import { useState } from 'react';
import { Icon, IconName } from '../common';
import { useI18n } from '../../../infrastructure/i18n';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type NavTab = { id: string; labelKey: keyof typeof import('../../../infrastructure/i18n').en.nav; icon: IconName };

const tabsConfig: NavTab[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: 'dashboard' },
  { id: 'founder', labelKey: 'founder', icon: 'star' },
  { id: 'games', labelKey: 'games', icon: 'games' },
  { id: 'employees', labelKey: 'employees', icon: 'staff' },
  { id: 'gacha', labelKey: 'gacha', icon: 'gacha' },
  { id: 'marketing', labelKey: 'marketing', icon: 'marketing' },
  { id: 'finance', labelKey: 'finance', icon: 'finance' },
  { id: 'office', labelKey: 'office', icon: 'settings' },
  { id: 'roadmap', labelKey: 'roadmap', icon: 'calendar' },
  { id: 'monetization', labelKey: 'monetization', icon: 'money' },
  { id: 'crowdfunding', labelKey: 'crowdfunding', icon: 'rocket' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useI18n();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? <Icon name="chevronRight" /> : <Icon name="chevronLeft" />}
          </button>
        </div>
        <nav className="flex-1 p-2">
          {tabsConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === tab.id
                  ? 'bg-gacha-purple text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon name={tab.icon} size="lg" />
              {!isCollapsed && (
                <span className="font-medium">{t.nav[tab.labelKey]}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
        <div className="flex justify-around">
          {tabsConfig.slice(0, 5).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-gacha-purple'
                  : 'text-gray-400'
              }`}
            >
              <Icon name={tab.icon} size="lg" />
              <span className="text-xs mt-1">{t.nav[tab.labelKey]}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
