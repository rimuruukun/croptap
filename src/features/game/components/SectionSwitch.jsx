function SectionSwitch({ activeTab, onChange }) {
  return (
    <div className="wf-management-switch" aria-label="Tools and farmers switch">
      <button
        type="button"
        className={`wf-management-tab${activeTab === 'tools' ? ' active' : ''}`}
        onClick={() => onChange('tools')}
      >
        Tools
      </button>
      <button
        type="button"
        className={`wf-management-tab${activeTab === 'farmers' ? ' active' : ''}`}
        onClick={() => onChange('farmers')}
      >
        Farmers
      </button>
    </div>
  );
}

export default SectionSwitch;