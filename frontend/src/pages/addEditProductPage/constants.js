export const SENSOR_CONFIG = {
  mitutoyo: {
    disabled: ['ctrl_min_value', 'ctrl_max_value', 'start_value', 'required_count', 'rule_type', 'active_value']
  },
  air_gauge: {
    disabled: []
  }
};

export const INITIAL_SPEC_POINT = {
  point_name: '',
  point_image_url: null,
  nominal_value: '',
  min_value: '',
  max_value: '',
  ctrl_min_value: '',
  ctrl_max_value: '',
  start_value: '',
  active_value: true,
  sensor_type: 'mitutoyo', // Default
  condition: 'less', // Default
  group_id: 0,
  assigned_sensor_device_id: '',
  sensor_value_key: '',
  required_count: 1,
  rule_type: 'normal',
};

export const INITIAL_FORM_DATA = {
  product_name: '',
  image_url: [''],
  spec_points: []
};
