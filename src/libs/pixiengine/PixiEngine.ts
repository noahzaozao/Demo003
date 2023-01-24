import * as PIXI from "pixi.js"
import RandomMap from "./maps/RandomMap"
import {Assets} from "@pixi/assets"
import { CompositeTilemap } from "@pixi/tilemap"
import Player from "./entity/Player"
import { Point } from "pixi.js"


export default class PixiEngine {
    
    // 宽度
    public width: number
    // 高度
    public height: number
    // pixi实例
    public app: PIXI.Application
    // 舞台
    public stage: PIXI.Container
    // 地图层
    public mapLayer: PIXI.Container
    // 路径调试层
    public pathDebugLayer?: PIXI.Container
    // 玩家层
    public playerLayer?: PIXI.Container

    // 随机地图
    private randomMap: RandomMap
    // 地图数据
    private mapData: any // Array<Array<number>>

    // 地图
    private tileMap?: CompositeTilemap
    // 玩家
    private player?: Player

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        
        this.app = new PIXI.Application({
            width: width,
            height: height,
            backgroundColor: 0x000000,
        })

        this.stage = this.app.stage
        this.stage.interactive = true

        this.mapLayer = new PIXI.Container()
        this.playerLayer = new PIXI.Container()
        this.mapLayer.interactive = true
        this.pathDebugLayer = new PIXI.Container()
        
        this.stage.addChild(this.mapLayer)
        this.stage.addChild(this.pathDebugLayer)
        this.stage.addChild(this.playerLayer)
        

        this.tileMap = new CompositeTilemap()
        this.tileMap.scale.x = 0.5
        this.tileMap.scale.y = 0.5
        this.mapLayer.addChild(this.tileMap)
        
        //
        this.randomMap = new RandomMap({row: 5, col: 5})
        // 生成地图数据
        this.mapData = this.randomMap.getData()
        
        // 加载资源
        let resList: {[reskey:string]: string} = {
            pickaxe: '/images/pickaxe.png',
            land: '/images/land.png',
            wall: '/images/wall.png',
            // actor: '/images/Actor1-0-0.png',
            actor: '/actors/actor.json',
        }
        for (const resKey in resList) {
            Assets.add(resKey, resList[resKey])
        }
        Assets.load(['land', 'wall', 'actor']).then(()=>{
            this.onLoad()
        })

        window.addEventListener("keydown", this.onKeyDownHander.bind(this), false)
    }

    canMove(x: number, y: number): boolean {
        if (this.mapData[y][x]) {
            return false
        }
        return true
    }

    onKeyDownHander(e:KeyboardEvent) {
        /**
         * 键盘事件
         */
        if (this.player) {
            const pos = this.player.getPos()
            if (e.key == 'a') {
                this.player.moveTo(pos.x - 48, pos.y)
            } else if (e.key == 'd') {
                this.player.moveTo(pos.x + 48, pos.y)
            } else if (e.key == 'w') {
                this.player.moveTo(pos.x, pos.y - 48)
            } else if (e.key == 's') {
                this.player.moveTo(pos.x, pos.y + 48)
            }
        }
    }

    onLoad() {
        /**
         * 资源加载完成
         */

        // 加载地图
        this.onLoadMap()

        this.randomMap.create()
        // 生成地图数据
        this.mapData = this.randomMap.getData()
        this.onLoadMap()

        // 初始化玩家
        // this.player = new Player(48, 48, this.mapData, this.pathDebugLayer)
        this.player = new Player(48, 48, this.mapData)

        if (this.playerLayer) {
            this.playerLayer.addChild(this.player.playerSprite)
        }
        // this.player.setMapData(this.mapData)

        if (this.mapLayer) {
            this.mapLayer.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height)
            this.mapLayer.on('pointerdown', this._mapPointerDown.bind(this))
        }

        this.app.ticker.add((delta: number) => {
            this.player?.onMove(delta)
            this.player?.onUpdate(delta)
        })
    }

    onLoadMap() {
        /**
         * 加载地图
         */
        for (let i = 0; i < this.mapData.length; i++) {
            // console.log(this.mapData[i]);
            for (let j = 0; j < this.mapData[i].length; j++) {
                if (this.tileMap) {
                    this.tileMap.tile(["land", "wall"][this.mapData[i][j]], j * 96, i * 96)
                }
            }
        }
    }

    _mapPointerDown(event: PIXI.InteractionEvent) {
        const movePos = event.data.global
        if (this.player) {
            this.player.moveTo(movePos.x, movePos.y)
        }
    }

}