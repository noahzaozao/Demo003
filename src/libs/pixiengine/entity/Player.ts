import * as PIXI from "pixi.js";
import { Point } from "pixi.js";


export default class Player {

    private _x: number = 0
    private _y: number = 0
    public playerSprite: PIXI.Sprite

    constructor(x: number, y: number) {
        this.playerSprite = PIXI.Sprite.from("actor")
        this.setPos(x, y)
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
}
