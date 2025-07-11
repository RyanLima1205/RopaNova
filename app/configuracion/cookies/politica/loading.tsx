export default function CookiePolicyLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-48 mt-1 animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Introduction Skeleton */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-1 animate-pulse"></div>
                <div className="h-2 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Cookie Categories Skeleton */}
        {[...Array(4)].map((_, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-lg border-2">
            <div className="p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-12 ml-auto animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-0">
              {[...Array(3)].map((_, cookieIndex) => (
                <div key={cookieIndex}>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mt-2 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-16 ml-3 animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  {cookieIndex < 2 && <div className="h-px bg-gray-200"></div>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Third-party Services Skeleton */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-1 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Section Skeleton */}
        <div className="bg-blue-50 border-blue-200 rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-blue-200 rounded animate-pulse"></div>
            <div className="h-5 bg-blue-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-blue-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-5/6 animate-pulse"></div>
          </div>
          <div className="flex gap-2 pt-4">
            <div className="h-9 bg-blue-200 rounded w-32 animate-pulse"></div>
            <div className="h-9 bg-blue-200 rounded w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Contact Skeleton */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
