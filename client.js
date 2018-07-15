/**
 * Perform a server-side request
 *
 * method: GET, POST or any HTTP Verb
 * uri: The request uri
 * body: The request entity
 * callback: Response callback function(responseText)
 * errorcallback: Error callback function(request)
 */
function requestMethod(method, uri, body, callback, errorcallback) {
    var request;
    request = window.XMLHttpRequest?(new XMLHttpRequest()
            ):new ActiveXObject('Msxml2.XMLHTTP');
    request.onreadystatechange = function() {
        if(request.readyState == '4') {
            if(request.status == 200) {
                if(callback) {
                    callback(request.responseText);
                }
            } else if (request.status >= 300) {
                if(errorcallback) {
                    errorcallback(request);
                } else {
                    alert('Erreur réseau, uri = ['+uri
                            +'], méthode = ['
                            +method+']');
                }
            }
        }
    }
    request.open(method, uri, true);
    request.setRequestHeader('Content-Length', body.length);
    request.send(body);
}

/**
 * Create an element.
 *
 * tagname: The element tag name
 */
function $create(tagname) {
    return document.createElement(tagname);
}

/**
 * Get an element
 *
 * id: The element id
 */
function $get(id) {
    return document.getElementById(id);
}

/**
 * Create a text node.
 *
 * content: The text content
 */
function $text(content) {
    return document.createTextNode(content);
}

/**
 * Append a child.
 *
 * container: The container
 * element: The child
 */
function $add(container, element) {
    container.appendChild(element);
}

/**
 * Add an event listener
 *
 * target: The target element
 * eventname: The event name
 * callback: The callback
 * usecapture: if true prevent bubbling up
 */
function $listen(target, eventname, callback, usecapture) {
	if (target.addEventListener){  
		target.addEventListener(eventname, callback, usecapture);   
	} else if (target.attachEvent){  
		if(target == window) {
			document.body.attachEvent('on'+eventname, callback);  
		} else {
			target.attachEvent('on'+eventname, callback);  
		}
	}  
}

/**
 * Clear a node
 *
 * node: The node
 */
