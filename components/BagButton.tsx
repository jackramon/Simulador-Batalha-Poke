
import React from 'react';

interface BagButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const BagButton: React.FC<BagButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`absolute right-0 top-20 w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-2 border-yellow-400 bg-yellow-500 text-white transform transition-transform hover:scale-105 active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
      title="Mochila"
    >
      <span className="text-2xl" role="img" aria-label="backpack">🎒</span>
    </button>
  );
};
