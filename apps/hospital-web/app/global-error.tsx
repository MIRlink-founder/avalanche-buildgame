'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground font-sans antialiased">
        <div className="max-w-[28rem] text-center">
          <h1 className="text-2xl font-bold mb-4">
            심각한 오류가 발생했습니다
          </h1>
          <p className="text-muted-foreground mb-4">
            페이지를 새로고침하거나 다시 시도해주세요.
          </p>
          {error.digest && (
            <p className="text-sm text-dark-4 mb-4">
              오류 코드: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="bg-primary text-primary-foreground rounded-[--radius] px-4 py-2 border-0 cursor-pointer text-base hover:bg-primary-darker transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
