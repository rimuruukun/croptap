import { buyOptions } from "../config/constants";

function QuantityControls({ quantity, onChange }) {
  return (
    <div className="wf-quantity-controls" aria-label="Buy quantity controls">
      {buyOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`wf-qty-button${quantity === option ? " active" : ""}`}
          onClick={() => onChange(option)}
        >
          {typeof option === "number" ? `x${option}` : "MAX"}
        </button>
      ))}
    </div>
  );
}

export default QuantityControls;
