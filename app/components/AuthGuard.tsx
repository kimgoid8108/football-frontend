"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "../utils/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 로그인 페이지는 체크하지 않음
    if (pathname === "/login") {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [pathname, router]);

  // 로그인 페이지가 아니고 토큰이 없으면 null 반환 (리다이렉트 중)
  if (pathname !== "/login" && !getToken()) {
    return null;
  }

  return <>{children}</>;
}
