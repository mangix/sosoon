var ATTR_CHAIN_GROUP = "chain-group";
var ATTR_CHAIN_INDEX = "chain";
var ATTR_ANIMATE = "animate";
var ATTR_SRC = "src";

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
        init: function () {

        },
        entry: function () {
            chains.forEach(function (chain) {
                chain.next();
            });
        },
        exit: function () {

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
            images.each(function (item) {
                var image = new Image();
                image.src = $(item).attr(ATTR_SRC);
                image.onload = image.onload = function () {
                    imageToLoad--;
                    if (imageToLoad <= 0) {
                        self.doReady(cb);
                    }
                };
            });
        },
        ready: false,
        doReady: function (cb) {
            this.ready = true;
            preparing = false;
            cb && cb();
        }
    }
};

function findChain(items) {
    var chains = {};
    items.each(function (i, item) {
        var g = $(item).attr(ATTR_CHAIN_GROUP);
        var c = $(item).attr(ATTR_CHAIN_INDEX);
        if (g && c) {
            if (!chains[g]) {
                chains[g] = [];
            }

            chains[g].push({
                index: c,
                item: new Chain.ChainItem(item, animations[$(item).attr(ATTR_ANIMATE)])
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
            chain.add(c);
        });
        results.push(chain);
    }
    return results;
}