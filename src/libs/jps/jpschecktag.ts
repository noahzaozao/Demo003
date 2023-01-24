
export default class JPSCheckTag<T> {

    tag: T;

    constructor(v: T) {
        this.tag = v;
    }

    compare(t: JPSCheckTag<T>): boolean {
        return t.tag == this.tag;
    }
}
