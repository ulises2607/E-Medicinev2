"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";

interface CarouselImage {
  src: string | StaticImageData;
  alt: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 md:h-56 bg-gray-200 flex items-center justify-center text-gray-500">
        Sin imágenes para mostrar
      </div>
    );
  }

  // Lógica para cambiar de slide (no implementada aquí para simplicidad inicial)
  // const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  // const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {" "}
      {/* h-full para que tome la altura del padre */}
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            layout="fill"
            objectFit="cover"
            priority={index === 0} // Dar prioridad a la primera imagen
          />
        </div>
      ))}
      {/* Indicadores de puntos */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                idx === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
