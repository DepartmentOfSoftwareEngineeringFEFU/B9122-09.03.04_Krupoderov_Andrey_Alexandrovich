import jsPDF from "jspdf";
import { Variable, CanvasObject, Work, WorkVariant } from "../types";

// Размер "холста-страницы" в пикселях, соотношение A4 (595x842 pt).
const PAGE_W = 1000;
const PAGE_H = Math.round((PAGE_W * 842) / 595); // ≈ 1414
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Размер клетки в PDF (меньше, чем на экране, чтобы влезали две задачи на A4).
const PDF_GRID = 30;

const INDIGO = "#212842";

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  head = 12,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - head * Math.cos(angle - Math.PI / 6),
    y2 - head * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x2 - head * Math.cos(angle + Math.PI / 6),
    y2 - head * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

// Рисуем координатную плоскость в прямоугольник (ox, oy, w, h) с заданным размером клетки.
function drawPlane(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  variables: Variable[],
  objects: CanvasObject[],
  grid: number,
) {
  ctx.save();
  // фон + рамка
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(ox, oy, w, h);
  ctx.strokeStyle = "rgba(33,40,66,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, w, h);

  // обрезка по плоскости
  ctx.beginPath();
  ctx.rect(ox, oy, w, h);
  ctx.clip();

  const originX = ox + Math.floor(w / 2 / grid) * grid;
  const originY = oy + Math.floor(h / 2 / grid) * grid;
  const sx = (x: number) => originX + x * grid;
  const sy = (y: number) => originY - y * grid;

  // сетка
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let x = originX; x <= ox + w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + h);
    ctx.stroke();
  }
  for (let x = originX - grid; x >= ox; x -= grid) {
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + h);
    ctx.stroke();
  }
  for (let y = originY; y <= oy + h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + w, y);
    ctx.stroke();
  }
  for (let y = originY - grid; y >= oy; y -= grid) {
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + w, y);
    ctx.stroke();
  }

  // оси
  ctx.strokeStyle = INDIGO;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, originY);
  ctx.lineTo(ox + w, originY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(originX, oy);
  ctx.lineTo(originX, oy + h);
  ctx.stroke();

  // стрелки осей
  drawArrow(ctx, originX, originY, ox + w - 2, originY, INDIGO, 3, 12);
  drawArrow(ctx, originX, originY, originX, oy + 2, INDIGO, 3, 12);

  // векторы
  variables.forEach((v) => {
    if (v.type === "vector" && Array.isArray(v.coordinates)) {
      const s = v.coordinates[0] ?? { x: 0, y: 0 };
      const e = v.coordinates[1] ?? { x: 0, y: 0 };
      drawArrow(ctx, sx(s.x), sy(s.y), sx(e.x), sy(e.y), INDIGO, 4, 13);
    }
  });

  // объекты (человечки / самолёты)
  ctx.textBaseline = "top";
  objects.forEach((obj) => {
    if (obj.type === "vector") return;
    const vector = variables.find(
      (v) => v.id === obj.attachedTo && v.type === "vector",
    );
    if (!vector || !Array.isArray(vector.coordinates)) return;
    const start = vector.coordinates[0] ?? { x: 0, y: 0 };
    const end = vector.coordinates[1] ?? { x: 0, y: 0 };
    const target = obj.attachedToPoint === "start" ? start : end;
    const px = sx(target.x) - 14;
    const py = sy(target.y) - 30;
    ctx.font = '26px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.fillText(
      obj.type === "person" ? "\uD83D\uDC64" : "\u2708\uFE0F",
      px,
      py,
    );
  });

  // точки
  variables.forEach((v) => {
    if (v.type === "point") {
      const c = v.coordinates as { x: number; y: number };
      ctx.fillStyle = INDIGO;
      ctx.beginPath();
      ctx.arc(sx(c.x), sy(c.y), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // подписи координат
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillStyle = "#ef4444";
  variables.forEach((v) => {
    if (v.type === "vector" && Array.isArray(v.coordinates)) {
      const s = v.coordinates[0] ?? { x: 0, y: 0 };
      const e = v.coordinates[1] ?? { x: 0, y: 0 };
      const l1 = v.coordLabels?.[0] || `${v.name}1`;
      const l2 = v.coordLabels?.[1] || `${v.name}2`;
      ctx.fillText(`${l1} (${s.x}, ${s.y})`, sx(s.x) - 34, sy(s.y) + 6);
      ctx.fillText(`${l2} (${e.x}, ${e.y})`, sx(e.x) + 8, sy(e.y) - 18);
    } else if (v.type === "point") {
      const c = v.coordinates as { x: number; y: number };
      const l = v.coordLabels?.[0] || v.name;
      ctx.fillText(`${l} (${c.x}, ${c.y})`, sx(c.x) - 12, sy(c.y) - 22);
    }
  });

  ctx.restore();
}

// Перенос текста по словам в заданную ширину.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  text.split("\n").forEach((paragraph) => {
    const words = paragraph.split(" ");
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    lines.push(line);
  });
  return lines;
}

interface DisplayTask {
  title: string;
  description: string;
  variables: Variable[];
  canvasObjects: CanvasObject[];
}

