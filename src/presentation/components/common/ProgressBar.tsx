interface ProgressBarProps {
  value: number;      // 0-100
  max?: number;
  color?: 'blue' | 'green' | 'purple' | 'gold' | 'red';
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorStyles = {
  blue: 'bg-gacha-blue',
  green: 'bg-gacha-green',
  purple: 'bg-gacha-purple',
  gold: 'bg-gacha-gold',
  red: 'bg-gacha-red',
};

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'blue',
  showLabel = false,
  label,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{label || ''}</span>
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${colorStyles[color]} ${sizeStyles[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
