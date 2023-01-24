
import JPSCheckTag from "./jpschecktag";
import * as PIXI from "pixi.js"


export default class JPSNode<DATA, TAG> {
    public static JPS_DIR = {
        NONE: -1,
        L: 1,
        R: 1 << 2,
        U: 1 << 3,
        D: 1 << 4,
        LU: 1 << 5,
        LD: 1 << 6,
        RU: 1 << 7,
        RD: 1 << 8
    }
    corde: PIXI.Point;
    myIndex: number;
    parentIndex: number;
    customData?: DATA;

    currentDir: number;

    myTag?: JPSCheckTag<TAG>;

    f: number;//f=g+h;
    g: number;//cost to start point;
    h: number;//cost to end pont;

    isJump: boolean;

    visitCount: number;

    constructor() {
        this.parentIndex = -1
        this.myIndex = -1
        this.currentDir = JPSNode.JPS_DIR.NONE
        this.isJump = false
        this.visitCount = 0
        this.corde = new PIXI.Point(0, 0)
        this.f = 0
        this.g = 0
        this.h = 0
    }

    public hasParent(): boolean {
        return this.parentIndex != -1;
    }

    public cordeAdd(v: PIXI.Point) {
        return new PIXI.Point( this.corde.x + v.x, this.corde.y + v.y)
    }

}
