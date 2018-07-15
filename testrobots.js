var util = require("util");
var fs = require("fs");
var shared = require("./shared.js");
var robots = require("./robots.js");
var json2 = require("./json2.js");

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
 * Return a status text, racked pawns first and out pawns count then.
 *
 * game: The game
 */
function getRacked(game) {
    var result = ".... .... .... ....";
    var i, pawn, p, rs, re;
    for(i=0; i<4; i++) {
	for(j=0; j<4; j++) {
	    pawn = game.pawn[i][j];
	    p = pawn.position;
	    rs = ((pawn.color+3)%4)*24+20;
	    re = ((pawn.color+3)%4)*24+23;
	    if((rs <= p) && (p <= re)) {
		n = i*5+(p-rs);
		result = result.substring(0,n)+'X'+result.substring(n+1);
	    }
	}
    }
    var out = [0,0,0,0];
    for(i=0; i<4; i++) {
	for(j=0; j<4; j++) {
	    pawn = game.pawn[i][j];
	    if(pawn.position != -1) {
		out[pawn.color]++;
	    }
	}
    }
    for(i=0; i<4; i++) {
	result += " "+out[i];
    }
    return result;
};

function applyMove(move, game) {
    var state, i, moves, candidate, json;
    state = game.toState();
    moves = state.computeMoves();
    json = JSON.stringify(move);
    for(i=0; i<moves.length; i++) {
	candidate = moves[i];
	if(JSON.stringify(candidate) == json) {
	    state.handle(candidate);
	    game.applyState(state);
	    game.stackCard(move.card);
	    return;
	}
    }
    throw "Invalid move applied";
}

var checkcount = 1;
function assertEquals(message, expected, actual) {
    var text = ""+(checkcount++)+":"+message;
    if(expected == actual) {
	util.log("[PASS] "+text);
    } else {
	util.log("[FAIL] "+text+", expected = ["+expected
		+"], actual = ["+actual+"]");
    }
}

/**
 * Yoshi ace giving check
 */
var game, yoshi, card;
game = newRegisteredGame();
game.hand[0][0] = new shared.Card(0, 1);
game.hand[0][1] = new shared.Card(1, 1);
game.hand[2][0] = new shared.Card(0, 10);
game.hand[2][1] = new shared.Card(1, 11);
game.hand[2][2] = new shared.Card(1, 12);
game.hand[2][3] = new shared.Card(0, 4);
game.hand[2][4] = new shared.Card(0, 6);
yoshi = new robots.Yoshi();
card = yoshi.choose(game);
assertEquals("Yoshi gives a superfluous Ace", 1, card);

/**
 * Yoshi king giving check
 */
var game, yoshi, card;
game = newRegisteredGame();
game.hand[0][0] = new shared.Card(1, 1);
game.hand[0][1] = new shared.Card(2, 13);
game.hand[2][0] = new shared.Card(0, 10);
game.hand[2][1] = new shared.Card(1, 11);
game.hand[2][2] = new shared.Card(1, 12);
game.hand[2][3] = new shared.Card(0, 4);
game.hand[2][4] = new shared.Card(0, 6);
yoshi = new robots.Yoshi();
card = yoshi.choose(game);
assertEquals("Yoshi gives a superfluous King", 1, card);

/**
 * Yoshi king giving when racked check
 */
var game, yoshi, card;
game = newRegisteredGame();
game.hand[0][0] = new shared.Card(0, 10);
game.hand[0][1] = new shared.Card(1, 11);
game.hand[0][2] = new shared.Card(1, 12);
game.hand[0][3] = new shared.Card(0, 13);
game.hand[0][4] = new shared.Card(0, 4);
game.pawn[0][0].position = 24*3+20;
game.pawn[0][1].position = 24*3+21;
game.pawn[0][2].position = 24*3+22;
game.pawn[0][3].position = 24*3+23;
yoshi = new robots.Yoshi();
card = yoshi.choose(game);
assertEquals("Yoshi gives a superfluous King when pawns racked", 3, card);

/**
 * Yoshi play entering by default
 */
