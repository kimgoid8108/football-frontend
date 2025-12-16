import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, X } from 'lucide-react';
import { SquadData, getAllSquads, createSquad, deleteSquad } from '../../utils/api';

interface SaveLoadPanelProps {
  currentFormation: string;
  currentPlayers: SquadData['players'];
  onLoad: (squad: SquadData) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({
  currentFormation,
  currentPlayers,
  onLoad,
  onSuccess,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [squads, setSquads] = useState<SquadData[]>([]);
  const [squadName, setSquadName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');

  // 스쿼드 목록 불러오기
  const loadSquads = async () => {
    try {
      setIsLoading(true);
      const data = await getAllSquads();
      setSquads(data);
    } catch {
      onError('스쿼드 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSquads();
    }
  }, [isOpen]);

  // 스쿼드 저장
  const handleSave = async () => {
    if (!squadName.trim()) {
      onError('스쿼드 이름을 입력해주세요.');
      return;
    }

    if (currentPlayers.length === 0) {
      onError('저장할 선수가 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      await createSquad({
        name: squadName.trim(),
        formation: currentFormation,
        players: currentPlayers,
      });
      onSuccess(`"${squadName}" 스쿼드가 저장되었습니다!`);
      setSquadName('');
      loadSquads();
    } catch {
      onError('스쿼드 저장에 실패했습니다.');
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
      await deleteSquad(id);
      onSuccess(`"${name}" 스쿼드가 삭제되었습니다.`);
      loadSquads();
    } catch {
      onError('스쿼드 삭제에 실패했습니다.');
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
      >
        <FolderOpen size={20} />
        저장/불러오기
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
                onClick={() => setActiveTab('save')}
                className={`flex-1 py-3 font-medium transition ${
                  activeTab === 'save'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                💾 저장하기
              </button>
              <button
                onClick={() => setActiveTab('load')}
                className={`flex-1 py-3 font-medium transition ${
                  activeTab === 'load'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📂 불러오기
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-4">
              {activeTab === 'save' ? (
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
                    <p>📋 현재 포메이션: <span className="text-white font-medium">{currentFormation}</span></p>
                    <p>👥 선수 수: <span className="text-white font-medium">{currentPlayers.length}명</span></p>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {isLoading ? '저장 중...' : '스쿼드 저장'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <p className="text-gray-400 text-center py-8">불러오는 중...</p>
                  ) : squads.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">저장된 스쿼드가 없습니다.</p>
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
                            {new Date(squad.updatedAt!).toLocaleDateString('ko-KR')}
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

