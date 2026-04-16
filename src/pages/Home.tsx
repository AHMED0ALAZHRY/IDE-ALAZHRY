import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter } from 'lucide-react';
import { useMonuments } from '../hooks/useMonuments';

const CATEGORIES = ['الكل', 'إسلامي', 'فرعوني', 'قبطي', 'روماني'];
const LOCATIONS = ['الكل', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الأقصر', 'أسوان'];

export default function Home() {
  const navigate = useNavigate();
  const { monuments, loading } = useMonuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedLocation, setSelectedLocation] = useState('الكل');

  const filteredMonuments = monuments.filter(monument => {
    const matchesSearch = monument.name.includes(searchQuery) || monument.location.includes(searchQuery);
    const matchesCategory = selectedCategory === 'الكل' || monument.type === selectedCategory;
    const matchesLocation = selectedLocation === 'الكل' || monument.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="pb-20 min-h-screen bg-ivory-white">
      {/* Header */}
      <header className="bg-nile-blue text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">مرحباً بك في فكرة أثر</h1>
            <p className="text-sm text-gray-300 mt-1">اكتشف تاريخ مصر العظيم</p>
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-royal-gold/20">
            <img src="/logo.png" alt="شعار فكرة أثر" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن معلم أثري..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-gray-800 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-royal-gold shadow-md"
          />
          <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
        </div>
      </header>

      <main className="p-4">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <Filter size={16} />
              التصنيف
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-royal-gold text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              المحافظة
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {LOCATIONS.map(location => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedLocation === location
                      ? 'bg-nile-blue text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monuments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-royal-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">جاري تحميل المعالم...</p>
            </div>
          ) : filteredMonuments.length > 0 ? (
            filteredMonuments.map(monument => (
              <div
                key={monument.id}
                onClick={() => navigate(`/monument/${monument.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={monument.imageUrl}
                    alt={monument.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-nile-blue">
                    {monument.type}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-nile-blue mb-1">{monument.name}</h2>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin size={14} className="ml-1" />
                    {monument.location}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              لا توجد معالم مطابقة لبحثك
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
