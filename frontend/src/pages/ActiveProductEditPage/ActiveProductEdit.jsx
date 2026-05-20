import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductById, updateActiveProductDetail } from "@services/productService";
import { getActiveProduct } from "@services/settingService";

import { IMAGE_BASE_URL } from '@services/interceptor';
import { showSuccess, showError, showWarning } from "@utils/toast";

export default function ActiveProductEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    image_url: [''],
    spec_points: []
  });
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});

  const SENSOR_CONFIG = {
    mitutoyo: {
      disabled: ['ctrl_min_value', 'ctrl_max_value', 'start_value', 'required_count', 'rule_type', 'active_value']
    },
    air_gauge: {
      disabled: []
    }
  };

  useEffect(() => {
    const fetchActiveDetail = async () => {
      try {
        const activeProductData = await getActiveProduct();
        const activeProduct = activeProductData.data;
        if (activeProduct == null) {
          showWarning("No active product!!")
          return
        }
        const data = await getProductById(activeProduct);
        if (data.data) {
          setFormData({
            id: activeProduct,
            product_name: data.data.product_name,
            image_url: Array.isArray(data.data.image_url) ? data.data.image_url : (data.data.image_url ? [data.data.image_url] : ['']),
            spec_points: Array.isArray(data.data.spec_points) ? data.data.spec_points : []
          });
        }
      } catch (err) {
        showError('Failed to get product detail: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveDetail();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecPointChange = (index, field, value) => {
    const newSpecPoints = [...formData.spec_points];
    newSpecPoints[index] = { ...newSpecPoints[index], [field]: value };
    setFormData(prev => ({ ...prev, spec_points: newSpecPoints }));
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
    const newImageUrls = formData.image_url.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, image_url: newImageUrls.length > 0 ? newImageUrls : [''] }));
  };

  const handleSpecPointFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [file.name]: file }));
      handleSpecPointChange(index, 'point_image_url', file.name);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.product_name.trim()) newErrors.product_name = "Product name is required";
    formData.spec_points.forEach((sp, index) => {
      if (!sp.point_name.trim()) newErrors[`point_name_${index}`] = "Point name is required";
      if (!sp.assigned_sensor_device_id?.trim()) newErrors[`assigned_sensor_device_id_${index}`] = "Device ID is required";
      if (!sp.sensor_value_key?.trim()) newErrors[`sensor_value_key_${index}`] = "Value key is required";
      if (sp.nominal_value === "") newErrors[`nominal_value_${index}`] = "Required";
      if (sp.min_value === "") newErrors[`min_value_${index}`] = "Required";
      if (sp.max_value === "") newErrors[`max_value_${index}`] = "Required";
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
        // image_url: cleanImageUrls,
        id: formData.id,
        spec_points: formData.spec_points.map(sp => ({
          ...sp,
          nominal_value: parseFloat(sp.nominal_value),
          min_value: parseFloat(sp.min_value),
          max_value: parseFloat(sp.max_value),
          ctrl_min_value: sp.ctrl_min_value ? parseFloat(sp.ctrl_min_value) : null,
          ctrl_max_value: sp.ctrl_max_value ? parseFloat(sp.ctrl_max_value) : null,
          start_value: sp.start_value ? parseFloat(sp.start_value) : null,
          required_count: sp.required_count ? parseInt(sp.required_count) : null,
        }))
      };
      await updateActiveProductDetail(JSON.stringify(payload));
      showSuccess('Active product updated successfully!');
      navigate('/measurement');
    } catch (err) {
      showError(err.message || 'Update failed');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-black/5 dark:bg-white/10 text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Edit Product</h1>
            <p className="text-secondary">Modify current product settings (Points restricted)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="glass-card rounded-xl p-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b border-border-color pb-2">Basic Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  disabled
                  onChange={handleFormChange}
                  className={`w-full px-4 py-3 glass-input rounded-lg ${errors.product_name ? 'border-red-500' : ''}`}
                />
                {errors.product_name && <p className="text-red-500 text-sm">{errors.product_name}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">Product Images</label>
                {formData.image_url.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      {url && (url.startsWith('http') || url.startsWith('/')) && (
                        <img src={IMAGE_BASE_URL + url} alt="Preview" className="h-20 w-20 object-cover rounded-lg mb-2" />
                      )}
                      {/* <input type="file" onChange={(e) => handleImageFileChange(e, idx)} className="w-full text-sm text-secondary" /> */}
                    </div>
                    {/* <button type="button" onClick={() => removeImageUrl(idx)} className="text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button> */}
                  </div>
                ))}
                {/* <button type="button" onClick={addImageUrl} className="text-sm text-blue-500 font-medium">+ Add Another Image</button> */}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b border-border-color pb-2">Specification Points</h2>
            <div className="grid gap-6">
              {formData.spec_points.map((point, index) => (
                <div key={index} className="glass-card bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-white/10">
                  <h3 className="text-sm font-bold text-secondary mb-3 uppercase tracking-wider">Point #{index + 1}: {point.point_name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-secondary font-medium">Point Name</label>
                      <input type="text" value={point.point_name} disabled onChange={(e) => handleSpecPointChange(index, 'point_name', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-secondary font-medium">Sensor Type</label>
                      <input type="text" value={point.sensor_type} disabled className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                    </div>
                    <div></div>
                    <div>
                      <label className="text-xs text-secondary font-medium">Nominal</label>
                      <input type="number" step="0.0001" value={point.nominal_value} onChange={(e) => handleSpecPointChange(index, 'nominal_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-secondary font-medium">Min</label>
                      <input type="number" step="0.0001" value={point.min_value} onChange={(e) => handleSpecPointChange(index, 'min_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-secondary font-medium">Max</label>
                      <input type="number" step="0.0001" value={point.max_value} onChange={(e) => handleSpecPointChange(index, 'max_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                    </div>
                    {/* Air Gauge Specifics */}
                    {point.sensor_type === 'air_gauge' && (
                      <>
                        <div>
                          <label className="text-xs text-secondary font-medium">Start Value</label>
                          <input type="number" value={point.start_value} onChange={(e) => handleSpecPointChange(index, 'start_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-secondary font-medium">Ctrl min</label>
                          <input type="number" value={point.ctrl_min_value} onChange={(e) => handleSpecPointChange(index, 'ctrl_min_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-secondary font-medium">Ctrl Max</label>
                          <input type="number" value={point.ctrl_max_value} onChange={(e) => handleSpecPointChange(index, 'ctrl_max_value', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-secondary font-medium">Required Count</label>
                          <input type="number" value={point.required_count} onChange={(e) => handleSpecPointChange(index, 'required_count', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm" />
                        </div>

                        <div>
                          <label className="text-xs text-secondary font-medium">Rule Type</label>
                          <select value={point.rule_type} onChange={(e) => handleSpecPointChange(index, 'rule_type', e.target.value)} className="w-full px-3 py-2 glass-input rounded-md text-sm bg-transparent">
                            <option value="normal">Normal</option>
                            <option value="less than">Less Than</option>
                            <option value="more than">More Than</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" disabled={formLoading} className="px-8 py-3 btn-primary disabled:opacity-50 min-w-[150px]">
              {formLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
