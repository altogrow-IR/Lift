import { describe, expect, it } from "vitest";
import {
  aggregate,
  freshStore,
  generateDemo,
  getWeekDates,
  latestSet,
  localDate,
  parseStore,
  setLabel,
  shiftDate,
  validDate,
  type Store,
  type TrainingSet,
} from "./model";

const trainingSet = (changes: Partial<TrainingSet> = {}): TrainingSet => ({
  id: "set-1",
  exerciseId: "bench",
  date: "2026-10-05",
  weight: 30,
  reps: 10,
  seconds: 0,
  createdAt: 1000,
  ...changes,
});
const withSet = (): Store => ({ ...freshStore(), sets: [trainingSet()] });
describe("日付と履歴", () => {
  it("ローカル日付をゼロ埋めして作る", () =>
    expect(localDate(new Date(2026, 0, 2, 23, 59))).toBe("2026-01-02"));
  it("月末と年末をまたいで移動する", () => {
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDate("2026-10-31", 1)).toBe("2026-11-01");
  });
  it("存在しない日付を拒否する", () => {
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2026-13-01")).toBe(false);
    expect(validDate("2026-2-01")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
  });
  it("月曜から日曜までの週を作る", () => {
    expect(getWeekDates("2026-10-05")[0]).toBe("2026-10-05");
    expect(getWeekDates("2026-10-11")[0]).toBe("2026-10-05");
    expect(getWeekDates("2026-10-11")[6]).toBe("2026-10-11");
  });
  it("入力順ではなく記録日と記録時刻から前回を探す", () => {
    const sets = [
      trainingSet({ id: "a", date: "2026-10-04", createdAt: 9999 }),
      trainingSet({ id: "b", date: "2026-10-05", createdAt: 1 }),
      trainingSet({ id: "c", date: "2026-10-05", createdAt: 2 }),
    ];
    expect(latestSet(sets, "bench")?.id).toBe("c");
    expect(latestSet(sets, "bench", "2026-10-05")?.id).toBe("a");
    expect(latestSet(sets, "squat")).toBeUndefined();
  });
});
describe("保存データの復元・検証", () => {
  it("種目・記録・設定を往復できる", () =>
    expect(parseStore(JSON.stringify(withSet()))).toEqual(withSet()));
  it("初期種目が別の状態に共有されない", () => {
    const a = freshStore();
    a.exercises[0].name = "changed";
    expect(freshStore().exercises[0].name).toBe("ベンチプレス");
  });
  it.each(["{broken", '{"version":2}', "null", "[]"])(
    "破損・未知バージョンを拒否する: %s",
    (raw) => expect(() => parseStore(raw)).toThrow(),
  );
  it("未知の選択種目と休憩時間は既定値に戻す", () => {
    const s = parseStore(
      JSON.stringify({
        ...freshStore(),
        selectedId: "missing",
        restSeconds: 999,
      }),
    );
    expect(s.selectedId).toBe("bench");
    expect(s.restSeconds).toBe(90);
  });
  it("重複する種目IDを拒否する", () => {
    const s = freshStore();
    s.exercises.push(s.exercises[0]);
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("重複するセットIDを拒否する", () => {
    const s = withSet();
    s.sets.push(s.sets[0]);
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("未登録種目のセットを拒否する", () =>
    expect(() =>
      parseStore(
        JSON.stringify({
          ...freshStore(),
          sets: [trainingSet({ exerciseId: "missing" })],
        }),
      ),
    ).toThrow());
  it.each([
    { weight: -1 },
    { weight: 1001 },
    { reps: 1.5 },
    { reps: 0 },
    { reps: 1000 },
    { date: "2026-02-30" },
    { createdAt: -1 },
  ])("不正なセットを拒否する: %j", (changes) =>
    expect(() =>
      parseStore(
        JSON.stringify({ ...freshStore(), sets: [trainingSet(changes)] }),
      ),
    ).toThrow(),
  );
  it("時間種目のゼロ秒を拒否する", () =>
    expect(() =>
      parseStore(
        JSON.stringify({
          ...freshStore(),
          sets: [trainingSet({ exerciseId: "plank", reps: 0 })],
        }),
      ),
    ).toThrow());
  it("自重・時間の記録を復元できる", () => {
    const s = {
      ...freshStore(),
      sets: [
        trainingSet({ id: "a", exerciseId: "pushup", weight: 0 }),
        trainingSet({
          id: "b",
          exerciseId: "plank",
          weight: 0,
          reps: 0,
          seconds: 45,
        }),
      ],
    };
    expect(parseStore(JSON.stringify(s))).toEqual(s);
  });
});
describe("成長の集計", () => {
  const sets = [
    trainingSet({ id: "a", date: "2026-10-04", weight: 20, reps: 10 }),
    trainingSet({ id: "b", weight: 30, reps: 8 }),
    trainingSet({ id: "c", weight: 25, reps: 12 }),
    trainingSet({ id: "d", exerciseId: "squat", weight: 50 }),
  ];
  it("1日ごとの最高重量を日付順にまとめる", () =>
    expect(aggregate(sets, "bench", "weight")).toEqual([
      { date: "2026-10-04", value: 20 },
      { date: "2026-10-05", value: 30 },
    ]));
  it("総負荷は各セットの重量×回数を合計する", () =>
    expect(aggregate(sets, "bench", "volume").at(-1)?.value).toBe(540));
  it("回数は各日の最大回数で比べる", () =>
    expect(aggregate(sets, "bench", "reps").at(-1)?.value).toBe(12));
  it("時間は各日の最長秒数で比べる", () =>
    expect(
      aggregate(
        [
          trainingSet({ exerciseId: "plank", seconds: 30 }),
          trainingSet({ id: "b", exerciseId: "plank", seconds: 45 }),
        ],
        "plank",
        "seconds",
      )[0].value,
    ).toBe(45));
  it("記録なしでは空のグラフを返す", () =>
    expect(aggregate([], "bench", "weight")).toEqual([]));
  it("種目の形式に合う記録を表示する", () => {
    expect(setLabel(trainingSet(), "weight")).toBe("30 kg × 10 回");
    expect(setLabel(trainingSet(), "bodyweight")).toBe("10 回");
    expect(setLabel(trainingSet({ seconds: 45 }), "time")).toBe("45 秒");
  });
  it("サンプルは復元可能で実データを変更しない", () => {
    expect(parseStore(JSON.stringify(generateDemo())).sets.length).toBe(108);
    expect(freshStore().sets.length).toBe(0);
  });
});
