'use client'

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  className?: string
}

export default function LottiePlayer({ src, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let anim: { destroy: () => void } | null = null
    import('lottie-web').then(({ default: lottie }) => {
      if (!containerRef.current) return
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: src,
      })
    })
    return () => { anim?.destroy() }
  }, [src])

  return <div ref={containerRef} className={className} />
}
