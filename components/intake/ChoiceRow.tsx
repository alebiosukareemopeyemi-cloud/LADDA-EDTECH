import type { ReactNode } from "react";
import { Check } from "lucide-react";

// One option in a list. A native radio, so arrow keys work, with a ring that fills
// and shows a check when chosen (shape, not just colour).
export function ChoiceRow({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  title,
  text,
  meta,
  aside,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title: string;
  text?: string;
  meta?: string;
  aside?: ReactNode;
}) {
  return (
    <label className="choice" aria-disabled={disabled || undefined}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span className="choice-mark" aria-hidden="true">
        <Check className="size-4" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold leading-tight">{title}</span>
        {text && <span className="mt-0.5 block text-text-soft">{text}</span>}
        {meta && <span className="mt-1 block text-sm text-text-mute">{meta}</span>}
      </span>
      {aside}
    </label>
  );
}
