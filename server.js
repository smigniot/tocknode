var http = require('http');
var util = require("util");
var fs = require("fs");
var path = require("path");
var events = require("events");
var json = require("./json2.js");
var shared = require("./shared.js");
var robots = require("./robots.js");

/**
 * A tock games server
 */
function TockServer() {
    this.games = new Object();

	game = gameFromJson('{"creationDate":"2012-02-12T15:12:00.297Z","name":"Périgourdins","creator":"Sébastien","attendee":["Pym","Sébastien","Denis","Roxane"],"player":[{"color":"0","name":"Pym"},{"color":"1","name":"Sébastien"},{"color":"2","name":"Denis"},{"color":"3","name":"Roxane"}],"hand":[[{"color":2,"value":11},{"color":0,"value":4},{"color":3,"value":13},{"color":1,"value":7},{"color":2,"value":7}],[{"color":1,"value":8},{"color":0,"value":13},{"color":2,"value":10},{"color":3,"value":11},{"color":1,"value":12}],[{"color":2,"value":2},{"color":3,"value":12},{"color":0,"value":1},{"color":0,"value":5},{"color":3,"value":10}],[{"color":3,"value":3},{"color":0,"value":8},{"color":2,"value":1},{"color":2,"value":12},{"color":3,"value":11}]],"pawn":[[{"color":0,"position":-1,"locked":false},{"color":0,"position":-1,"locked":false},{"color":0,"position":-1,"locked":false},{"color":0,"position":-1,"locked":false}],[{"color":1,"position":48,"locked":false},{"color":1,"position":24,"locked":false},{"color":1,"position":-1,"locked":false},{"color":1,"position":-1,"locked":false}],[{"color":2,"position":-1,"locked":false},{"color":2,"position":-1,"locked":false},{"color":2,"position":-1,"locked":false},{"color":2,"position":-1,"locked":false}],[{"color":3,"position":-1,"locked":false},{"color":3,"position":-1,"locked":false},{"color":3,"position":-1,"locked":false},{"color":3,"position":-1,"locked":false}]],"exchanged":[null,null,null,null],"deck":{"cards":[{"color":3,"value":7},{"color":0,"value":2},{"color":3,"value":6},{"color":3,"value":2},{"color":2,"value":13},{"color":0,"value":6},{"color":0,"value":7},{"color":2,"value":9},{"color":0,"value":9},{"color":0,"value":10},{"color":0,"value":11},{"color":0,"value":12},{"color":0,"value":13},{"color":1,"value":1},{"color":1,"value":2},{"color":1,"value":3},{"color":1,"value":4},{"color":1,"value":5},{"color":1,"value":6},{"color":3,"value":9},{"color":1,"value":8},{"color":1,"value":9},{"color":1,"value":10},{"color":1,"value":11},{"color":3,"value":8},{"color":1,"value":13},{"color":2,"value":8},{"color":2,"value":10},{"color":2,"value":3},{"color":2,"value":4},{"color":2,"value":5},{"color":3,"value":5}]},"phase":"turn","stack":[],"chat":[],"turn":5,"dealer":1,"pc":20,"won":false,"tournamentMode":false}');

	game.name = 'Périgourdings';
	//this.games[game.name] = game;
}

/**
 * Deserialize a game
 *
 * json: The serialized game
 */
function gameFromJson(json) {
    var game, copy, i, color, card, pawn, n;
    copy = JSON.parse(json);
    game = new shared.Game();
    game.name = copy.name;
    game.attendee = copy.attendee;
    game.turn = copy.turn;
    game.phase = copy.phase;
    game.chat = copy.chat;
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
    n = 52-copy.deck.length;
    for(i=0; i<n; i++) {
	game.deck.deal();
    }
    return game;
}

/**
 * Start server
 *
 * port: The port to listen to
 */
TockServer.prototype.listen = function(port) {
    var self = this;
    http.createServer(function(req,res) {
            self.serveRequest(req, res);
            }).listen(port,'0.0.0.0');
}

