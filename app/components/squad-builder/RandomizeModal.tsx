"use client";

import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import { GameType } from "../../types/squad-builder";
import { FORMATIONS, PLAYER_NAMES } from "../../constants/squad-builder";
import { getDefaultPositionCoordinates } from "../../utils/squad-builder";

interface RandomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerAssignments: { position: string; name: string }[]) => void;
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
  const template = FORMATIONS[formation] || [];
  const [assignments, setAssignments] = useState<
    { position: string; name: string }[]
  >([]);

  // 모달이 열릴 때마다 초기화
  React.useEffect(() => {
    if (isOpen) {
      setAssignments(
        template.map((t) => ({
          position: t.pos,
          name: "",
        }))
      );
    }
  }, [isOpen, formation, template]);

  // 사용 가능한 선수 이름 목록
  const availableNames = useMemo(() => {
    const allNames = [...PLAYER_NAMES.korean, ...PLAYER_NAMES.world];
    const usedNames = assignments.map((a) => a.name).filter((n) => n);
    return allNames.filter((name) => !usedNames.includes(name));
  }, [assignments]);

  // 기존 선수 이름 목록
  const existingNames = useMemo(() => {
    return existingPlayers.map((p) => p.name);
  }, [existingPlayers]);

  const handleNameChange = (index: number, name: string) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, name } : a))
    );
  };

  const handlePositionChange = (index: number, position: string) => {
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, position } : a))
    );
  };

  const handleConfirm = () => {
    // 모든 포지션에 이름이 입력되었는지 확인
    const hasEmptyName = assignments.some((a) => !a.name.trim());
    if (hasEmptyName) {
      alert("모든 포지션에 선수 이름을 입력해주세요.");
      return;
    }

    onConfirm(assignments);
    onClose();
  };

  const handleRandomFill = () => {
    const shuffledNames = [...availableNames].sort(() => Math.random() - 0.5);
    let nameIndex = 0;

    setAssignments((prev) =>
      prev.map((a) => {
        if (!a.name) {
          const name =
            nameIndex < shuffledNames.length
              ? shuffledNames[nameIndex++]
              : `선수 ${nameIndex++ + 1}`;
          return { ...a, name };
        }
        return a;
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">선수 배치</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-300 text-sm">
              포메이션:{" "}
              <span className="text-white font-medium">{formation}</span>
            </p>
            <button
              onClick={handleRandomFill}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              빈 칸 랜덤 채우기
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment, index) => {
              const pos = template[index];
              return (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-24 text-white font-medium text-sm">
                    {pos?.pos || assignment.position}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={assignment.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder="선수 이름 입력"
                      list={`names-${index}`}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                    />
                    <datalist id={`names-${index}`}>
                      {availableNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                      {existingNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <select
                    value={assignment.position}
                    onChange={(e) =>
                      handlePositionChange(index, e.target.value)
                    }
                    className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-sm min-w-[120px]"
                  >
                    {gameType === "futsal" ? (
                      <>
                        <option value="GK">GK</option>
                        <option value="DF">DF</option>
                        <option value="MF">MF</option>
                        <option value="FW">FW</option>
                      </>
                    ) : (
                      <>
                        <option value="GK">GK</option>
                        <option value="LWB">LWB</option>
                        <option value="LB">LB</option>
                        <option value="LCB">LCB</option>
                        <option value="CB">CB</option>
                        <option value="RCB">RCB</option>
                        <option value="RB">RB</option>
                        <option value="RWB">RWB</option>
                        <option value="LDM">LDM</option>
                        <option value="CDM">CDM</option>
                        <option value="RDM">RDM</option>
                        <option value="LCM">LCM</option>
                        <option value="CM">CM</option>
                        <option value="RCM">RCM</option>
                        <option value="LM">LM</option>
                        <option value="LAM">LAM</option>
                        <option value="CAM">CAM</option>
                        <option value="RAM">RAM</option>
                        <option value="RM">RM</option>
                        <option value="LW">LW</option>
                        <option value="LF">LF</option>
                        <option value="LS">LS</option>
                        <option value="CF">CF</option>
                        <option value="ST">ST</option>
                        <option value="RS">RS</option>
                        <option value="RF">RF</option>
                        <option value="RW">RW</option>
                      </>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
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
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-medium transition"
          >
            배치하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RandomizeModal;
