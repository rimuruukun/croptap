import { mobileNavItems } from '../constants';

function SharedNavigation({ activeItem, onSelect, items = mobileNavItems }) {
  return (
    <nav className="wf-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`wf-nav-item wf-nav-item-${item.id}${activeItem === item.id ? ' active' : ''}`}
          onClick={() => onSelect(item.id)}
          aria-label={item.label}
          title={item.label}
        >
          <span className="wf-nav-icon-placeholder" aria-hidden="true" />
          <span className="sr-only">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default SharedNavigation;