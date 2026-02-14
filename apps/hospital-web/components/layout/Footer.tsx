"use client"

import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer className="bg-background border-t">
      <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/Logo.svg"
              alt="Mirlink"
              width={80}
              height={20}
            />
            <span className="text-muted-foreground text-xs">
              © 2026 Mirlink. All rights reserved.
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-6 text-sm">
            <Link href="#" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              개인정보취급방침
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              고객센터
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
