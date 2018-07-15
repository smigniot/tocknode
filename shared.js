var COLOR = 0;
var VALUE = 1;
var POSITION = 1;
var LOCKED = 2;

/**
 * A game state.
 *
 * player: The player color
 * hand: A list of {color:int, value:int} card objects
 * pawn: A list of {color:int, position:int, locked:boolean} pawn objects
 */
function GameState(player, hand, pawns) {
	var i;
	this.player = player;
	this.hand = [];
	for(i=0; i<hand.length; i++) {
		this.hand.push([hand[i].color, hand[i].value]);
	}
	this.pawns = [];
	for(i=0; i<pawns.length; i++) {
		this.pawns.push([pawns[i].color, pawns[i].position, 
				pawns[i].locked]);
	}
};

/**
 * Compute possible moves
 */
GameState.prototype.computeMoves = function() {
	var i, card, moves;
	moves = [];
	for(i=0; i<this.hand.length; i++) {
		this.computeCardMoves(this.hand[i], moves);
	}
	if(!moves.length) {
		for(i=0; i<this.hand.length; i++) {
			moves.push(new WithdrawMove(this.hand[i]));
		}
	}
	return moves;
};

/**
 * Compute moves for the given card
 *
 * card: The card
 * moves: The moves array to extend
 */
GameState.prototype.computeCardMoves = function(card, moves) {
	var value = card[VALUE];
	switch(value) {
		case 1:
			this.computeEnteringMove(card, moves);
			this.computeMovingMove(card, 1, moves);
			this.computeMovingMove(card, 14, moves);
			this.computeDoorMoves(card, moves);
			break;
		case 13:
			this.computeEnteringMove(card, moves);
			this.computeMovingMove(card, 13, moves);
			this.computeDoorMoves(card, moves);
			break;
		case 2:
		case 3:
		case 5:
		case 6:
		case 9:
		case 10:
		case 12:
			this.computeMovingMove(card, value, moves);
			break;
		case 4:
			this.computeBackwardMove(card, moves);
			break;
		case 7:
			this.computeSevenMoves(card, moves);
			break;
		case 8:
			this.computeDoorMoves(card, moves);
			this.computeMovingMove(card, 8, moves);
			break;
		case 11:
			this.computeSwitchMoves(card, moves);
			break;
	}
};

/**
 * Return true if pawn is movable
 *
 * pawn: The pawn
 * pawns: The pawns to work on
 */
GameState.prototype.isMovable = function(pawn, pawns) {
    var i, p2, a, b;
    if(arguments.length < 2) {
	pawns = this.pawns;
    }
    if(this.player == pawn[COLOR]) {
	return true;
    }
    if(((this.player+2)%4) != pawn[COLOR]) {
	return false;
    }
    a = ((this.player+3)%4)*24+20;
    b = a+3;
    for(i=0; i<pawns.length; i++) {
	p2 = pawns[i];
	if(p2[COLOR] == this.player) { // mine
	    if(! ((p2[POSITION] >= a) && (p2[POSITION] <= b))) { // not in rack
		return false;
	    }
	}
    }
    return true;
};

/**
 * Compute seven moves.
 *
 * card: The card
 * moves: The moves array to extend
 */
GameState.prototype.computeSevenMoves = function(card, moves) {
    var trails, i, j, k, p, trail, distance, newtrails;
    var pawn, newtrail, next, killed, seen, hash;
    trails = [slice2(this.pawns)];
    distance = 7;
    while(distance>0) {
	newtrails = [];
	seen = new Object();
	for(i=0; i<trails.length; i++) {
	    trail = trails[i];
	    if(this.allRacked(trail)) {
		newtrails.push(trail);
	    } else {
		for(j=0; j<trail.length; j++) {
		    pawn = trail[j];
		    if(this.isMovable(pawn, trail) && (pawn[POSITION]!= -1)) {
			next = this.whereFrom(pawn, pawn[POSITION], trail);
			for(k=0; k<next.length; k++) {
			    p = next[k];
			    newtrail = slice2(trail);
			    killed = this.getPawnAt(p, newtrail);
			    newtrail[j][POSITION] = p;
			    newtrail[j][LOCKED] = false;
			    if(killed) {
				killed[POSITION] = -1;
			    }
			    hash = serializeTrail(newtrail);
			    if(!(hash in seen)) {
				newtrails.push(newtrail);
				seen[hash] = true;
			    }
			}
		    }
		}
	    }
	}
	trails = newtrails;
	distance--;
    }
    for(i=0; i<trails.length; i++) {
	trail = trails[i];
	moves.push(new SevenMove(card, trail, this.pawns));
    }
};

/**
 * Return true if all pawns are racked, including partner pawns
 *
 * pawns: The pawns
 */
