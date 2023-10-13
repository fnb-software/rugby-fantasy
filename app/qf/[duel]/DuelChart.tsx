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
import { teamColors } from './colors';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DuelChart = ({ team1Name, team2Name, name, stats }) => {
  return (
    <Bar
      data={{
        labels: [
          `${team1Name} #${stats[0].rank}`,
          `${team2Name} #${stats[1].rank}`,
        ],
        datasets: [
          {
            label: name,
            data: stats.map(({ value }) => value),
            backgroundColor: [
              teamColors[team1Name][0],
              teamColors[team2Name][0],
            ],
            borderColor: [teamColors[team1Name][1], teamColors[team2Name][1]],
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
