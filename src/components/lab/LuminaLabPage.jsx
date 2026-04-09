import { AestheticsLab } from "./AestheticsLab";

export function LuminaLabPage({ initialFiles, onExit }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AestheticsLab initialFiles={initialFiles} onExit={onExit} />
    </div>
  );
}
