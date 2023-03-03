const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const piecePrefab = {}
const Boards = []

function DegsToRads(degs) {
    return degs * Math.PI / 180
}
function getPosition(x, y, z) {
    return new BABYLON.Vector3(-((x * 2) + 1), ((y * 2) + 1) - 1, (z * 2) + 1)
}
function lerp(a, b, n) {
    return (1 - n) * a + n * b;
}

class BoardSpace {

    meshSize = 2
    babylonMesh = null;

    position = new BABYLON.Vector3(0, 0, 0)

    constructor(x, y, z, scene) {

        this.position = new BABYLON.Vector3(x, y, z)

    }

}

class Piece {

    boardParent = null
    babylonMesh = null;
    meshNameTable = {

        "king": "king.glb",
        "queen": "queen.glb",
        "rook": "rook.glb",
        "bishop": "bishop.glb",
        "knight": "knight.glb",
        "pawn": "pawn.glb"

    }
    team = "white"
    type = "king"
    captured = false
    firstMove = true
    scene = null

    position = new BABYLON.Vector3(0, 0, 0)

    constructor(x, y, z, scene, type, team, boardParent) {

        let whitePieceTexture = new BABYLON.Texture("textures/White_BaseColor.png", scene);
        let blackPieceTexture = new BABYLON.Texture("textures/Black_BaseColor.png", scene);

        whitePieceTexture.hasAlpha = true;
        blackPieceTexture.hasAlpha = true;

        this.boardParent = boardParent
        this.team = team
        this.type = type
        this.position = new BABYLON.Vector3(x, y, z)

        this.scene = scene

        //clone prefab from table
        this.babylonMesh = piecePrefab[type].clone()
        this.babylonMesh.isVisible = true

        // set name
        this.babylonMesh.name = "piece"

        // make sure origin is in the center
        this.setPosition(x, y, z)

        if (team == "white") {

            this.babylonMesh.material = new BABYLON.StandardMaterial("mat", scene);
            this.babylonMesh.material.diffuseTexture = whitePieceTexture;
            this.babylonMesh.material.normalTexture = new BABYLON.Texture("textures/White_Normal.png", scene);
            this.babylonMesh.material.roughnessTexture = new BABYLON.Texture("textures/White_Roughness.png", scene);

            // fuck if i know
            this.babylonMesh.rotation = new BABYLON.Vector3(DegsToRads(90), DegsToRads(180), 0)

        } else {

            this.babylonMesh.material = new BABYLON.StandardMaterial("mat", scene);
            this.babylonMesh.material.diffuseTexture = blackPieceTexture;
            this.babylonMesh.material.normalTexture = new BABYLON.Texture("textures/Black_Normal.png", scene);
            this.babylonMesh.material.roughnessTexture = new BABYLON.Texture("textures/Black_Roughness.png", scene);

        }

        // registure hover over
        this.babylonMesh.actionManager = new BABYLON.ActionManager(scene);
        this.babylonMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function (ev) {

        }));
        this.babylonMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function (ev) {

        }));

    }

    setPosition(x, y, z) {
        this.babylonMesh.position = new BABYLON.Vector3(-((x * 2) + 1), ((y * 2) + 1) - 1, (z * 2) + 1)
        this.position = new BABYLON.Vector3(x, y, z)
    }

    moveTo(x, y, z) {

        // tween to new position
        let tween = new BABYLON.Animation("tween", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        let keys = [];
        keys.push({
            frame: 0,
            value: this.babylonMesh.position
        });
        keys.push({
            frame: 30,
            value: getPosition(x, y, z)
        });
        tween.setKeys(keys);
        this.babylonMesh.animations.push(tween);
        var thisP = this
        this.scene.beginAnimation(this.babylonMesh, 0, 30, false, 3, function () {
            thisP.setPosition(x, y, z)
            thisP.animations = []
            thisP.firstMove = false
        });

    }

    getPossibleMoves(PeicesToConsider) {

        let MoveClasses = {

            "king": KingMovement,
            "queen": QueenMovement,
            "rook": RookMovement,
            "bishop": BishopMovement,
            "knight": KnightMovement,
            "pawn": PawnMovement

        }

        let MoveClass = MoveClasses[this.type]

        MoveClass = new MoveClass(this.firstMove, this.team)
        let Pieces = PeicesToConsider || this.boardParent.Pieces
        return MoveClass.CalculateMove(this.position, Pieces, this.boardParent, PeicesToConsider)

    }

}

