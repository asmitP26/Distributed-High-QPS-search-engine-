"use client";

import { useState, useCallback, useEffect } from "react";
import { CinematicBackground } from "@/components/cinematic-background";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { TopMovies } from "@/components/top-movies";
import { MovieGrid } from "@/components/movie-grid";
import Link from "next/link";

interface Movie {
  id: string;
  title: string[];
  rating: number;
  release_year: number;
  genres: string[];
  title_type: string;
  votes: number;
  runtime: number;
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
      if (query.trim()) params.append("q", query.trim());
      if (genre !== "All Genres") params.append("genre", genre);
      if (minRating > 1) params.append("minRating", minRating.toString());
      if (year !== "all") params.append("year", year);
      if (contentType !== "All Types") params.append("contentType", contentType);

      const res = await fetch(`http://localhost:5000/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      const moviesArray = Array.isArray(data) ? data : data.results || [];
      setMovies(moviesArray);
    } catch (error) {
      console.error("Search error:", error);
      // Demo data for preview
      const demoMovies = [
        { id: "1", title: ["The Shawshank Redemption"], rating: 9.3, release_year: 1994, genres: ["Drama"], title_type: "movie", votes: 2000000, runtime: 142 },
        { id: "2", title: ["The Dark Knight"], rating: 9.0, release_year: 2008, genres: ["Action"], title_type: "movie", votes: 2500000, runtime: 152 },
        { id: "3", title: ["Inception"], rating: 8.8, release_year: 2010, genres: ["Sci-Fi"], title_type: "movie", votes: 2100000, runtime: 148 },
        { id: "4", title: ["Pulp Fiction"], rating: 8.9, release_year: 1994, genres: ["Crime"], title_type: "movie", votes: 1900000, runtime: 154 },
        { id: "5", title: ["Forrest Gump"], rating: 8.8, release_year: 1994, genres: ["Drama"], title_type: "movie", votes: 1800000, runtime: 142 },
        { id: "6", title: ["The Matrix"], rating: 8.7, release_year: 1999, genres: ["Sci-Fi"], title_type: "movie", votes: 1700000, runtime: 136 },
        { id: "7", title: ["Interstellar"], rating: 8.6, release_year: 2014, genres: ["Sci-Fi"], title_type: "movie", votes: 1600000, runtime: 169 },
        { id: "8", title: ["Parasite"], rating: 8.5, release_year: 2019, genres: ["Thriller"], title_type: "movie", votes: 700000, runtime: 132 },
        { id: "9", title: ["Fight Club"], rating: 8.8, release_year: 1999, genres: ["Drama"], title_type: "movie", votes: 1900000, runtime: 139 },
        { id: "10", title: ["The Godfather"], rating: 9.2, release_year: 1972, genres: ["Crime"], title_type: "movie", votes: 1700000, runtime: 175 },
        { id: "11", title: ["Avengers: Endgame"], rating: 8.4, release_year: 2019, genres: ["Action"], title_type: "movie", votes: 1000000, runtime: 181 },
        { id: "12", title: ["Joker"], rating: 8.4, release_year: 2019, genres: ["Drama"], title_type: "movie", votes: 1200000, runtime: 122 },
      ];

      // Filter demo movies based on criteria
      let filtered = demoMovies;
      const qLower = query.trim().toLowerCase();
      if (qLower) {
        filtered = filtered.filter((m) =>
          m.title[0].toLowerCase().includes(qLower)
        );
      }
      if (genre !== "All Genres") {
        filtered = filtered.filter((m) => m.genres.includes(genre));
      }
      if (minRating > 1) {
        filtered = filtered.filter((m) => m.rating && m.rating >= minRating);
      }
      if (year !== "all") {
        filtered = filtered.filter((m) => m.release_year && m.release_year.toString() === year);
      }
      if (contentType !== "All Types") {
         filtered = filtered.filter((m) => m.title_type && m.title_type.toLowerCase() === contentType.toLowerCase().replace(" ", ""));
      }
      setMovies(filtered);
    } finally {
      setLoading(false);
    }
  }, [query, genre, minRating, year, contentType]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const trimmedVal = val.trim();
    // Only search at trailing space OR length is a multiple of 4
    if (
      (val.endsWith(" ") && trimmedVal.length > 0) ||
      (trimmedVal.length > 0 && trimmedVal.length % 4 === 0)
    ) {
      searchMovies();
    } else if (trimmedVal.length === 0) {
      // Re-trigger search when cleared if there's other filters
      if (hasSearched) {
        searchMovies();
      }
    }
  };

  // Search when filters change
  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => {
        searchMovies();
      }, 400); // Increased debounce to prevent rapid firing while adjusting filters
      return () => clearTimeout(timer);
    }
  }, [genre, minRating, year, contentType]); // Removed `searchMovies` from dependencies to avoid loop, kept only filter values.

  return (
    <main className="relative min-h-screen">
      <CinematicBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="absolute top-4 -right-4 md:-right-8 z-50 flex gap-4">
          <Link href="/simulation">
            <button className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all border border-primary/50 flex items-center gap-2">
              <span className="text-xl">⚡</span> Track Live QPS Metrics
            </button>
          </Link>
        </div>

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
            onQueryChange={handleQueryChange}
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
