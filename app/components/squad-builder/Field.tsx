import React, { forwardRef } from 'react';
import { Player } from '../../types/squad-builder';
import PlayerMarker from './PlayerMarker';

interface FieldProps {
  players: Player[];
  draggedPlayerId: number | null;
  onPlayerMouseDown: (e: React.MouseEvent<HTMLDivElement>, player: Player) => void;
}

// 포지션 영역 정의
const POSITION_ZONES = [
  // GK 영역
  { x: 18, y: 82, width: 64, height: 18, label: 'GK', color: '#FFD700' },
  
  // 수비 라인 (y: 69-82)
  { x: 0, y: 69, width: 20, height: 13, label: 'LB', color: '#3B82F6' },
  { x: 20, y: 69, width: 20, height: 13, label: 'LCB', color: '#3B82F6' },
  { x: 40, y: 69, width: 20, height: 13, label: 'CB', color: '#3B82F6' },
  { x: 60, y: 69, width: 20, height: 13, label: 'RCB', color: '#3B82F6' },
  { x: 80, y: 69, width: 20, height: 13, label: 'RB', color: '#3B82F6' },
  
  // 수비형 미드필더 (y: 56-69)
  { x: 0, y: 56, width: 15, height: 13, label: 'LWB', color: '#3B82F6' },
  { x: 15, y: 56, width: 25, height: 13, label: 'LDM', color: '#10B981' },
  { x: 40, y: 56, width: 20, height: 13, label: 'CDM', color: '#10B981' },
  { x: 60, y: 56, width: 25, height: 13, label: 'RDM', color: '#10B981' },
  { x: 85, y: 56, width: 15, height: 13, label: 'RWB', color: '#3B82F6' },
  
  // 중앙 미드필더 (y: 43-56)
  { x: 0, y: 43, width: 18, height: 13, label: 'LM', color: '#10B981' },
  { x: 18, y: 43, width: 22, height: 13, label: 'LCM', color: '#10B981' },
  { x: 40, y: 43, width: 20, height: 13, label: 'CM', color: '#10B981' },
  { x: 60, y: 43, width: 22, height: 13, label: 'RCM', color: '#10B981' },
  { x: 82, y: 43, width: 18, height: 13, label: 'RM', color: '#10B981' },
  
  // 공격형 미드필더 (y: 30-43)
  { x: 0, y: 30, width: 18, height: 13, label: 'LM', color: '#10B981' },
  { x: 18, y: 30, width: 22, height: 13, label: 'LAM', color: '#10B981' },
  { x: 40, y: 30, width: 20, height: 13, label: 'CAM', color: '#10B981' },
  { x: 60, y: 30, width: 22, height: 13, label: 'RAM', color: '#10B981' },
  { x: 82, y: 30, width: 18, height: 13, label: 'RM', color: '#10B981' },
  
  // 세컨드 스트라이커 (y: 20-30)
  { x: 0, y: 20, width: 18, height: 10, label: 'LW', color: '#EF4444' },
  { x: 18, y: 20, width: 22, height: 10, label: 'LF', color: '#EF4444' },
  { x: 40, y: 20, width: 20, height: 10, label: 'CF', color: '#EF4444' },
  { x: 60, y: 20, width: 22, height: 10, label: 'RF', color: '#EF4444' },
  { x: 82, y: 20, width: 18, height: 10, label: 'RW', color: '#EF4444' },
  
  // 최전방 (y: 0-20)
  { x: 0, y: 5, width: 18, height: 15, label: 'LW', color: '#EF4444' },
  { x: 18, y: 5, width: 22, height: 15, label: 'LS', color: '#EF4444' },
  { x: 40, y: 5, width: 20, height: 15, label: 'ST', color: '#EF4444' },
  { x: 60, y: 5, width: 22, height: 15, label: 'RS', color: '#EF4444' },
  { x: 82, y: 5, width: 18, height: 15, label: 'RW', color: '#EF4444' },
];

const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ players, draggedPlayerId, onPlayerMouseDown }, ref) => {
    const isDragging = draggedPlayerId !== null;
    
    return (
      <div
        ref={ref}
        className="relative bg-green-700 rounded-lg overflow-hidden shadow-2xl"
        style={{
          backgroundImage: 'linear-gradient(0deg, #15803d 0%, #15803d 50%, #166534 50%, #166534 100%)',
          backgroundSize: '100% 20px',
          aspectRatio: '3/4',
        }}
      >
        {/* 포지션 영역 오버레이 (드래그 중일 때만 표시) */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {POSITION_ZONES.map((zone, index) => (
              <div
                key={index}
                className="absolute flex items-center justify-center transition-opacity duration-200"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  backgroundColor: `${zone.color}20`,
                  border: `1px dashed ${zone.color}80`,
                  borderRadius: '4px',
                }}
              >
                <span
                  className="text-xs font-bold px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: `${zone.color}CC`,
                    color: zone.color === '#FFD700' ? '#000' : '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {zone.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 필드 라인 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
          <rect x="5%" y="2%" width="90%" height="20%" fill="none" stroke="white" strokeWidth="2" />
          <rect x="5%" y="78%" width="90%" height="20%" fill="none" stroke="white" strokeWidth="2" />
          <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="white" strokeWidth="2" />
          <circle cx="50%" cy="50%" r="15%" fill="none" stroke="white" strokeWidth="2" />
        </svg>

        {/* 선수 마커 */}
        {players.map((player) => (
          <PlayerMarker
            key={player.id}
            player={player}
            isDragging={draggedPlayerId === player.id}
            onMouseDown={onPlayerMouseDown}
          />
        ))}
      </div>
    );
  }
);

Field.displayName = 'Field';

export default Field;

