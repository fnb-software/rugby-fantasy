'use client';
import { Bar } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DuelChart = ({ name, labels, data, backgroundColor, borderColor }) => {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: name,
            data,
            backgroundColor,
            borderColor,
            borderWidth: 1,
          },
        ],
      }}
      options={{
        plugins: {
          legend: {
            display: false,
          },
        },
      }}
    />
  );
};

export default DuelChart;
