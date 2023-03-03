"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const app = (0, express_1.default)();
app.use(express_1.default.static(`./web`));
class Client {
    constructor(socket) {
        this.socket = socket;
        this.id = this.generateId();
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    send(message) {
        this.socket.send(message);
    }
}
class Game {
    constructor(whitePlayer) {
        this.whiteLoaded = false;
        this.blackLoaded = false;
        this.PlayerTurn = "white";
        this.whitePlayer = whitePlayer;
        this.blackPlayer = null;
        this.BoardState = '';
        this.ID = this.generateId();
    }
    join(blackPlayer) {
        if (this.blackPlayer)
            return false;
        this.blackPlayer = blackPlayer;
        return true;
    }
    start() {
        this.BoardState = 'RNBQKBNRPPPPPPPP0000000000000000000000000000000000000000000000000000000000008pppppppprnbqkbnr';
        this.informClients({ "function": "start", "boardState": this.BoardState });
    }
    informClients(message) {
        var _a;
        this.whitePlayer.send(JSON.stringify(message));
        (_a = this.blackPlayer) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(message));
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
const clients = [];
const games = [];
const wsServer = new ws_1.WebSocketServer({ noServer: true });
wsServer.on('connection', socket => {
    const client = new Client(socket);
    clients.push(client);
    client.send(JSON.stringify({ "function": "connect", "clientId": client.id }));
    socket.on('message', message => {
        const data = JSON.parse(message.toString());
        switch (data.function) {
            case 'join':
                const game = games.find(game => game.ID === data.gameId);
                if (game) {
                    if (game.join(client)) {
                        client.send(JSON.stringify({ "function": "join", "gameId": game.ID, "whitePlayer": game.whitePlayer.id }));
                        game.informClients({ "function": "playerJoin", "clientId": client.id });
                    }
                }
                else {
                    client.send(JSON.stringify({ "function": "join", "error": "Game not found" }));
                }
                break;
            case 'create':
                const newGame = new Game(client);
                games.push(newGame);
                client.send(JSON.stringify({ "function": "create", "gameId": newGame.ID }));
                break;
            case 'start':
                const gameToStart = games.find(game => game.whitePlayer.id === client.id);
                if (gameToStart) {
                    gameToStart.start();
                }
                break;
            case "loaded":
                const gameToLoad = games.find(game => { var _a; return game.whitePlayer.id === client.id || ((_a = game.blackPlayer) === null || _a === void 0 ? void 0 : _a.id) === client.id; });
                if (gameToLoad) {
                    if (gameToLoad.whitePlayer.id === client.id) {
                        gameToLoad.whiteLoaded = true;
                    }
                    else {
                        gameToLoad.blackLoaded = true;
                    }
                    if (gameToLoad.whiteLoaded && gameToLoad.blackLoaded) {
                        gameToLoad.informClients({ "function": "gameStart", "turn": gameToLoad.PlayerTurn });
                    }
                }
                break;
            case "move":
                const gameToMove = games.find(game => { var _a; return game.whitePlayer.id === client.id || ((_a = game.blackPlayer) === null || _a === void 0 ? void 0 : _a.id) === client.id; });
                if (gameToMove) {
                    let ThisPlayer = gameToMove.whitePlayer.id === client.id ? gameToMove.whitePlayer : gameToMove.blackPlayer;
                    let OtherPlayer = gameToMove.whitePlayer.id === client.id ? gameToMove.blackPlayer : gameToMove.whitePlayer;
                    let NowTurn = gameToMove.PlayerTurn == "white" ? "black" : "white";
                    gameToMove.PlayerTurn = NowTurn;
                    ThisPlayer === null || ThisPlayer === void 0 ? void 0 : ThisPlayer.send(JSON.stringify({ "function": "turnUpdate", "turn": NowTurn }));
                    OtherPlayer === null || OtherPlayer === void 0 ? void 0 : OtherPlayer.send(JSON.stringify({ "function": "move", "from": data.from, "to": data.to, "turn": NowTurn, "capture": data.capture }));
                }
        }
    });
    socket.on('close', () => {
        clients.splice(clients.indexOf(client), 1);
    });
});
let server = app.listen(process.env.PORT || 5050, () => {
    console.log('Listening on port 3000');
});
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});
