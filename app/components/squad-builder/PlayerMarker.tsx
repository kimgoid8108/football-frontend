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
        className="absolute"
        style={{
          left: `${player.x}%`,
          top: `${player.y}%`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: isGK ? 20 : 10,
          willChange: isDragging ? "transform" : "auto",
        }}
      >
        {/* 완전한 원형 마커 - 최소 48px 터치 영역, 데스크톱에서는 더 크게 */}
        <div
          className="rounded-full shadow-lg flex items-center justify-center relative touch-none"
          style={{
            width: "clamp(48px, 12vw, 64px)", // 모바일 48px, 데스크톱 최대 64px
            height: "clamp(48px, 12vw, 64px)", // width와 동일하게 설정
            aspectRatio: "1 / 1", // 완전한 원형 유지
            background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
            border: "2px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            cursor: isGK ? "not-allowed" : isDragging ? "grabbing" : "grab",
            opacity: isGK ? 0.8 : 1,
            pointerEvents: "auto",
            willChange: isDragging ? "transform" : "auto",
            borderRadius: "50%", // 완전한 원형 보장
            minWidth: "48px", // 최소 터치 영역 보장
            minHeight: "48px",
          }}
          onMouseDown={(e) => onMouseDown(e, player)}
          onTouchStart={(e) => onTouchStart(e, player)}
        >
          {/* 그라데이션 오버레이 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)",
              borderRadius: "50%",
            }}
          />

          {/* 포지션 텍스트 - 반응형 폰트 */}
          <span
            className="text-white font-bold z-10 select-none"
            style={{
              fontSize: "clamp(10px, 2.5vw, 12px)", // 모바일 작게, 데스크톱 약간 크게
              lineHeight: "1",
            }}
          >
            {player.position}
          </span>
        </div>

        {/* 선수 이름 - 말줄임 처리 */}
        {player.name && (
          <div
            className="absolute top-full left-1/2 pointer-events-none"
            style={{
              transform: "translateX(-50%)",
              marginTop: "4px",
              maxWidth: "clamp(60px, 15vw, 100px)", // 반응형 최대 너비
              width: "max-content",
            }}
          >
            <span
              className="bg-black bg-opacity-70 text-white px-1.5 py-0.5 rounded font-semibold block"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                fontSize: "clamp(10px, 2.5vw, 12px)",
              }}
              title={player.name} // 툴팁으로 전체 이름 표시
            >
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
