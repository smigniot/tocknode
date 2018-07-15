var util = require("util");
var shared = require("./shared.js");
var json2 = require("./json2.js");


// 0. Unit test utilities
var testCount, empty, moves, move, state, handled, p, i, copy, pawns, j, nonracked, c;
testCount = 1;
function passTest(message) {
	util.log((testCount++)+": "+message);
}
function failTest(message, hint) {
	util.log("[FAIL] "+testCount+": "+message);
	if(arguments.length >= 2) {
	    util.log("[HINT] "+JSON.stringify(hint));
	}
	throw ("Test #"+testCount+" failed");
}
function assertEquals(message, expected, actual) {
    if(expected == actual) {
	passTest(message);
    } else {
	failTest(message, "expected = ["+expected
		+"], actual = ["+actual+"]");
    }
}
function gameFromJson(json) {
    var game, copy, i, color, card, pawn;
    copy = JSON.parse(json);
    game = new shared.Game();
    game.name = copy.name;
    game.attendee = copy.attendee;
    game.turn = copy.turn;
    game.phase = copy.phase;
    for(color in copy.player) {
        game.player[color] = new shared.Player(copy.player[color].color, 
                copy.player[color].name);
    }
    for(color in copy.hand) {
        game.hand[color] = [];
        for(i in copy.hand[color]) {
            card = copy.hand[color][i];
            game.hand[color].push(new shared.Card(card.color, card.value));
        }
    }
    for(color in copy.pawn) {
        game.pawn[color] = [];
        pawn = copy.pawn[color];
        for(i in pawn) {
            game.pawn[color].push(new shared.Pawn(pawn[i].color,
                        pawn[i].position, pawn[i].locked));
        }
    }
    return game;
}

// 1. Test empty game
empty = new shared.GameState(0,[],[]);
passTest("Empty game");
moves = empty.computeMoves();
if(moves.length != 0) {
	failTest("No card, no pawn should raise no move");
}
passTest("Empty game moves");

// 2. Test withdrawal only
state = new shared.GameState(0,[{'color':0,'value':13}],[]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length+" moves instead of 1 for onecardstate");
}
move = moves[0];
if(move.type != "WITHDRAW") {
	failTest("Got "+move.type+" move instead of withdrawal");
}
if((move.card[0] != 0) || (move.card[1] != 13)) {
	failTest("Got "+move.card+" instead of [0,13]");
}
passTest("Withdraw one card");

// 3. Test king entering
state = new shared.GameState(0,[{'color':0,'value':13}],
		[{'color':0,'position':-1}]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length+" moves instead of 1 for king entering test");
}
move = moves[0];
if(move.type != "ENTER") {
	failTest("Got "+move.type+" move instead of king entering");
}
passTest("Enter using king");

// 5. Test ace entering
state = new shared.GameState(0,[{'color':0,'value':1}],
		[{'color':0,'position':-1}]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length+" moves instead of 1 for ace entering test");
}
move = moves[0];
if(move.type != "ENTER") {
	failTest("Got "+move.type+" move instead of ace entering");
}
passTest("Enter using ace");

// 6. Test ace moving
state = new shared.GameState(0,[{'color':3,'value':1}],
		[{'color':0,'position':1}]);
moves = state.computeMoves();
if(moves.length != 2) {
	failTest("Got "+moves.length+" moves instead of 2 moves for ace");
}
passTest("Move using ace as 1 or 14");

// 7. Test ace 3 pathes moving
//
// From 8, distance 14
// 8 9 10 11 12 13 14 15 16 17 18 19 24 25
// 8 9 10 11 12 13 14 15 16 17 18 20 21 22
// From 8, distance 1
// 8 9
// 
// 79=24*3+7=72+7 = B7
//
state = new shared.GameState(0,[{'color':3,'value':1}],
		[{'color':0,'position':79}]);
moves = state.computeMoves();
if(moves.length != 3) {
    failTest("Got "+moves.length+" moves instead of 2 moves for ace rack", moves);
}
passTest("Move using ace as 1 or 14, including rack");

// 8. Test normal 6 moving
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':2},
		{'color':0,'position':24},
		]);
