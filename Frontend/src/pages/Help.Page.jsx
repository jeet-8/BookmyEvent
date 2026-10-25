import React from "react";
import { Link } from "react-router-dom";
import DefaultlayoutHoc from "../layout/Default.layout";

const HelpPage = () => (
  <main className="container mx-auto min-h-[60vh] max-w-4xl px-4 py-12 md:px-12">
    <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Help centre</p>
    <h1 className="mt-2 text-3xl font-bold text-gray-900">How can we help?</h1>
    <div className="mt-8 space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Finding a movie</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Use the search box or browse the movie sections from the navigation bar.</p>
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Signing in</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Choose Sign In in the navigation bar. Create an account first if you are a new customer.</p>
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Booking tickets</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Sign in, open a movie, choose a show and seats, and complete the booking flow. Checkout is currently a demo and does not collect payment.</p>
      </section>
    </div>
    <Link to="/" className="mt-8 inline-flex font-semibold text-red-600 hover:text-red-700">Back to home</Link>
  </main>
);

export default DefaultlayoutHoc(HelpPage);
