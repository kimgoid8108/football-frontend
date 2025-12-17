"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register, setToken } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await login({ email, password });
      } else {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          setIsLoading(false);
          return;
        }
        response = await register({ email, password, name });
      }

      setToken(response.accessToken);
      setUser(response.user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 p-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          ⚽ Football Squad Builder
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {isLogin ? "로그인" : "회원가입"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition"
          >
            {isLoading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-purple-400 hover:text-purple-300 text-sm block w-full"
          >
            {isLogin
              ? "계정이 없으신가요? 회원가입"
              : "이미 계정이 있으신가요? 로그인"}
          </button>
          {isLogin && (
            <button
              onClick={() => router.push("/reset-password")}
              className="text-gray-400 hover:text-gray-300 text-sm block w-full"
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
