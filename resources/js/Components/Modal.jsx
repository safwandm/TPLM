import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, children }) {
  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded p-6 w-full max-w-lg shadow-lg">
        {children}
      </div>
    </div>,
    document.body
  );
}