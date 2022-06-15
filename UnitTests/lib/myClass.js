class MyClass {
    contructor() {
        console.log("Initialised");
    }

    sayHello(msg)  {
        console.log(msg);
    }

    add(n1, n2){
        var res = n1 + n2;
        return res;
    }

    callFunc(a1, a2){
        this.sayHello('Hello World');
        var res = this.add(a1, a2);
        return res;
    }
}

module.exports = MyClass