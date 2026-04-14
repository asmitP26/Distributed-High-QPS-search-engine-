"use client";

import { Loader2, SearchX } from "lucide-react";
import { MovieCard } from "./movie-card";

interface Movie {
  id: number;
  title: string;
  rating: number;
  year: number;
  genre: string;
  poster?: string;
}

interface MovieGridProps {
  movies: Movie[];
  loading: boolean;
  hasSearched: boolean;
}

export function MovieGrid({ movies, loading, hasSearched }: MovieGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Searching for movies...</p>
      </div>
    );
  }

  if (hasSearched && movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No movies found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Search Results ({movies.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} />
        ))}
      </div>
    </section>
  );
}
