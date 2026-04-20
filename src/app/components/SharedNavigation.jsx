import { NavLink } from "react-router-dom";

import { getPathForSection, mobileNavItems } from "../constants";

function SharedNavigation({ activeItem, onSelect, items = mobileNavItems }) {
  return (
    <nav className="wf-nav" aria-label="Primary navigation">
      {items.map((item) => {
        const targetPath = getPathForSection(item.id);

        return (
          <NavLink
            key={item.id}
            to={targetPath}
            className={({ isActive }) =>
              `wf-nav-item wf-nav-item-${item.id}${
                isActive || activeItem === item.id ? " active" : ""
              }`
            }
            onClick={() => onSelect?.(item.id)}
            aria-label={item.label}
            title={item.label}
          >
            <span className="wf-nav-icon-placeholder" aria-hidden="true" />
            <span className="sr-only">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default SharedNavigation;
