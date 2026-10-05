import { useState } from "react";
import { Modal } from "./Modal";
import { Stepper } from "./Stepper";
import { Icon } from "./Icon";
import { LIMITS, type Exercise, type TrainingSet } from "../lib/model";
export function EditSet({
  set,
  exercise,
  today,
  close,
  save,
  remove,
}: {
  set: TrainingSet;
  exercise: Exercise;
  today: string;
  close: () => void;
  save: (s: TrainingSet) => boolean;
  remove: () => boolean;
}) {
  const [date, setDate] = useState(set.date);
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));
  const [seconds, setSeconds] = useState(String(set.seconds));
  const [error, setError] = useState("");
  return (
    <Modal title="記録を編集" close={close}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const valid =
            exercise.kind === "time"
              ? seconds !== "" &&
                Number.isInteger(Number(seconds)) &&
                Number(seconds) >= 1 &&
                Number(seconds) <= LIMITS.seconds
              : reps !== "" &&
                Number.isInteger(Number(reps)) &&
                Number(reps) >= 1 &&
                Number(reps) <= LIMITS.reps &&
                (exercise.kind !== "weight" ||
                  (weight !== "" &&
                    Number.isFinite(Number(weight)) &&
                    Number(weight) >= 0 &&
                    Number(weight) <= LIMITS.weight));
          if (!valid || !date || date > today) {
            setError(
              "日付と数値を確認してください。回数・時間は1以上の整数で入力してください。",
            );
            return;
          }
          if (
            save({
              ...set,
              date,
              weight: exercise.kind === "weight" ? Number(weight) : 0,
              reps: exercise.kind === "time" ? 0 : Number(reps),
              seconds: exercise.kind === "time" ? Number(seconds) : 0,
            })
          )
            close();
        }}
      >
        <p className="edit-exercise-name">{exercise.name}</p>
        <label className="field-label">
          記録日
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <div
          className={`input-grid ${exercise.kind !== "weight" ? "single" : ""}`}
        >
          {exercise.kind === "weight" && (
            <Stepper
              label="重量"
              unit="kg"
              value={weight}
              change={setWeight}
              step={2.5}
              max={LIMITS.weight}
            />
          )}
          {exercise.kind !== "time" && (
            <Stepper
              label="回数"
              unit="回"
              value={reps}
              change={setReps}
              step={1}
              min={1}
              max={LIMITS.reps}
            />
          )}
          {exercise.kind === "time" && (
            <Stepper
              label="時間"
              unit="秒"
              value={seconds}
              change={setSeconds}
              step={5}
              min={1}
              max={LIMITS.seconds}
            />
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          <Icon name="check" />
          変更を保存
        </button>
        <button
          className="danger-text"
          type="button"
          onClick={() => {
            if (remove()) close();
          }}
        >
          <Icon name="trash" size={17} />
          このセットを削除
        </button>
        <p className="small-note">削除後は「元に戻す」で取り消せます。</p>
      </form>
    </Modal>
  );
}
