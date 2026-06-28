import { Variable, DEFAULT_RANGE } from "../types";

interface Props {
  variables: Variable[];
  onChange: (vars: Variable[]) => void;
  readOnly?: boolean;
}

export default function GenerationParams({
  variables,
  onChange,
  readOnly = false,
}: Props) {
  const updateParam = (
    varId: string,
    coordIndex: number,
    axis: "x" | "y",
    field: "min" | "max",
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;

    onChange(
      variables.map((v) => {
        if (v.id === varId) {
          const currentParams = v.generationParams || {};

          const key = v.type === "vector" ? `${coordIndex}_${axis}` : axis;

          return {
            ...v,
            generationParams: {
              ...currentParams,
              [key]: {
                ...((currentParams as any)[key] || {}),
                [field]: numValue,
              },
            },
          };
        }
        return v;
      }),
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h3 className="text-xl font-semibold mb-6 text-[#212842]">
        Параметры генерации
      </h3>

      <div className="space-y-8">
        {variables.map((v) => {
          const isVector = v.type === "vector";
          const coords = isVector
            ? (v.coordinates as any[])
            : [v.coordinates as any];

          return (
            <div
              key={v.id}
              className="space-y-5 border-l-4 border-[#212842] pl-6"
            >
              <div className="font-semibold text-lg">{v.name}</div>

              {coords.map((coord: any, i: number) => {
                const label =
                  v.coordLabels?.[i] ||
                  (isVector ? `${v.name}${i + 1}` : v.name);
                const params = (v.generationParams as any) || {};

                const xKey = isVector ? `${i}_x` : "x";
                const yKey = isVector ? `${i}_y` : "y";

                const xParam = params[xKey] || DEFAULT_RANGE;
                const yParam = params[yKey] || DEFAULT_RANGE;

                return (
                  <div key={i} className="bg-gray-50 p-6 rounded-2xl">
                    <div className="mb-4 font-medium">
                      Параметр <span className="text-[#212842]">{label}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          X от
                        </label>
                        <input
                          type="number"
                          value={xParam.min}
                          onChange={(e) =>
                            updateParam(v.id, i, "x", "min", e.target.value)
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          X до
                        </label>
                        <input
                          type="number"
                          value={xParam.max}
                          onChange={(e) =>
                            updateParam(v.id, i, "x", "max", e.target.value)
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Y от
                        </label>
                        <input
                          type="number"
                          value={yParam.min}
                          onChange={(e) =>
                            updateParam(v.id, i, "y", "min", e.target.value)
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Y до
                        </label>
                        <input
                          type="number"
                          value={yParam.max}
                          onChange={(e) =>
                            updateParam(v.id, i, "y", "max", e.target.value)
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#212842]"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