moves = state.computeMoves();
if(moves.length != 2) {
	failTest("Got "+moves.length
			+" moves instead of 2 move for 6 moving 2 pawns");
}
passTest("Move 2 pawns using 6");

// 9. Test same pawn color blocking
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':2},
		{'color':0,'position':5},
		]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length
			+" moves instead of 1 move "
			+"for 6 moving 2 pawns, 1 blocked");
}
passTest("Move 2 pawns using 6, 1 blocked");

// 10. Test other color but on base blocking
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':16},
		{'color':1,'position':24,'locked':true},
		]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length
			+" moves instead of 1 for blocked on base");
} else if(moves[0].type != 'WITHDRAW') {
	failTest("Got "+moves[0].type
			+" instead of withdrawal for blocked on base");
}
passTest("Move using 6, base blocking");

// 11. Test non-door 8 move
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':1},
		]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length
			+" moves instead of 1 for non-door 8");
}
passTest("Move using non-door 8");

// 12. Test door 8 move
state = new shared.GameState(0,[{'color':0,'value':8}],
		[
		{'color':0,'position':8},
		]);
moves = state.computeMoves();
if(moves.length != 4) {
	failTest("Got "+moves.length
			+" moves instead of 4 for door 8");
}
passTest("Move using door 8");

// 13. Test switch move
state = new shared.GameState(0,[{'color':0,'value':11}],
		[
		{'color':0,'position':2},
		{'color':1,'position':90},
		]);
moves = state.computeMoves();
if(moves.length != 1) {
	failTest("Got "+moves.length
			+" moves instead of 1 for switch move");
}
move = moves[0];
if(move.type != 'SWITCH') {
	failTest("Got "+move.type+" instead of switch for jack");
}
passTest("Move using jack switch");

// 14. Test no-switch move
state = new shared.GameState(0,[{'color':0,'value':11}],
		[
		{'color':0,'position':2},
		{'color':1,'position':24,'locked':true},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
	failTest("Failed to non-switch and withdraw jack 1");
}
passTest("Move using non-switch jack withdrawn 1");

// 15. Test no-switch move
state = new shared.GameState(0,[{'color':0,'value':11}],
		[
		{'color':0,'position':2},
		{'color':1,'position':23},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
	failTest("Failed to non-switch and withdraw jack 2");
}
passTest("Move using non-switch jack withdrawn 2");

// 16. Test backward move
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':6},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'BACK')) {
	failTest("Failed to go back with four");
}
passTest("Move backward");

// 17. Test backward passing base
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':2},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'BACK') || (moves[0].target != 90)) {
	failTest("Failed to go back passing base, went to "+moves[0].target);
}
passTest("Move backward passing base");

// 18. Test backward blocked
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':4},
		{'color':0,'position':0,'locked':false},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'BACK')) {
	failTest("Failed to prevent going back blocked");
}
passTest("Move backward blocked");

// 19. Test backward blocked
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':26},
		{'color':1,'position':24,'locked':true},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
	failTest("Failed to prevent going back blocked by opponent");
}
passTest("Move backward blocked by opponent");

// 20. Test backward from rack
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':92},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
	failTest("Failed to prevent going back from rack");
}
passTest("Move backward blocked by racking");

// 21. Test yellow passing yellow base from 18
state = new shared.GameState(1,[{'color':0,'value':6}],
		[
		{'color':1,'position':18},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'MOVE')) {
	failTest("Failed to pass own base, no move");
}
if(moves[0].path[moves[0].path.length-1] != 28) {
	failTest("Failed to pass own base, not on 28");
}
passTest("Move passing own base");

// 22. Test eating with move
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':0},
		{'color':1,'position':6},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'MOVE')) {
	failTest("Failed to eat");
}
handled = state.handle(moves[0]);
if(! handled) {
	failTest("Failed to eat, move not handled");
}
if(state.pawns[0][1] != 6) {
	failTest("Failed to eat, move did not advance");
}
if(state.pawns[1][1] != -1) {
	failTest("Failed to eat, opponent not eaten");
}
passTest("Eating with move");

