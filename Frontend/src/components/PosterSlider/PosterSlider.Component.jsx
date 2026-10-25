import React from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import Poster from "../Poster/Poster.Component";

const PosterSlider = (props) => {
  const {
    title,
    subtitle,
    posters,
    isDark,
    config,
    textOnly = false,
    maxItems,
  } = props;
  const allPosters = (posters || []).filter((movie) =>
    textOnly ? movie.title : movie.posterUrl || movie.posterImage?.url
  );
  const availablePosters = allPosters
    .slice(0, maxItems || Infinity);

  const formatReleaseDate = (releaseDate) => {
    if (!releaseDate) {
      return "";
    }
    const date = new Date(releaseDate);
    return Number.isNaN(date.valueOf())
      ? ""
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const renderMovie = (movie) =>
    textOnly ? (
      <Link
        to={`/movie/${movie.id}`}
        key={movie.id}
        className="block px-1.5 md:px-3"
      >
        <article className="flex min-h-32 flex-col justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="line-clamp-2 text-base font-semibold leading-5 text-gray-900">
            {movie.title}
          </h4>
          <div className="flex flex-col gap-1">
            {formatReleaseDate(movie.releaseDate) && (
              <p className="text-sm text-gray-500">
                {formatReleaseDate(movie.releaseDate)}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {Array.isArray(movie.genre)
                ? movie.genre
                    .map((genre) =>
                      typeof genre === "string" ? genre : genre?.name
                    )
                    .filter(Boolean)
                    .join(" / ")
                : movie.genre || ""}
            </p>
          </div>
        </article>
      </Link>
    ) : (
      <Poster {...movie} isDark={isDark} key={movie.id} />
    );

  const settings = {
    infinite: false,
    autoplay: false,
    slidesToShow: Math.min(5, availablePosters.length || 1),
    slidesToScroll: Math.min(5, availablePosters.length || 1),
    initialSlide: 0,
    arrows: true,
    dots: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
    ],
    ...config,
  };

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4 px-1 sm:px-3">
        <div>
          <h3 className={`text-xl font-bold sm:text-2xl ${isDark ? "text-white" : "text-gray-900"}`}>
            {title}
          </h3>
          {subtitle && <p className={`mt-1 text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>{subtitle}</p>}
        </div>
        {allPosters.length > 5 && (
          <Link
            to="/movies"
            state={{ title, posters }}
            className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
          >
            See All <span aria-hidden="true">›</span>
          </Link>
        )}
      </div>
      {availablePosters.length === 0 ? (
        <p className={`px-1.5 text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>
          No movies available yet.
        </p>
      ) : (
        <Slider {...settings}>
          {availablePosters.map(renderMovie)}
        </Slider>
      )}
    </section>
  );
};

export default PosterSlider;
