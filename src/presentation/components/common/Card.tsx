interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