// 23. Eating by entering
state = new shared.GameState(0,[{'color':0,'value':13}],
		[
		{'color':0,'position':-1},
		{'color':1,'position':0},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'ENTER')) {
	failTest("Failed to eat by entering");
}
handled = state.handle(moves[0]);
if(! handled) {
	failTest("Failed to eat by entering, move not handled");
}
if(state.pawns[0][1] != 0) {
	failTest("Failed to eat by entering, move did not advance");
}
if(state.pawns[1][1] != -1) {
	failTest("Failed to eat by entering, opponent not eaten");
}
passTest("Eating by entering");

// 24. Eat by door move
state = new shared.GameState(0,[{'color':0,'value':8}],
		[
		{'color':0,'position':8},
		{'color':1,'position':24+8},
		]);
moves = state.computeMoves();
handled = false;
move = null;
for(i=0; i<moves.length; i++) {
    move = moves[i];
    if((move.type == 'DOOR') && (move.target == 24+8)) {
	handled = true;
	break;
    }
}
if(!handled) {
    failTest("Failed to eat using door");
}
handled = state.handle(moves[0]);
if(! handled) {
	failTest("Failed to eat using door, move not handled");
}
if(state.pawns[0][1] != 24+8) {
	failTest("Failed to eat using door, move did not advance");
}
if(state.pawns[1][1] != -1) {
	failTest("Failed to eat using door, opponent not eaten");
}
passTest("Eating using door");

// 25. Eat by back move
state = new shared.GameState(0,[{'color':0,'value':4}],
	[
	{'color':0,'position':4},
	{'color':1,'position':0},
	]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'BACK')) {
    failTest("Failed to eat by back move");
}
handled = state.handle(moves[0]);
if(! handled) {
    failTest("Failed to eat by back move, move not handled");
}
if(state.pawns[0][1] != 0) {
    failTest("Failed to eat by back move, move did not advance");
}
if(state.pawns[1][1] != -1) {
    failTest("Failed to eat by back move, opponent not eaten");
}
passTest("Eating by back move");

// 26. Test seven with single path
state = new shared.GameState(0,[{'color':0,'value':7}],
		[
		{'color':0,'position':0, 'locked':true},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'SEVEN')) {
	failTest("Failed to seven up");
}
handled = state.handle(moves[0]);
if(! handled) {
    failTest("Failed to seven up, move not handled");
}
if(state.pawns[0][1] != 7) {
    failTest("Failed to seven up, move did not advance", state);
}
if(state.pawns[0][2] != false) {
    failTest("Failed to seven up, move did not unlock");
}
passTest("Move seven up");

// 27. Test seven with two pawns
state = new shared.GameState(0,[{'color':0,'value':7}],
		[
		{'color':0,'position':0, 'locked':false},
		{'color':0,'position':24*2, 'locked':false},
		]);
moves = state.computeMoves();
if(moves.length != 8) {
    failTest("Failed to seven up using two pawns");
}
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SEVEN') {
	failTest("Failed to seven up using two pawns, not seven move");
    }
    state.handle(moves[i]);
    if((state.pawns[0][1] != 7-i) || (state.pawns[1][1] != 24*2+i)) {
	failTest("Failed to seven up using two pawns, at move #"+i);
    }
}
passTest("Move seven up two pawns");

// 28. Test seven eating
state = new shared.GameState(0,[{'color':0,'value':7}],
		[
		{'color':0,'position':0, 'locked':false},
		{'color':1,'position':3, 'locked':false},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'SEVEN')) {
    failTest("Failed to seven eat, wrong moves");
}
state.handle(moves[0]);
if((state.pawns[0][1] != 7) || (state.pawns[1][1] != -1)) {
    failTest("Failed to eat using seven");
}
passTest("Move seven eating");

