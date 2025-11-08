export default function Loading() {
  // Skeleton grid used by Next.js while route is loading
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="mb-6 break-inside-avoid">
            <div className="animate-pulse">
              <div
                className="bg-gray-200 rounded-md w-full"
                style={{ height: `${180 + ((i * 37) % 140)}px` }}
              />
              <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
