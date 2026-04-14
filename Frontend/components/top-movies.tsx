"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame, Loader2 } from "lucide-react";
import { MovieCard } from "./movie-card";
import { Button } from "@/components/ui/button";

interface Movie {
  id: number;
  title: string;
  rating: number;
  year: number;
  genre: string;
  poster?: string;
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
        setMovies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load movies");
        // Demo data for preview
        setMovies([
          { id: 1, title: "The Shawshank Redemption", rating: 9.3, year: 1994, genre: "Drama" },
          { id: 2, title: "The Dark Knight", rating: 9.0, year: 2008, genre: "Action" },
          { id: 3, title: "Inception", rating: 8.8, year: 2010, genre: "Sci-Fi" },
          { id: 4, title: "Pulp Fiction", rating: 8.9, year: 1994, genre: "Crime" },
          { id: 5, title: "Forrest Gump", rating: 8.8, year: 1994, genre: "Drama" },
          { id: 6, title: "The Matrix", rating: 8.7, year: 1999, genre: "Sci-Fi" },
          { id: 7, title: "Interstellar", rating: 8.6, year: 2014, genre: "Sci-Fi" },
          { id: 8, title: "Parasite", rating: 8.5, year: 2019, genre: "Thriller" },
        ]);
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
          {/* Scroll Buttons */}
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

          {/* Gradient Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-2"
          >
            {movies.map((movie, index) => (
              <div key={movie.id} className="flex-shrink-0 w-56">
                <MovieCard movie={movie} index={index} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
