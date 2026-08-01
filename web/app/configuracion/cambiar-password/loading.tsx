import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CambiarPasswordLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Security Notice Skeleton */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="w-full h-4 bg-blue-200 rounded animate-pulse" />
        </div>

        {/* Security Checks Skeleton */}
        <Card>
          <CardHeader>
            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-48 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Password Fields Skeleton */}
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}

        {/* Security Tips Skeleton */}
        <Card>
          <CardHeader>
            <div className="w-36 h-6 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>

        {/* Button Skeleton */}
        <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
