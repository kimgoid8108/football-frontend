"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { forgotPassword, resetPassword } from "../utils/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"request" | "reset">(
    token ? "reset" : "request"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(token || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      setSuccess(result.message);

      // 개발 환경에서만 토큰 표시 (프로덕션에서는 이메일로 전송)
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setStep("reset");
        setSuccess(
          `비밀번호 재설정 토큰이 생성되었습니다. 토큰: ${result.resetToken.substring(
            0,
            20
          )}...`
        );
      } else {
        setSuccess(
          "이메일로 비밀번호 재설정 링크를 보냈습니다. (개발 환경에서는 토큰이 표시되지 않습니다)"
        );
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (!resetToken) {
      setError("재설정 토큰이 필요합니다.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(resetToken, password);
      setSuccess(
        "비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {/* 뒤로가기 버튼 - 카드 바로 위 */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 self-start"
          title="뒤로가기"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">뒤로</span>
        </button>

        <div className="bg-gray-800 rounded-xl w-full shadow-2xl border border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            🔐 비밀번호 재설정
          </h1>

          {step === "request" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입하신 이메일을 입력하세요"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition"
              >
                {isLoading ? "처리 중..." : "재설정 토큰 받기"}
              </button>

              {resetToken && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setStep("reset")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition"
                  >
                    비밀번호 재설정하기
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  재설정 토큰
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="재설정 토큰을 입력하세요"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
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

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition"
              >
                {isLoading ? "처리 중..." : "비밀번호 재설정"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