GameState.prototype.allRacked = function(pawns) {
    var i,color,pawn,p,inrack,n;
    for(i=0; i<pawns.length; i++) {
	pawn = pawns[i];
	color = pawn[COLOR];
	p = pawn[POSITION];
	if((color%2) == (this.player%2)) {
	    n = ((color+3)%4)*24+20;
	    inrack = (p>=n) && (p<=n+3);
	    if(!inrack) {
		return false;
	    }
	}
    }
    return true;
};

/**
 * Slice at depth 2
 *
 * array: The array
 */
function slice2(array) {
    var i, result;
    result = [];
    for(i=0; i<array.length; i++) {
	result.push(array[i].slice());
    }
    return result;
}

/**
 * Serialize the trail for duplicate elimination
 *
 * trail: The trail
 */
function serializeTrail(trail) {
    var i, result, pawn;
    result = "|";
    for(i=0; i<trail.length; i++) {
	pawn = trail[i];
	result += pawn[COLOR]+",";
	result += pawn[POSITION]+",";
	result += ((pawn[LOCKED])?"L":"")+"|";
    }
    return result;
}

/**
 * Debug function.
 *
 * message: The message to log during tests
 */
function $log(message) {
    if(require) {
	require('util').log(message);
    }
};

/**
 * Compute entering move, with ace or king.
 *
 * card: The card
 * moves: The moves array to extend
 */
GameState.prototype.computeEnteringMove = function(card, moves) {
	var base = this.player*24;
	var squatter = this.getPawnAt(base);
	var outpawn = this.getOutPawn(this.player);
	if(outpawn != undefined) {
		if((squatter == undefined) || 
				(squatter[COLOR] != this.player)) {
			moves.push(new EnteringMove(card));
		}
	}
};

/**
 * Compute moving move, at a provided distance
 *
 * card: The card
 * distance: The distance to walk
 * moves: The moves array to extend
 */
GameState.prototype.computeMovingMove = function(card, distance, moves) {
    var i, pawn, pathes,j;
    for(i=0; i<this.pawns.length; i++) {
	pawn = this.pawns[i];
	if(this.isMovable(pawn) && (pawn[POSITION] != -1)) {
	    pathes = this.computePathes(pawn, distance);
	    for(j=0; j<pathes.length; j++) {
		moves.push(new MovingMove(pawn, card, distance, 
			    pathes[j]));
	    }
	}
    }
};

/**
 * Return available path moves to provided distance
 *
 * pawn: The moved pawn
 * distance: The distance
 */
GameState.prototype.computePathes = function(pawn, distance) {
	var i,solutions,next,p,j,newpath,newsolutions;
	next = this.whereFrom(pawn, pawn[POSITION]);
	// [5]
	if(next.length == 0) {
		return [];
	}
	solutions = [];
	for(i=0; i<next.length; i++) {
	    solutions.push([next[i]]);
	}
	// [[5]], 14
	while((--distance)>0) {
		newsolutions = [];
		// [[5]], []
		for(i=0; i<solutions.length; i++) {
			path = solutions[i];
			// [5], []
			// [5,6]
			next = this.whereFrom(pawn, path[path.length-1]);
			// [6]
			// [7]
			for(j=0; j<next.length; j++) {
				newpath = path.slice();
				// [5]
				// [5,6]
				newpath.push(next[j]);
				// [5,6]
				// [5,6,7]
				newsolutions.push(newpath);
				// [[5,6]]
				// [[5,6,7]]
			}
		}
		solutions = newsolutions;
		// [[5,6]]
		// [[5,6,7]]
	}
	return solutions;
};

/**
 * Compute where to go from the provided position, handling blockers
 *
 * pawn: The moving pawn
 * position: The start position
 * pawns: The current pawn positions
 */
GameState.prototype.whereFrom = function(pawn, position, pawns) {
	var i,result,p,squatter;
	if(arguments.length <3) {
	    pawns = this.pawns;
	}
	candidates = this.simpleWhereFrom(pawn[COLOR], position);
	result = [];
	for(i=0; i<candidates.length; i++) {
		p = candidates[i];
		squatter = this.getPawnAt(p, pawns);
		if((squatter == undefined) || (
			(!squatter[LOCKED]) &&
			(squatter[COLOR] != pawn[COLOR]))) {
			result.push(p);
		}
	}
	return result;
};

/**
 * Compute where to go from the provided position
 *
 * color: The moving pawn color
 * position: The start position
 */
GameState.prototype.simpleWhereFrom = function(color, position) {
	var p,q,color;
	p = position % 24;
	q = Math.floor(position/24);
	if(p == 18) {
		// Goto 19 or 20
		if(((color+3)%4) == q) {
			return [position+1, position+2];
		} else {
			return [position+1];
		}
	} else if(p == 19) {
		// Goto 24
		return [(position+5)%(24*4)];
	} else if(p == 23) {
		// Dead end
		return [];
	} else {
		// Goto p+1
		return [position+1]
	}
	return [];
};

/**
 * Complete moves when landing on a door
 *
 * card: The height card
 * moves: The moves
 */
