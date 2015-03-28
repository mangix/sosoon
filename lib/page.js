var ATTR_CHAIN_GROUP = "group";
var ATTR_CHAIN_INDEX = "chain";
var ATTR_ANIMATE = "anim";
var ATTR_SRC = "img-src";
var ATTR_TYPE = "type";
var ATTR_AUTO = "auto";
var ATTR_CLS = 'cls';

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
                var src = $(item).attr(ATTR_SRC);
                var image = new Image();
                image.src = src;
                image.onload = image.onerror = function () {
                    imageToLoad--;
                    if (imageToLoad <= 0) {
                        self.doReady(cb);
                    }
                };

                //如果animation是static,就直接插入dom
                if ($(item).attr(ATTR_AUTO) != "false") {
                    $('<img class="so-img '+($(item).attr(ATTR_CLS) || "")+'" src="' + src + '" />').appendTo(item);
                }

            });
        },

        doReady: function (cb) {
            this.ready = true;
            preparing = false;
            this.exit();
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
        var a = item.attr(ATTR_ANIMATE);
        var type = item.attr(ATTR_TYPE) || "";
        if (g && c && a) {
            if (!chains[g]) {
                chains[g] = [];
            }

            chains[g].push({
                index: c,
                item: new Chain.ChainItem(item, animations(a), type)
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