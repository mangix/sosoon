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
            el.animate.apply(el, params);
        },
        //add complete cb
        complete: function (fn) {
            params.push(fn);
        }
    }
};

module.exports = definedAnimations;

define("leftIn", {
    properties: {

    },
    duration: 200,
    easing: "ease-in"
});