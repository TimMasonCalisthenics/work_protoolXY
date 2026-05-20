import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct, getProductById } from '@services/productService';
import { cancelMeasurementDraft } from '@services/measurementService';
import { setActiveProduct, getActiveProduct } from '@services/settingService';
import { showSuccess, showError } from '@utils/toast';
import ComfirmModal from '@components/ComfirmModal';

// Sub-components
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import { INITIAL_FORM_DATA, INITIAL_SPEC_POINT } from './constants';

export default function ProductManagement() {
  // --- View State ---
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'edit'

  // --- List View State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);

  // --- Form State ---
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [files, setFiles] = useState({}); // Map filename -> File object
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState(null);

  // --- Data Fetching ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(page, limit, searchTerm);
      if (data.data.products) {
        setProducts(data.data.products);
        setTotal(data.data.total_count);
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProduct = async () => {
    try {
      const data = await getActiveProduct();
      if (data.data) {
        setActiveProductId(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch active product:', err);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
    fetchActiveProduct();
  }, [page, limit, debouncedSearchTerm]);

  // --- List View Handlers ---
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCreateClick = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
    setErrors({});
    setFiles({});
    setViewMode('create');
  };

  const handleEditClick = async (product) => {
    try {
      setLoading(true);
      const fullProductData = await getProductById(product.id);
      const productDetails = fullProductData.data || fullProductData;

      setFormData({
        product_name: productDetails.product_name,
        image_url: Array.isArray(productDetails.image_url) ? productDetails.image_url : (productDetails.image_url ? [productDetails.image_url] : ['']),
        spec_points: Array.isArray(productDetails.spec_points) ? productDetails.spec_points : []
      });
      setEditingId(product.id);
      setErrors({});
      setFiles({});
      setViewMode('edit');
    } catch (err) {
      showError('Failed to get product details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
      showSuccess('Product deleted successfully');
    } catch (err) {
      showError('Failed to delete product: ' + err.message);
    }
  };

  const handleSelectProduct = async (product) => {
    try {
      setLoading(true);
      await setActiveProduct(product.id);
      setActiveProductId(product.id);
      showSuccess(`Product "${product.product_name}" is now active.`);
    } catch (err) {
      showError('Failed to set active product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handlers ---
  const handleFormChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [file.name]: file }));
      const newImageUrls = [...formData.image_url];
      newImageUrls[index] = file.name;
      setFormData(prev => ({ ...prev, image_url: newImageUrls }));
    }
  };

  const addImageUrl = () => {
    setFormData(prev => ({ ...prev, image_url: [...prev.image_url, ''] }));
  };

  const removeImageUrl = (index) => {
    if (formData.image_url.length === 1 && index === 0) {
      setFormData(prev => ({ ...prev, image_url: [''] }));
      return;
    }
    const newImageUrls = formData.image_url.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, image_url: newImageUrls }));
  };

  const addSpecPoint = () => {
    setFormData(prev => ({
      ...prev,
      spec_points: [...prev.spec_points, { ...INITIAL_SPEC_POINT }]
    }));
  };

  const removeSpecPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      spec_points: prev.spec_points.filter((_, i) => i !== index)
    }));
  };

  const handleSpecPointChange = (index, field, value) => {
    const newSpecPoints = [...formData.spec_points];
    if (field === 'group_id') {
      newSpecPoints[index].active_value = false;
    }
    newSpecPoints[index] = {
      ...newSpecPoints[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, spec_points: newSpecPoints }));
  };

  const handleSpecPointFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [file.name]: file }));
      handleSpecPointChange(index, 'point_image_url', file.name);
    }
  };

  const handleGroupActiveChange = (index, checked) => {
    const point = formData.spec_points[index];
    setFormData(prev => {
      const updated = prev.spec_points.map((sp, i) => {
        if (sp.sensor_type === 'air_gauge' && sp.group_id === point.group_id) {
          return {
            ...sp,
            active_value: i === index ? checked : false
          };
        }
        else if (sp.sensor_type === 'air_gauge_x' && sp.group_id === point.group_id) {
          return {
            ...sp,
            active_value: i === index ? checked : false
          };
        }
        else if (sp.sensor_type === 'air_gauge_y' && sp.group_id === point.group_id) {
          return {
            ...sp,
            active_value: i === index ? checked : false
          };
        }
        return sp;
      });
      return { ...prev, spec_points: updated };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.product_name.trim()) newErrors.product_name = "Product name is required";
    if (formData.spec_points.length === 0) newErrors.spec_points = "At least one spec point is required";

    formData.spec_points.forEach((sp, index) => {
      if (!sp.point_name.trim()) newErrors[`point_name_${index}`] = "Point name is required";
      if (!sp.assigned_sensor_device_id.trim()) newErrors[`assigned_sensor_device_id_${index}`] = "Assigned sensor device ID is required";
      if (!sp.sensor_value_key.trim()) newErrors[`sensor_value_key_${index}`] = "Sensor value key is required";
      if (sp.nominal_value === "") newErrors[`nominal_value_${index}`] = "Nominal value required";
      if (sp.min_value === "") newErrors[`min_value_${index}`] = "Min value required";
      if (sp.max_value === "") newErrors[`max_value_${index}`] = "Max value required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const cleanImageUrls = formData.image_url.filter(url => url && url.trim() !== '');
      const payload = {
        product_name: formData.product_name,
        image_url: cleanImageUrls,
        spec_points: formData.spec_points.map(sp => ({
          ...sp,
          nominal_value: parseFloat(sp.nominal_value),
          min_value: parseFloat(sp.min_value),
          max_value: parseFloat(sp.max_value),
          ctrl_min_value: sp.ctrl_min_value ? parseFloat(sp.ctrl_min_value) : null,
          ctrl_max_value: sp.ctrl_max_value ? parseFloat(sp.ctrl_max_value) : null,
          start_value: sp.start_value ? parseFloat(sp.start_value) : null,
          point_image_url: sp.point_image_url || null,
          required_count: sp.required_count ? parseInt(sp.required_count) : null,
          rule_type: sp.rule_type || null,
        }))
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(payload));
      Object.values(files).forEach(file => fd.append('files', file));

      if (viewMode === 'edit' && editingId) {
        await updateProduct(editingId, fd);
        showSuccess('Product updated successfully!');
      } else {
        await createProduct(fd);
        showSuccess('Product created successfully!');
      }

      setFiles({});
      setViewMode('list');
      fetchProducts();
    } catch (err) {
      showError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelDraft = () => {
    const callCancelApi = async () => {
      try {
        await cancelMeasurementDraft();
        showSuccess('Measurement is canceled');
        setModalConfig(null);
      } catch (error) {
        showError('Error canceling measurement');
      }
    };

    setModalConfig({
      title: "Confirm Cancel",
      message: "Are you sure you want to cancel this measurement?",
      variant: "danger",
      onConfirmOk: callCancelApi,
      onConfirmNo: () => setModalConfig(null),
    });
  };

  return (
    <div className="min-h-screen bg-page p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? (
          <ProductList
            products={products}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onAddClick={handleCreateClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onSelectActive={handleSelectProduct}
            activeProductId={activeProductId}
            total={total}
            page={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        ) : (
          <ProductForm
            formData={formData}
            errors={errors}
            files={files}
            loading={formLoading}
            viewMode={viewMode}
            onBack={() => setViewMode('list')}
            onCancelDraft={handleCancelDraft}
            onChange={handleFormChange}
            onImageFileChange={handleImageFileChange}
            onAddImageUrl={addImageUrl}
            onRemoveImageUrl={removeImageUrl}
            onAddSpecPoint={addSpecPoint}
            onRemoveSpecPoint={removeSpecPoint}
            onSpecPointChange={handleSpecPointChange}
            onSpecPointFileChange={handleSpecPointFileChange}
            onGroupActiveChange={handleGroupActiveChange}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Delete Product</h2>
            <p className="text-secondary mb-6">
              Are you sure you want to delete <span className="text-primary font-semibold">{selectedProduct.product_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfig && (
        <ComfirmModal
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          onClose={() => setModalConfig(null)}
          buttonNo="Cancel"
          buttonOK="Confirm"
          handleConfirmOK={modalConfig.onConfirmOk}
          handleConfirmNo={modalConfig.onConfirmNo}
        />
      )}
    </div>
  );
}