function $clear(node) {
    while(node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

/**
 * Log a message
 *
 * message: The message
 */
function $log(message) {
    var pre;
    pre = $get('log');
    if(!pre) {
	pre = $create('pre');
	pre.id = 'log';
	pre.style.position = 'absolute';
	pre.style.right = '0px';
	pre.style.bottom = '0px';
	pre.style.width = '320px';
	pre.style.height = '200px';
	pre.style.overflow = 'hidden';
	pre.style.overflowY = 'auto';
	pre.style.border = '1px solid black';
	document.body.appendChild(pre);
    }
    pre.appendChild($text(message+'\n'));
    pre.scrollTop = pre.scrollHeight;
}

/**
 * Start first launch games sync.
 */
function syncGames() {
    requestMethod('GET','games','',function(resp) {
        doSyncGames(JSON.parse(resp));
        setTimeout(syncGames, 2000);
    });
}

/**
 * Refresh game list
 *
 * games: The games
 */
function doSyncGames(games) {
    var game, key, creation, link, tbody, i, tr, td, txt;
    var a, b, j, div, title;
    tbody = $get('games');
    for(i in games) {
        game = games[i];
        key = 'game_'+game.name;
        if(! (key in tbody)) {
            tr = $create('tr');
            td = $create('td');
            td.className = 'creation';
            creation = game.creationDate;
            creation = creation.substring(8,10)+"/"+creation.substring(5,7);
            $add(td, $text(creation));
            $add(tr, td);
            td = $create('td');
            link = $create('a');
            link.href = 'watch/'+encodeURIComponent(game.name);
            $add(link, $text(game.name));
            $add(td, link);
	    if(game.creator) {
		txt = ""+game.creationDate;
		a = txt.indexOf('T');
		b = txt.indexOf(':',a);
		b = txt.indexOf(':',b+1);
		td.title = ("Proposée par "+game.creator+" à "
			+txt.substring(a+1, b));
	    }
            $add(tr, td);
            td = $create('td');
            td.className = 'presence';
	    td.id = 'presence_'+game.name;
            $add(tr, td);
            $add(tbody, tr);
        }
	tbody[key] = game;
	td = $get('presence_'+game.name);
	$clear(td);
	for(j=3; j>=0; j--) {
	    div = $create('div');
	    div.className = 'presence'+game.presence[j];
	    title = 'Libre';
	    if(game.attendee[j]) {
		title = game.attendee[j];
	    } else if(game.player[j]) {
		title = game.player[j].name;
	    }
	    div.title = title;
	    $add(td, div);
	}
    }
}

/**
 * Start game creation.
 */
function createGame() {
    $get('attributes').style.display = '';
}

/**
 * Start game restore.
 */
function restoreGame() {
    var i, option, names, restorable, saved;
    restorable = $get('restorable');
    $get('saved').style.display = '';
    requestMethod('GET', '../saves', '', function(resp) {
	names = JSON.parse(resp);
	while(restorable.firstChild) {
	    restorable.removeChild(restorable.firstChild);
	}
	for(i=0; i<names.length; i++) {
	    option = $create('option');
	    option.value = names[i];
	    $add(option, $text(names[i]));
	    $add(restorable, option);
	}
	$get('restoredname').disabled = '';
    });
}

/**
 * Continue game creation.
 */
function finishCreateGame() {
    var gamename, by;
    $get('attributes').style.display = 'none';
    gamename = $get('gamename').value;
    by = $get('by').value;
    requestMethod('POST','create/'+encodeURIComponent(gamename),by,
            function(resp) { });
}

/**
 * Continue game restore.
 */
function finishRestoreGame() {
    var gamename, source;
    $get('saved').style.display = 'none';
    source = $get('restorable').value;
    gamename = $get('restoredname').value;
    requestMethod('POST','restore/'+encodeURIComponent(gamename),source,
            function(resp) { });
}

/**
 * The client
 *
 * game: The local game
 */
function Client(game) {
    this.game = game;
    this.color = -1;
    this.colors = new Object();
    this.cards = [];
    this.chatidx = 0;
    this.uuid = Math.random().toString(16).slice(2).toUpperCase();
    this.pawnsSlideAnimation = true;
    this.cyclePlayers = false;
    this.hideHandOnCycle = false;
    this.justSwitched = false;
    this.yoshiSays = false;
}

/**
 * Add a color
 *
 * color: The player color
 */
Client.prototype.addColor = function(color) {
    this.color = color;
    this.colors[color] = color;
};

/**
 * Sync hand
 *
 * hand: The hand
 * gfx: The help graphics surface
 * positions: The positions array
 */
Client.prototype.syncHand = function(hand, gfx, positions) {
    var i,j, toremove, localcard, remotecard, dirty, div;
    dirty = false;
    toremove = [];
    if(this.justSwitched && this.hideHandOnCycle) {
	$get('cardMask').style.visibility = 'visible';
    }
    for(i=0; i<this.cards.length; i++) {
	localcard = this.cards[i].card;
	found = false;
	for(j=0; j<hand.length; j++) {
	    remotecard = hand[j];
	    if((localcard.value == remotecard.value) && 
		    (localcard.color == remotecard.color)) {
		found = true;
		break;
	    }
	}
	if(!found) {
	    toremove.push(i);
	    dirty = true;
	}
    }
    for(i=toremove.length-1; i>=0; i--) {
	div = this.cards.splice(toremove[i], 1)[0];
	div.parentNode.removeChild(div);
    }
    for(i in hand) {
	if(this.addCard(hand[i], gfx, positions)) {
	    dirty = true;
	}
    }
    if(dirty) {
	for(i=0; i<this.cards.length; i++) {
	    this.positionCard(this.cards[i], i);
	}
    }
    return dirty;
};

/**
 * Position a card
 *
 * div: The card div
 * index: The index
 */
Client.prototype.positionCard = function(div, index) {
    var board, x, y
    board = $get('board');
    x = pageX(board)+board.offsetWidth;
    y = pageY(board)+board.offsetHeight;
    div.style.top = (y-68)+'px';
    div.style.left = (x-(index+1)*47)+'px';
}

/**
 * Add a card to client
 *
 * card: The card
 * gfx: The help graphics surface
 * positions: The positions array
 */
Client.prototype.addCard = function(card, gfx, positions) {
    var div, i, localcard, board, x, y, self;
    self = this;
    for(i in this.cards) {
	localcard = this.cards[i].card;
	if((localcard.color == card.color) && (localcard.value == card.value)) {
	    return false;
	}
    }
    div = $create('div');
    div.className = 'card_'+card.value+'_'+card.color;
    div.card = card;
    this.cards.push(div);
    this.positionCard(div, this.cards.length);
    document.body.appendChild(div);
    $listen(div, 'click', function(e) {
	self.playCard(div, card, gfx, positions);
    }, false);
    return true;
};

/**
 * Intend to play a card
 *
 * div: The card dom element
 * card: The card
 * gfx: The help graphics surface
 * positions: The positions array
 */
Client.prototype.playCard = function(div, card, gfx, positions) {
    var self, json, board, moves, i, movecard, available;
    self = this;
    removeElementById('chooser');
    gfx.clear();
    if(this.game.won) {
	return;
    } else if(this.game.phase == 'exchange') {
	requestMethod('POST', '../exchange/'+encodeURIComponent(this.game.name),
		JSON.stringify([this.color, card]), function(resp) {
		    json = JSON.parse(resp);
		    if(!json[0]) {
			alert(json[1]);
		    } else {
			board = $get('board');
			div.style.left = (pageX(board)+
			    (board.offsetWidth-47)/2) + 'px';
			div.style.top = (pageY(board)+
			    (board.offsetHeight-68)/2) + 'px';
		    }
		});
    } else if((this.game.phase == 'turn') && 
	    ((this.game.turn%4) == this.color)) {
	moves = this.game.toState().computeMoves();
	available = [];
	for(i=0; i<moves.length; i++) {
	    movecard = moves[i].card;
	    if((movecard[0] == card.color) &&
		    (movecard[1] == card.value)) {
		available.push(moves[i]);
	    }
	}
	if(available.length == 1) {
	    this.playSingleMove(div, gfx, available[0]);
	} else if(available.length > 1) {
	    this.showPossibleMoves(available, gfx, positions, div);
	}
    }
};

/**
 * Play a single move.
 *
 * div: The optional card dom element
 * gfx: The help graphics surface
 * move: The move
 */
Client.prototype.playSingleMove = function(div, gfx, move) {
    var self, board;
    self = this;
    removeElementById('chooser');
    gfx.clear();
    requestMethod('POST', '../play/'+encodeURIComponent(this.game.name), 
	    JSON.stringify([this.color, move]), function(resp) {
		var json = JSON.parse(resp);
		if(!json[0]) {
		    alert(json[1]);
		} else {
		    board = $get('board');
		    if(div) {
			div.style.left = (pageX(board)+
			    (board.offsetWidth-47)/2) + 'px';
			div.style.top = (pageY(board)+
			    (board.offsetHeight-68)/2) + 'px';
		    }
		}
	    });
};

/**
 * Remove an element by id if found
 *
 * id: The id
 */
function removeElementById(id) {
    var element;
    element = $get(id);
    if(element) {
	element.parentNode.removeChild(element);
    }
}

/**
 * Display available moves
 *
 * moves: The moves
 * gfx: The help graphics surface
 * positions: The positions array
 * div: The optional card dom element
 */
Client.prototype.showPossibleMoves = function(moves, gfx, positions, div) {
    var chooser, move, i, button, board, text, buttons;
    removeElementById('chooser');
    gfx.clear();
    chooser = $create('div');
    chooser.className = 'chooser';
    chooser.id = 'chooser';
    buttons = [];
    for(i=0; i<moves.length; i++) {
	move = moves[i];
	button = $create('button');
	text = move.toString();
	if(move.getDescription) {
	    text = move.getDescription();
	}
	$add(button, $text(text));
	this.listenChoice(button, move, gfx, chooser, positions, div);
	button.move = move;
	buttons.push(button);
	$add(chooser, button);
    }
    chooser.buttons = buttons;
    board = $get('board');
    //chooser.style.left = (pageX(board)+board.offsetWidth-200)+'px';
    chooser.style.left = (pageX(board)+board.offsetWidth)+'px';
    chooser.style.top = pageY(board)+'px';
    document.body.appendChild(chooser);
};

/**
 * Listen to choice
 *
 * button: The button to listen to
 * move: The move to play on click
 * gfx: The help graphics surface
 * chooser: The chooser
 * positions: The positions array
 * div: The optional card dom element
 */
Client.prototype.listenChoice = function(button, move, gfx, chooser, positions, div) {
    var self = this;
    $listen(button, 'mouseover', function(e) {
	gfx.clear();
	self.showMove(move, gfx, positions);
	gfx.paint();
    }, false);
    $listen(button, 'click', function(e) {
	gfx.clear();
	chooser.parentNode.removeChild(chooser);
	self.playSingleMove(div, gfx, move);
    }, false);
};

/**
 * Show move
 *
 * move: The move
 * gfx: The help graphics surface
 * positions: The positions array
 */
Client.prototype.showMove = function(move, gfx, positions) {
    var p1, p2, i, pawn, original, color, c;
    if(move.type == 'SWITCH') {
	p1 = move.pawn[1];
	p2 = move.exchanged[1];
	this.drawArrow(gfx, positions, p1, p2);
    } else if(move.type == 'DOOR') {
	p1 = move.pawn[1];
	p2 = move.target;
	this.drawArrow(gfx, positions, p1, p2);
    } else if(move.type == 'BACK') {
	p1 = move.pawn[1];
	p2 = move.target;
	this.drawArrow(gfx, positions, p1, p2);
    } else if(move.type == 'SEVEN') {
        c = [0,0,0,0];
        for(i=0; i<move.pawns.length; i++) {
            pawn = move.pawns[i];
            color = pawn[COLOR];
            original = this.game.pawn[color][c[color]++];
            if((pawn[POSITION] != original.position) && 
                (pawn[POSITION] != -1) && (original.position != -1)) {
                p1 = original.position;
                p2 = pawn[POSITION];
                this.drawArrow(gfx, positions, p1, p2);
            }
        }
    } else if(move.type == 'MOVE') {
	p2 = move.pawn[1];
	for(i=0; i<move.path.length; i++) {
	    p1 = p2;
	    p2 = move.path[i];
	    this.drawArrow(gfx, positions, p1, p2);
	}
    }
};

/**
 * Draw an arrow
 *
 * gfx: The help graphics surface
 * positions: The positions
 * p1: The start pos
 * p2: The end pos
 */
Client.prototype.drawArrow = function(gfx, positions, p1, p2) {
    var x1, y1, x2, y2, x3, y3, x4, y4, dx, dy, d, board;
    board = $get('board');
    x1 = pageX(board)+positions[p1][0];
    y1 = pageY(board)+positions[p1][1];
    x2 = pageX(board)+positions[p2][0];
    y2 = pageY(board)+positions[p2][1];

    dx = x2-x1;
    dy = y2-y1;
    d = Math.sqrt(dx*dx+dy*dy);
    dx /= d;
    dy /= d;

    x3 = x2-7*dx-3*dy;
    y3 = y2-7*dy+3*dx;
    x4 = x2-7*dx+3*dy;
    y4 = y2-7*dy-3*dx;

    gfx.drawLine(x1,y1,x2,y2);
    gfx.fillPolygon([x2,x3,x4],[y2,y3,y4]);
}

/**
 * Remove all cards for client
 */
Client.prototype.removeCards = function() {
    var div;
    while(this.cards.length) {
	div = this.cards.pop();
	div.parentNode.removeChild(div);
    }
}

/**
 * Synchronize single game
 */
function startSyncGame() {
    var gamename, color, i, positions, gfx;
    gamename = document.location.href;
    gamename = decodeURIComponent(gamename.substring(
                gamename.lastIndexOf('/')+1));
    game = new Game(gamename);
    gfx = $create('div');
    gfx.id = 'gfx';
    document.body.appendChild(gfx);
    gfx = new jsGraphics('gfx');
    client = new Client(game);
    for(color=0; color<4; color++) {
        for(i=0; i<4; i++) {
            pawnsCreate(color, i, game);
        }
    }
    positions = buildPositions();
    syncGame(game, positions, client, gfx);
    for(color=0; color<4; color++) {
        namingListen(color, game, client);
    }
    $listen($get('cardMask'), 'click', function(e) {
	$get('cardMask').style.visibility = 'hidden';
    }, false);
    $listen($get('preferences'), 'click', function(e) {
	showPreferences(game, client);
    }, false);
    $listen($get('prefDialogSave'), 'click', function(e) {
	persistPreferences(game, client);
    }, false);
    $listen($get('save'), 'click', function(e) {
	saveGame(game);
    }, false);
    $listen(window, 'keyup', function(e) {
	if((client.color >= 0) && (e.keyCode == 222)) {
	    startChat(client);
	}
    }, false);
}

/**
 * Show preferences
 *
 * game: The game
 * client: The client
 */
function showPreferences(game, client) {
    var prefdialog;
    prefdialog = $get('prefdialog');
    if(prefdialog.style.display == 'none') {
	prefdialog.style.display = '';
	updatePreferences(game, client);
    } else {
	prefdialog.style.display = 'none';
    }
}

/**
 * Update preferences
 *
 * game: The game
 * client: The client
 */
function updatePreferences(game, client) {
    $get('pawnsSlideAnimation').checked = client.pawnsSlideAnimation?'checked':'';
    $get('cyclePlayers').checked = client.cyclePlayers?'checked':'';
    $get('hideHandOnCycle').checked = client.hideHandOnCycle?'checked':'';
    $get('tournamentMode').checked = game.tournamentMode?'checked':'';
    $get('yoshiSays').checked = client.yoshiSays?'checked':'';
}

/**
 * Persist preferences
 *
 * game: The game
 * client: The client
 */
function persistPreferences(game, client) {
    $get('prefdialog').style.display = 'none';
    client.pawnsSlideAnimation = !(!($get('pawnsSlideAnimation').checked));
    client.cyclePlayers = !(!($get('cyclePlayers').checked));
    client.hideHandOnCycle = !(!($get('hideHandOnCycle').checked));
    client.yoshiSays = !(!($get('yoshiSays').checked));
}

/**
 * Save game on server
 *
 * game: The game
 */
function saveGame(game) {
    requestMethod('GET', '../save/'+encodeURIComponent(game.name), '',
	    function(resp) {
		alert("Partie sauvegardée "+resp);
	    });
};

/**
 * Start a chat message
 *
 * client: The client
 */
function startChat(client) {
    var input;
    input = $create('input');
    input.className = 'chat';
    document.body.appendChild(input);
    input.focus();
    $listen(input, 'keypress', function(e) {
	if(e.keyCode == 13) { 
	    sendChat(client, input.value);
	    input.parentNode.removeChild(input);
	} else if(e.keyCode == 27) { 
	    input.parentNode.removeChild(input);
	}}, false);
}

/**
 * Start a chat message
 *
 * client: The client
 * message: The message
 */
function sendChat(client, message) {
    requestMethod('POST','../chat/'+encodeURIComponent(client.game.name),
	    JSON.stringify([client.color, message]), function(resp) {});
}

/**
 * Create pawns
 *
 * color: The color
 * index: The index
 * game: The game
 */
function pawnsCreate(color, index, game) {
    var fieldset, div;
    fieldset = $get('player'+color);
    div = $create('div');
    div.id = 'pawn'+color+index;
    div.className = 'pawn_'+color;
    document.body.appendChild(div);
    $listen(div, 'click', function(e) { 
	refineChooser(color, index, game); 
    }, false);
}

/**
 * Refine chooser moves when clicking pawn
 *
 * color: The pawn color
 * index: The pawn index
 * game: The game
 */
function refineChooser(color, index, game) {
    var i,move,button,chooser;
    chooser = $get('chooser');
    if(chooser) {
	for(i=0; i<chooser.buttons.length; i++) {
	    button = chooser.buttons[i];
	    if(button.parentNode) {
		if(! button.move.impacts(color, index, game)) {
		    button.parentNode.removeChild(button);
		}
	    }
	}
	if(chooser.childNodes.length == 1) {
	    chooser.firstChild.click();
	}
    }
}

/**
 * Listen to renaming
 *
 * color: The color
 * game: The game
 * client: The client
 */
function namingListen(color, game, client) {
    $listen($get('playername'+color), 'keypress', function(e) {
            if(e.keyCode == 13) { 
            joinGame(game, color, $get('playername'+color), client); 
            }}, false);
    $listen($get('rejoin'+color), 'click', function(e) {
            joinGame(game, color, $get('playername'+color), client); 
            }, false);
}

/**
 * Synchronize single game
 *
 * game: The game
 * positions: The positions
 * client: The client
 * gfx: The help graphics surface
 */
function syncGame(game, positions, client, gfx) {
    requestMethod('GET','../state/'+encodeURIComponent(game.name),'',
	    function(resp) {
		doSyncGame(game, resp, positions, client, gfx);
		waitForChange(game.pc, function(pc) {
			game.pc = pc;
			syncGame(game, positions, client, gfx);
		});
	    });
}

/**
 * Perform smart incremental polling
 *
 * pc: The current game history counter
 * callback: The callback to perform when history counter changes
 */
function waitForChange(pc, callback) {
    requestMethod('GET', '../pc/'+encodeURIComponent(game.name),'',
	    function(resp) {
		var newpc = parseInt(resp);
		if(newpc <= pc) {
		    setTimeout(function() {
			waitForChange(pc, callback);
		    }, 750);
		} else {
		    callback(newpc);
		}
	    });
}

/**
 * Synchronize single game
 * 
 * localgame: The client-local game object
 * servergamestr: The server-jsoned game object
 * positions: The positions
 * client: The client
 * gfx: The help graphics surface
 */
function doSyncGame(localgame, servergamestr, positions, client, gfx) {
    var title, color, localpawn, serverpawn, servergame, dealer;
    var	link, attendee, input, player, i, card, hand, winner, dirty;
    var div, board, chat, pre, who, p, n, x, y, container, span;
    servergame = JSON.parse(servergamestr);
    title = $get('title');
    $clear(title);
    $add(title, $text(getGameTitle(servergame)));
    localgame.turn = servergame.turn;
    localgame.phase = servergame.phase;
    for(color in servergame.pawn) {
        for(i in servergame.pawn[color]) {
            localpawn = localgame.pawn[color][i];
            serverpawn = servergame.pawn[color][i];
	    p = localpawn.position;
            localpawn.position = serverpawn.position;
            localpawn.locked = serverpawn.locked;
            repositionPawn(game, parseInt(color), parseInt(i), positions, 
		    p, !client.pawnsSlideAnimation);
        }
    }
    for(color in servergame.hand) {
	div = $get('remainingcards'+color);
	if(div) {
	    div.parentNode.removeChild(div);
	}
	div = $create('div');
	div.id = 'remainingcards'+color;
	n = servergame.hand[color].length;
	div.className = 'cardback_'+n;
	if((servergame.phase == 'exchange') 
		&& (servergame.exchanged[color] != null)) {
	    div.style.backgroundPosition = '-'+(19*(6-n))+'px -0px';
	}
	container = $get('player'+color);
	div.style.left = pageX(container)+26*4+2;
	div.style.top = pageY(container)+36;
	document.body.appendChild(div);
    }
    for(color in servergame.attendee) {
	attendee = servergame.attendee[color];
	if(attendee) {
	    input = $get('playername'+color);
	    if(input != document.activeElement) {
		input.value = attendee;
		input.style.fontStyle = 'italic';
	    }
	}
    }
    for(color in servergame.player) {
	player = servergame.player[color];
	if(player) {
	    input = $get('playername'+color);
            input.className = '';
	    if(input != document.activeElement) {
		input.value = player.name;
		input.style.fontStyle = 'italic';
	    }
	}
    }
    if(client.color >= 0) {
	if(servergame.phase == 'turn') {
	    removeElementById('dealer');
	    $get('playername'+(servergame.turn%4)).className = 'current';
	} else if(servergame.phase == 'exchange') {
	    dealer = $get('dealer');
	    if(! dealer) {
		dealer = $create('div');
		dealer.id = 'dealer';
		dealer.className = 'dealer';
		container = $get('rejoin'+servergame.dealer);
		dealer.style.left = (pageX(container)+20)+'px';
		dealer.style.top = pageY(container)+'px';
		document.body.appendChild(dealer);
	    }
	}
	hand = servergame.hand[client.color];
	dirty = client.syncHand(hand, gfx, positions);
	localgame.hand[client.color] = [];
	for(i in hand) {
	    localgame.hand[client.color].push(new Card(
			hand[i].color, hand[i].value));
	}
	winner = localgame.isWon();
	if((winner != -1) && (!localgame.won)) {
	    localgame.won = true;
	    setTimeout(function() {
		tadaa(winner, !client.pawnsSlideAnimation);
	    }, 500);
	}
	if(dirty && client.yoshiSays) {
	    if(servergame.phase == 'exchange') {
                var cardHint = new Yoshi().choose(localgame);
                createChat(client.color, 'Yoshi', "Echange "+
			localgame.hand[client.color][cardHint]);
	    } else if((servergame.turn%4) == client.color) {
                var moveHint = new Yoshi().choose(localgame);
		client.showPossibleMoves([moveHint], gfx, positions);
	    }
	}
    }
    if(servergame.stack.length) {
	card = servergame.stack[servergame.stack.length-1];
	div = $get('stack');
	div.className = 'card_'+card.value+'_'+card.color;
	div.style.display = '';
	board = $get('board');
	div.style.left = (pageX(board)+(board.offsetWidth-47)/2)+'px';
	div.style.top = (pageY(board)+(board.offsetHeight-68)/2)+'px';
    }
    if(servergame.chat.length > client.chatidx) {
	for(i=client.chatidx; i<servergame.chat.length; i++) {
	    chat = servergame.chat[i];
	    who = servergame.player[chat[0]].name;
            createChat(chat[0], who, chat[1]);
	}
	client.chatidx = servergame.chat.length;
    }
    if(client.color >= 0) {
	color = (servergame.turn%4);
	if(client.cyclePlayers 
		&& (color in client.colors)
		&& (client.color != color)
		) {
	    joinGame(localgame, color, $get('playername'+color), client); 
	}
    }
}

/**
 * Create a chat entry
 *
 * color: The color to style
 * nickname: The displayed name
 * message: The message
 */
function createChat(color, nickname, message) {
    var span, pre;
    pre = $get('chat');
    span = $create('span');
    span.style.color = ['green','yellow','red','blue'][color];
    $add(span, $text(nickname+":"))
        $add(pre, span);
    $add(pre, $text(message));
    $add(pre, $create('br'));
    pre.scrollTop = pre.scrollHeight;
}

/**
 * Tadaa, habemus winna
 * 
 * color: The last player which moved
 * noAnimation: When true, no animation is performed
 */
function tadaa(color, noAnimation) {
    var G = [[1,0],[2,0],[3,0],[0,1],[0,2],[2,2],[3,2],[0,3],
	[3,3],[1,4],[2,4],[3,4]];
    var A = [[1,0],[2,0],[0,1],[3,1],[0,2],[1,2],[2,2],[3,2],[0,3],[0,4],
        [3,3],[3,4]];
    var N = [[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[0,3],[0,4],[3,3],[3,4]];
    var E = [[1,0],[2,0],[3,0],[0,1],[0,2],[1,2],[2,2],[0,3],[1,4],[2,4]
        ,[3,4]];
    var l = [];
    prepareLetter(G, 0, l);
    prepareLetter(A, 1, l);
    prepareLetter(G, 2, l);
    prepareLetter(N, 3, l);
    prepareLetter(E, 4, l);

    var i,x,y,board,d,div,l2,x0,y0;
    l2 = [];
    board = $get('board');
    x0 = pageX(board)+300;
    y0 = pageY(board)+300;
    for(i=0; i<l.length; i++) {
	div = $create('div');
	div.className = 'pawn_'+color;
	div.style.left = x0+'px';
	div.style.top = y0+'px';
	document.body.appendChild(div);
	x = x0+(l[i][0]-12)*20;
	y = y0+(l[i][1]-2)*20;
	l2.push([div, [x0,y0],[x,y]]);
    }
    for(i=0; i<l2.length; i++) {
	animate(l2[i][0], l2[i][1], l2[i][2], noAnimation);
    }
};

/**
 * Prepare a letter gfx
 *
 * letter: The letter as coordinates
 * offset: The offset in word
 * l: The list to push to
 */
function prepareLetter(letter, offset, l) {
    var i;
    for(i=0; i<letter.length; i++) {
	l.push([letter[i][0]+offset*5, letter[i][1]]);
    }
};

/**
 * Restore a pawn position
 * 
 * game: The game
 * color: The color
 * index: The index
 * positions: The positions
 * p0: The position to start animation from
 * noAnimation: When true, no animation is performed
 */
function repositionPawn(game, color, index, positions, p0, noAnimation) {
    var div, position, xy, xy0, i,mx;
    div = $get('pawn'+color+index);
    position = game.pawn[color][index].position;
    xy0 = positionXy(p0, color, index, positions);
    xy = positionXy(position, color, index, positions);
    animate(div, xy0, xy, noAnimation);
}

var MXMVT=40;
/**
 * Move a pawn
 * 
 * div: The pawn div
 * xy0: The original position coordinates
 * xy: The final position coordinates
 * noAnimation: When true, no animation is performed
 */
function animate(div, xy0, xy, noAnimation) {
    if(noAnimation) {
	doAnimate(div, xy, xy, MXMVT);
    } else {
	doAnimate(div, xy0, xy, 0);
    }
}

/**
 * Perform animation
 * 
 * div: The pawn div
 * xy0: The original position coordinates
 * xy: The final position coordinates
 * i: The current animation index
 */
function doAnimate(div, xy0, xy, i) {
    div.style.left = (xy0[0]+(xy[0]-xy0[0])*i/MXMVT) +'px';
    div.style.top = (xy0[1]+(xy[1]-xy0[1])*i/MXMVT) +'px';
    if(i<MXMVT) {
	setTimeout(function() { doAnimate(div, xy0, xy, i+1); }, 10);
    }
}

/**
 * Compute coordinates for a logical pawn position
 * 
 * position: The logical position
 * color: The pawn color, used when racked
 * index: The pawn index
 * positions: The positions
 */
function positionXy(position, color, index, positions) {
    var container, x, y;
    if(position == -1) {
	container = $get('player'+color);
        x = pageX(container)+26*index+2;
        y = pageY(container)+36;
    } else {
	container = $get('board');
        x = pageX(container)+positions[position][0]-26/2;
        y = pageY(container)+positions[position][1]-26/2;
    }
    return [x,y];
}

/**
 * Return the x coordinate of an element
 *
 * e: The element
 */
function pageX(e) {
    var x = 0;
    while (e) {
	if(e.offsetLeft) {
	    x += e.offsetLeft;
	}
	if(e.offsetParent) {
	    e = e.offsetParent;
	} else {
	    break;
	}
    }
    return x;
}

/**
 * Return the y coordinate of an element
 *
 * e: The element
 */
function pageY(e) {
    var y = 0;
    while (e) {
	if(e.offsetTop) {
	    y += e.offsetTop;
	}
	if(e.offsetParent) {
	    e = e.offsetParent;
	} else {
	    break;
	}
    }
    return y;
}

/**
 * Build the positions
 */
function buildPositions() {
    var x,y;
    var positions = [];
    var r = 26;
    var cx = 0+r/2-2;
    var cy = 600-r/2+1;
    var l = 300-r*5/2+6;
    for(i=0; i<17; i++) {
        var a = Math.PI/2*i/16;
        var c = Math.cos(a);
        var s = Math.sin(a);
        x = cx+l*c;
        y = cy-l*s;
        //dbgcross(x,y);
        positions.push([x,y]);
    }
    var x0 = x;
    var y0 = y;
    for(i=0; i<3; i++) {
        y = y0-(i+1)*(r-2);
        //dbgcross(x,y);
        positions.push([x,y]);
    }
    var p = positions[positions.length-2];
    x0 = p[0];
    y = p[1];
    for(i=0; i<4; i++) {
        x = x0+(i+1)*(r-2);
        //dbgcross(x,y);
        positions.push([x,y]);
    }
    var n = positions.length;
    for(i=0; i<n; i++) {
        p = positions[i];
        y = p[0];
        x = 599-p[1];
        //dbgcross(x,y);
        positions.push([x,y]);
    }
    n = positions.length;
    for(i=0; i<n; i++) {
        p = positions[i];
        x = 599-p[0];
        y = 599-p[1];
        //dbgcross(x,y);
        positions.push([x,y]);
    }
    return positions;
}

/**
 * Return a title for the game
 *
 * game: The game
 */
function getGameTitle(game) {
    var suffix;
    suffix = '';
    if(game.phase == 'registration') {
        suffix = ' : Enregistrement';
    } else if(game.phase == 'exchange') {
        suffix = ' : Echange';
    } else if(game.phase == 'turn') {
        suffix = ' : '+game.player[game.turn%4].name+' joue';
    }
    return game.name + suffix;
}

/**
 * Join a game
 *
 * game: The game
 * color: The color
 * input: The player name input
 * client: The client
 */
function joinGame(game, color, input, client) {
    var playername = input.value;
    requestMethod('POST', '../join/'+encodeURIComponent(game.name), 
	    JSON.stringify([color,playername,client.uuid]),
	    function(resp) { gameJoined(color, input, client); });
}

/**
 * Game joined
 *
 * color: The color
 * input: The player name input
 * client: The client
 */
function gameJoined(color, input, client) {
	input.style.fontStyle = 'italic';
	client.addColor(color);
	client.removeCards();
	client.justSwitched = true;
}

