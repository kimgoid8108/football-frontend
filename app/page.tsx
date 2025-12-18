"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SquadBuilder from "./squad-builder";
import { getToken } from "./utils/api";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 클라이언트 사이드에서만 토큰 확인
    const token = getToken();
    if (!token) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // 체크 중이거나 토큰이 없으면 아무것도 표시하지 않음
  if (isChecking) {
    return null;
  }

  return <SquadBuilder />;
}
