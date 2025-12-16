import React from 'react';

interface ErrorToastProps {
  message: string;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border-2 border-red-400">
        <span className="text-2xl">⚠️</span>
        <span className="font-bold text-lg">{message}</span>
      </div>
    </div>
  );
};

export default ErrorToast;

