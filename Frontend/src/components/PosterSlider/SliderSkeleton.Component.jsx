import React from "react";

const SliderSkeleton = ({ isDark = false }) => (
  <div aria-hidden="true">
    <div className="mb-4 px-1 sm:px-3">
      <div
        className={`h-7 w-52 animate-pulse rounded ${
          isDark ? "bg-white/10" : "bg-gray-200"
        }`}
      />
      <div
        className={`mt-2 h-4 w-64 max-w-full animate-pulse rounded ${
          isDark ? "bg-white/10" : "bg-gray-200"
        }`}
      />
    </div>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="px-1.5 md:px-3">
          <div
            className={`aspect-[2/3] animate-pulse rounded-md ${
              isDark ? "bg-white/10" : "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
            }`}
          />
          <div
            className={`mt-3 h-4 animate-pulse rounded ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          />
          <div
            className={`mt-2 h-3 w-2/3 animate-pulse rounded ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          />
        </div>
      ))}
    </div>
  </div>
);

export default SliderSkeleton;
