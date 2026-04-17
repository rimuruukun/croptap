import { formatCompact } from '../utils';

function SharedHeader({ coins, fertilizer, activeItem, managementTab }) {
  // Map activeItem to display title; special handling for farmers/tools
  const getTitleText = () => {
    if (activeItem === 'farmers') {
      return managementTab === 'tools' ? 'Tools' : 'Farmers';
    }
    
    const titleMap = {
      battle: 'Battle',
      tools: 'Tools',
      events: 'Events',
      leaderboards: 'Leaderboards',
      settings: 'Settings',
    };
    
    return titleMap[activeItem] || 'CropTap';
  };

  return (
    <header className="wf-header" aria-label="Currency header">
      <div className="wf-currency-row">
        <div className="wf-currency-side left" aria-label="Coins">
          <img src="/assets/ui/coin.png" alt="Coins" className="wf-currency-icon" />
          <span>{formatCompact(coins)}</span>
        </div>
        <div className="wf-header-title">{getTitleText()}</div>
        <div className="wf-currency-side right" aria-label="Fertilizer">
          <span>{formatCompact(fertilizer)}</span>
          <img src="/assets/ui/fertilizer.png" alt="Fertilizer" className="wf-currency-icon" />
        </div>
      </div>
    </header>
  );
}

export default SharedHeader;