import React from "react";
import HeroSlider from "react-slick";
import { Link } from "react-router-dom";
import { NextArrow, PrevArrow } from "./Arrows.Component";

const HeroCarousel = ({ movies = [] }) => {
  const featuredMovies = movies
    .filter((movie) => movie.bannerImage?.url)
    .sort((first, second) => (second.releaseDate || "").localeCompare(first.releaseDate || ""))
    .slice(0, 5);

  const settingsLG = {
    arrows: true,
    slidesToShow: 1,
    infinite: true,
    dots: true,
    // speed: 500,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 4500,
    cssEase: "ease-in-out",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const settings = {
    arrows: true,
    slidesToShow: 3,
    infinite: true,
    dots: true,
    // speed: 500,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    speed: 2000,
    autoplaySpeed: 2000,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      {featuredMovies.length > 0 && <div className="bg-gray-100 py-3">
        <div className="mx-auto max-w-[1440px] px-2 md:px-5">
          {[settings, settingsLG].map((sliderSettings, sliderIndex) => (
            <div className={sliderIndex === 0 ? "lg:hidden" : "hidden lg:block"} key={sliderIndex}>
              <HeroSlider {...sliderSettings}>
                {featuredMovies.map((movie) => (
                  <div key={movie.id}>
                    <Link to={`/movie/${movie.id}`} className="group relative block h-52 overflow-hidden rounded-md md:h-64 lg:h-72">
                      <img
                        src={movie.bannerImage.url}
                        alt={`${movie.title} featured banner`}
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 max-w-[75%] text-white md:bottom-10 md:left-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Now showing</p>
                        <h2 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">{movie.title}</h2>
                        <span className="mt-3 inline-block text-sm font-semibold text-white/90">Explore movie <span aria-hidden="true">›</span></span>
                      </div>
                    </Link>
                  </div>
                ))}
              </HeroSlider>
            </div>
          ))}
        </div>
      </div>}
    </>
  );
};

export default HeroCarousel;
