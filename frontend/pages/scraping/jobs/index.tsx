import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  RotateCw,
  Eye
} from 'lucide-react';

export default function ScrapingJobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    limit: 50,
  });

  useEffect(() => {
    fetchJobs();
  }, [filters.status, filters.limit]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const res = await fetch(`/api/scraping-queue/jobs?${params}`);
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      await fetch(`/api/scraping-queue/jobs/${jobId}`, { method: 'DELETE' });
      fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch(`/api/scraping-queue/jobs/${jobId}/retry`, { method: 'POST' });
      fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert('Failed to retry job');
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'waiting':
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const filteredJobs = jobs.filter((job) =>
    filters.search
      ? job.data.urls?.some((url: string) => url.toLowerCase().includes(filters.search.toLowerCase()))
      : true
  );

  return (
    <>
      <Head>
        <title>Scraping Jobs - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scraping Jobs</h1>
          <p className="text-gray-600 mt-1">Complete job history with advanced filters</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Status</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Limit */}
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 jobs</option>
              <option value={25}>25 jobs</option>
              <option value={50}>50 jobs</option>
              <option value={100}>100 jobs</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URLs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading jobs...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No jobs found
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`px-3 py-1 rounded-full border inline-flex items-center gap-2 ${getStateColor(job.state)}`}>
                          {getStateIcon(job.state)}
                          <span className="text-sm font-medium capitalize">{job.state}</span>
                        </div>
                      </td>

                      {/* URLs */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {job.data.urls?.length || 0} URL{job.data.urls?.length > 1 ? 's' : ''}
                        </div>
                        {job.data.urls?.[0] && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {job.data.urls[0]}
                          </div>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {job.data.provider || 'auto'}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {job.state === 'active' ? (
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-900">{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : job.state === 'completed' ? (
                          <span className="text-sm text-green-600 font-medium">100%</span>
                        ) : job.state === 'failed' ? (
                          <span className="text-sm text-red-600 font-medium">Failed</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs">{new Date(job.createdAt).toLocaleTimeString()}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/scraping/jobs/${job.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {job.state === 'failed' && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="Retry"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                          )}

                          {(job.state === 'waiting' || job.state === 'active') && (
                            <button
                              onClick={() => handleCancelJob(job.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>
    </>
  );
}
