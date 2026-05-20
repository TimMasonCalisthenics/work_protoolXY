import React from 'react';
import { HiArrowLeft, HiX, HiPlus, HiTrash } from 'react-icons/hi';
import SpecPointItem from './components/SpecPointItem';
import { IMAGE_BASE_URL } from '../../services/interceptor';
import { INITIAL_SPEC_POINT } from './constants';

const ProductForm = ({
  formData,
  errors,
  files,
  loading,
  viewMode,
  onBack,
  onCancelDraft,
  onChange,
  onImageFileChange,
  onAddImageUrl,
  onRemoveImageUrl,
  onAddSpecPoint,
  onRemoveSpecPoint,
  onSpecPointChange,
  onSpecPointFileChange,
  onGroupActiveChange,
  onSubmit
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition duration-150 text-primary"
          >
            <HiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              {viewMode === 'edit' ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-secondary mt-1">Fill in the product details below</p>
          </div>
        </div>
        <div>
          <button
            onClick={onCancelDraft}
            className="w-full md:w-auto px-6 py-3 btn-primary flex items-center justify-center gap-2"
          >
            <HiX className="w-5 h-5" />
            Cancel draft
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={onSubmit} noValidate className="glass-card rounded-xl p-8 space-y-8">
        {/* 1. Product Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary border-b border-border-color pb-2">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={(e) => onChange(e.target.name, e.target.value)}
                className={`w-full px-4 py-3 glass-input rounded-lg ${errors.product_name ? 'border-red-500' : ''}`}
                placeholder="e.g. Part number ...."
                required
              />
              <p className="text-red-500 text-sm mt-1 min-h-[20px]">
                {errors.product_name}
              </p>
            </div>

            {/* Product Images */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Product Images</label>
              {formData.image_url.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    {url && (url.startsWith('http') || url.startsWith('/')) && (
                      <img src={IMAGE_BASE_URL + url} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded-lg mb-2 border border-border-color" />
                    )}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onImageFileChange(e, idx)}
                        className="w-full px-4 py-3 glass-input rounded-lg text-sm text-secondary
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary/10 file:text-primary
                              hover:file:bg-primary/20"
                      />
                      {url && !files[url] && (
                        <span className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-page px-2 truncate max-w-[200px]">
                          {url}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveImageUrl(idx)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddImageUrl}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                <HiPlus className="w-5 h-5" />
                Add Another Image
              </button>
            </div>
          </div>
        </div>

        {/* 2. Specification Points */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border-color pb-2">
            <h2 className="text-xl font-semibold text-primary">Specification Points</h2>
            <button
              type="button"
              onClick={onAddSpecPoint}
              className="px-4 py-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <HiPlus className="w-5 h-5" />
              Add Spec Point
            </button>
          </div>

          {formData.spec_points.length === 0 && (
            <p className="text-secondary text-sm italic text-center py-4">No specification points added to this product yet.</p>
          )}

          <div className="grid gap-6">
            {formData.spec_points.map((point, index) => (
              <SpecPointItem
                key={index}
                index={index}
                point={point}
                errors={errors}
                files={files}
                onRemove={onRemoveSpecPoint}
                onChange={onSpecPointChange}
                onFileChange={onSpecPointFileChange}
                onGroupActiveChange={onGroupActiveChange}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border-color">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-black/5 dark:bg-white/10 text-primary font-semibold rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
