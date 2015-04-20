//for weixin share'

var config = {
    img_width:640,
    img_height:640,
    appid:'wx841a97238d9e17b2'
};

var action = function(){
    WeixinJSBridge.on('menu:share:appmessage', function(argv){
        WeixinJSBridge.invoke('sendAppMessage',config,function(res) { })
    });
    WeixinJSBridge.on('menu:share:timeline', function(argv){
        WeixinJSBridge.invoke('shareTimeline',config,function(res) { });
    });
};

if(window.WeixinJSBridge){
    action();
}else{
    document.addEventListener('WeixinJSBridgeReady', action, false);
}

exports.config = function(cfg){
    for(var o in cfg){
        if(cfg.hasOwnProperty(o)){
            config[o] = cfg[o];
        }
    }
};