// 29. Test with real-life seven
game = gameFromJson('{"creationDate":"2012-02-01T21:10:37.789Z","name":"Bataille","attendee":["Axelle","Roxane","Aurélie","Sébastien"],"player":[{"color":"0","name":"Axelle"},{"color":"1","name":"Roxane"},{"color":"2","name":"Aurélie"},{"color":"3","name":"Sébastien"}],"hand":[[],[],[{"color":1,"value":7}],[{"color":1,"value":8}]],"pawn":[[{"color":0,"position":95,"locked":false},{"color":0,"position":94,"locked":false},{"color":0,"position":84,"locked":false},{"color":0,"position":0,"locked":true}],[{"color":1,"position":23,"locked":false},{"color":1,"position":24,"locked":true},{"color":1,"position":90,"locked":false},{"color":1,"position":-1,"locked":false}],[{"color":2,"position":44,"locked":false},{"color":2,"position":47,"locked":false},{"color":2,"position":40,"locked":false},{"color":2,"position":39,"locked":false}],[{"color":3,"position":71,"locked":false},{"color":3,"position":-1,"locked":false},{"color":3,"position":70,"locked":false},{"color":3,"position":-1,"locked":false}]],"exchanged":[null,null,null,null],"deck":{"cards":[]},"phase":"turn","stack":[{"color":0,"value":11},{"color":0,"value":7},{"color":3,"value":11},{"color":0,"value":5},{"color":1,"value":12},{"color":3,"value":8},{"color":3,"value":10},{"color":2,"value":2},{"color":1,"value":11},{"color":0,"value":3},{"color":1,"value":2},{"color":3,"value":7},{"color":1,"value":4},{"color":3,"value":7},{"color":0,"value":10},{"color":3,"value":11},{"color":0,"value":12},{"color":3,"value":12},{"color":2,"value":12},{"color":0,"value":9},{"color":3,"value":4},{"color":0,"value":6},{"color":0,"value":7},{"color":2,"value":3},{"color":0,"value":3},{"color":1,"value":12},{"color":1,"value":10},{"color":1,"value":2},{"color":2,"value":2},{"color":0,"value":5},{"color":3,"value":3},{"color":1,"value":13},{"color":1,"value":9},{"color":0,"value":8},{"color":0,"value":13},{"color":1,"value":11},{"color":1,"value":5},{"color":1,"value":1},{"color":2,"value":4},{"color":3,"value":2},{"color":2,"value":5},{"color":1,"value":6},{"color":0,"value":1},{"color":3,"value":10},{"color":2,"value":7},{"color":3,"value":5},{"color":2,"value":9},{"color":3,"value":8},{"color":2,"value":13},{"color":3,"value":13},{"color":0,"value":4},{"color":2,"value":11},{"color":2,"value":8},{"color":2,"value":6},{"color":3,"value":1},{"color":2,"value":10},{"color":0,"value":2},{"color":3,"value":9},{"color":0,"value":11},{"color":3,"value":6},{"color":1,"value":3},{"color":2,"value":1}],"chat":[],"turn":110}');
state = game.toState();
moves = state.computeMoves();
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SEVEN') {
	failTest("Failed to perform real-life seven");
    }
    nonracked = 0;
    for(j=0; j<moves[i].pawns.length; j++) {
	pawn = moves[i].pawns[j];
	if((pawn[0] == 2) && (pawn[1] < 44) && (pawn[1] > 47)) {
	    nonracked++;
	}
    }
    if(nonracked <= 1) {
	found = true;
    }
}
if(!found) {
    failTest("Failed to found a three-racked seven move", moves);
}
passTest("Perform real-life seven");

// 30. Sample move with partner
state = new shared.GameState(0,[{'color':0,'value':6}],
		[
		{'color':0,'position':24*4-1, 'locked':false},
		{'color':0,'position':24*4-2, 'locked':false},
		{'color':0,'position':24*4-3, 'locked':false},
		{'color':0,'position':24*4-4, 'locked':false},
		{'color':2,'position':24*2, 'locked':true},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'MOVE')) {
    failTest("Failed to move with partner");
}
state.handle(moves[0]);
if(state.pawns[4][1] != (24*2+6)) {
    failTest("Failed to move with partner using 6");
}
passTest("Move with partner");

// 31. Seven finished with partner
state = new shared.GameState(0,[{'color':0,'value':7}],
		[
		{'color':0,'position':24*4-1, 'locked':false},
		{'color':0,'position':24*4-2, 'locked':false},
		{'color':0,'position':24*4-3, 'locked':false},
		{'color':0,'position':24*4-7, 'locked':false},
		{'color':2,'position':24*2, 'locked':true},
		]);
