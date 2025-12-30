import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  Loader2
} from 'lucide-react';

export default function ScrapingDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch queue stats
      const statsRes = await fetch('/api/scraping-queue/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent jobs
      const jobsRes = await fetch('/api/scraping-queue/jobs?limit=10');
      const jobsData = await jobsRes.json();
      setRecentJobs(jobsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Scraping Dashboard - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraping Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Gestion centralisée des jobs de scraping avec BullMQ
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/scraping/jobs/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Job
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Waiting</p>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.waiting || 0}</p>
            <p className="text-xs text-gray-500 mt-1">In queue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.active || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Processing now</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.completed || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Success</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.failed || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Errors</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.completed && (stats.completed + stats.failed) > 0
                ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Overall</p>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
              <button
                onClick={() => router.push('/scraping/jobs')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {recentJobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No jobs yet. Create your first scraping job!</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/scraping/jobs/${job.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStateColor(job.state)}`}>
                        {getStateIcon(job.state)}
                        <span className="text-sm font-medium capitalize">{job.state}</span>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {job.data.urls?.length || 0} URL{job.data.urls?.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          Provider: <span className="font-medium">{job.data.provider || 'auto'}</span>
                        </p>
                      </div>

                      {job.state === 'active' && (
                        <div className="w-48">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs font-medium text-gray-900">{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/scraping/jobs')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Activity className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View All Jobs</h3>
            <p className="text-sm text-gray-600">Browse complete job history with filters</p>
          </button>

          <button
            onClick={() => router.push('/scraping/providers')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Providers Config</h3>
            <p className="text-sm text-gray-600">Configure and test scraping providers</p>
          </button>

          <button
            onClick={() => router.push('/settings/providers')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Unified Settings</h3>
            <p className="text-sm text-gray-600">Manage all providers in one place</p>
          </button>
        </div>
      </div>
    </>
  );
}
