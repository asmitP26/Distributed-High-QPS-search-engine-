"use client";

import { useState, useCallback, useEffect } from "react";
import { CinematicBackground } from "@/components/cinematic-background";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { TopMovies } from "@/components/top-movies";
import { MovieGrid } from "@/components/movie-grid";

interface Movie {
  id: number;
  title: string;
  rating: number;
  year: number;
  genre: string;
  poster?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All Genres");
  const [minRating, setMinRating] = useState(1);
  const [year, setYear] = useState("all");
  const [contentType, setContentType] = useState("All Types");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMovies = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (genre !== "All Genres") params.append("genre", genre);
      if (minRating > 1) params.append("minRating", minRating.toString());
      if (year !== "all") params.append("year", year);
      if (contentType !== "All Types") params.append("contentType", contentType);

      const res = await fetch(`http://localhost:5000/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setMovies(data);
    } catch (error) {
      console.error("Search error:", error);
      // Demo data for preview
      const demoMovies = [
        { id: 1, title: "The Shawshank Redemption", rating: 9.3, year: 1994, genre: "Drama" },
        { id: 2, title: "The Dark Knight", rating: 9.0, year: 2008, genre: "Action" },
        { id: 3, title: "Inception", rating: 8.8, year: 2010, genre: "Sci-Fi" },
        { id: 4, title: "Pulp Fiction", rating: 8.9, year: 1994, genre: "Crime" },
        { id: 5, title: "Forrest Gump", rating: 8.8, year: 1994, genre: "Drama" },
        { id: 6, title: "The Matrix", rating: 8.7, year: 1999, genre: "Sci-Fi" },
        { id: 7, title: "Interstellar", rating: 8.6, year: 2014, genre: "Sci-Fi" },
        { id: 8, title: "Parasite", rating: 8.5, year: 2019, genre: "Thriller" },
        { id: 9, title: "Fight Club", rating: 8.8, year: 1999, genre: "Drama" },
        { id: 10, title: "The Godfather", rating: 9.2, year: 1972, genre: "Crime" },
        { id: 11, title: "Avengers: Endgame", rating: 8.4, year: 2019, genre: "Action" },
        { id: 12, title: "Joker", rating: 8.4, year: 2019, genre: "Drama" },
      ];

      // Filter demo movies based on criteria
      let filtered = demoMovies;
      if (query) {
        filtered = filtered.filter((m) =>
          m.title.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (genre !== "All Genres") {
        filtered = filtered.filter((m) => m.genre === genre);
      }
      if (minRating > 1) {
        filtered = filtered.filter((m) => m.rating >= minRating);
      }
      if (year !== "all") {
        filtered = filtered.filter((m) => m.year.toString() === year);
      }
      setMovies(filtered);
    } finally {
      setLoading(false);
    }
  }, [query, genre, minRating, year, contentType]);

  // Auto-search when filters change (with debounce)
  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => {
        searchMovies();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [genre, minRating, year, contentType, hasSearched, searchMovies]);

  return (
    <main className="relative min-h-screen">
      <CinematicBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="text-3xl md:text-4xl lg:text-5xl mr-3">&#127916;</span>
            <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Movie Search Engine
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover your next favorite movie. Search through thousands of titles with powerful filters.
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={searchMovies}
          />
        </div>

        {/* Filter Panel */}
        <FilterPanel
          genre={genre}
          minRating={minRating}
          year={year}
          contentType={contentType}
          onGenreChange={setGenre}
          onRatingChange={setMinRating}
          onYearChange={setYear}
          onContentTypeChange={setContentType}
        />

        {/* Top Movies Section */}
        {!hasSearched && <TopMovies />}

        {/* Search Results */}
        <MovieGrid
          movies={movies}
          loading={loading}
          hasSearched={hasSearched}
        />

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js & Tailwind CSS • College Project Demo
          </p>
        </footer>
      </div>
    </main>
  );
}
