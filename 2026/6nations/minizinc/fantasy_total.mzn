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
% value of each player as a sub
array[Players] of int: sub_value; 
% squad of each player
array[Players] of int: squad; 
% all squad ids
array[int] of int: squadIds; 
% bound for each squad
array[int] of int: ubound; 
array[int] of int: lbound; 

% Position identifiers
set of int: position_identifiers = {13, 12, 11, 10, 9, 8, 7, 6};

% Distribution of positions in the team
array[1..15] of int: team_position = [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 6, 7, 7];

array[1..16] of var Players: team;

% Supersub is 16th player and points count triple
var Players: supersub = team[16];

% Connect team and team_position
constraint forall (i in 1..15) (position[team[i]] = team_position[i]);

% Maximum cost (for low cost use 750)
%constraint sum (p in team) (cost[p]) <= 20000;

% Don't pick the same player more than once
constraint alldifferent (team);

% Max number of players per country
constraint global_cardinality([squad[p] | p in team], squadIds, lbound, ubound); 

% For each position, the players are ordered (breaking symmetry)
constraint forall (position_type in position_identifiers) (
    increasing([team[i] | i in 1..15 where team_position[i] = position_type])
);

% Captain value counts double, captain can't be supersub
var Players: captain;
constraint captain in team;
constraint captain != supersub;

solve maximize sum (p in team) (value[p]) + value[captain] + max(3 * sub_value[supersub], value[supersub] div 2) - value[supersub] ;

% constraint team[10] = '97';


