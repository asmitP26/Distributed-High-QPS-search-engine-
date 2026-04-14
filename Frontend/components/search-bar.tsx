"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export function SearchBar({ query, onQueryChange, onSearch }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for movies..."
          className="w-full pl-12 pr-32 py-4 rounded-full glass text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
        />
        <Button
          type="submit"
          className="absolute right-2 rounded-full px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-105"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
