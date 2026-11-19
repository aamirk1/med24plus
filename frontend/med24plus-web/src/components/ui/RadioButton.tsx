import React from "react";
import { cn } from "@/lib/utils";

export interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const radioId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label htmlFor={radioId} className="inline-flex items-start gap-2.5 cursor-pointer select-none text-left">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={radioId}
            type="radio"
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className="w-4 h-4 rounded-full border border-slate-300 bg-white peer-checked:border-[#0D9488] peer-focus:ring-2 peer-focus:ring-[#0D9488]/30 transition-all flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#0D9488] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-[#172B24]">{label}</span>}
            {description && <span className="text-xs text-slate-500">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
RadioButton.displayName = "RadioButton";

