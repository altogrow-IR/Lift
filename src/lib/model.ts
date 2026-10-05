export type ExerciseKind = "weight" | "bodyweight" | "time";
export type Exercise = {
  id: string;
  name: string;
  group: string;
  kind: ExerciseKind;
};
export type TrainingSet = {
  id: string;
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
  seconds: number;
  createdAt: number;
};
export type Store = {
  version: 1;
  exercises: Exercise[];
  sets: TrainingSet[];
  selectedId: string;
  restSeconds: number;
};
export type Metric = "weight" | "volume" | "reps" | "seconds";
export const STORAGE_KEY = "lift.training.v1";
export const LIMITS = {
  weight: 1000,
  reps: 999,
  seconds: 86400,
  exercises: 200,
  sets: 100000,
};
export const INITIAL_EXERCISES: Exercise[] = [
  { id: "bench", name: "ベンチプレス", group: "胸", kind: "weight" },
  { id: "squat", name: "スクワット", group: "脚", kind: "weight" },
  { id: "deadlift", name: "デッドリフト", group: "背中", kind: "weight" },
  { id: "lat", name: "ラットプルダウン", group: "背中", kind: "weight" },
  { id: "shoulder", name: "ショルダープレス", group: "肩", kind: "weight" },
  { id: "curl", name: "アームカール", group: "腕", kind: "weight" },
  { id: "pushup", name: "腕立て伏せ", group: "胸", kind: "bodyweight" },
  { id: "plank", name: "プランク", group: "体幹", kind: "time" },
];
export const freshStore = (): Store => ({
  version: 1,
  exercises: INITIAL_EXERCISES.map((e) => ({ ...e })),
  sets: [],
  selectedId: "bench",
  restSeconds: 90,
});
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && localDate(d) === value;
}
export function displayDate(date: string, full = false): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "ja-JP",
    full
      ? { year: "numeric", month: "long", day: "numeric", weekday: "short" }
      : { month: "numeric", day: "numeric" },
  );
}
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown, max: number, integer = false): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  v >= 0 &&
  v <= max &&
  (!integer || Number.isInteger(v));
const shortText = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export function parseStore(raw: string): Store {
  const v: unknown = JSON.parse(raw);
  if (
    !record(v) ||
    v.version !== 1 ||
    !Array.isArray(v.exercises) ||
    !Array.isArray(v.sets) ||
    !v.exercises.length ||
    v.exercises.length > LIMITS.exercises ||
    v.sets.length > LIMITS.sets
  )
    throw new Error("invalid store");
  const ids = new Set<string>();
  const exercises: Exercise[] = v.exercises.map((e: unknown) => {
    if (
      !record(e) ||
      !shortText(e.id, 100) ||
      ids.has(e.id) ||
      !shortText(e.name, 40) ||
      !shortText(e.group, 20) ||
      !["weight", "bodyweight", "time"].includes(String(e.kind))
    )
      throw new Error("invalid exercise");
    ids.add(e.id);
    return {
      id: e.id,
      name: e.name.trim(),
      group: e.group.trim(),
      kind: e.kind as ExerciseKind,
    };
  });
  const setIds = new Set<string>();
  const sets: TrainingSet[] = v.sets.map((s: unknown) => {
    if (
      !record(s) ||
      !shortText(s.id, 100) ||
      setIds.has(s.id) ||
      typeof s.exerciseId !== "string" ||
      !ids.has(s.exerciseId) ||
      !validDate(s.date) ||
      !finite(s.weight, LIMITS.weight) ||
      !finite(s.reps, LIMITS.reps, true) ||
      !finite(s.seconds, LIMITS.seconds, true) ||
      !finite(s.createdAt, 8640000000000000)
    )
      throw new Error("invalid set");
    const kind = exercises.find((e) => e.id === s.exerciseId)!.kind;
    if ((kind === "time" && s.seconds < 1) || (kind !== "time" && s.reps < 1))
      throw new Error("empty set");
    setIds.add(s.id);
    return {
      id: s.id,
      exerciseId: s.exerciseId,
      date: s.date,
      weight: s.weight,
      reps: s.reps,
      seconds: s.seconds,
      createdAt: s.createdAt,
    };
  });
  return {
    version: 1,
    exercises,
    sets,
    selectedId:
      typeof v.selectedId === "string" && ids.has(v.selectedId)
        ? v.selectedId
        : exercises[0].id,
    restSeconds: [0, 60, 90, 120, 180].includes(Number(v.restSeconds))
      ? Number(v.restSeconds)
      : 90,
  };
}
export function latestSet(
  sets: TrainingSet[],
  exerciseId: string,
  before?: string,
): TrainingSet | undefined {
  return sets
    .filter((s) => s.exerciseId === exerciseId && (!before || s.date < before))
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    )[0];
}
export function setLabel(
  set: Pick<TrainingSet, "weight" | "reps" | "seconds">,
  kind: ExerciseKind,
): string {
  return kind === "time"
    ? `${set.seconds} 秒`
    : kind === "bodyweight"
      ? `${set.reps} 回`
      : `${set.weight} kg × ${set.reps} 回`;
}
export function aggregate(
  sets: TrainingSet[],
  exerciseId: string,
  metric: Metric,
): { date: string; value: number }[] {
  const values = new Map<string, number>();
  for (const s of sets.filter((s) => s.exerciseId === exerciseId)) {
    const value =
      metric === "volume"
        ? s.weight * s.reps
        : metric === "weight"
          ? s.weight
          : metric === "seconds"
            ? s.seconds
            : s.reps;
    const old = values.get(s.date) ?? 0;
    values.set(
      s.date,
      metric === "volume" ? old + value : Math.max(old, value),
    );
  }
  return [...values.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
export function getWeekDates(today: string): string[] {
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const monday = shiftDate(today, -(weekday === 0 ? 6 : weekday - 1));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}
export function generateDemo(): Store {
  const state = freshStore();
  const today = localDate();
  for (let i = 0; i < 12; i++) {
    const date = shiftDate(today, -35 + i * 3);
    for (const [exerciseId, base] of [
      ["bench", 30],
      ["squat", 40],
      ["lat", 25],
    ] as const) {
      for (let j = 0; j < 3; j++)
        state.sets.push({
          id: `demo-${i}-${exerciseId}-${j}`,
          exerciseId,
          date,
          weight: base + Math.floor(i / 2) * 2.5,
          reps: 10 - j,
          seconds: 0,
          createdAt: new Date(`${date}T12:00:00`).getTime() + j,
        });
    }
  }
  return state;
}
