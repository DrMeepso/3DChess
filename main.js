const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const piecePrefab = {}

const Boards = []

function DegsToRads(degs) {
    return degs * Math.PI / 180
}


class BoardSpace {

    meshSize = 2
    babylonMesh = null;

    position = new BABYLON.Vector3(0, 0, 0)

    constructor(x, y, z, scene) {

        this.position = new BABYLON.Vector3(x, y, z)

        // create cube
        this.babylonMesh = BABYLON.MeshBuilder.CreateBox("box", { size: this.meshSize }, scene);
        this.babylonMesh.position = new BABYLON.Vector3(x * this.meshSize, y * this.meshSize, z * this.meshSize);

        this.babylonMesh.enableEdgesRendering();
        this.babylonMesh.edgesWidth = 4.0;
        this.babylonMesh.edgesColor = new BABYLON.Color4(0, 0, 0, .1);

        // set cube to be inv
        this.babylonMesh.material = new BABYLON.StandardMaterial("mat", scene);
        this.babylonMesh.material.alpha = 0;

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

        //clone prefab from table
        this.babylonMesh = piecePrefab[type].clone()
        this.babylonMesh.isVisible = true

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
        this.babylonMesh.position = new BABYLON.Vector3(-(x * 2), (y * 2) - 1, z * 2)
        this.position = new BABYLON.Vector3(x, y, z)
    }

}

class Board {

    BoardSpaces = []
    Pieces = []
    Scene = null

    PreviewPieces = []

    SelectedPiece = null

    constructor(scene) {

        this.Scene = scene

        for (let x = 0; x < 8; x++) {

            for (let y = 0; y < 8; y++) {

                for (let z = 0; z < 10; z++) {

                    this.BoardSpaces.push(new BoardSpace(x, y, z, scene));

                }

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

        console.log(`Loaded json state from ${jsonURL}`)

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

}

const createScene = async function () {

    let scene = new BABYLON.Scene(engine);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);

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
    BABYLON.SceneLoader.ImportMesh("", "./meshs/", "Browser.glb", scene, function (newMeshes) {

        newMeshes.forEach((mesh, i) => {

            if (i == 0) return

            // set position
            mesh.position = new BABYLON.Vector3(i * 1, -1, 0);
            //mesh.scaling = new BABYLON.Vector3(0.015, 0.015, 0.015);
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

    })

    await new Promise(resolve => setTimeout(resolve, 1000));

    let CurrentBoard = new Board(scene)
    CurrentBoard.loadJSONState("./startingState.json")

    Boards.push(CurrentBoard)

    // on mouse hover
    scene.onPointerMove = function (evt, pickResult) {

        CurrentBoard.Pieces.forEach(piece => {

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

        // make sure mb1 is pressed
        if (evt.button != 0) return

        // if drag return
        if (evt.dragging) return

        if (CurrentBoard.SelectedPiece) {

            console.log("Selected Piece: " + CurrentBoard.SelectedPiece.type + " (" + CurrentBoard.SelectedPiece.team + ")")
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
                value: new BABYLON.Vector3(($.x * 2), ($.y * 2), ($.z * 2))
            });

            tween2.setKeys(keys2);
            camera.animations.push(tween2);
            scene.beginAnimation(camera, 0, 30, false, 10);

            // Draw the possible moves
            let MoveClasses = {

                "king": KingMovement,
                "queen": QueenMovement,
                "rook": RookMovement,
                "bishop": BishopMovement,
                "knight": KnightMovement,
                "pawn": PawnMovement

            }

            CurrentBoard.PreviewPieces.forEach(e => e.dispose())
            CurrentBoard.Pieces.forEach(e => e.babylonMesh.material.alpha = 1)

            let moves = new MoveClasses[CurrentBoard.SelectedPiece.type](true, CurrentBoard.SelectedPiece.team).CalculateMove(CurrentBoard.SelectedPiece.position, CurrentBoard.Pieces, CurrentBoard)
            if (moves.Moves) {
                moves.Moves.forEach(e => {

                    let thing = CurrentBoard.BoardSpaces.find(b => b.position.x == e.x && b.position.y == e.y && b.position.z == e.z)
                    if (!thing) return
                    let PieceClone = piecePrefab[CurrentBoard.SelectedPiece.type].clone("clone")
                    CurrentBoard.PreviewPieces.push(PieceClone)
                    let pos = thing.position
                    PieceClone.position = new BABYLON.Vector3(-(pos.x * 2), (pos.y * 2) - 1, pos.z * 2)
                    PieceClone.isVisible = true
                    if (CurrentBoard.SelectedPiece.team == "white") PieceClone.rotation = CurrentBoard.SelectedPiece.babylonMesh.rotation

                    let cloneMaterial = new BABYLON.StandardMaterial("cloneMaterial", scene);
                    cloneMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
                    cloneMaterial.alpha = 0.5;
                    PieceClone.material = cloneMaterial;

                })
            }
            if (moves.Captures) {
                moves.Captures.forEach(e => {

                    let thing = CurrentBoard.BoardSpaces.find(b => b.position.x == e.x && b.position.y == e.y && b.position.z == e.z)
                    if (!thing) return
                    
                    let OffendingPiece = CurrentBoard.Pieces.find(p => p.position.x == e.x && p.position.y == e.y && p.position.z == e.z)
                    
                    OffendingPiece.babylonMesh.material.alpha = 0.5

                    let PieceClone = piecePrefab[CurrentBoard.SelectedPiece.type].clone("clone")
                    CurrentBoard.PreviewPieces.push(PieceClone)
                    let pos = thing.position
                    PieceClone.position = new BABYLON.Vector3(-(pos.x * 2), (pos.y * 2) - 1, pos.z * 2)
                    PieceClone.isVisible = true
                    if (CurrentBoard.SelectedPiece.team == "white") PieceClone.rotation = CurrentBoard.SelectedPiece.babylonMesh.rotation

                    let cloneMaterial = new BABYLON.StandardMaterial("cloneMaterial", scene);
                    cloneMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
                    cloneMaterial.alpha = 0.5;
                    PieceClone.material = cloneMaterial;

                })
            }

        }

    }

    return scene;
};
createScene()
    .then(babyscene => {

        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () {
            babyscene.render();
        });
        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize();
        });

    })
