"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@mire/ui/components/carousel"

const slides = [
  {
    title: "desc1",
    subtitle: "title1",
    // image: "/images/onboarding-1.png", // 이미지 경로
  },
  {
    title: "desc2",
    subtitle: "title2",
    // image: "/images/onboarding-2.png",
  },
  {
    title: "desc3",
    subtitle: "title3",
    // image: "/images/onboarding-3.png",
  },
  {
    title: "desc4",
    subtitle: "title4",
    // image: "/images/onboarding-4.png",
  },
]

export function OnboardingCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }))

  useEffect(() => {
    if (!api) return

    // 현재 슬라이드 추적
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = (index: number) => {
    api?.scrollTo(index)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full flex-1"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem
              key={index}
              className="flex h-full flex-col items-center justify-center p-12"
            >
              {/* TODO: 이미지 추가 */}
              {/* {slide.image && (
                <div className="relative w-64 h-64 mb-8">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )} */}

              {/* 텍스트 영역 */}
              <div className="space-y-4 text-center">
                <p className="text-lg font-medium text-blue-700">
                  {slide.subtitle}
                </p>
                <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                  {slide.title}
                </h2>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots 인디케이터 */}
      <div className="flex justify-center gap-2 pb-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === index
                ? "w-3 bg-blue-500"
                : "w-2 bg-white hover:bg-blue-400"
            }`}
            aria-label={`슬라이드 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  )
}