class PreviewPiece {

    babylonMesh = null;
    position = new BABYLON.Vector3(0, 0, 0)
    capture = false

    constructor(orignalPiece, x, y, z, scene, team, capture, CurrentBoard) {

        this.capture = capture
        this.position = new BABYLON.Vector3(x, y, z)

        if (capture) {

            let CellOcupant = CurrentBoard.Pieces.find(e => e.position.x == x && e.position.y == y && e.position.z == z)
            CellOcupant.babylonMesh.isPickable = false

            CellOcupant.babylonMesh.renderingGroupId = 0

        }

        this.babylonMesh = orignalPiece.babylonMesh.clone()


        this.babylonMesh.material = new BABYLON.StandardMaterial("mat", scene);
        if (capture) {
            this.babylonMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        } else {
            this.babylonMesh.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
        }

        this.babylonMesh.material.alpha = .5;
        this.babylonMesh.material.backFaceCulling = false;

        this.babylonMesh.outlineWidth = 0
        this.babylonMesh.outlineAlpha = 1

        this.babylonMesh.isVisible = true

        // set name
        this.babylonMesh.name = "preview"

        if (team == "white") {

            this.babylonMesh.rotation = new BABYLON.Vector3(DegsToRads(90), DegsToRads(180), 0)

        }

        this.setPosition(x, y, z)


        this.babylonMesh.actionManager = new BABYLON.ActionManager(scene);
        this.babylonMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function (evt) { }))
        this.babylonMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function (evt) { }));


    }

    setPosition(x, y, z) {
        this.babylonMesh.position = new BABYLON.Vector3(-((x * 2) + 1), ((y * 2) + 1) - 1, (z * 2) + 1)
        this.position = new BABYLON.Vector3(x, y, z)
    }

}



class Board extends EventTarget {

    BoardSpaces = []
    Pieces = []
    Scene = null

    CapturedPieces = []
    PreviewPieces = []

    SelectedPiece = null
    ClickedPiece = null

    CurrentTurnColor = "white"
    ThisPlayerColor = "white"

    constructor(scene) {

        super()
        this.Scene = scene

        for (let x = 0; x < 8; x++) {

            for (let y = 0; y < 8; y++) {

                for (let z = 0; z < 10; z++) {

                    this.BoardSpaces.push(new BoardSpace(x, y, z, scene));

                }

            }

        }

        let Length = 10 * 2
        let Width = 8 * 2
        let Height = 8 * 2


        for (let l = 0; l < Length + 2; l += 2) {
            for (let h = 0; h < Height + 0; h += 2) {

                // draw line
                let line = BABYLON.MeshBuilder.CreateLines("lines", {
                    points: [
                        new BABYLON.Vector3(0, h, l),
                        new BABYLON.Vector3(Width, h, l)
                    ]
                }, scene);

                let c = 0
                line.color = new BABYLON.Color4(c, c, c)

                line.isPickable = false

            }
        }
        for (let h = 0; h < Height + 0; h += 2) {
            for (let l = 0; l < Length - 2; l += 2) {

                // draw line
                let line = BABYLON.MeshBuilder.CreateLines("lines", {
                    points: [
                        new BABYLON.Vector3(l, h, 0),
                        new BABYLON.Vector3(l, h, Length)
                    ]
                }, scene);

                let c = 0
                line.color = new BABYLON.Color4(c, c, c)

                line.isPickable = false

            }
        }

        return

        for (let l = 0; l < Length + 2; l += 2) {
            for (let w = 0; w < Width + 2; w += 2) {

                // draw line
                let line = BABYLON.MeshBuilder.CreateLines("lines", {
                    points: [
                        new BABYLON.Vector3(w, 0, l),
                        new BABYLON.Vector3(w, Height, l)
                    ]
                }, scene);
                line.color = new BABYLON.Color4(0, 0, 0, 0.2)

            }
        }

    }

