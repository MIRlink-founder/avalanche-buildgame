import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-9xl font-bold text-muted-foreground">
          404
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-muted-foreground">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground rounded-[--radius] hover:bg-primary-darker px-6 py-3 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