/**
 * Set the server log file
 *
 * logfile: The logfile to open for writing
 */
TockServer.prototype.setLog = function(logfile) {
    if(logfile != null) {
	var stream = fs.openSync(logfile,'w');
	this.log = function(message) {
	    fs.write(stream, (new Date().toUTCString())+": "+message+"\n");
	};
    } else {
	this.log = function(message) { util.log(message); };
    }
}

/*
 * Serve a static file
 *
 * filename: The file name
 * response: The response
 */
TockServer.prototype.serveStatic = function(filename, response) {
    fs.readFile(filename, function(error, content) {
            if (error) {
            response.writeHead(500);
            response.end();
            } else if(filename.match(/.html$/i)) {
            response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
            response.end(content, 'UTF-8');
            } else if(filename.match(/.js$/i)) {
            response.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8'});
            response.end(content, 'UTF-8');
            } else if(filename.match(/.txt$/i)) {
            response.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
            response.end(content, 'UTF-8');
            } else if(filename.match(/.css$/i)) {
            response.writeHead(200, {'Content-Type':'text/css; charset=utf-8'});
            response.end(content, 'UTF-8');
            } else if(filename.match(/.png$/i)) {
            response.writeHead(200, {'Content-Type':'image/png'});
            response.end(content);
            } else if(filename.match(/.jar$/i)) {
            response.writeHead(200, {'Content-Type':'application/java-archive'});
            response.end(content);
            } else if(filename.match(/.conf$/i)) {
            response.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
            response.end(content);
            }
    });
}

/**
 * Serve games list
 *
 * response: The response
 */
TockServer.prototype.IDLE_TIME = 30*1000;
TockServer.prototype.serveGameList = function(response) {
    var result, game, presence, i, j, now;
    now = new Date();
    result = [];
    for(i in this.games) {
	game = this.games[i];
	presence = [0,0,0,0];
	for(j=0; j<4; j++) {
            if((game.player[j]) && (game.player[j].name.match('^Yoshi$'))) {
		presence[j] = 3;
	    } else if(game.presence[j] != null) {
		presence[j] = ((now-game.presence[j]) < this.IDLE_TIME)?2:1;
	    }
	}
	game = { name: game.name,
	    creationDate: game.creationDate,
	    creator: game.creator, 
	    presence: presence,
	    attendee: game.attendee,
	    player: game.player,
	};
        result.push(game);
    }
    return result;
}

/**
 * Return a trustable string
 *
 * txt: A string data injected from client-side
 */
function protect(txt) {
	return (""+txt).replace(/[\\\/\s<>]+/g,' ');
}

/**
 * Create game
 *
 * _gamename: The game name
 * _by: The game creator
 */
TockServer.prototype.createGame = function(_gamename, _by) {
    var result, gamename, by;
    gamename = protect(_gamename.substring(0,64));
    by = protect(_by.substring(0,256));
    if(gamename in this.games) {
        result = false;
    } else if(gamename == '') {
        result = false;
    } else {
        this.games[gamename] = new shared.Game(gamename, by);
	this.log("Partie "+gamename+" crée par "+by);
        result = true;
    }
    return result;
};

/**
 * Restore game
 *
 * _gamename: The game name
 * _source: The source
 */
TockServer.prototype.restoreGame = function(_gamename, _source) {
    var i,j,dirs,dirname,folder,names, result, found, json, game;
    var gamename, source;
    gamename = protect(_gamename.substring(0,64));
    if(gamename in this.games) {
        return;
    } else if(gamename == '') {
        return;
    }
    source = _source.substring(0,1024);

    result = null;
    found = false;
    dirs = ['games', 'templates'];
    for(i=0; i<dirs.length; i++) {
	folder = path.join(process.cwd(), dirs[i]);
	names = fs.readdirSync(folder);
	for(j=0; j<names.length; j++) {
	    if(names[j] == source) {
		result = path.join(folder, names[j]);
		found = true;
		break;
	    }
	}
	if(found) {
	    break;
	}
    }
    if(found) {
	json = fs.readFileSync(result);
	game = gameFromJson(json);
	game.name = gamename;
        this.games[gamename] = game;
	this.log("Partie "+gamename+" restaurée");
    }
    return result;
};

