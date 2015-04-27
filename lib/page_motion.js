var Hammer = require("hammerjs");

module.exports = {
    "photobook": {
        init: function (el, images, chains) {
            var hammer = new Hammer(el.get(0));
            var parent = images.parent();
            var length = images.length,
                current = 0;
            var chain = chains[0];

            var isPan = false;

            hammer.on("panleft panright", function () {
                if(isPan){
                    return;
                }
                isPan = true;
                //划掉images
                images.eq(length - current -1).animate({
                    opacity: 0
                }, 1000, "easing-out", function () {
                    parent.prepend(this);
                    current = (current + 1) % length;
                    $(this).css("opacity","1");

                    if(chain){
                        var last = chain.stack.pop();
                        chain.stack.unshift(last);
                        chain.next();
                    }

                    isPan = false;
                });
            });
        }
    }
};