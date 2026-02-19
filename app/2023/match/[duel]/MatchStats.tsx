'use client';
import sortBy from 'lodash/sortBy';
import DuelChart from './DuelChart';
import { useState } from 'react';
import { teamColors } from './colors';

const MatchStats = ({
  team1Name,
  team2Name,
  statRanks,
  stats,
}: {
  team1Name: string;
  team2Name: string;
  statRanks: any;
  stats: any;
}) => {
  const [sort, setSort] = useState('alphabet');
  const [toggled, setToggled] = useState(false);
  const sortedStats = sortBy(statRanks, ({ name }) => {
    if (sort === 'alphabet') {
      return name;
    }
  });
  if (toggled) {
    sortedStats.reverse();
  }
  const SortButton = ({ sortName, name }) => {
    return (
      <button
        className={sort === sortName ? 'font-bold' : ''}
        onClick={() => {
          sort === sortName ? setToggled((t) => !t) : setToggled(false);
          setSort(sortName);
        }}
      >
        {name}
      </button>
    );
  };
  return (
    <div>
      <div className="my-2">
        Sort by: <SortButton sortName="alphabet" name="Alphabet" />
      </div>
      {sortedStats.map(({ name, stats: statsPreview }) => (
        <div key={name} className="my-3">
          <div id={name} className="invisible relative -top-14" />
          <a className="font-semibold" href={`#${name}`}>
            {name}
          </a>
          <DuelChart
            name={name}
            labels={[
              `Avg ${team1Name} (#${statsPreview[0].rank})`,
              `Match ${team1Name}`,
              `Match ${team2Name}`,
              `Avg ${team2Name} (#${statsPreview[1].rank})`,
            ]}
            data={[
              statsPreview[0].value,
              stats[0][name],
              stats[1][name],
              statsPreview[1].value,
            ]}
            backgroundColor={[
              teamColors[team1Name]?.[2],
              teamColors[team1Name]?.[0],
              teamColors[team2Name]?.[0],
              teamColors[team2Name]?.[2],
            ]}
            borderColor={[
              teamColors[team1Name]?.[3],
              teamColors[team1Name]?.[1],
              teamColors[team2Name]?.[1],
              teamColors[team2Name]?.[3],
            ]}
          ></DuelChart>
        </div>
      ))}
    </div>
  );
};

export default MatchStats;
