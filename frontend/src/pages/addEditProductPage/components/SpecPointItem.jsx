import React from 'react';
import { HiX, HiTrash } from 'react-icons/hi';
import { IMAGE_BASE_URL } from '../../../services/interceptor';
import { SENSOR_CONFIG } from '../constants';

const SpecPointItem = ({
  index,
  point,
  errors,
  files,
  onRemove,
  onChange,
  onFileChange,
  onGroupActiveChange
}) => {
  const isFieldDisabled = (sensorType, field) => {
    if (!SENSOR_CONFIG[sensorType]) return false;
    return SENSOR_CONFIG[sensorType].disabled.includes(field);
  };

  const handleToleranceChange = (type, val) => {
    if (val === '') {
      onChange(index, type === 'lower' ? 'min_value' : 'max_value', '');
      return;
    }
    const tol = parseFloat(val);
    const nominal = parseFloat(point.nominal_value);

    if (!isNaN(tol) && !isNaN(nominal)) {
      const calculatedVal = Math.round((nominal + tol) * 10000) / 10000;
      onChange(index, type === 'lower' ? 'min_value' : 'max_value', calculatedVal);
    }
  };

  return (
    <div className="glass-card bg-black/5 dark:bg-white/5 p-4 rounded-xl relative border border-white/10">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors"
        title="Remove Point"
      >
        <HiX className="w-5 h-5" />
      </button>

      <h3 className="text-sm font-bold text-secondary mb-3 uppercase tracking-wider">Point #{index + 1}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-0">
        {/* Point Name */}
        <div>
          <label className="text-xs text-secondary font-medium">Point Name</label>
          <input
            type="text"
            value={point.point_name}
            onChange={(e) => onChange(index, 'point_name', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`point_name_${index}`] ? 'border-red-500' : ''}`}
            placeholder="e.g. Top Width"
            required
          />
          <p className="text-red-500 text-sm min-h-[20px]">
            {errors[`point_name_${index}`] || ""}
          </p>
        </div>

        {/* Empty cells for grid alignment */}
        <div className="hidden md:block"></div>
        <div className="hidden lg:block"></div>

        {/* Sensor Type */}
        <div>
          <label className="text-xs text-secondary font-medium">Sensor Type</label>
          <select
            value={point.sensor_type}
            onChange={(e) => onChange(index, 'sensor_type', e.target.value)}
            className="w-full px-3 py-2 glass-input rounded-md text-sm bg-transparent"
          >
            <option className='bg-page' value="mitutoyo">Mitutoyo</option>
            <option className='bg-page' value="air_gauge">Air Gauge</option>
            <option className='bg-page' value="air_gauge_x">Air Gauge X Axis</option>
            <option className='bg-page' value="air_gauge_y">Air Gauge Y Axis</option>
          </select>
        </div>

        {/* Sensor/Device ID */}
        <div>
          <label className="text-xs text-secondary font-medium">Assigned Sensor ID</label>
          <input
            type="text"
            value={point.assigned_sensor_device_id}
            onChange={(e) => onChange(index, 'assigned_sensor_device_id', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`assigned_sensor_device_id_${index}`] ? 'border-red-500' : ''}`}
            placeholder="e.g. SNSR-001"
            required
          />
          <p className="text-red-500 text-sm mt-1 min-h-[20px]">
            {errors[`assigned_sensor_device_id_${index}`]}
          </p>
        </div>

        {/* Sensor Value Key */}
        <div>
          <label className="text-xs text-secondary font-medium">Sensor Value Key</label>
          <input
            type="text"
            value={point.sensor_value_key}
            onChange={(e) => onChange(index, 'sensor_value_key', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`sensor_value_key_${index}`] ? 'border-red-500' : ''}`}
            placeholder="e.g. width_ch1"
            required
          />
          <p className="text-red-500 text-sm mt-1 min-h-[20px]">
            {errors[`sensor_value_key_${index}`]}
          </p>
        </div>

        {/* Nominal Value */}
        <div>
          <label className="text-xs text-secondary font-medium">Nominal Value</label>
          <input
            type="number"
            step="0.0001"
            value={point.nominal_value}
            onChange={(e) => onChange(index, 'nominal_value', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`nominal_value_${index}`] ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
          <p className="text-red-500 text-sm mt-1 min-h-[20px]">
            {errors[`nominal_value_${index}`]}
          </p>
        </div>

        {/* Min Value */}
        <div>
          <label className="text-xs text-secondary font-medium">Min Value</label>
          <input
            type="number"
            step="0.0001"
            value={point.min_value}
            onChange={(e) => onChange(index, 'min_value', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`min_value_${index}`] ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
          <p className="text-red-500 text-sm mt-1 min-h-[20px]">
            {errors[`min_value_${index}`]}
          </p>
        </div>

        {/* Max Value */}
        <div>
          <label className="text-xs text-secondary font-medium">Max Value</label>
          <input
            type="number"
            step="0.0001"
            value={point.max_value}
            onChange={(e) => onChange(index, 'max_value', e.target.value)}
            className={`w-full px-3 py-2 glass-input rounded-md text-sm ${errors[`max_value_${index}`] ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
          <p className="text-red-500 text-sm mt-1 min-h-[20px]">
            {errors[`max_value_${index}`]}
          </p>
        </div>

        {/* Mitutoyo Specific - Tolerance */}
        {point.sensor_type === 'mitutoyo' && (
          <>
            <div className="hidden md:block"></div>
            <div>
              <label className="text-xs text-secondary font-medium">Lower Tolerance</label>
              <input
                type="number"
                step="0.0001"
                value={point.nominal_value && point.min_value
                  ? Number((Number(point.min_value) - Number(point.nominal_value)).toFixed(8))
                  : ''
                }
                onChange={(e) => handleToleranceChange('lower', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium">Upper Tolerance</label>
              <input
                type="number"
                step="0.0001"
                value={point.nominal_value && point.max_value
                  ? Number((Number(point.max_value) - Number(point.nominal_value)).toFixed(8))
                  : ''
                }
                onChange={(e) => handleToleranceChange('upper', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="0.00"
              />
            </div>
          </>
        )}

        {/* Air Gauge Specific */}
        {point.sensor_type.startsWith('air_gauge') && (
          <>
            <div className="hidden md:block"></div>
            <div>
              <label className="text-xs text-secondary font-medium">Ctrl Min Value</label>
              <input
                type="number"
                step="0.0001"
                value={point.ctrl_min_value}
                disabled={isFieldDisabled(point.sensor_type, 'ctrl_min_value')}
                onChange={(e) => onChange(index, 'ctrl_min_value', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium">Ctrl Max Value</label>
              <input
                type="number"
                step="0.0001"
                value={point.ctrl_max_value}
                disabled={isFieldDisabled(point.sensor_type, 'ctrl_max_value')}
                onChange={(e) => onChange(index, 'ctrl_max_value', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-xs text-secondary font-medium">Duplicate Value</label>
              <input
                type="number"
                step="1"
                value={point.required_count}
                disabled={isFieldDisabled(point.sensor_type, 'required_count')}
                onChange={(e) => onChange(index, 'required_count', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="1"
              />
            </div>

            <div>
              <label className="text-xs text-secondary font-medium">Start Value</label>
              <input
                type="number"
                step="0.0001"
                value={point.start_value}
                disabled={isFieldDisabled(point.sensor_type, 'start_value')}
                onChange={(e) => onChange(index, 'start_value', e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-md text-sm"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-row items-center justify-start gap-5">
              <div>
                <label className="text-xs text-secondary font-medium">Condition Type</label>
                <select
                  value={point.rule_type}
                  disabled={isFieldDisabled(point.sensor_type, 'rule_type')}
                  onChange={(e) => onChange(index, 'rule_type', e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-md text-sm bg-transparent"
                >
                  <option className='bg-page' value="normal">normal</option>
                  <option className='bg-page' value="less than">less than</option>
                  <option className='bg-page' value="more than">more than</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary font-medium">Group ID</label>
                <select
                  value={point.group_id || ''}
                  onChange={(e) => onChange(index, 'group_id', Number(e.target.value))}
                  className="w-full px-3 py-2 glass-input rounded-md text-sm bg-transparent"
                >
                  {Array.from({ length: 20 }).map((_, i) => (
                    <option key={i} className='bg-page' value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className='flex flex-row pt-6 gap-2'>
                <input
                  type="checkbox"
                  id={`active-${index}`}
                  checked={point.active_value}
                  onChange={(e) => onGroupActiveChange(index, e.target.checked)}
                  disabled={isFieldDisabled(point.sensor_type, 'active_value')}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor={`active-${index}`} className="text-sm text-secondary font-medium">Active</label>
              </div>
            </div>
          </>
        )}

        {/* Point Image */}
        <div className="md:col-span-2 lg:col-span-3 space-y-1 mt-2">
          <label className="text-xs text-secondary font-medium">Point Image</label>
          <div className="flex gap-2 items-center">

            {point.point_image_url && (point.point_image_url.startsWith('http') || point.point_image_url.startsWith('/')) && (
              <img src={IMAGE_BASE_URL + point.point_image_url} alt="Point Preview" className="h-10 w-10 object-cover rounded border border-border-color" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e, index)}
              className="w-full px-3 py-2 glass-input rounded-md text-sm text-secondary
                        file:mr-4 file:py-1 file:px-2
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-primary/10 file:text-primary"
            />
            <button
              type="button"
              onClick={() => {
                onChange(index, 'point_image_url', '');
              }}
              className="text-red-500 hover:text-red-700 p-2"
            >
              <HiTrash className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SpecPointItem;
