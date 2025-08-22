/**
 * Data Visualization Tool
 * 
 * Creates charts, graphs, and visual reports from data
 */

class DataVisualizationTool {
  constructor() {
    this.name = 'Data Visualization';
    this.description = 'Create charts, graphs, and visual reports';
    this.category = 'analytics';
    this.schema = {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            description: 'Data point object with key-value pairs'
          },
          description: 'The data to visualize (array of objects or arrays)'
        },
        chart_type: {
          type: 'string',
          enum: ['bar', 'line', 'pie', 'scatter', 'histogram', 'area'],
          description: 'The type of chart to create',
          default: 'bar'
        },
        title: {
          type: 'string',
          description: 'The chart title'
        },
        x_label: {
          type: 'string',
          description: 'Label for X-axis'
        },
        y_label: {
          type: 'string',
          description: 'Label for Y-axis'
        },
        width: {
          type: 'number',
          description: 'Chart width in pixels',
          default: 800
        },
        height: {
          type: 'number',
          description: 'Chart height in pixels',
          default: 600
        }
      },
      required: ['data', 'chart_type']
    };
  }

  async execute(parameters, context = {}) {
    try {
      const { 
        data, 
        chart_type = 'bar', 
        title = 'Data Visualization',
        x_label = 'X-axis',
        y_label = 'Y-axis',
        width = 800,
        height = 600
      } = parameters;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Data parameter is required and must be an array');
      }

      if (data.length === 0) {
        throw new Error('Data array cannot be empty');
      }

      console.log(`📊 [DataViz] Creating ${chart_type} chart: "${title}"`);
      console.log(`📊 [DataViz] Data points: ${data.length}`);

      // Process and validate data
      const processedData = this.processData(data, chart_type);
      
      // Generate chart configuration
      const chartConfig = this.generateChartConfig({
        data: processedData,
        chart_type,
        title,
        x_label,
        y_label,
        width,
        height
      });

      // Generate chart HTML/SVG (mock implementation)
      const chartHTML = this.generateChartHTML(chartConfig);
      
      // Generate data summary
      const dataSummary = this.generateDataSummary(processedData);

      console.log(`✅ [DataViz] Chart created successfully: ${chart_type}`);

      return {
        title,
        chart_type,
        data_points: data.length,
        chart_config: chartConfig,
        chart_html: chartHTML,
        data_summary: dataSummary,
        dimensions: { width, height },
        timestamp: new Date().toISOString(),
        note: 'This is a mock implementation. In production, integrate with Chart.js, D3.js, or similar library.'
      };

    } catch (error) {
      console.error('❌ [DataViz] Chart generation failed:', error);
      throw new Error(`Data visualization failed: ${error.message}`);
    }
  }

  processData(data, chartType) {
    // Handle different data formats
    if (data.length === 0) {
      throw new Error('No data provided');
    }

    // If data is array of objects, extract key-value pairs
    if (typeof data[0] === 'object' && data[0] !== null) {
      return data.map((item, index) => {
        if (Array.isArray(item)) {
          return { x: item[0], y: item[1] || 0, index };
        } else {
          const keys = Object.keys(item);
          const x = item[keys[0]] || index;
          const y = item[keys[1]] || item[keys[0]] || 0;
          return { x, y, index, ...item };
        }
      });
    }

    // If data is array of arrays
    if (Array.isArray(data[0])) {
      return data.map((item, index) => ({
        x: item[0] || index,
        y: item[1] || 0,
        index
      }));
    }

    // If data is array of numbers
    if (typeof data[0] === 'number') {
      return data.map((value, index) => ({
        x: index,
        y: value,
        index
      }));
    }

    // If data is array of strings (for categories)
    const categoryCounts = {};
    data.forEach(item => {
      categoryCounts[item] = (categoryCounts[item] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([category, count], index) => ({
      x: category,
      y: count,
      index
    }));
  }

  generateChartConfig(params) {
    const { data, chart_type, title, x_label, y_label, width, height } = params;

    return {
      type: chart_type,
      title,
      dimensions: { width, height },
      axes: {
        x: { label: x_label },
        y: { label: y_label }
      },
      data: data,
      style: {
        colors: this.generateColorPalette(data.length),
        font: 'Arial, sans-serif',
        fontSize: 12
      }
    };
  }

  generateColorPalette(count) {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ];
    
    const palette = [];
    for (let i = 0; i < count; i++) {
      palette.push(colors[i % colors.length]);
    }
    
    return palette;
  }

  generateChartHTML(config) {
    const { type, title, dimensions, data } = config;
    
    // Generate a simple HTML representation
    // In production, this would generate actual chart HTML/SVG using Chart.js, D3.js, etc.
    
    let chartContent = '';
    
    if (type === 'bar') {
      chartContent = data.map((point, index) => 
        `<div class="bar" style="height: ${Math.max(point.y * 10, 5)}px; background-color: ${config.style.colors[index]};">
          <span class="label">${point.x}: ${point.y}</span>
        </div>`
      ).join('\n');
    } else if (type === 'pie') {
      const total = data.reduce((sum, point) => sum + point.y, 0);
      chartContent = data.map((point, index) => {
        const percentage = ((point.y / total) * 100).toFixed(1);
        return `<div class="pie-segment" style="color: ${config.style.colors[index]};">
          ${point.x}: ${point.y} (${percentage}%)
        </div>`;
      }).join('\n');
    } else {
      chartContent = data.map((point, index) => 
        `<div class="data-point">
          Point ${index + 1}: (${point.x}, ${point.y})
        </div>`
      ).join('\n');
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        .chart-container { 
            width: ${dimensions.width}px; 
            height: ${dimensions.height}px; 
            border: 1px solid #ccc; 
            padding: 20px;
            font-family: ${config.style.font};
        }
        .chart-title { 
            text-align: center; 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 20px; 
        }
        .bar { 
            display: inline-block; 
            margin: 2px; 
            min-width: 30px; 
            position: relative; 
        }
        .label { 
            position: absolute; 
            bottom: -20px; 
            font-size: 10px; 
        }
        .pie-segment { 
            margin: 5px 0; 
            font-weight: bold; 
        }
        .data-point { 
            margin: 5px 0; 
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <div class="chart-title">${title}</div>
        <div class="chart-content">
            ${chartContent}
        </div>
    </div>
</body>
</html>`;
  }

  generateDataSummary(data) {
    const values = data.map(point => point.y).filter(val => typeof val === 'number');
    
    if (values.length === 0) {
      return { message: 'No numeric data to summarize' };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      count: values.length,
      sum: sum,
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: min,
      max: max,
      range: max - min
    };
  }
}

module.exports = new DataVisualizationTool();

