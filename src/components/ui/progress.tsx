import * as React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, ...props }, ref) => {
    const percent = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={`relative w-full h-3 bg-gray-200 rounded-full overflow-hidden ${className ?? ""}`}
        {...props}
      >
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
