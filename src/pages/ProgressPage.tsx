import { useState } from "react";
import { Icon } from "../components/Icon";
import { TrendChart } from "../components/TrendChart";
import {
  aggregate,
  displayDate,
  shiftDate,
  setLabel,
  type Metric,
  type Store,
} from "../lib/model";
export function ProgressPage({
  data,
  today,
  goRecord,
  demo = false,
}: {
  data: Store;
  today: string;
  goRecord: (exerciseId: string) => void;
  demo?: boolean;
}) {
  const [exerciseId, setExerciseId] = useState(data.selectedId);
  const [metric, setMetric] = useState<Metric>("weight");
  const [period, setPeriod] = useState(90);
  const exercise =
    data.exercises.find((e) => e.id === exerciseId) ?? data.exercises[0];
  const effectiveMetric =
    exercise.kind === "time"
      ? "seconds"
      : exercise.kind === "bodyweight"
        ? "reps"
        : metric === "weight" || metric === "volume"
          ? metric
          : "weight";
  const unit =
    effectiveMetric === "weight"
      ? "kg"
      : effectiveMetric === "volume"
        ? "kg・回"
        : effectiveMetric === "seconds"
          ? "秒"
          : "回";
  const label =
    effectiveMetric === "weight"
      ? "最高重量"
      : effectiveMetric === "volume"
        ? "総負荷"
        : effectiveMetric === "seconds"
          ? "最長時間"
          : "最多回数";
  const allPoints = aggregate(
    data.sets.filter((s) => s.date <= today),
    exercise.id,
    effectiveMetric,
  );
  const points = allPoints.filter(
    (p) => !period || p.date >= shiftDate(today, -(period - 1)),
  );
  const latestPoint = allPoints.at(-1);
  const previousPoint = allPoints.at(-2);
  const difference =
    latestPoint && previousPoint
      ? latestPoint.value - previousPoint.value
      : null;
  const bestPoint = allPoints.reduce<typeof latestPoint>(
    (best, point) => (!best || point.value > best.value ? point : best),
    undefined,
  );
  const previousSession =
    latestPoint?.date === today ? previousPoint : latestPoint;
  const previousSets = data.sets
    .filter(
      (s) => s.exerciseId === exercise.id && s.date === previousSession?.date,
    )
    .sort((a, b) => a.createdAt - b.createdAt);
  const improvement =
    points.length > 1 ? points.at(-1)!.value - points[0].value : null;
  const totalDays = new Set(
    data.sets.filter((s) => s.date <= today).map((s) => s.date),
  ).size;
  const thisMonth = new Set(
    data.sets
      .filter((s) => s.date.startsWith(today.slice(0, 7)) && s.date <= today)
      .map((s) => s.date),
  ).size;
  const trainingDates = new Set(data.sets.map((s) => s.date));
  const calendar = Array.from({ length: 28 }, (_, i) =>
    shiftDate(today, i - 27),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SMALL STEPS, REAL PROGRESS</p>
          <h1>
            成長を見る<span className="heading-dot">.</span>
          </h1>
          <p className="subtitle">続けてきたことが、ちゃんと見える。</p>
        </div>
        <span className="header-icon">
          <Icon name="chart" size={28} />
        </span>
      </div>
      <div className="progress-stats">
        <div className="stat-card">
          <span>累計トレーニング</span>
          <p>
            {totalDays}
            <small>日</small>
          </p>
          <Icon name="dumbbell" />
        </div>
        <div className="stat-card">
          <span>今月のトレーニング</span>
          <p>
            {thisMonth}
            <small>日</small>
          </p>
          <Icon name="history" />
        </div>
        <div className="stat-card">
          <span>積み重ねたセット</span>
          <p>
            {data.sets.filter((s) => s.date <= today).length}
            <small>セット</small>
          </p>
          <Icon name="record" />
        </div>
      </div>
      <section className="panel progress-panel">
        <div className="section-heading">
          <h2>種目ごとの成長</h2>
          <span className="mini-label">YOUR PROGRESS</span>
        </div>
        <div className="graph-controls">
          <label className="field-label">
            <span className="sr-only">グラフの種目</span>
            <select
              aria-label="グラフの種目"
              value={exercise.id}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {data.exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.hidden ? "（非表示）" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="segmented" aria-label="グラフの期間">
            {[
              [30, "1か月"],
              [90, "3か月"],
              [0, "すべて"],
            ].map(([v, label]) => (
              <button
                key={v}
                className={period === v ? "active" : ""}
                onClick={() => setPeriod(Number(v))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {exercise.kind === "weight" && (
          <div className="metric-tabs">
            <button
              className={effectiveMetric === "weight" ? "active" : ""}
              onClick={() => setMetric("weight")}
            >
              最高重量
            </button>
            <button
              className={effectiveMetric === "volume" ? "active" : ""}
              onClick={() => setMetric("volume")}
            >
              総負荷
            </button>
          </div>
        )}
        {points.length ? (
          <>
            <TrendChart
              key={`${exercise.id}-${effectiveMetric}-${period}`}
              points={points}
              unit={unit}
              label={label}
            />
            <div className="growth-note">
              <Icon
                name={
                  improvement !== null && improvement > 0 ? "trophy" : "leaf"
                }
                size={21}
              />
              <p>
                {improvement === null ? (
                  "成長のスタート地点ができました。次の記録で変化が見えてきます。"
                ) : improvement > 0 ? (
                  <>
                    この期間の最初の記録から{" "}
                    <strong>
                      +{improvement.toLocaleString()} {unit}
                    </strong>
                    。積み重ねが力になっています。
                  </>
                ) : (
                  "記録を続けることも、ひとつの成長。自分のペースで積み重ねよう。"
                )}
              </p>
            </div>
            <p className="graph-description">
              {effectiveMetric === "volume"
                ? "総負荷 = 重量 × 回数を、同じ日の全セットで合計。"
                : `同じ日に記録したセットの${label}を表示しています。`}
            </p>
            <details className="data-details">
              <summary>グラフの数値を一覧で見る</summary>
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>
                      {label}（{unit}）
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.date}>
                      <td>{displayDate(p.date, true)}</td>
                      <td>{p.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <div className="empty-state graph-empty">
            <span className="empty-icon">
              <Icon name="chart" size={34} />
            </span>
            <h3>
              {allPoints.length
                ? "この期間の記録はありません"
                : "あなたの成長は、ここから。"}
            </h3>
            <p>
              {allPoints.length
                ? "期間を「すべて」にすると過去の記録を確認できます。"
                : `${exercise.name}を記録すると、グラフが表示されます。`}
            </p>
            {!demo && (
              <button
                className="secondary"
                disabled={Boolean(exercise.hidden)}
                onClick={() => goRecord(exercise.id)}
              >
                トレーニングを記録する
                <Icon name="chevron" size={17} />
              </button>
            )}
          </div>
        )}
      </section>
      <section
        className="panel comparison-panel"
        aria-label="前回比と自己ベスト"
      >
        <div className="section-heading">
          <h2>{exercise.name}の振り返り</h2>
        </div>
        <div className="comparison-grid">
          <div>
            <span>前回比 · {label}</span>
            <strong>
              {difference === null
                ? "比較待ち"
                : `${difference > 0 ? "+" : ""}${difference.toLocaleString()} ${unit}`}
            </strong>
            <small>
              {previousPoint && latestPoint
                ? `${displayDate(previousPoint.date)} → ${displayDate(latestPoint.date)}`
                : "2日分の記録で比較できます"}
            </small>
          </div>
          <div>
            <span>自己ベスト · {label}</span>
            <strong>
              {bestPoint
                ? `${bestPoint.value.toLocaleString()} ${unit}`
                : "記録なし"}
            </strong>
            <small>
              {bestPoint
                ? `${displayDate(bestPoint.date, true)} · 全期間`
                : "最初の記録を待っています"}
            </small>
          </div>
        </div>
        <h3>
          前回の全セット
          {previousSession
            ? ` · ${displayDate(previousSession.date, true)}`
            : ""}
        </h3>
        <p className="small-note left">
          今日の記録がある場合は、その前の記録日を表示します。
        </p>
        {previousSets.length ? (
          <ol className="previous-sets">
            {previousSets.map((set, i) => (
              <li key={set.id}>
                <span>{i + 1}セット目</span>
                <strong>{setLabel(set, exercise.kind)}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">前回の記録はまだありません。</p>
        )}
        {!demo && (
          <button
            className="secondary full"
            disabled={Boolean(exercise.hidden)}
            onClick={() => goRecord(exercise.id)}
          >
            {exercise.hidden
              ? "設定で再表示すると記録できます"
              : `${exercise.name}を記録する`}
          </button>
        )}
      </section>
      <section className="panel consistency-panel">
        <div>
          <span className="mini-label">CONSISTENCY</span>
          <h2>続けた日が、力になる。</h2>
          <p className="muted">直近28日間のトレーニング</p>
        </div>
        <div className="activity-block">
          <div className="activity-grid">
            {calendar.map((d) => (
              <span
                className={trainingDates.has(d) ? "trained" : ""}
                key={d}
                title={`${displayDate(d)} ${trainingDates.has(d) ? "トレーニング済み" : "記録なし"}`}
                aria-label={`${displayDate(d)} ${trainingDates.has(d) ? "トレーニング済み" : "記録なし"}`}
              >
                {trainingDates.has(d) && <Icon name="check" size={12} />}
              </span>
            ))}
          </div>
          <div className="activity-legend">
            <span>{displayDate(calendar[0])}</span>
            <span>
              <i />
              トレーニングした日
            </span>
            <span>今日</span>
          </div>
        </div>
      </section>
    </>
  );
}
