
import JPSCheckTag from "./jpschecktag";
import JPSNode from "./jpsnode";
import * as PIXI from "pixi.js"

export default class JPS<T extends JPSNode<DATA, TAG>, DATA, TAG> {

    private static Cost90 = 10;//垂直关系的代价
    private static Cost45 = 14;//斜角关系的代价
    //开放列表
    private openSet: Array<T>;
    //关闭列表
    private closeSet: Array<T>;

    private startPoint?: T;
    private endPoint?: T;

    private allPoint?: Array<T>;
    private width?: number;
    private height?: number;

    //标志量，可走标示，不可走标示，需要提前设定
    private goodTag?: JPSCheckTag<TAG>;
    private badTag?: JPSCheckTag<TAG>;

    //一些回调
    private searchCB?: any;

    constructor() {
        this.openSet = [];
        this.closeSet = [];
    }

    setOnSearchCall(cb: any) {
        this.searchCB = cb;
    }

    findPath(start: T, end: T, all: Array<T>, goodTag: JPSCheckTag<TAG>, badTag: JPSCheckTag<TAG>, w: number, h: number) {
        this.startPoint = start
        this.endPoint = end
        this.allPoint = all
        this.goodTag = goodTag
        this.badTag = badTag
        this.width = w
        this.height = h
        return this.start()
    }

    private start() {
        if (this.startPoint && this.endPoint) {
            this.startPoint.g = this.gF(this.startPoint, null);
            this.startPoint.h = this.hF(this.startPoint);
            this.startPoint.f = this.fF(this.startPoint);
            this.startPoint.currentDir = JPSNode.JPS_DIR.NONE;
            //起点需要先检查八个方向的邻节点
            this.openSet.push(this.startPoint);
            return this.search();
        }
        return null;
    }

    private search(): any {
        if (this.endPoint && this.endPoint.parentIndex != -1) {
            return this.makePath();
        }
        const smallFPoint = this.findSmallestHPoint(this.openSet);
        if (smallFPoint) {
            this.closeSet.push(smallFPoint);
            this.goNext(smallFPoint);
            return this.search();
        }
        return null;
    }

    private makePath() {
        if (!this.endPoint || !this.allPoint) {
            return null
        }
        const path = new Array<T>();
        path.push(this.endPoint);
        let parentIndex = this.endPoint.parentIndex;
        while (parentIndex != -1) {
            const parent = this.allPoint[parentIndex];
            if (parent) {
                path.push(parent);
                parentIndex = parent.parentIndex;
            }
        }
        return path;
    }

