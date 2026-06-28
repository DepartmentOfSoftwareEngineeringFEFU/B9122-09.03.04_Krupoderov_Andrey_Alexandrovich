export type VariableType = "vector" | "point";

export const DEFAULT_RANGE = { min: -5, max: 5 };

export interface Coordinate {
  x: number;
  y: number;
}

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  coordinates: Coordinate | Coordinate[];
  // Новое поле для редактируемых названий
  coordLabels?: string[]; // например: ["a1", "a2"] или ["p"]
  generationParams?: Record<string, { min: number; max: number }>;
}

export type ObjectType = "person" | "plane" | "vector";

export interface CanvasObject {
  id: string;
  type: ObjectType;
  attachedTo: string; // id переменной (вектора)
  attachedToPoint: "start" | "end"; // к какой точке привязан
  // Необязательные свободные координаты (используются как запасной вариант)
  x?: number;
  y?: number;
}

// ====================== ОПЕРАЦИИ НАД ВЕКТОРАМИ ======================
// Тип выбранной операции варианта/задачи.
export type VectorOperation =
  | "add" // сложение векторов
  | "subtract" // вычитание векторов
  | "scalar" // умножение на скаляр (нужно дополнительное число)
  | "length" // длина вектора
  | "dot"; // скалярное произведение

export interface Task {
  id: string;
  title: string;
  description: string;
  variables: Variable[];
  canvasObjects: CanvasObject[];
  // Выбранная операция (необязательно). Хранится вместе с задачей.
  operation?: VectorOperation | null;
  // Скаляр для операции "умножение на скаляр".
  scalar?: number | null;
  createdAt: string;
}

export interface GeneratedVariant {
  id: string;
  taskId: string; // id родительской задачи
  variantNumber: number;
  description: string;
  variables: Variable[];
  canvasObjects: CanvasObject[];
  // Операция переносится из задачи в вариант, чтобы можно было пересчитать ответ.
  operation?: VectorOperation | null;
  scalar?: number | null;
  // Уже вычисленный ответ операции (строка для отображения).
  answer?: string | null;
  createdAt: string;
}

// ====================== РАБОТЫ (контрольные / самостоятельные) ======================
export type WorkType = "control" | "independent";

export interface Work {
  id: string;
  name: string;
  type: WorkType;
  taskIds: string[];
  createdAt: string;
}

export interface WorkVariantTask {
  taskId: string;
  title: string;
  description: string;
  variables: Variable[];
  canvasObjects: CanvasObject[];
}

export interface WorkVariant {
  id: string;
  workId: string;
  variantNumber: number;
  tasks: WorkVariantTask[];
  createdAt: string;
}
