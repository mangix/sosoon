var Page = require("./page");
var MAX_PAGE = 100;

var maxZ = MAX_PAGE;

//显示下一页正在加载
function playPageLoading() {

}

function stopPageLoading() {

}

exports.create = function () {
    var stack = [];
    var current = 0;
    var direction = 0; //up

    //TODO remove
    window.getCurrent = function () {
        return current
    };

    function play(index) {
        current = index;
        stack[index].entry();

        if (stack[index + 1] && !stack[index + 1].ready) {
            playPageLoading();
            stack[index + 1].prepare(stopPageLoading);
        }

        if (stack[index + 2] && !stack[index + 2].ready) {
            stack[index + 2].prepare();
        }
    }

    return {
        add: function (page) {
            stack.push(page);
            page.el.css("z-index", maxZ - stack.length);
            if (stack.length > 1) {
                page.el.css("top", window.innerHeight);
            }
        },
        next: function () {
            if (this.isNextReady()) {
                play(current + 1);
            }
        },
        prev: function () {
            if (this.isPrevReady()) {
                play(current - 1);
            }
        },
        hasPage: function () {
            return !!stack.length;
        },
        start: function (cb) {
            maxZ++;
            if (!this.hasPage()) {
                return;
            }
            stack[0].prepare(function () {
                play(0);
                cb && cb();
            });
        },
        end: function () {
            var self = this;
            maxZ++;
            if (!((direction == 0 && this.isNextReady()) || (direction == 1 && this.isPrevReady()))) {
                return;
            }

            (direction == 0 ? stack[current + 1] : stack[current - 1]).el.animate({
                top: 0
            }, 300, function () {
                self[direction == 0 ? "next" : "prev"]();
            });

            var pre = stack[current];
            pre.el.animate({
                scale: 0.5
            }, 300, function () {
                pre.exit();
            });

        },
        //滑动往上
        up: function (deltaY) {
            if (this.isNextReady()) {
                direction = 0;
                var next = stack[current + 1];
                next.el.get(0).style.webkitTransform = '';
                next.el.css({
                    "top": window.innerHeight - deltaY,
                    "z-index": maxZ
                });
                stack[current].scale(1 - deltaY / window.innerHeight/2, true);
            }
        },
        down: function (deltaY) {
            if (this.isPrevReady()) {
                direction = 1;
                var prev = stack[current - 1];
                prev.el.get(0).style.webkitTransform = '';
                prev.el.css({
                    "top": deltaY - window.innerHeight,
                    "z-index": maxZ
                });
                stack[current].scale(1 - deltaY / window.innerHeight/2);
            }
        },
        isNextReady: function () {
            return current < stack.length - 1 && stack[current + 1].ready;
        },
        isPrevReady: function () {
            return current > 0 && stack[current - 1].ready;
        }
    };
};
