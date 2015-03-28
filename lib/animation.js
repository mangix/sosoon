var definedAnimations = {};


var define = function (name, options) {
    var params = [];
    params.push(options.properties);
    if (options.duration) {
        params.push(options.duration);
    }
    if (options.easing) {
        params.push(options.easing);
    }

    var Animate = definedAnimations[name] = function () {
        this.params = params.slice(0);
    };
    Animate.prototype = {
        start: function (el, indexOfChain, lengthOfChain) {
            el = $(el);
//            this.origin(el);
            if (options.animate) {
                options.animate.call(this, el, indexOfChain, lengthOfChain, this.cb);
            } else {
                el.animate.apply(el, this.params);
            }

        },
        //add complete cb
        complete: function (fn) {
            if (typeof this.params[this.params.length - 1] != "function") {
                this.params.push(fn);
                this.cb = fn;
            }
        },
        origin: function (el) {
            el = $(el);
            if (options.origin && typeof options.origin === "function") {
                options.origin.call(this, el);
            } else {
                el.css(options.origin);
            }
        }
    }
};

module.exports = function (name) {
    if (definedAnimations[name]) {
        return new definedAnimations[name]();
    }
};

define("leftIn", {
    origin: {
        "left": "-100%",
        "top": 0,
        "position": "absolute"
    },
    properties: {
        left: "0"
    },
    duration: 600,
    easing: "ease-in-out"
});
define("rightIn", {
    origin: {
        "right": "-100%",
        "top": 0,
        "position": "absolute"
    },
    properties: {
        right: 0
    },
    duration: 600,
    easing: "ease-in-out"
});
define("topIn", {
    origin: {
        "top": '-100%',
        "position": "absolute"
    },
    properties: {
        top: "0"
    },
    duration: 600,
    easing: "ease-in-out"
});

define("rightIn", {
    origin: {
        "right": "-100%",
        "top": 0,
        "position": "absolute"
    },
    properties: {
        right: 0
    },
    duration: 600,
    easing: "ease-in-out"
});

define("fadeIn", {
    origin: {
        "opacity": 0
    },
    properties: {
        opacity: 1
    },
    duration: 1000,
    easing: "ease-in"
});

define("tftr", {
    origin: {
        "opacity": 0,
        right: 30
    },
    properties: {
        opacity: 1,
        right: -20
    },
    duration: 600,
    easing: "ease-out"
});
define("tfri", {
    origin: {
        "opacity": 0,
        right: -50
    },
    properties: {
        opacity: 1,
        right: -25
    },
    duration: 600,
    easing: "ease-out"
});
define("tpop1", {
    origin: {
        "opacity": 0,
        top: 30
    },
    properties: {
        opacity: 1,
        top: 10
    },
    duration: 600,
    easing: "ease-out"
});
define("tpop2", {
    origin: {
        "opacity": 0,
        top: 50
    },
    properties: {
        opacity: 1,
        top: 20
    },
    duration: 600,
    easing: "ease-out"
});
define("tpop3", {
    origin: {
        "opacity": 0,
        top: 60
    },
    properties: {
        opacity: 1,
        top: 30
    },
    duration: 600,
    easing: "ease-out"
});

define("tfd", {
    origin: {
        "opacity": 0,
        top: 10
    },
    properties: {
        opacity: 1,
        top: 30
    },
    duration: 600,
    easing: "ease-out"
});

define("canvas-glass", {
    origin: function (el) {
        if (!this.canvas) {
            this.canvas = $('<canvas width="' + window.innerWidth + '" height="' + window.innerHeight + '"></canvas>')
                .appendTo(el).get(0);
            var src = el.attr('img-src');
            this.img = new Image();
            this.img.src = src;

            this.preImg = $('<img src="' + src + '" width=100% height=auto style="position:absolute;left:0;top:0;z-index:100;"  />').appendTo(el);

        }
        var self = this;
        this.gc = self.canvas.getContext("2d");

        this.preImg.show();

    },
    animate: function () {
        var gc = this.gc;
        var self = this;
        self.preImg.hide();

        gc.clearRect(0, 0, self.canvas.width, self.canvas.height);
        gc.drawImage(this.img, 0, 0, self.canvas.width, self.canvas.height);

        gc.lineCap = "round";
        gc.lineJoin = "round";
        gc.globalCompositeOperation = "destination-out";

        gc.beginPath();
        gc.moveTo(window.innerWidth / 2, window.innerHeight / 2);
        gc.lineWidth = 50;
        var w = window.innerWidth,
            h = window.innerHeight;
        var self = this;

        var frameCount = 50;
        var draw = function () {
            if (frameCount--) {
                var x = w / 4 + w / 2 * Math.random(),
                    y = h / 4 + h / 2 * Math.random();
                gc.lineTo(x, y);
                gc.stroke();
                setTimeout(draw, 20);
            } else {
                $(self.canvas).animate({
                    opacity: 0
                }, 800, "ease-in", function () {
                    $(self.canvas).remove();
                    self.preImg.remove();
                    self.canvas = null;
                });

            }
        };

        draw();


    }
});

define("fly", {
    origin: {
        "-wetkit-transform": "rotate(0)",
        left: '-100%',
        top: '100%',
        position: 'absolute'
    },
    animate: function (el, i, l, cb) {
        var total = 20;//deg
        var thisDeg = total - total / (l - 1) * i;
        el.animate({
            "rotate": thisDeg + "deg",
            left: '10%',
            top: '10%'
        }, 300, 'ease-out', cb);
    }
});