GameState.prototype.computeDoorMoves = function(card, moves) {
	var i,pawn;
	for(i=0; i<this.pawns.length; i++) {
		pawn = this.pawns[i];
		if(this.isMovable(pawn) && (pawn[POSITION] != -1)) {
			this.doComputeDoorMoves(card, pawn, moves);
		}
	}
};

/**
 * Complete moves with a provided pawn landing on a door
 *
 * card: The card
 * pawn: The pawn
 * moves: The moves
 */
GameState.prototype.doComputeDoorMoves = function(card, pawn, moves) {
	var p,i,q,squatter;
	p = pawn[POSITION];
	if((p%24) != 8) {
		return;
	}
	for(i=0; i<4; i++) {
		q = i*24+8;
		if(q != p) {
			squatter = this.getPawnAt(q);
			if((squatter == undefined) ||
					(squatter[COLOR] != pawn[COLOR])) {
				moves.push(new DoorMove(pawn, card, q));
			}
		}
	}
};

/**
 * Return the pawn at position or undefined
 *
 * position: The position
 * pawns: The current pawns or undefined
 */
GameState.prototype.getPawnAt = function(position, pawns) {
	var i;
	if(arguments.length < 2) {
	    pawns = this.pawns;
	}
	for(i=0; i<pawns.length; i++) {
		if(pawns[i][POSITION] == position) {
			return pawns[i];
		}
	}
};

/**
 * Return a pawn out of the board for the given color or undefined
 *
 * color: The color
 */
GameState.prototype.getOutPawn = function(color) {
    var i;
    for(i=0; i<this.pawns.length; i++) {
	if(this.isMovable(this.pawns[i]) && 
		(this.pawns[i][POSITION] == -1)) {
	    return this.pawns[i];
	}
    }
};

/**
 * Complete moves with switching using jack
 *
 * card: The jack card
 * moves: The moves
 */
GameState.prototype.computeSwitchMoves = function(card, moves) {
	var i,color,rs,re,pawn,p;
	for(i=0; i<this.pawns.length; i++) {
		pawn = this.pawns[i];
		p = pawn[POSITION];
                color = pawn[COLOR];
                rs = ((color+3)%4)*24+20;
                re = ((color+3)%4)*24+23;
		if(this.isMovable(pawn) && (p != -1) && !(
				(p >= rs) && (p <=re))) {
			this.doComputeSwitchMoves(card, pawn, moves);
		}
	}
};

/**
 * Complete moves with switching using jack
 *
 * card: The jack card
 * pawn: The pawn
 * moves: The moves
 */
GameState.prototype.doComputeSwitchMoves = function(card, pawn, moves) {
	var exchanged,rs,re, possible;
	for(i=0; i<this.pawns.length; i++) {
		exchanged = this.pawns[i];
		rs = ((exchanged[COLOR]+3)%4)*24+20;
		re = ((exchanged[COLOR]+3)%4)*24+23;
		ep = exchanged[POSITION];
		possible = true;
		possible &= (exchanged != pawn);
		possible &= !(ep == -1);
		possible &= !(exchanged[LOCKED]);
		possible &= !((ep >= rs) && (ep <= re));
		if(possible) {
			moves.push(new SwitchMove(pawn, card, exchanged));
		}
	}
};

/**
 * Complete moves with backward four
 *
 * card: The four card
 * moves: The moves
 */
GameState.prototype.computeBackwardMove = function(card, moves) {
    var i,color,rs,re,pawn,p;
    for(i=0; i<this.pawns.length; i++) {
	pawn = this.pawns[i];
	p = pawn[POSITION];
        rs = ((pawn[COLOR]+3)%4)*24+20;
        re = ((pawn[COLOR]+3)%4)*24+23;
	if(this.isMovable(pawn) && (p != -1) && !(
		    (p >= rs) && (p <=re))) {
	    this.doComputeBackwardMove(card, pawn, moves);
	}
    }
};

/**
 * Complete moves with backward four
 *
 * card: The four card
 * pawn: The pawn
 * moves: The moves
 */
GameState.prototype.doComputeBackwardMove = function(card, pawn, moves) {
	var p,q,squatter;
	p = pawn[POSITION];
	for(i=0; i<4; i++) {
		q = p-1;
		if((q+24)%24 == 23) {
			q = ((Math.floor(p/24)-1+4)%4)*24+19;
		}
		squatter = this.getPawnAt(q);
		if((squatter != undefined) && (squatter[LOCKED] ||
					squatter[COLOR] == pawn[COLOR])) {
			return;
		}
		p = q;
	}
	moves.push(new BackwardMove(pawn, card, p));
};

/**
 * Return a card representation
 *
 * card: The card
 */
function cardToString(card) {
	return ['A','2','3','4','5','6','7','8','9','10','V','D','R'][
		card[VALUE]-1]+['P','C','Q','T'][card[COLOR]];
}

