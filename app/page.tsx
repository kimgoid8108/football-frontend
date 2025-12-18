"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SquadBuilder from "./squad-builder";
import { getToken } from "./utils/api";

export default function Home() {
  const router = useRouter();
  const [shouldShowLogin, setShouldShowLogin] = useState<boolean | null>(null);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return;

    const token = getToken();
    const guestMode = sessionStorage.getItem("guestMode");

    // 토큰이 없고 비계정 모드도 아니면 로그인 페이지로 리다이렉트
    if (!token && !guestMode) {
      setShouldShowLogin(true);
      router.replace("/login");
    } else {
      setShouldShowLogin(false);
    }
  }, [router]);

  // 토큰이 없어서 로그인 페이지로 리다이렉트 중이면 아무것도 표시하지 않음
  if (shouldShowLogin === true) {
    return null;
  }

  // 비계정 모드 지원: 토큰이 없어도 스쿼드 빌더 사용 가능
  return <SquadBuilder />;
}
