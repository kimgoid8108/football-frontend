import React from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Player, GroupedPlayers, CollapsedSections } from '../../types/squad-builder';
import { POSITION_CATEGORIES } from '../../constants/squad-builder';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  groupedPlayers: GroupedPlayers;
  collapsedSections: CollapsedSections;
  onToggleSection: (category: string) => void;
  onNameChange: (id: number, name: string) => void;
  onPositionChange: (id: number, position: string) => void;
  onDelete: (id: number) => void;
  onToggleBench?: (id: number) => void;
  onAddBenchPlayer?: () => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  groupedPlayers,
  collapsedSections,
  onToggleSection,
  onNameChange,
  onPositionChange,
  onDelete,
  onToggleBench,
  onAddBenchPlayer,
}) => {
  const mainPlayers = players.filter(p => !p.isBench);
  const benchPlayers = players.filter(p => p.isBench);
  const isBenchCollapsed = collapsedSections['BENCH'];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-white mb-4">
        선수 명단 ({mainPlayers.length}명)
      </h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {Object.keys(POSITION_CATEGORIES).map((category) => {
          const categoryPlayers = groupedPlayers[category];
          const isCollapsed = collapsedSections[category];
          
          if (!categoryPlayers || categoryPlayers.length === 0) return null;
          
          return (
            <div key={category} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => onToggleSection(category)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-750 hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">
                    {POSITION_CATEGORIES[category].name}
                  </span>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                    {categoryPlayers.length}
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronUp size={20} className="text-gray-400" />
                )}
              </button>
              
              {!isCollapsed && (
                <div className="p-2 space-y-2">
                  {categoryPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onNameChange={onNameChange}
                      onPositionChange={onPositionChange}
                      onDelete={onDelete}
                      extraAction={
                        onToggleBench && (
                          <button
                            onClick={() => onToggleBench(player.id)}
                            className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded text-white transition"
                            title="후보로 이동"
                          >
                            <ArrowDown size={14} />
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 후보 선수 섹션 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">
            🪑 후보 ({benchPlayers.length}명)
          </h2>
          {onAddBenchPlayer && (
            <button
              onClick={onAddBenchPlayer}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              + 후보 추가
            </button>
          )}
        </div>
        <div className="space-y-3 max-h-[250px] overflow-y-auto">
          {benchPlayers.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 border-dashed text-center">
              <p className="text-gray-400 text-sm">후보 선수가 없습니다</p>
              <p className="text-gray-500 text-xs mt-1">위 버튼으로 추가하거나 주전을 후보로 내리세요</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => onToggleSection('BENCH')}
                className="w-full px-4 py-3 flex items-center justify-between bg-orange-900/30 hover:bg-orange-900/50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-orange-300 font-bold">후보 선수</span>
                  <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                    {benchPlayers.length}
                  </span>
                </div>
                {isBenchCollapsed ? (
                  <ChevronDown size={20} className="text-orange-400" />
                ) : (
                  <ChevronUp size={20} className="text-orange-400" />
                )}
              </button>
              
              {!isBenchCollapsed && (
                <div className="p-2 space-y-2">
                  {benchPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onNameChange={onNameChange}
                      onPositionChange={onPositionChange}
                      onDelete={onDelete}
                      extraAction={
                        onToggleBench && (
                          <button
                            onClick={() => onToggleBench(player.id)}
                            className="p-1.5 bg-green-600 hover:bg-green-500 rounded text-white transition"
                            title="주전으로 올리기"
                          >
                            <ArrowUp size={14} />
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerList;

