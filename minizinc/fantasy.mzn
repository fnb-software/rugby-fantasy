% Fantasy for the RWC (with data file)
include "alldifferent.mzn";
include "distribute.mzn";

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

array[1..15] of var Players: team;


constraint sum (p in team) (cost[p]) <= 1000;
% low cost 750
constraint alldifferent (team);
constraint distribute([2, 1, 2, 3, 1, 1, 3, 2], [1, 2, 4, 6, 9, 10, 11, 12], [position[p] | p in team]); 
constraint global_cardinality([squad[p] | p in team], squadIds, lbound, ubound); 

var Players: captain;
constraint captain in team;

solve maximize sum (p in team) (value[p]) + value[captain] ;

output ["const team = {ids:\(team), captain: \(captain)};\nexport default team;\n\nValue: \(sum (p in team) (value[p]))\nCost: \(sum (p in team) (cost[p]))\n"];