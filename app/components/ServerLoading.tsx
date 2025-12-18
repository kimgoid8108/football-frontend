"use client";

export default function ServerLoading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">서버 가동 중...</h1>
        <p className="text-green-200 text-lg">잠시만 기다려주세요</p>
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">서버 연결 확인 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}
