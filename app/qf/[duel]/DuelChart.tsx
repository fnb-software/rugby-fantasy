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
          `Highest`,
          `${team1Name} #${stats[0].rank}`,
          `${team2Name} #${stats[1].rank}`,
          `Lowest`,
        ],
        datasets: [
          {
            label: name,
            data: [stats[2], stats[0], stats[1], stats[3]].map(
              ({ value }) => value
            ),
            backgroundColor: [
              'rgba(133, 133, 133, 0.21)',
              teamColors[team1Name][0],
              teamColors[team2Name][0],
              'rgba(133, 133, 133, 0.21)',
            ],
            borderColor: [
              'rgba(125, 125, 125, 0.671)',
              teamColors[team1Name][1],
              teamColors[team2Name][1],
              'rgba(125, 125, 125, 0.671)',
            ],
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
