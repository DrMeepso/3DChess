let MultiplayerSocket = new WebSocket("ws://localhost:3000")
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

    //MultiplayerSocket.send(JSON.stringify( { "function": "create" } ));

    event.target.addEventListener("message", function (event) {

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

                console.screen("Joined game!, ID: " + data.gameId)
                Game.gameId = data.gameId
                Game.opponentId = data.whitePlayer

                break
            case "playerJoin":

                console.log(data)
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

                console.screen("Game started!")
                createScene()
                    .then(game => {

                        let babyscene = game.scene
                        let Board = game.CurrentBoard

                        Board.convertFento3D(data.boardState)
                        Board.ThisPlayerColor = Game.playerColor

                        Board.CurrentTurnColor = "white"

                        Board.addEventListener("move", function (event) {
                            
                            let info = event.detail

                            MultiplayerSocket.send(JSON.stringify({ "function": "move", "from": info.piece, "to": info.position }))

                        })

                        Game.CurrentBoard = Board

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

                    })
                break

            case "gameStart":
                console.screen("All players loaded, Ready to play!")
            break

            case "move":

                let Board = Game.CurrentBoard
                Board.CurrentTurnColor = data.turn

                console.screen("Turn updated!, " + data.turn)

                break
            case "turnUpdate":
                Game.CurrentBoard.CurrentTurnColor = data.turn
                console.screen("Turn updated!, " + data.turn)
                break

        }

    });

});

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

    MultiplayerSocket.send(JSON.stringify({ "function": "create" }));

})

document.getElementById("joinGame").addEventListener("click", function () {

    MultiplayerSocket.send(JSON.stringify({ "function": "join", "gameId": document.getElementById("gameID").value }));

})