/**
 * Get game state
 *
 * _gamename: The game name
 */
TockServer.prototype.getState = function(_gamename) {
    var gamename;
    gamename = protect(_gamename.substring(0,64));
    if(gamename in this.games) {
        return this.games[gamename];
    }
};

/**
 * Get game history counter
 *
 * _gamename: The game name
 */
TockServer.prototype.getPc = function(_gamename) {
    var gamename;
    gamename = protect(_gamename.substring(0,64));
    if(gamename in this.games) {
        return this.games[gamename].pc;
    }
};

/**
 * Join a game
 *
 * _gamename: The game name
 * _json: The array [color,playername,uuid]
 */
TockServer.prototype.joinGame = function(_gamename, _json) {
    var game, gamename, phase0, phase1, result, json, color;
    gamename = protect(_gamename.substring(0,64));
    if(! (gamename in this.games)) {
        return;
    }
    if(_json.length < 3) {
	return;
    }
    _json[0] = parseInt(_json[0])%4;
    _json[1] = protect(_json[1].substring(0,64));
    _json[2] = protect(_json[2].substring(0,256));
    json = _json;

    game = this.games[gamename];
    phase0 = game.phase;
    color = json[0];
    game.updatePresence(color);
    result = game.join(color, json[1], json[2]);
    phase1 = game.phase;
    if((phase0 == 'registration') && (phase1 != 'registration')) {
        this.processRobots(game);
    }
    return result;
};

/**
 * Exchange a card
 *
 * _gamename: The game name
 * _json: The array [playercolor, card]
 */
TockServer.prototype.exchange = function(_gamename, _json) {
    var game, gamename, json, color, card, found, sentcard;
    gamename = protect(_gamename.substring(0,64));
    if(! (gamename in this.games)) {
        return;
    }
    if(_json.length < 2) {
	return;
    }
    json = _json;

    color = parseInt(json[0]);
    game = this.games[gamename];
    game.updatePresence(color);
    if(game.phase != 'exchange') {
	return [false, 'Echange terminé'];
    }
    sentcard = json[1];
    found = false;
    for(i in game.hand[color]) {
	card = game.hand[color][i];
	if((card.color == sentcard.color) && (card.value == sentcard.value)) {
	    found = true;
	    break;
	}
    }
    if(!found) {
	return [false, 'Carte hors main'];
    }
    game.exchange(color, i);
    this.log("["+game.name+"] "+game.player[color].name
	    +" échange "+card);
    this.processRobots(game);
    return [true, 'OK'];
}

/**
 * Chat
 *
 * gamename: The game name
 * json: The array [playercolor, message]
 */
TockServer.prototype.chat = function(_gamename, _json) {
    var gamename, json;
    gamename = protect(_gamename.substring(0,64));
    if(! (gamename in this.games)) {
        return;
    }
    if(_json.length < 2) {
	return;
    }
    _json[1] = protect(_json[1].substring(0,1024));
    json = _json;

    this.games[gamename].addChat(parseInt(json[0]), json[1]);
}

/**
 * Play a move
 *
 * _gamename: The game name
 * _json: The array [playercolor, move]
 */
TockServer.prototype.play = function(_gamename, _json) {
    var game, gamename, json, color, moves, move, found;
    var sentjson, i, state, result;
    gamename = protect(_gamename.substring(0,64));
    if(! (gamename in this.games)) {
        return;
    }
    if(_json.length < 2) {
	return;
    }
    json = _json;

    game = this.games[gamename];
    if(game.phase != 'turn') {
	return [false, 'Echange terminé'];
    }
    color = parseInt(json[0]);
    game.updatePresence(color);
    if((game.turn%4) != color) {
	return [false, game.player[game.turn%4].name+" doit jouer d'abord"];
    }
    sentjson = JSON.stringify(json[1]);
    state = game.toState();
    moves = state.computeMoves();
    found = false;
    for(i=0; i<moves.length; i++) {
	if(JSON.stringify(moves[i]) == sentjson) {
	    move = moves[i];
	    found = true;
	    break;
	}
    }
    if(!found) {
	return [false, 'Mouvement non reconnu'];
    }
    result = state.handle(move);
    if(!result) {
	return [false, 'Mouvement non pris en compte'];
    }
    game.applyState(state);
    game.stackCard(move.card);
    this.log("["+game.name+"] "+game.player[color].name
	    +" pose "+new shared.Card(move.card[0],move.card[1])
	    +" et joue "+move);
    this.processRobots(game);
    return [true, 'UPDATED'];
};


