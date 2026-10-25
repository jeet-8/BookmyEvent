import dotenv from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getMockMovies } from "../../Frontend/src/data/mockMovies.js";
import Movie from "../models/movieModel.js";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const seedMovies = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not set in Backend/.env.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    let inserted = 0;

    try {
        for (const { title, language, genre, releaseDate, duration, description, posterUrl, bannerUrl } of getMockMovies()) {
            const result = await Movie.updateOne(
                { title, language },
                {
                    $setOnInsert: {
                        title,
                        language,
                        genre,
                        releaseDate,
                        duration: duration || 0,
                        description: description || "",
                        posterUrl: posterUrl || "",
                        bannerUrl: bannerUrl || ""
                    }
                },
                { upsert: true }
            );
            if (result.upsertedCount) {
                inserted += 1;
            }
        }

        console.log(`Movie catalog ready. Added ${inserted} new movies.`);
    } finally {
        await mongoose.disconnect();
    }
};

seedMovies().catch((error) => {
    console.error("Could not seed movies:", error);
    process.exitCode = 1;
});
