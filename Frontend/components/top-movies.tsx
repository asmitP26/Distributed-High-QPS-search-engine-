"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame, Loader2 } from "lucide-react";
import { MovieCard } from "./movie-card";
import { Button } from "@/components/ui/button";

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

export function TopMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/top");
        if (!res.ok) throw new Error("Failed to fetch top movies");
        const data = await res.json();
        
        
        const moviesArray = Array.isArray(data) ? data : data.results || [];
        setMovies(moviesArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load movies");
        
        const topMovies: Movie[] = [
          { id: "1", title: ["The Shawshank Redemption"], rating: 9.3, release_year: 1994, genres: ["Drama"], title_type: "movie", votes: 2800000, runtime: 142 },
          { id: "10", title: ["The Godfather"], rating: 9.2, release_year: 1972, genres: ["Crime"], title_type: "movie", votes: 1900000, runtime: 175 },
          { id: "2", title: ["The Dark Knight"], rating: 9.0, release_year: 2008, genres: ["Action"], title_type: "movie", votes: 2700000, runtime: 152 },
          { id: "3", title: ["Inception"], rating: 8.8, release_year: 2010, genres: ["Sci-Fi"], title_type: "movie", votes: 2400000, runtime: 148 },
          { id: "4", title: ["Pulp Fiction"], rating: 8.9, release_year: 1994, genres: ["Crime"], title_type: "movie", votes: 2100000, runtime: 154 },
        ];
        setMovies(topMovies);
      } finally {
        setLoading(false);
      }
    };

    fetchTopMovies();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Top Rated Movies</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="relative group/scroll">
          {}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover/scroll:opacity-100 transition-opacity rounded-full shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover/scroll:opacity-100 transition-opacity rounded-full shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

          {}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-2"
          >
            {movies.map((movie, index) => (
              <div key={movie.id} className="shrink-0 w-56">
                <MovieCard movie={movie} index={index} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
