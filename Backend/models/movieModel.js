import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        language: { type: String, required: true, trim: true },
        genre: { type: [String], default: [] },
        description: { type: String, default: "", trim: true },
        releaseDate: { type: Date, default: Date.now },
        duration: { type: Number, default: 0, min: 0, validate: Number.isInteger },
        posterUrl: { type: String, default: "", trim: true },
        bannerUrl: { type: String, default: "", trim: true }
    },
    { timestamps: true }
);

movieSchema.index({ title: 1, language: 1 }, { unique: true });

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

export default Movie;