    private goNext(point: T) {
        //这里进来的point都是跳点，所以应该是根据他的方向进行多向搜索
        const curdir = point.currentDir;
        if (this.isDirect(curdir) == true) {
            //该搜索他的相对前方，相对左前方，相对右前方
            //相对前方
            this.lineSearch(point, curdir);
            //相对左前方
            const rlfdv = this.relativeLeftForwardCorde(curdir);
            const rlfnode = this.nextPointByCorde(point.cordeAdd(rlfdv));
            if (rlfnode && this.checkPointGood(rlfnode) == true) {
                rlfnode.currentDir = this.twoPointDir(rlfnode, point);
                if (rlfnode.parentIndex == -1)
                    rlfnode.parentIndex = point.myIndex;
                this.makeJpGHF(rlfnode, point, rlfnode.currentDir)
                this.slashSearch(rlfnode)
                // if (this.slashSearch(rlfnode) == true) {
                // }
            }
            //相对右前方
            const rrfdv = this.relativeRightForwardCorde(curdir);
            const rrfnode = this.nextPointByCorde(point.cordeAdd(rrfdv));
            if (rrfnode && this.checkPointGood(rrfnode) == true) {
                rrfnode.currentDir = this.twoPointDir(rrfnode, point);
                if (rrfnode.parentIndex == -1)
                    rrfnode.parentIndex = point.myIndex;
                this.makeJpGHF(rrfnode, point, rrfnode.currentDir)
                this.slashSearch(rrfnode)
                // if (this.slashSearch(rrfnode) == true) {
                // }
            }
            //没有点，则代表垂直方向到边或遇到障碍，退出递归
        } else {
            //这里是非直线方向处理，非直线方向包含了两种情况，
            if (curdir == JPSNode.JPS_DIR.NONE) {
                //1，无方向，即起点处理，需要八个方向分别处理，
                const neighbors = this.findNeighbors(point);
                for (let index = 0; index < neighbors.length; index++) {
                    const node = neighbors[index];
                    if (node && this.checkPointGood(node) == true) {
                        if (this.isDirect(node.currentDir) == true) {
                            this.lineSearch(node, node.currentDir)
                        } else {
                            this.slashSearch(node)
                            // if (this.slashSearch(node) == true) {
                            // }
                        }
                    }
                }
            } else {
                const ddir = this.splitSlash(point.currentDir);
                for (let index = 0; index < ddir.length; index++) {
                    const dir = ddir[index];
                    this.lineSearch(point, dir)
                }
                //相向斜角
                const sldv = this.nextSlashDeCorde(curdir);
                const slnode = this.nextPointByCorde(point.cordeAdd(sldv));
                if (slnode && this.checkPointGood(slnode) == true) {
                    slnode.currentDir = curdir;
                    if (slnode.parentIndex == -1)
                        slnode.parentIndex = point.myIndex;
                    this.makeJpGHF(slnode, point, slnode.currentDir)
                    this.slashSearch(slnode)
                    // if (this.slashSearch(slnode) == true) {
                    // }
                }
            }
        }
    }

    private lineSearch(point: T, dir: number) {
        if (!this.allPoint || !this.endPoint) {
            return
        }
        point.visitCount++;
        //搜索直线直到碰到障碍，边界或找到跳点结束，如果找到跳点，则smallfpoint也是跳点
        //检查强迫邻居
        //先拿他的相对左右两个点
        //相对左
        const ldv = this.relativeLeftCorde(dir);
        const lfdv = this.relativeLeftForwardCorde(dir);
        let forceNeibor = this.checkLinePointHasForceNeighbor(ldv, lfdv, point);
        if (forceNeibor) {
            const parent = this.allPoint[point.parentIndex];
            this.putPointInOpenSet(point, parent);
            forceNeibor.currentDir = this.twoPointDir(forceNeibor, point);
            this.putPointInOpenSet(forceNeibor, point);
            // return;
        }
        //相对右
        const rdv = this.relativeRightCorde(dir);
        const rfdv = this.relativeRightForwardCorde(dir);
        forceNeibor = this.checkLinePointHasForceNeighbor(rdv, rfdv, point);
        if (forceNeibor) {
            const parent = this.allPoint[point.parentIndex];
            this.putPointInOpenSet(point, parent);
            forceNeibor.currentDir = this.twoPointDir(forceNeibor, point);
            this.putPointInOpenSet(forceNeibor, point);
            // return;
        }

        // if (forceNeibor) {
        //   return;
        // }

        const dv = this.nextDirectDeCorde(dir);
        const nextNode = this.nextPointByCorde(point.cordeAdd(dv));
        if (nextNode) {
            if (this.checkPointGood(nextNode) == false) {
                if (this.isEndPoint(nextNode) == true) {
                    this.endPoint.parentIndex = point.myIndex;
                }
                return;
            }
            nextNode.currentDir = dir;
            if (nextNode.parentIndex == -1)
                nextNode.parentIndex = point.myIndex;
            this.makeJpGHF(nextNode, point, nextNode.currentDir);
            this.lineSearch(nextNode, dir);
        }
        // return false;
    }