moves = state.computeMoves();
found = false;
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SEVEN') {
	failTest("Failed to seven up with partner");
    }
    if((moves[i].pawns[4][1] == 24*2+5) && (moves[i].pawns[4][2] == false)) {
	found = true;
	break;
    }
}
if(!found) {
    failTest("Failed to finish seven with partner");
}
passTest("Move seven finishing with partner");

// 32. Backward out of rack with partner
state = new shared.GameState(0,[{'color':0,'value':4}],
		[
		{'color':0,'position':24*4-1, 'locked':false},
		{'color':0,'position':24*4-2, 'locked':false},
		{'color':0,'position':24*4-3, 'locked':false},
		{'color':0,'position':24*4-4, 'locked':false},
		{'color':2,'position':24*2-4, 'locked':false},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
    failTest("Failed to prevent backward move with racked partner pawns");
}
passTest("No back from rack with partner");

// 33. Winning seven
state = new shared.GameState(0,[{'color':0,'value':7}],
		[
		{'color':0,'position':24*4-1, 'locked':false},
		{'color':0,'position':24*4-2, 'locked':false},
		{'color':0,'position':24*4-3, 'locked':false},
		{'color':0,'position':24*4-4, 'locked':false},
		{'color':2,'position':24*2-1, 'locked':false},
		{'color':2,'position':24*2-2, 'locked':false},
		{'color':2,'position':24*2-3, 'locked':false},
		{'color':2,'position':24*2-6, 'locked':false},
		]);
moves = state.computeMoves();
found = false;
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SEVEN') {
	failTest("Failed to compute winning seven, not a seven move");
    }
    if(moves[i].pawns[7][1] == 24*2-4) {
	found = true;
	break;
    }
}
if(!found) {
    failTest("Failed to compute winning seven");
}
passTest("Winning seven");

// 34. Exchange from parking
state = new shared.GameState(0,[{'color':0,'value':11}],
		[
		{'color':0,'position':24*4-1, 'locked':false},
		{'color':0,'position':24*4-2, 'locked':false},
		{'color':0,'position':24*4-3, 'locked':false},
		{'color':0,'position':24*4-4, 'locked':false},
		{'color':2,'position':24*2-1, 'locked':false},
		{'color':2,'position':24*2-2, 'locked':false},
		{'color':2,'position':24*2-3, 'locked':false},
		{'color':2,'position':24*2-6, 'locked':false},
		]);
moves = state.computeMoves();
if((moves.length != 1) || (moves[0].type != 'WITHDRAW')) {
    failTest("Failed to prevent switch with racked", moves);
}
passTest("No switch with racked, aka BigCat move");

// 35. Door using ace
state = new shared.GameState(0,[{'color':0,'value':1}],
		[ {'color':0,'position':8, 'locked':false}, ]);
moves = state.computeMoves();
found = false;
for(i=0; i<moves.length; i++) {
    if((moves[i].type == 'DOOR') && (moves[i].target == (24*2+8))) {
        found = true;
        break;
    }
}
if(!found) {
    failTest("Failed to use door with ace", moves);
}
passTest("Door using ace, aka AceMax move");

// 36. Door using king
state = new shared.GameState(0,[{'color':0,'value':13}],
		[ {'color':0,'position':8, 'locked':false}, ]);
moves = state.computeMoves();
found = false;
for(i=0; i<moves.length; i++) {
    if((moves[i].type == 'DOOR') && (moves[i].target == (24*2+8))) {
        found = true;
        break;
    }
}
if(!found) {
    failTest("Failed to use door with king", moves);
}
passTest("Door using ace, aka KingMax move");

