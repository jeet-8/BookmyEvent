import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import SliderSkeleton from "./SliderSkeleton.Component";

const PosterSlider = lazy(() => import("./PosterSlider.Component"));

const LazyPosterSlider = (props) => {
  const sectionRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const { isLoading = false, isDark = false } = props;

  useEffect(() => {
    if (!sectionRef.current || shouldLoad) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={sectionRef}>
      {isLoading || !shouldLoad ? (
        <SliderSkeleton isDark={isDark} />
      ) : (
        <Suspense fallback={<SliderSkeleton isDark={isDark} />}>
          <PosterSlider {...props} />
        </Suspense>
      )}
    </div>
  );
};

export default LazyPosterSlider;