/**
 * Return a pawn representation
 *
 * pawn: The pawn
 */
function pawnToString(pawn) {
	return ['V','J','R','B'][pawn[COLOR]]+pawn[POSITION]+((
			pawn[LOCKED])?"L":"");
}

/**
 * Return a path representation
 *
 * pawn: The pawn
 * path: The walked path
 */
function pathToString(pawn, path) {
	var i,result;
	result = pawn[POSITION];
	for(i=0; i<path.length; i++) {
		result += ",";
		result += path[i];
	}
	return result;
}

/**
 * A card withdrawal move.
 *
 * card: The card
 */
function WithdrawMove(card) {
	this.type = "WITHDRAW";
	this.card = card;
};
/**
 * Return a string representation
 */
WithdrawMove.prototype.toString = function() {
	return this.type+"["+cardToString(this.card)+"]";
};
/**
 * Return a string representation
 */
WithdrawMove.prototype.getDescription = function() {
	return "Défosser "+cardToString(this.card);
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
WithdrawMove.prototype.impacts = function(color, index, game) {
    return false;
};

/**
 * A pawn entering move
 *
 * card: The card
 */
function EnteringMove(card) {
	this.type = "ENTER";
	this.card = card;
};
/**
 * Return a string representation
 */
EnteringMove.prototype.toString = function() {
	return this.type+"["+cardToString(this.card)+"]";
};
/**
 * Return a string representation
 */
EnteringMove.prototype.getDescription = function() {
    return "Sortir un pion";
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
EnteringMove.prototype.impacts = function(color, index, game) {
    return false;
};

/**
 * A pawn moving move
 *
 * pawn: The pawn
 * card: The card
 * distance: The distance
 * path: The path
 */
function MovingMove(pawn, card, distance, path) {
	this.type = "MOVE";
	this.pawn = pawn;
 	this.card = card;
 	this.distance = distance;
 	this.path = path.slice();
};
/**
 * Return a string representation
 */
MovingMove.prototype.toString = function() {
	return this.type+"["+pawnToString(this.pawn)
		+"/"+cardToString(this.card)
		+"/"+pathToString(this.pawn,this.path)
		+"]";
};
/**
 * Return a string representation
 */
MovingMove.prototype.getDescription = function() {
    var p1 = positionNotation(this.pawn[POSITION]);
    var p2 = positionNotation(this.path[this.path.length-1]);
    return "Déplacement de "+p1+" vers "+p2;
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
MovingMove.prototype.impacts = function(color, index, game) {
    var pawn = game.pawn[color][index];
    return ((pawn.color == this.pawn[COLOR]) && 
	    (pawn.position == this.pawn[POSITION]));
};

/**
 * A door teleportation move
 *
 * pawn: The pawn
 * card: The card
 * target: The target
 */
function DoorMove(pawn, card, target) {
	this.type = "DOOR";
	this.pawn = pawn;
 	this.card = card;
 	this.target = target;
};
/**
 * Return a string representation
 */
DoorMove.prototype.toString = function() {
	return this.type+"["+pawnToString(this.pawn)
		+"/"+cardToString(this.card)
		+"/"+this.target
		+"]";
};
/**
 * Return a string representation
 */
DoorMove.prototype.getDescription = function() {
    var p1 = positionNotation(this.pawn[POSITION]);
    var p2 = positionNotation(this.target);
    return "Porte de "+p1+" vers "+p2;
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
DoorMove.prototype.impacts = function(color, index, game) {
    var pawn = game.pawn[color][index];
    return ((pawn.color == this.pawn[COLOR]) && 
	    (pawn.position == this.pawn[POSITION]));
};

/**
 * Return the position notation
 *
 * p: The position
 */
function positionNotation(p) {
    var n = p%24;
    if(n>19) {
	return "P"+(n-1);
    }
    return ['V','J','R','B'][Math.floor(p/24)]+n;
}

/**
 * A switching move
 *
 * pawn: The pawn
 * card: The card
 * exchanged: The exchanged pawn
 */
function SwitchMove(pawn, card, exchanged) {
	this.type = "SWITCH";
	this.pawn = pawn;
 	this.card = card;
 	this.exchanged = exchanged;
};
/**
 * Return a string representation
 */
SwitchMove.prototype.toString = function() {
	return this.type+"["+pawnToString(this.pawn)
		+"/"+cardToString(this.card)
		+"/"+pawnToString(this.exchanged)
		+"]";
};
/**
 * Return a string representation
 */
SwitchMove.prototype.getDescription = function() {
    var p1 = positionNotation(this.pawn[POSITION]);
    var p2 = positionNotation(this.exchanged[POSITION]);
    return "Echange "+p1+" avec "+p2;
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
SwitchMove.prototype.impacts = function(color, index, game) {
    var pawn = game.pawn[color][index];
    return (
	    ((pawn.color == this.exchanged[COLOR]) && 
	     (pawn.position == this.exchanged[POSITION])) ||
	    ((pawn.color == this.pawn[COLOR]) && 
	     (pawn.position == this.pawn[POSITION])) 
	   );
};

/**
 * A backward move
 *
 * pawn: The pawn
 * card: The card
 * target: The target position
 */
function BackwardMove(pawn, card, target) {
	this.type = "BACK";
	this.pawn = pawn;
 	this.card = card;
 	this.target = target;
};
/**
 * Return a string representation
 */
BackwardMove.prototype.toString = function() {
	return this.type+"["+pawnToString(this.pawn)
		+"/"+cardToString(this.card)
		+"/"+this.target
		+"]";
};
/**
 * Return a string representation
 */
BackwardMove.prototype.getDescription = function() {
    var p1 = positionNotation(this.pawn[POSITION]);
    var p2 = positionNotation(this.target);
    return "Reculer de "+p1+" en "+p2;
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
BackwardMove.prototype.impacts = function(color, index, game) {
    var pawn = game.pawn[color][index];
    return ((pawn.color == this.pawn[COLOR]) && 
	    (pawn.position == this.pawn[POSITION])) ;
};

/**
 * A seven move
 *
 * card: The card
 * pawns: The final pawn positions
 */
function SevenMove(card, pawns, oldpawns) {
	this.type = "SEVEN";
	this.card = card;
 	this.pawns = pawns;
 	this.oldpawns = oldpawns;
};
/**
 * Return a string representation
 */
SevenMove.prototype.toString = function() {
    var i, result, sep;
    result = this.type+"["+cardToString(this.card);
    for(i=0; i<this.pawns.length; i++) {
	result += "/" + pawnToString(this.pawns[i]);
    }
    sep = "|";
    for(i=0; i<this.oldpawns.length; i++) {
	result += sep + pawnToString(this.oldpawns[i]);
	sep = "/";
    }
    result += "]";
    return result;
};
/**
 * Return a string representation
 */
SevenMove.prototype.getDescription = function() {
    var result, i, p0, p1;
    result = "Sept";
    for(i=0; i<this.pawns.length; i++) {
        p0 = this.oldpawns[i][POSITION];
        p1 = this.pawns[i][POSITION];
	if((p1 != -1) && (p1 != p0)) {
	    result += " "+positionNotation(p1);
	}
    }
    return result;
};
/**
 * Return true if move impacts the pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
SevenMove.prototype.impacts = function(color, index, game) {
    var p0,p1,pawn;
    pawn = game.pawn[color][index];
    for(i=0; i<this.pawns.length; i++) {
        p0 = this.oldpawns[i][POSITION];
        p1 = this.pawns[i][POSITION];
	if((p1 != -1) && (p1 != p0)) {
	    if ((pawn.color == this.oldpawns[i][COLOR]) && 
		    (pawn.position == this.oldpawns[i][POSITION])) {
		return true;
	    }
	}
    }
    return false;
};


/**
 * Handle a move in place
 *
 * move: The move
 */
GameState.prototype.handle = function(move) {
    var pawn, opponent, p, i;
    if(move.type == 'ENTER') {
        pawn = this.getOutPawn(this.player);
        p = pawn[COLOR]*24;
	opponent = this.getPawnAt(p);
	if(opponent) { opponent[POSITION] = -1; }
        pawn[POSITION] = p;
        pawn[LOCKED] = true;
    } else if (move.type == 'MOVE') {
        pawn = move.pawn;
        p = move.path[move.path.length-1];
	opponent = this.getPawnAt(p);
	if(opponent) { opponent[POSITION] = -1; }
        pawn[POSITION] = p;
        pawn[LOCKED] = false;
    } else if (move.type == 'DOOR') {
        pawn = move.pawn;
        p = move.target;
	opponent = this.getPawnAt(p);
	if(opponent) { opponent[POSITION] = -1; }
        pawn[POSITION] = p;
    } else if (move.type == 'SWITCH') {
        pawn = move.pawn;
        opponent = move.exchanged;
        p = opponent[POSITION];
        opponent[POSITION] = pawn[POSITION];
        pawn[POSITION] = p;
        pawn[LOCKED] = false;
        opponent[LOCKED] = false;
    } else if (move.type == 'BACK') {
        pawn = move.pawn;
        p = move.target;
	opponent = this.getPawnAt(p);
	if(opponent) { opponent[POSITION] = -1; }
        pawn[POSITION] = p;
        pawn[LOCKED] = false;
    } else if (move.type == 'SEVEN') {
	for(i=0; i<move.pawns.length; i++) {
	    this.pawns[i][POSITION] = move.pawns[i][POSITION];
	    this.pawns[i][LOCKED] = move.pawns[i][LOCKED];
	}
    } else if (move.type == 'WITHDRAW') {
    } else {
        return false;
    }
    return true;
};

/**
 * Duplicate this state
 */
GameState.prototype.duplicate = function() {
    var pawns, i, pawn, hand, card;
    pawns = [];
    for(i=0; i<this.pawns.length; i++) {
	pawn = this.pawns[i];
	pawns.push({
	    'color':pawn[COLOR],
	    'position':pawn[POSITION],
	    'locked':pawn[LOCKED],
	});
    }
    hand = [];
    for(i=0; i<this.hand.length; i++) {
	card = this.hand[i];
	hand.push({
	    'color':card[COLOR],
	    'value':card[VALUE],
	});
    }
    return new GameState(this.player, hand, pawns);
};

/**
 * Apply pawn properties to the pawn in copy 
 * which has the same position as sourcepawn in this.
 *
 * sourcepawn: The pawn as a member of this.pawns array
 * copy: A game state
 * properties: Properties to be applied to the copy pawn at same index
 */
GameState.prototype.applyPawnOnCopy = function(sourcepawn, copy, properties) {
    var i, target, name;
    i = this.pawns.indexOf(sourcepawn);
    target = copy.pawns[i];
    for(name in properties) {
	target[name] = properties[name];
    }
};

/**
 * Handle a move on a copy of this state
 *
 * move: The move
 */
GameState.prototype.simulate = function(move) {
    var copy, pawn, opponent, p, i, properties1, properties2;
    copy = this.duplicate();
    if(move.type == 'ENTER') {
        pawn = this.getOutPawn(this.player);
        p = pawn[COLOR]*24;
	opponent = this.getPawnAt(p);
	if(opponent) { 
	    this.applyPawnOnCopy(opponent, copy, {1:-1});
	}
	this.applyPawnOnCopy(pawn, copy, {1:p, 2:true});
    } else if (move.type == 'MOVE') {
        pawn = move.pawn;
        p = move.path[move.path.length-1];
	opponent = this.getPawnAt(p);
	if(opponent) { 
	    this.applyPawnOnCopy(opponent, copy, {1:-1});
	}
	this.applyPawnOnCopy(pawn, copy, {1:p, 2:false});
    } else if (move.type == 'DOOR') {
        pawn = move.pawn;
        p = move.target;
	opponent = this.getPawnAt(p);
	if(opponent) { 
	    this.applyPawnOnCopy(opponent, copy, {1:-1});
	}
	this.applyPawnOnCopy(pawn, copy, {1:p});
    } else if (move.type == 'SWITCH') {
        pawn = move.pawn;
        opponent = move.exchanged;
        p = opponent[POSITION];
	properties1 = {1:pawn[POSITION],2:false};
	properties2 = {1:opponent[POSITION],2:false};
	this.applyPawnOnCopy(opponent, copy, properties1);
	this.applyPawnOnCopy(pawn, copy, properties2);
    } else if (move.type == 'BACK') {
        pawn = move.pawn;
        p = move.target;
	opponent = this.getPawnAt(p);
	if(opponent) { 
	    this.applyPawnOnCopy(opponent, copy, {1:-1});
	}
	this.applyPawnOnCopy(pawn, copy, {1:p, 2:false});
    } else if (move.type == 'SEVEN') {
	for(i=0; i<move.pawns.length; i++) {
	    this.applyPawnOnCopy(this.pawns[i], copy, {
		1:move.pawns[i][POSITION],
		2:move.pawns[i][LOCKED],
	    });
	}
    }
    return copy;
};

/**
 * Return a mapped copy
 *
 * l: The array [{a:vala, b:valb, ..},]
 * columns: The array ['a','b',..]
 */
GameState.prototype.diccopy = function(l, columns) {
    var result, i, data, newdata;
    result = [];
    for(i=0; i<l.length; i++) {
        data = l[i];
        newdata = new Object();
        for(j=0; j<columns.length; j++) {
            newdata[columns[j]] = data[j];
        }
        result.push(data);
    }
    return result;
};

/**
 * Return the provided card or undefined on error
 *
 * card: The supposed card
 */
function ensureCard(card) {
    // No card
    if(typeof card == typeof undefined) return undefined;
    // Not a card
    if(card.length != 2) return undefined;
    // Bad card color
    if((card[0]>3)||(card[0]<0)) return undefined;
    // Bad card value
    if((card[1]<1)||(card[1]>13)) return undefined;
    return card;
}

/**
 * Return the provided pawn or undefined on error
 *
 * card: The supposed pawn
 */
function ensurePawn(pawn) {
    // No pawn
    if(typeof pawn == typeof undefined) return undefined;
    // Not a pawn
    if(pawn.length != 3) return undefined;
    // Bad pawn color
    if((pawn[0]>3)||(pawn[0]<0)) return undefined;
    return pawn;
}

/**
 * Return a move from serialized form
 *
 * jsonmove: The serialize move
 */
function MoveFactory(jsonmove) {
    var type, card, pawn, distance, path, target;
    if(typeof jsonmove.type == typeof undefined) {
        throw "Not a move";
    }
    type = jsonmove.type;
    if(type == 'WITHDRAW') {
        card = ensureCard(jsonmove.card);
        return new WithdrawMove(card);
    } else if(type == 'ENTER') {
        card = ensureCard(jsonmove.card);
        return new EnteringMove(jsonmove.card);
    } else if(type == 'MOVE') {
        pawn = ensurePawn(jsonmove.pawn);
        card = ensureCard(jsonmove.card);
        distance = parseInt(jsonmove.distance);
        path = jsonmove.path;
        return new MovingMove(pawn, card, distance, path);
    } else if(type == 'DOOR') {
        pawn = ensurePawn(jsonmove.pawn);
        card = ensureCard(jsonmove.card);
        target = parseInt(jsonmove.target);
        return new DoorMove(pawn, card, target);
    } else if(type == 'SWITCH') {
        pawn = ensurePawn(jsonmove.pawn);
        card = ensureCard(jsonmove.card);
        exchanged = ensurePawn(jsonmove.exchanged);
        return new SwitchMove(pawn, card, exchanged);
    } else if(type == 'BACK') {
        pawn = ensurePawn(jsonmove.pawn);
        card = ensureCard(jsonmove.card);
        target = parseInt(jsonmove.target);
        return new BackwardMove(pawn, card, target);
    }
};

/**
 * A card
 * 
 * color: The color
 * value: The value
 */
function Card(color, value) {
	this.color = color;
	this.value = value;
}

/**
 * Return a string representation
 */
Card.prototype.toString = function() {
	return ['A','2','3','4','5','6','7','8','9','10','V','D','R'][
		this.value-1]+['P','C','Q','T'][this.color];
};

/**
 * A pawn
 *
 * color: The color
 * position: The position
 * locked: The locked state
 */
function Pawn(color, position, locked) {
    this.color = color;
    this.position = position;
    this.locked = locked;
}

/**
 * Return a string representation.
 */
Pawn.prototype.toString = function() {
	return ['V','J','R','B'][this.color]+this.position;
};

/**
 * A deck
 */
function Deck() {
    var color,value;
    this.cards = [];
    this.refill();
}

/**
 * Refill the deck.
 */
Deck.prototype.refill = function() {
    for(color=0; color<4; color++) {
        for(value=1; value<=13; value++) {
            this.cards.push(new Card(color, value));
        }
    }
};

/**
 * Deal one card
 */
Deck.prototype.deal = function() {
    if(this.cards.length == 0) {
        this.refill();
    }
    var n = Math.floor(Math.random()*this.cards.length); 
    var a = this.cards[n];
    var b = this.cards[this.cards.length-1];
    this.cards[this.cards.length-1] = a;
    this.cards[n] = b;
    return this.cards.pop();
};

/**
 * Return the next dealt hand size
 */
Deck.prototype.handSize = function() {
    return ((this.cards.length == 0) ||
            (this.cards.length == 52))?5:4;
};

/*
 * A player
 *
 * color: The color
 * name: The name
 */
function Player(color, name) {
    this.color = color;
    this.name = name;
};

/**
 * Return a string representation
 */
Player.prototype.toString = function() {
    return this.color+":"+this.name;
}

/*
 * A game
 *
 * name: The game name
 * creator: The game creator
 */
function Game(name, creator) {
    var color, i;
    this.creationDate = new Date();
    this.name = name;
    this.creator = creator;
    this.attendee = [null, null, null, null];
    this.player = [null, null, null, null];
    this.presence = [null, null, null, null];
    this.hand = [[], [], [], []];
    this.pawn = [[], [], [], []];
    this.exchanged = [null, null, null, null];
    for(color=0; color<4; color++) {
        for(i=0; i<4; i++) {
            this.pawn[color].push(new Pawn(color, -1, false));
        }
    }
    this.deck = new Deck();
    this.phase = 'registration';
    this.stack = [];
    this.chat = [];
    this.turn = 0;
    this.dealer = 0;
    this.pc = 0;
    this.won = false;
    this.tournamentMode = false;
};

/**
 * Update presence
 *
 * color: The color
 */
Game.prototype.updatePresence = function(color) {
    this.presence[color] = new Date();
};

/**
 * Add a chat message
 *
 * color: The color
 * message: The message
 */
Game.prototype.addChat = function(color, message) {
    this.chat.push([color, message]);
    this.pc++;
};

/**
 * Join the game
 *
 * color: The color
 * name: The new player name
 * uuid: The player uuid or undefined
 */
Game.prototype.join = function(color, name, uuid) {
    var complete;
    if(arguments.length < 3) {
	uuid = Math.random().toString(16).slice(2).toUpperCase();
    }
    if(this.phase == 'registration') {
        this.attendee[color] = name;
	this.pc++;
        complete = true;
        for(i in this.attendee) {
            if(this.attendee[i] == null) {
                complete = false;
                break;
            }
        }
        if(complete) {
            for(i in this.attendee) {
                this.player[i] = new Player(i, this.attendee[i]);
            }
	    this.toExchange();
	    this.pc++;
        }
    } else {
        this.player[color].name = name;
	this.pc++;
    }
    return [color, name, uuid];
};

/**
 * Deal
 */
Game.prototype.deal = function() {
    var handsize, i, j;
    handsize = this.deck.handSize();
    for(i in this.hand) {
        this.hand[i] = [];
        for(j=handsize; j>0; j--) {
            this.hand[i].push(this.deck.deal());
        }
    }
}

/**
 * Exchange a card
 *
 * color: The player color
 * card: The index of card in hand
 */
Game.prototype.exchange = function(color, index) {
    var complete;
    if(this.exchanged[color] == null) {
	this.turn++;
	this.pc++;
    }
    this.exchanged[color] = index;
    this.pc++;
    complete = true;
    for(i in this.exchanged) {
	if(this.exchanged[i] == null) {
	    complete = false;
	    break;
	}
    }
    if(complete) {
	for(i=0; i<4; i++) {
	    this.exchanged[i] = this.hand[i].splice(this.exchanged[i], 1)[0];
	}
	for(i=0; i<4; i++) {
	    this.hand[(i+2)%4].push(this.exchanged[i]);
	}
	this.exchanged = [null, null, null, null];
	this.turn++;
	this.pc++;
	this.phase = 'turn';
    }
};

/**
 * Return a game state
 */
Game.prototype.toState = function() {
    var player, hand, pawns, i, j;
    player = this.turn%4;
    hand = [];
    for(i=0; i<this.hand[player].length; i++) {
	hand.push(this.hand[player][i]);
    }
    pawns = [];
    for(i=0; i<4; i++) {
	for(j=0; j<4; j++) {
	    pawns.push(this.pawn[i][j]);
	}
    }
    return new GameState(player, hand, pawns);
};

/**
 * Apply a state
 *
 * state: The state
 */
Game.prototype.applyState = function(state) {
    var i,src,dst,color,c;
    c = [0,0,0,0];
    for(i=0; i<state.pawns.length; i++) {
        src = state.pawns[i];
        color = src[0];
        dst = this.pawn[color][c[color]++];
        dst.position = src[1];
        dst.locked = (src[2] == true);
    }
    this.pc++;
};

/**
 * Stack a card
 *
 * movecard: The card
 */
Game.prototype.stackCard = function(movecard) {
    var i, j, card, remaining;
    for(i=0; i<4; i++) {
	for(j=0; j<this.hand[i].length; j++) {
	    card = this.hand[i][j];
	    if((movecard[0] == card.color) &&
		    (movecard[1] == card.value)) {
		this.stack.push(card);
		this.hand[i].splice(j, 1);
		break;
	    }
	}
    }
    remaining = 0;
    for(i=0; i<4; i++) {
	remaining += this.hand[i].length;
    }
    this.turn++;
    this.pc++;
    if(remaining == 0) {
	this.toExchange();
    }
};

/**
 * Switch to exchange state
 */
Game.prototype.toExchange = function() {
    this.deal();
    this.exchanged = [null, null, null, null];
    this.dealer = ((this.turn+1)%4);
    this.phase = 'exchange';
};

/**
 * Check winning positions
 *
 * Return the winner color if game is won, or -1
 */
Game.prototype.isWon = function() {
    var lastplayed, justbefore, racked, i;
    lastplayed = (this.turn+3)%4;
    justbefore = (lastplayed+3)%4;
    racked = [];
    for(i=0; i<4; i++) {
	racked.push(this.colorRacked(i));
    }
    if(racked[lastplayed] && racked[(lastplayed+2)%4]) {
	return lastplayed;
    } else if(racked[justbefore] && racked[(justbefore+2)%4]) {
	return justbefore;
    }
    return -1;
};

/**
 * Return true if all pawns of the provided color are racked
 *
 * color: The color
 */
Game.prototype.colorRacked = function(color) {
    var i, pawns, pawn, c, inrack, p, n;
    pawns = this.pawn[color];
    for(i=0; i<pawns.length; i++) {
	pawn = pawns[i];
	c = pawn.color;
	p = pawn.position;
        n = ((c+3)%4)*24+20;
        inrack = (p>=n) && (p<=(n+3));
        if(!inrack) {
            return false;
        }
    }
    return true;
};

var Complexity = {1:11, 2:5, 3:5, 4:5, 5:5, 6:5, 7:120, 8:7, 9:5, 
    10:5, 11:60, 12:5, 13:7};

/**
 * Module exports.
 */
if(!(typeof exports === typeof undefined)) {
	exports.GameState = GameState;
	exports.MoveFactory = MoveFactory;
	exports.Game = Game;
	exports.Player = Player;
	exports.Card = Card;
	exports.Pawn = Pawn;
	exports.Complexity = Complexity;
}

