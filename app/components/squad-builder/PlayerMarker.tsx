import React, { useMemo } from "react";
import { Player, Coordinates } from "../../types/squad-builder";
import { getPositionColor } from "../../utils/squad-builder";

interface PlayerMarkerProps {
  player: Player;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, player: Player) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, player: Player) => void;
}

const PlayerMarker: React.FC<PlayerMarkerProps> = React.memo(
  ({ player, isDragging, onMouseDown, onTouchStart }) => {
    const isGK = player.position === "GK";
    const color = useMemo(
      () => getPositionColor(player.position),
      [player.position]
    );

    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${player.x}%`,
          top: `${player.y}%`,
          pointerEvents: "none",
          zIndex: isGK ? 20 : 10, // 골키퍼가 위에 표시되도록
          willChange: isDragging ? "transform" : "auto", // 성능 최적화
        }}
      >
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center relative touch-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            cursor: isGK ? "not-allowed" : isDragging ? "grabbing" : "grab",
            opacity: isGK ? 0.8 : 1,
            pointerEvents: "auto",
            aspectRatio: "1 / 1", // 정사각형 유지
            willChange: isDragging ? "transform" : "auto", // 성능 최적화
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

          <span className="text-white font-bold text-xs sm:text-sm z-10 select-none">
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
  },
  (prevProps, nextProps) => {
    // 커스텀 비교 함수: player의 id, x, y, position, isDragging만 비교
    return (
      prevProps.player.id === nextProps.player.id &&
      prevProps.player.x === nextProps.player.x &&
      prevProps.player.y === nextProps.player.y &&
      prevProps.player.position === nextProps.player.position &&
      prevProps.isDragging === nextProps.isDragging
    );
  }
);

PlayerMarker.displayName = "PlayerMarker";

export default PlayerMarker;
