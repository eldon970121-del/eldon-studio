const MAP = {
  draft: { label: "Draft", className: "text-white/40 border-white/20" },
  published: { label: "Published", className: "text-blue-400 border-blue-400/40" },
  selection_completed: {
    label: "Selection Done",
    className: "text-yellow-400 border-yellow-400/40",
  },
  retouching: { label: "Retouching", className: "text-orange-400 border-orange-400/40" },
  pending_payment: {
    label: "Pending Payment",
    className: "text-red-400 border-red-400/40",
  },
  delivered: { label: "Delivered", className: "text-green-400 border-green-400/40" },
};

export function StatusBadge({ status }) {
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-sm font-mono ${MAP[status]?.className}`}>
      {MAP[status]?.label ?? status}
    </span>
  );
}
