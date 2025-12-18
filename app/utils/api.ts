import { Player } from "../types/squad-builder";

// 환경 변수가 없으면 로컬 개발 환경으로 fallback
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "https://football-backend-cas8.onrender.com/api");

console.log("API URL:", API_BASE_URL);

// 서버 연결 상태 확인
export async function checkServerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    // 실제 API 엔드포인트에 요청을 보내서 서버가 응답하는지 확인
    // 에러 응답(401, 400 등)도 서버가 살아있다는 의미이므로 true 반환
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "healthcheck@test.com",
        password: "healthcheck",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 응답이 있으면 서버가 살아있음 (상태 코드는 중요하지 않음)
    // 400, 401 등의 에러도 서버가 응답했다는 의미
    return true;
  } catch (error: any) {
    console.log("서버 연결 확인 실패:", error);
    if (error.name === "AbortError") {
      return false; // 타임아웃
    }
    // TypeError는 보통 네트워크 오류 (서버가 다운되었거나 연결 불가)
    if (error instanceof TypeError) {
      return false;
    }
    // 기타 오류도 서버 연결 실패로 간주
    return false;
  }
}

// 인증 관련 인터페이스
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

// 토큰 가져오기
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// 토큰 저장
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

// 토큰 제거
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

// 인증된 요청 헤더
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// 회원가입
export async function register(data: RegisterDto): Promise<AuthResponse> {
  try {
    console.log("회원가입 요청:", `${API_BASE_URL}/auth/register`, data);

    // 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("회원가입 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      let errorMessage = `회원가입에 실패했습니다. (${response.status})`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("회원가입 성공:", result);
    return result;
  } catch (error: any) {
    console.error("register error:", error);
    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
    }
    throw error;
  }
}

// 비밀번호 재설정 요청
export async function forgotPassword(
  email: string
): Promise<{ message: string; resetToken?: string }> {
  try {
    console.log(
      "비밀번호 재설정 요청:",
      `${API_BASE_URL}/auth/forgot-password`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("비밀번호 재설정 요청 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      let errorMessage = `비밀번호 재설정 요청에 실패했습니다. (${response.status})`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("비밀번호 재설정 요청 성공:", result);
    return result;
  } catch (error: any) {
    console.error("forgotPassword error:", error);
    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
    }
    throw error;
  }
}

// 비밀번호 재설정
export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  try {
    console.log("비밀번호 재설정:", `${API_BASE_URL}/auth/reset-password`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("비밀번호 재설정 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      let errorMessage = `비밀번호 재설정에 실패했습니다. (${response.status})`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("비밀번호 재설정 성공:", result);
    return result;
  } catch (error: any) {
    console.error("resetPassword error:", error);
    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
    }
    throw error;
  }
}

// 로그인
export async function login(data: LoginDto): Promise<AuthResponse> {
  try {
    console.log("로그인 요청:", `${API_BASE_URL}/auth/login`);

    // 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("로그인 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      let errorMessage = `로그인에 실패했습니다. (${response.status})`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("로그인 성공:", result);
    return result;
  } catch (error: any) {
    console.error("login error:", error);
    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
    }
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
    }
    throw error;
  }
}

export interface SquadData {
  id?: number;
  name: string;
  formation: string;
  players: Player[];
  gameType?: "football" | "futsal";
  createdAt?: string;
  updatedAt?: string;
}

// 모든 스쿼드 조회
export async function getAllSquads(): Promise<SquadData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `스쿼드 목록을 불러오는데 실패했습니다. (${response.status})`
      );
    }
    return response.json();
  } catch (error) {
    console.error("getAllSquads error:", error);
    throw error;
  }
}

// 특정 스쿼드 조회
export async function getSquad(id: number): Promise<SquadData> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`스쿼드를 불러오는데 실패했습니다. (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error("getSquad error:", error);
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`스쿼드 저장에 실패했습니다. (${response.status})`);
    }

    return response.json();
  } catch (error) {
    console.error("createSquad error:", error);
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`스쿼드 수정에 실패했습니다. (${response.status})`);
    }

    return response.json();
  } catch (error) {
    console.error("updateSquad error:", error);
    throw error;
  }
}

// 스쿼드 삭제
export async function deleteSquad(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/squads/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`스쿼드 삭제에 실패했습니다. (${response.status})`);
    }
  } catch (error) {
    console.error("deleteSquad error:", error);
    throw error;
  }
}

// 로컬 스토리지 관련 함수들 (비계정 모드용)
const LOCAL_STORAGE_KEY = "football_squads";

export function getAllLocalSquads(): SquadData[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("로컬 스토리지 읽기 오류:", error);
    return [];
  }
}

export function saveLocalSquad(
  squad: Omit<SquadData, "id" | "createdAt" | "updatedAt">
): SquadData {
  if (typeof window === "undefined") {
    throw new Error("브라우저 환경에서만 사용 가능합니다.");
  }

  try {
    const squads = getAllLocalSquads();
    const newSquad: SquadData = {
      ...squad,
      id: Date.now(), // 간단한 ID 생성
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    squads.push(newSquad);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(squads));
    return newSquad;
  } catch (error) {
    console.error("로컬 스토리지 저장 오류:", error);
    throw new Error("스쿼드 저장에 실패했습니다.");
  }
}

export function updateLocalSquad(
  id: number,
  data: Partial<SquadData>
): SquadData {
  if (typeof window === "undefined") {
    throw new Error("브라우저 환경에서만 사용 가능합니다.");
  }

  try {
    const squads = getAllLocalSquads();
    const index = squads.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("스쿼드를 찾을 수 없습니다.");
    }

    const updatedSquad: SquadData = {
      ...squads[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    squads[index] = updatedSquad;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(squads));
    return updatedSquad;
  } catch (error) {
    console.error("로컬 스토리지 업데이트 오류:", error);
    throw error;
  }
}

export function deleteLocalSquad(id: number): void {
  if (typeof window === "undefined") {
    throw new Error("브라우저 환경에서만 사용 가능합니다.");
  }

  try {
    const squads = getAllLocalSquads();
    const filtered = squads.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("로컬 스토리지 삭제 오류:", error);
    throw error;
  }
}
