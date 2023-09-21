## Prerequisite

Install [minizinc](https://www.minizinc.org)
Run `npm i`

## Usage

1. Generate fantasy-data.mzn with `npm run mz:generate`
2. Run `fantasy.mzn` with minizinc. HiGHS is the fastest solver with around 2min with all constraints enabled
3. Copy the output in `fantasy-result.js`
4. Run `npm run mz:result` to see the result in a nice format

You can change the round in `params.js` to get the team for other rounds.

Update the data as the competition progresses:

- [players](https://fantasy.rugbyworldcup.com/json/fantasy/players.json)
- [squads](https://fantasy.rugbyworldcup.com/json/fantasy/squads.json)
