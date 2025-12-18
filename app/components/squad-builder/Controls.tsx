import React from "react";
import { Shuffle } from "lucide-react";
import { GameType } from "../../types/squad-builder";

interface ControlsProps {
  formation: string;
  formations: string[];
  onFormationChange: (formation: string) => void;
  onRandomize?: () => void;
  gameType?: GameType;
}

const Controls: React.FC<ControlsProps> = ({
  formation,
  formations,
  onFormationChange,
  onRandomize,
  gameType,
}) => {
  // 풋살 모드에서만 랜덤 배치 버튼 표시
  const showRandomize = gameType === "futsal";

  return (
    <div className="flex items-center gap-3 flex-wrap justify-center">
      <select
        value={formation}
        onChange={(e) => onFormationChange(e.target.value)}
        className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 min-w-[120px]"
      >
        {formations.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {showRandomize && (
        <button
          onClick={onRandomize}
          disabled={!onRandomize}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium whitespace-nowrap min-w-[140px]"
          title="선수들을 여러 팀으로 나눠 배치"
        >
          <Shuffle size={20} />
          <span>랜덤 배치</span>
        </button>
      )}
    </div>
  );
};

export default Controls;