    createPiece(x, y, z, type, team) {

        this.Pieces.push(new Piece(x, y, z, this.Scene, type, team, this));

    }

    async loadJSONState(jsonURL) {

        let resp = await fetch(jsonURL)
        let json = await resp.json()
        json = json.board

        for (let y = 0; y < 8; y++) {

            for (let z = 0; z < 10; z++) {

                for (let x = 0; x < 8; x++) {

                    if (json[y][z][x] != 0) {

                        let peiceInfo = this.decodePieceType(json[y][z][x])
                        this.createPiece(x, y, z, peiceInfo[0], peiceInfo[1])

                    }

                }

            }

        }

    }

    decodePieceType(type) {

        let Team = type.split("")[0] == "w" ? "white" : "black"
        let Type = type.split("")[1]

        switch (Type) {

            case "k":
                return ["king", Team]

            case "q":
                return ["queen", Team]

            case "r":
                return ["rook", Team]

            case "b":
                return ["bishop", Team]

            case "n":
                return ["knight", Team]

            case "p":
                return ["pawn", Team]

        }

    }

    getPieceAt(x, y, z) {

        for (let i = 0; i < this.Pieces.length; i++) {

            if (this.Pieces[i].position.x == x && this.Pieces[i].position.y == y && this.Pieces[i].position.z == z) {

                return this.Pieces[i]

            }

        }

        return null

    }

    convert3Dtofen() {

        let nameToLetter = {
            "pawn": "P",
            "rook": "R",
            "knight": "N",
            "bishop": "B",
            "queen": "Q",
            "king": "K"
        }

        let fen = ""

        for (let y = 0; y < 8; y++) {

            for (let z = 0; z < 10; z++) {

                for (let x = 0; x < 8; x++) {

                    let piece = this.getPieceAt(x, y, z)

                    if (piece != null) {

                        let letter = nameToLetter[piece.type]

                        if (piece.team == "black") {

                            letter = letter.toLowerCase()

                        }

                        fen += letter

                    } else {
                        fen += "#"
                    }

                }

            }

        }

        fen = fen.replaceAll("##########", "0")
        fen = fen.replaceAll("#########", "9")
        fen = fen.replaceAll("########", "8")
        fen = fen.replaceAll("#######", "7")
        fen = fen.replaceAll("######", "6")
        fen = fen.replaceAll("#####", "5")
        fen = fen.replaceAll("####", "4")
        fen = fen.replaceAll("###", "3")
        fen = fen.replaceAll("##", "2")
        fen = fen.replaceAll("#", "1")


        return fen

    }

    convertFento3D(fen) {

        let letterToName = {
            "P": "pawn",
            "R": "rook",
            "N": "knight",
            "B": "bishop",
            "Q": "queen",
            "K": "king",
            "p": "pawn",
            "r": "rook",
            "n": "knight",
            "b": "bishop",
            "q": "queen",
            "k": "king"
        }

        fen = fen.replaceAll("0", "##########")
        fen = fen.replaceAll("9", "#########")
        fen = fen.replaceAll("8", "########")
        fen = fen.replaceAll("7", "#######")
        fen = fen.replaceAll("6", "######")
        fen = fen.replaceAll("5", "#####")
        fen = fen.replaceAll("4", "####")
        fen = fen.replaceAll("3", "###")
        fen = fen.replaceAll("2", "##")
        fen = fen.replaceAll("1", "#")

        let index = 0

        for (let y = 0; y < 8; y++) {

            for (let z = 0; z < 10; z++) {

                for (let x = 0; x < 8; x++) {

                    let letter = fen.split("")[index]

                    if (letter != "#") {

                        let name = letterToName[letter]

                        let team = letter == letter.toUpperCase() ? "white" : "black"

                        this.createPiece(x, y, z, name, team)

                    }

                    index++

                }

            }

        }

    }

