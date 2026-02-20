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
% if each player was a sub
array[Players] of int: sub; 
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
array[1..15] of int: team_position = [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7];

array[1..18] of var Players: team;

% Supersub is 16th player, should be a sub and points count triple
var Players: supersub = team[16];
constraint sub[supersub] = 1;

% 17th and 18th players are subs, points count half
var Players: sub1 = team[17];
var Players: sub2 = team[18];

% Connect team and team_position
constraint forall (i in 1..15) (position[team[i]] = team_position[i]);

% Maximum cost (for low cost use 750)
constraint sum (p in team) (cost[p]) <= 20000;

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

solve maximize sum (p in team) (value[p]) + value[captain] + 2 * value[supersub] - value[sub1]/2 - value[sub2]/2 ;

% constraint team[10] = '97';


