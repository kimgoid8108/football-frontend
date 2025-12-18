import React, { forwardRef, useMemo, useState, useEffect, useRef } from "react";
import { Player, GameType } from "../../types/squad-builder";
import PlayerMarker from "./PlayerMarker";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FieldProps {
  players: Player[];
  draggedPlayerId: number | null;
  onPlayerMouseDown: (
    e: React.MouseEvent<HTMLDivElement>,
    player: Player
  ) => void;
  onPlayerTouchStart: (
    e: React.TouchEvent<HTMLDivElement>,
    player: Player
  ) => void;
  gameType?: GameType;
  currentTeamIndex?: number;
  onTeamIndexChange?: (index: number) => void;
}

// 축구용 포지션 영역 정의
const FOOTBALL_POSITION_ZONES = [
  // GK 영역
  { x: 18, y: 82, width: 64, height: 18, label: "GK", color: "#FFD700" },

  // 수비 라인 (y: 69-82)
  { x: 0, y: 69, width: 20, height: 13, label: "LB", color: "#3B82F6" },
  { x: 20, y: 69, width: 20, height: 13, label: "LCB", color: "#3B82F6" },
  { x: 40, y: 69, width: 20, height: 13, label: "CB", color: "#3B82F6" },
  { x: 60, y: 69, width: 20, height: 13, label: "RCB", color: "#3B82F6" },
  { x: 80, y: 69, width: 20, height: 13, label: "RB", color: "#3B82F6" },

  // 수비형 미드필더 (y: 56-69)
  { x: 0, y: 56, width: 15, height: 13, label: "LWB", color: "#3B82F6" },
  { x: 15, y: 56, width: 25, height: 13, label: "LDM", color: "#10B981" },
  { x: 40, y: 56, width: 20, height: 13, label: "CDM", color: "#10B981" },
  { x: 60, y: 56, width: 25, height: 13, label: "RDM", color: "#10B981" },
  { x: 85, y: 56, width: 15, height: 13, label: "RWB", color: "#3B82F6" },

  // 중앙 미드필더 (y: 43-56)
  { x: 0, y: 43, width: 18, height: 13, label: "LM", color: "#10B981" },
  { x: 18, y: 43, width: 22, height: 13, label: "LCM", color: "#10B981" },
  { x: 40, y: 43, width: 20, height: 13, label: "CM", color: "#10B981" },
  { x: 60, y: 43, width: 22, height: 13, label: "RCM", color: "#10B981" },
  { x: 82, y: 43, width: 18, height: 13, label: "RM", color: "#10B981" },

  // 공격형 미드필더 (y: 30-43)
  { x: 0, y: 30, width: 18, height: 13, label: "LM", color: "#10B981" },
  { x: 18, y: 30, width: 22, height: 13, label: "LAM", color: "#10B981" },
  { x: 40, y: 30, width: 20, height: 13, label: "CAM", color: "#10B981" },
  { x: 60, y: 30, width: 22, height: 13, label: "RAM", color: "#10B981" },
  { x: 82, y: 30, width: 18, height: 13, label: "RM", color: "#10B981" },

  // 세컨드 스트라이커 (y: 20-30)
  { x: 0, y: 20, width: 18, height: 10, label: "LW", color: "#EF4444" },
  { x: 18, y: 20, width: 22, height: 10, label: "LF", color: "#EF4444" },
  { x: 40, y: 20, width: 20, height: 10, label: "CF", color: "#EF4444" },
  { x: 60, y: 20, width: 22, height: 10, label: "RF", color: "#EF4444" },
  { x: 82, y: 20, width: 18, height: 10, label: "RW", color: "#EF4444" },

  // 최전방 (y: 0-20)
  { x: 0, y: 5, width: 18, height: 15, label: "LW", color: "#EF4444" },
  { x: 18, y: 5, width: 22, height: 15, label: "LS", color: "#EF4444" },
  { x: 40, y: 5, width: 20, height: 15, label: "ST", color: "#EF4444" },
  { x: 60, y: 5, width: 22, height: 15, label: "RS", color: "#EF4444" },
  { x: 82, y: 5, width: 18, height: 15, label: "RW", color: "#EF4444" },
];

