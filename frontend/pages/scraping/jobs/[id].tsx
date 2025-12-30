import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  RotateCw,
  AlertCircle,
  Code,
  Globe
} from 'lucide-react';

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  useEffect(() => {
    if (autoRefresh && job?.state === 'active') {
      const interval = setInterval(fetchJobDetails, 2000); // Refresh every 2s
      return () => clearInterval(interval);
    }
  }, [autoRefresh, job?.state]);

  const fetchJobDetails = async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/scraping-queue/jobs/${id}`);
      const data = await res.json();
      setJob(data);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      await fetch(`/api/scraping-queue/jobs/${id}`, { method: 'DELETE' });
      router.push('/scraping/jobs');
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job');
    }
  };

  const handleRetry = async () => {
    try {
      await fetch(`/api/scraping-queue/jobs/${id}/retry`, { method: 'POST' });
      fetchJobDetails();
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
        return <CheckCircle className="w-5 h-5" />;
      case 'active':
        return <Activity className="w-5 h-5 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'waiting':
        return <Clock className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">Job not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Job #{id} - Scraping Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to jobs
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
              <p className="text-gray-600 mt-1">ID: {id}</p>
            </div>

            <div className="flex items-center gap-3">
              {job.state === 'active' && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Auto-refresh
                </label>
              )}

              <button
                onClick={fetchJobDetails}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {job.state === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <RotateCw className="w-4 h-4" />
                  Retry
                </button>
              )}

              {(job.state === 'waiting' || job.state === 'active') && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`px-4 py-2 rounded-full border inline-flex items-center gap-2 ${getStateColor(job.state)}`}>
              {getStateIcon(job.state)}
              <span className="font-medium capitalize">{job.state}</span>
            </div>

            {job.state === 'active' && (
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {job.state === 'active' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-gray-900">{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Provider</p>
              <p className="font-medium text-gray-900">{job.data.provider || 'auto'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">URLs Count</p>
              <p className="font-medium text-gray-900">{job.data.urls?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Created At</p>
              <p className="font-medium text-gray-900">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Failed Reason */}
          {job.failedReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{job.failedReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* URLs List */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              URLs ({job.data.urls?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {job.data.urls?.map((url: string, index: number) => (
              <div key={index} className="px-6 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex-1 truncate"
                  >
                    {url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {job.results && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Results
              </h2>
            </div>
            <div className="p-6">
              {job.results.success !== undefined ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total URLs</p>
                      <p className="text-2xl font-bold text-gray-900">{job.results.totalUrls || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Successful</p>
                      <p className="text-2xl font-bold text-green-600">{job.results.successfulUrls || 0}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{job.results.failedUrls || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {job.results.totalUrls > 0
                          ? Math.round((job.results.successfulUrls / job.results.totalUrls) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Raw Data:</p>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(job.results, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(job.results, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
