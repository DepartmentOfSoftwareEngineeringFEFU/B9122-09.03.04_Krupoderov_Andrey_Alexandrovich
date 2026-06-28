import { useState } from "react";
import {
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Plus,
} from "lucide-react";
import { Task, GeneratedVariant, Work, WorkType, WorkVariant } from "../types";

interface Props {
  tasks: Task[];
  generatedVariants: GeneratedVariant[];
  works: Work[];
  workVariants: WorkVariant[];
  onCreateNew: () => void;
  onSelectTask: (task: Task) => void;
  onSelectVariant: (variant: GeneratedVariant) => void;
  onDeleteTask: (taskId: string) => void;
  onGenerateVariants: (taskId: string, count: number) => void;
  onDeleteVariant: (variantId: string) => void;
  onCreateWork: (type: WorkType, name: string, taskIds: string[]) => void;
  onDeleteWork: (workId: string) => void;
  onSelectWork: (work: Work) => void;
  onGenerateWorkVariants: (workId: string, count: number) => void;
  onSelectWorkVariant: (variant: WorkVariant) => void;
  onDeleteWorkVariant: (variantId: string) => void;
  currentTaskId?: string;
  currentVariantId?: string;
  currentWorkId?: string;
  currentWorkVariantId?: string;
}

const WORK_TYPES: { type: WorkType; label: string }[] = [
  { type: "control", label: "Контрольная работа" },
  { type: "independent", label: "Самостоятельная работа" },
];

