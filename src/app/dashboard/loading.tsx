export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="skeleton h-8 w-40 mb-2" />
          <div className="skeleton h-5 w-56" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-36 rounded-lg" />
          <div className="skeleton h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-6">
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Section header */}
          <div>
            <div className="skeleton h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="skeleton h-5 w-32" />
                    <div className="skeleton h-6 w-16 rounded-full" />
                  </div>
                  <div className="skeleton h-4 w-24 mb-3" />
                  <div className="skeleton h-4 w-full mb-1" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div>
          <div className="bg-card border rounded-xl p-5">
            <div className="skeleton h-5 w-36 mb-4" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-3 mb-3">
                <div className="skeleton h-5 w-20 rounded-full mb-2" />
                <div className="skeleton h-4 w-full mb-1" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
