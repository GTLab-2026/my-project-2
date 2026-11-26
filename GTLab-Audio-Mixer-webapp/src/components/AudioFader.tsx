import React, { useState, useRef, useEffect, useId, useCallback } from 'react';

/**
 * AudioFader Props
 */
export interface AudioFaderProps {
  /** Accessible label displayed and announced by screen readers */
  label: string;
  /** Current fader value in specified units (e.g. dB) */
  value: number;
  /** Minimum allowable fader value (default: -60) */
  min?: number;
  /** Maximum allowable fader value (default: 12) */
  max?: number;
  /** Step increment for slider adjustment (default: 0.1) */
  step?: number;
  /** Unit suffix for readout display (default: 'dB') */
  unit?: string;
  /** Accent color for the active track and thumb glow (default: '#00f0ff') */
  accentColor?: string;
  /** Layout orientation: 'vertical' or 'horizontal' (default: 'vertical') */
  orientation?: 'vertical' | 'horizontal';
  /** Height in pixels for vertical slider (default: 140) */
  height?: number;
  /** Optional VU meter fill level (0.0 to 1.0) to display alongside fader */
  vuLevel?: number;
  /** Whether the fader is disabled */
  disabled?: boolean;
  /** Callback fired continuously when fader value changes */
  onChange: (value: number) => void;
  /** Optional callback fired when the interaction ends or exact value is committed */
  onValueCommit?: (value: number) => void;
}

/**
 * Usage example:
 * ```tsx
 * const [gain, setGain] = useState(0);
 * <AudioFader label="Channel 1 Gain" value={gain} min={-48} max={12} onChange={setGain} />
 * ```
 */
export const AudioFader: React.FC<AudioFaderProps> = ({
  label,
  value,
  min = -60,
  max = 12,
  step = 0.1,
  unit = 'dB',
  accentColor = '#00f0ff',
  orientation = 'vertical',
  height = 140,
  vuLevel,
  disabled = false,
  onChange,
  onValueCommit,
}) => {
  const faderId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editString, setEditString] = useState('');

  // Clamp value within bounds
  const clampedValue = Math.min(max, Math.max(min, value));
  const range = max - min;
  const percentage = range > 0 ? Math.max(0, Math.min(100, ((clampedValue - min) / range) * 100)) : 0;

  const formattedValue = `${clampedValue > 0 ? '+' : ''}${clampedValue.toFixed(1)}`;
  const valueText = `${formattedValue} ${unit}`;

  // Open inline edit mode
  const handleStartEditing = () => {
    if (disabled) return;
    setEditString(clampedValue.toFixed(1));
    setIsEditing(true);
  };

  // Commit text input
  const handleCommitEdit = useCallback(() => {
    const parsed = parseFloat(editString);
    if (!Number.isNaN(parsed)) {
      const bounded = Math.min(max, Math.max(min, parsed));
      const rounded = Math.round(bounded / step) * step;
      const finalVal = Number(rounded.toFixed(1));
      onChange(finalVal);
      onValueCommit?.(finalVal);
    }
    setIsEditing(false);
  }, [editString, max, min, step, onChange, onValueCommit]);

  // Focus the input when entering inline edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const isVertical = orientation === 'vertical';

  return (
    <section 
      aria-label={`${label} control`}
      className={`flex flex-col items-center select-none text-slate-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Header Label */}
      <span 
        id={`${faderId}-label`}
        className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider mb-1 text-center truncate max-w-[80px]"
      >
        {label}
      </span>

      {/* Main Track & Fader Area */}
      <div 
        className={`relative flex items-center justify-center ${isVertical ? 'flex-row gap-2' : 'flex-col gap-1 w-full'}`}
        style={isVertical ? { height: `${height}px` } : undefined}
      >
        {/* Slider Rail & Handle */}
        <div 
          className="relative flex items-center justify-center"
          style={isVertical ? { height: `${height}px`, width: '28px' } : { width: '100%', height: '28px' }}
        >
          {/* Fader Track Slot */}
          <div 
            className="absolute rounded-full bg-slate-950 border border-slate-800 shadow-inner overflow-hidden"
            style={
              isVertical
                ? { width: '6px', top: '10px', bottom: '10px' }
                : { height: '6px', left: '10px', right: '10px' }
            }
          >
            {/* Active level fill */}
            <div 
              className="absolute transition-all duration-75"
              style={
                isVertical
                  ? {
                      bottom: 0,
                      width: '100%',
                      height: `${percentage}%`,
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}88`,
                    }
                  : {
                      left: 0,
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}88`,
                    }
              }
            />
          </div>

          {/* Accessible Semantic Range Input (Single Unified Focus Path) */}
          <input
            id={faderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={clampedValue}
            disabled={disabled}
            aria-labelledby={`${faderId}-label`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue}
            aria-valuetext={valueText}
            aria-orientation={orientation}
            onChange={(e) => onChange(Number(e.target.value))}
            onMouseUp={() => onValueCommit?.(clampedValue)}
            onTouchEnd={() => onValueCommit?.(clampedValue)}
            onKeyUp={(e) => {
              if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
                onValueCommit?.(clampedValue);
              }
            }}
            className={`
              cursor-pointer appearance-none bg-transparent outline-none
              focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900
              ${isVertical ? '-rotate-90 origin-center absolute' : 'w-full'}
            `}
            style={{
              width: isVertical ? `${height}px` : '100%',
              accentColor: accentColor,
            }}
          />
        </div>

        {/* Optional Synchronized LED VU Meter */}
        {typeof vuLevel === 'number' && isVertical && (
          <div 
            className="flex flex-col justify-end w-1.5 bg-slate-950 rounded-full border border-slate-800 p-0.5 overflow-hidden"
            style={{ height: `${height - 20}px` }}
            aria-hidden="true"
          >
            <div 
              className="w-full rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(0, Math.min(100, vuLevel * 100))}%`,
                background: vuLevel > 0.85 
                  ? 'linear-gradient(to top, #00f0ff, #ff007f)' 
                  : vuLevel > 0.6 
                  ? 'linear-gradient(to top, #00f0ff, #eab308)' 
                  : '#00f0ff',
                boxShadow: `0 0 6px ${vuLevel > 0.85 ? '#ff007f' : '#00f0ff'}88`,
              }}
            />
          </div>
        )}
      </div>

      {/* Numerical Value Readout / Click-to-Type Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          step={step}
          min={min}
          max={max}
          value={editString}
          aria-label={`Exact ${label} numeric value`}
          onChange={(e) => setEditString(e.target.value)}
          onBlur={handleCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommitEdit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="mt-1 w-14 text-center font-mono text-[10px] font-bold bg-slate-950 text-cyan-400 border border-cyan-500 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={handleStartEditing}
          title="Click to enter exact value"
          aria-label={`${label} value is ${valueText}. Click to edit numerically.`}
          className="mt-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <span style={{ color: accentColor }}>{formattedValue}</span> <span className="text-[8px] text-slate-500">{unit}</span>
        </button>
      )}
    </section>
  );
};
