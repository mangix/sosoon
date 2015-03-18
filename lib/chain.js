var Chain = function () {
    this.stack = [];
    this.index = 0;
};

Chain.prototype.next = function () {
    if (!this.stack[this.index]) {
        return;
    }
    var self = this;
    this.stack[this.index].animate.complete(function () {
        self.index++;
        self.next();
    });
    this.stack[this.index].start();
};

Chain.prototype.add = function (chainItem) {
    this.stack.push(chainItem);
};


var ChainItem = function (el, animate) {
    this.el = el;
    this.animate = animate;
};


exports.Chain = Chain;
exports.ChainItem = ChainItem;