export default function Sidebar({
  tasks,
  generatedVariants,
  works,
  workVariants,
  onCreateNew,
  onSelectTask,
  onSelectVariant,
  onDeleteTask,
  onGenerateVariants,
  onDeleteVariant,
  onCreateWork,
  onDeleteWork,
  onSelectWork,
  onGenerateWorkVariants,
  onSelectWorkVariant,
  onDeleteWorkVariant,
  currentTaskId,
  currentVariantId,
  currentWorkId,
  currentWorkVariantId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTaskForGen, setSelectedTaskForGen] = useState<string | null>(
    null,
  );
  const [variantCount, setVariantCount] = useState(5);

  // Свёрнутые задачи (у которых список вариантов скрыт)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Секция "Работы" и сворачивание списков по типам
  const [isWorksOpen, setIsWorksOpen] = useState(false);
  const [collapsedWorkTypes, setCollapsedWorkTypes] = useState<Set<WorkType>>(
    new Set(),
  );

  // Сворачивание вариантов конкретной работы
  const [collapsedWorks, setCollapsedWorks] = useState<Set<string>>(new Set());

  // Модалка генерации вариантов работы
  const [showWorkGenModal, setShowWorkGenModal] = useState(false);
  const [selectedWorkForGen, setSelectedWorkForGen] = useState<string | null>(
    null,
  );
  const [workVariantCount, setWorkVariantCount] = useState(5);

  // Модалка создания работы
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workModalType, setWorkModalType] = useState<WorkType | null>(null);
  const [workName, setWorkName] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleTaskCollapse = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleWorkType = (type: WorkType) => {
    setCollapsedWorkTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleGenerateClick = (taskId: string) => {
    setSelectedTaskForGen(taskId);
    setVariantCount(5);
    setShowGenerateModal(true);
  };

  const confirmGeneration = () => {
    if (selectedTaskForGen) {
      onGenerateVariants(selectedTaskForGen, variantCount);
    }
    setShowGenerateModal(false);
    setSelectedTaskForGen(null);
  };

  const toggleWorkCollapse = (workId: string) => {
    setCollapsedWorks((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  };

  const handleGenerateWorkClick = (workId: string) => {
    setSelectedWorkForGen(workId);
    setWorkVariantCount(5);
    setShowWorkGenModal(true);
  };

  const confirmWorkGeneration = () => {
    if (selectedWorkForGen) {
      onGenerateWorkVariants(selectedWorkForGen, workVariantCount);
    }
    setShowWorkGenModal(false);
    setSelectedWorkForGen(null);
  };

  const openWorkModal = (type: WorkType) => {
    const label = WORK_TYPES.find((w) => w.type === type)!.label;
    const n = works.filter((w) => w.type === type).length + 1;
    setWorkModalType(type);
    setWorkName(`${label} №${n}`);
    setSelectedTaskIds(new Set());
    setShowWorkModal(true);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const closeWorkModal = () => {
    setShowWorkModal(false);
    setWorkModalType(null);
    setWorkName("");
    setSelectedTaskIds(new Set());
  };

  const confirmCreateWork = () => {
    if (!workModalType || !workName.trim() || selectedTaskIds.size === 0)
      return;
    onCreateWork(workModalType, workName.trim(), Array.from(selectedTaskIds));
    closeWorkModal();
  };

  return (
    <div className="w-80 bg-[#212842] text-[#F0E7D5] h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">Векторная алгебра</h1>
      </div>

      <div className="p-4 flex-1 overflow-auto flex flex-col">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left mb-4 transition"
        >
          <PlusCircle size={22} />
          <span className="font-medium">Создать новую задачу</span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 rounded-xl text-left"
        >
          <span className="font-semibold">Мои задачи</span>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {isOpen && (
          <div className="mt-2 ml-2 space-y-1">
            {tasks.map((task) => {
              const taskVariants = generatedVariants.filter(
                (v) => v.taskId === task.id,
              );

              const isCurrentTask = currentTaskId === task.id;
              const isCollapsed = !expandedTasks.has(task.id);

              return (
                <div key={task.id} className="mb-1">
                  {/* Основная задача */}
                  <div
                    className={`group px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                      isCurrentTask ? "bg-white/20" : "hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {taskVariants.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCollapse(task.id);
                          }}
                          className="p-0.5 hover:bg-white/20 rounded transition shrink-0"
                          title={
                            isCollapsed
                              ? "Показать варианты"
                              : "Скрыть варианты"
                          }
                        >
                          {isCollapsed ? (
                            <ChevronRight size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}
                      <div
                        className="flex-1 cursor-pointer truncate"
                        onClick={() => onSelectTask(task)}
                      >
                        {task.title}
                        {taskVariants.length > 0 && (
                          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {taskVariants.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleGenerateClick(task.id)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition"
                        title="Генерировать варианты"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Список вариантов */}
                  {taskVariants.length > 0 && !isCollapsed && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {taskVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className={`group flex items-center justify-between px-4 py-2 text-sm rounded-xl cursor-pointer transition-all ${
                            currentVariantId === variant.id
                              ? "bg-white/20 font-medium"
                              : "hover:bg-white/10"
                          }`}
                          onClick={() => onSelectVariant(variant)}
                        >
                          <span className="flex-1 truncate">
                            Вариант {variant.variantNumber}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteVariant(variant.id);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition shrink-0"
                            title="Удалить вариант"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-white/50 text-center py-8 text-sm">
                Пока нет сохранённых задач
              </div>
            )}
          </div>
        )}

        {/* ==================== РАБОТЫ ==================== */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsWorksOpen(!isWorksOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 rounded-xl text-left"
          >
            <span className="font-semibold">Работы</span>
            {isWorksOpen ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>

          {isWorksOpen && (
            <div className="mt-2 ml-2 space-y-2">
              {WORK_TYPES.map(({ type, label }) => {
                const typeWorks = works.filter((w) => w.type === type);
                const collapsed = collapsedWorkTypes.has(type);

                return (
                  <div key={type}>
                    {/* Заголовок типа работы + кнопка "+" */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10">
                      <button
                        onClick={() => toggleWorkType(type)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        {collapsed ? (
                          <ChevronRight size={16} className="shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="shrink-0" />
                        )}
                        <span className="font-medium truncate">{label}</span>
                        {typeWorks.length > 0 && (
                          <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                            {typeWorks.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => openWorkModal(type)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition shrink-0"
                        title={`Создать: ${label.toLowerCase()}`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    {/* Список созданных работ данного типа */}
                    {!collapsed && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {typeWorks.map((work) => {
                          const wVariants = workVariants.filter(
                            (v) => v.workId === work.id,
                          );
                          const isWorkCollapsed = collapsedWorks.has(work.id);

                          return (
                            <div key={work.id}>
                              {/* Сама работа */}
                              <div
                                className={`group flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-all ${
                                  currentWorkId === work.id &&
                                  !currentWorkVariantId
                                    ? "bg-white/20 font-medium"
                                    : "hover:bg-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {wVariants.length > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWorkCollapse(work.id);
                                      }}
                                      className="p-0.5 hover:bg-white/20 rounded transition shrink-0"
                                      title={
                                        isWorkCollapsed
                                          ? "Показать варианты"
                                          : "Скрыть варианты"
                                      }
                                    >
                                      {isWorkCollapsed ? (
                                        <ChevronRight size={14} />
                                      ) : (
                                        <ChevronDown size={14} />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="w-4 shrink-0" />
                                  )}
                                  <div
                                    className="flex-1 cursor-pointer truncate"
                                    onClick={() => onSelectWork(work)}
                                  >
                                    {work.name}
                                    {wVariants.length > 0 && (
                                      <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                        {wVariants.length}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateWorkClick(work.id);
                                    }}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition"
                                    title="Генерировать варианты"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteWork(work.id);
                                    }}
                                    className="p-1.5 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition"
                                    title="Удалить работу"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {/* Варианты работы */}
                              {wVariants.length > 0 && !isWorkCollapsed && (
                                <div className="ml-6 mt-1 space-y-0.5">
                                  {wVariants.map((variant) => (
                                    <div
                                      key={variant.id}
                                      className={`group flex items-center justify-between px-4 py-2 text-sm rounded-xl cursor-pointer transition-all ${
                                        currentWorkVariantId === variant.id
                                          ? "bg-white/20 font-medium"
                                          : "hover:bg-white/10"
                                      }`}
                                      onClick={() =>
                                        onSelectWorkVariant(variant)
                                      }
                                    >
                                      <span className="flex-1 truncate">
                                        Вариант {variant.variantNumber}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteWorkVariant(variant.id);
                                        }}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition shrink-0"
                                        title="Удалить вариант"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {typeWorks.length === 0 && (
                          <div className="text-white/40 text-xs px-4 py-2">
                            Пока нет работ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно генерации вариантов */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-[#212842] rounded-3xl p-8 w-96 shadow-2xl">
            <h3 className="text-xl font-semibold mb-6">Генерация вариантов</h3>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">
                Количество вариантов
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={variantCount}
                onChange={(e) =>
                  setVariantCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-center text-lg focus:outline-none focus:border-[#212842]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 py-3.5 bg-gray-200 rounded-2xl font-medium hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={confirmGeneration}
                className="flex-1 py-3.5 bg-[#212842] text-white rounded-2xl font-medium hover:bg-black transition"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно генерации вариантов работы */}
      {showWorkGenModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-[#212842] rounded-3xl p-8 w-96 shadow-2xl">
            <h3 className="text-xl font-semibold mb-6">
              Генерация вариантов работы
            </h3>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">
                Количество вариантов
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={workVariantCount}
                onChange={(e) =>
                  setWorkVariantCount(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-center text-lg focus:outline-none focus:border-[#212842]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWorkGenModal(false)}
                className="flex-1 py-3.5 bg-gray-200 rounded-2xl font-medium hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={confirmWorkGeneration}
                className="flex-1 py-3.5 bg-[#212842] text-white rounded-2xl font-medium hover:bg-black transition"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания работы */}
      {showWorkModal && workModalType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-[#212842] rounded-3xl p-8 w-[28rem] shadow-2xl max-h-[85vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-6">
              Создание:{" "}
              {workModalType === "control"
                ? "контрольная работа"
                : "самостоятельная работа"}
            </h3>

            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-2">
                Название
              </label>
              <input
                type="text"
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#212842]"
              />
            </div>

            <div className="mb-5 flex-1 overflow-auto">
              <label className="block text-sm text-gray-600 mb-2">
                Доступные задачи:
              </label>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const checked = selectedTaskIds.has(task.id);
                  return (
                    <label
                      key={task.id}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-2xl cursor-pointer transition ${
                        checked
                          ? "border-[#212842] bg-[#212842]/5"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 accent-[#212842]"
                      />
                      <span className="flex-1 truncate">{task.title}</span>
                    </label>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="text-gray-400 text-sm text-center py-6">
                    Сначала создайте задачи
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeWorkModal}
                className="flex-1 py-3.5 bg-gray-200 rounded-2xl font-medium hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={confirmCreateWork}
                disabled={selectedTaskIds.size === 0 || !workName.trim()}
                className="flex-1 py-3.5 bg-[#212842] text-white rounded-2xl font-medium hover:bg-black transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
