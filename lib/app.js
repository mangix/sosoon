var Page = require("./page");
var PAGE_CLASS = ".so-page";

var Hammer = require("hammerjs");

function initAudio() {

}

function playLoading() {

}

function stopLoading() {

}

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
        var hammer = Hammer(document);
        hammer.on("pan")
    });


    function play(index) {
        currentPageIndex = index;
        pages[index].entry();


        if (pages[index + 1]) {
            pages[index + 1].prepare();
        }

        if (pages[index + 2]) {
            pages[index + 2].prepare();
        }
    }

};