"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SquadBuilder from "./squad-builder";
import ServerLoading from "./components/ServerLoading";
import { getToken, checkServerHealth } from "./utils/api";

export default function Home() {
  const router = useRouter();
  const [shouldShowLogin, setShouldShowLogin] = useState<boolean | null>(null);
  const [isServerReady, setIsServerReady] = useState<boolean>(false);
  const [isCheckingServer, setIsCheckingServer] = useState<boolean>(true);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return;

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const checkServer = async () => {
      setIsCheckingServer(true);

      // 서버 연결 확인 (최대 30초, 2초마다 재시도)
      const maxAttempts = 15;
      let attempts = 0;

      const checkConnection = async (): Promise<boolean> => {
        try {
          const isReady = await checkServerHealth();
          if (isReady && isMounted) {
            setIsServerReady(true);
            setIsCheckingServer(false);
            return true;
          }
          return false;
        } catch (error) {
          console.log("서버 연결 확인 실패:", error);
          return false;
        }
      };

      // 즉시 한 번 확인
      if (await checkConnection()) {
        return;
      }

      // 재시도 루프
      intervalId = setInterval(async () => {
        if (!isMounted) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        attempts++;
        console.log(`서버 연결 확인 시도 ${attempts}/${maxAttempts}`);

        if (await checkConnection()) {
          if (intervalId) clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          // 최대 시도 횟수 초과 - 서버가 준비되지 않았어도 진행
          console.log("서버 연결 확인 최대 시도 횟수 초과, 계속 진행");
          if (isMounted) {
            setIsServerReady(true);
            setIsCheckingServer(false);
          }
          if (intervalId) clearInterval(intervalId);
        }
      }, 2000); // 2초마다 재시도
    };

    checkServer();

    // 컴포넌트 언마운트 시 정리
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // 서버가 준비된 후에만 인증 상태 확인
    if (!isServerReady || isCheckingServer) return;

    const token = getToken();
    const guestMode = sessionStorage.getItem("guestMode");

    console.log("서버 준비 완료, 인증 상태 확인:", {
      token: !!token,
      guestMode: !!guestMode,
    });

    // 토큰이 없고 비계정 모드도 아니면 로그인 페이지로 리다이렉트
    if (!token && !guestMode) {
      console.log("로그인 페이지로 리다이렉트");
      setShouldShowLogin(true);
      router.replace("/login");
    } else {
      console.log("스쿼드 빌더 표시");
      setShouldShowLogin(false);
    }
  }, [isServerReady, isCheckingServer, router]);

  // 서버 연결 확인 중이면 로딩 화면 표시
  if (isCheckingServer || !isServerReady) {
    return <ServerLoading />;
  }

  // 토큰이 없어서 로그인 페이지로 리다이렉트 중이면 아무것도 표시하지 않음
  if (shouldShowLogin === true) {
    return null;
  }

  // shouldShowLogin이 null이면 아직 결정되지 않았으므로 로딩 화면 표시
  if (shouldShowLogin === null) {
    return <ServerLoading />;
  }

  // 비계정 모드 지원: 토큰이 없어도 스쿼드 빌더 사용 가능
  return <SquadBuilder />;
}
