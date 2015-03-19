var Chain = function () {
    this.stack = [];
    this.index = 0;
};

Chain.prototype.origin = function () {
    this.stack.forEach(function (chainItem) {
        chainItem.animate.origin(chainItem.type == "img" ? chainItem.el.find("img") : chainItem.el);
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
    chainItem.animate.start(chainItem.type == "img" ? chainItem.el.find(".so-img") : chainItem.el);
};

Chain.prototype.add = function (chainItem) {
    this.stack.push(chainItem);
};


var ChainItem = function (el, animate, type) {
    this.el = el;
    this.animate = animate;
    this.type = type;
};


exports.Chain = Chain;
exports.ChainItem = ChainItem;