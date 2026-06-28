import { FileDown } from "lucide-react";
import { Task, Work, WorkVariant, Variable, CanvasObject } from "../types";
import CoordinatePlane from "./CoordinatePlane";
import { computeOperationResult } from "../utils/vectorOps";
import { exportWorkVariantsToPdf } from "../utils/pdfExport";

interface Props {
  work: Work;
  tasks: Task[];
  workVariant?: WorkVariant | null;
  // Все варианты этой работы — нужны для экспорта в PDF.
  workVariants?: WorkVariant[];
}

interface DisplayTask {
  key: string;
  taskId: string;
  description: string;
  variables: Variable[];
  canvasObjects: CanvasObject[];
}

export default function WorkView({
  work,
  tasks,
  workVariant,
  workVariants = [],
}: Props) {
  // Если открыт вариант работы — показываем его задачи (с рандомизированными
  // координатами), иначе — исходные задачи работы.
  const displayTasks: DisplayTask[] = workVariant
    ? workVariant.tasks.map((t, i) => ({
        key: `${t.taskId}-${i}`,
        taskId: t.taskId,
        description: t.description,
        variables: t.variables,
        canvasObjects: t.canvasObjects || [],
      }))
    : work.taskIds
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is Task => Boolean(t))
        .map((t) => ({
          key: t.id,
          taskId: t.id,
          description: t.description,
          variables: t.variables,
          canvasObjects: t.canvasObjects || [],
        }));

  const typeLabel =
    work.type === "control" ? "Контрольная работа" : "Самостоятельная работа";

  // Варианты именно этой работы
  const variantsOfThisWork = workVariants.filter((v) => v.workId === work.id);

  // Вычисляем ответ операции для задачи (операция берётся из родительской задачи).
  const getAnswer = (task: DisplayTask): string | null => {
    const parent = tasks.find((t) => t.id === task.taskId);
    if (!parent || !parent.operation) return null;
    const res = computeOperationResult(
      task.variables,
      parent.operation,
      parent.scalar,
    );
    return res && res.ok ? res.text : null;
  };

  const handleExportPdf = () => {
    exportWorkVariantsToPdf(work, variantsOfThisWork);
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-[#f8f5f0] to-[#F0E7D5]">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Шапка работы */}
        <div className="bg-[#212842] text-[#F0E7D5] rounded-3xl p-8">
          <div className="text-sm uppercase tracking-wide opacity-70 mb-2">
            {typeLabel}
          </div>
          <h1 className="text-3xl font-bold">{work.name}</h1>
          <div className="mt-3 text-sm opacity-70">
            {workVariant
              ? `Вариант ${workVariant.variantNumber} · задач: ${displayTasks.length}`
              : `Задач в работе: ${displayTasks.length}`}
          </div>
        </div>

        {displayTasks.length === 0 && (
          <div className="bg-[#F0E7D5] border border-[#212842]/10 rounded-3xl p-8 text-center text-[#212842]/60">
            В этой работе пока нет задач или они были удалены
          </div>
        )}

        {/* Список задач — только для чтения */}
        {displayTasks.map((task, index) => {
          const descriptionText =
            task.description.split("\n\nКоординаты:\n")[0];
          const hasVariables = task.variables.length > 0;
          const answer = getAnswer(task);

          return (
            <div
              key={task.key}
              className="bg-[#F0E7D5] border border-[#212842]/10 rounded-3xl p-8 space-y-6"
            >
              <h2 className="text-2xl font-semibold text-[#212842]">
                Описание задачи {index + 1}
              </h2>

              <p className="whitespace-pre-wrap text-[#212842]/90 leading-relaxed bg-white rounded-2xl p-5">
                {descriptionText}
              </p>

              {hasVariables && (
                <div>
                  <h4 className="font-medium text-[#212842] mb-3">
                    Координаты:
                  </h4>
                  <pre className="whitespace-pre-wrap bg-white p-5 rounded-2xl text-sm font-mono text-gray-700 leading-relaxed">
                    {task.variables
                      .map((v) => {
                        if (
                          v.type === "vector" &&
                          Array.isArray(v.coordinates)
                        ) {
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

              <div>
                <CoordinatePlane
                  variables={task.variables}
                  objects={task.canvasObjects || []}
                  onDelete={() => {}}
                  readOnly
                  width={1030}
                  height={720}
                />
              </div>

              {/* Плашка с ответом под графическим полем */}
              {answer && (
                <div className="rounded-2xl p-5 border bg-green-50 border-green-300 text-green-800">
                  <div className="text-sm uppercase tracking-wide opacity-70 mb-1">
                    Ответ
                  </div>
                  <div className="text-lg font-semibold font-mono">
                    {answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Кнопка экспорта в PDF — только на самой работе, не в варианте */}
        {!workVariant && (
          <button
            onClick={handleExportPdf}
            className="w-full py-4 bg-[#212842] hover:bg-black text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-3 transition"
          >
            <FileDown size={24} />
            Сохранить в PDF
            {variantsOfThisWork.length > 0
              ? ` (вариантов: ${variantsOfThisWork.length})`
              : ""}
          </button>
        )}
      </div>
    </div>
  );
}
