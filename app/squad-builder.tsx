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
  RandomizeModal,
} from "./components/squad-builder";
import {
  SquadData,
  getToken,
  createSquad,
  updateSquad,
  saveLocalSquad,
  updateLocalSquad,
} from "./utils/api";
import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const SquadBuilder: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
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
  const [currentSquadId, setCurrentSquadId] = useState<number | null>(null);
  const [pendingGameType, setPendingGameType] = useState<GameType | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRandomizeModal, setShowRandomizeModal] = useState(false);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const fieldRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const isLoadingSquadRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  const playersRef = useRef<Player[]>([]);
  const loadedSquadRef = useRef<SquadData | null>(null); // 로드된 스쿼드 원본 저장

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

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

  // 현재 포메이션이 사용 불가능하면 기본 포메이션으로 설정
  useEffect(() => {
    if (
      !isLoadingSquadRef.current &&
      !availableFormations.includes(formation)
    ) {
      setFormation(gameType === "football" ? "4-3-3" : "5인 1-2-1");
    }
  }, [gameType, availableFormations, formation]);

  // 초기 로드 시 포메이션에 맞게 선수 자동 로드
  useEffect(() => {
    if (
      !isLoadingSquadRef.current &&
      !hasInitializedRef.current &&
      players.length === 0 &&
      !currentSquadId &&
      formation &&
      FORMATIONS[formation]
    ) {
      const template = FORMATIONS[formation];
      setPlayers(
        template.map((t, i) => ({
          id: Date.now() + i,
          name: getRandomName([]),
          position: t.pos,
          x: t.x,
          y: t.y,
        }))
      );
      hasInitializedRef.current = true;
    }
  }, [formation, players.length, currentSquadId]);

  // 컴포넌트 언마운트 시 animationFrame 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // players ref 업데이트
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // 모바일 터치 이벤트를 non-passive로 등록하여 preventDefault 가능하게 함
  useEffect(() => {
    const fieldElement = fieldRef.current;
    if (!fieldElement) return;

    const handleTouchMoveNative = (e: TouchEvent) => {
      if (!draggedPlayer) return;
      e.preventDefault(); // non-passive 리스너이므로 preventDefault 가능
    };

    const handleTouchStartNative = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const draggableElement = target.closest('[data-draggable="true"]');
      if (!draggableElement) return;

      const isGK = draggableElement.getAttribute("data-position") === "GK";
      if (isGK && gameType === "football") return;

      e.preventDefault();
      e.stopPropagation();

      const playerId = draggableElement.getAttribute("data-player-id");
      if (playerId) {
        const player = playersRef.current.find(
          (p) => p.id === Number(playerId)
        );
        if (player) {
          const rect = draggableElement.getBoundingClientRect();
          const touch = e.touches[0];
          setDragOffset({
            x: touch.clientX - rect.left - rect.width / 2,
            y: touch.clientY - rect.top - rect.height / 2,
          });
          setDraggedPlayer(player);
        }
      }
    };

    fieldElement.addEventListener("touchmove", handleTouchMoveNative, {
      passive: false,
    });
    fieldElement.addEventListener("touchstart", handleTouchStartNative, {
      passive: false,
      capture: true,
    });

    return () => {
      fieldElement.removeEventListener("touchmove", handleTouchMoveNative);
      fieldElement.removeEventListener("touchstart", handleTouchStartNative, {
        capture: true,
      });
    };
  }, [draggedPlayer, gameType]);

  // 스쿼드 변경사항 확인
  const hasChanges = useCallback((): boolean => {
    if (!loadedSquadRef.current) return false;

    const loaded = loadedSquadRef.current;
    if (
      players.length !== loaded.players.length ||
      formation !== loaded.formation
    ) {
      return true;
    }

    return players.some((current) => {
      const loaded = loadedSquadRef.current!.players.find(
        (p) => p.id === current.id
      );
      return (
        !loaded ||
        current.name !== loaded.name ||
        current.position !== loaded.position ||
        Math.abs(current.x - loaded.x) > 0.1 ||
        Math.abs(current.y - loaded.y) > 0.1 ||
        current.isBench !== loaded.isBench
      );
    });
  }, [players, formation]);

  // 게임 타입 변경 실행
  const proceedGameTypeChange = useCallback((newGameType: GameType): void => {
    setGameType(newGameType);
    setPlayers([]);
    setCurrentSquadId(null);
    loadedSquadRef.current = null;
    hasInitializedRef.current = false;
    setFormation(newGameType === "football" ? "4-3-3" : "5인 1-2-1");
  }, []);

  // 게임 타입 변경 핸들러
  const handleGameTypeChange = useCallback(
    (newGameType: GameType): void => {
      if (newGameType === gameType) return;

      const mainPlayers = players.filter((p) => !p.isBench);
      if (mainPlayers.length > 0 && hasChanges()) {
        setPendingGameType(newGameType);
        setShowSaveConfirm(true);
        return;
      }

      proceedGameTypeChange(newGameType);
    },
    [gameType, players, hasChanges, proceedGameTypeChange]
  );

  // 현재 스쿼드 저장 후 게임 타입 변경
  const handleSaveAndChangeGameType = useCallback(async (): Promise<void> => {
    if (!pendingGameType) return;

    const mainPlayers = players.filter((p) => !p.isBench);
    if (mainPlayers.length === 0) {
      proceedGameTypeChange(pendingGameType);
      setShowSaveConfirm(false);
      setPendingGameType(null);
      return;
    }

    try {
      const isGuestMode = !getToken();
      const squadData = {
        name: `${
          gameType === "football" ? "축구" : "풋살"
        } 스쿼드 ${new Date().toLocaleString("ko-KR")}`,
        formation,
        players,
        gameType,
      };

      let savedSquad: SquadData;

      // 현재 로드된 스쿼드가 있으면 업데이트, 없으면 새로 생성
      const isUpdate = !!currentSquadId;
      if (isUpdate) {
        savedSquad = isGuestMode
          ? (updateLocalSquad(currentSquadId, squadData),
            { ...squadData, id: currentSquadId })
          : await updateSquad(currentSquadId, squadData);
        showSuccess("스쿼드가 업데이트되었습니다!");
      } else {
        savedSquad = isGuestMode
          ? saveLocalSquad(squadData)
          : await createSquad(squadData);
        showSuccess("스쿼드가 저장되었습니다!");
      }

      const savedSquadId = savedSquad.id;
      proceedGameTypeChange(pendingGameType);
      if (savedSquadId) {
        setCurrentSquadId(savedSquadId);
      }

      setShowSaveConfirm(false);
      setPendingGameType(null);
    } catch (error) {
      console.error("스쿼드 저장 에러:", error);
      showError("스쿼드 저장에 실패했습니다.");
    }
  }, [
    pendingGameType,
    players,
    formation,
    gameType,
    currentSquadId,
    showSuccess,
    showError,
    proceedGameTypeChange,
  ]);

  // 저장하지 않고 게임 타입 변경
  const handleSkipSaveAndChangeGameType = useCallback((): void => {
    if (!pendingGameType) return;
    proceedGameTypeChange(pendingGameType);
    setShowSaveConfirm(false);
    setPendingGameType(null);
  }, [pendingGameType, proceedGameTypeChange]);

  // 포메이션 로드
  const loadFormation = useCallback(
    (formationKey: string): void => {
      setFormation(formationKey);
      setCurrentSquadId(null);
      const template = FORMATIONS[formationKey];
      const usedNames: string[] = [];

      setPlayers(
        template.map((t, i) => ({
          id: Date.now() + i,
          name: getRandomName(
            players.filter((p) => usedNames.includes(p.name))
          ),
          position: t.pos,
          x: t.x,
          y: t.y,
        }))
      );
    },
    [players]
  );

  // 랜덤 배치 모달 열기
  const handleRandomize = useCallback((): void => {
    if (!formation || !FORMATIONS[formation]) {
      showError("포메이션을 먼저 선택해주세요.");
      return;
    }
    setShowRandomizeModal(true);
  }, [formation, showError]);

  // 랜덤 배치 확인
  const handleRandomizeConfirm = useCallback(
    async (
      teams: { name: string; position: string; x: number; y: number }[][]
    ): Promise<void> => {
      if (!formation || !FORMATIONS[formation]) return;

      const benchPlayers = players.filter((p) => p.isBench);
      const isGuestMode = !getToken();

      // 모든 팀의 선수들을 하나의 배열로 합치기 (팀 이름 포함)
      let playerIdCounter = Date.now();
      const allPlayers: Player[] = [];
      const savedTeamNames: string[] = [];

      // 각 팀을 저장
      for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
        const team = teams[teamIndex];
        const teamName = `랜덤 팀 ${teamIndex + 1}`;
        savedTeamNames.push(teamName);

        // 팀 선수들 생성
        const teamPlayers: Player[] = team.map((p) => {
          const player: Player = {
            id: playerIdCounter++,
            name: p.name,
            position: p.position,
            x: p.x,
            y: p.y,
            teamName: teamName, // 팀 이름 추가
          };
          allPlayers.push(player);
          return player;
        });

        // 각 팀을 별도의 스쿼드로 저장
        try {
          const squadData: SquadData = {
            name: teamName,
            formation: formation,
            players: teamPlayers,
            gameType: gameType,
          };

          if (isGuestMode) {
            // 비계정 모드: 로컬 스토리지에 저장
            saveLocalSquad(squadData);
          } else {
            // 계정 모드: API에 저장
            await createSquad(squadData);
          }
        } catch (error) {
          console.error(`팀 ${teamIndex + 1} 저장 실패:`, error);
          // 저장 실패해도 계속 진행
        }
      }

      setPlayers([...allPlayers, ...benchPlayers]);
      // 랜덤 배치 후 첫 번째 팀으로 초기화
      setCurrentTeamIndex(0);
      showSuccess(
        `${teams.length}개 팀이 배치되고 저장되었습니다! (${savedTeamNames.join(
          ", "
        )})`
      );
    },
    [formation, players, gameType, showSuccess]
  );

  // 선수 이름 변경
  const handleNameChange = useCallback((id: number, name: string): void => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // 선수 포지션 변경
  const handlePositionChange = useCallback(
    (id: number, position: string): void => {
      // 축구일 때만 골키퍼 제한 적용 (풋살은 자유롭게 교체 가능)
      if (position === "GK" && gameType === "football") {
        const hasGK = players.some(
          (p: Player) => p.position === "GK" && p.id !== id
        );
        if (hasGK) {
          showError("골키퍼는 한 명만 가능합니다!");
          return;
        }
      }

      const coords = getDefaultPositionCoordinates(position);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, position, x: coords.x, y: coords.y } : p
        )
      );
    },
    [players, showError, gameType]
  );

  // 선수 삭제
  const deletePlayer = useCallback((id: number): void => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
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
    setPlayers((prev) => [...prev, newPlayer]);
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

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return !p.isBench
              ? { ...p, isBench: true }
              : {
                  ...p,
                  isBench: false,
                  ...getDefaultPositionCoordinates(p.position),
                };
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
      // 축구일 때만 골키퍼 드래그 제한 (풋살은 자유롭게 드래그 가능)
      if (player.position === "GK" && gameType === "football") return;

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
    [gameType]
  );

  // 드래그 시작 (터치)
  const handleBallTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, player: Player): void => {
      // 축구일 때만 골키퍼 드래그 제한 (풋살은 자유롭게 드래그 가능)
      if (player.position === "GK" && gameType === "football") return;

      // preventDefault는 native 이벤트 리스너에서 처리됨
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
    [gameType]
  );

  // 드래그 중 위치 업데이트 (공통 로직)
  const updatePlayerPosition = useCallback(
    (clientX: number, clientY: number): void => {
      if (!draggedPlayer || !fieldRef.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 16) return;
        lastUpdateTimeRef.current = now;

        const rect = fieldRef.current!.getBoundingClientRect();
        const x = ((clientX - dragOffset.x - rect.left) / rect.width) * 100;
        const y = ((clientY - dragOffset.y - rect.top) / rect.height) * 100;

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

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === draggedPlayer.id
              ? { ...p, x: clampedX, y: clampedY, position: newPosition }
              : p
          )
        );
      });
    },
    [draggedPlayer, dragOffset, players, showError, gameType]
  );

  // 드래그 중 (마우스)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      updatePlayerPosition(e.clientX, e.clientY);
    },
    [updatePlayerPosition]
  );

  // 드래그 중 (터치)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>): void => {
      if (e.touches[0]) {
        updatePlayerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [updatePlayerPosition]
  );

  // 드래그 종료 (공통)
  const handleDragEnd = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDraggedPlayer(null);
  }, []);

  const handleMouseUp = handleDragEnd;
  const handleTouchEnd = handleDragEnd;

  // 섹션 토글
  const toggleSection = useCallback((category: string): void => {
    setCollapsedSections((prev: CollapsedSections) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // 스쿼드 불러오기
  const handleLoadSquad = useCallback(
    (squad: SquadData): void => {
      // 저장된 게임 타입이 있으면 해당 게임 타입으로 전환, 없으면 선수 수로 판단
      let targetGameType: GameType = squad.gameType || "football";
      if (!squad.gameType) {
        const mainPlayersCount = squad.players.filter((p) => !p.isBench).length;
        targetGameType = mainPlayersCount <= 7 ? "futsal" : "football";
      }

      isLoadingSquadRef.current = true;
      hasInitializedRef.current = true;
      setCurrentSquadId(squad.id || null);
      loadedSquadRef.current = {
        ...squad,
        players: squad.players.map((p) => ({ ...p })),
      };

      if (targetGameType !== gameType) {
        setGameType(targetGameType);
      }
      setFormation(squad.formation);
      setPlayers(squad.players);

      setTimeout(() => {
        isLoadingSquadRef.current = false;
      }, 0);
    },
    [gameType]
  );

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

  // 주전 선수 및 포지션별 그룹화 (메모이제이션)
  const { mainPlayers, groupedPlayers } = useMemo(() => {
    const main = players.filter((p) => !p.isBench);
    const grouped: GroupedPlayers = Object.keys(POSITION_CATEGORIES).reduce(
      (acc, category) => {
        acc[category] = main.filter((p) =>
          POSITION_CATEGORIES[category].positions.includes(p.position)
        );
        return acc;
      },
      {} as GroupedPlayers
    );
    return { mainPlayers: main, groupedPlayers: grouped };
  }, [players]);

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
        touchAction: draggedPlayer ? "none" : "auto", // 드래그 중일 때 터치 동작 비활성화
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ErrorToast message={errorMessage} />

      {/* 성공 메시지 토스트 - 상단에서 슬라이드 다운/업 */}
      {successMessage && (
        <div
          className="fixed left-1/2 bg-green-600 text-white px-6 py-4 rounded-b-lg shadow-2xl z-[9999] animate-slide-down-up font-medium"
          style={{
            top: 0,
            transform: "translateX(-50%)",
            minWidth: "200px",
            textAlign: "center",
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {/* 랜덤 배치 모달 */}
      <RandomizeModal
        isOpen={showRandomizeModal}
        onClose={() => setShowRandomizeModal(false)}
        onConfirm={handleRandomizeConfirm}
        formation={formation}
        gameType={gameType}
        existingPlayers={players.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
        }))}
      />

      {/* 게임 타입 변경 시 저장 확인 모달 */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              현재 스쿼드를 저장하시겠습니까?
            </h2>
            <p className="text-gray-300 mb-6">
              게임 타입을 변경하면 현재 스쿼드가 초기화됩니다. 저장하지 않으면
              변경사항이 사라집니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSaveAndChangeGameType}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium transition"
              >
                저장하고 변경
              </button>
              <button
                onClick={handleSkipSaveAndChangeGameType}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition"
              >
                저장하지 않고 변경
              </button>
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  setPendingGameType(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-medium transition"
              >
                취소
              </button>
            </div>
          </div>
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
        {/* 사용자 정보 및 로그인/로그아웃 버튼 */}
        <div className="flex items-center gap-3 justify-end">
          {user ? (
            <>
              <div className="bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-700 text-sm">
                👤 {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium text-sm"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium text-sm"
            >
              로그인
            </button>
          )}
        </div>

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
            onRandomize={handleRandomize}
            gameType={gameType}
          />
          <SaveLoadPanel
            currentFormation={formation}
            currentPlayers={players}
            currentGameType={gameType}
            currentSquadId={currentSquadId}
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
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6"
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
              currentTeamIndex={currentTeamIndex}
              onTeamIndexChange={setCurrentTeamIndex}
            />
          </div>

          {/* 선수 목록 - 모바일에서는 필드 아래, 데스크톱에서는 옆 */}
          <div
            className="md:max-w-[300px]"
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
              currentTeamIndex={currentTeamIndex}
              onTeamIndexChange={setCurrentTeamIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadBuilder;
