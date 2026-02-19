'use client';
import sortBy from 'lodash/sortBy';
import DuelChart from './DuelChart';
import { useState } from 'react';
import { teamColors } from './colors';

const SortableStatsPreview = ({
  team1Name,
  team2Name,
  statRanks,
}: {
  team1Name: string;
  team2Name: string;
  statRanks: any;
}) => {
  const [sort, setSort] = useState('alphabet');
  const [toggled, setToggled] = useState(false);
  const sortedStats = sortBy(statRanks, ({ name, stats }) => {
    if (sort === 'alphabet') {
      return name;
    }
    if (sort === team1Name) {
      return stats[0].rank;
    }
    if (sort === team2Name) {
      return stats[1].rank;
    }
    if (sort === 'gap') {
      return -Math.abs(stats[1].rank - stats[0].rank);
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
        Sort by: <SortButton sortName="alphabet" name="Alphabet" /> -{' '}
        <SortButton sortName={team1Name} name={`${team1Name} Rank`} /> -{' '}
        <SortButton sortName={team2Name} name={`${team2Name} Rank`} /> -{' '}
        <SortButton sortName={'gap'} name={`Rank gap`} />
      </div>
      {sortedStats.map(({ name, stats }) => (
        <div key={name} className="my-3">
          <div id={name} className="invisible relative -top-14" />
          <a className="font-semibold" href={`#${name}`}>
            {name}
          </a>
          <DuelChart
            name={name}
            labels={[
              `Highest`,
              `${team1Name} #${stats[0].rank}`,
              `${team2Name} #${stats[1].rank}`,
              `Lowest`,
            ]}
            data={[stats[2], stats[0], stats[1], stats[3]].map(
              ({ value }) => value
            )}
            backgroundColor={[
              'rgba(133, 133, 133, 0.21)',
              teamColors[team1Name]?.[0],
              teamColors[team2Name]?.[0],
              'rgba(133, 133, 133, 0.21)',
            ]}
            borderColor={[
              'rgba(125, 125, 125, 0.671)',
              teamColors[team1Name]?.[1],
              teamColors[team2Name]?.[1],
              'rgba(125, 125, 125, 0.671)',
            ]}
          ></DuelChart>
        </div>
      ))}
    </div>
  );
};

export default SortableStatsPreview;
