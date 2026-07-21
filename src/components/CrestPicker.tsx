import { useState } from "react";
import { COLOR_GRADIENTS } from "@/lib/utils";

// Derive the picker list from the single source of truth in utils.ts.
// Labels are title-cased from the key; add new colors there and they appear here automatically.
const COLORS = Object.entries(COLOR_GRADIENTS).map(([value, gradient]) => ({
  value,
  gradient,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

interface Props {
  initials: string;
  initialColor?: string;
}

export function CrestPicker({ initials, initialColor }: Props) {
  const [selected, setSelected] = useState(
    COLORS.find((c) => c.value === initialColor) ?? COLORS[0],
  );

  return (
    <div className="mb-6">
      <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground)" }}>
        Team Crest
      </p>

      {/* Live preview */}
      <div className="flex items-center gap-5 mb-4">
        <div
          className={`w-20 h-20 rounded-[18px] flex items-center justify-center font-bold text-white text-3xl bg-gradient-to-br shadow-md shrink-0 ${selected.gradient}`}
        >
          {initials || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {selected.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Tap a color to update the crest
          </p>
        </div>
      </div>

      {/* Color swatches */}
      <div className="flex flex-wrap gap-3">
        {COLORS.map((c) => {
          const isSelected = c.value === selected.value;
          return (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setSelected(c)}
              className={[
                `w-8 h-8 rounded-full bg-gradient-to-br transition-all duration-150 cursor-pointer ${c.gradient}`,
                isSelected
                  ? "ring-2 ring-offset-2 ring-(--color-primary) scale-110"
                  : "hover:scale-110 opacity-70 hover:opacity-100",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Hidden input so the surrounding form can read the selected value */}
      <input type="hidden" name="color" value={selected.value} />
    </div>
  );
}
