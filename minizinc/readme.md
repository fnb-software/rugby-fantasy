## Prerequisite

Install [minizinc](https://www.minizinc.org)  
Add `minizinc` to your `PATH`  
Run `npm i`

## Usage

1. Run `npm run mz:solve`

You can change the round in `params.js` to get the team for other rounds.

### Manual alternative

1. Generate fantasy.dzn with `npm run mz:write`
2. Run `fantasy.mzn` with minizinc. HiGHS is the fastest solver with around 2min with all constraints enabled
3. Copy the output in `fantasy-result.js`
4. Run `npm run mz:read` to see the result in a nice format

## Data

Update the data as the competition progresses:

- [players](https://fantasy.rugbyworldcup.com/json/fantasy/players.json)
- [squads](https://fantasy.rugbyworldcup.com/json/fantasy/squads.json)
