const events = [
  {
    id: "lspu-spc-boss-battle",
    name: "LSPU-SPC Boss Battle",
    emblem: "QB",
    label: "Field Raid",
    tagline:
      "Scan QR codes around Laguna State Polytechnic University San Pablo Campus and challenge the boss.",
    reward: "Chance to earn NFT items",
    href: "https://shijay.dev",
    accent: "gold",
    footer: "Explore campus, scan the code, and enter the boss fight.",
  },
  {
    id: "ccs-week",
    name: "CCS Week",
    emblem: "CC",
    label: "Trade Event",
    tagline: "Convert your coins into CCS, the CropTap CoinS event currency.",
    reward: "Limited event conversion",
    href: "https://shijay.dev",
    accent: "emerald",
    footer: "Turn your earned coins into event crypto for a limited run.",
  },
];

function EventSection() {
  return (
    <section className="wf-events-section" aria-label="Current events">
      <div className="wf-events-banner-grid">
        {events.map((event) => (
          <a
            key={event.id}
            className={`wf-event-banner ${event.accent}`}
            href={event.href}
            aria-label={`${event.name} event banner`}
          >
            <div className="wf-event-banner-overlay" aria-hidden="true" />
            <div className="wf-event-banner-content">
              <div className="wf-event-topline">
                <span className="wf-event-emblem" aria-hidden="true">
                  {event.emblem}
                </span>

                <div className="wf-event-topcopy">
                  <p className="wf-event-badge">Current Event</p>
                  <p className="wf-event-label">{event.label}</p>
                </div>
              </div>

              <div className="wf-event-copy">
                <h2>{event.name}</h2>
                <p className="wf-event-tagline">{event.tagline}</p>
              </div>

              <div className="wf-event-bottomrow">
                <strong className="wf-event-reward">{event.reward}</strong>
                <span className="wf-event-cta">Open event banner</span>
              </div>

              <p className="wf-event-footer">{event.footer}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default EventSection;
