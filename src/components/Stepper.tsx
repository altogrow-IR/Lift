import { Icon } from "./Icon";
export function Stepper({
  label,
  value,
  unit,
  step,
  max,
  min = 0,
  change,
}: {
  label: string;
  value: string;
  unit: string;
  step: number;
  max: number;
  min?: number;
  change: (v: string) => void;
}) {
  const adjust = (direction: number) =>
    change(
      String(
        Math.min(
          max,
          Math.max(
            min,
            Math.round(((Number(value) || 0) + direction * step) * 10) / 10,
          ),
        ),
      ),
    );
  return (
    <div className="stepper">
      <label htmlFor={`input-${label}`}>
        {label}
        <span>{unit}</span>
      </label>
      <div className="stepper-controls">
        <button
          type="button"
          className="step-button"
          aria-label={`${label}を減らす`}
          onClick={() => adjust(-1)}
          disabled={Number(value) <= min}
        >
          <Icon name="minus" />
        </button>
        <input
          id={`input-${label}`}
          type="text"
          inputMode={step % 1 ? "decimal" : "numeric"}
          value={value}
          autoComplete="off"
          maxLength={8}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) change(e.target.value);
          }}
          aria-label={label}
        />
        <button
          type="button"
          className="step-button"
          aria-label={`${label}を増やす`}
          onClick={() => adjust(1)}
          disabled={Number(value) >= max}
        >
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