var game, yoshi, move;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 13);
game.hand[1][1] = new shared.Card(0, 5);
game.hand[1][2] = new shared.Card(1, 5);
game.hand[1][3] = new shared.Card(2, 5);
game.hand[1][4] = new shared.Card(3, 5);
game.pawn[1][0].position = 2;
yoshi = new robots.Yoshi();
move = yoshi.choose(game);
assertEquals("Yoshi plays entering by default", '{"type":"ENTER","card":[0,13]}', 
	JSON.stringify(move));

/**
 * Yoshi play racking by default
 */
var game, yoshi, move;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 13);
game.hand[1][1] = new shared.Card(0, 5);
game.hand[1][2] = new shared.Card(1, 12);
game.hand[1][3] = new shared.Card(2, 12);
game.hand[1][4] = new shared.Card(3, 12);
game.pawn[1][0].position = 16;
game.pawn[1][1].position = 24;
yoshi = new robots.Yoshi();
move = yoshi.choose(game);
assertEquals("Yoshi plays racking by default", 
	'{"type":"MOVE","pawn":[1,16,false],"card":[0,5],"distance":5,"path":[17,18,20,21,22]}', 
	JSON.stringify(move));

/**
 * Yoshi play best racking by default
 */
var game, yoshi, move;
game = newRegisteredGame();
game.exchange(0,0);
game.exchange(1,0);
game.exchange(2,0);
game.exchange(3,0);
game.hand[1][0] = new shared.Card(0, 13);
game.hand[1][1] = new shared.Card(0, 7);
game.hand[1][2] = new shared.Card(1, 3);
game.hand[1][3] = new shared.Card(2, 12);
game.hand[1][4] = new shared.Card(3, 12);
game.pawn[1][0].position = 18;
game.pawn[1][1].position = 14;
game.pawn[1][2].position = 24;
yoshi = new robots.Yoshi();
move = yoshi.choose(game);
// Rack both 18 and 14 to 21 and 20
assertEquals("Yoshi plays best racking by default", 
	'{"type":"SEVEN","card":[0,7],"pawns":[[0,-1,false],[0,-1,false],[0,-1,false],[0,-1,false],[1,21,false],[1,20,false],[1,24,false],[1,-1,false],[2,-1,false],[2,-1,false],[2,-1,false],[2,-1,false],[3,-1,false],[3,-1,false],[3,-1,false],[3,-1,false]],"oldpawns":[[0,-1,false],[0,-1,false],[0,-1,false],[0,-1,false],[1,18,false],[1,14,false],[1,24,false],[1,-1,false],[2,-1,false],[2,-1,false],[2,-1,false],[2,-1,false],[3,-1,false],[3,-1,false],[3,-1,false],[3,-1,false]]}',
	JSON.stringify(move));

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

function gameFromFile(name) {
	return gameFromJson(fs.readFileSync(name));
}

/**
 * Yoshi plays entering 2 cards combo
 */
var game, yoshi;
game = gameFromFile("testdata\\green_plays_6.tock");
yoshi = new robots.Yoshi();
move = yoshi.choose(game);
assertEquals("Yoshi plays entering 2 cards combo", 
	'{"type":"MOVE","pawn":[0,84,false],"card":[3,5],"distance":5,"path":[85,86,87,88,89]}',
	JSON.stringify(move));

/**
 * Play a single game with the provided robot at every place
 *
 * robot: The robot
 */
function oneGame(robot) {
    var game;
    game = newRegisteredGame();
    while(game.isWon() == -1) {
	if(game.phase == 'exchange') {
	    game.exchange(game.turn%4, robot.choose(game));
	} else if(game.phase == 'turn') {
	    applyMove(robot.choose(game), game);
	}
    }
    return game.turn;
}

/**
 * Robots statistics
 */
var robots, robot, i, j, mx, length, start, end, duration;
mx = 10;
robots = [new robots.Timmy(), new robots.Yoshi()];
for(i=0; i<robots.length; i++) {
    robot = robots[i];
    length = 0;
    start = new Date();
    for(j=0; j<mx; j++) {
	length += oneGame(robot);
    }
    end = new Date();
    length = Math.floor(length/mx);
    duration = Math.floor((end-start)/mx/50)/20;
    assertEquals("Robot "+robot.name+" lasts "+length+" in "+duration+"s", 
	    length, length);
}

