"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SquadBuilder from "./squad-builder";
import { getToken } from "./utils/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // 토큰이 있으면 스쿼드 빌더 표시, 없으면 null (리다이렉트 중)
  const token = getToken();
  if (!token) {
    return null;
  }

  return <SquadBuilder />;
}
