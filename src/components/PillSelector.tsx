interface PillSelectorProps {
  label: string;
  options: { value: string; label: string; color?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  multiple?: boolean;
}

export function PillSelector({ label, options, selected, onToggle, multiple = false }: PillSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border hover:border-primary/50"
              }`}
            >
              {option.color && (
                <span
                  className="h-3 w-3 rounded-full border border-border/50"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
