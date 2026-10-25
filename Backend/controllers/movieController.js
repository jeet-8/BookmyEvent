import mongoose from "mongoose";
import Movie from "../models/movieModel.js";

const movieFields = ["title", "language", "genre", "description", "releaseDate", "duration", "posterUrl", "bannerUrl"];

const validateMovieInput = (body, partial = false) => {
    const updates = {};

    for (const field of movieFields) {
        if (body[field] === undefined) {
            continue;
        }

        const value = body[field];
        if (field === "title" || field === "language" || field === "description" || field === "posterUrl" || field === "bannerUrl") {
            if (typeof value !== "string" || ((field === "title" || field === "language") && !value.trim())) {
                return { error: `${field} must be a valid string.` };
            }
            updates[field] = value.trim();
        } else if (field === "genre") {
            if (!Array.isArray(value) || value.some((genre) => typeof genre !== "string" || !genre.trim())) {
                return { error: "Genres must be an array of non-empty strings." };
            }
            updates.genre = [...new Set(value.map((genre) => genre.trim()))];
        } else if (field === "duration") {
            const duration = Number(value);
            if (!Number.isInteger(duration) || duration < 0) {
                return { error: "Duration must be a non-negative whole number." };
            }
            updates.duration = duration;
        } else if (field === "releaseDate") {
            const date = new Date(value);
            if (Number.isNaN(date.valueOf())) {
                return { error: "Release date must be a valid date." };
            }
            updates.releaseDate = date;
        }
    }

    if (!partial && (!updates.title || !updates.language)) {
        return { error: "Movie title and language are required." };
    }
    if (partial && Object.keys(updates).length === 0) {
        return { error: "Provide at least one movie field to update." };
    }

    return { updates };
};

const sendMovieError = (res, error, message) => {
    if (error.code === 11000) {
        return res.status(409).json({ message: "A movie with this title and language already exists." });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    console.error(message, error);
    return res.status(500).json({ message });
};

export const getMovies = async (_req, res) => {
    try {
        const movies = await Movie.find().sort({ releaseDate: -1, title: 1 }).lean();
        return res.status(200).json({ movies });
    } catch (error) {
        return sendMovieError(res, error, "Could not retrieve movies.");
    }
};

export const getMovieById = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid movie ID." });
    }

    try {
        const movie = await Movie.findById(req.params.id).lean();
        if (!movie) {
            return res.status(404).json({ message: "Movie not found." });
        }
        return res.status(200).json({ movie });
    } catch (error) {
        return sendMovieError(res, error, "Could not retrieve this movie.");
    }
};

export const createMovie = async (req, res) => {
    const { updates, error } = validateMovieInput(req.body || {});
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const movie = await Movie.create(updates);
        return res.status(201).json({ message: "Movie created successfully.", movie });
    } catch (createError) {
        return sendMovieError(res, createError, "Could not create this movie.");
    }
};

export const updateMovie = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid movie ID." });
    }
    const { updates, error } = validateMovieInput(req.body || {}, true);
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).lean();
        if (!movie) {
            return res.status(404).json({ message: "Movie not found." });
        }
        return res.status(200).json({ message: "Movie updated successfully.", movie });
    } catch (updateError) {
        return sendMovieError(res, updateError, "Could not update this movie.");
    }
};

export const deleteMovie = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid movie ID." });
    }

    try {
        const movie = await Movie.findByIdAndDelete(req.params.id).lean();
        if (!movie) {
            return res.status(404).json({ message: "Movie not found." });
        }
        return res.status(200).json({ message: "Movie deleted successfully.", movie });
    } catch (error) {
        return sendMovieError(res, error, "Could not delete this movie.");
    }
};
