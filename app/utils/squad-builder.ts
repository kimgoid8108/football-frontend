import { Coordinates, Player, GameType } from "../types/squad-builder";
import { POSITION_COORDINATES, PLAYER_NAMES } from "../constants/squad-builder";

// 포지션별 색상 반환
export const getPositionColor = (position: string): string => {
  if (!position) return "#666";
  const pos = position.toUpperCase();
  if (pos === "GK") return "#FFD700";
  if (
    pos === "DF" ||
    pos.includes("B") ||
    pos === "CB" ||
    pos === "LB" ||
    pos === "RB" ||
    pos === "LCB" ||
    pos === "RCB" ||
    pos === "LWB" ||
    pos === "RWB"
  )
    return "#3B82F6";
  if (
    pos === "CM" ||
    pos === "MF" ||
    pos.includes("M") ||
    pos.includes("DM") ||
    pos.includes("AM")
  )
    return "#10B981";
  if (pos === "FW") return "#EF4444";
  return "#EF4444"; // 기본값 (공격수 색상)
};

// 포지션별 기본 좌표 반환
export const getDefaultPositionCoordinates = (
  position: string
): Coordinates => {
  return POSITION_COORDINATES[position] || { x: 50, y: 50 };
};

// 위치에 따른 포지션 결정
export const getPositionByLocation = (
  x: number,
  y: number,
  players: Player[],
  draggedPlayer: Player | null,
  showError: (message: string) => void,
  gameType: GameType = "football"
): string => {
  if (y > 82) {
    const hasGK = players.some(
      (p) => p.position === "GK" && p.id !== draggedPlayer?.id
    );
    if (hasGK) {
      showError("골키퍼는 한 명만 가능합니다!");
      return draggedPlayer?.position || (gameType === "futsal" ? "FW" : "ST");
    }
    return "GK";
  }

  // 풋살의 경우 간단한 포지션만 사용
  if (gameType === "futsal") {
    if (y > 65) {
      return "DF"; // 수비수 영역
    } else if (y > 35) {
      return "MF"; // 미드필더 영역
    } else {
      return "FW"; // 공격수 영역
    }
  }

  // 축구의 경우 기존 로직 사용
  if (y > 69) {
    if (x < 20) return "LB";
    if (x < 40) return "LCB";
    if (x < 60) return "CB";
    if (x < 80) return "RCB";
    return "RB";
  }

  if (y > 56) {
    if (x < 15) return "LWB";
    if (x < 40) return "LDM";
    if (x < 60) return "CDM";
    if (x < 85) return "RDM";
    return "RWB";
  }

  if (y > 43) {
    if (x < 18 || x > 82) return x < 50 ? "LM" : "RM";
    if (x < 40) return "LCM";
    if (x < 60) return "CM";
    return "RCM";
  }

  if (y > 30) {
    if (x < 18 || x > 82) return x < 50 ? "LM" : "RM";
    if (x < 40) return "LAM";
    if (x < 60) return "CAM";
    return "RAM";
  }

  if (y > 20) {
    if (x < 18 || x > 82) return x < 50 ? "LW" : "RW";
    if (x < 40) return "LF";
    if (x < 60) return "CF";
    return "RF";
  }

  if (x < 18 || x > 82) return x < 50 ? "LW" : "RW";
  if (x < 40) return "LS";
  if (x < 60) return "ST";
  return "RS";
};

// 랜덤 이름 생성
export const getRandomName = (players: Player[]): string => {
  const allNames = [...PLAYER_NAMES.korean, ...PLAYER_NAMES.world];
  const usedNames = players.map((p) => p.name);
  const availableNames = allNames.filter((name) => !usedNames.includes(name));

  if (availableNames.length === 0) {
    return `선수 ${players.length + 1}`;
  }

  return availableNames[Math.floor(Math.random() * availableNames.length)];
};
