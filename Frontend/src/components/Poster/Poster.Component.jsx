import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMovieGenres } from "../../services/movieApi";
import { getCloudinaryUrl } from "../../services/cloudinary";

const Poster = (props) => {
  const genres = getMovieGenres(props).slice(0, 3).join(" / ");
  const posterUrl = getCloudinaryUrl(
    props.posterUrl || props.posterImage?.url
  );
  const imageRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!posterUrl || isInView || !imageRef.current) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [isInView, posterUrl]);

  return (
    <Link to={`/movie/${props.id}`} className="block px-1.5 md:px-3">
      <div className="flex flex-col items-start gap-2">
        <div
          ref={imageRef}
          className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-200"
        >
          {posterUrl && !imageFailed ? (
            <>
              {!imageLoaded && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-300 via-gray-100 to-gray-300"
                />
              )}
              {isInView && (
                <img
                  src={posterUrl}
                  alt={`${props.title || "Movie"} poster`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                  className="relative h-full w-full object-cover"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 p-4 text-center text-sm font-semibold text-white">
              {props.title || "Movie poster"}
            </div>
          )}
        </div>
        <h3 className={`line-clamp-2 text-base font-semibold leading-5 ${props.isDark ? "text-white" : "text-gray-900"}`}>
          {props.title || "Untitled movie"}
        </h3>
        {genres && <p className={`line-clamp-1 text-sm ${props.isDark ? "text-gray-300" : "text-gray-500"}`}>{genres}</p>}
      </div>
    </Link>
  );
};

export default Poster;
