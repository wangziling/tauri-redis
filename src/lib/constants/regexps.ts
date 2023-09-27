export const valueFormat = /^[+-]?\d+(?:\.\d+)?$/;

export const dbMetricsPropertyKeyMatcher = /^db\d{0,2}$/i;
export const dbMetricsPropertyValueSplitter = /\s*,\s*/;
export const dbMetricsPropertyValuePair = /^(\w+)=(\w+)$/;
