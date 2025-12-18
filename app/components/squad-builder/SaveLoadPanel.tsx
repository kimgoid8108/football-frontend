import React, { useState, useEffect } from "react";
import { Save, FolderOpen, Trash2, X } from "lucide-react";
import {
  SquadData,
  getAllSquads,
  createSquad,
  updateSquad,
  deleteSquad,
  getToken,
  getAllLocalSquads,
  saveLocalSquad,
  updateLocalSquad,
  deleteLocalSquad,
} from "../../utils/api";

interface SaveLoadPanelProps {
  currentFormation: string;
  currentPlayers: SquadData["players"];
  currentGameType?: "football" | "futsal";
  currentSquadId?: number | null;
  onLoad: (squad: SquadData) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({
  currentFormation,
  currentPlayers,
  currentGameType = "football",
  currentSquadId,
  onLoad,
  onSuccess,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [squads, setSquads] = useState<SquadData[]>([]);
  const [squadName, setSquadName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"save" | "load">("save");
  const isGuestMode = !getToken(); // 비계정 모드 확인

  // 스쿼드 목록 불러오기
  const loadSquads = async () => {
    try {
      setIsLoading(true);
      if (isGuestMode) {
        // 비계정 모드: 로컬 스토리지에서 불러오기
        const data = getAllLocalSquads();
        setSquads(data);
      } else {
        // 계정 모드: API에서 불러오기
        const data = await getAllSquads();
        setSquads(data);
      }
    } catch {
      onError("스쿼드 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSquads();
    }
  }, [isOpen]);

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

  // 스쿼드 저장
  const handleSave = async () => {
    if (!squadName.trim()) {
      onError("스쿼드 이름을 입력해주세요.");
      return;
    }

    if (currentPlayers.length === 0) {
      onError("저장할 선수가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      const squadData = {
        name: squadName.trim(),
        formation: currentFormation,
        players: currentPlayers,
        gameType: currentGameType,
      };
      console.log("저장할 스쿼드 데이터:", squadData);
      console.log(
        "선수 데이터 확인:",
        currentPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
        }))
      );

      let savedSquad: SquadData;
      if (isGuestMode) {
        // 비계정 모드: 로컬 스토리지에 저장
        savedSquad = saveLocalSquad(squadData);
        onSuccess(`"${squadName}" 스쿼드가 로컬에 저장되었습니다!`);
      } else {
        // 계정 모드: API에 저장
        savedSquad = await createSquad(squadData);
        onSuccess(`"${squadName}" 스쿼드가 저장되었습니다!`);
      }

      // 저장한 스쿼드를 다시 로드하여 loadedSquadRef 업데이트
      onLoad(savedSquad);

      setSquadName("");
      loadSquads();
    } catch (error) {
      console.error("스쿼드 저장 에러:", error);
      onError("스쿼드 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 스쿼드 업데이트
  const handleUpdate = async () => {
    if (!currentSquadId) {
      onError("업데이트할 스쿼드가 없습니다.");
      return;
    }

    if (currentPlayers.length === 0) {
      onError("저장할 선수가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      const squadData = {
        formation: currentFormation,
        players: currentPlayers,
        gameType: currentGameType,
      };
      console.log("업데이트할 스쿼드 데이터:", squadData);

      let updatedSquad: SquadData;
      if (isGuestMode) {
        // 비계정 모드: 로컬 스토리지 업데이트
        updatedSquad = updateLocalSquad(currentSquadId, squadData);
        onSuccess("스쿼드가 업데이트되었습니다!");
      } else {
        // 계정 모드: API 업데이트
        updatedSquad = await updateSquad(currentSquadId, squadData);
        onSuccess("스쿼드가 업데이트되었습니다!");
      }

      // 업데이트한 스쿼드를 다시 로드하여 loadedSquadRef 업데이트
      onLoad(updatedSquad);

      loadSquads();
    } catch (error) {
      console.error("스쿼드 업데이트 에러:", error);
      onError("스쿼드 업데이트에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 스쿼드 불러오기
  const handleLoad = (squad: SquadData) => {
    onLoad(squad);
    onSuccess(`"${squad.name}" 스쿼드를 불러왔습니다!`);
    setIsOpen(false);
  };

  // 스쿼드 삭제
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 스쿼드를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setIsLoading(true);
      if (isGuestMode) {
        // 비계정 모드: 로컬 스토리지에서 삭제
        deleteLocalSquad(id);
        onSuccess(`"${name}" 스쿼드가 삭제되었습니다.`);
      } else {
        // 계정 모드: API에서 삭제
        await deleteSquad(id);
        onSuccess(`"${name}" 스쿼드가 삭제되었습니다.`);
      }
      loadSquads();
    } catch {
      onError("스쿼드 삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 저장/불러오기 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition font-medium"
        title={isGuestMode ? "비계정 모드: 로컬 스토리지에 저장됩니다" : ""}
      >
        <FolderOpen size={20} />
        저장/불러오기
        {isGuestMode && <span className="text-xs">(로컬)</span>}
      </button>

      {/* 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">스쿼드 관리</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab("save")}
                className={`flex-1 py-3 font-medium transition ${
                  activeTab === "save"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                💾 저장하기
              </button>
              <button
                onClick={() => setActiveTab("load")}
                className={`flex-1 py-3 font-medium transition ${
                  activeTab === "load"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📂 불러오기
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-4">
              {isGuestMode && (
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mb-4">
                  <p className="text-yellow-300 text-sm">
                    💡 비계정 모드: 스쿼드는 브라우저 로컬 스토리지에
                    저장됩니다. 로그인하면 클라우드에 저장할 수 있습니다.
                  </p>
                </div>
              )}
              {activeTab === "save" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      스쿼드 이름
                    </label>
                    <input
                      type="text"
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      placeholder="예: 드림팀, 주말 경기용..."
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300">
                    <p>
                      📋 현재 포메이션:{" "}
                      <span className="text-white font-medium">
                        {currentFormation}
                      </span>
                    </p>
                    <p>
                      👥 선수 수:{" "}
                      <span className="text-white font-medium">
                        {currentPlayers.length}명
                      </span>
                    </p>
                    {currentSquadId && (
                      <p className="text-purple-400 text-xs mt-2">
                        ✨ 현재 로드된 스쿼드가 있습니다. 업데이트할 수
                        있습니다.
                      </p>
                    )}
                  </div>
                  {currentSquadId ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        {isLoading ? "업데이트 중..." : "현재 스쿼드 업데이트"}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        {isLoading ? "저장 중..." : "새 스쿼드로 저장"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      {isLoading ? "저장 중..." : "스쿼드 저장"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <p className="text-gray-400 text-center py-8">
                      불러오는 중...
                    </p>
                  ) : squads.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      저장된 스쿼드가 없습니다.
                    </p>
                  ) : (
                    squads.map((squad) => (
                      <div
                        key={squad.id}
                        className="bg-gray-700 rounded-lg p-3 flex items-center justify-between group"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleLoad(squad)}
                        >
                          <h3 className="text-white font-medium group-hover:text-purple-400 transition">
                            {squad.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {squad.formation} · {squad.players.length}명
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(squad.updatedAt!).toLocaleDateString(
                              "ko-KR"
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(squad.id!, squad.name)}
                          className="p-2 text-gray-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveLoadPanel;
