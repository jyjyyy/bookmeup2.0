'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { GalleryModal } from './GalleryModal'

interface ProGalleryProps {
  images: string[]
}

export function ProGallery({ images }: ProGalleryProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  if (!images || images.length === 0) {
    return null
  }

  const handleImageClick = (index: number) => {
    setModalIndex(index)
  }

  const handleNext = () => {
    if (modalIndex !== null) {
      setModalIndex((modalIndex + 1) % images.length)
    }
  }

  const handlePrevious = () => {
    if (modalIndex !== null) {
      setModalIndex((modalIndex - 1 + images.length) % images.length)
    }
  }

  return (
    <>
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2A1F2D] mb-2">
            Galerie
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group cursor-pointer overflow-hidden rounded-[24px] aspect-square"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={imageUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>

      {modalIndex !== null && (
        <GalleryModal
          images={images}
          currentIndex={modalIndex}
          onClose={() => setModalIndex(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </>
  )
}

