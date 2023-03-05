let CurrentURL = document.location.href.replace("http", "ws").replace("https", "wss")
let WSURL = CurrentURL + "api/ws/" + Date.now()
let MultiplayerSocket = new WebSocket(WSURL)
console.screen("Attempting to connect to server...")

let Game = {

    "gameId": null,

    "clientId": null,
    "opponentId": null,

    "playerColor": null,
    "opponentColor": null,

    "playerTurn": null,

    "CurrentBoard": null

}

MultiplayerSocket.addEventListener("open", function (event) {

    event.target.addEventListener("message", async function (event) {

        let data = JSON.parse(event.data)

        switch (data.function) {

            case "connect":
                console.screen("Connected to server!, ID: " + data.clientId)
                Game.clientId = data.clientId

                break

            case "create":

                console.screen("Created game!, ID: " + data.gameId)
                Game.gameId = data.gameId
                Game.playerColor = "white"

                UpdateGameDisplay()

                break

            case "join":

                if (data.error) {
                    console.screen("Failed to join game!, " + data.error)
                    return
                }
                console.screen("Joined game!, ID: " + data.gameId)
                Game.gameId = data.gameId
                Game.opponentId = data.whitePlayer

                break

            case "playerJoin":

                console.screen("Player joined!, ID: " + data.clientId)
                if (data.clientId != Game.clientId) {
                    Game.opponentId = data.clientId
                    Game.playerColor = "white"
                    Game.opponentColor = "black"
                } else {
                    Game.playerColor = "black"
                    Game.opponentColor = "white"
                }

                UpdateGameDisplay()

                break

            case "start":

                document.getElementById("UI").style.display = "none"
                console.screen("Game Loading...")
                createScene()
                    .then(async (game) => {

                        let babyscene = game.scene
                        let Board = game.CurrentBoard
                        Board.ThisPlayerColor = Game.playerColor

                        Game.CurrentBoard = Board

                        console.screen("Loading assets...")
                        await waitForAssets()

                        Board.convertFento3D(data.boardState)

                        Board.CurrentTurnColor = "white"

                        Board.addEventListener("move", function (event) {

                            let info = event.detail
                            setTimeout(() => {
                                MultiplayerSocket.send(JSON.stringify({ "function": "move", "from": info.piece, "to": info.position, "capture": info.capture, "boardState": Board.convert3Dtofen() }))
                            }, 10)

                            // captured piece
                            let capturedPiece = Board.CapturedPieces.find(e => e.position.x == info.position._x && e.position.y == info.position._y && e.position.z == info.position._z)
                            if (capturedPiece && capturedPiece.type == "king") {
                                console.log("King Taken!")
                                GameEnded()
                            }

                        })

                        console.screen("Loaded!")
                        document.getElementById("UI").style.display = "none"
                        MultiplayerSocket.send(JSON.stringify({ "function": "loaded" }))

                        // Register a render loop to repeatedly render the scene
                        engine.runRenderLoop(function () {
                            babyscene.render();
                        });
                        // Watch for browser/canvas resize events
                        window.addEventListener("resize", function () {
                            engine.resize();
                        });
                        engine.resize();

                    })
                break

            case "gameStart":
                console.screen("All players loaded, Ready to play!")
                document.getElementById("GameUI").style.display = "flex"
                UpdateGameInfo()
                break

            case "move":

                let Board = Game.CurrentBoard
                Board.CurrentTurnColor = data.turn

                let From = new BABYLON.Vector3(data.from._x, data.from._y, data.from._z)
                let To = new BABYLON.Vector3(data.to._x, data.to._y, data.to._z)

                if (data.capture) {

                    let Peice = Board.Pieces.find(e => e.position.x == To.x && e.position.y == To.y && e.position.z == To.z)
                    Board.CapturePiece(Peice)

                    // captured piece
                    if (Peice && Peice.type == "king") {
                        console.log("King Taken!")
                        GameEnded()
                    }

                }

                let Peice = Board.Pieces.find(e => e.position.x == From.x && e.position.y == From.y && e.position.z == From.z)
                Peice.moveTo(To.x, To.y, To.z)

                UpdateGameInfo()
                break

            case "turnUpdate":
                Game.CurrentBoard.CurrentTurnColor = data.turn
                UpdateGameInfo()
                break

            case "playerLeave":
                console.screen("Player left!")
                Game.opponentId = null
                Game.opponentColor = null
                UpdateGameDisplay()

                setInterval(() => {
                    console.screen("Please reload the page to play again!")
                }, 5000)

                break

        }

    });

});

