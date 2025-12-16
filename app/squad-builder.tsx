"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Player,
  Coordinates,
  CollapsedSections,
  GroupedPlayers,
  GameType,
} from "./types/squad-builder";
import { FORMATIONS, POSITION_CATEGORIES } from "./constants/squad-builder";
import {
  getPositionByLocation,
  getDefaultPositionCoordinates,
  getRandomName,
} from "./utils/squad-builder";
import {
  ErrorToast,
  Controls,
  Field,
  PlayerList,
  SaveLoadPanel,
} from "./components/squad-builder";
import { SquadData } from "./utils/api";

const SquadBuilder: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOffset, setDragOffset] = useState<Coordinates>({ x: 0, y: 0 });
  const [gameType, setGameType] = useState<GameType>("football");
  const [formation, setFormation] = useState<string>("4-3-3");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(
    {}
  );
  const fieldRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // 에러 메시지 표시
  const showError = useCallback((message: string): void => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  }, []);

  // 성공 메시지 표시
  const showSuccess = useCallback((message: string): void => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  }, []);

  // 게임 타입별 최대 주전 선수 수
  const maxMainPlayers = useMemo(() => {
    return gameType === "football" ? 11 : 7;
  }, [gameType]);

  // 게임 타입별 사용 가능한 포메이션
  const availableFormations = useMemo(() => {
    if (gameType === "football") {
      // 축구 포메이션만 (풋살 포메이션 제외)
      return Object.keys(FORMATIONS).filter((key) => !key.includes("인"));
    } else {
      // 풋살 포메이션만
      return Object.keys(FORMATIONS).filter((key) => key.includes("인"));
    }
  }, [gameType]);

  // 현재 포메이션이 사용 가능한 포메이션 목록에 없으면 기본 포메이션으로 설정
  useEffect(() => {
    if (!availableFormations.includes(formation)) {
      const defaultFormation = gameType === "football" ? "4-3-3" : "5인 1-2-1";
      setFormation(defaultFormation);
    }
  }, [gameType, availableFormations, formation]);

  // 컴포넌트 언마운트 시 animationFrame 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 게임 타입 변경 핸들러
  const handleGameTypeChange = useCallback((newGameType: GameType): void => {
    setGameType(newGameType);
    setPlayers([]); // 게임 타입 변경 시 선수 초기화
    // 기본 포메이션 설정
    if (newGameType === "football") {
      setFormation("4-3-3");
    } else {
      setFormation("5인 1-2-1");
    }
  }, []);

  // 포메이션 로드
  const loadFormation = useCallback(
    (formationKey: string): void => {
      setFormation(formationKey);
      const template = FORMATIONS[formationKey];
      const usedNames: string[] = [];

      const newPlayers: Player[] = template.map((t, i) => {
        const name = getRandomName([
          ...players.filter((p: Player) => usedNames.includes(p.name)),
        ]);
        usedNames.push(name);
        return {
          id: Date.now() + i,
          name,
          position: t.pos,
          x: t.x,
          y: t.y,
        };
      });
      setPlayers(newPlayers);
    },
    [players]
  );

  // 선수 이름 변경
  const handleNameChange = useCallback((id: number, name: string): void => {
    setPlayers((prev: Player[]) =>
      prev.map((p: Player) => (p.id === id ? { ...p, name } : p))
    );
  }, []);

  // 선수 포지션 변경
  const handlePositionChange = useCallback(
    (id: number, position: string): void => {
      if (position === "GK") {
        const hasGK = players.some(
          (p: Player) => p.position === "GK" && p.id !== id
        );
        if (hasGK) {
          showError("골키퍼는 한 명만 가능합니다!");
          return;
        }
      }

      const coords = getDefaultPositionCoordinates(position);
      setPlayers((prev: Player[]) =>
        prev.map((p: Player) =>
          p.id === id ? { ...p, position, x: coords.x, y: coords.y } : p
        )
      );
    },
    [players, showError]
  );

  // 선수 삭제
  const deletePlayer = useCallback((id: number): void => {
    setPlayers((prev: Player[]) => prev.filter((p: Player) => p.id !== id));
  }, []);

  // 후보 선수 추가
  const addBenchPlayer = useCallback((): void => {
    const newPlayer: Player = {
      id: Date.now(),
      name: getRandomName(players),
      position: "ST",
      x: 50,
      y: 15,
      isBench: true,
    };
    setPlayers((prev: Player[]) => [...prev, newPlayer]);
  }, [players]);

  // 후보/주전 전환
  const toggleBench = useCallback(
    (id: number): void => {
      const player = players.find((p: Player) => p.id === id);
      if (!player) return;

      // 후보 -> 주전: 최대 인원 제한 확인
      if (player.isBench) {
        const mainCount = players.filter((p: Player) => !p.isBench).length;
        if (mainCount >= maxMainPlayers) {
          showError(`주전은 ${maxMainPlayers}명까지만 가능합니다!`);
          return;
        }
      }

      setPlayers((prev: Player[]) =>
        prev.map((p: Player) => {
          if (p.id === id) {
            if (!p.isBench) {
              // 주전 -> 후보
              return { ...p, isBench: true };
            } else {
              // 후보 -> 주전: 기본 좌표로 배치
              const coords = getDefaultPositionCoordinates(p.position);
              return { ...p, isBench: false, x: coords.x, y: coords.y };
            }
          }
          return p;
        })
      );
    },
    [players, maxMainPlayers, showError]
  );

  // 드래그 시작 (마우스)
  const handleBallMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, player: Player): void => {
      if (player.position === "GK") return;

      e.preventDefault();
      e.stopPropagation();

      const ball = e.currentTarget;
      const rect = ball.getBoundingClientRect();

      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
      setDraggedPlayer(player);
    },
    []
  );

  // 드래그 시작 (터치)
  const handleBallTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, player: Player): void => {
      if (player.position === "GK") return;

      e.preventDefault();
      e.stopPropagation();

      const ball = e.currentTarget;
      const rect = ball.getBoundingClientRect();
      const touch = e.touches[0];

      setDragOffset({
        x: touch.clientX - rect.left - rect.width / 2,
        y: touch.clientY - rect.top - rect.height / 2,
      });
      setDraggedPlayer(player);
    },
    []
  );

  // 드래그 중 (마우스) - requestAnimationFrame으로 throttling
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (!draggedPlayer || !fieldRef.current) return;

      // 이전 프레임 취소
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // requestAnimationFrame으로 throttling (60fps)
      animationFrameRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        // 모바일에서는 16ms마다 업데이트 (60fps)
        if (now - lastUpdateTimeRef.current < 16) return;
        lastUpdateTimeRef.current = now;

        const rect = fieldRef.current!.getBoundingClientRect();
        const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
        const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

        const clampedX = Math.max(5, Math.min(95, x));
        const clampedY = Math.max(5, Math.min(95, y));

        const newPosition = getPositionByLocation(
          clampedX,
          clampedY,
          players,
          draggedPlayer,
          showError,
          gameType
        );

        setPlayers((prev: Player[]) =>
          prev.map((p: Player) =>
            p.id === draggedPlayer.id
              ? { ...p, x: clampedX, y: clampedY, position: newPosition }
              : p
          )
        );
      });
    },
    [draggedPlayer, dragOffset, players, showError, gameType]
  );

  // 드래그 중 (터치) - requestAnimationFrame으로 throttling
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>): void => {
      if (!draggedPlayer || !fieldRef.current) return;

      e.preventDefault();

      // 이전 프레임 취소
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // requestAnimationFrame으로 throttling (60fps)
      animationFrameRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        // 모바일에서는 16ms마다 업데이트 (60fps)
        if (now - lastUpdateTimeRef.current < 16) return;
        lastUpdateTimeRef.current = now;

        const rect = fieldRef.current!.getBoundingClientRect();
        const touch = e.touches[0];
        const x =
          ((touch.clientX - dragOffset.x - rect.left) / rect.width) * 100;
        const y =
          ((touch.clientY - dragOffset.y - rect.top) / rect.height) * 100;

        const clampedX = Math.max(5, Math.min(95, x));
        const clampedY = Math.max(5, Math.min(95, y));

        const newPosition = getPositionByLocation(
          clampedX,
          clampedY,
          players,
          draggedPlayer,
          showError,
          gameType
        );

        setPlayers((prev: Player[]) =>
          prev.map((p: Player) =>
            p.id === draggedPlayer.id
              ? { ...p, x: clampedX, y: clampedY, position: newPosition }
              : p
          )
        );
      });
    },
    [draggedPlayer, dragOffset, players, showError, gameType]
  );

  // 드래그 종료
  const handleMouseUp = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDraggedPlayer(null);
  }, []);

  const handleTouchEnd = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDraggedPlayer(null);
  }, []);

  // 섹션 토글
  const toggleSection = useCallback((category: string): void => {
    setCollapsedSections((prev: CollapsedSections) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // 스쿼드 불러오기
  const handleLoadSquad = useCallback((squad: SquadData): void => {
    setFormation(squad.formation);
    setPlayers(squad.players);
  }, []);

  // 필드 캡처 및 다운로드
  const handleCaptureField = useCallback(async (): Promise<void> => {
    if (!fieldRef.current) {
      showError("필드를 찾을 수 없습니다.");
      return;
    }

    try {
      showSuccess("이미지 생성 중...");

      // html2canvas-pro를 동적으로 import (클라이언트 사이드에서만 실행, LAB 컬러 지원)
      const html2canvasModule = await import("html2canvas-pro" as any);
      const html2canvas = html2canvasModule.default || html2canvasModule;

      // 필드만 캡처 - 안전한 옵션 사용 (LAB 컬러 파싱 오류 방지)
      const canvas = await html2canvas(fieldRef.current, {
        backgroundColor: "#15803d", // 필드 배경색
        scale: 1.5, // 해상도 조정
        logging: false,
        useCORS: true,
        allowTaint: false,
        removeContainer: true,
        foreignObjectRendering: false,
      });

      // Canvas를 Blob으로 변환
      canvas.toBlob(
        (blob: Blob | null) => {
          try {
            if (!blob) {
              showError("이미지 변환에 실패했습니다.");
              return;
            }

            // Blob URL 생성
            const url = URL.createObjectURL(blob);

            // 다운로드 링크 생성
            const link = document.createElement("a");
            const fileName = `${
              gameType === "football" ? "football" : "futsal"
            }_squad_${formation.replace(
              /\s+/g,
              "_"
            )}_${new Date().getTime()}.png`;

            link.download = fileName;
            link.href = url;
            link.style.display = "none";

            // DOM에 추가하고 클릭 후 제거
            document.body.appendChild(link);

            // 약간의 지연을 주어 브라우저가 준비될 시간 제공
            setTimeout(() => {
              try {
                link.click();
                document.body.removeChild(link);

                // Blob URL 해제
                setTimeout(() => URL.revokeObjectURL(url), 200);

                showSuccess("이미지가 저장되었습니다!");
              } catch (downloadError) {
                console.error("다운로드 실패:", downloadError);
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showError(
                  "이미지 다운로드에 실패했습니다. 브라우저 설정을 확인해주세요."
                );
              }
            }, 10);
          } catch (error) {
            console.error("Blob 처리 오류:", error);
            showError("이미지 저장 처리 중 오류가 발생했습니다.");
          }
        },
        "image/png",
        1.0 // 품질 (0.0 ~ 1.0)
      );
    } catch (error) {
      console.error("캡처 실패:", error);
      showError("이미지 저장에 실패했습니다. 다시 시도해주세요.");
    }
  }, [gameType, formation, showError, showSuccess]);

  // 주전 선수만 필터링
  const mainPlayers = players.filter((p: Player) => !p.isBench);

  // 포지션별 선수 그룹화 (주전만)
  const groupedPlayers: GroupedPlayers = Object.keys(
    POSITION_CATEGORIES
  ).reduce((acc, category) => {
    acc[category] = mainPlayers.filter((p: Player) =>
      POSITION_CATEGORIES[category].positions.includes(p.position)
    );
    return acc;
  }, {} as GroupedPlayers);

  return (
    <div
      className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-gray-900"
      style={{
        padding:
          "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
        paddingTop: "calc(1rem + env(safe-area-inset-top))",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        paddingLeft: "calc(1rem + env(safe-area-inset-left))",
        paddingRight: "calc(1rem + env(safe-area-inset-right))",
        overflowX: "hidden", // 가로 스크롤 방지
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ErrorToast message={errorMessage} />

      {/* 성공 메시지 토스트 */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ✅ {successMessage}
        </div>
      )}

      <div
        className="mx-auto"
        style={{
          width: "100%",
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1
          className="text-white font-bold text-center"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2rem)", // 반응형 폰트
            marginBottom: "0.5rem",
          }}
        >
          {gameType === "football" ? "⚽" : "🥅"}{" "}
          {gameType === "football" ? "축구" : "풋살"} 스쿼드 빌더
        </h1>

        {/* 게임 타입 선택 버튼 */}
        <div
          className="flex justify-center"
          style={{
            gap: "0.75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => handleGameTypeChange("football")}
            className={`rounded-lg font-semibold transition-all ${
              gameType === "football"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            style={{
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              minHeight: "44px", // 최소 터치 영역
            }}
          >
            ⚽ 축구 스쿼드
          </button>
          <button
            onClick={() => handleGameTypeChange("futsal")}
            className={`rounded-lg font-semibold transition-all ${
              gameType === "futsal"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            style={{
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              minHeight: "44px", // 최소 터치 영역
            }}
          >
            🥅 풋살 스쿼드
          </button>
        </div>

        {/* 컨트롤 영역 */}
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: "0.75rem",
            marginBottom: "1rem",
            justifyContent: "center",
          }}
        >
          <Controls
            formation={formation}
            formations={availableFormations}
            onFormationChange={loadFormation}
          />
          <SaveLoadPanel
            currentFormation={formation}
            currentPlayers={players}
            onLoad={handleLoadSquad}
            onSuccess={showSuccess}
            onError={showError}
          />
          <button
            onClick={handleCaptureField}
            className="bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all flex items-center"
            style={{
              padding: "0.75rem 1rem",
              gap: "0.5rem",
              fontSize: "0.875rem",
              minHeight: "44px",
            }}
          >
            📸 스쿼드 캡처
          </button>
        </div>

        {/* 필드와 선수 목록 - 모바일 퍼스트 레이아웃 */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{
            width: "100%",
          }}
        >
          {/* 필드 영역 */}
          <div style={{ width: "100%", margin: "0 auto", maxWidth: "100%" }}>
            <Field
              ref={fieldRef}
              players={mainPlayers}
              draggedPlayerId={draggedPlayer?.id ?? null}
              onPlayerMouseDown={handleBallMouseDown}
              onPlayerTouchStart={handleBallTouchStart}
              gameType={gameType}
            />
          </div>

          {/* 선수 목록 - 모바일에서는 필드 아래, 데스크톱에서는 옆 */}
          <div
            style={{
              width: "100%",
            }}
          >
            <PlayerList
              players={players}
              groupedPlayers={groupedPlayers}
              collapsedSections={collapsedSections}
              onToggleSection={toggleSection}
              onNameChange={handleNameChange}
              onPositionChange={handlePositionChange}
              onDelete={deletePlayer}
              onToggleBench={toggleBench}
              onAddBenchPlayer={addBenchPlayer}
              gameType={gameType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadBuilder;
