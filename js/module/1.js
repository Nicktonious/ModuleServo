const proportion = (x, in_min, in_max, out_min, out_max) => {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
const clip = (x, a, b) => {
    return x < a ? a
         : x > b ? b
         : x;
}
let angle = 90;
let range = 180;
let dur = 0.544; //ms

class A {
    constructor(f) {
        this.f = f;
        let b = new B(this);
        Object.defineProperty(b, 'F', {
            get: () => this.f
        });
        return b;
    }
    getB() {
        return new B(this);
    }
}
class B {
    constructor(a) {
        this.a = a;
    }
}
let a = new A(10);
console.dir(a);
console.log(a.F);
a.a.f = 7;
console.log(a.F);