// 37. Game just won
game = gameFromJson('{"creationDate":"2012-02-06T10:02:10.474Z","name":"PartieTest7 Gagne","attendee":["Jean-Paul","Eric","Sebastien","Pascale"],"player":[{"color":"0","name":"Jean-Paul"},{"color":"1","name":"Eric"},{"color":"2","name":"Sebastien"},{"color":"3","name":"Pascale"}],"hand":[[{"color":0,"value":2},{"color":0,"value":9}],[{"color":3,"value":6}],[{"color":1,"value":11}],[{"color":2,"value":3},{"color":2,"value":11}]],"pawn":[[{"color":0,"position":95,"locked":false},{"color":0,"position":94,"locked":false},{"color":0,"position":93,"locked":false},{"color":0,"position":92,"locked":false}],[{"color":1,"position":21,"locked":false},{"color":1,"position":23,"locked":false},{"color":1,"position":-1,"locked":false},{"color":1,"position":-1,"locked":false}],[{"color":2,"position":47,"locked":false},{"color":2,"position":46,"locked":false},{"color":2,"position":45,"locked":false},{"color":2,"position":44,"locked":false}],[{"color":3,"position":71,"locked":false},{"color":3,"position":68,"locked":false},{"color":3,"position":87,"locked":false},{"color":3,"position":-1,"locked":false}]],"exchanged":[null,null,null,null],"deck":{"cards":[{"color":0,"value":1},{"color":0,"value":2},{"color":0,"value":3},{"color":0,"value":4},{"color":0,"value":5},{"color":0,"value":6},{"color":0,"value":7},{"color":0,"value":8},{"color":0,"value":9},{"color":0,"value":10},{"color":0,"value":11},{"color":0,"value":12},{"color":0,"value":13},{"color":1,"value":1},{"color":1,"value":2},{"color":1,"value":3},{"color":1,"value":4},{"color":1,"value":5},{"color":1,"value":6},{"color":1,"value":7},{"color":1,"value":8},{"color":1,"value":9},{"color":1,"value":10},{"color":1,"value":11},{"color":1,"value":12},{"color":1,"value":13},{"color":2,"value":1},{"color":2,"value":2},{"color":2,"value":3},{"color":2,"value":4},{"color":2,"value":5},{"color":2,"value":6},{"color":2,"value":7},{"color":2,"value":8},{"color":2,"value":9},{"color":2,"value":10},{"color":2,"value":11},{"color":2,"value":12},{"color":2,"value":13},{"color":3,"value":1},{"color":3,"value":2},{"color":3,"value":3},{"color":3,"value":4},{"color":3,"value":5},{"color":3,"value":6},{"color":3,"value":7},{"color":3,"value":8},{"color":3,"value":9},{"color":3,"value":10},{"color":3,"value":11},{"color":3,"value":12},{"color":3,"value":13}]},"phase":"turn","stack":[{"color":2,"value":7}],"chat":[[1,"Beuh!....."],[3,"pas de bol..."],[2,"Ah !"],[3,"re -pas de bol"],[2,"Groumpf"],[1,"erreur de débutant"],[3,"re- re- pas de bol!!!!!!"],[2,"Hi hi hi"],[2,"Tu as utilise ton 4"],[3,"bon c\'est pas fini cette distribution de M....."],[2,"C epineux"],[2,"Arg, sur une base"],[1,"Ca va mieux hein Polou?"],[3,"je craque ......."],[2,"@Pascale : Mouarf"],[1,"YES Partner!"],[2,"Ouaiis !"],[3,"oh !!!!"],[2,"Zut"]],"turn":143}');
c = game.isWon();
if(c != 2) {
    failTest('Fail to detect game freshly won');
}
passTest("Game has a winner");

/**
 * Create a fresh game
 */
function newRegisteredGame() {
    var game = new shared.Game();
    game.join(0, 'zero', 0);
    game.join(1, 'one', 1);
    game.join(2, 'two', 2);
    game.join(3, 'three', 3);
    return game;
}

/**
 * Complexity boundary of 7 spread on 4 free pawns is 120
 */
var game, yoshi, move, moves, i;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 7);
game.hand[1][1] = new shared.Card(0, 7);
game.hand[1][2] = new shared.Card(0, 7);
game.hand[1][3] = new shared.Card(0, 7);
game.hand[1][4] = new shared.Card(0, 7);
game.pawn[1][0].position = 0;
game.pawn[1][1].position = 24;
game.pawn[1][2].position = 24*2;
game.pawn[1][3].position = 24*3;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SEVEN') {
	assertEquals("No seven played", 'SEVEN', moves[i].type);
    }
}
assertEquals("Complexity boundary of 7 is 120", shared.Complexity[7]*5, 
	moves.length);

