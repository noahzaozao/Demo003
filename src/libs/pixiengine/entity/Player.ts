import * as PIXI from "pixi.js";
import { Point } from "pixi.js";
import { backFrames, rightFrames, frontFrames, leftFrames } from './PlayerFrames'
import JPSNode from "../../jps/jpsnode"
import JPS from "../../jps/jps"
import JPSCheckTag from "../../jps/jpschecktag";
import { AStarFinder } from "astar-typescript";


export default class Player {

    private _backSprite: PIXI.AnimatedSprite
    private _rightSprite: PIXI.AnimatedSprite
    private _frontSprite: PIXI.AnimatedSprite
    private _leftSprite: PIXI.AnimatedSprite
    
    private _playerSprites: Array<PIXI.AnimatedSprite>
    
    // 玩家精灵
    public playerSprite: PIXI.Container

    private _x: number = 0
    private _y: number = 0
    private _mapData: any // Array<Array<number>>
    private _pathDebugLayer?: PIXI.Container
    
    private _speed: number
    private _targetX: number
    private _targetY: number

    // AStar
    private _myPathway: number[][]

    // 移动弧度，用来计算x,y速度
    private _moveAngle: number
    // 方向 0, 1, 2, 3 back, right, front, left
    private _dir: number
    private _oldDir: number
    private _moving: boolean
    
    constructor(x: number, y: number, mapData: [], pathDebugLayer?: PIXI.Container) {
        // this.playerSprite = PIXI.Sprite.from("actor")
        
        this._backSprite = PIXI.AnimatedSprite.fromFrames(backFrames)
        this._backSprite.animationSpeed = 0.167
        this._backSprite.play()
        this._rightSprite = PIXI.AnimatedSprite.fromFrames(rightFrames)
        this._rightSprite.animationSpeed = 0.167
        this._rightSprite.play()
        this._frontSprite = PIXI.AnimatedSprite.fromFrames(frontFrames)
        this._frontSprite.animationSpeed = 0.167
        this._frontSprite.play()
        this._leftSprite = PIXI.AnimatedSprite.fromFrames(leftFrames)
        this._leftSprite.animationSpeed = 0.167
        this._leftSprite.play()

        this._playerSprites = [
            this._backSprite,
            this._rightSprite,
            this._frontSprite,
            this._leftSprite,
        ]

        this.playerSprite = new PIXI.Container()
        this.playerSprite.addChild(this._backSprite)
        this.playerSprite.addChild(this._rightSprite)
        this.playerSprite.addChild(this._frontSprite)
        this.playerSprite.addChild(this._leftSprite)

        this.setPos(x, y)

        this._mapData = mapData
        if (pathDebugLayer) {
            this._pathDebugLayer = pathDebugLayer
        }

        this._speed = 100
        this._targetX = this._x
        this._targetY = this._y

        this._myPathway = []

        this._moveAngle = -1
        this._dir = this.getDir()
        this._oldDir = -1
        this._moving = false
    }

    public setPos(x: number, y:number) {
        this._x = x
        this._y = y

        this.playerSprite.x = this._x
        this.playerSprite.y = this._y
    }

    public getPos(): Point {
        return new Point(this._x, this._y)
    }

    setMapData(mapData: any) {
        this._mapData = mapData
    }

    getDir() {
        // 角度
        let theta: number
        if (this._moveAngle * (180 / Math.PI) > 0) {
            theta = this._moveAngle * (180 / Math.PI)
        } else {
            theta = 360 + this._moveAngle * (180 / Math.PI)
        }
        if (theta >= 45 && theta < 135) {
            // 90 up
            this._dir = 0
        } else if (theta >= 315 || theta < 45) {
            // 360 right
            this._dir = 1
        } else if (theta >= 225 && theta < 315) {
            // 270 down
            this._dir = 2
        } else {
            // 180 left
            this._dir = 3
        }
        return this._dir
    }

    moveTo(x: number, y: number) {

        // 终点是起点
        if (Math.ceil(this._x / 48) === Math.floor(x / 48) && Math.ceil(this._y / 48) === Math.floor(y / 48)) {
            return
        }

        // 跳过障碍物
        if (this._mapData[Math.floor(y / 48)][Math.floor(x / 48)] == 1) {
            return
        }

        if (this._moving) {
            this._moving = false
            this.stopMove()
        }
        this._targetX = x
        this._targetY = y

        //
        const startPos = new PIXI.Point(Math.ceil(this._x / 48), Math.ceil(this._y / 48))
        const blockPos = new PIXI.Point(Math.floor(this._targetX / 48), Math.floor(this._targetY / 48))
        // console.log(startPos, blockPos, this._x / 48, this._targetX / 48)
        // console.log(startPos, blockPos, this.mapData)

        const mapSize = {
            width: this._mapData[0].length,
            height: this._mapData.length
        }
        
        // using AStar pathfinding
        const aStarInstance = new AStarFinder({
            grid: {
                matrix: this._mapData
            },
            diagonalAllowed: false
        })
        this._myPathway = aStarInstance.findPath(startPos, blockPos);
        if (this._myPathway) {
            if (this._pathDebugLayer) {
                this._pathDebugLayer.removeChildren()
            }
            for (const i in this._myPathway) {
                const sp = new PIXI.Graphics()
                sp.beginFill(0xff0000)
                sp.drawRect(this._myPathway[i][0] * 48, this._myPathway[i][1] * 48, 48, 48)
                sp.alpha = 0.1
                if (this._pathDebugLayer) {
                    this._pathDebugLayer.addChild(sp)
                }
            }
            // remove startPos
            this._moving = true
        }
    }

    stopMove() {
        this._moving = false
    }

    onMove(delta: number) {
        if (this._moving) {
            if (this._myPathway.length == 1) {
                this._moving = false
                return
            }
            const nextPos = this._myPathway[1]

            this._moveAngle = Math.atan2((this._y - nextPos[1] * 48), (nextPos[0] * 48 - this._x))
            // console.log('next', nextPos.corde, this._moveAngle)
            this.getDir()

            const speedX = this._speed * Math.cos(this._moveAngle)
            const speedY = -this._speed * Math.sin(this._moveAngle)

            this._x += speedX * delta / 60
            this._y += speedY * delta / 60

            const xx = this._x - nextPos[0] * 48
            const yy = this._y - nextPos[1] * 48
            if (Math.floor(Math.sqrt(xx * xx + yy * yy)) < 1) {
                this._x = nextPos[0] * 48
                this._y = nextPos[1] * 48
                this._myPathway.shift()
                console.log("[movedTo]", this._x, this._y,)
                if (this._myPathway.length == 1) {
                    this._moving = false
                }
            }
        }
    }

    onUpdate(delata:number) {
        if (this._oldDir !== this._dir) {
            for (const i in this._playerSprites) {
                this._playerSprites[i].visible = false
                this._playerSprites[i].stop()
            }
            if (this._playerSprites[this._dir]) {
                this._playerSprites[this._dir].visible = true
                this._playerSprites[this._dir].play()
            }
        }
        if (!this._moving && this._playerSprites[this._dir]) {
            this._playerSprites[this._dir].stop()
        }
        this.playerSprite.x = this._x
        this.playerSprite.y = this._y
    }
}
