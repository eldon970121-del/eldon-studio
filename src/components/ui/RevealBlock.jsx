import { useReveal } from "../../hooks/useReveal";

export function RevealBlock({ children, className = "", delay = 0, style, ...props }) {
  const [ref, isVisible] = useReveal();

  return (
    <div
      ref={ref}
      {...props}
      className={`${className} transition duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms`, ...(style || {}) }}
    >
      {children}
    </div>
  );
}
