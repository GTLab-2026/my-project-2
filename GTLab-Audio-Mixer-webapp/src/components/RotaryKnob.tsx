import React, { useState, useEffect } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (val: number) => void;
}

export const RotaryKnob: React.FC<Props> = ({ label, value, min, max, step = 0.5, unit = 'dB', color = '#00f2fe', onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startVal, setStartVal] = useState(value);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY - e.clientY;
      const range = max - min;
      const deltaVal = (deltaY / 150) * range;
      let newVal = Math.min(max, Math.max(min, startVal + deltaVal));
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      onChange(Number(newVal.toFixed(1)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startVal, min, max, step, onChange]);

  const percentage = ((value - min) / (max - min)) * 270 - 135; // -135deg to +135deg

  return (
    <div className="flex flex-col items-center select-none group cursor-pointer">
      <span className="text-[9px] font-mono text-slate-400 uppercase mb-1 tracking-wider">{label}</span>
      <div 
        onMouseDown={(e) => {
          setIsDragging(true);
          setStartY(e.clientY);
          setStartVal(value);
        }}
        className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 shadow-inner flex items-center justify-center transition-all group-hover:border-[#00f2fe]"
        style={{ borderColor: color }}
      >
        <div 
          className="absolute w-1 h-4 rounded-full origin-bottom top-1 transition-transform pointer-events-none"
          style={{ backgroundColor: color, transform: `rotate(${percentage}deg)` }}
        />
        <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-md pointer-events-none">
          {value > 0 ? `+${value}` : value}
        </div>
      </div>
      <span className="text-[10px] font-mono font-bold mt-1" style={{ color }}>{value} {unit}</span>
    </div>
  );
};
