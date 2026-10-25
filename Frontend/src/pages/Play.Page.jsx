import React from "react";
import { Link } from "react-router-dom";
import DefaultlayoutHoc from "../layout/Default.layout";

const PlayPage = () => {
  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Plays</h1>
      <p className="mt-3 max-w-lg text-gray-600">
        Play listings are not available yet. Explore the movie and entertainment selections on our homepage.
      </p>
      <Link to="/#movies" className="mt-6 rounded bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700">
        Browse movies
      </Link>
    </main>
  );
};

export default DefaultlayoutHoc(PlayPage);