import React, { useState, useEffect } from 'react';
import { Search, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface ImagePickerProps {
  initialQuery: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  unsplashAccessKey: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ 
  initialQuery, 
  isOpen, 
  onClose, 
  onSelect,
  unsplashAccessKey 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Fallback if no key provided
    if (!unsplashAccessKey) {
        setError("Please enter an Unsplash Access Key in the settings to search.");
        setImages([]);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(searchQuery)}&per_page=20&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid Access Key");
        if (response.status === 403) throw new Error("Rate Limit Exceeded");
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      setImages(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-blue-600" />
            Select Image
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search Unsplash..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 min-h-[300px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <AlertCircle size={32} className="text-red-400" />
              <p>{error}</p>
              {!unsplashAccessKey && (
                  <p className="text-xs text-slate-400">Add your key using the settings icon in the top bar.</p>
              )}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <button 
                  key={img.id}
                  onClick={() => onSelect(img.urls.regular)}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all shadow-sm"
                >
                  <img 
                    src={img.urls.small} 
                    alt={img.alt_description} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 opacity-0 group-hover:opacity-100 truncate">
                    by {img.user.name}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               {loading ? <Loader2 className="animate-spin text-blue-500" size={32}/> : <p>Search for something to see results.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
