import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { toggleSavedItem, isItemSaved } from '../utils/savedStore';
import api, { getCategories } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Heart,
  X,
  Plus,
  ArrowUpDown,
  Tag,
  Package,
  Repeat
} from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import UniversalLoader from '../components/common/UniversalLoader';
import { getSafeImageUrl } from '../utils/imageUrl';
import ListingCard from '../components/product/ListingCard';
import BannerSlideshow from '../components/home/BannerSlideshow';
import CategoryScrollBar from '../components/home/CategoryScrollBar';
import { TRANSACTION_FILTERS, SORT_OPTIONS } from '../constants/listingConfig';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'ALL');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [transactionType, setTransactionType] = useState(() => searchParams.get('transaction_type') || 'ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState({});

  // Current User Profile & Role from Centralized AuthContext
  const { user: userProfile, isSeller, isBuyer } = useAuth();

  // Sync state when URL params change (guarded against redundant state updates)
  useEffect(() => {
    const cat = searchParams.get('category') || 'ALL';
    const tType = searchParams.get('transaction_type') || 'ALL';
    const q = searchParams.get('search') || '';
    setSelectedCategory((prev) => (prev !== cat ? cat : prev));
    setTransactionType((prev) => (prev !== tType ? tType : prev));
    setSearchQuery((prev) => (prev !== q ? q : prev));
  }, [searchParams]);

  // Fetch Categories (cached)
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        if (isMounted) setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Listings with Filters & AbortController to cancel stale in-flight requests
  const fetchListings = async (signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (transactionType && transactionType !== 'ALL') {
        params.append('transaction_type', transactionType);
      }
      if (conditionFilter && conditionFilter !== 'ALL') {
        params.append('condition', conditionFilter);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const response = await api.get(
        `/marketplace/listings/?${params.toString()}`,
        { signal }
      );
      setListings(response.data);
      setError(null);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return; // Silently ignore cancelled requests
      }
      console.error('Failed to fetch listings', err);
      setError('Unable to load listings. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchListings(controller.signal);
    return () => {
      controller.abort();
    };
  }, [selectedCategory, transactionType, conditionFilter, sortBy, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'ALL') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
  };

  const handleTransactionTypeChange = (newType) => {
    setTransactionType(newType);
    const newParams = new URLSearchParams(searchParams);
    if (newType === 'ALL') {
      newParams.delete('transaction_type');
    } else {
      newParams.set('transaction_type', newType);
    }
    setSearchParams(newParams);
  };

  const toggleFavorite = (e, listing) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleSavedItem(listing);
    setFavorites((prev) => ({ ...prev, [listing.id]: res.isSaved }));
    if (res.isSaved) {
      toast.success(`Saved to your wishlist!`, { icon: '❤️' });
    } else {
      toast.success('Removed from saved items.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'RECENT';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'TODAY';
    if (diffDays === 2) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] w-full">
      {/* Category Pills Bar - Sticky with Navbar, Horizontal Scrollable */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-2xs relative">
        <div className="w-full px-4 sm:px-6 lg:px-[5%] py-2.5 sm:py-3 relative">
          <CategoryScrollBar>
            <button
              onClick={() => handleCategoryClick('ALL')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${selectedCategory === 'ALL'
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
                }`}
            >
              <span>All Categories</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
                    }`}
                >
                  <CategoryIcon
                    name={cat.icon}
                    slug={cat.slug}
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </CategoryScrollBar>
        </div>
      </div>

      {/* Hero Banner Slideshow (Positioned directly below categories bar) */}
      <BannerSlideshow />

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-[5%] py-4 sm:py-6">

        {/* Controls Row: Title, Filters & Sorting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {searchQuery ? (
                <>
                  <span className="truncate max-w-[200px] sm:max-w-none">Results for &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={handleClearSearch}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 sm:py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="Clear search filter"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </>
              ) : selectedCategory === 'ALL'
                ? 'Campus Marketplace Recommendations'
                : categories.find((c) => c.slug === selectedCategory)?.name || 'Listings'}
            </h1>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
              {listings.length} {listings.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2.5 w-full md:w-auto">
            {/* Transaction Mode Filter */}
            <select
              value={transactionType}
              onChange={(e) => handleTransactionTypeChange(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-[11px] sm:text-xs font-medium rounded-md px-1.5 sm:px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs truncate cursor-pointer"
            >
              {TRANSACTION_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-[11px] sm:text-xs font-medium rounded-md px-1.5 sm:px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs truncate cursor-pointer"
            >
              <option value="ALL">All Conditions</option>
              <option value="NEW">Brand New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">For Parts</option>
            </select>

            {/* Sorting Dropdown */}
            <div className="w-full sm:w-auto flex items-center bg-white border border-gray-200 rounded-md px-1.5 sm:px-2.5 py-2 shadow-2xs">
              <ArrowUpDown className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-gray-700 text-[11px] sm:text-xs font-medium outline-none cursor-pointer truncate"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-12">
            <UniversalLoader text="Loading items..." />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-md border border-red-200 p-6 shadow-sm">
            <p className="text-red-600 font-bold text-sm mb-3">{error}</p>
            <button
              onClick={fetchListings}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold py-2 px-4 rounded-md transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-md shadow-sm border border-gray-200 p-8 space-y-3">
            <Tag className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">
              {searchQuery ? `No results found for "${searchQuery}"` : 'No matching items found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try checking for spelling errors, broader keywords, or clear the search filter.'
                : isSeller
                ? 'Try adjusting your filters, or be the first student to post this item!'
                : 'Try adjusting your filters, or explore other categories to find what you need.'}
            </p>
            {searchQuery && (
              <div className="pt-1">
                <button
                  onClick={handleClearSearch}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Search Filter
                </button>
              </div>
            )}
            {(selectedCategory !== 'ALL' || transactionType !== 'ALL' || conditionFilter !== 'ALL') && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setTransactionType('ALL');
                    setConditionFilter('ALL');
                    setSearchQuery('');
                    setSearchParams(new URLSearchParams());
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            )}
            {/* Sell button is strictly for verified Sellers - NEVER shown to Buyers */}
            {isSeller ? (
              <div className="pt-2">
                <Link
                  to="/sell"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-6 rounded-md text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Sell an Item
                </Link>
              </div>
            ) : !userProfile && !localStorage.getItem('access') ? (
              <div className="pt-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-6 rounded-md text-xs inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  Login to Sell
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 md:gap-6 animate-fade-in-up">
            {listings.map((listing) => {
              const isFav = favorites[listing.id] !== undefined ? favorites[listing.id] : isItemSaved(listing.id);
              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={isFav}
                  onToggleFavorite={toggleFavorite}
                  formatDate={formatDate}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
