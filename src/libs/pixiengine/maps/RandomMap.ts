export default class RandomMap {

    private data: Array<Array<number>> = []
    private row: number = 5
    private col: number = 5

    
    // 通路数
    private num: number = this.row * this.col
    // 已访问过
    private acc: Array<number> = []
    // 未访问过
    private no_acc: Array<number> = []
    private offRow = [-1, 1, 0, 0]
    private offCol = [0, 0, -1, 1]
    private offs = [-this.row, this.row, -1, 1]
    private index

    constructor(options: any) {
        // 地图行列参数传入
        Object.assign(this, options)
        
        // 初始化
        const _row = this.row * 2 + 1;
        const _col = this.col * 2 + 1;
        // 生成一个 长 = 长 * 2 + 1 宽 = 宽 * 2 + 1 的二维数组 且全部填充 1
        for (let i = 0; i < _col; i++) {
            const _arr = new Array(_row).fill(1);
            this.data.push(_arr)
        }
        // 偶数行偶数列格子填充 0
        for (let i = 1; i < _col; i += 2) {
            for (let j = 1; j < this.data[i].length; j += 2) {
                this.data[i][j] = 0;
            }
        }

        // 
        this.num = this.row * this.col
        this.no_acc = [...Array(this.num).fill(0)]
        this.index = ~~(Math.random() * this.num)
        this.no_acc[this.index] = 1
        this.acc.push(this.index)

        // this.create()
    }

    public getData(): Array<Array<number>> {
        return this.data
    }

    // create() {
    //     while (this.acc.length < this.num) {
    //         this.onCreate()
    //     }
    // }


    indexToPos(index: number, c: number): any {
        const pos = [...Array(4).fill(0)]
        pos[0] = (index / c | 0) * 2 + 1
        pos[1] = (index % c) * 2 + 1
        return pos
    }

    onCreate(): boolean {
        if (this.acc.length < this.num) {
            console.log('onCreate')
            let ls = -1
            let offPos = -1
            let n = 0
            let offetIndex = 0
            // 随机寻找周围四个关联单元
            while (++n < 5) {
                // 随机索引取值0到4
                offetIndex = ~~(Math.random() * 5)
                ls = this.offs[offetIndex] + this.index
                // 行
                const tpr = (this.index / this.row | 0) + this.offCol[offetIndex]
                // 列
                const tpc = (this.index % this.row) + this.offCol[offetIndex]
                // 
                if (this.no_acc[ls] == 0 && tpr >= 0 && tpc >= 0 && tpr <= this.col - 1 && tpc <= this.row - 1) {
                    offPos = offetIndex
                    break
                }
            }
    
            if (offPos < 0) {
                // 如果没有找到符合的位置
                // 重新在访问列表种随机选取一个位置
                this.index = this.acc[~~(Math.random() * this.acc.length)]
            } else {
                // 否则，找到这个位置的连接点打通
                const pos = this.indexToPos(this.index, this.row)
                const x = pos[0] + this.offRow[offPos]
                const y = pos[1] + this.offCol[offPos]
                this.data[x][y] = 0
                this.index = ls
    
                this.no_acc[this.index] = 1
                this.acc.push(this.index)
            }
            return true
        } else {
            return false
        }
    }
}