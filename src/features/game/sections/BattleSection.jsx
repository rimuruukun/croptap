import { useCallback, useState } from "react";

function BattleSection({
  stage,
  bossHP,
  maxHP,
  crop,
  onTap,
  timerPercent = 100,
  hpTrailPercent = 100,
}) {
  const [tapAnimationTick, setTapAnimationTick] = useState(0);
  const isBossStage = stage % 10 === 0;
  const hpPercent = maxHP > 0 ? Math.max(0, (bossHP / maxHP) * 100) : 0;
  const cropImage = crop?.image || "/assets/crops/strawberry.png";
  const cropName = crop?.name || "Strawberry";

  const handleTap = useCallback(() => {
    setTapAnimationTick((tick) => tick + 1);
    onTap();
  }, [onTap]);

  const cropImageClassName =
    tapAnimationTick > 0 ? "wf-crop-image wf-crop-image-push" : "wf-crop-image";

  return (
    <section className="wf-main wf-battle-scene" aria-label="Main gameplay">
      <button
        type="button"
        className="wf-crop-target"
        aria-label={`Tap ${cropName} area`}
        onClick={handleTap}
      >
        <img
          key={tapAnimationTick}
          className={cropImageClassName}
          src={cropImage}
          alt={cropName}
        />
      </button>

      <div className="wf-stage-group">
        <div className="wf-hp-group">
          <p className="wf-stage-label">Stage {stage}</p>
          <div className="wf-bar-shell">
            <div className="wf-bar hp">
              <div
                className="wf-bar-fill hp-trail"
                style={{ width: `${hpTrailPercent}%` }}
              />
              <div
                className="wf-bar-fill hp"
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {isBossStage ? (
              <div className="wf-bar timer">
                <div
                  className="wf-bar-fill timer"
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BattleSection;
