% Fantasy for the RWC (with data file)
include "alldifferent.mzn";
include "distribute.mzn";
include "increasing.mzn";

% Players available
enum Players;

% cost of each player
array[Players] of int: cost; 
% value of each player
array[Players] of int: value; 
% position of each player
array[Players] of int: position; 
% squad of each player
array[Players] of int: squad; 
% all squad ids
array[int] of int: squadIds; 
% bound for each squad
array[int] of int: ubound; 
array[int] of int: lbound; 

% Position identifiers
set of int: position_identifiers = {1, 2, 4, 6, 9, 10, 11, 12};

array[1..15] of var Players: team;
array[1..15] of int: team_position = [1, 1, 2, 4, 4, 6, 6, 6, 9, 10, 11, 11, 11, 12, 12];

% Connect team and team_position
constraint forall (p in index_set(team)) (position[team[p]] = team_position[p]);
% Maximum cost
constraint sum (p in team) (cost[p]) <= 1000;
% low cost 750
constraint alldifferent (team);
constraint global_cardinality([squad[p] | p in team], squadIds, lbound, ubound); 

% For each position, the players are ordered
constraint forall (position_type in position_identifiers) (
    increasing([team[p] | p in index_set(team) where team_position[p] = position_type])
);

var Players: captain;
constraint captain in team;

solve maximize sum (p in team) (value[p]) + value[captain] ;

output ["const team = {ids:\(team), captain: \(captain)};\nexport default team;\n\nValue: \(sum (p in team) (value[p]))\nCost: \(sum (p in team) (cost[p]))\n"];
