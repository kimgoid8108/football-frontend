"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { GameType } from "../../types/squad-builder";
import { FORMATIONS, PLAYER_NAMES } from "../../constants/squad-builder";

interface RandomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    teams: { name: string; position: string; x: number; y: number }[][]
  ) => Promise<void>;
  formation: string;
  gameType: GameType;
  existingPlayers: { id: number; name: string; position: string }[];
}

const RandomizeModal: React.FC<RandomizeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formation,
  gameType,
  existingPlayers,
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>([""]);
  const [numTeams, setNumTeams] = useState<number>(2);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
  const template = FORMATIONS[formation] || [];
  const maxPlayersPerTeam = Math.min(template.length, 7); // 최대 7명

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setNumTeams(2);
      const initialPlayersPerTeam = Math.min(template.length, 7);
      setPlayersPerTeam(initialPlayersPerTeam);
      // 초기 필드 수 설정 (2팀 × 7명 = 14명)
      const initialTotal = 2 * initialPlayersPerTeam;
      setPlayerNames(Array(initialTotal).fill(""));
    }
  }, [isOpen, template.length]);

  // 팀 수와 인원 수에 따라 입력 필드 자동 조정
  useEffect(() => {
    if (!isOpen) return; // 모달이 닫혀있으면 실행하지 않음

    const totalNeeded = numTeams * playersPerTeam;
    const currentCount = playerNames.length;

    if (currentCount < totalNeeded) {
      // 부족한 만큼 추가
      const needed = totalNeeded - currentCount;
      setPlayerNames((prev) => [...prev, ...Array(needed).fill("")]);
    } else if (currentCount > totalNeeded) {
      // 초과하는 만큼 제거 (빈 필드부터)
      const excess = currentCount - totalNeeded;
      setPlayerNames((prev) => {
        const newNames = [...prev];
        // 뒤에서부터 빈 필드 제거
        let removed = 0;
        for (let i = newNames.length - 1; i >= 0 && removed < excess; i--) {
          if (!newNames[i].trim()) {
            newNames.splice(i, 1);
            removed++;
          }
        }
        // 빈 필드가 없으면 뒤에서부터 제거
        if (removed < excess) {
          newNames.splice(-(excess - removed));
        }
        return newNames;
      });
    }
  }, [numTeams, playersPerTeam, isOpen]);

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      // body 스크롤 방지
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // 모달이 닫힐 때 원래대로 복원
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleNameChange = (index: number, name: string) => {
    setPlayerNames((prev) => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  const handleAddPlayer = () => {
    setPlayerNames((prev) => [...prev, ""]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRandomFill = () => {
    const allNames = [...PLAYER_NAMES.korean, ...PLAYER_NAMES.world];
    const usedNames = playerNames.filter((n) => n.trim());
    const availableNames = allNames.filter((name) => !usedNames.includes(name));
    const shuffledNames = [...availableNames].sort(() => Math.random() - 0.5);
    let nameIndex = 0;

    setPlayerNames((prev) =>
      prev.map((name) => {
        if (!name.trim()) {
          const newName =
            nameIndex < shuffledNames.length
              ? shuffledNames[nameIndex++]
              : `선수 ${nameIndex++ + 1}`;
          return newName;
        }
        return name;
      })
    );
  };

  const handleConfirm = async () => {
    // 입력된 선수 이름들 필터링
    const validNames = playerNames.filter((name) => name.trim());

    if (validNames.length === 0) {
      alert("최소 한 명의 선수 이름을 입력해주세요.");
      return;
    }

    const totalNeeded = numTeams * playersPerTeam;
    if (validNames.length < totalNeeded) {
      alert(
        `최소 ${totalNeeded}명의 선수 이름을 입력해주세요. (현재: ${validNames.length}명, ${numTeams}팀 × ${playersPerTeam}명)`
      );
      return;
    }

    // 선수들을 랜덤하게 섞기
    const shuffledNames = [...validNames].sort(() => Math.random() - 0.5);

    // 팀별로 선수 나누기
    const teams: { name: string; position: string; x: number; y: number }[][] =
      [];

    for (let teamIndex = 0; teamIndex < numTeams; teamIndex++) {
      const teamNames = shuffledNames.slice(
        teamIndex * playersPerTeam,
        (teamIndex + 1) * playersPerTeam
      );

      // 팀당 인원 수에 맞는 포메이션 찾기
      let teamTemplate = template;
      if (template.length !== playersPerTeam) {
        // 현재 포메이션과 인원 수가 다르면 적합한 포메이션 찾기
        const matchingFormation = Object.entries(FORMATIONS).find(
          ([key, positions]) => {
            if (gameType === "futsal") {
              // 풋살: 인원 수가 정확히 일치하는 포메이션
              return key.includes("인") && positions.length === playersPerTeam;
            } else {
              // 축구: 인원 수가 정확히 일치하는 포메이션
              return !key.includes("인") && positions.length === playersPerTeam;
            }
          }
        );

        if (matchingFormation) {
          teamTemplate = matchingFormation[1];
        } else {
          // 정확히 일치하는 포메이션이 없으면 현재 포메이션을 기반으로 동적 생성
          if (template.length < playersPerTeam) {
            // 부족한 선수는 적절한 위치에 추가
            const additional = playersPerTeam - template.length;
            const additionalPositions = Array(additional)
              .fill(null)
              .map((_, i) => {
                // 중앙 미드필더 위치에 추가
                return {
                  pos: "MF",
                  x: 50 + (i % 2 === 0 ? -15 : 15) * Math.floor((i + 1) / 2),
                  y: 50,
                };
              });
            teamTemplate = [...template, ...additionalPositions];
          } else {
            // 초과하는 선수는 제거
            teamTemplate = template.slice(0, playersPerTeam);
          }
        }
      }

      // 포메이션 템플릿에 맞게 배치
      const teamPlayers = teamTemplate.map((t, index) => {
        return {
          name: teamNames[index] || `선수 ${index + 1}`,
          position: t.pos,
          x: t.x,
          y: t.y,
        };
      });

      teams.push(teamPlayers);
    }

    await onConfirm(teams);
    onClose();
  };

  const filledCount = playerNames.filter((n) => n.trim()).length;
  const totalNeeded = numTeams * playersPerTeam;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">팀 배치 설정</h2>
            <p className="text-gray-400 text-sm mt-1">
              {filledCount}명 입력됨 / {totalNeeded}명 필요 ({numTeams}팀 ×{" "}
              {playersPerTeam}명)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* 설정 영역 */}
          <div className="mb-6 bg-gray-700 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                팀 수
              </label>
              <select
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value={2}>2팀</option>
                <option value={3}>3팀</option>
                <option value={4}>4팀</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                팀당 인원 수 (최대 7명)
              </label>
              <select
                value={playersPerTeam}
                onChange={(e) =>
                  setPlayersPerTeam(Math.min(7, Number(e.target.value)))
                }
                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none"
              >
                {[3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num}명
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                포메이션
              </label>
              <p className="text-gray-300 text-sm">{formation}</p>
            </div>
          </div>

          {/* 선수 입력 영역 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-300 text-sm font-medium">선수 이름 입력</p>
            <button
              onClick={handleRandomFill}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              빈 칸 랜덤 채우기
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playerNames.map((name, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-8 text-gray-400 text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder="선수 이름 입력"
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <button
                  onClick={() => handleRemovePlayer(index)}
                  className="text-red-400 hover:text-red-300 transition p-2"
                  disabled={playerNames.length === 1}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddPlayer}
            className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition font-medium text-sm"
          >
            <Plus size={18} />
            선수 추가
          </button>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={filledCount < totalNeeded}
          >
            배치하기 (
            {filledCount >= totalNeeded
              ? "완료"
              : `${filledCount}/${totalNeeded}`}
            )
          </button>
        </div>
      </div>
    </div>
  );
};

export default RandomizeModal;
