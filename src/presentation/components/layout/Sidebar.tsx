import { useState } from 'react';
import { Icon, IconName } from '../common';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'founder', label: 'Founder', icon: 'star' },
  { id: 'games', label: 'Games', icon: 'games' },
  { id: 'employees', label: 'Staff', icon: 'staff' },
  { id: 'gacha', label: 'Gacha', icon: 'gacha' },
  { id: 'marketing', label: 'Marketing', icon: 'marketing' },
  { id: 'finance', label: 'Finance', icon: 'finance' },
  { id: 'office', label: 'Office', icon: 'settings' },
  { id: 'roadmap', label: 'Roadmap', icon: 'calendar' },
  { id: 'monetization', label: 'Monetize', icon: 'money' },
  { id: 'crowdfunding', label: 'Funding', icon: 'rocket' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          {tabs.map((tab) => (
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
                <span className="font-medium">{tab.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map((tab) => (
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
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
