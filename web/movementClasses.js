class MovementClass {

    firstMove = true;
    team = "white";

    constructor(first, team) {
        this.firstMove = first;
        this.team = team;
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {
        throw new Error("Method not implemented.");
    }

}

function AddVec3(v1, v2) {
    return new BABYLON.Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
}
function LineCheck(peicePos, increment, ArrayOfPieces) {

    let Moves = []
    let Captures = []

    for (let i = 1; i < 16; i++) {
        let WP = new BABYLON.Vector3(peicePos.x + (increment.x * i), peicePos.y + (increment.y * i), peicePos.z + (increment.z * i))
        let piece = ArrayOfPieces.find(e => e.position.x == WP.x && e.position.y == WP.y && e.position.z == WP.z)
        if (piece) {
            let selectedPiece = ArrayOfPieces.find(e => e.position.x == peicePos.x && e.position.y == peicePos.y && e.position.z == peicePos.z)
            if ( selectedPiece.team != piece.team) {
                Captures.push(WP)
            }
            break;
        } else {
            Moves.push(WP)
        }
    }

    return { Moves, Captures }

}
function SpotCheck(peicePos, increment, ArrayOfPieces) {

    let Moves = []
    let Captures = []

    let WP = new BABYLON.Vector3(peicePos.x + (increment.x), peicePos.y + (increment.y), peicePos.z + (increment.z))
    let piece = ArrayOfPieces.find(e => e.position.x == WP.x && e.position.y == WP.y && e.position.z == WP.z)
    if (!piece) {
        Moves.push(WP)
    } else {
        let selectedPiece = ArrayOfPieces.find(e => e.position.x == peicePos.x && e.position.y == peicePos.y && e.position.z == peicePos.z)
        if (selectedPiece.team != piece.team) {
            Captures.push(WP)
        }
    }

    return { Moves, Captures }

}

class PawnMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []
        let AttackMoves = []

        let Angles = []

        if (this.team == "white") {

            Angles.push(new BABYLON.Vector3(0, 1, 0))
            Angles.push(new BABYLON.Vector3(0, 0, 1))

            if (this.firstMove) {

                Angles.push(new BABYLON.Vector3(0, 0, 2))
                Angles.push(new BABYLON.Vector3(0, 2, 0))

            }

            AttackMoves.push(new BABYLON.Vector3(1, 1, 1))
            AttackMoves.push(new BABYLON.Vector3(-1, 1, 1))

            AttackMoves.push(new BABYLON.Vector3(1, 1, 0))
            AttackMoves.push(new BABYLON.Vector3(-1, 1, 0))

            AttackMoves.push(new BABYLON.Vector3(1, 0, 1))
            AttackMoves.push(new BABYLON.Vector3(-1, 0, 1))

        } else {

            Angles.push(new BABYLON.Vector3(0, -1, 0))
            Angles.push(new BABYLON.Vector3(0, 0, -1))

            if (this.firstMove) {

                Angles.push(new BABYLON.Vector3(0, 0, -2))
                Angles.push(new BABYLON.Vector3(0, -2, 0))


            }

            AttackMoves.push(new BABYLON.Vector3(1, -1, -1))
            AttackMoves.push(new BABYLON.Vector3(-1, -1, -1))

            AttackMoves.push(new BABYLON.Vector3(1, -1, 0))
            AttackMoves.push(new BABYLON.Vector3(-1, -1, 0))

            AttackMoves.push(new BABYLON.Vector3(1, 0, -1))
            AttackMoves.push(new BABYLON.Vector3(-1, 0, -1))

        }

        Angles.forEach(angle => {
            let CurMove = SpotCheck(PiecePosition, angle, ArrayOfPieces)
            Moves = Moves.concat(CurMove.Moves)
        })

        AttackMoves.forEach(angle => {
            let CurMove = SpotCheck(PiecePosition, angle, ArrayOfPieces)
            Captures = Captures.concat(CurMove.Captures)
        })

        return { Moves, Captures }

    }


}

class RookMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []

        let Angles = [
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, -1, 0)
        ]

        Angles.forEach(angle => {
            let CurMove = LineCheck(PiecePosition, angle, ArrayOfPieces)
            Moves = Moves.concat(CurMove.Moves)
            Captures = Captures.concat(CurMove.Captures)
        })

        return { Moves, Captures }

    }

}

class BishopMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []

        let Angles = [
            new BABYLON.Vector3(1, 0, 1),
            new BABYLON.Vector3(-1, 0, 1),
            new BABYLON.Vector3(1, 0, -1),
            new BABYLON.Vector3(-1, 0, -1),
            new BABYLON.Vector3(1, 1, 0),
            new BABYLON.Vector3(-1, 1, 0),
            new BABYLON.Vector3(1, -1, 0),
            new BABYLON.Vector3(-1, -1, 0),
            new BABYLON.Vector3(0, 1, 1),
            new BABYLON.Vector3(0, -1, 1),
            new BABYLON.Vector3(0, 1, -1),
            new BABYLON.Vector3(0, -1, -1)
        ]

        Angles.forEach(angle => {
            let CurrMove = LineCheck(PiecePosition, angle, ArrayOfPieces)
            Moves = Moves.concat(CurrMove.Moves)
            Captures = Captures.concat(CurrMove.Captures)
        })

        return { Moves, Captures }

    }

}

class QueenMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []

        let BishopMoves = new BishopMovement().CalculateMove(PiecePosition, ArrayOfPieces, Board)
        let RookMoves = new RookMovement().CalculateMove(PiecePosition, ArrayOfPieces, Board)

        Moves = Moves.concat(BishopMoves.Moves)
        Moves = Moves.concat(RookMoves.Moves)

        Captures = Captures.concat(BishopMoves.Captures)
        Captures = Captures.concat(RookMoves.Captures)

        return { Moves, Captures }

    }

}

class KingMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []

        let Angles = [
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(1, 0, 1),
            new BABYLON.Vector3(-1, 0, 1),
            new BABYLON.Vector3(1, 0, -1),
            new BABYLON.Vector3(-1, 0, -1),
        ]

        Angles.forEach(angle => {
            let CurrMove = SpotCheck(PiecePosition, angle, ArrayOfPieces)
            Moves = Moves.concat(CurrMove.Moves)
            Captures = Captures.concat(CurrMove.Captures)
        })

        return { Moves, Captures }

    }
}

class KnightMovement extends MovementClass {

    constructor(first, team) {
        super(first, team);
    }

    CalculateMove(PiecePosition, ArrayOfPieces, Board) {

        let Moves = []
        let Captures = []

        let Angles = [
            new BABYLON.Vector3(1, 0, 2),
            new BABYLON.Vector3(-1, 0, 2),
            new BABYLON.Vector3(1, 0, -2),
            new BABYLON.Vector3(-1, 0, -2),
            new BABYLON.Vector3(2, 0, 1),
            new BABYLON.Vector3(-2, 0, 1),
            new BABYLON.Vector3(1, 2, 0),
            new BABYLON.Vector3(-1, 2, 0),
            new BABYLON.Vector3(1, -2, 0),
            new BABYLON.Vector3(-1, -2, 0),
            new BABYLON.Vector3(2, 1, 0),
            new BABYLON.Vector3(-2, 1, 0),
            new BABYLON.Vector3(2, -1, 0),
            new BABYLON.Vector3(-2, -1, 0),
            new BABYLON.Vector3(0, 1, 2),
            new BABYLON.Vector3(0, -1, 2),
            new BABYLON.Vector3(0, 1, -2),
            new BABYLON.Vector3(0, -1, -2),
            new BABYLON.Vector3(0, 2, 1),
            new BABYLON.Vector3(0, -2, 1),
            new BABYLON.Vector3(0, 2, -1),
            new BABYLON.Vector3(0, -2, -1),
            new BABYLON.Vector3(2, 0, -1),
            new BABYLON.Vector3(-2, 0, -1),
        ]

        Angles.forEach(angle => {
            let CurrMove = SpotCheck(PiecePosition, angle, ArrayOfPieces)
            Moves = Moves.concat(CurrMove.Moves)
            Captures = Captures.concat(CurrMove.Captures)
        })

        return { Moves, Captures }

    }
}