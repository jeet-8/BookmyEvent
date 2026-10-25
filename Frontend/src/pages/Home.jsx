import React from "react";

const Home = ({ user, error }) => {
  if (!user && !error) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 md:px-12 pt-6" aria-live="polite">
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {user && (
        <div className="rounded-lg bg-gray-100 p-5 text-gray-900">
          <h2 className="text-xl font-semibold">
            Welcome, {user.username || user.given_name}
          </h2>
        </div>
      )}
    </section>
  );
};

export default Home;
