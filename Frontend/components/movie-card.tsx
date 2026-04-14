"use client";

import { Film } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  rating: number;
  year: number;
  genre: string;
  poster?: string;
}

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const staggerClass = `stagger-${(index % 5) + 1}`;
  
  return (
    <div 
      className={`movie-card relative group rounded-xl overflow-hidden glass fade-in opacity-0 ${staggerClass}`}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
            <Film className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1">
          <span className="text-yellow-400">&#9733;</span>
          <span className="text-sm font-semibold text-primary-foreground">{movie.rating.toFixed(1)}</span>
        </div>
        
        {/* Movie Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-2 text-balance">
            {movie.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-base">&#128197;</span> {movie.year}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-base">&#127917;</span> {movie.genre}
            </span>
          </div>
        </div>
      </div>
      
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ring-2 ring-primary/50" />
    </div>
  );
}
