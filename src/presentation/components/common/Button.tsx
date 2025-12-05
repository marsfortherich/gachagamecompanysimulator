interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles = {
  primary: 'bg-gacha-purple hover:bg-purple-600 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
  danger: 'bg-gacha-red hover:bg-red-600 text-white',
  success: 'bg-gacha-green hover:bg-green-600 text-white',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-lg font-semibold transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gacha-purple
        ${className}
      `}
    >
      {children}
    </button>
  );
}
