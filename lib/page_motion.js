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

            function motion(dir) {
                if(isPan){
                    return;
                }
                isPan = true;
                var property = {
                    opacity: 0
                };

                if(dir == 1){
                    //left
                    property.left= "-100%";
                }else{
                    property.left = "100%";
                }

                    //划掉images
                images.eq(length - current -1).animate(property, 1000, "easing-out", function () {
                    parent.prepend(this);
                    current = (current + 1) % length;
                    $(this).css({
                        opacity:1,
                        left:0
                    });

                    if(chain){
                        var last = chain.stack.pop();
                        chain.stack.unshift(last);
                        chain.next();
                    }

                    isPan = false;
                });
            }

            hammer.on("panleft", function () {
                motion(1);
            });
            hammer.on("panright", function () {
                motion(0);
            });

            //init arrow left right
            $('<div class="so-fly-left"></div><div class="so-fly-right"></div>').appendTo(el);
        }
    }
};