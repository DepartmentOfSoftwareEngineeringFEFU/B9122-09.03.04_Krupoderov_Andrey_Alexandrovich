import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TaskDescription from "./components/TaskDescription";
import WorkView from "./components/WorkView";
import {
  Task,
  GeneratedVariant,
  Variable,
  Work,
  WorkType,
  WorkVariant,
  WorkVariantTask,
  DEFAULT_RANGE,
} from "./types";
import { computeOperationResult } from "./utils/vectorOps";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Варианты задач теперь временные — хранятся только в памяти, в БД не пишутся.
  const [generatedVariants, setGeneratedVariants] = useState<
    GeneratedVariant[]
  >([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [workVariants, setWorkVariants] = useState<WorkVariant[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentVariant, setCurrentVariant] = useState<GeneratedVariant | null>(
    null,
  );
  const [currentWork, setCurrentWork] = useState<Work | null>(null);
  const [currentWorkVariant, setCurrentWorkVariant] =
    useState<WorkVariant | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка данных из БД (задачи, работы и варианты работ).
  // Варианты задач НЕ загружаются — они временные.
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Загружаем задачи
        const tasksRes = await fetch("http://127.0.0.1:5000/api/tasks");
        if (!tasksRes.ok) throw new Error("Не удалось загрузить задачи");

        const tasksData: Task[] = await tasksRes.json();
        setTasks(tasksData);

        // 2. Варианты задач больше не загружаем из БД — они временные.
        setGeneratedVariants([]);

        // 3. Загружаем работы
        let worksData: Work[] = [];
        try {
          const worksRes = await fetch("http://127.0.0.1:5000/api/works");
          if (worksRes.ok) {
            worksData = await worksRes.json();
            setWorks(worksData);
          }
        } catch (err) {
          console.warn("Не удалось загрузить работы");
        }

        // 4. Загружаем варианты работ (они хранятся в БД)
        const allWorkVariants: WorkVariant[] = [];
        for (const work of worksData) {
          try {
            const wvRes = await fetch(
              `http://127.0.0.1:5000/api/works/${work.id}/variants`,
            );
            if (wvRes.ok) {
              const wvData: WorkVariant[] = await wvRes.json();
              allWorkVariants.push(...wvData);
            }
          } catch (err) {
            console.warn(`Не удалось загрузить варианты работы ${work.id}`);
          }
        }
        setWorkVariants(allWorkVariants);

        console.log(`✅ Загружено ${tasksData.length} задач`);
      } catch (error) {
        console.error("Ошибка загрузки данных из БД:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Рандомизация переменных
  const randomizeVariables = (variables: Variable[]): Variable[] => {
    return variables.map((variable) => {
      const params = variable.generationParams || {};

      if (variable.type === "vector" && Array.isArray(variable.coordinates)) {
        const newCoords = variable.coordinates.map((_, index) => {
          const xRange = params[`${index}_x`] || DEFAULT_RANGE;
          const yRange = params[`${index}_y`] || DEFAULT_RANGE;

          return {
            x:
              Math.floor(Math.random() * (xRange.max - xRange.min + 1)) +
              xRange.min,
            y:
              Math.floor(Math.random() * (yRange.max - yRange.min + 1)) +
              yRange.min,
          };
        });
        return { ...variable, coordinates: newCoords };
      } else if (variable.type === "point") {
        const xRange = params.x || DEFAULT_RANGE;
        const yRange = params.y || DEFAULT_RANGE;
        return {
          ...variable,
          coordinates: {
            x:
              Math.floor(Math.random() * (xRange.max - xRange.min + 1)) +
              xRange.min,
            y:
              Math.floor(Math.random() * (yRange.max - yRange.min + 1)) +
              yRange.min,
          },
        };
      }
      return variable;
    });
  };

  const handleSaveTask = async (task: Task) => {
    // Локальное обновление
    if (tasks.find((t) => t.id === task.id)) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    } else {
      setTasks((prev) => [task, ...prev]);
    }
    setCurrentTask(task);
    setCurrentVariant(null);
    setCurrentWork(null);
    setCurrentWorkVariant(null);

    // Сохранение в БД (сами задачи хранятся, включая operation/scalar)
    try {
      await fetch("http://127.0.0.1:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
    } catch (e) {
      console.error("Не удалось сохранить задачу в БД", e);
    }
  };

  // Генерация временных вариантов задачи (в БД не сохраняются)
  const onGenerateVariants = (taskId: string, count: number) => {
    const originalTask = tasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    const newVariants: GeneratedVariant[] = [];

    for (let i = 1; i <= count; i++) {
      const randomizedVars = randomizeVariables(originalTask.variables);
      // Операция и скаляр наследуются от задачи; ответ считается по рандомным координатам.
      const res = computeOperationResult(
        randomizedVars,
        originalTask.operation ?? null,
        originalTask.scalar,
      );

      const newVariant: GeneratedVariant = {
        id: `${Date.now()}-${i}`,
        taskId: originalTask.id,
        variantNumber: i,
        description: originalTask.description,
        variables: randomizedVars,
        canvasObjects: [...originalTask.canvasObjects],
        operation: originalTask.operation ?? null,
        scalar: originalTask.scalar ?? null,
        answer: res && res.ok ? res.text : null,
        createdAt: new Date().toISOString(),
      };

      newVariants.push(newVariant);
    }

    // Только локальное обновление — в БД не пишем
    setGeneratedVariants((prev) => [
      ...newVariants,
      ...prev.filter((v) => v.taskId !== taskId),
    ]);
  };

  // Удаление одного варианта задачи (только из памяти)
  const handleDeleteVariant = (variantId: string) => {
    const variant = generatedVariants.find((v) => v.id === variantId);
    if (!variant) return;
    const taskId = variant.taskId;

    const remaining = generatedVariants
      .filter((v) => v.taskId === taskId && v.id !== variantId)
      .map((v, i) => ({ ...v, variantNumber: i + 1 }));

    setGeneratedVariants((prev) => [
      ...remaining,
      ...prev.filter((v) => v.taskId !== taskId),
    ]);

    if (currentVariant?.id === variantId) setCurrentVariant(null);
  };

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setCurrentVariant(null);
    setCurrentWork(null);
    setCurrentWorkVariant(null);
  };

  const handleSelectVariant = (variant: GeneratedVariant) => {
    setCurrentVariant(variant);
    setCurrentTask(null);
    setCurrentWork(null);
    setCurrentWorkVariant(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    // Локальное удаление
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setGeneratedVariants((prev) => prev.filter((v) => v.taskId !== taskId));

    if (currentTask?.id === taskId || currentVariant?.taskId === taskId) {
      setCurrentTask(null);
      setCurrentVariant(null);
    }

    // Удаление из БД
    try {
      await fetch(`http://127.0.0.1:5000/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Не удалось удалить задачу из БД", e);
    }
  };

  const handleCreateWork = async (
    type: WorkType,
    name: string,
    taskIds: string[],
  ) => {
    const newWork: Work = {
      id: Date.now().toString(),
      name,
      type,
      taskIds,
      createdAt: new Date().toISOString(),
    };

    // Локальное обновление + сразу открываем работу
    setWorks((prev) => [...prev, newWork]);
    setCurrentWork(newWork);
    setCurrentWorkVariant(null);
    setCurrentTask(null);
    setCurrentVariant(null);

    // Сохранение в БД
    try {
      await fetch("http://127.0.0.1:5000/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWork),
      });
    } catch (e) {
      console.error("Не удалось сохранить работу в БД", e);
    }
  };

  const handleDeleteWork = async (workId: string) => {
    setWorks((prev) => prev.filter((w) => w.id !== workId));
    setWorkVariants((prev) => prev.filter((v) => v.workId !== workId));
    if (currentWork?.id === workId) {
      setCurrentWork(null);
      setCurrentWorkVariant(null);
    }

    try {
      await fetch(`http://127.0.0.1:5000/api/works/${workId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Не удалось удалить работу из БД", e);
    }
  };

  const handleSelectWork = (work: Work) => {
    setCurrentWork(work);
    setCurrentWorkVariant(null);
    setCurrentTask(null);
    setCurrentVariant(null);
  };

  // Генерация вариантов работы — каждый вариант это рандомизированный набор её задач
  const handleGenerateWorkVariants = async (workId: string, count: number) => {
    const work = works.find((w) => w.id === workId);
    if (!work) return;

    const workTasks = work.taskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t));

    if (workTasks.length === 0) {
      alert("В этой работе нет задач для генерации");
      return;
    }

    const newVariants: WorkVariant[] = [];

    for (let i = 1; i <= count; i++) {
      const variantTasks: WorkVariantTask[] = workTasks.map((task) => {
        const randomizedVars = randomizeVariables(task.variables);
        const res = computeOperationResult(
          randomizedVars,
          task.operation ?? null,
          task.scalar,
        );
        return {
          taskId: task.id,
          title: task.title,
          description: task.description,
          variables: randomizedVars,
          canvasObjects: [...task.canvasObjects],
          operation: task.operation ?? null,
          scalar: task.scalar ?? null,
          answer: res && res.ok ? res.text : null,
        };
      });

      newVariants.push({
        id: `${Date.now()}-${i}`,
        workId: work.id,
        variantNumber: i,
        tasks: variantTasks,
        createdAt: new Date().toISOString(),
      });
    }

    // Локальное обновление
    setWorkVariants((prev) => [
      ...newVariants,
      ...prev.filter((v) => v.workId !== workId),
    ]);

    // Сохранение в БД (варианты работ хранятся — не трогаем)
    try {
      await fetch(`http://127.0.0.1:5000/api/works/${workId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: newVariants }),
      });
    } catch (e) {
      console.error("Не удалось сохранить варианты работы в БД", e);
    }
  };

  const handleSelectWorkVariant = (variant: WorkVariant) => {
    const work = works.find((w) => w.id === variant.workId) || null;
    setCurrentWork(work);
    setCurrentWorkVariant(variant);
    setCurrentTask(null);
    setCurrentVariant(null);
  };

  const handleDeleteWorkVariant = async (variantId: string) => {
    const variant = workVariants.find((v) => v.id === variantId);
    if (!variant) return;
    const workId = variant.workId;

    const remaining = workVariants
      .filter((v) => v.workId === workId && v.id !== variantId)
      .map((v, i) => ({ ...v, variantNumber: i + 1 }));

    setWorkVariants((prev) => [
      ...remaining,
      ...prev.filter((v) => v.workId !== workId),
    ]);

    if (currentWorkVariant?.id === variantId) setCurrentWorkVariant(null);

    try {
      await fetch(`http://127.0.0.1:5000/api/works/${workId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: remaining }),
      });
    } catch (e) {
      console.error("Не удалось обновить варианты работы в БД", e);
    }
  };

  const handleCreateNew = () => {
    setCurrentTask(null);
    setCurrentVariant(null);
    setCurrentWork(null);
    setCurrentWorkVariant(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden app-container">
      <Sidebar
        tasks={tasks}
        generatedVariants={generatedVariants}
        works={works}
        workVariants={workVariants}
        onCreateNew={handleCreateNew}
        onSelectTask={handleSelectTask}
        onSelectVariant={handleSelectVariant}
        onDeleteTask={handleDeleteTask}
        onGenerateVariants={onGenerateVariants}
        onDeleteVariant={handleDeleteVariant}
        onCreateWork={handleCreateWork}
        onDeleteWork={handleDeleteWork}
        onSelectWork={handleSelectWork}
        onGenerateWorkVariants={handleGenerateWorkVariants}
        onSelectWorkVariant={handleSelectWorkVariant}
        onDeleteWorkVariant={handleDeleteWorkVariant}
        currentTaskId={currentTask?.id}
        currentVariantId={currentVariant?.id}
        currentWorkId={currentWork?.id}
        currentWorkVariantId={currentWorkVariant?.id}
      />

      {currentWork ? (
        <WorkView
          work={currentWork}
          tasks={tasks}
          workVariant={currentWorkVariant}
          workVariants={workVariants.filter((v) => v.workId === currentWork.id)}
        />
      ) : (
        <TaskDescription
          onSaveTask={handleSaveTask}
          currentTask={currentTask}
          currentVariant={currentVariant}
          tasks={tasks}
        />
      )}
    </div>
  );
}

export default App;
