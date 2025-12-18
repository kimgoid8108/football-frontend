"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SquadBuilder from "./squad-builder";
import { getToken } from "./utils/api";

export default function Home() {
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return;

    const token = getToken();
    if (!token) {
      // 토큰이 없으면 즉시 로그인 페이지로 리다이렉트
      router.replace("/login");
      return;
    }

    setHasChecked(true);
  }, [router]);

  // 체크 완료 전이거나 토큰이 없으면 아무것도 표시하지 않음
  if (!hasChecked) {
    return null;
  }

  return <SquadBuilder />;
}
