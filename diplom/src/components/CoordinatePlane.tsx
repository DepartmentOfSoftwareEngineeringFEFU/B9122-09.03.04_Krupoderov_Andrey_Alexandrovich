import {
  Stage,
  Layer,
  Line,
  Text,
  Arrow as KonvaArrow,
  Circle,
} from "react-konva";
import { Variable, CanvasObject } from "../types";
import React, { useState } from "react";

interface Props {
  variables: Variable[];
  objects: CanvasObject[];
  onDelete: (id: string) => void;
  readOnly?: boolean;
  width?: number;
  height?: number;
}

const gridSize = 40;

export default function CoordinatePlane({
  variables,
  objects,
  onDelete,
  readOnly = false,
  width = 860,
  height = 660,
}: Props) {
  const originX = Math.floor(width / 2 / gridSize) * gridSize;
  const originY = Math.floor(height / 2 / gridSize) * gridSize;

  const getScreenPos = (x: number, y: number) => ({
    screenX: originX + x * gridSize,
    screenY: originY - y * gridSize,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Позиция для человечка и самолёта
  const getObjectPosition = (obj: CanvasObject) => {
    const vector = variables.find(
      (v) => v.id === obj.attachedTo && v.type === "vector",
    );

    if (!vector || !Array.isArray(vector.coordinates)) {
      return getScreenPos(obj.x || 0, obj.y || 0);
    }

    const [start, end] = vector.coordinates;
    const target = obj.attachedToPoint === "start" ? start : end;
    const basePos = getScreenPos(target.x, target.y);

    if (obj.attachedToPoint === "start") {
      return { screenX: basePos.screenX - 35, screenY: basePos.screenY - 35 };
    } else {
      return { screenX: basePos.screenX - 50, screenY: basePos.screenY - 40 };
    }
  };

  return (
    <div className="border-2 border-[#212842]/20 bg-white rounded-3xl overflow-hidden shadow-xl relative">
      <Stage width={width} height={height}>
        <Layer>
          {/* Сетка */}
          {Array.from({ length: Math.ceil(width / gridSize) + 5 }).map(
            (_, i) => (
              <Line
                key={`v${i}`}
                points={[i * gridSize, 0, i * gridSize, height]}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ),
          )}
          {Array.from({ length: Math.ceil(height / gridSize) + 5 }).map(
            (_, i) => (
              <Line
                key={`h${i}`}
                points={[0, i * gridSize, width, i * gridSize]}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ),
          )}

          {/* Оси */}
          <Line
            points={[0, originY, width, originY]}
            stroke="#212842"
            strokeWidth={3}
          />
          <Line
            points={[originX, 0, originX, height]}
            stroke="#212842"
            strokeWidth={3}
          />

          {/* Стрелки на осях */}
          <Line
            points={[
              width - 15,
              originY - 8,
              width,
              originY,
              width - 15,
              originY + 8,
            ]}
            stroke="#212842"
            strokeWidth={3}
          />
          <Line
            points={[originX - 8, 15, originX, 0, originX + 8, 15]}
            stroke="#212842"
            strokeWidth={3}
          />

          {/* 1. Векторы (стрелки) */}
          {variables.map((v) => {
            if (v.type === "vector" && Array.isArray(v.coordinates)) {
              const [s, e] = v.coordinates;
              const start = getScreenPos(s.x, s.y);
              const end = getScreenPos(e.x, e.y);

              return (
                <KonvaArrow
                  key={`arrow-${v.id}`}
                  points={[
                    start.screenX,
                    start.screenY,
                    end.screenX,
                    end.screenY,
                  ]}
                  stroke="#212842"
                  strokeWidth={5}
                  pointerLength={14}
                  pointerWidth={12}
                />
              );
            }
            return null;
          })}

          {/* 2. Человечки и Самолёты */}
          {objects.map((obj) => {
            if (obj.type === "vector") return null;

            const pos = getObjectPosition(obj);
            const emoji = obj.type === "person" ? "👤" : "✈️";
            const fontSize = obj.type === "plane" ? 40 : 40;

            return (
              <React.Fragment key={obj.id}>
                <Text
                  x={pos.screenX}
                  y={pos.screenY}
                  text={emoji}
                  fontSize={fontSize}
                  onClick={() => !readOnly && setSelectedId(obj.id)}
                />
              </React.Fragment>
            );
          })}

          {/* 3. Точки (Circle) */}
          {variables.map((v) => {
            if (v.type === "point") {
              const coord = v.coordinates as { x: number; y: number };
              const pos = getScreenPos(coord.x, coord.y);
              const label = v.coordLabels?.[0] || v.name;

              return (
                <React.Fragment key={v.id}>
                  <Circle
                    x={pos.screenX}
                    y={pos.screenY}
                    radius={9}
                    fill="#212842"
                  />
                </React.Fragment>
              );
            }
            return null;
          })}

          {/* 4. Тексты координат — ПОСЛЕДНИЕ, чтобы были поверх всего */}
          {variables.map((v) => {
            if (v.type === "vector" && Array.isArray(v.coordinates)) {
              const [s, e] = v.coordinates;
              const start = getScreenPos(s.x, s.y);
              const end = getScreenPos(e.x, e.y);

              const label1 = v.coordLabels?.[0] || `${v.name}1`;
              const label2 = v.coordLabels?.[1] || `${v.name}2`;

              return (
                <React.Fragment key={`labels-${v.id}`}>
                  <Text
                    x={start.screenX - 40}
                    y={start.screenY + 5}
                    text={`${label1} (${s.x}, ${s.y})`}
                    fontSize={14}
                    fill="#ef4444"
                    fontStyle="bold"
                  />
                  <Text
                    x={end.screenX + 10}
                    y={end.screenY - 24}
                    text={`${label2} (${e.x}, ${e.y})`}
                    fontSize={14}
                    fill="#ef4444"
                    fontStyle="bold"
                  />
                </React.Fragment>
              );
            } else if (v.type === "point") {
              const coord = v.coordinates as { x: number; y: number };
              const pos = getScreenPos(coord.x, coord.y);
              const label = v.coordLabels?.[0] || v.name;

              return (
                <Text
                  key={`label-point-${v.id}`}
                  x={pos.screenX - 15}
                  y={pos.screenY - 30}
                  text={`${label} (${coord.x}, ${coord.y})`}
                  fontSize={14}
                  fill="#ef4444"
                  fontStyle="bold"
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>

      {/* Окно удаления */}
      {selectedId && !readOnly && (
        <div className="absolute top-4 right-4 bg-white border border-red-400 rounded-2xl shadow-xl p-4 z-50">
          <p className="mb-3 text-sm">Удалить элемент?</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onDelete(selectedId);
                setSelectedId(null);
              }}
              className="px-5 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
            >
              Удалить
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="px-5 py-2 bg-gray-200 rounded-xl"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
