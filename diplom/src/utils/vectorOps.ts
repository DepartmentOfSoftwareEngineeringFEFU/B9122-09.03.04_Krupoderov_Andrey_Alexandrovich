import { Variable, VectorOperation, Coordinate } from "../types";

// Список операций для кнопок (в нужном порядке).
export const OPERATIONS: {
  id: VectorOperation;
  label: string;
  // Сколько векторов нужно для операции.
  vectorsNeeded: number;
  needsScalar?: boolean;
}[] = [
  { id: "add", label: "Сложение", vectorsNeeded: 2 },
  { id: "subtract", label: "Вычитание", vectorsNeeded: 2 },
  {
    id: "scalar",
    label: "Умножение на скаляр",
    vectorsNeeded: 1,
    needsScalar: true,
  },
  { id: "length", label: "Длина вектора", vectorsNeeded: 1 },
  { id: "dot", label: "Скалярное произведение", vectorsNeeded: 2 },
];

export interface VectorValue {
  name: string;
  x: number;
  y: number;
}

// Превращаем переменную-вектор в его координаты (конец минус начало).
export function getVectorValues(variables: Variable[]): VectorValue[] {
  return variables
    .filter((v) => v.type === "vector" && Array.isArray(v.coordinates))
    .map((v) => {
      const coords = v.coordinates as Coordinate[];
      const s = coords[0] ?? { x: 0, y: 0 };
      const e = coords[1] ?? { x: 0, y: 0 };
      return { name: v.name, x: e.x - s.x, y: e.y - s.y };
    });
}

// Строит вектор из первых двух точек:
// первая созданная точка — начало, вторая — конец.
export function getPointVector(variables: Variable[]): VectorValue | null {
  const points = variables.filter(
    (v) => v.type === "point" && !Array.isArray(v.coordinates),
  );
  const p1 = points[0];
  const p2 = points[1];
  if (!p1 || !p2) return null;
  const c1 = p1.coordinates as Coordinate;
  const c2 = p2.coordinates as Coordinate;
  const l1 = p1.coordLabels?.[0] || p1.name;
  const l2 = p2.coordLabels?.[0] || p2.name;
  return { name: `${l1}${l2}`, x: c2.x - c1.x, y: c2.y - c1.y };
}

// Аккуратно форматируем число (без лишних нулей).
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export interface OperationResult {
  ok: boolean;
  // Готовая строка для отображения, например "a + b = (3; 5)".
  text: string;
}

/**
 * Вычисляет результат выбранной операции над векторами задачи.
 * Для длины и умножения на скаляр, если векторов нет, используется вектор из двух точек.
 */
export function computeOperationResult(
  variables: Variable[],
  operation: VectorOperation | null | undefined,
  scalar?: number | null,
): OperationResult | null {
  if (!operation) return null;

  const meta = OPERATIONS.find((o) => o.id === operation);
  if (!meta) return null;

  const vectors = getVectorValues(variables);
  // Для длины и умножения на скаляр можно собрать вектор из двух точек.
  const usesPoints = operation === "length" || operation === "scalar";
  const pointVector = getPointVector(variables);
  const opVectors =
    usesPoints && pointVector ? [...vectors, pointVector] : vectors;

  if (opVectors.length < meta.vectorsNeeded) {
    return {
      ok: false,
      text: usesPoints
        ? "Нужен вектор или хотя бы две точки"
        : meta.vectorsNeeded === 1
          ? "Для этой операции нужен хотя бы один вектор"
          : "Для этой операции нужны минимум два вектора",
    };
  }

  const a = opVectors[0] ?? { name: "a", x: 0, y: 0 };
  const b = opVectors[1] ?? { name: "b", x: 0, y: 0 };

  switch (operation) {
    case "add":
      return {
        ok: true,
        text: `${a.name} + ${b.name} = (${fmt(a.x + b.x)}; ${fmt(a.y + b.y)})`,
      };
    case "subtract":
      return {
        ok: true,
        text: `${a.name} − ${b.name} = (${fmt(a.x - b.x)}; ${fmt(a.y - b.y)})`,
      };
    case "scalar": {
      const k =
        typeof scalar === "number" && !Number.isNaN(scalar) ? scalar : 0;
      // Умножение на скаляр для каждого вектора (включая вектор из точек).
      const parts = opVectors.map(
        (v) => `${fmt(k)} · ${v.name} = (${fmt(k * v.x)}; ${fmt(k * v.y)})`,
      );
      return { ok: true, text: parts.join(",  ") };
    }
    case "length": {
      // Длина каждого вектора (включая вектор из точек).
      const parts = opVectors.map(
        (v) => `|${v.name}| = ${fmt(Math.sqrt(v.x * v.x + v.y * v.y))}`,
      );
      return { ok: true, text: parts.join(",  ") };
    }
    case "dot":
      return {
        ok: true,
        text: `${a.name} · ${b.name} = ${fmt(a.x * b.x + a.y * b.y)}`,
      };
    default:
      return null;
  }
}
