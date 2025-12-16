"use client";

import React, { useState, useRef, useCallback } from "react";
import { Player, Coordinates, CollapsedSections, GroupedPlayers } from "./types/squad-builder";
import { FORMATIONS, POSITION_CATEGORIES } from "./constants/squad-builder";
import { getPositionByLocation, getDefaultPositionCoordinates, getRandomName } from "./utils/squad-builder";
import { ErrorToast, Controls, Field, PlayerList, SaveLoadPanel } from "./components/squad-builder";
import { SquadData } from "./utils/api";

const SquadBuilder: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOffset, setDragOffset] = useState<Coordinates>({ x: 0, y: 0 });
  const [formation, setFormation] = useState<string>("4-3-3");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({});
  const fieldRef = useRef<HTMLDivElement>(null);

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

  // 포메이션 로드
  const loadFormation = useCallback(
    (formationKey: string): void => {
      setFormation(formationKey);
      const template = FORMATIONS[formationKey];
      const usedNames: string[] = [];

      const newPlayers: Player[] = template.map((t, i) => {
        const name = getRandomName([...players.filter((p: Player) => usedNames.includes(p.name))]);
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
    setPlayers((prev: Player[]) => prev.map((p: Player) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // 선수 포지션 변경
  const handlePositionChange = useCallback(
    (id: number, position: string): void => {
      if (position === "GK") {
        const hasGK = players.some((p: Player) => p.position === "GK" && p.id !== id);
        if (hasGK) {
          showError("골키퍼는 한 명만 가능합니다!");
          return;
        }
      }

      const coords = getDefaultPositionCoordinates(position);
      setPlayers((prev: Player[]) => prev.map((p: Player) => (p.id === id ? { ...p, position, x: coords.x, y: coords.y } : p)));
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

      // 후보 -> 주전: 11명 제한 확인
      if (player.isBench) {
        const mainCount = players.filter((p: Player) => !p.isBench).length;
        if (mainCount >= 11) {
          showError("주전은 11명까지만 가능합니다!");
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
    [players, showError]
  );

  // 드래그 시작
  const handleBallMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, player: Player): void => {
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
  }, []);

  // 드래그 중
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (!draggedPlayer || !fieldRef.current) return;

      const rect = fieldRef.current.getBoundingClientRect();
      const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
      const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));

      const newPosition = getPositionByLocation(clampedX, clampedY, players, draggedPlayer, showError);

      setPlayers((prev: Player[]) => prev.map((p: Player) => (p.id === draggedPlayer.id ? { ...p, x: clampedX, y: clampedY, position: newPosition } : p)));
    },
    [draggedPlayer, dragOffset, players, showError]
  );

  // 드래그 종료
  const handleMouseUp = useCallback((): void => {
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

  // 주전 선수만 필터링
  const mainPlayers = players.filter((p: Player) => !p.isBench);

  // 포지션별 선수 그룹화 (주전만)
  const groupedPlayers: GroupedPlayers = Object.keys(POSITION_CATEGORIES).reduce((acc, category) => {
    acc[category] = mainPlayers.filter((p: Player) => POSITION_CATEGORIES[category].positions.includes(p.position));
    return acc;
  }, {} as GroupedPlayers);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-gray-900 p-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <ErrorToast message={errorMessage} />

      {/* 성공 메시지 토스트 */}
      {successMessage && <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">✅ {successMessage}</div>}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">⚽ FIFA 스쿼드 빌더</h1>

        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <Controls formation={formation} onFormationChange={loadFormation} />
          <SaveLoadPanel currentFormation={formation} currentPlayers={players} onLoad={handleLoadSquad} onSuccess={showSuccess} onError={showError} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Field ref={fieldRef} players={mainPlayers} draggedPlayerId={draggedPlayer?.id ?? null} onPlayerMouseDown={handleBallMouseDown} />
          </div>

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
          />
        </div>
      </div>
    </div>
  );
};

export default SquadBuilder;