/**
 * Complexity boundary of ace spread on 3 free pawns and one entering is 7
 */
var game, yoshi, move, moves, i;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 1);
game.hand[1][1] = new shared.Card(0, 1);
game.hand[1][2] = new shared.Card(0, 1);
game.hand[1][3] = new shared.Card(0, 1);
game.hand[1][4] = new shared.Card(0, 1);
game.pawn[1][0].position = 0;
game.pawn[1][1].position = -1;
game.pawn[1][2].position = 24*2;
game.pawn[1][3].position = 24*3;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if((moves[i].type != 'ENTER') && (moves[i].type != 'MOVE')) {
	assertEquals("No enter or move played", 'ENTER|MOVE', moves[i].type);
    }
}
assertEquals("Complexity boundary of Ace is 7", 7*5, moves.length);

/**
 * Complexity boundary of 8 spread on 3 door pawns and one ready to park is 7
 */
var game, yoshi, move, moves, i;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 8);
game.hand[1][1] = new shared.Card(0, 8);
game.hand[1][2] = new shared.Card(0, 8);
game.hand[1][3] = new shared.Card(0, 8);
game.hand[1][4] = new shared.Card(0, 8);
game.pawn[1][0].position = 23-8;
game.pawn[1][1].position = 24+8;
game.pawn[1][2].position = 24*2+8;
game.pawn[1][3].position = 24*3+8;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if((moves[i].type != 'DOOR') && (moves[i].type != 'MOVE')) {
	assertEquals("No door or move played", 'DOOR|MOVE', moves[i].type);
    }
}
assertEquals("Complexity boundary of 8 is 7", shared.Complexity[8]*5, 
	moves.length);

/**
 * Complexity boundary of King spread on 2 door pawns and one ready to park is 7
 */
var game, yoshi, move, moves, i;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 13);
game.hand[1][1] = new shared.Card(0, 13);
game.hand[1][2] = new shared.Card(0, 13);
game.hand[1][3] = new shared.Card(0, 13);
game.hand[1][4] = new shared.Card(0, 13);
game.pawn[1][0].position = 23-13;
game.pawn[1][1].position = 24+8;
game.pawn[1][2].position = 24*2;
game.pawn[1][3].position = 24*3+8;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if((moves[i].type != 'DOOR') && (moves[i].type != 'MOVE')) {
	assertEquals("No door or move played", 'DOOR|MOVE', moves[i].type);
    }
}
assertEquals("Complexity boundary of King is 7", shared.Complexity[13]*5, 
	moves.length);

/**
 * Complexity boundary of Ace spread on 2 door pawns and one ready to park is 11
 */
var game, yoshi, move, moves, i;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 1);
game.hand[1][1] = new shared.Card(0, 1);
game.hand[1][2] = new shared.Card(0, 1);
game.hand[1][3] = new shared.Card(0, 1);
game.hand[1][4] = new shared.Card(0, 1);
game.pawn[1][0].position = 23-14;
game.pawn[1][1].position = 24+8;
game.pawn[1][2].position = 24*2;
game.pawn[1][3].position = 24*3+8;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if((moves[i].type != 'DOOR') && (moves[i].type != 'MOVE')) {
	assertEquals("No door or move played", 'DOOR|MOVE', moves[i].type);
    }
}
assertEquals("Complexity boundary of Door Ace is 11", shared.Complexity[1]*5, 
	moves.length);

/**
 * Complexity boundary of Jack is 60
 */
var game, yoshi, move, moves, i,j;
game = newRegisteredGame();
for(i=0; i<4; i++) game.exchange(i,0);
for(i=0; i<5; i++) game.hand[1][i] = new shared.Card(0, 11);
for(i=0; i<16; i++) game.pawn[Math.floor(i/4)][i%4].position = i+1;
moves = game.toState().computeMoves();
for(i=0; i<moves.length; i++) {
    if(moves[i].type != 'SWITCH') {
	assertEquals("No switch move played", 'SWITCH', moves[i].type);
    }
}
assertEquals("Complexity boundary of Jack is 60", shared.Complexity[11]*5, 
	moves.length);

