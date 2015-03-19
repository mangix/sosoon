var definedAnimations = {};

var define = function (name, options) {
    var params = [];
    params.push(options.properties);
    if (options.duration) {
        params.push(options.duration);
    }
    if (params.easing) {
        params.push(options.easing);
    }

    definedAnimations[name] = {
        start: function (el) {
            el = $(el);
            this.origin(el);
            el.animate.apply(el, params);
        },
        //add complete cb
        complete: function (fn) {
            if (typeof params[params.length - 1] != "function") {
                params.push(fn);
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

module.exports = definedAnimations;

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