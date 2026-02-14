'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('앱 에러:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          문제가 발생했습니다
        </h1>
        <p className="text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground">
            오류 코드: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="bg-primary text-primary-foreground rounded-[--radius] hover:bg-primary-darker px-4 py-2 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
