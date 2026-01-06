
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'success' | 'outline' }> = ({ variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider";
  const variants = {
    primary: "bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-black border border-yellow-500",
    danger: "bg-red-900/40 text-red-200 border border-red-700 hover:bg-red-900/60",
    success: "bg-emerald-900/40 text-emerald-200 border border-emerald-700 hover:bg-emerald-900/60",
    outline: "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white"
  };

  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />;
};

export const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ value, max, color, label }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="relative h-5 w-full bg-gray-900 border border-gray-700 rounded overflow-hidden mb-2">
      <div 
        className={`absolute top-0 left-0 h-full transition-all duration-300 ${color} opacity-60`} 
        style={{ width: `${percent}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-mono font-bold text-shadow z-10 text-white">
        <span>{label}</span>
        <span>{Math.floor(value)}/{max}</span>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; title?: string | React.ReactNode; className?: string, action?: React.ReactNode }> = ({ children, title, className = '', action }) => (
  <div className={`bg-[#1e1e1e] border border-gray-700 p-4 shadow-lg ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        {title && <h3 className="text-yellow-500 text-lg font-serif font-bold tracking-wider">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-[#1a1a1a] border-2 border-yellow-700 w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
      <h2 className="text-2xl text-yellow-500 border-b border-gray-700 pb-3 mb-4 font-serif">{title}</h2>
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  </div>
);