"use client";

import { Film } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const staggerClass = `stagger-${(index % 5) + 1}`;
  
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div 
          className={`movie-card relative rounded-xl overflow-hidden glass fade-in opacity-0 ${staggerClass} p-5 flex flex-col justify-between h-36 bg-card text-card-foreground border cursor-pointer hover:border-primary/50 transition-all duration-300 group`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start gap-3">
              <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {movie.title?.[0] || 'Unknown Title'}
              </h3>
              {movie.rating != null && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                  <span className="text-yellow-500 text-sm">&#9733;</span>
                  <span className="text-sm font-semibold">{movie.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground mt-auto pt-2">
            <div className="flex items-center gap-3">
              {movie.runtime != null && (
                <span className="flex items-center gap-1.5 font-medium">
                    &#9201; {movie.runtime} min
                </span>
              )}
            </div>
            {movie.title_type && (
              <span className="capitalize font-medium text-foreground bg-secondary px-2.5 py-1 rounded-md text-xs">
                {movie.title_type.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent 
        side="right" 
        align="start"
        sideOffset={15}
        className="w-80 glass bg-card/95 backdrop-blur-2xl border-border/50 text-card-foreground shadow-2xl p-6 rounded-xl animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 z-50 pointer-events-auto"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h4 className="text-xl font-bold leading-tight">{movie.title?.[0] || 'Unknown Title'}</h4>
            {movie.rating != null && (
               <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded">
                 <span className="text-yellow-500">&#9733;</span>
                 <span className="font-bold">{movie.rating.toFixed(1)}</span>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {movie.release_year && <span>{movie.release_year}</span>}
            {movie.release_year && movie.runtime != null && <span>•</span>}
            {movie.runtime != null && <span>{movie.runtime} min</span>}
            {((movie.release_year || movie.runtime != null) && movie.title_type) && <span>•</span>}
            {movie.title_type && <span className="capitalize">{movie.title_type.replace(/([A-Z])/g, ' $1').trim()}</span>}
          </div>
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
              {movie.genres.map((genre) => (
                <span key={genre} className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-full font-medium transition-colors">
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border/50 flex flex-col gap-2 text-sm text-muted-foreground mt-4">
             {movie.votes != null && (
               <div className="flex justify-between items-center">
                 <span className="font-medium">Total Votes</span>
                 <span className="font-semibold text-foreground bg-muted px-2 py-1 rounded-md">{movie.votes.toLocaleString()}</span>
               </div>
             )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
