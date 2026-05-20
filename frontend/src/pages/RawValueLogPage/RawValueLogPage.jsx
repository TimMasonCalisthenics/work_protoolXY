import React, { useState, useEffect } from 'react';
import { rawValueLogService } from '../../services/rawValueLogService';
import { toast } from 'react-toastify';
import { HiOutlineRefresh, HiOutlineSearch, HiOutlineTrash, HiOutlineCog } from 'react-icons/hi';
import { getDebugMode, updateDebugMode } from '../../services/settingService';

const RawValueLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    measurement_id: '',
    spec_point_id: '',
    point_name: '',
    sensor_device_id: ''
  });
  const [isDebugMode, setIsDebugMode] = useState(false);

  const fetchLogs = async (page = pagination.page) => {
    try {
      setLoading(true);
      const data = await rawValueLogService.getLogs({
        page,
        limit: pagination.limit,
        ...(filters.measurement_id && { measurement_id: filters.measurement_id }),
        ...(filters.spec_point_id && { spec_point_id: filters.spec_point_id }),
        ...(filters.point_name && { point_name: filters.point_name }),
        ...(filters.sensor_device_id && { sensor_device_id: filters.sensor_device_id })
      });
      
      if (data.data) {
        setLogs(data.data.items || []);
        setPagination(prev => ({
          ...prev,
          page: data.data.page,
          total: data.data.total
        }));
      }
      
      // Also fetch debug mode status
      const debugData = await getDebugMode();
      setIsDebugMode(debugData.data.is_debug_mode);
      
    } catch (error) {
      toast.error(error.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchLogs(newPage);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear ALL raw value logs? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await rawValueLogService.clearLogs();
      toast.success('All raw value logs cleared successfully');
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchLogs(1);
    } catch (error) {
      toast.error('Failed to clear logs');
      setLoading(false);
    }
  };

  const toggleDebugMode = async () => {
    try {
      const newMode = !isDebugMode;
      await updateDebugMode(newMode);
      setIsDebugMode(newMode);
      toast.success(`Debug mode ${newMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update debug mode');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 0) return null;
    return (
      <div className="p-4 border-t border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center px-3 text-gray-700 dark:text-gray-300">
            Page {pagination.page} of {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raw Value Logs</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleDebugMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDebugMode 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <HiOutlineCog className={isDebugMode ? 'animate-spin-slow' : ''} />
                {isDebugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
              </button>
              <button
                onClick={handleClearLogs}
                disabled={loading || logs.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                <HiOutlineTrash />
                Clear Logs
              </button>
              <button
                onClick={() => fetchLogs()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <HiOutlineRefresh className={`${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement ID</label>
              <input
                type="number"
                name="measurement_id"
                value={filters.measurement_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="All"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spec Point ID</label>
              <input
                type="number"
                name="spec_point_id"
                value={filters.spec_point_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="All"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Point Name</label>
              <input
                type="text"
                name="point_name"
                value={filters.point_name}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="All"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sensor Device ID</label>
              <input
                type="text"
                name="sensor_device_id"
                value={filters.sensor_device_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="All"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <HiOutlineSearch />
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Pagination Top */}
        {renderPagination()}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="p-4">ID</th>
                <th className="p-4">Measurement ID</th>
                <th className="p-4">Spec Point ID</th>
                <th className="p-4">Point Name</th>
                <th className="p-4">Sensor Device ID</th>
                <th className="p-4">Raw Value</th>
                <th className="p-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-900 dark:text-white font-medium">#{log.id}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{log.measurement_id}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{log.spec_point_id}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{log.point_name || '-'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {log.sensor_device_id}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white font-mono">{log.raw_value}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bottom */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default RawValueLogPage;
