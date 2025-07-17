import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  data: any;
  options?: any;
  type: 'line' | 'bar' | 'doughnut';
  height?: number;
}

const AdminChart: React.FC<ChartProps> = ({ data, options, type, height = 300 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        ticks: {
          color: '#64748b',
        },
        grid: {
          color: '#334155',
        },
      },
      y: {
        ticks: {
          color: '#64748b',
        },
        grid: {
          color: '#334155',
        },
      },
    } : undefined,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const chartStyle = {
    height: `${height}px`,
  };

  switch (type) {
    case 'line':
      return (
        <div style={chartStyle}>
          <Line data={data} options={mergedOptions} />
        </div>
      );
    case 'bar':
      return (
        <div style={chartStyle}>
          <Bar data={data} options={mergedOptions} />
        </div>
      );
    case 'doughnut':
      return (
        <div style={chartStyle}>
          <Doughnut data={data} options={mergedOptions} />
        </div>
      );
    default:
      return null;
  }
};

export default AdminChart;
