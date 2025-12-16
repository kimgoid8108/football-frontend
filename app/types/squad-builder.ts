// 선수 인터페이스
export interface Player {
  id: number;
  name: string;
  position: string;
  x: number;
  y: number;
  isBench?: boolean; // 후보 선수 여부
}

// 포지션 인터페이스
export interface Position {
  pos: string;
  x: number;
  y: number;
}

// 포메이션 인터페이스
export interface Formations {
  [key: string]: Position[];
}

// 포지션 카테고리 인터페이스
export interface PositionCategory {
  name: string;
  positions: string[];
}

export interface PositionCategories {
  [key: string]: PositionCategory;
}

// 좌표 인터페이스
export interface Coordinates {
  x: number;
  y: number;
}

// 접힌 섹션 상태 인터페이스
export interface CollapsedSections {
  [key: string]: boolean;
}

// 선수 이름 인터페이스
export interface PlayerNames {
  korean: string[];
  world: string[];
}

// 그룹화된 선수 인터페이스
export interface GroupedPlayers {
  [key: string]: Player[];
}

// 게임 타입
export type GameType = "football" | "futsal";
