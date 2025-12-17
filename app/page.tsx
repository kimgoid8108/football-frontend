"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./utils/api";
import SquadBuilder from "./squad-builder";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const token = getToken();
  if (!token) {
    return null; // 리다이렉트 중
  }

  return <SquadBuilder />;
}
