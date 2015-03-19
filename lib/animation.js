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
        start: function (el) {
            el = $(el);
            this.origin(el);
            el.animate.apply(el, this.params);
        },
        //add complete cb
        complete: function (fn) {
            if (typeof this.params[this.params.length - 1] != "function") {
                this.params.push(fn);
            }
        },
        origin: function (el) {
            el = $(el);
            if (options.origin) {
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
    duration: 300,
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
    duration: 300,
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