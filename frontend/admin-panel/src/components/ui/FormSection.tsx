import React from "react";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4 text-left">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-[#172B24]">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};
