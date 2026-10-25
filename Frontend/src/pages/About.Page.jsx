import React from "react";
import { Link } from "react-router-dom";
import DefaultlayoutHoc from "../layout/Default.layout";

const AboutPage = () => (
  <main className="container mx-auto min-h-[60vh] max-w-4xl px-4 py-12 md:px-12">
    <p className="text-sm font-semibold uppercase tracking-wide text-red-600">About us</p>
    <h1 className="mt-2 text-3xl font-bold text-gray-900">Your plans start here</h1>
    <p className="mt-5 text-lg leading-8 text-gray-600">
      BookMyEvent helps you discover movies and entertainment, explore what is
      available, and book tickets in one place.
    </p>
    <Link to="/#movies" className="mt-8 inline-flex rounded bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
      Explore movies
    </Link>
  </main>
);

export default DefaultlayoutHoc(AboutPage);
