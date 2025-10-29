/* eslint-disable @next/next/no-img-element */
import { ImagesIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

type Image = {
  url: string;
  img_src: string;
  title: string;
};

const SearchImages = ({
  query,
  chatHistory,
  messageId,
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
}) => {
  const [images, setImages] = useState<Image[] | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const handleImageError = (index: number) => {
    // remove a imagem com erro da lista
    setImages((prevImages) => {
      if (!prevImages) return null;
      return prevImages.filter((_, i) => i !== index);
    });
    setSlides((prevSlides) => prevSlides.filter((_, i) => i !== index));
  };

  return (
    <>
      {!loading && images === null && (
        <button
          id={`search-images-${messageId}`}
          onClick={async () => {
            setLoading(true);

            const chatModelProvider = localStorage.getItem(
              'chatModelProviderId',
            );
            const chatModel = localStorage.getItem('chatModelKey');

            const res = await fetch(`/api/images`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: query,
                chatHistory: chatHistory,
                chatModel: {
                  providerId: chatModelProvider,
                  key: chatModel,
                },
              }),
            });

            const data = await res.json();

            const images = data.images ?? [];
            setImages(images);
            setSlides(
              images.map((image: Image) => {
                return {
                  src: image.img_src,
                };
              }),
            );
            setLoading(false);
          }}
          className="border border-dashed border-light-200 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-200 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <ImagesIcon size={17} />
            <p>Search images</p>
          </div>
          <PlusIcon className="text-[#24A0ED]" size={17} />
        </button>
      )}
      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-40 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      {images !== null && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {images.length > 4
              ? images.slice(0, 3).map((image, i) => (
                  <div key={i} className="relative">
                    {!loadedImages.has(i) && (
                      <div className="absolute inset-0 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
                    )}
                    <img
                      onClick={() => {
                        if (loadedImages.has(i)) {
                          setOpen(true);
                          setSlides([
                            slides[i],
                            ...slides.slice(0, i),
                            ...slides.slice(i + 1),
                          ]);
                        }
                      }}
                      src={image.img_src}
                      alt={image.title}
                      onLoad={() => handleImageLoad(i)}
                      onError={() => handleImageError(i)}
                      className={`h-full w-full aspect-video object-cover rounded-lg transition duration-200 ${
                        loadedImages.has(i)
                          ? 'active:scale-95 hover:scale-[1.02] cursor-zoom-in opacity-100'
                          : 'opacity-0'
                      }`}
                      style={{ minHeight: '160px' }}
                    />
                  </div>
                ))
              : images.map((image, i) => (
                  <div key={i} className="relative">
                    {!loadedImages.has(i) && (
                      <div className="absolute inset-0 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
                    )}
                    <img
                      onClick={() => {
                        if (loadedImages.has(i)) {
                          setOpen(true);
                          setSlides([
                            slides[i],
                            ...slides.slice(0, i),
                            ...slides.slice(i + 1),
                          ]);
                        }
                      }}
                      src={image.img_src}
                      alt={image.title}
                      onLoad={() => handleImageLoad(i)}
                      onError={() => handleImageError(i)}
                      className={`h-full w-full aspect-video object-cover rounded-lg transition duration-200 ${
                        loadedImages.has(i)
                          ? 'active:scale-95 hover:scale-[1.02] cursor-zoom-in opacity-100'
                          : 'opacity-0'
                      }`}
                      style={{ minHeight: '160px' }}
                    />
                  </div>
                ))}
            {images.length > 4 && (
              <button
                onClick={() => setOpen(true)}
                className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-dark-200 transition duration-200 active:scale-95 hover:scale-[1.02] h-auto w-full rounded-lg flex flex-col justify-between text-white p-2"
                style={{ minHeight: '160px' }}
              >
                <div className="flex flex-row items-center space-x-1">
                  {images.slice(3, 6).map((image, i) => (
                    <img
                      key={i}
                      src={image.img_src}
                      alt={image.title}
                      className="h-6 w-12 rounded-md lg:h-3 lg:w-6 lg:rounded-sm aspect-video object-cover"
                    />
                  ))}
                </div>
                <p className="text-black/70 dark:text-white/70 text-xs">
                  Ver mais {images.length - 3}
                </p>
              </button>
            )}
          </div>
          <Lightbox open={open} close={() => setOpen(false)} slides={slides} />
        </>
      )}
    </>
  );
};

export default SearchImages;