    CapturePiece(piece) {

        piece.babylonMesh.dispose()
        this.Pieces.splice(this.Pieces.indexOf(piece), 1)
        this.CapturedPieces.push(piece)

        console.screen(`Captured ${piece.team} ${piece.type}`)

    }

    getAllMoves(team, pieces) {

        pieces = pieces || this.Pieces

        let allMoves = []
        let Pieces = this.Pieces.filter(e => e.type != "king")
        Pieces = Pieces.filter(e => e.team == team)
        Pieces.forEach(piece => {

            let moves = piece.getPossibleMoves(this.Pieces.filter(e => e.team != team && e.type != "king"))

            allMoves = allMoves.concat(moves.Moves)
            allMoves = allMoves.concat(moves.Captures)

        })

        return allMoves

    }
}

const createScene = async function () {

    let scene = new BABYLON.Scene(engine);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);

    scene.freezeActiveMeshes();

    const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, new BABYLON.Vector3((8 * 2) / 2, (8 * 2) / 2, (10 * 2) / 2), scene);
    camera.inertia = 0

    camera.angularSensibilityX = 300;
    camera.angularSensibilityY = 300;
    camera.wheelPrecision = 10;

    camera.setPosition(new BABYLON.Vector3((8 * 2) / 2 + 20, (8 * 2) / 2 + 20, (8 * 2) / 2 + 20));
    camera.attachControl(canvas, true);

    // fov
    camera.fov = 1.1

    // uniform light
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var hemi1 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, -1, 0), scene);
    hemi1.intensity = 0.5;
    hemi1.groundColor = new BABYLON.Color3(1, 1, 1);
    hemi1.specular = BABYLON.Color3.Black();

    // load models of pieces from single file
    BABYLON.SceneLoader.ImportMesh("", "./meshs/", "Browser.glb", scene, async function (newMeshes) {

        newMeshes.forEach((mesh, i) => {

            if (i == 0) return

            // set position
            mesh.position = new BABYLON.Vector3(i * 1, -1, 0);
            mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);

            // make invisible
            mesh.isVisible = false

            switch (mesh.name) {
                case "King_Sphere.003":
                    mesh.name = "king"
                    break;

                case "Queen_Sphere.004":
                    mesh.name = "queen"
                    break;

                case "rook_Sphere.007":
                    mesh.name = "rook"
                    break;

                case "Bishop_Sphere.009":
                    mesh.name = "bishop"
                    break;

                case "Knight_Sphere.002":
                    mesh.name = "knight"
                    break;

                case "Bishop.001_Sphere.004":
                    mesh.name = "pawn"
                    break;
            }

            piecePrefab[mesh.name] = mesh
        })

        await new Promise(resolve => setTimeout(resolve, 1000));

    })

    await new Promise(resolve => setTimeout(resolve, 1000));

    let CurrentBoard = new Board(scene)
    //CurrentBoard.convertFento3D(`RNBQKBNRPPPPPPPP0000000000000000000000000000000000000000000000000000000000008pppppppprnbqkbnr`)

    Boards.push(CurrentBoard)

    // on mouse hover
    scene.onPointerMove = function (evt, pickResult) {

        CurrentBoard.Pieces.forEach(piece => {

            if (!piece.babylonMesh) return
            piece.babylonMesh.renderOutline = false;

        })

        CurrentBoard.PreviewPieces.forEach(piece => {

            if (!piece.babylonMesh) return
            piece.babylonMesh.renderOutline = false;

        })

        CurrentBoard.SelectedPiece = undefined
        if (pickResult.hit) {

            // outline the mesh
            let mesh = pickResult.pickedMesh
            mesh.renderOutline = true;
            mesh.outlineColor = new BABYLON.Color3(1, 1, 1);
            mesh.outlineWidth = 1;

            let piece = CurrentBoard.Pieces.find(e => e.babylonMesh == mesh)
            CurrentBoard.SelectedPiece = piece

        }
    }

    scene.onPointerDown = function (evt, pickResult) {

        if (evt.button != 0 || !pickResult.hit || evt.dragging) return

        if (pickResult.hit && pickResult.pickedMesh.name == "preview") {

            CurrentBoard.Pieces.forEach(e => {
                e.babylonMesh.isPickable = true
            })

            // find the preview piece
            let piece = CurrentBoard.PreviewPieces.find(e => e.babylonMesh == pickResult.pickedMesh)

            // check if capture
            let capture = CurrentBoard.Pieces.find(e => e.position.x == piece.position.x && e.position.y == piece.position.y && e.position.z == piece.position.z)
            if (capture) CurrentBoard.CapturePiece(capture)

            // dispatch a move event
            let event = new CustomEvent("move", {
                "detail": {
                    piece: CurrentBoard.ClickedPiece.position,
                    position: piece.position,
                    capture: capture ? true : false
                }
            })

            CurrentBoard.dispatchEvent(event)

            let $ = piece.position

            // move the piece
            CurrentBoard.ClickedPiece.moveTo($.x, $.y, $.z)

            // tween the cameras traget
            let tween2 = new BABYLON.Animation("tween", "target", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            let keys2 = [];
            keys2.push({
                frame: 0,
                value: camera.target
            });
            keys2.push({
                frame: 30,
                value: new BABYLON.Vector3(($.x * 2) + 1, ($.y * 2) + 1, ($.z * 2) + 1)
            });
            tween2.setKeys(keys2);
            camera.animations.push(tween2);
            scene.beginAnimation(camera, 0, 30, false, 3);

            CurrentBoard.PreviewPieces.forEach(piece => {
                piece.babylonMesh.dispose()
            })

            CurrentBoard.ClickedPiece.firstMove = false

        }

        if (CurrentBoard.SelectedPiece && pickResult.pickedMesh.name == "piece") {

            if (CurrentBoard.CurrentTurnColor != CurrentBoard.ThisPlayerColor) return
            if (CurrentBoard.SelectedPiece.team != CurrentBoard.ThisPlayerColor) return

            CurrentBoard.ClickedPiece = CurrentBoard.SelectedPiece
            console.screen("Selected Piece: " + CurrentBoard.SelectedPiece.type + " (" + CurrentBoard.SelectedPiece.team + ")")
            // set camera to look at piece

            let $ = CurrentBoard.SelectedPiece.position

            // tween the cameras traget
            let tween2 = new BABYLON.Animation("tween", "target", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            let keys2 = [];
            keys2.push({
                frame: 0,
                value: camera.target
            });
            keys2.push({
                frame: 30,
                value: new BABYLON.Vector3(($.x * 2) + 1, ($.y * 2) + 1, ($.z * 2) + 1)
            });

            tween2.setKeys(keys2);
            camera.animations.push(tween2);
            scene.beginAnimation(camera, 0, 30, false, 10);

            CurrentBoard.PreviewPieces.forEach(e => {

                e.babylonMesh.dispose()

            })
            CurrentBoard.Pieces.forEach(e => {
                e.babylonMesh.isPickable = true
            })

            let moves = CurrentBoard.SelectedPiece.getPossibleMoves()

            if (moves.Moves) {
                moves.Moves.forEach(e => {

                    // use classs
                    let thing = CurrentBoard.BoardSpaces.find(b => b.position.x == e.x && b.position.y == e.y && b.position.z == e.z)
                    if (!thing) return

                    let Preview = new PreviewPiece(CurrentBoard.SelectedPiece, thing.position.x, thing.position.y, thing.position.z, scene, CurrentBoard.SelectedPiece.team, false, CurrentBoard)
                    CurrentBoard.PreviewPieces.push(Preview)

                })
            }
            if (moves.Captures) {
                moves.Captures.forEach(e => {

                    // use classs
                    let thing = CurrentBoard.BoardSpaces.find(b => b.position.x == e.x && b.position.y == e.y && b.position.z == e.z)
                    if (!thing) return

                    let Preview = new PreviewPiece(CurrentBoard.SelectedPiece, thing.position.x, thing.position.y, thing.position.z, scene, CurrentBoard.SelectedPiece.team, true, CurrentBoard)
                    CurrentBoard.PreviewPieces.push(Preview)

                })
            }

        }

    }

    return { scene, CurrentBoard };
};