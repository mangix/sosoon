var Hammer = require("hammerjs");
var Page = require("./page");
var PageManager = require("./pagem").create();

var PAGE_CLASS = ".so-page";
var share = require('./share');

var audio;

module.exports = function (templateId, options) {
    var template = $($(templateId).text());

    template.appendTo(document.body).height(window.innerHeight);

    template.find(PAGE_CLASS).each(function (i, pageT) {
        PageManager.add(Page.create(pageT));
    });

    playLoading();

    if (options.audio) {
        initAudio(options.audio);
    }


    if (!PageManager.hasPage()) {
        return;
    }
    $(document.body).on("touchstart touchmove touchend", function (e) {
        e.preventDefault();
    });
    if (options.share) {
        share.config(options.share);
    }

    PageManager.start(function () {

        stopLoading();

        //绑定
        var hammer = new Hammer(template.get(0));
//        hammer.get("pan").set({"direction": Hammer.DIRECTION_VERTICAL});

        hammer.on("pandown", function (e) {
            PageManager.down(e.distance);
        });
        hammer.on("panup", function (e) {
            PageManager.up(e.distance);
        });
        hammer.on("panleft panright", function () {
            PageManager.wrong();
        });
        hammer.on("panend", function () {
            PageManager.end();
        });


    });
};

window.STOP_AUDIO = function () {
    if (audio) {
        audio.pause();
    }
};
window.PLAY_AUDIO = function (){
    if (audio) {
        audio.play();
    }
};

//初始化背景音乐
function initAudio(url) {
    audio = $('<audio loop src="' + url + '"></audio>').appendTo(document.body).get(0);
    var btn = $('<div class="so-music play"></div>').appendTo(document.body);
    audio.play();
    btn.on("click", function () {
        if (!audio.paused) {
            audio.pause();
            btn.removeClass('play');
        } else {
            audio.play();
            btn.addClass('play');
        }
    });
}

var loading;
//app 启动 loading
function playLoading() {
    loading = $('<div class="so-load-c full"><div class="so-page-loading"></div></div>').appendTo(document.body);
}

//停止app启动loading
function stopLoading() {
    loading.remove();
}


