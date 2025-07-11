export default function PrivacidadLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="flex items-center gap-4 p-4">
          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Document Info Card Skeleton */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mt-1" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Content Skeleton */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 space-y-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />

                  {/* Subsection skeleton */}
                  <div className="ml-4 space-y-2 mt-3">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                  </div>

                  {/* Special content boxes skeleton */}
                  {(i === 2 || i === 4 || i === 6) && (
                    <div className="bg-gray-100 rounded-lg p-3 mt-3">
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info Skeleton */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="bg-gray-100 rounded-lg p-3 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="text-center space-y-2 pb-8">
          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-3 w-56 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  )
}
