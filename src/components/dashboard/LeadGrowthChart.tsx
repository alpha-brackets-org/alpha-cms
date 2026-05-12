'use client';

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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LeadGrowthChartProps {
  data: { month: string; count: number }[];
}

export function LeadGrowthChart({ data }: LeadGrowthChartProps) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'New Leads',
        data: data.map((d) => d.count),
        fill: true,
        borderColor: 'rgb(0, 255, 0)',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#000',
        pointBorderColor: '#00ff00',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#000',
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 12,
        displayColors: false,
        borderColor: '#333',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: 'JetBrains Mono', size: 9 },
          color: '#666',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          stepSize: 1,
          font: { family: 'JetBrains Mono', size: 9 },
          color: '#666',
        },
      },
    },
  };

  return (
    <div className="h-[200px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
