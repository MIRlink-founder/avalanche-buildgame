export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-[--radius] w-64"></div>
        <div className="h-8 bg-muted rounded-[--radius] w-full"></div>
        <div className="h-8 bg-muted rounded-[--radius] w-3/4"></div>
        <div className="h-32 bg-muted rounded-[--radius] w-full"></div>
      </div>
    </div>
  )
}
