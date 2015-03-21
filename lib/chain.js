var Chain = function () {
    this.stack = [];
    this.index = 0;
};

Chain.prototype.origin = function () {
    this.stack.forEach(function (chainItem) {
        chainItem.animate.origin(chainItem.actualEl());
    });
};

Chain.prototype.next = function () {
    if (!this.stack[this.index]) {
        //reset
        this.index = 0;
        return;
    }
    var self = this;
    var chainItem = this.stack[this.index];
    chainItem.animate.complete(function () {
        self.index++;
        self.next();
    });
    chainItem.animate.start(chainItem.actualEl(), this.index, this.stack.length);
};

Chain.prototype.add = function (chainItem) {
    this.stack.push(chainItem);
};


var ChainItem = function (el, animate, type) {
    this.el = el;
    this.animate = animate;
    this.type = type;
};

ChainItem.prototype.actualEl = function () {
    var img = this.el.find(".so-img");
    return this.type == "img" && img.size() ? img : this.el;
};


exports.Chain = Chain;
exports.ChainItem = ChainItem;