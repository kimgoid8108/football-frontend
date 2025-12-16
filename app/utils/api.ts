import { Player } from '../types/squad-builder';

const API_BASE_URL = 'http://localhost:3001/api';

export interface SquadData {
  id?: number;
  name: string;
  formation: string;
  players: Player[];
  createdAt?: string;
  updatedAt?: string;
}

// 모든 스쿼드 조회
export async function getAllSquads(): Promise<SquadData[]> {
  const response = await fetch(`${API_BASE_URL}/squads`);
  if (!response.ok) {
    throw new Error('스쿼드 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
}

// 특정 스쿼드 조회
export async function getSquad(id: number): Promise<SquadData> {
  const response = await fetch(`${API_BASE_URL}/squads/${id}`);
  if (!response.ok) {
    throw new Error('스쿼드를 불러오는데 실패했습니다.');
  }
  return response.json();
}

// 스쿼드 생성
export async function createSquad(data: Omit<SquadData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SquadData> {
  const response = await fetch(`${API_BASE_URL}/squads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('스쿼드 저장에 실패했습니다.');
  }
  return response.json();
}

// 스쿼드 수정
export async function updateSquad(id: number, data: Partial<SquadData>): Promise<SquadData> {
  const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('스쿼드 수정에 실패했습니다.');
  }
  return response.json();
}

// 스쿼드 삭제
export async function deleteSquad(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('스쿼드 삭제에 실패했습니다.');
  }
}

