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
  /** Initial crest initials shown in the preview and pre-filled in the text input. */
  initials?: string;
  initialColor?: string;
}

export function CrestPicker({ initials = "FC", initialColor }: Props) {
  const [selectedColor, setSelectedColor] = useState(
    COLORS.find((c) => c.value === initialColor) ?? COLORS[0],
  );
  const [initialsValue, setInitialsValue] = useState(initials);

  const displayInitials = initialsValue.trim() || "?";

  return (
    <div className="mb-6">
      <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground)" }}>
        Team Crest
      </p>

      {/* Live preview */}
      <div className="flex items-center gap-5 mb-4">
        <div
          className={`w-20 h-20 rounded-[18px] flex items-center justify-center font-bold text-white text-3xl bg-gradient-to-br shadow-md shrink-0 ${selectedColor.gradient}`}
        >
          {displayInitials}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {selectedColor.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Customize the initials and color below
          </p>
        </div>
      </div>

      {/* Initials input */}
      <div className="mb-4">
        <label
          htmlFor="crest-initials"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--color-foreground)" }}
        >
          Initials
        </label>
        <input
          id="crest-initials"
          type="text"
          maxLength={2}
          placeholder="FC"
          value={initialsValue}
          onChange={(e) => setInitialsValue(e.target.value.toUpperCase())}
          className="w-20 rounded-md border px-3 py-1.5 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
          2 characters — shown on the crest
        </p>
      </div>

      {/* Color swatches */}
      <div className="flex flex-wrap gap-3">
        {COLORS.map((c) => {
          const isSelected = c.value === selectedColor.value;
          return (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setSelectedColor(c)}
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

      {/* Hidden inputs so the surrounding form can read the selected values */}
      <input type="hidden" name="color" value={selectedColor.value} />
      <input type="hidden" name="shortName" value={initialsValue} />
    </div>
  );
}