// Рисуем одну задачу в отведённый слот (x, yTop) шириной slotW.
function drawTaskBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  slotW: number,
  taskIndex: number,
  task: DisplayTask,
) {
  let y = yTop;

  // заголовок задачи
  ctx.fillStyle = INDIGO;
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText(`Задача ${taskIndex + 1}`, x, y);
  y += 34;

  // описание (не более 3 строк, чтобы влезали две задачи)
  const descText = task.description.split("\n\nКоординаты:\n")[0] ?? "";
  ctx.fillStyle = "#222222";
  ctx.font = "17px Arial, sans-serif";
  wrapText(ctx, descText, slotW)
    .slice(0, 3)
    .forEach((line) => {
      ctx.fillText(line, x, y);
      y += 23;
    });
  y += 6;

  // координаты
  if (task.variables.length > 0) {
    ctx.fillStyle = INDIGO;
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.fillText("Координаты:", x, y);
    y += 21;
    ctx.fillStyle = "#444444";
    ctx.font = '15px "Courier New", monospace';
    task.variables.forEach((v) => {
      let line = "";
      if (v.type === "vector" && Array.isArray(v.coordinates)) {
        const p1 = v.coordinates[0] ?? { x: 0, y: 0 };
        const p2 = v.coordinates[1] ?? { x: 0, y: 0 };
        const l1 = v.coordLabels?.[0] || `${v.name}1`;
        const l2 = v.coordLabels?.[1] || `${v.name}2`;
        line = `${l1} = (${p1.x}, ${p1.y}),  ${l2} = (${p2.x}, ${p2.y})`;
      } else {
        const p = v.coordinates as { x: number; y: number };
        const l = v.coordLabels?.[0] || v.name;
        line = `${l} = (${p.x}, ${p.y})`;
      }
      ctx.fillText(line, x, y);
      y += 20;
    });
    y += 6;
  }

  // координатное поле (меньше по габаритам, по центру слота)
  const planeW = Math.min(slotW, 620);
  const planeH = 330;
  const planeX = x + (slotW - planeW) / 2;
  drawPlane(
    ctx,
    planeX,
    y,
    planeW,
    planeH,
    task.variables,
    task.canvasObjects,
    PDF_GRID,
  );
  y += planeH + 14;

  // поле для ответа (без самого ответа — только слово и место для записи)
  const boxH = 50;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(x, y, slotW, boxH);
  ctx.strokeStyle = "rgba(33,40,66,0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, slotW, boxH);
  ctx.fillStyle = INDIGO;
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText("Ответ:", x + 14, y + 16);
}

// Рисует одну страницу A4: шапка варианта + до двух задач.
function renderPageCanvas(
  variantNumber: number,
  workName: string,
  tasksOnPage: DisplayTask[],
  startIndex: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = "top";

  let y = MARGIN;

  // шапка: номер варианта + название работы (без типа работы)
  ctx.fillStyle = INDIGO;
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText(`Вариант ${variantNumber}`, MARGIN, y);
  y += 40;
  ctx.fillStyle = "#555555";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(workName, MARGIN, y);
  y += 34;
  ctx.strokeStyle = "rgba(33,40,66,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(PAGE_W - MARGIN, y);
  ctx.stroke();
  y += 20;

  const contentTop = y;
  const contentH = PAGE_H - MARGIN - contentTop;
  const slotH = contentH / 2;

  tasksOnPage.forEach((task, i) => {
    drawTaskBlock(
      ctx,
      MARGIN,
      contentTop + i * slotH,
      CONTENT_W,
      startIndex + i,
      task,
    );
  });

  return canvas;
}

/**
 * Собирает PDF из всех вариантов работы.
 * Каждый вариант начинается с новой страницы, по две задачи на страницу A4.
 */
export function exportWorkVariantsToPdf(work: Work, variants: WorkVariant[]) {
  if (!variants || variants.length === 0) {
    alert("У этой работы пока нет созданных вариантов для экспорта");
    return;
  }

  const typeLabel =
    work.type === "control" ? "Контрольная работа" : "Самостоятельная работа";

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const sorted = [...variants].sort(
    (a, b) => a.variantNumber - b.variantNumber,
  );

  const PER_PAGE = 2;
  let firstPage = true;

  sorted.forEach((variant) => {
    const displayTasks: DisplayTask[] = variant.tasks.map((t) => ({
      title: t.title,
      description: t.description,
      variables: t.variables,
      canvasObjects: t.canvasObjects || [],
    }));

    const pageCount = Math.max(1, Math.ceil(displayTasks.length / PER_PAGE));
    for (let p = 0; p < pageCount; p++) {
      if (!firstPage) pdf.addPage();
      firstPage = false;

      const slice = displayTasks.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
      const canvas = renderPageCanvas(
        variant.variantNumber,
        work.name,
        slice,
        p * PER_PAGE,
      );
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
    }
  });

  const safeName = work.name.replace(/[^\p{L}\p{N}_-]+/gu, "_");
  pdf.save(`${typeLabel}_${safeName}.pdf`);
}
