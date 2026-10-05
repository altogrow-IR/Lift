import { useState } from "react";
import { Icon } from "../components/Icon";
import {
  displayDate,
  setLabel,
  type Store,
  type TrainingSet,
} from "../lib/model";
export function HistoryPage({
  data,
  edit,
  goRecord,
}: {
  data: Store;
  edit: (s: TrainingSet) => void;
  goRecord: () => void;
}) {
  const [exerciseId, setExerciseId] = useState("all");
  const [month, setMonth] = useState("all");
  const [limit, setLimit] = useState(10);
  const months = [...new Set(data.sets.map((s) => s.date.slice(0, 7)))]
    .sort()
    .reverse();
  const filtered = data.sets.filter(
    (s) =>
      (exerciseId === "all" || s.exerciseId === exerciseId) &&
      (month === "all" || s.date.startsWith(month)),
  );
  const dates = [...new Set(filtered.map((s) => s.date))].sort().reverse();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVERY SET COUNTS</p>
          <h1>
            トレーニング履歴<span className="heading-dot">.</span>
          </h1>
          <p className="subtitle">これまでの、自分の頑張りを振り返る。</p>
        </div>
        <span className="header-icon">
          <Icon name="history" size={28} />
        </span>
      </div>
      <div className="history-filters">
        <select
          aria-label="履歴の種目"
          value={exerciseId}
          onChange={(e) => {
            setExerciseId(e.target.value);
            setLimit(10);
          }}
        >
          <option value="all">すべての種目</option>
          {data.exercises.map((e) => (
            <option value={e.id} key={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          aria-label="履歴の月"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setLimit(10);
          }}
        >
          <option value="all">すべての期間</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {Number(m.slice(0, 4))}年{Number(m.slice(5))}月
            </option>
          ))}
        </select>
      </div>
      <p className="result-count">
        {dates.length}日 · {filtered.length}セットの記録
      </p>
      {dates.length ? (
        <div className="history-list">
          {dates.slice(0, limit).map((date) => {
            const sets = filtered.filter((s) => s.date === date);
            return (
              <section className="panel history-day" key={date}>
                <div className="section-heading">
                  <h2>{displayDate(date, true)}</h2>
                  <span className="count-badge">{sets.length} SETS</span>
                </div>
                {[...new Set(sets.map((s) => s.exerciseId))].map((id) => {
                  const ex = data.exercises.find((e) => e.id === id)!;
                  return (
                    <div className="history-exercise" key={id}>
                      <h3>
                        <span className="tiny-dot" />
                        {ex.name}
                        <span>{ex.group}</span>
                      </h3>
                      <div className="history-sets">
                        {sets
                          .filter((s) => s.exerciseId === id)
                          .sort((a, b) => a.createdAt - b.createdAt)
                          .map((s, i) => (
                            <button
                              key={s.id}
                              onClick={() => edit(s)}
                              aria-label={`${displayDate(date)} ${ex.name} ${i + 1}セット目を編集`}
                            >
                              <span className="set-number">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <strong>{setLabel(s, ex.kind)}</strong>
                              <Icon name="edit" size={15} />
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
          {dates.length > limit && (
            <button
              className="secondary full"
              onClick={() => setLimit((n) => n + 10)}
            >
              もっと見る（残り{dates.length - limit}日）
            </button>
          )}
        </div>
      ) : (
        <section className="panel empty-state">
          <span className="empty-icon">
            <Icon name="history" size={34} />
          </span>
          <h3>
            {data.sets.length
              ? "条件に合う記録がありません"
              : "日々の記録が、あなたの履歴に。"}
          </h3>
          <p>
            {data.sets.length
              ? "種目や期間を変えて探してみてください。"
              : "まずは今日の1セットを記録してみましょう。"}
          </p>
          {!data.sets.length && (
            <button className="secondary" onClick={goRecord}>
              記録をはじめる
              <Icon name="chevron" size={17} />
            </button>
          )}
        </section>
      )}
    </>
  );
}
