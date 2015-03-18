var Page = require("./page");
var PAGE_CLASS = ".so-page";

var Hammer = require("hammerjs");


module.exports = function (templateId, options) {
    var template = $($(templateId).text());

    var pages = [];
    var currentPageIndex = 0;

    template.find(PAGE_CLASS).each(function (pageT) {
        var page = Page.create(pageT);
        pages.push(page);
    });

    playLoading();

    initAudio();

    if (!pages.length) {
        return;
    }

    pages[0].prepare(function () {
        stopLoading();
        //播放第一张
        play(0);

        //绑定
        var hammer = new Hammer(document);
        hammer.get("pan").set({"direction": Hammer.DIRECTION_VERTICAL});

        hammer.on("pandown", function () {
            if (currentPageIndex > 0 && pages[currentPageIndex - 1].ready) {
                play(currentPageIndex - 1);
            }
        });
        hammer.on("panup", function () {
            if (currentPageIndex < pages.length - 1 && pages[currentPageIndex + 1].ready) {
                play(currentPageIndex + 1);
            }
        });
    });


    function play(index) {
        currentPageIndex = index;
        pages[index].entry();

        if (pages[index + 1] && !pages[index + 1].ready) {
            playPageLoading();
            pages[index + 1].prepare(stopLoading);
        }

        if (pages[index + 2] && !pages[index + 2].ready) {
            pages[index + 2].prepare();
        }
    }

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

//显示下一页正在加载
function playPageLoading() {

}

function stopPageLoading() {

}