    private slashSearch(point: T): any {
        //首先检查这个斜角点的是否是跳点
        point.visitCount++;
        const ddir = this.splitSlash(point.currentDir);
        for (let index = 0; index < ddir.length; index++) {
            const dir = ddir[index];
            this.lineSearch(point, dir)
        }
        //这个斜角的垂直分量搜索完毕，继续按照这个方向找他的同向斜角
        const sldv = this.nextSlashDeCorde(point.currentDir);
        const nextNode = this.nextPointByCorde(point.cordeAdd(sldv));
        if (nextNode) {
            if (this.checkPointGood(nextNode) == true) {
                nextNode.currentDir = point.currentDir;
                if (nextNode.parentIndex == -1)
                    nextNode.parentIndex = point.myIndex;
                this.makeJpGHF(nextNode, point, nextNode.currentDir);
                return this.slashSearch(nextNode);
            }
        }
    }

    private checkLinePointHasForceNeighbor(dv: PIXI.Point, fdv: PIXI.Point, parent: T) {
        const node = this.nextPointByCorde(parent.cordeAdd(dv));
        if (node) {
            if (this.checkPointGood(node) == false) {
                //再查他的相对左前方是否可走，如果可走，则它是跳点，它的相对左前方是强迫邻居
                const fnode = this.nextPointByCorde(parent.cordeAdd(fdv));
                if (fnode) {
                    if (this.checkPointGood(fnode) == true) {//相对右前方可走
                        //node点是跳点
                        //fnode是强迫邻居
                        return fnode;
                    }
                }
            }
        }
        return null
    }

    private isEndPoint(point: T): boolean {
        if (!this.endPoint) {
            return false
        }
        return point.myIndex == this.endPoint.myIndex;
    }

    private makeJpGHF(point: T, parent: T, dir: number) {
        point.g = this.gF(point, parent);
        point.h = this.hF(point);
        point.f = this.fF(point);
    }

