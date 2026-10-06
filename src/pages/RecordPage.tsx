import { useState } from "react";
import type { useDrafts } from "../hooks/useDrafts";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import {
  displayDate,
  getWeekDates,
  latestSet,
  LIMITS,
  setLabel,
  type Exercise,
  type Store,
  type TrainingSet,
} from "../lib/model";

type Props = {
  data: Store;
  today: string;
  blocked: boolean;
  update: (f: (s: Store) => Store) => boolean;
  openPicker: () => void;
  select: (id: string) => boolean;
  drafts: ReturnType<typeof useDrafts>;
  dateOverride: string;
  setDateOverride: (date: string) => void;
  edit: (set: TrainingSet) => void;
  saved: (set: TrainingSet, isPersonalBest: boolean) => void;
  timer: {
    remaining: number;
    finished: boolean;
    start: (s: number) => void;
    stop: () => void;
  };
};
export function RecordPage(props: Props) {
  const { data, today, timer, update } = props;
  const { dateOverride, setDateOverride } = props;
  const date = dateOverride || today;
  const exercise =
    data.exercises.find((e) => e.id === data.selectedId) ?? data.exercises[0];
  const daySets = data.sets.filter((s) => s.date === date);
  const activeDates = new Set(data.sets.map((s) => s.date));
  const recentExercises = data.exercises
    .filter((e) => !e.hidden)
    .sort(
      (a, b) =>
        (latestSet(data.sets, b.id)?.createdAt ?? 0) -
        (latestSet(data.sets, a.id)?.createdAt ?? 0),
    )
    .slice(0, 4);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR DAILY PRACTICE</p>
          <h1>
            今日のトレーニング<span className="heading-dot">.</span>
          </h1>
          <p className="subtitle">ひとつずつ、昨日の自分を超えていこう。</p>
        </div>
      </div>
      <section className="week-strip" aria-label="今週のトレーニング">
        <div className="week-summary">
          <span className="mini-label">THIS WEEK</span>
          <p>
            <strong>
              {getWeekDates(today).filter((d) => activeDates.has(d)).length}
            </strong>
            <span>日トレーニング</span>
          </p>
        </div>
        <div className="week-days">
          {getWeekDates(today).map((d, i) => (
            <div
              className={`week-day ${d === today ? "is-today" : ""}`}
              key={d}
            >
              <span>{["月", "火", "水", "木", "金", "土", "日"][i]}</span>
              <span
                className={`day-circle ${activeDates.has(d) ? "done" : ""}`}
              >
                {activeDates.has(d) ? (
                  <Icon name="check" size={16} />
                ) : (
                  Number(d.slice(-2))
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="record-layout">
        <div className="record-main">
          <section className="panel record-panel">
            <div className="section-heading">
              <span className="section-label">セットを記録</span>
              <label className="date-control">
                <Icon name="history" size={16} />
                <input
                  type="date"
                  aria-label="記録する日付"
                  max={today}
                  value={date}
                  onChange={(e) => {
                    if (e.target.value && e.target.value <= today)
                      setDateOverride(
                        e.target.value === today ? "" : e.target.value,
                      );
                  }}
                />
              </label>
            </div>
            <button className="exercise-select" onClick={props.openPicker}>
              <span className="exercise-symbol large">
                <Icon name="dumbbell" size={27} />
              </span>
              <span className="exercise-title">
                <small>
                  {exercise.group} /{" "}
                  {exercise.kind === "time"
                    ? "時間"
                    : exercise.kind === "bodyweight"
                      ? "自重"
                      : "ウエイト"}
                </small>
                <strong>{exercise.name}</strong>
              </span>
              <Icon name="chevron" />
            </button>
            <div className="quick-exercises" aria-label="よく使う種目">
              {recentExercises.map((e) => (
                <button
                  key={e.id}
                  className={exercise.id === e.id ? "active" : ""}
                  onClick={() => props.select(e.id)}
                >
                  {e.name}
                </button>
              ))}
            </div>
            <SetForm
              key={`${exercise.id}-${date}`}
              exercise={exercise}
              date={date}
              data={data}
              blocked={props.blocked}
              update={update}
              saved={props.saved}
              drafts={props.drafts}
            />
          </section>
          <section className="rest-panel" aria-label="休憩タイマー">
            <div className="rest-title">
              <Icon name="clock" />
              <div>
                <strong>休憩タイマー</strong>
                <span aria-live="polite">
                  {timer.finished
                    ? "休憩終了。次のセットへ！"
                    : timer.remaining
                      ? "次のセットまで、ひと休み。"
                      : "セットを記録するとスタート"}
                </span>
              </div>
            </div>
            <div className="rest-options">
              {[0, 60, 90, 120, 180].map((s) => (
                <button
                  key={s}
                  className={data.restSeconds === s ? "active" : ""}
                  onClick={() => {
                    if (update((state) => ({ ...state, restSeconds: s }))) {
                      if (timer.remaining) timer.start(s);
                    }
                  }}
                >
                  {s === 0 ? "OFF" : `${s}秒`}
                </button>
              ))}
            </div>
            {(timer.remaining > 0 || timer.finished) && (
              <div className="timer-live">
                <strong role="timer">
                  {Math.floor(timer.remaining / 60)}:
                  {String(timer.remaining % 60).padStart(2, "0")}
                </strong>
                <button className="text-button" onClick={timer.stop}>
                  終了
                </button>
              </div>
            )}
          </section>
          <p className="local-note">
            <Icon name="check" size={15} />
            記録はこのブラウザに自動保存されます
          </p>
        </div>
        <section className="panel today-panel">
          <div className="section-heading">
            <h2>
              {date === today ? "今日の記録" : `${displayDate(date)}の記録`}
            </h2>
            <span className="count-badge">{daySets.length} SETS</span>
          </div>
          {daySets.length ? (
            <>
              <div className="today-stats">
                <div>
                  <strong>
                    {new Set(daySets.map((s) => s.exerciseId)).size}
                  </strong>
                  <span>種目</span>
                </div>
                <div>
                  <strong>{daySets.length}</strong>
                  <span>セット</span>
                </div>
                <div>
                  <strong>{daySets.reduce((n, s) => n + s.reps, 0)}</strong>
                  <span>合計回数</span>
                </div>
              </div>
              <div className="today-list">
                {[...new Set(daySets.map((s) => s.exerciseId))].map((id) => {
                  const ex = data.exercises.find((e) => e.id === id)!;
                  const sets = daySets
                    .filter((s) => s.exerciseId === id)
                    .sort((a, b) => a.createdAt - b.createdAt);
                  return (
                    <div className="today-exercise" key={id}>
                      <h3>
                        <span className="tiny-dot" />
                        {ex.name}
                      </h3>
                      {sets.map((s, i) => (
                        <button
                          className="set-row"
                          key={s.id}
                          onClick={() => props.edit(s)}
                          aria-label={`${ex.name} ${i + 1}セット目 ${setLabel(s, ex.kind)}を編集`}
                        >
                          <span className="set-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{setLabel(s, ex.kind)}</span>
                          <Icon name="edit" size={16} />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="edit-hint">記録をタップすると編集できます</p>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="record" size={34} />
              </span>
              <h3>最初の1セットから。</h3>
              <p>
                終わったセットを記録すると、
                <br />
                ここに今日の積み重ねが並びます。
              </p>
              <span className="empty-line" />
            </div>
          )}
        </section>
      </div>
      <div className="quiet-banner">
        <Icon name="leaf" size={21} />
        <span>小さな積み重ねが、大きな変化になる。</span>
        <span className="mini-label">KEEP GOING</span>
      </div>
    </>
  );
}
function SetForm({
  exercise,
  date,
  data,
  blocked,
  update,
  saved,
  drafts,
}: Pick<Props, "data" | "blocked" | "update" | "saved" | "drafts"> & {
  exercise: Exercise;
  date: string;
}) {
  const latest = latestSet(
    data.sets.filter((s) => s.date <= date),
    exercise.id,
  );
  const previous = latestSet(data.sets, exercise.id, date);
  const draftKey = `${exercise.id}:${date}`;
  const { weight, reps, seconds } = drafts.values[draftKey] ?? {
    weight: String(latest?.weight ?? 20),
    reps: String(latest?.reps ?? 10),
    seconds: String(latest?.seconds || 30),
  };
  const change = (field: "weight" | "reps" | "seconds", value: string) =>
    drafts.set(draftKey, { weight, reps, seconds, [field]: value });
  const setWeight = (v: string) => change("weight", v);
  const setReps = (v: string) => change("reps", v);
  const setSeconds = (v: string) => change("seconds", v);
  const [error, setError] = useState("");
  const count = data.sets.filter(
    (s) => s.exerciseId === exercise.id && s.date === date,
  ).length;
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
  const restorePrevious = () => {
    if (previous) {
      drafts.set(draftKey, {
        weight: String(previous.weight),
        reps: String(previous.reps),
        seconds: String(previous.seconds),
      });
      setError("");
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) {
          setError(
            exercise.kind === "time"
              ? "時間は1〜86,400秒の整数で入力してください。"
              : "重量は0〜1,000kg、回数は1〜999回の整数で入力してください。",
          );
          return;
        }
        if (data.sets.length >= LIMITS.sets) {
          setError(
            "記録が上限に達しました。バックアップを保存してから整理してください。",
          );
          return;
        }
        const set: TrainingSet = {
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          date,
          weight: exercise.kind === "weight" ? Number(weight) : 0,
          reps: exercise.kind === "time" ? 0 : Number(reps),
          seconds: exercise.kind === "time" ? Number(seconds) : 0,
          createdAt: Date.now(),
        };
        const allPrevious = data.sets.filter(
          (s) => s.exerciseId === exercise.id && s.date <= date,
        );
        const metric =
          exercise.kind === "weight"
            ? "weight"
            : exercise.kind === "time"
              ? "seconds"
              : "reps";
        const personalBest =
          allPrevious.length > 0 &&
          set[metric] >
            allPrevious.reduce((best, s) => Math.max(best, s[metric]), 0);
        if (update((s) => ({ ...s, sets: [...s.sets, set] }))) {
          drafts.remove(draftKey);
          setError("");
          saved(set, personalBest);
        }
      }}
    >
      <div className="previous-record">
        <span>前回</span>
        {previous ? (
          <>
            <strong>{setLabel(previous, exercise.kind)}</strong>
            <small>{displayDate(previous.date)}</small>
            <button type="button" onClick={restorePrevious}>
              数値を使う
            </button>
          </>
        ) : (
          <span className="muted">記録すると、次回から表示されます</span>
        )}
      </div>
      <div
        className={`input-grid ${exercise.kind !== "weight" ? "single" : ""}`}
      >
        {exercise.kind === "weight" && (
          <Stepper
            label="重量"
            value={weight}
            change={setWeight}
            unit="kg"
            step={2.5}
            max={LIMITS.weight}
          />
        )}
        {exercise.kind !== "time" && (
          <Stepper
            label="回数"
            value={reps}
            change={setReps}
            unit="回"
            step={1}
            min={1}
            max={LIMITS.reps}
          />
        )}
        {exercise.kind === "time" && (
          <Stepper
            label="時間"
            value={seconds}
            change={setSeconds}
            unit="秒"
            step={5}
            min={1}
            max={LIMITS.seconds}
          />
        )}
      </div>
      <p className="input-tip">
        ± で調整。数値をタップして直接入力もできます。
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="primary save-set" type="submit" disabled={blocked}>
        <Icon name="check" size={22} />
        <span>1セット記録する</span>
        <span className="next-set">{count + 1} SET</span>
      </button>
      <p className="save-caption">次のセットも、この数値でさっと記録。</p>
    </form>
  );
}
