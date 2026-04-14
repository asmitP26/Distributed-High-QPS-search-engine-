"use client";

import { SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GENRES = [
  "All Genres",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
];

const YEARS = Array.from({ length: 26 }, (_, i) => (2025 - i).toString());

const CONTENT_TYPES = [
  "All Types",
  "Movies",
  "TV Shows",
  "Documentary",
  "Series",
];

interface FilterPanelProps {
  genre: string;
  minRating: number;
  year: string;
  contentType: string;
  onGenreChange: (genre: string) => void;
  onRatingChange: (rating: number) => void;
  onYearChange: (year: string) => void;
  onContentTypeChange: (contentType: string) => void;
}

export function FilterPanel({
  genre,
  minRating,
  year,
  contentType,
  onGenreChange,
  onRatingChange,
  onYearChange,
  onContentTypeChange,
}: FilterPanelProps) {
  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <SlidersHorizontal className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Genre</label>
          <Select value={genre} onValueChange={onGenreChange}>
            <SelectTrigger className="w-full glass border-border/50 text-foreground">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {GENRES.map((g) => (
                <SelectItem key={g} value={g} className="text-popover-foreground">
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Min Rating</label>
            <span className="text-sm font-semibold text-primary">
              {minRating.toFixed(1)} &#9733;
            </span>
          </div>
          <Slider
            value={[minRating]}
            onValueChange={(value) => onRatingChange(value[0])}
            min={1}
            max={10}
            step={0.5}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Year</label>
          <Select value={year} onValueChange={onYearChange}>
            <SelectTrigger className="w-full glass border-border/50 text-foreground">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              <SelectItem value="all" className="text-popover-foreground">
                All Years
              </SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="text-popover-foreground">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Content Type</label>
          <Select value={contentType} onValueChange={onContentTypeChange}>
            <SelectTrigger className="w-full glass border-border/50 text-foreground">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {CONTENT_TYPES.map((ct) => (
                <SelectItem key={ct} value={ct} className="text-popover-foreground">
                  {ct}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
