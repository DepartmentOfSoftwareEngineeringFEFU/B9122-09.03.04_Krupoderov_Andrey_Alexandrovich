import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Variable, VariableType } from "../types";

interface Props {
  variables: Variable[];
  onChange: (vars: Variable[]) => void;
  readOnly?: boolean;
}

export default function VariableInput({
  variables,
  onChange,
  readOnly = false,
}: Props) {
  const [tempName, setTempName] = useState("");
  const [tempType, setTempType] = useState<VariableType>("vector");
  const [openTypeMenuId, setOpenTypeMenuId] = useState<string | null>(null);

  // ====================== ФУНКЦИИ ======================

  const addVariable = () => {
    if (!tempName.trim() || readOnly) return;

    const newVar: Variable = {
      id: Date.now().toString(),
      name: tempName.trim(),
      type: tempType,
      coordinates:
        tempType === "vector"
          ? [
              { x: 1, y: 1 },
              { x: 4, y: 3 },
            ]
          : { x: 2, y: 2 },
      coordLabels:
        tempType === "vector"
          ? [`${tempName.trim()}1`, `${tempName.trim()}2`]
          : [tempName.trim()],
    };

    onChange([...variables, newVar]);
    setTempName("");
    setTempType("vector");
  };

  const changeVariableType = (id: string, newType: VariableType) => {
    if (readOnly) return;

    onChange(
      variables.map((v) => {
        if (v.id === id) {
          if (newType === "point") {
            return {
              ...v,
              type: newType,
              coordinates: {
                x: (v.coordinates as any)?.[0]?.x || 2,
                y: (v.coordinates as any)?.[0]?.y || 2,
              },
              coordLabels: [v.name],
            };
          } else {
            return {
              ...v,
              type: newType,
              coordinates: [
                { x: 1, y: 1 },
                { x: 4, y: 3 },
              ],
              coordLabels: [`${v.name}1`, `${v.name}2`],
            };
          }
        }
        return v;
      }),
    );
    setOpenTypeMenuId(null);
  };

  // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
  // Вот сюда добавляем функцию updateCoordLabel
  const updateCoordLabel = (varId: string, index: number, newLabel: string) => {
    if (readOnly) return;
    onChange(
      variables.map((v) => {
        if (v.id === varId) {
          const labels = v.coordLabels ? [...v.coordLabels] : [];
          labels[index] = newLabel;
          return { ...v, coordLabels: labels };
        }
        return v;
      }),
    );
  };

  const updateCoordinate = (
    varId: string,
    index: number,
    axis: "x" | "y",
    value: string,
  ) => {
    if (readOnly) return;
    const numValue = parseFloat(value) || 0;

    onChange(
      variables.map((v) => {
        if (v.id === varId) {
          if (v.type === "point") {
            return {
              ...v,
              coordinates: { ...(v.coordinates as any), [axis]: numValue },
            };
          } else {
            const coords = [...(v.coordinates as any[])];
            coords[index] = { ...coords[index], [axis]: numValue };
            return { ...v, coordinates: coords };
          }
        }
        return v;
      }),
    );
  };

  // ====================== JSX ======================
  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex gap-3">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Название переменной (a, b, c...)"
            className="flex-1 px-5 py-4 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#212842]"
            onKeyDown={(e) => e.key === "Enter" && addVariable()}
          />

          <button
            onClick={addVariable}
            className="px-8 bg-[#212842] hover:bg-black text-white rounded-2xl flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={22} /> Добавить
          </button>
        </div>
      )}

      <div className="space-y-5">
        {variables.map((variable) => (
          <div
            key={variable.id}
            className="bg-white border border-gray-200 rounded-3xl p-6 relative"
          >
            {!readOnly && (
              <button
                onClick={() =>
                  onChange(variables.filter((v) => v.id !== variable.id))
                }
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 bg-[#212842] text-white rounded-2xl flex items-center justify-center text-3xl font-bold cursor-pointer hover:bg-[#1a1f38] transition"
                onClick={() => !readOnly && setOpenTypeMenuId(variable.id)}
                title="Нажмите, чтобы сменить тип"
              >
                {variable.name}
              </div>

              <div>
                <div className="font-semibold text-lg">{variable.name}</div>
                <div className="text-sm text-gray-500">
                  {variable.type === "vector" ? "Вектор" : "Точка"}
                </div>
              </div>

              {openTypeMenuId === variable.id && !readOnly && (
                <div className="absolute ml-20 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg py-1 z-10">
                  <button
                    onClick={() => changeVariableType(variable.id, "vector")}
                    className="block w-full text-left px-5 py-2 hover:bg-gray-100"
                  >
                    Вектор
                  </button>
                  <button
                    onClick={() => changeVariableType(variable.id, "point")}
                    className="block w-full text-left px-5 py-2 hover:bg-gray-100"
                  >
                    Точка
                  </button>
                </div>
              )}
            </div>

            {/* Поля координат */}
            {variable.type === "vector" &&
            Array.isArray(variable.coordinates) ? (
              <div className="grid grid-cols-2 gap-6">
                {[0, 1].map((i) => {
                  const label =
                    variable.coordLabels?.[i] || `${variable.name}${i + 1}`;
                  return (
                    <div key={i}>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) =>
                          updateCoordLabel(variable.id, i, e.target.value)
                        }
                        className="font-medium mb-2 text-gray-600 bg-transparent border-b border-dashed border-gray-300 focus:border-[#212842] outline-none w-full"
                        disabled={readOnly}
                      />
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={variable.coordinates[i].x}
                          onChange={(e) =>
                            updateCoordinate(
                              variable.id,
                              i,
                              "x",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                        <input
                          type="number"
                          value={variable.coordinates[i].y}
                          onChange={(e) =>
                            updateCoordinate(
                              variable.id,
                              i,
                              "y",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="font-medium mb-2 text-gray-600">
                  {variable.coordLabels?.[0] || variable.name}
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={(variable.coordinates as any).x}
                    onChange={(e) =>
                      updateCoordinate(variable.id, 0, "x", e.target.value)
                    }
                    className="flex-1 px-4 py-3 border rounded-2xl focus:outline-none focus:border-[#212842]"
                    disabled={readOnly}
                  />
                  <input
                    type="number"
                    value={(variable.coordinates as any).y}
                    onChange={(e) =>
                      updateCoordinate(variable.id, 0, "y", e.target.value)
                    }
                    className="flex-1 px-4 py-3 border rounded-2xl focus:outline-none focus:border-[#212842]"
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
