import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface SearchFiltersProps {
  filters: {
    category: string;
    location: string;
  };
  onFiltersChange: (filters: { category: string; location: string }) => void;
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category === "all" ? "" : category });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, location: e.target.value });
  };

  const clearFilters = () => {
    onFiltersChange({ category: "", location: "" });
  };

  return (
    <div className="lg:w-1/4">
      <Card className="sticky top-24" data-testid="filters-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="filters-title">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Category</label>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Solo">Solo Performers</SelectItem>
                <SelectItem value="Couples">Couples Content</SelectItem>
                <SelectItem value="Fetish">Fetish & BDSM</SelectItem>
                <SelectItem value="Cam Shows">Cam Shows</SelectItem>
                <SelectItem value="Alternative">Alternative Style</SelectItem>
                <SelectItem value="Luxury">Luxury Content</SelectItem>
                <SelectItem value="Amateur">Amateur/GND</SelectItem>
                <SelectItem value="Ethnic">Ethnic Performers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Location</label>
            <Input
              type="text"
              placeholder="Enter location"
              value={filters.location}
              onChange={handleLocationChange}
              data-testid="input-location-filter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Rating</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer" data-testid="checkbox-rating-45">
                <Checkbox id="rating-45" />
                <span className="text-sm">4.5+ stars</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer" data-testid="checkbox-rating-40">
                <Checkbox id="rating-40" />
                <span className="text-sm">4.0+ stars</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer" data-testid="checkbox-rating-35">
                <Checkbox id="rating-35" />
                <span className="text-sm">3.5+ stars</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Availability</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer" data-testid="checkbox-available">
                <Checkbox id="available" />
                <span className="text-sm">Online now</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer" data-testid="checkbox-featured">
                <Checkbox id="featured" />
                <span className="text-sm">Verified models</span>
              </label>
            </div>
          </div>

          {(filters.category || filters.location) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
