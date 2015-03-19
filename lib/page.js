var ATTR_CHAIN_GROUP = "chain-group";
var ATTR_CHAIN_INDEX = "chain";
var ATTR_ANIMATE = "animate";
var ATTR_SRC = "img-src";
var ATTR_TYPE = "type";

var Chain = require("./chain");
var animations = require("./animation");

exports.create = function (template) {
    var container = $(template);
    var items = container.find(".so-item");
    var images = items.filter("[type=img]");

    var imageToLoad = images.size();

    var chains = findChain(items);

    var preparing = false;

    return {
        el: container,
        ready: false,
        init: function () {

        },
        entry: function () {
            chains.forEach(function (chain) {
                chain.next();
            });
        },
        exit: function () {
            chains.forEach(function (chain) {
                chain.origin();
            });
        },
        prepare: function (cb) {
            if (preparing) {
                return;
            }
            preparing = true;
            var self = this;
            if (imageToLoad <= 0) {
                this.doReady(cb);
                return;
            }
            //加载IMG
            images.each(function (i, item) {
                var src = $(item).attr(ATTR_SRC)
                var image = new Image();
                image.src = src;
                image.onload = image.onload = function () {
                    imageToLoad--;
                    if (imageToLoad <= 0) {
                        self.doReady(cb);
                    }
                };

                //如果animation是static,就直接插入dom
//                if ($(item).attr(ATTR_ANIMATE) == "static") {
                $('<img src="' + src + '" width="100%" height="100%" />').appendTo(item);
//                }
            });
        },

        doReady: function (cb) {
            this.ready = true;
            preparing = false;
            cb && cb();
        },
        scale: function (x, isTop) {
            this.el.get(0).style.webkitTransformOrigin = "50% " + (isTop ? 0 : "100%");
            this.el.css("-webkit-transform", "scale(" + x + ")");

            return this;
        }
    }
};

function findChain(items) {
    var chains = {};
    items.each(function (i, item) {
        item = $(item);
        var g = item.attr(ATTR_CHAIN_GROUP);
        var c = item.attr(ATTR_CHAIN_INDEX);
        var type = item.attr(ATTR_TYPE) || "";
        if (g && c) {
            if (!chains[g]) {
                chains[g] = [];
            }

            chains[g].push({
                index: c,
                item: new Chain.ChainItem(item, animations[item.attr(ATTR_ANIMATE)], type)
            });
        }
    });
    var results = [];
    for (var o in chains) {
        if (!chains.hasOwnProperty(o)) {
            continue;
        }
        var chain = new Chain.Chain();
        chains[o].sort(function (o1, o2) {
            return o1.index - o2.index
        });
        chains[o].forEach(function (c) {
            chain.add(c.item);
        });
        results.push(chain);
    }
    return results;
}