/**
 * Handle a server request and potential errors
 *
 * request: The request
 * response: The response
 */
TockServer.prototype.serveRequest = function(request, response) {
    try {
        this.doServeRequest(request, response);
    } catch(err) {
        handleError(err, request);
    }
};

/**
 * Handle a request error
 *
 * err: The error
 * request: The request
 */
function handleError(err, request) {
    var title = "UNKNOWN";
    try {
        title = ""+err;
    } catch(err2) {
        // ...
    }

    util.log("Client ip = ["+request.connection.remoteAddress
            +"] at url = ["+request.url
            +"] caused server error = ["+title
            +"]");
    try {
        response.writeHead(500, {'Content-Type':
                'text/plain; charset=utf-8'});
        response.end("Server error");
    } catch(err3) {
        // ...
    }
};

/**
 * Handle a server request
 *
 * request: The request
 * response: The response
 */
TockServer.prototype.doServeRequest = function(request, response) {
    var uri, self;
    self = this;
    uri = request.url;
    if(! (uri.match(/^\/games$/) || (uri.match(/^\/state\/(.*)$/))
			    || (uri.match(/^\/pc\/(.*)$/)))) {
	    util.log(request.method+" "+request.url+" HTTP/"+request.httpVersion);
    }
    if(uri.match(/^\/$/)) {
        this.serveStatic('index.html', response);
    } else if(uri.match(/^\/[a-zA-Z0-9]+\.(png|html|css|txt)$/)) {
        this.serveStatic(uri.replace(/^\//, ''), response);
    } else if(uri.match(/^\/(client|json2|robots|shared|jsgraphics)\.js$/)) {
        this.serveStatic(uri.replace(/^\//, ''), response);
    } else if(uri.match(/^\/games$/)) {
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
        response.end(JSON.stringify(this.serveGameList()));
    } else if(uri.match(/^\/create\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.createGame(
			decodeURIComponent(uri.substring(8)), 
			body)));
	});
    } else if(uri.match(/^\/watch\/(.*)$/)) {
        this.serveStatic('game.html', response);
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
    } else if(uri.match(/^\/state\/(.*)$/)) {
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
        response.end(JSON.stringify(this.getState(
                        decodeURIComponent(uri.substring(7)))));
    } else if(uri.match(/^\/pc\/(.*)$/)) {
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
        response.end(JSON.stringify(this.getPc(
                        decodeURIComponent(uri.substring(4)))));
    } else if(uri.match(/^\/join\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.joinGame(
			decodeURIComponent(uri.substring(6)), 
			JSON.parse(body))));
	});
    } else if(uri.match(/^\/exchange\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.exchange(
			decodeURIComponent(uri.substring(10)), 
			JSON.parse(body))));
	});
    } else if(uri.match(/^\/play\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.play(
			decodeURIComponent(uri.substring(6)), 
			JSON.parse(body))));
	});
    } else if(uri.match(/^\/chat\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.chat(
			decodeURIComponent(uri.substring(6)), 
			JSON.parse(body))));
	});
    } else if(uri.match(/^\/save\/(.*)$/)) {
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
        response.end(JSON.stringify(this.saveGame(
                        decodeURIComponent(uri.substring(6)))));
    } else if(uri.match(/^\/saves$/)) {
        response.writeHead(200, {'Content-Type':
                'application/json; charset=utf-8'});
        response.end(JSON.stringify(this.savedGames()));
    } else if(uri.match(/^\/restore\/(.*)$/)) {
	postFetch(request, function(body) {
	    response.writeHead(200, {'Content-Type':
		'application/json; charset=utf-8'});
	    response.end(JSON.stringify(self.restoreGame(
			decodeURIComponent(uri.substring(9)), 
			body)));
	});
    } else {
        response.writeHead(404);
        response.end();
    }
};