// 풋살용 간단한 포지션 영역 정의
const FUTSAL_POSITION_ZONES = [
  // GK 영역
  { x: 18, y: 82, width: 64, height: 18, label: "GK", color: "#FFD700" },
  // DF 영역
  { x: 0, y: 65, width: 100, height: 17, label: "DF", color: "#3B82F6" },
  // MF 영역
  { x: 0, y: 35, width: 100, height: 30, label: "MF", color: "#10B981" },
  // FW 영역
  { x: 0, y: 0, width: 100, height: 35, label: "FW", color: "#EF4444" },
];

const Field = forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      players,
      draggedPlayerId,
      onPlayerMouseDown,
      onPlayerTouchStart,
      gameType = "football",
      currentTeamIndex: externalTeamIndex,
      onTeamIndexChange,
    },
    ref
  ) => {
    const isDragging = draggedPlayerId !== null;
    const positionZones = useMemo(
      () =>
        gameType === "futsal" ? FUTSAL_POSITION_ZONES : FOOTBALL_POSITION_ZONES,
      [gameType]
    );

    // 모바일 감지 및 팀별 그룹화
    const [isMobile, setIsMobile] = useState(false);
    const [internalTeamIndex, setInternalTeamIndex] = useState(0);

    // 외부에서 전달된 팀 인덱스가 있으면 사용, 없으면 내부 상태 사용
    const currentTeamIndex =
      externalTeamIndex !== undefined ? externalTeamIndex : internalTeamIndex;

    const setCurrentTeamIndex = (
      indexOrUpdater: number | ((prev: number) => number)
    ) => {
      if (onTeamIndexChange) {
        if (typeof indexOrUpdater === "function") {
          const newIndex = indexOrUpdater(currentTeamIndex);
          onTeamIndexChange(newIndex);
        } else {
          onTeamIndexChange(indexOrUpdater);
        }
      } else {
        if (typeof indexOrUpdater === "function") {
          setInternalTeamIndex(indexOrUpdater);
        } else {
          setInternalTeamIndex(indexOrUpdater);
        }
      }
    };
    const carouselRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 팀별로 그룹화
    const { teams, noTeamPlayers } = useMemo(() => {
      const teamsMap: { [teamName: string]: Player[] } = {};
      const noTeam: Player[] = [];

      players.forEach((player) => {
        if (player.teamName) {
          if (!teamsMap[player.teamName]) {
            teamsMap[player.teamName] = [];
          }
          teamsMap[player.teamName].push(player);
        } else {
          noTeam.push(player);
        }
      });

      return { teams: teamsMap, noTeamPlayers: noTeam };
    }, [players]);

    const teamEntries = Object.entries(teams);
    const hasMultipleTeams = teamEntries.length > 1;
    const showCarousel = hasMultipleTeams; // 모바일/데스크톱 모두 캐러셀 표시

    // currentTeamIndex가 범위를 벗어나지 않도록 조정
    useEffect(() => {
      if (teamEntries.length > 0 && currentTeamIndex >= teamEntries.length) {
        setCurrentTeamIndex(0);
      }
    }, [teamEntries.length, currentTeamIndex]);

    // 현재 표시할 선수들
    const currentPlayers = useMemo(() => {
      if (showCarousel && teamEntries.length > 0) {
        const validIndex = Math.min(currentTeamIndex, teamEntries.length - 1);
        const teamPlayers = teamEntries[validIndex]?.[1] || [];
        return teamPlayers.length > 0 ? teamPlayers : players; // 팀 선수가 없으면 모든 선수 표시
      }
      return players; // 팀이 1개 이하일 때는 모든 선수 표시
    }, [showCarousel, teamEntries, currentTeamIndex, players]);

    // 스와이프/드래그 처리
    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return;
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (distance > minSwipeDistance) {
        // 왼쪽으로 스와이프 (다음 팀, 마지막이면 첫 번째로)
        setCurrentTeamIndex((prev) => (prev + 1) % teamEntries.length);
      } else if (distance < -minSwipeDistance) {
        // 오른쪽으로 스와이프 (이전 팀, 첫 번째면 마지막으로)
        setCurrentTeamIndex(
          (prev) => (prev - 1 + teamEntries.length) % teamEntries.length
        );
      }
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    // 마우스 드래그 처리 (데스크톱)
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!showCarousel) return;
      touchStartX.current = e.clientX;
      e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!showCarousel || touchStartX.current === 0) return;
      touchEndX.current = e.clientX;
    };

    const handleMouseUp = () => {
      if (!showCarousel || !touchStartX.current || !touchEndX.current) {
        touchStartX.current = 0;
        touchEndX.current = 0;
        return;
      }
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (distance > minSwipeDistance) {
        // 왼쪽으로 드래그 (다음 팀, 마지막이면 첫 번째로)
        setCurrentTeamIndex((prev) => (prev + 1) % teamEntries.length);
      } else if (distance < -minSwipeDistance) {
        // 오른쪽으로 드래그 (이전 팀, 첫 번째면 마지막으로)
        setCurrentTeamIndex(
          (prev) => (prev - 1 + teamEntries.length) % teamEntries.length
        );
      }
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    return (
      <div className="relative">
        {/* 팀 네비게이션 (여러 팀이 있을 때 표시) */}
        {showCarousel && (
          <div className="flex items-center justify-between mb-3 px-2">
            <button
              onClick={() =>
                setCurrentTeamIndex(
                  (prev) => (prev - 1 + teamEntries.length) % teamEntries.length
                )
              }
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {teamEntries.map(([teamName], index) => (
                <button
                  key={teamName}
                  onClick={() => setCurrentTeamIndex(index)}
                  className={`h-2 rounded-full transition ${
                    index === currentTeamIndex
                      ? "bg-purple-500 w-6"
                      : "bg-gray-600 w-2"
                  }`}
                />
              ))}
            </div>
            <div className="text-white text-sm font-medium min-w-[60px] text-center">
              {teamEntries[currentTeamIndex]?.[0] || ""}
            </div>
            <button
              onClick={() =>
                setCurrentTeamIndex((prev) => (prev + 1) % teamEntries.length)
              }
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div
          ref={ref}
          className="relative bg-green-700 rounded-lg shadow-2xl max-w-[393px] md:max-w-[600px] mx-auto"
          style={{
            backgroundImage:
              "linear-gradient(0deg, #15803d 0%, #15803d 50%, #166534 50%, #166534 100%)",
            backgroundSize: "100% 20px",
            aspectRatio: "9 / 16", // 모바일 세로 방향
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
            overflow: "visible", // 골키퍼가 잘리지 않도록
            position: "relative",
            cursor: showCarousel ? "grab" : "default",
          }}
          onTouchStart={showCarousel ? handleTouchStart : undefined}
          onTouchMove={showCarousel ? handleTouchMove : undefined}
          onTouchEnd={showCarousel ? handleTouchEnd : undefined}
          onMouseDown={showCarousel ? handleMouseDown : undefined}
          onMouseMove={showCarousel ? handleMouseMove : undefined}
          onMouseUp={showCarousel ? handleMouseUp : undefined}
          onMouseLeave={showCarousel ? handleMouseUp : undefined}
        >
          {/* 필드 내부 컨테이너 (패딩 영역 - 골키퍼 잘림 방지) */}
          <div
            className="absolute inset-0"
            style={{ padding: "clamp(8px, 3%, 12px)" }}
          >
            {/* 포지션 영역 오버레이 (드래그 중일 때만 표시) */}
            {isDragging && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{ willChange: "opacity" }}
              >
                {positionZones.map((zone, index) => (
                  <div
                    key={index}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      backgroundColor: `${zone.color}20`,
                      border: `1px dashed ${zone.color}80`,
                      borderRadius: "4px",
                    }}
                  >
                    <span
                      className="text-xs font-bold px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: `${zone.color}CC`,
                        color: zone.color === "#FFD700" ? "#000" : "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {zone.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 필드 라인 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: 0.8 }}
            >
              {/* 골대 (상단) */}
              <rect
                x="5%"
                y="2%"
                width="90%"
                height="18%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              {/* 골대 (하단) */}
              <rect
                x="5%"
                y="80%"
                width="90%"
                height="18%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              {/* 중앙 라인 */}
              <line
                x1="5%"
                y1="50%"
                x2="95%"
                y2="50%"
                stroke="white"
                strokeWidth="3.5"
              />
              {/* 중앙 서클 */}
              <circle
                cx="50%"
                cy="50%"
                r="15%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              {/* 중앙 점 */}
              <circle cx="50%" cy="50%" r="2%" fill="white" />
            </svg>

            {/* 선수 마커 */}
            {currentPlayers.map((player) => (
              <PlayerMarker
                key={player.id}
                player={player}
                isDragging={draggedPlayerId === player.id}
                onMouseDown={onPlayerMouseDown}
                onTouchStart={onPlayerTouchStart}
                gameType={gameType}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Field.displayName = "Field";

export default Field;