async function waitForAssets() {

    return new Promise((resolve, reject) => {

        let interval = setInterval(() => {

            if (piecePrefab.pawn) {
                clearInterval(interval)
                resolve()
            }

        }, 100)

    })

}

document.getElementById("restartGame").onclick = function () {

    location.reload()

}

function GameEnded() {

    document.getElementById("GameEndUI").style.display = "flex"
    document.getElementById("GameUI").style.display = "none"

    if (Game.CurrentBoard.Pieces.find( e => e.type == "king" && e.team == Game.playerColor )) {
        document.getElementById("GameEndText").innerText = "You Won!"
    } else {
        document.getElementById("GameEndText").innerText = "You Lost!"
    }

}

function UpdateGameInfo() {

    document.getElementById("TurnP").innerText = `Its ${Game.CurrentBoard.CurrentTurnColor == Game.playerColor ? "Your" : Game.CurrentBoard.CurrentTurnColor + "'s"} turn!`

    if (Game.CurrentBoard.checkForCheck("black")) {
        document.getElementById("BlackWarning").style.display = "block"
    } else {
        document.getElementById("BlackWarning").style.display = "none"
    }

    if (Game.CurrentBoard.checkForCheck("white")) {
        document.getElementById("WhiteWarning").style.display = "block"
    } else {
        document.getElementById("WhiteWarning").style.display = "none"
    }

    let typeToChar = {
        "pawn": "p",
        "rook": "r",
        "knight": "n",
        "bishop": "b",
        "queen": "q",
        "king": "k"
    }

    let capturedPieces = Game.CurrentBoard.CapturedPieces

    let WhiteHolder = document.getElementById("WhiteCaptureDisplay")
    let BlackHolder = document.getElementById("BlackCaptureDisplay")

    BlackHolder.innerHTML = ""
    WhiteHolder.innerHTML = ""

    capturedPieces.forEach(e => {

        let piece = e.type
        let color = e.team

        let pieceChar = typeToChar[piece]

        let html = `<img class="CapturedPiece" src="./sprites/${color == "white" ? "w" : "b"}${pieceChar}.png">`

        if (color == "white") {
            BlackHolder.innerHTML += html
        } else {
            WhiteHolder.innerHTML += html
        }

    })

    if (Game.playerColor == "white") {
        document.getElementById("GameUI").style.flexDirection = "row-reverse"
    }

}

let gameDisplay = document.getElementById("game")
function UpdateGameDisplay() {

    gameDisplay.id = "gameInfo"

    gameDisplay.innerHTML = `
    
    <p>Game ID: ${Game.gameId}</p>

    <p class="Header">Player Info</p>
    <p>Your Color: ${Game.playerColor}</p>

    <p class="Header">Opponent Info</p>
    ${Game.opponentId ? `<p>Opponent: ${Game.opponentColor}</p>` : `<p>Opponent: Waiting...</p>`}
    
    <br>
    ${Game.opponentId && Game.playerColor == "white" ? `<button id="startGame">Start Game</button>` : ``}
    ${Game.opponentId && Game.playerColor == "black" ? `<p>Waiting for host to start game</p>` : ``}

    `

    if (Game.opponentId && Game.playerColor == "white") {
        document.getElementById("startGame").addEventListener("click", function () {
            MultiplayerSocket.send(JSON.stringify({ "function": "start" }))
        })
    }

}

document.getElementById("createGame").addEventListener("click", function () {

    MultiplayerSocket.send(JSON.stringify({ "function": "create", "public": !document.getElementById("privateGame").checked }));

})

document.getElementById("joinGame").addEventListener("click", function () {

    MultiplayerSocket.send(JSON.stringify({ "function": "join", "gameId": document.getElementById("gameID").value }));

})