import React from 'react';
import { HiPlus, HiSearch, HiPencilAlt, HiCheck, HiPhotograph } from 'react-icons/hi';
import { HiTrash } from "react-icons/hi2";
import { IMAGE_BASE_URL } from '../../services/interceptor';

const ProductList = ({
  products,
  loading,
  searchTerm,
  onSearchChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onSelectActive,
  activeProductId,
  total,
  page,
  totalPages,
  onPageChange
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Product Management</h1>
          <p className="text-secondary">Manage your products and specifications</p>
        </div>

        <button
          onClick={onAddClick}
          className="w-full md:w-auto px-6 py-3 btn-primary flex items-center justify-center gap-2"
        >
          <HiPlus className="w-5 h-5" />
          Add New Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <HiSearch className="w-5 h-5 text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent border-none text-primary placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-secondary">
              No products found.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-border-color">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Spec Points</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-accent uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image_url && product.image_url.length > 0 ? (
                        <img
                          src={Array.isArray(product.image_url) ? IMAGE_BASE_URL + product.image_url[0] : IMAGE_BASE_URL + product.image_url}
                          alt={product.product_name}
                          className="h-12 w-12 rounded-lg object-cover bg-white"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <HiPhotograph className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary">{product.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeProductId === product.id ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/10 w-fit">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                        {product.spec_points ? product.spec_points.length : 0} points
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onSelectActive(product)}
                          className="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition duration-150"
                          title="Select Active"
                        >
                          <HiCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onEditClick(product)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150"
                          title="Edit"
                        >
                          <HiPencilAlt className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(product)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition duration-150"
                          title="Delete"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
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
            Showing <span className="font-semibold text-primary">{products.length}</span> of <span className="font-semibold text-primary">{total}</span> products
            {totalPages > 0 && <span className="hidden sm:inline"> (Page {page} of {totalPages})</span>}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
