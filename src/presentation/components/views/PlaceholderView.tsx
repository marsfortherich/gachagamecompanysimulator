import { Card } from '../common';
import { Icon } from '../common/Icon';

export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <Card>
        <div className="text-center py-12">
          <Icon name="construction" size="lg" className="text-yellow-500 mb-4" />
          <p className="text-gray-400">This feature is coming soon!</p>
          <p className="text-sm text-gray-500 mt-2">
            Stay tuned for updates.
          </p>
        </div>
      </Card>
    </div>
  );
}
