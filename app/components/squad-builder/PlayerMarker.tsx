import React from "react";
import { Player, Coordinates } from "../../types/squad-builder";
import { getPositionColor } from "../../utils/squad-builder";

interface PlayerMarkerProps {
  player: Player;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, player: Player) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, player: Player) => void;
}

const PlayerMarker: React.FC<PlayerMarkerProps> = ({
  player,
  isDragging,
  onMouseDown,
  onTouchStart,
}) => {
  const isGK = player.position === "GK";
  const color = getPositionColor(player.position);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
        pointerEvents: "none",
      }}
    >
      <div
        className="w-16 h-20 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center relative touch-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          cursor: isGK ? "not-allowed" : isDragging ? "grabbing" : "grab",
          opacity: isGK ? 0.8 : 1,
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => onMouseDown(e, player)}
        onTouchStart={(e) => onTouchStart(e, player)}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)",
          }}
        />

        <span className="text-white font-bold text-sm md:text-xs z-10">
          {player.position}
        </span>
      </div>

      {player.name && (
        <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
            {player.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerMarker;
