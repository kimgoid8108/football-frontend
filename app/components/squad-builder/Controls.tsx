import React from "react";
import { Shuffle } from "lucide-react";

interface ControlsProps {
  formation: string;
  formations: string[];
  onFormationChange: (formation: string) => void;
  onRandomize?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  formation,
  formations,
  onFormationChange,
  onRandomize,
}) => {
  return (
    <div className="flex items-center gap-3">
      <select
        value={formation}
        onChange={(e) => onFormationChange(e.target.value)}
        className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700"
      >
        {formations.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {onRandomize && (
        <button
          onClick={onRandomize}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition font-medium"
          title="현재 선수들을 랜덤하게 배치"
        >
          <Shuffle size={20} />
          랜덤 배치
        </button>
      )}
    </div>
  );
};

export default Controls;
