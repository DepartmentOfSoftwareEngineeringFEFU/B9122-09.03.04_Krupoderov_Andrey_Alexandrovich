import { useState, useEffect } from "react";
import { ArrowRight, Save, Edit3 } from "lucide-react";
import VariableInput from "./VariableInput";
import CoordinatePlane from "./CoordinatePlane";
import GenerationParams from "./GenerationParams";
import {
  Variable,
  CanvasObject,
  Task,
  GeneratedVariant,
  VectorOperation,
} from "../types";
import { OPERATIONS, computeOperationResult } from "../utils/vectorOps";

interface Props {
  onSaveTask: (task: Task) => void;
  currentTask?: Task | null;
  currentVariant?: GeneratedVariant | null;
  tasks: Task[];
}

export default function TaskDescription({
  onSaveTask,
  currentTask,
  currentVariant,
  tasks,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);

  // Выбранная операция и скаляр
  const [operation, setOperation] = useState<VectorOperation | null>(null);
  const [scalar, setScalar] = useState<number>(2);

  const [showAttachModal, setShowAttachModal] = useState(false);
  const [pendingType, setPendingType] = useState<"person" | "plane" | null>(
    null,
  );
  const [error, setError] = useState<string>("");

  const isVariant = !!currentVariant;
  const isReadOnly = (!!currentTask && !isEditing) || isVariant;
  const hasVariables = variables.length > 0;

  // Ответ пересчитывается на лету: и в режиме редактирования (перерасчёт),
  // и при просмотре сохранённого варианта.
  const result = computeOperationResult(variables, operation, scalar);

  const getTaskTitle = () => {
    if (isVariant && currentVariant) {
      return `Описание задачи — Вариант ${currentVariant.variantNumber}`;
    }
    return "Описание задачи";
  };

  const getCoordinatesText = () => {
    if (variables.length === 0) return "";
    return variables
      .map((v) => {
        if (v.type === "vector" && Array.isArray(v.coordinates)) {
          const [p1, p2] = v.coordinates;
          return `${v.name}1 = (${p1.x}, ${p1.y}), ${v.name}2 = (${p2.x}, ${p2.y})`;
        } else {
          const p = v.coordinates as any;
          return `${v.name} = (${p.x}, ${p.y})`;
        }
      })
      .join("\n");
  };

  const openAttachModal = (type: "person" | "plane") => {
    if (variables.filter((v) => v.type === "vector").length === 0) {
      setError("Сначала добавьте хотя бы один вектор");
      return;
    }
    setPendingType(type);
    setShowAttachModal(true);
  };

  const addObject = (type: "person" | "plane") => {
    openAttachModal(type);
  };

  const handleAttachObject = (vectorId: string, point: "start" | "end") => {
    if (!pendingType) return;

    const newObj: CanvasObject = {
      id: Date.now().toString(),
      type: pendingType,
      attachedTo: vectorId,
      attachedToPoint: point,
    };

    setCanvasObjects((prev) => [...prev, newObj]);
    setShowAttachModal(false);
    setPendingType(null);
  };

  const handleDelete = (id: string) => {
    setCanvasObjects((prev) => prev.filter((o) => o.id !== id));
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    if (!taskText.trim()) {
      setError("Пожалуйста, заполните описание задачи");
      return;
    }

    const coordinatesText = getCoordinatesText();

    const newTask: Task = {
      id: currentTask?.id || Date.now().toString(),
      title: currentTask?.title || `Задача ${tasks.length + 1}`,
      description:
        taskText +
        (coordinatesText ? `\n\nКоординаты:\n${coordinatesText}` : ""),
      variables,
      canvasObjects,
      operation,
      scalar: operation === "scalar" ? scalar : null,
      createdAt: new Date().toISOString(),
    };

    onSaveTask(newTask);
    setIsEditing(false);
    setError("");
  };

  const startEditing = () => {
    if (isVariant) return;
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskText(e.target.value);
    if (error) setError("");
  };

  const toggleOperation = (op: VectorOperation) => {
    setOperation((prev) => (prev === op ? null : op));
  };

  useEffect(() => {
    if (currentVariant) {
      const parts = currentVariant.description.split("\n\nКоординаты:\n");
      setTaskText(parts[0] || "");
      setVariables([...currentVariant.variables]);
      setCanvasObjects([...currentVariant.canvasObjects]);
      setOperation(currentVariant.operation ?? null);
      setScalar(
        typeof currentVariant.scalar === "number" ? currentVariant.scalar : 2,
      );
      setIsEditing(false);
    } else if (currentTask) {
      const parts = currentTask.description.split("\n\nКоординаты:\n");
      setTaskText(parts[0]);
      setVariables([...currentTask.variables]);
      setCanvasObjects([...(currentTask.canvasObjects || [])]);
      setOperation(currentTask.operation ?? null);
      setScalar(
        typeof currentTask.scalar === "number" ? currentTask.scalar : 2,
      );
      setIsEditing(false);
    } else {
      setTaskText("");
      setVariables([]);
      setCanvasObjects([]);
      setOperation(null);
      setScalar(2);
      setIsEditing(false);
    }
    setError("");
  }, [currentTask, currentVariant]);

  return (
    <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-[#f8f5f0] to-[#F0E7D5]">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Описание задачи */}
        <div className="bg-[#F0E7D5] border border-[#212842]/10 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-[#212842]">
              {getTaskTitle()}
            </h2>
            {currentTask && !isVariant && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#212842] text-white rounded-2xl hover:bg-black transition"
              >
                <Edit3 size={18} /> Редактировать
              </button>
            )}
          </div>

          <textarea
            value={taskText}
            onChange={handleTextChange}
            placeholder="Заданы векторы a и b..."
            className="w-full h-40 p-5 bg-white rounded-2xl border border-gray-300 focus:border-[#212842] resize-none focus:outline-none"
            disabled={isReadOnly}
          />

          {error && (
            <div className="mt-4 bg-red-50 border border-red-300 text-red-700 px-5 py-3 rounded-2xl flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-medium text-xl leading-none"
              >
                ✕
              </button>
            </div>
          )}

          {isReadOnly && hasVariables && (
            <div className="mt-6 pt-6 border-t border-[#212842]/10">
              <h4 className="font-medium text-[#212842] mb-3">Координаты:</h4>
              <pre className="whitespace-pre-wrap bg-white p-5 rounded-2xl text-sm font-mono text-gray-700 leading-relaxed">
                {variables
                  .map((v) => {
                    if (v.type === "vector" && Array.isArray(v.coordinates)) {
                      const [p1, p2] = v.coordinates;
                      const label1 = v.coordLabels?.[0] || `${v.name}1`;
                      const label2 = v.coordLabels?.[1] || `${v.name}2`;
                      return `${label1} = (${p1.x}, ${p1.y}), ${label2} = (${p2.x}, ${p2.y})`;
                    } else {
                      const p = v.coordinates as any;
                      const label = v.coordLabels?.[0] || v.name;
                      return `${label} = (${p.x}, ${p.y})`;
                    }
                  })
                  .join("\n")}
              </pre>
            </div>
          )}
        </div>

        {/* Переменные и координаты */}
        {!isReadOnly && (
          <div>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-[#212842]">
              Переменные и координаты
              <ArrowRight className="w-6 h-6" />
            </h3>
            <VariableInput
              variables={variables}
              onChange={setVariables}
              readOnly={isReadOnly}
            />
          </div>
        )}

        {/* Операция над векторами — только при создании/редактировании */}
        {!isReadOnly && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-[#212842]">
              Операция
            </h3>
            <div className="flex flex-wrap gap-3">
              {OPERATIONS.map((op) => {
                const active = operation === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => toggleOperation(op.id)}
                    className={`px-5 py-3 rounded-2xl border font-medium transition ${
                      active
                        ? "bg-[#212842] text-white border-[#212842]"
                        : "bg-white text-[#212842] border-gray-300 hover:border-[#212842]"
                    }`}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>

            {/* Дополнительное поле скаляра */}
            {operation === "scalar" && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-[#212842] font-medium">Скаляр:</label>
                <input
                  type="number"
                  value={scalar}
                  onChange={(e) => setScalar(parseFloat(e.target.value) || 0)}
                  className="w-40 px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#212842]"
                />
              </div>
            )}
          </div>
        )}

        {/* Построение поля */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-[#212842]">
            Построение поля
          </h3>
          <div className="flex gap-6">
            <div className="flex-1">
              <CoordinatePlane
                variables={variables}
                objects={canvasObjects}
                onDelete={handleDelete}
                readOnly={isReadOnly}
                width={isReadOnly ? 1030 : 885}
                height={isReadOnly ? 720 : 680}
              />
            </div>

            {/* Панель добавления объектов */}
            {!isReadOnly && (
              <div className="w-32 bg-[#212842] text-white rounded-3xl p-6 flex flex-col items-center gap-8">
                <div className="text-sm font-medium text-center">Выбрать:</div>
                <button
                  onClick={() => addObject("person")}
                  className="text-6xl hover:scale-125 transition-all"
                  title="Человечек"
                >
                  👤
                </button>
                <button
                  onClick={() => addObject("plane")}
                  className="text-6xl hover:scale-125 transition-all"
                  title="Самолёт"
                >
                  ✈️
                </button>
                <button
                  onClick={() => {
                    const name = `v${variables.length + 1}`;
                    const newVar: Variable = {
                      id: Date.now().toString(),
                      name,
                      type: "vector",
                      coordinates: [
                        { x: 1, y: 1 },
                        { x: 4, y: 3 },
                      ],
                      coordLabels: [`${name}1`, `${name}2`],
                    };
                    setVariables((prev) => [...prev, newVar]);
                  }}
                  className="text-5xl hover:scale-125 transition-all"
                  title="Вектор"
                >
                  ↗
                </button>
              </div>
            )}
          </div>

          {/* Плашка с ответом под графическим полем */}
          {operation && result && (
            <div
              className={`mt-6 rounded-2xl p-5 border ${
                result.ok
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "bg-yellow-50 border-yellow-300 text-yellow-800"
              }`}
            >
              <div className="text-sm uppercase tracking-wide opacity-70 mb-1">
                Ответ
              </div>
              <div className="text-lg font-semibold font-mono">
                {result.text}
              </div>
            </div>
          )}
        </div>

        {/* Параметры генерации */}
        {!isReadOnly && hasVariables && (
          <GenerationParams
            variables={variables}
            onChange={setVariables}
            readOnly={isReadOnly}
          />
        )}

        {/* Кнопка сохранения */}
        {!isReadOnly && (
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#212842] hover:bg-black text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-3 transition"
          >
            <Save size={26} />
            Сохранить задачу
          </button>
        )}

        {/* Модальное окно выбора позиции */}
        {showAttachModal && pendingType && (
          <div className="absolute top-4 right-4 bg-white border border-[#212842] rounded-2xl shadow-xl p-6 z-50 w-80">
            <p className="font-medium mb-5 text-lg">
              Куда поставить{" "}
              {pendingType === "person" ? "человечка" : "самолёт"}?
            </p>

            <div className="space-y-3 max-h-96 overflow-auto">
              {variables
                .filter((v) => v.type === "vector")
                .map((vec) => (
                  <div
                    key={vec.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition"
                  >
                    <p className="font-semibold mb-3 text-[#212842]">
                      {vec.name}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAttachObject(vec.id, "start")}
                        className="py-3 border border-gray-300 rounded-xl hover:bg-[#212842] hover:text-white transition"
                      >
                        В начале
                      </button>
                      <button
                        onClick={() => handleAttachObject(vec.id, "end")}
                        className="py-3 border border-gray-300 rounded-xl hover:bg-[#212842] hover:text-white transition"
                      >
                        В конце
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => {
                setShowAttachModal(false);
                setPendingType(null);
              }}
              className="mt-4 w-full py-3 text-gray-500 hover:text-gray-700 font-medium"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
