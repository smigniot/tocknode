// ================================================================

/**
 * Base robot class
 */
function Robot() {
};
Robot.prototype.name = "Robot";

/**
 * Choose an action
 *
 * game: The current game
 */
Robot.prototype.choose = function(game) {
    if(game.isWon() != -1) {
	return null;
    } else if(game.phase == 'exchange') {
	return this.chooseGivenCard(game);
    } else if(game.phase == 'turn') {
	return this.chooseMove(game);
    }
};

/**
 * Choose a card number to give, from zero to hand length minus one
 *
 * game: The current game
 */
Robot.prototype.chooseGivenCard = function(game) {
    throw "Virtual function Robot::chooseGivenCard()";
};

/**
 * Choose a move to perform
 *
 * game: The current game
 */
Robot.prototype.chooseMove = function(game) {
    throw "Virtual function Robot::chooseMove()";
};

// ================================================================

/**
 * Timmy !
 */
function Timmy() {
};
Timmy.prototype = new Robot();
Timmy.prototype.name = "Timmy";

/**
 * Give a random card
 *
 * game: The current game
 */
Timmy.prototype.chooseGivenCard = function(game) {
    return Math.floor(Math.random()*game.hand[game.turn%4].length);
};

/**
 * Choose a random move
 *
 * game: The current game
 */
Timmy.prototype.chooseMove = function(game) {
    var moves = game.toState().computeMoves();
    return moves[Math.floor(Math.random()*moves.length)];
};

// ================================================================

/**
 * Yoshi
 */
function Yoshi() {
};
Yoshi.prototype = new Robot();
Yoshi.prototype.name = "Yoshi";

/**
 * Give a relevant card
 *
 * game: The current game
 */
Yoshi.prototype.chooseGivenCard = function(game) {
    var hand, enterings, i, card, mineracked, partnerracked, j, color;
    var pawn, rack;
    hand = game.hand[game.turn%4];
    enterings = [];
    for(i=0; i<hand.length; i++) {
	card = hand[i];
	if((card.value == 1) || (card.value == 13)) {
	    enterings.push(i);
	}
    }
    color = game.turn%4;
    mineracked = [];
    partnerracked = [];
    for(i=0; i<4; i++) {
	for(j=0; j<4; j++) {
	    pawn = game.pawn[i][j];
	    rack = ((pawn.color+3)%4)*24+20;
	    if((rack <= pawn.position) && (pawn.position <= (rack+3))) {
		if(pawn.color == color) {
		    mineracked.push(pawn);
		} else if(((pawn.color+2)%4) == color) {
		    partnerracked.push(pawn);
		}
	    }
	}
    }
    if((partnerracked.length < 4) && (enterings.length >= 2)) {
	return enterings[1];
    }
    if((partnerracked.length < 4) && (mineracked.length >= 4) 
	    && (enterings.length >= 1)) {
	return enterings[0];
    }
    return 0;
};

/**
 * Choose a relevant move
 *
 * game: The current game
 */
Yoshi.prototype.chooseMove = function(game) {
    var moves, enterings, i, move, rackings, before, after;
    var rackedbefore, rackedafter, racked, distance, bydistance;
    var best, bestdist, descendants, j, rackeddescendant, twodistance;
    var twiceafter, note, dist2, bestdist2;
    before = game.toState();
    moves = before.computeMoves();
    enterings = [];
    rackings = [];
    twodistance = [];
    bydistance = [];
    for(i=0; i<moves.length; i++) {
	move = moves[i];
	if(move.type == 'ENTER') {
	    enterings.push(move);
	} 
	after = before.simulate(move);
	rackedbefore = this.countRacked(before);
	rackedafter = this.countRacked(after);
	if(rackedafter > rackedbefore) {
	    rackings.push([rackedafter-rackedbefore, move]);
	}
        distance = this.getDistance(after);
        bydistance.push([distance, move]);
	descendants = after.computeMoves();
	for(j=0; j<descendants.length; j++) {
	    twiceafter = after.simulate(descendants[j]);
	    rackeddescendant = this.countRacked(twiceafter);
	    if(rackeddescendant > rackedbefore) {
		twodistance.push([rackeddescendant-rackedbefore, 
			rackedafter-rackedbefore, move]);
	    }
	}
    }
    if(enterings.length >= 1) {
	return enterings[0];
    }
    if(rackings.length >= 1) {
	best = null;
	note = 0;
	for(i=0; i<rackings.length; i++) {
	    racked = rackings[i][0];
	    move = rackings[i][1];
	    if(racked > note) {
		best = move;
		note = racked;
	    }
	}
	return best;
    }
    if(twodistance.length > 0) {
        best = null;
        bestdist = 0;
	bestdist2 = 0;
        for(i=0; i<twodistance.length; i++) {
            distance = twodistance[i][0];
            dist2 = twodistance[i][1];
            move = twodistance[i][2];
	    if((best == null) || (distance < bestdist) || (
			(distance == bestdist)&& (dist2 < bestdist2))) {
                bestdist = distance;
                bestdist2 = dist2;
                best = move;
            }
        }
        return best;
    }
    if(bydistance.length > 0) {
        best = null;
        bestdist = 0;
        for(i=0; i<bydistance.length; i++) {
            distance = bydistance[i][0];
            move = bydistance[i][1];
	    if((best == null) || (distance < bestdist)) {
                bestdist = distance;
                best = move;
            }
        }
        return best;
    }
    return moves[0];
};

/**
 * Compute a distance from racking.
 *
 * Self and partner pawns distance is distance from racking
 * Opponent pawns distance is 96-distance from racking
 * The result is the sum
 *
 * state: The state
 */
Yoshi.prototype.getDistance = function(state) {
    var i, pawn, rack, delta, team, distance;
    distance = 0;
    for(i=0; i<state.pawns.length; i++) {
        pawn = state.pawns[i];
        team = (state.player%2) == (pawn[0]%2);
        rack = ((pawn[0]+3)%4)*24+20;
        if(pawn[1] == -1) {
            if(team) {
                distance += 96*2;
            } else {
                distance -= 96;
            }
        } else {
            delta = (96+rack-pawn[1])%96;
            if(team) {
                distance += delta;
            } else {
                distance += 96-delta;
            }
        }
    }
    return distance;
};

/**
 * Count racked pawns
 *
 * state: The state
 */
Yoshi.prototype.countRacked = function(state) {
    var i, pawn, rack, count;
    count = 0;
    for(i=0; i<state.pawns.length; i++) {
	pawn = state.pawns[i];
	rack = ((pawn[0]+3)%4)*24+20;
	if((rack <= pawn[1]) && (pawn[1] <= (rack+3))) {
	    count++;
	}
    }
    return count;
};


// ================================================================

/**
 * Module exports.
 */
if(!(typeof exports === typeof undefined)) {
    exports.Timmy = Timmy;
    exports.Yoshi = Yoshi;
}
