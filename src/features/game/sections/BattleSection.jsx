import { useCallback, useEffect, useRef, useState } from "react";

import { resolveTapHit } from "../utils/tap";

function BattleSection({
  stage,
  bossHP,
  maxHP,
  crop,
  onTap,
  tapDamage,
  timerPercent = 100,
  hpTrailPercent = 100,
}) {
  const [tapSequence, setTapSequence] = useState(0);
  const [tapPopups, setTapPopups] = useState([]);
  const popupIdRef = useRef(0);
  const popupTimersRef = useRef(new Map());
  const isBossStage = stage % 10 === 0;
  const hpPercent = maxHP > 0 ? Math.max(0, (bossHP / maxHP) * 100) : 0;
  const cropImage = crop?.image || "/assets/crops/strawberry.png";
  const cropName = crop?.name || "Strawberry";

  useEffect(
    () => () => {
      popupTimersRef.current.forEach((timerId) => {
        clearTimeout(timerId);
      });
      popupTimersRef.current.clear();
    },
    [],
  );

  const handleTap = useCallback(
    (event) => {
      if (bossHP <= 0) {
        return;
      }

      const tapResult = resolveTapHit({
        bossHP,
        maxHP,
        damage: tapDamage,
      });

      const bounds = event.currentTarget.getBoundingClientRect();
      const fallbackX = bounds.left + bounds.width / 2;
      const fallbackY = bounds.top + bounds.height / 2;
      const isPointerTap = event.detail > 0;
      const tapX =
        isPointerTap && Number.isFinite(event.clientX)
          ? event.clientX
          : fallbackX;
      const tapY =
        isPointerTap && Number.isFinite(event.clientY)
          ? event.clientY
          : fallbackY;
      const popupId = popupIdRef.current + 1;

      popupIdRef.current = popupId;
      setTapSequence((tick) => tick + 1);
      setTapPopups((current) => [
        ...current,
        {
          id: popupId,
          x: tapX - bounds.left,
          y: tapY - bounds.top,
          damage: tapResult.damage,
          isCrit: tapResult.isCrit,
        },
      ]);

      const timerId = window.setTimeout(() => {
        setTapPopups((current) =>
          current.filter((item) => item.id !== popupId),
        );
        popupTimersRef.current.delete(popupId);
      }, 900);

      popupTimersRef.current.set(popupId, timerId);
      onTap(tapResult);
    },
    [bossHP, maxHP, onTap, tapDamage],
  );

  return (
    <section className="wf-main wf-battle-scene" aria-label="Main gameplay">
      <button
        type="button"
        className="wf-crop-target"
        aria-label={`Tap ${cropName} area`}
        onClick={handleTap}
      >
        <img
          key={tapSequence}
          className="wf-crop-image wf-crop-image-push"
          src={cropImage}
          alt={cropName}
        />

        <div className="wf-tap-feedback-layer" aria-hidden="true">
          {tapPopups.map((popup) => (
            <span
              key={popup.id}
              className={`wf-tap-feedback${popup.isCrit ? " crit" : ""}`}
              style={{ left: `${popup.x}px`, top: `${popup.y}px` }}
            >
              {popup.isCrit ? `💥 CRIT! -${popup.damage}` : `-${popup.damage}`}
            </span>
          ))}
        </div>
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