    //找到相邻的8个节点
    private findNeighbors(point: T) {
        if (!this.width || !this.height || !this.allPoint) {
            return []
        }
        const findPoints = []
        if (point) {
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (x == 0 && y == 0) {//排除自己
                        continue;
                    }
                    const px = point.corde.x + x;
                    const py = point.corde.y + y;
                    if (px < 0 || py < 0 || px >= this.width || py >= this.height) {
                        continue;
                    }
                    const index = py * this.width + px;
                    const p = this.allPoint[index];

                    if (p && this.checkPointInCloseSet(p) == false) {
                        p.currentDir = this.twoPointDir(p, point);
                        if (p.parentIndex == -1)
                            p.parentIndex = point.myIndex;
                        p.g = this.gF(p, point);
                        p.h = this.hF(p);
                        p.f = this.fF(p);
                        findPoints.push(p);
                    }
                }
            }
        }
        return findPoints
    }

    private splitSlash(dir: number): Array<number> {
        if ((dir ^ JPSNode.JPS_DIR.LD) == 0) {
            return [JPSNode.JPS_DIR.L, JPSNode.JPS_DIR.D];
        }
        if ((dir ^ JPSNode.JPS_DIR.RD) == 0) {
            return [JPSNode.JPS_DIR.R, JPSNode.JPS_DIR.D];
        }
        if ((dir ^ JPSNode.JPS_DIR.LU) == 0) {
            return [JPSNode.JPS_DIR.L, JPSNode.JPS_DIR.U];
        }
        if ((dir ^ JPSNode.JPS_DIR.RU) == 0) {
            return [JPSNode.JPS_DIR.R, JPSNode.JPS_DIR.U];
        }
        return [];
    }

    private splitSlashDir(dir: number): Array<PIXI.Point> {
        if ((dir ^ JPSNode.JPS_DIR.LD) == 0) {
            return [new PIXI.Point(-1, 0), new PIXI.Point(0, 1)];
        }
        if ((dir ^ JPSNode.JPS_DIR.RD) == 0) {
            return [new PIXI.Point(1, 0), new PIXI.Point(0, 1)];
        }
        if ((dir ^ JPSNode.JPS_DIR.LU) == 0) {
            return [new PIXI.Point(-1, 0), new PIXI.Point(0, -1)];
        }
        if ((dir ^ JPSNode.JPS_DIR.RU) == 0) {
            return [new PIXI.Point(1, 0), new PIXI.Point(0, -1)];
        }
        return [];
    }

    private relativeLeftForwardCorde(currentDir: number): PIXI.Point {
        if ((currentDir ^ JPSNode.JPS_DIR.D) == 0) {
            return new PIXI.Point(1, 1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.U) == 0) {
            return new PIXI.Point(-1, -1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.L) == 0) {
            return new PIXI.Point(-1, 1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.R) == 0) {
            return new PIXI.Point(1, -1);
        }
        return new PIXI.Point(0, 0)
    }

    private relativeLeftCorde(currentDir: number): PIXI.Point {
        if ((currentDir ^ JPSNode.JPS_DIR.D) == 0) {
            return new PIXI.Point(1, 0);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.U) == 0) {
            return new PIXI.Point(-1, 0);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.L) == 0) {
            return new PIXI.Point(0, 1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.R) == 0) {
            return new PIXI.Point(0, -1);
        }
        return new PIXI.Point(0, 0)
    }

    private relativeRightForwardCorde(currentDir: number): PIXI.Point {
        if ((currentDir ^ JPSNode.JPS_DIR.D) == 0) {
            return new PIXI.Point(-1, 1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.U) == 0) {
            return new PIXI.Point(1, -1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.L) == 0) {
            return new PIXI.Point(-1, -1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.R) == 0) {
            return new PIXI.Point(1, 1);
        }
        return new PIXI.Point(0, 0)
    }

    private relativeRightCorde(currentDir: number): PIXI.Point {
        if ((currentDir ^ JPSNode.JPS_DIR.D) == 0) {
            return new PIXI.Point(-1, 0);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.U) == 0) {
            return new PIXI.Point(1, 0);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.L) == 0) {
            return new PIXI.Point(0, -1);
        }
        if ((currentDir ^ JPSNode.JPS_DIR.R) == 0) {
            return new PIXI.Point(0, 1);
        }
        return new PIXI.Point(0, 0)
    }

    private nextDirectDeCorde(currentDir: number): PIXI.Point {
        if ((currentDir ^ JPSNode.JPS_DIR.D) == 0) {//下,返回下，右下，左下
            return new PIXI.Point(0, 1);
        } else if ((currentDir ^ JPSNode.JPS_DIR.L) == 0) {
            return new PIXI.Point(-1, 0);
        } else if ((currentDir ^ JPSNode.JPS_DIR.R) == 0) {
            return new PIXI.Point(1, 0);
        } else if ((currentDir ^ JPSNode.JPS_DIR.U) == 0) {
            return new PIXI.Point(0, -1);
        }
        return new PIXI.Point(0, 0)
    }

    private nextSlashDeCorde(dir: number): PIXI.Point {
        if ((dir ^ JPSNode.JPS_DIR.LD) == 0) {
            return new PIXI.Point(-1, 1);
        }
        if ((dir ^ JPSNode.JPS_DIR.RD) == 0) {
            return new PIXI.Point(1, 1);
        }
        if ((dir ^ JPSNode.JPS_DIR.LU) == 0) {
            return new PIXI.Point(-1, -1);
        }
        if ((dir ^ JPSNode.JPS_DIR.RU) == 0) {
            return new PIXI.Point(1, -1);
        }
        return new PIXI.Point(0, 0)
    }

    private nextPointByCorde(corde: PIXI.Point) {
        if (!this.width || !this.height || ! this.allPoint) {
            return null
        }
        if (corde.x < 0 || corde.x >= this.width || corde.y < 0 || corde.y >= this.height) {
            return null
        }
        const index = corde.y * this.width + corde.x;
        const next = this.allPoint[index];
        return next
    }

    private twoPointDir(p1: T, p2: T): number {
        const dx = p1.corde.x - p2.corde.x;
        const dy = p1.corde.y - p2.corde.y;
        if (dx > 0 && dy > 0) {
            return JPSNode.JPS_DIR.RD;
        }
        if (dx < 0 && dy > 0) {
            return JPSNode.JPS_DIR.LD;
        }
        if (dx > 0 && dy < 0) {
            return JPSNode.JPS_DIR.RU;
        }
        if (dx < 0 && dy < 0) {
            return JPSNode.JPS_DIR.LU;
        }
        if (dx < 0) {
            return JPSNode.JPS_DIR.L;
        }
        if (dy < 0) {
            return JPSNode.JPS_DIR.U;
        }
        if (dx > 0) {
            return JPSNode.JPS_DIR.R;
        }
        if (dy > 0) {
            return JPSNode.JPS_DIR.D;
        }
        return JPSNode.JPS_DIR.NONE;
    }

    private isDirect(dir: number): boolean {
        return ((JPSNode.JPS_DIR.L ^ dir) == 0) || ((JPSNode.JPS_DIR.R ^ dir) == 0) ||
            ((JPSNode.JPS_DIR.D ^ dir) == 0) || ((JPSNode.JPS_DIR.U ^ dir) == 0);
    }

    private isSlash(dir: number): boolean {
        return ((JPSNode.JPS_DIR.LD ^ dir) == 0) || ((JPSNode.JPS_DIR.LU ^ dir) == 0) ||
            ((JPSNode.JPS_DIR.RD ^ dir) == 0) || ((JPSNode.JPS_DIR.RU ^ dir) == 0);
    }

    private checkPointGood(point: T): boolean {
        if (!point || !point.myTag || !this.goodTag) {
            return false
        }
        return point.myTag.compare(this.goodTag) || this.isEndPoint(point);
    }

    private checkPointInCloseSet(point: T): boolean {
        return this.closeSet.findIndex((a) => a.myIndex == point.myIndex) > -1;
    }

    private findSmallestFPoint(list: Array<T>) {
        list.sort((a, b) => a && b && (a.f - b.f));
        return list.shift()
    }

    private findSmallestHPoint(list: Array<T>) {
        list.sort((a, b) => a && b && (a.h - b.h));
        return list.shift()
    }

    private putPointInOpenSet(point: T, parent: T) {
        if (this.checkPointInCloseSet(point) == true) {
            return;
        }
        let p = this.openSet.find((a) => a.myIndex == point.myIndex);
        if (p) {//如果已经在开放列表中，再次计算他的g值是否比原来的小
            const g = this.gF(p, parent);
            if (g < p.g) {
                p.g = g;
                p.f = this.fF(p);//从新计算f
                p.parentIndex = parent.myIndex;
                if (this.searchCB) {
                    this.searchCB(p);
                }
            }
            return;
        }
        p = point//this.allPoint[point.myIndex];
        //计算他的g，h，f值
        //计算该点的ghf
        p.g = this.gF(p, parent);
        p.h = this.hF(p);
        p.f = this.fF(p);
        p.isJump = true;
        if (this.searchCB) {
            this.searchCB(p);
        }
        //把它的父节点设置为当前节点
        if (p.parentIndex == -1)
            p.parentIndex = parent.myIndex;
        this.openSet.push(point);
    }


    private gF(point: T, parent: any): number {
        if (parent == null) {
            return 0;
        }
        const dx = Math.abs(point.corde.x - parent.corde.x);
        const dy = Math.abs(point.corde.y - parent.corde.y);
        let cost = 0;
        if (dx * dy == 0) {//垂直关系
            cost = parent.g + JPS.Cost90;
        } else {//斜角关系
            cost = parent.g + JPS.Cost45;
        }
        return cost;
    }

    private hF(point: T): number {
        if (!this.endPoint) {
            return 0
        }
        const dx = Math.abs(point.corde.x - this.endPoint.corde.x);
        const dy = Math.abs(point.corde.y - this.endPoint.corde.y);
        const cost = dx * JPS.Cost90 + dy * JPS.Cost90;
        return cost;
    }

    private fF(point: T): number {
        return point.g + point.h;
    }
}
