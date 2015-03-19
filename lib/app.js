var Hammer = require("hammerjs");
var Page = require("./page");
var PageManager = require("./pagem").create();

var PAGE_CLASS = ".so-page";

module.exports = function (templateId, options) {
    var template = $($(templateId).text());

    template.appendTo(document.body).height(window.innerHeight);

    template.find(PAGE_CLASS).each(function (i, pageT) {
        PageManager.add(Page.create(pageT));
    });

    playLoading();

    initAudio();

    if (!PageManager.hasPage()) {
        return;
    }

    PageManager.start(function () {
        stopLoading();


        //绑定
        var hammer = new Hammer(template.get(0));
//        hammer.get("pan").set({"direction": Hammer.DIRECTION_VERTICAL});

        hammer.on("pandown", function (e) {
            console.log("down")
            PageManager.down(e.distance);
        });
        hammer.on("panup", function (e) {
            console.log("up")
            PageManager.up(e.distance);
        });
        hammer.on("panend", function () {
            PageManager.end();
        });
    });
};

//初始化背景音乐
function initAudio() {

}

//app 启动 loading
function playLoading() {

}

//停止app启动loading
function stopLoading() {

}

