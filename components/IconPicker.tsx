import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  // Dynamically get all valid icon names from the library
  const allIconNames = useMemo(() => {
    // Get all keys from the module
    const keys = Object.keys(LucideIcons);
    
    return keys.filter(key => {
      // Filter logic:
      // 1. Must start with uppercase (React component convention)
      // 2. Must not be 'createLucideIcon' or 'default'
      // 3. We exclude specific internal properties if they leak through
      return (
        /^[A-Z]/.test(key) && 
        key !== 'createLucideIcon' && 
        key !== 'default'
      );
    });
  }, []);

  if (!isOpen) return null;

  const filteredIcons = allIconNames.filter(name => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Limit display for performance, but show count
  const DISPLAY_LIMIT = 200;
  const displayIcons = filteredIcons.slice(0, DISPLAY_LIMIT);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Select Icon</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-white">
           <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${allIconNames.length} icons...`}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-[300px]">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {displayIcons.map(name => {
              // Safe dynamic access
              // @ts-ignore
              const IconComp = LucideIcons[name];
              
              if (!IconComp) return null;

              return (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all gap-2 h-20 shadow-sm hover:shadow-md"
                  title={name}
                >
                  <IconComp size={24} strokeWidth={1.5} />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center leading-tight">{name}</span>
                </button>
              );
            })}
            
            {filteredIcons.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-10 flex flex-col items-center">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p>No icons found for "{search}"</p>
                </div>
            )}

            {filteredIcons.length > DISPLAY_LIMIT && (
               <div className="col-span-full py-4 text-center text-slate-400 text-xs italic">
                  And {filteredIcons.length - DISPLAY_LIMIT} more... refine your search.
               </div>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
            {filteredIcons.length} icons available
        </div>
      </div>
    </div>
  );
};