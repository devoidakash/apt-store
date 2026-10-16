import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface BackButtonProps {
  fallbackTo: string;
  className: string;
  children: ReactNode;
}

export default function BackButton({
  fallbackTo,
  className,
  children,
}: BackButtonProps) {
  const navigate = useNavigate();

  const goBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo, { replace: true });
  };

  return (
    <button type="button" onClick={goBack} className={className}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
