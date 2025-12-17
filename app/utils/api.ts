import { Player } from "../types/squad-builder";

// 환경 변수가 없으면 로컬 개발 환경으로 fallback
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://your-render-backend-url.onrender.com/api');

console.log("API URL:", API_BASE_URL);

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
  try {
    const response = await fetch(`${API_BASE_URL}/squads`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`스쿼드 목록을 불러오는데 실패했습니다. (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('getAllSquads error:', error);
    throw error;
  }
}

// 특정 스쿼드 조회
export async function getSquad(id: number): Promise<SquadData> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`스쿼드를 불러오는데 실패했습니다. (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('getSquad error:', error);
    throw error;
  }
}

// 스쿼드 생성
export async function createSquad(
  data: Omit<SquadData, "id" | "createdAt" | "updatedAt">
): Promise<SquadData> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`스쿼드 저장에 실패했습니다. (${response.status})`);
    }

    return response.json();
  } catch (error) {
    console.error('createSquad error:', error);
    throw error;
  }
}

// 스쿼드 수정
export async function updateSquad(
  id: number,
  data: Partial<SquadData>
): Promise<SquadData> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`스쿼드 수정에 실패했습니다. (${response.status})`);
    }

    return response.json();
  } catch (error) {
    console.error('updateSquad error:', error);
    throw error;
  }
}

// 스쿼드 삭제
export async function deleteSquad(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`스쿼드 삭제에 실패했습니다. (${response.status})`);
    }
  } catch (error) {
    console.error('deleteSquad error:', error);
    throw error;
  }
}
