import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FolderKanban,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Loader2,
  AlertCircle,
  Trash2,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import ReportCard from '../components/dashboard/ReportCard';
import apiClient from '../api/apiClient';

export default function MyReports() {
  const navigate = useNavigate();

  // Data state
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    averageScore: 0,
    technicalQuestionsGenerated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete modal state
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reports with server-side filters & pagination
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: sortOption,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiClient.get('/interviews', { params });

      if (response.data?.success) {
        setReports(response.data.data || []);
        setTotalRecords(response.data.total ?? response.data.data?.length ?? 0);
        setTotalPages(response.data.totalPages ?? 1);
      } else {
        setError('Failed to retrieve reports.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Network error encountered while loading interview plans.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortOption, statusFilter, searchTerm]);

  // Fetch aggregated statistics
  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/interviews/stats');
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      // Non-blocking fallback for stats
      console.warn('Could not load interview stats:', err.message);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle Search input change with page reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  // Delete report handler
  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    const reportId = reportToDelete._id || reportToDelete.id;

    try {
      const response = await apiClient.delete(`/interviews/${reportId}`);

      if (response.data?.success) {
        toast.success(`Deleted plan for "${reportToDelete.jobTitle}"`);
        setReportToDelete(null);
        // Refresh list and stats
        fetchReports();
        fetchStats();
      } else {
        toast.error('Failed to delete report.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not delete report.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortOption('newest');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.1),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation Header */}
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
        {/* Page Title & Main Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Interview History & Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Interview Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse, filter, search, and manage all your customized interview preparation plans.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Plan</span>
            </Link>
          </div>
        </div>

        {/* Database Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Plans
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalPlans}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Generated strategies</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
              Completed
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {stats.completedPlans}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Ready for practice</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
              Average Match
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
              {stats.averageScore}%
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Profile alignment</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 block mb-1">
              Questions Synthesized
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-violet-400">
              {stats.technicalQuestionsGenerated}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Technical questions</span>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by job title or company..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="status-select" className="sr-only">Filter by status</label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={handleStatusChange}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900">All Statuses</option>
                <option value="completed" className="bg-slate-900">Completed</option>
                <option value="processing" className="bg-slate-900">Processing</option>
                <option value="failed" className="bg-slate-900">Failed</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="sort-select" className="sr-only">Sort reports</label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={handleSortChange}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer pr-2"
              >
                <option value="newest" className="bg-slate-900">Newest First</option>
                <option value="oldest" className="bg-slate-900">Oldest First</option>
                <option value="score_desc" className="bg-slate-900">Highest Score</option>
                <option value="score_asc" className="bg-slate-900">Lowest Score</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchReports}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Refresh reports list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Listing Section */}
        {isLoading ? (
          /* Loading State: Skeleton Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-slate-800 rounded w-2/3" />
                  <div className="h-6 bg-slate-800 rounded-xl w-16" />
                </div>
                <div className="h-3 bg-slate-800/60 rounded w-1/3" />
                <div className="h-10 bg-slate-800/40 rounded w-full mt-3" />
                <div className="pt-4 border-t border-slate-800/60 flex justify-between">
                  <div className="h-3 bg-slate-800/60 rounded w-20" />
                  <div className="h-3 bg-slate-800/60 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/20 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Failed to Load Reports</h2>
            <p className="text-xs text-rose-300 mb-5 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={fetchReports}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : reports.length > 0 ? (
          /* Reports Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reports.map((report) => (
                <ReportCard
                  key={report._id || report.id}
                  report={report}
                  onDelete={(rep) => setReportToDelete(rep)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
                <span>
                  Showing{' '}
                  <strong className="text-slate-200">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-200">
                    {Math.min(currentPage * pageSize, totalRecords)}
                  </strong>{' '}
                  of <strong className="text-slate-200">{totalRecords}</strong> interview plans
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 hover:text-white transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((pageNum, idx, arr) => {
                      const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                      const isCurrent = pageNum === currentPage;

                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-semibold transition-all ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 hover:text-white transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : searchTerm || statusFilter !== 'all' ? (
          /* Empty Search / Filter Results State */
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">No matching plans found</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              No interview plans matched your search term &quot;{searchTerm}&quot; or status filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Empty Initial State: No Reports Created Yet */
          <div className="p-12 sm:p-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center max-w-lg mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No interview plans created yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Start by pasting a job description and uploading your resume. HireNex will formulate
              a targeted 7-day preparation roadmap with technical and behavioral questions.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Interview Plan</span>
            </Link>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal Dialog */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              Delete Interview Plan?
            </h3>

            <p className="text-xs text-slate-400 text-center leading-relaxed mb-6">
              Are you sure you want to delete the plan for{' '}
              <strong className="text-slate-200">{reportToDelete.jobTitle}</strong>
              {reportToDelete.companyName ? ` at ${reportToDelete.companyName}` : ''}? This action
              cannot be undone and will permanently remove all 15 technical questions, STAR
              scenarios, and the 7-day roadmap.
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
