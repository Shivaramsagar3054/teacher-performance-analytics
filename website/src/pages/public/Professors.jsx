import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { teachersApi, getImageUrl } from '../../services/api';

export function Professors() {
  const [activeCategory, setActiveCategory] = useState('All Professors');
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      department: activeCategory === 'All Professors' ? '' : activeCategory,
      search: searchQuery
    };

    teachersApi.getAll(params)
      .then(data => {
        if (data && data.results) {
          setProfessors(data.results);
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 10)); // 10 is the backend PAGE_SIZE
        } else {
          setProfessors(Array.isArray(data) ? data : []);
          setTotalCount(Array.isArray(data) ? data.length : 0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch teachers', err);
        setLoading(false);
      });
  }, [currentPage, activeCategory, searchQuery]);


  const categories = ['All Professors', ...new Set(professors.map(p => p.department))];

  // Backend handles filtering and search now
  const filteredProfessors = professors;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Section */}
      <div className="mb-12 max-w-2xl">
        <p className="text-secondary font-bold tracking-wider text-sm mb-3 uppercase">OUR PROFESSORS</p>
        <h1 className="text-5xl font-bold text-primary-dark mb-4 font-serif">Learn From The Best</h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Our distinguished faculty members bring years of experience, industry expertise, and a passion for teaching.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === cat 
                  ? 'bg-primary-dark text-white border-primary-dark' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center bg-white rounded-lg px-4 py-2 w-full lg:w-72 border border-slate-200 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Professor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none ml-3 w-full text-sm"
          />
        </div>
      </div>

      {/* Professors Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredProfessors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredProfessors.map((prof) => (
          <Card key={prof.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col h-full rounded-2xl">
            <div className="h-64 relative overflow-hidden bg-slate-100">
              <img 
                src={getImageUrl(prof.profile_image)} 
                alt={`${prof.first_name} ${prof.last_name}`} 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-4 right-4 bg-[#0a66c2] px-2 py-0.5 rounded text-white shadow-sm flex items-center justify-center">
                <span className="font-bold text-sm leading-none tracking-tighter">in</span>
              </div>
            </div>
            
            <CardContent className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{`Dr. ${prof.first_name} ${prof.last_name}`}</h3>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-primary font-medium text-sm">{prof.department}</p>
                {prof.avg_pass_percentage > 0 && (
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                    <TrendingUp className="w-3 h-3" /> {prof.avg_pass_percentage}% Pass
                  </span>
                )}
              </div>
              
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                {prof.biography}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                <button className="flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </button>
                <Link to={`/professors/${prof.id}`} className="flex items-center text-sm font-bold text-primary-dark hover:text-primary transition-colors">
                  View Profile
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No professors found matching your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                    currentPage === i + 1
                      ? 'bg-primary-dark text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{professors.length}</span> of <span className="text-slate-900 font-bold">{totalCount}</span> Professors
          </p>
        </div>
      )}
    </div>
  );
}
