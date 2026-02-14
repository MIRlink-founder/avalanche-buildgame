"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@mire/ui/components/button"

const Navigation = () => {
  return (
    <nav className="bg-background fixed top-0 right-0 left-0 z-50 border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Image
            src="/assets/Logo.svg"
            alt="Mirlink Logo"
            width={120}
            height={40}
            priority
          />
          <Link href="/">
            <Button variant="ghost" size="xl">
              로그인
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