/**
 * Return saved game names
 */
TockServer.prototype.savedGames = function() {
    var i,j,dirs,dirname,folder,names, result;
    result = [];
    dirs = ['games', 'templates'];
    for(i=0; i<dirs.length; i++) {
	folder = path.join(process.cwd(), dirs[i]);
	try { fs.mkdirSync(folder); } catch(err) {}
	names = fs.readdirSync(folder);
	for(j=0; j<names.length; j++) {
	    if(names[j].match(/\.tock$/)) {
		result.push(names[j]);
	    }
	}
    }
    return result;
};

/**
 * Save game on server
 *
 * _gamename: The game
 */
TockServer.prototype.saveGame = function(_gamename) {
    var game, gamename, filename, now, parentdir, basename;
    gamename = protect(_gamename.substring(0,64));
    if(! (gamename in this.games)) {
        return;
    }

    game = this.games[gamename];
    basename = (""+gamename).replace(/[^a-zA-Z0-9]+/g,'_');
    now = new Date();
    basename += "_"+now.getFullYear();
    basename += "_"+(now.getMonth()+1);
    basename += "_"+now.getDate();
    basename += "_"+now.getHours();
    basename += "_"+now.getMinutes();
    basename += "_"+now.getSeconds();
    basename += ".tock";
    parentdir = path.join(process.cwd(), 'games');
    try { fs.mkdirSync(parentdir); } catch(err) {}
    filename = path.join(parentdir, basename);
    fs.writeFile(filename, JSON.stringify(game));
    util.log("Game saved "+filename);
    return basename;
};

/**
 * Process robot moves.
 *
 * game: The game
 */
TockServer.prototype.processRobots = function(game) {
    var player, i, state, moves, move, result, n;
    if(game.phase == 'exchange') {
        for(i=0; i<4; i++) {
            player = game.player[i].name;
            if(player.match('^Yoshi$') && (game.exchanged[i] == null)) {
                n = new robots.Yoshi().choose(game);
		this.log("["+game.name+"] Yoshi#"+i+" échange "+n);
                game.exchange(i, new robots.Yoshi().choose(game));
            }
        }
    }
    // And
    if(game.phase == 'turn') {
	while((game.phase == 'turn') 
		&& (game.player[game.turn%4].name.match('^Yoshi$'))
		&& (game.isWon() == -1)) {
	    state = game.toState();
	    move = new robots.Yoshi().choose(game);
	    if(move) {
		this.log("["+game.name+"] Yoshi#"+(game.turn%4)+" joue "+move);
		this.applyMove(move, game);
	    }
	}
    }
};

/**
 * Apply a move to game, in place
 *
 * move: The move
 * game: The game
 */
TockServer.prototype.applyMove = function(move, game) {
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

/*
 * Handle a post request.
 *
 * request: The request
 * callback: The callback to perform upon body completion
 */
function postFetch(request, callback) {
    var body = '';
    request.on('data', function(data) { body += data; });
    request.on('end', function() { 
            try { callback(body) } 
            catch(err) { handleError(err, request); }
            });
}

/**
 * Main
 */
var server = new TockServer();
var port, i, log;
log = null;
port = (process && (+(process.env.PORT))) || 5000;
for(i=0; i<process.argv.length; i++) {
    if(process.argv[i] == '-p') {
        port = parseInt(process.argv[++i]);
    }
    if(process.argv[i] == '-l') {
        log = process.argv[++i];
    }
}
util.log("Starting tock server on port "+port);
server.setLog(log);
server.listen(port);
util.log("Tock server started")

