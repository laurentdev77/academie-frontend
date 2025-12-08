import * as React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-[90%] max-w-lg">
        {children}
        <div className="flex justify-end mt-4">
          <button
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ correction : on accepte className dans tous ces composants
export const DialogContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

export const DialogHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

export const DialogTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <h2 className={`text-lg font-semibold mb-2 ${className}`}>{children}</h2>;

export const DialogFooter = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`mt-4 flex justify-end gap-2 ${className}`}>{children}</div>;
