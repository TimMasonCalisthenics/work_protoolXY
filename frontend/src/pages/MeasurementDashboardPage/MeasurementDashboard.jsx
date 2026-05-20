import { useState, useEffect } from "react";
import {
  getMeasurements,
  getMeasurementById,
  exportMeasurementsCsv,
} from "@services/measurementService";
import { showSuccess, showError, showWarning } from "@utils/toast";
export default function MeasurementDashboard() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const statusStyleMap = {
    completed: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    draft: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    cancel: "bg-red-500/20 text-red-500 border-red-500/30",
  };
  const resultStyleMap = {
    OK: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    NG: "bg-red-500/20 text-red-500 border-red-500/30",
  };

  const fetchMeasurements = async () => {
    setLoading(true);
    try {
      const data = await getMeasurements(
        page,
        limit,
        searchTerm,
        searchResult,
        startDate,
        endDate,
      );
      if (data.data && data.data.measurements) {
        setMeasurements(data.data.measurements);
        setTotal(data.data.total_count);
      } else {
        setMeasurements(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      showError(err.message || "Failed to Get measurements");
      setError(err.message || "Failed to Get measurements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchMeasurements();
  }, [page, limit, debouncedSearchTerm, searchResult, startDate, endDate]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const handleSearchResult = (e) => {
    console.log(e.target.value);
    setSearchResult(e.target.value);
    setPage(1);
  };

  const handleViewDetail = async (id, product_name) => {
    setDetailLoading(true);
    try {
      const result = await getMeasurementById(id);
      const data = result.data || result;
      setSelectedMeasurement({
        ...data,
        product_name: product_name,
      });

      setShowDetailModal(true);
    } catch (err) {
      alert("Failed to Get details: " + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const blob = await exportMeasurementsCsv(searchTerm, searchResult, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `measurements_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-page p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              Measurement History
            </h1>
            <p className="text-secondary">Track your measurement results</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading || loading}
            // className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            className="px-4 py-2.5 btn-primary text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            {exportLoading ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search & Date Filters */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end">
          {/* Left Section: Search & Result Filter (7/12) */}
          <div className="xl:col-span-7 flex flex-col md:flex-row gap-4">
            {/* Search Bar - ปรับให้ใหญ่ขึ้น */}
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-2 ml-1">
                Search Serial Number
              </label>
              <div className="glass-card rounded-2xl px-5 h-14 flex items-center space-x-4 focus-within:ring-2 focus-within:ring-accent/50 transition-all shadow-lg">
                <svg
                  className="w-6 h-6 text-secondary shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Enter serial..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="flex-1 bg-transparent border-none text-primary placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-base font-medium"
                />
              </div>
            </div>

            {/* Filter Result - ปรับความกว้างและขนาดตัวอักษร */}
            <div className="flex-1 md:max-w-[200px]">
              <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-2 ml-1">
                Final Result
              </label>
              <div className="relative">
                <select
                  value={searchResult}
                  onChange={handleSearchResult}
                  className="glass-card w-full h-14 px-5 rounded-2xl border-none text-primary focus:outline-none text-base font-bold appearance-none cursor-pointer shadow-lg"
                >
                  <option value="" className="bg-card">
                    All Status
                  </option>
                  <option value="OK" className="bg-card text-emerald-500">
                    OK
                  </option>
                  <option value="NG" className="bg-card text-red-500">
                    NG
                  </option>
                </select>
                {/* Custom Arrow สำหรับ Select */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Date Picker (5/12) - ปรับให้ใหญ่ล้อไปกับด้านซ้าย */}
          <div className="xl:col-span-5">
            <div className="glass-card p-3 rounded-2xl border border-white/10 shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1.5 ml-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-black/5 dark:bg-white/5 text-primary rounded-xl px-3 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1.5 ml-1">
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full bg-black/5 dark:bg-white/5 text-primary rounded-xl px-3 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Button - ปรับให้เด่นขึ้นถ้ามีการเลือกวันที่ */}
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                  className="w-full mt-2 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded-lg font-bold transition-colors"
                >
                  Clear Date Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Measurements Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : measurements.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                No measurements found.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Serial A
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Serial B
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">
                      Final Result
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {measurements.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        #{m.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary text-center">
                        {m.serial_a}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary text-center">
                        {m.serial_b}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary text-center">
                        {m.product_name || `Product ID: ${m.product_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusStyleMap[m.status] ||
                            "bg-gray-500/20 text-gray-500 border-gray-500/30"
                            }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary text-center">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${resultStyleMap[m.final_result] ||
                            "bg-gray-500/20 text-gray-500 border-gray-500/30"
                            }`}
                        >
                          {m.final_result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleViewDetail(m.id, m.product_name)}
                          disabled={detailLoading}
                          className="text-accent hover:text-purple-600 dark:hover:text-purple-300 transition duration-150"
                          title="View Details"
                        >
                          <svg
                            className="w-5 h-5 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-black/5 dark:bg-white/5 border-t border-border-color flex items-center justify-between">
            <div className="text-sm text-secondary">
              Showing{" "}
              <span className="font-semibold text-primary">
                {measurements.length}
              </span>{" "}
              of <span className="font-semibold text-primary">{total}</span>{" "}
              measurements
              {totalPages > 0 && (
                <span className="hidden sm:inline">
                  {" "}
                  (Page {page} of {totalPages})
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMeasurement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-color flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div>
                <h2 className="text-2xl font-bold text-primary">
                  Measurement Detail
                </h2>
                <p className="text-sm text-secondary">
                  ID: #{selectedMeasurement.id}•{" "}
                  {selectedMeasurement.product_name ||
                    `Product ID: ${selectedMeasurement.product_id}`}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-secondary"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Serial A
                  </label>
                  <p className="text-lg font-bold text-primary">
                    {selectedMeasurement.serial_a || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Serial B
                  </label>
                  <p className="text-lg font-bold text-primary">
                    {selectedMeasurement.serial_b || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Final Result
                  </label>
                  <div className="pt-1">
                    <span
                      className={`px-3 py-1 text-sm font-bold rounded-full border
                    ${resultStyleMap[selectedMeasurement.final_result] || "bg-gray-500/20 text-gray-500 border-gray-500/30"}`}
                    >
                      {selectedMeasurement.final_result || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Measurement Points Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">
                  Measurement Details
                </h3>
                <div className="glass-card rounded-xl overflow-hidden border border-border-color">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-secondary">
                          Point Name
                        </th>
                        <th className="px-4 py-3 font-semibold text-secondary text-right">
                          Nominal
                        </th>
                        <th className="px-4 py-3 font-semibold text-secondary text-right">
                          Condition
                        </th>
                        <th className="px-4 py-3 font-semibold text-secondary text-right">
                          Measured
                        </th>
                        <th className="px-4 py-3 font-semibold text-secondary text-center">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {selectedMeasurement.details &&
                        selectedMeasurement.details.length > 0 ? (
                        selectedMeasurement.details.map((point, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-black/5 dark:hover:bg-white/5 transition duration-150"
                          >
                            <td className="px-4 py-3 font-medium text-primary">
                              {point.point_name}
                            </td>
                            <td className="px-4 py-3 text-right text-secondary">
                              {point.nominal_value?.toFixed(4) || "0.0000"}
                            </td>
                            <td className="px-4 py-3 text-right text-secondary text-xs">
                              {point.lower_limit?.toFixed(4)} ~{" "}
                              {point.upper_limit?.toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {point.measured_value?.toFixed(4) || ""}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${point.is_pass
                                  ? "bg-emerald-500 text-white"
                                  : "bg-red-500 text-white"
                                  }`}
                              >
                                {point.is_pass ? "PASS" : "NG"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-10 text-center text-secondary italic"
                          >
                            No measurement snapshots available for this record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border-color bg-black/5 dark:bg-white/5 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-black/5 dark:bg-white/10 text-primary font-semibold rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
