import React from 'react';
import { Trash2 } from 'lucide-react';
import { Player } from '../../types/squad-builder';
import { getPositionColor } from '../../utils/squad-builder';
import PositionSelect from './PositionSelect';

interface PlayerCardProps {
  player: Player;
  onNameChange: (id: number, name: string) => void;
  onPositionChange: (id: number, position: string) => void;
  onDelete: (id: number) => void;
  extraAction?: React.ReactNode;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onNameChange, 
  onPositionChange, 
  onDelete,
  extraAction,
}) => {
  const color = getPositionColor(player.position);

  return (
    <div className="bg-gray-700 rounded-lg p-3 shadow">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
            border: '2px solid white',
          }}
        />
        <input
          type="text"
          value={player.name}
          onChange={(e) => onNameChange(player.id, e.target.value)}
          placeholder="선수 이름"
          className="flex-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <PositionSelect
          value={player.position}
          onChange={(value) => onPositionChange(player.id, value)}
          className="flex-1"
        />
        {extraAction}
        <button
          onClick={() => onDelete(player.id)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PlayerCard;

