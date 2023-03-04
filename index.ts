import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import fs from "fs"

const app = express();

app.use(express.static(`./web`));

class Client {

    public socket: WebSocket;
    public id: string;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.id = this.generateId();
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    public send(message: string) {
        this.socket.send(message);
    }
}

class Game {

    public whitePlayer: Client;
    public blackPlayer: Client|null;

    public whiteLoaded = false
    public blackLoaded = false

    public BoardState: string
    public PlayerTurn: string = "white"

    public PublicRoom: boolean = false

    public ID: string;

    constructor(whitePlayer: Client, Public: boolean) {
        this.whitePlayer = whitePlayer;
        this.blackPlayer = null;
        this.BoardState = '';

        this.PublicRoom = Public

        this.ID = this.generateId();
    }

    public join(blackPlayer: Client) {
        if (this.blackPlayer) return false;
        this.blackPlayer = blackPlayer;
        return true;
    }

    public start() {
        this.BoardState = 'RNBQKBNRPPPPPPPP0000000000000000000000000000000000000000000000000000000000008pppppppprnbqkbnr';
        this.informClients({ "function": "start", "boardState": this.BoardState });
    }

    public informClients(message: any) {
        this.whitePlayer.send(JSON.stringify(message));
        this.blackPlayer?.send(JSON.stringify(message));
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }


}

const clients: Client[] = [];
const games: Game[] = [];

const wsServer = new WebSocketServer({ noServer: true });
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
                } else {
                    client.send(JSON.stringify({ "function": "join", "error": "Game not found" }));
                }
                break;

            case 'create':
                const newGame = new Game(client, data.public);
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
                const gameToLoad = games.find(game => game.whitePlayer.id === client.id || game.blackPlayer?.id === client.id);
                if (gameToLoad) {
                    if (gameToLoad.whitePlayer.id === client.id) {
                        gameToLoad.whiteLoaded = true;
                    } else {
                        gameToLoad.blackLoaded = true;
                    }
                    if (gameToLoad.whiteLoaded && gameToLoad.blackLoaded) {
                        gameToLoad.informClients({ "function": "gameStart", "turn": gameToLoad.PlayerTurn });
                    }
                }

                break;
            case "move":
                const gameToMove = games.find(game => game.whitePlayer.id === client.id || game.blackPlayer?.id === client.id);
                if (gameToMove) {

                    let ThisPlayer = gameToMove.whitePlayer.id === client.id ? gameToMove.whitePlayer : gameToMove.blackPlayer;
                    let OtherPlayer = gameToMove.whitePlayer.id === client.id ? gameToMove.blackPlayer : gameToMove.whitePlayer;

                    let NowTurn = gameToMove.PlayerTurn == "white" ? "black" : "white";
                    gameToMove.PlayerTurn = NowTurn;

                    ThisPlayer?.send(JSON.stringify({ "function": "turnUpdate", "turn": NowTurn }));
                    OtherPlayer?.send(JSON.stringify({ "function": "move", "from": data.from, "to": data.to, "turn": NowTurn , "capture": data.capture}));

                    gameToMove.BoardState = data.boardState;
                    
                }
        }

    });

    socket.on('close', () => {
        clients.splice(clients.indexOf(client), 1);

        const game = games.find(game => game.whitePlayer.id === client.id || game.blackPlayer?.id === client.id);
        if (game) {
            game.informClients({ "function": "playerLeave", "clientId": client.id });
            games.splice(games.indexOf(game), 1);
        }

    });

});

app.get('/api/games', (req, res) => {
    res.json(games.map(game => {
        return {
            id: game.PublicRoom || game.blackPlayer ? game.ID : "redacted",
            whitePlayer: game.whitePlayer.id,
            blackPlayer: game.blackPlayer?.id,
            public: game.PublicRoom,
            boardState: game.BoardState,
        }
    }));
});

let port = process.env.PORT || 5050
let server = app.listen(port, () => {
    console.log('Server started on port: ' + port);
});

server.on('upgrade', (request, socket, head) => {
    
    let timeStamp = request.url?.split('/')[3]

    // if timestamp happend within 5 seconds of now, accept the request
    if (timeStamp && (Date.now() - parseInt(timeStamp)) < 5000) {

        wsServer.handleUpgrade(request, socket, head, socket => {
            wsServer.emit('connection', socket, request);
        });

    } else {
        socket.destroy();
    }

});