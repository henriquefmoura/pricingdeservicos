// ========================================
// Weather Skeleton — Loading State
// ========================================

export function WeatherSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* City selector skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg w-72" />

      {/* Current weather cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Forecast panel */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-60 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
