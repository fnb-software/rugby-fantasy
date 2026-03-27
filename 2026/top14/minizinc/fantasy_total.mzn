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
set of int: position_identifiers = {13, 12, 11, 10, 9, 8, 7, 6, 5};

% Distribution of positions in the team
array[1..15] of int: team_position = [5, 6, 7, 7, 6, 8, 9, 10, 10, 10, 11, 11, 12, 13, 12];

array[1..18] of var Players: team;

% Supersub is 16th player and points count triple
var Players: supersub = team[16];

% 17th and 18th players are subs, points count half
var Players: sub1 = team[17];
var Players: sub2 = team[18];

% Connect team and team_position
constraint forall (i in 1..15) (position[team[i]] = team_position[i]);

% Maximum cost (optional, pass a large number to disable)
int: max_cost;
constraint sum (p in team) (cost[p]) <= max_cost;

% Don't pick the same player more than once
constraint alldifferent (team);

% Max number of players per country
constraint global_cardinality([squad[p] | p in team], squadIds, lbound, ubound); 

% For each position, the players are ordered (breaking symmetry)
constraint forall (position_type in position_identifiers) (
    increasing([team[i] | i in 1..15 where team_position[i] = position_type])
);

% break subs symmetry
constraint sub1 < sub2;

% Captain can't be a sub
var Players: captain;
constraint captain in team;
constraint captain != supersub;
constraint captain != sub1;
constraint captain != sub2;

solve :: int_search(team, input_order, indomain_min) maximize sum (p in team) (value[p]) + value[captain] + 3 * sub_value[supersub] - value[supersub] + (value[supersub] - sub_value[supersub]) / 2 - value[sub1]/2 - value[sub2]/2 ;

% constraint team[10] = '97';


