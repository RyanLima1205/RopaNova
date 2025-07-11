export default function CookiesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Header Section Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
          </div>
        </div>

        {/* Status Alert Skeleton */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
          </div>
        </div>

        {/* Cookie Categories Skeleton */}
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mt-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
                </div>
                <div className="w-11 h-6 bg-gray-200 rounded-full ml-4 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Actions Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
        </div>

        {/* Additional Information Skeleton */}
        <div className="bg-blue-50 border-blue-200 rounded-lg border p-6">
          <div className="h-5 bg-blue-200 rounded w-40 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-4/5 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
