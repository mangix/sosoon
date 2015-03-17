(function () {
	var count = 0;
	window.zachModule = function ( module ) {
		zachModule[count++] = {};
		module();
	};

	window.main = function ( func ) {
		func();
	};
})();


zachModule( function () {
	// region 遍历
	// 遍历次数
	function loop( t, block ) {
		for ( var i = 0; i !== t; ++i ) {
			block( i );
		}
	}

	// 遍历数组
	function loopArray( list, block ) {
		var retVal;
		for ( var i = 0, len = list.length; i !== len; ++i ) {
			if ( ( retVal = block( list[i], i ) ) !== undefined ) {
				return retVal;
			}
		}
	}

	// 遍历对象
	function loopObj( obj, block ) {
		var retVal;
		for ( var key in obj ) {
			if ( ( retVal = block( key, obj[key] ) !== undefined ) ) {
				return retVal;
			}
		}
	}

	// 遍历字符串
	function loopString( string, func, isChar ) {
		var i, len;
		for ( i = 0, len = string.length; i !== len; ++i ) {
			func( isChar ? string.charAt( i ) : string.charCodeAt( i ), i );
		}
	}

	// endregion

	// region 对象
	function defaultValue( val, defaultValue ) {
		return val === undefined ? defaultValue : val;
	}

	function merge( outObj, inObjList ) {
		loopArray( inObjList, function ( obj ) {
			loopObj( obj, function ( key, value ) {
				value !== undefined && ( outObj[key] = value );
			} );
		} );
		return outObj;
	}

	// 将若干个对象合并到第一个对象中,并返回第一个对象
	function insert( obj ) {
		return merge( obj, Array.prototype.slice.call( arguments, 1 ) );
	}

	// 将若干个对象合并,返回合并后的新对象
	function extend() {
		var retVal = {};
		return merge( retVal, arguments );
	}

	// 从obj中取出defaultObj中的字段,如果obj中没有这个字段,使用defaultObj的值
	function extract( obj, defaultObj ) {
		var retVal = {};
		loopObj( defaultObj, function ( key, val ) {
			retVal[key] = defaultValue( obj[key], val );
		} );
		return retVal;
	}

	// 从obj中移除字段,返回移除后的新对象
	function exclude( obj, fieldList ) {
		var fieldSet = Set( fieldList ),
			retVal = {};

		loopObj( obj, function ( key, value ) {
			!fieldSet.contains( key ) && ( retVal[key] = value );
		} );

		return retVal;
	}

	// 返回一个字典的key数组
	function keys( obj ) {
		var retVal = [];
		loopObj( obj, function ( key ) {
			retVal.push( key );
		} );
		return retVal;
	}

	// 定义getter
	function defineGetter( obj, arg1, arg2 ) {
		request( function ( def ) {
			is.String( arg1 ) ? def( arg1, arg2 ) : loopObj( arg1, def );
		}, function ( name, func ) {
			Object.defineProperty( obj, name, {
				get : func
			} );
		} );
	}

	// 定义自动对象
	function defineAutoProperty( obj, arg1, arg2 ) {
		request( function ( def ) {
			is.String( arg1 ) ? def( arg1, arg2 ) : loopObj( arg1, def );
		}, function ( name, arg ) {
			arg = arg || {};
			var val = arg.value, write = arg.set;
			val !== undefined && write( val );

			Object.defineProperty( obj, name, {
				get : function () {
					return val;
				},
				set : function ( tVal ) {
					val = write ? defaultValue( write( tVal ), tVal ) : tVal;
				}
			} );
		} );
	}

	// endregion

	// region 技巧
	// 对象类型判断
	var is = (function () {
		var is = {};
		loopArray( ["Array", "Boolean", "Date", "Function", "Number", "Object", "RegExp", "String", "Window", "HTMLDocument"], function ( typeName ) {
			is[typeName] = function ( obj ) {
				return Object.prototype.toString.call( obj ) == "[object " + typeName + "]";
			};
		} );
		return is;
	})();

	// 根据函数字符串调用函数
	function callFunction( funcStr ) {
		return new Function( "return " + funcStr )().apply( null, Array.prototype.slice.call( arguments, 1 ) );
	}

	// endregion

	// region 字符串
	// 将一个元组转化为字符串
	function tupleString( tupleName, list ) {
		return tupleName + "(" + list.join( "," ) + ")";
	}

	// 返回一个元祖字符串制作函数,如TupleString( "rgba" )( 2, 3, 4, 0.4 )会返回rgba(2,3,4,0.4);
	function TupleString( tupleName ) {
		return function () {
			return tupleName + "(" + Array.prototype.join.call( arguments, "," ) + ")";
		};
	}

	// 将对象转化问URI字符串
	function encodeURIObject( obj ) {
		var retVal = "", i = 0;
		loopObj( obj || {}, function ( key, value ) {
			i++ && ( retVal += "&" );
			retVal += encodeURIComponent( key );
			retVal += '=';
			retVal += encodeURIComponent( value );
		} );
		return retVal;
	}


	// 解析配对连接字符串,如name=tom&class=2&grade=3
	function parsePairString( str, split1, split2, doPair ) {
		loopArray( str.split( split1 ), function ( searchPair ) {
			var keyValue = searchPair.split( split2 );
			doPair( keyValue[0], keyValue[1] );
		} );
	}

	// 为字符串提供url解析功能
	var regUrl = /(?:((?:[^:/]*):)\/\/)?([^:/?#]*)(?::([0-9]*))?(\/[^?#]*)?(\?[^#]*)?(#.*)?/;
	loopArray( ["protocol", "hostname", "port", "pathname", "search", "hash"], function ( partName, i ) {
		defineGetter( String.prototype, partName, function () {
			return regUrl.test( this ) ? RegExp["$" + ( i + 1 )] : "";
		} );
	} );

	loopObj( {
		host : function () {
			return this.hostname + ( this.port ? ":" + this.port : "" );
		},
		origin : function () {
			return this.protocol + "//" + this.host;
		},
		arg : function () {
			var arg = {};
			parsePairString( this.search.substring( 1 ), "&", "=", function ( key, value ) {
				key !== "" && ( arg[key] = decodeURIComponent( value ) );
			} );
			return arg;
		}
	}, function ( name, func ) {
		defineGetter( String.prototype, name, func );
	} );

	function concatUrlArg( url, arg ) {
		var newSearch = encodeURIObject( extend( url.arg, arg ) );
		return url.origin + url.pathname + ( newSearch ? "?" : "" ) + newSearch + url.hash;
	}

	function removeUrlArg( url, argNameList ) {
		var newSearch = encodeURIObject( exclude( url.arg, argNameList ) );
		return url.origin + url.pathname + ( newSearch ? "?" : "" ) + newSearch + url.hash;

	}

	// endregion

	// region 链表
	// 双向链表
	function LinkedList() {
		var head = null, tail = null;

		return {
			head : function () {
				return head;
			},
			tail : function () {
				return tail;
			},
			insert : function ( tarNode, refNode ) {
				var previous = refNode ? refNode.previous : tail;
				tarNode.next = refNode;
				tarNode.previous = previous;
				previous ? previous.next = tarNode : head = tarNode;
				refNode ? refNode.previous = tarNode : tail = tarNode;
				return tarNode;
			},
			remove : function ( node ) {
				node.previous ? node.previous.next = node.next : head = node.next;
				node.next ? node.next.previous = node.previous : tail = node.previous;
			}
		};
	}

	LinkedList.Node = function ( value ) {
		return {
			previous : null,
			next : null,
			value : value
		};
	};

	LinkedList.loop = function ( list, func ) {
		var retVal;
		for ( var cur = list.head(); cur !== null; cur = cur.next ) {
			if ( ( retVal = func( cur.value, cur ) ) !== undefined ) {
				return retVal;
			}
		}
	};
	// endregion

	// region 数组
	// 提供数组的top
	Object.defineProperty( Array.prototype, "top", {
		get : function () {
			return this[this.length - 1];
		},
		set : function ( val ) {
			this[this.length - 1] = val;
		}
	} );
	// endregion

	// region 数据结构
	// 集合,根据一个数组构建一个集合,用来判断一个key是否属于集合
	function Set( arr ) {
		var dict = {};
		loopArray( arr, function ( item ) {
			dict[item] = true;
		} );

		return {
			contains : function ( key ) {
				return dict[key] === true;
			}
		};
	}

	// endregion

	// region 异步编程
	// 事件
	function Event() {
		var events = LinkedList();

		return {
			trig : function () {
				var arg = arguments;
				LinkedList.loop( events, function ( task ) {
					task.apply( null, arg );
				} );
			},
			regist : function ( value ) {
				var node = events.insert( LinkedList.Node( value ), null );
				return {
					remove : function () {
						events.remove( node );
					}
				};
			}
		};
	}

	// 递归
	function recursion( func ) {
		func.apply( null, Array.prototype.slice.call( arguments, 1 ) );
	}

	// 装载器
	function Loader( inOrder ) {
		var taskList = [];

		return {
			load : function ( task ) {
				taskList.push( task );
			},
			start : function ( onLoad ) {
				if ( taskList.length === 0 ) {
					onLoad();
				}
				else if ( inOrder ) {
					recursion( function load( index ) {
						var task = taskList[index];
						task ? task( function () {
							load( index + 1 )
						} ) : onLoad();
					}, 0 );
				}
				else {
					var count = taskList.length;
					loopArray( taskList, function ( task ) {
						task( function () {
							--count === 0 && onLoad();
						} );
					} );
				}
			}
		}
	}

	// 资源,需要加载使用,但全局只会加载一次
	function Resource( load ) {
		var resource, onLoadList;

		return {
			load : function ( onLoad ) {
				// 如果还有装载函数表示装载没有完成
				if ( load ) {
					// 如果没有onLoad数组,创建装载列表,并开始装载
					if ( !onLoadList ) {
						onLoadList = [];
						load( function ( targetResource ) {
							resource = targetResource;
							loopArray( onLoadList, function ( onLoad ) {
								onLoad( resource );
							} );
							onLoadList = null;
							load = null;
						} );
					}

					onLoadList.push( onLoad );
				}
				// 否则直接回调
				else {
					onLoad( resource );
				}
			}
		};
	}

	function procedure( step ) {
		var len = step.length;

		recursion( function call( i, arg ) {
			var func = step[i];
			if ( func ) {
				func.apply( null, i === len - 1 ? arg : [function () {
					call( i + 1, Array.prototype.slice.call( arguments, 0 ) );
				}].concat( arg ) );
			}
		}, 0, [] );
	}

	function request( request, callback ) {
		return request( callback );
	}

	// 异步遍历数组
	function loopArrayAsync( array, onItem, onDone, inOrder ) {
		var loader = Loader( inOrder );
		loopArray( array, function ( item, i ) {
			loader.load( function ( done ) {
				onItem( done, item, i );
			} );
		} );
		loader.start( onDone );
	}

	// endregion

	// region 导出
	// 技巧
	zachModule["0"].is = is;
	zachModule["0"].callFunction = callFunction;

	// 遍历
	zachModule["0"].loop = loop;
	zachModule["0"].loopArray = loopArray;
	zachModule["0"].loopObj = loopObj;
	zachModule["0"].loopString = loopString;

	// 对象
	zachModule["0"].defaultValue = defaultValue;
	zachModule["0"].insert = insert;
	zachModule["0"].extend = extend;
	zachModule["0"].extract = extract;
	zachModule["0"].exclude = exclude;
	zachModule["0"].keys = keys;
	zachModule["0"].defineGetter = defineGetter;
	zachModule["0"].defineAutoProperty = defineAutoProperty;

	// 字符串
	zachModule["0"].encodeURIObject = encodeURIObject;
	zachModule["0"].tupleString = tupleString;
	zachModule["0"].TupleString = TupleString;
	zachModule["0"].parsePairString = parsePairString;
	zachModule["0"].concatUrlArg = concatUrlArg;
	zachModule["0"].removeUrlArg = removeUrlArg;

	// 数据结构
	zachModule["0"].Set = Set;
	zachModule["0"].LinkedList = LinkedList;

	// 异步编程
	zachModule["0"].Event = Event;
	zachModule["0"].Loader = Loader;
	zachModule["0"].Resource = Resource;
	zachModule["0"].procedure = procedure;
	zachModule["0"].recursion = recursion;
	zachModule["0"].request = request;
	zachModule["0"].loopArrayAsync = loopArrayAsync;
	// endregion
} );

/**
 * Created by Zuobai on 14-1-10.
 * 经典浏览器封装
 */

zachModule( function () {
	// region 引入
	var util =zachModule["0"],
		insert = util.insert,
		loopArray = util.loopArray,
		loopObj = util.loopObj,
		LinkedList = util.LinkedList,
		is = util.is,
		defineGetter = util.defineGetter,
		Event = util.Event;
	// endregion

	// region 浏览器检测
	(function ( ua, appVersion, platform ) {
		insert( window.ua = window.ua || {}, {
			// win系列
			win32 : platform === "Win32",
			ie : !!window.ActiveXObject || "ActiveXObject" in window,
			ieVersion : Math.floor( (/MSIE ([^;]+)/.exec( ua ) || [0, "0"])[1] ),

			// ios系列
			ios : (/iphone|ipad/gi).test( appVersion ),
			iphone : (/iphone/gi).test( appVersion ),
			ipad : (/ipad/gi).test( appVersion ),
			iosVersion : parseFloat( ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec( ua ) || [0, ''])[1])
				.replace( 'undefined', '3_2' ).replace( '_', '.' ).replace( '_', '' ) ) || false,
			safari : /Version\//gi.test( appVersion ) && /Safari/gi.test( appVersion ),
			uiWebView : /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test( ua ),

			// 安卓系列
			android : (/android/gi).test( appVersion ),
			androidVersion : parseFloat( "" + (/android ([0-9\.]*)/i.exec( ua ) || [0, ''])[1] ),

			// chrome
			chrome : /Chrome/gi.test( ua ),
			chromeVersion : parseInt( ( /Chrome\/([0-9]*)/gi.exec( ua ) || [0, 0] )[1], 10 ),

			// 内核
			webkit : /AppleWebKit/.test( appVersion ),

			// 其他浏览器
			uc : appVersion.indexOf( "UCBrowser" ) !== -1,
			Browser : / Browser/gi.test( appVersion ),
			MiuiBrowser : /MiuiBrowser/gi.test( appVersion ),

			// 微信
			MicroMessenger : ua.toLowerCase().match( /MicroMessenger/i ) == "micromessenger",

			// 触摸
			canTouch : "ontouchstart" in document,
			msPointer : window.navigator.msPointerEnabled
		} );
	})( navigator.userAgent, navigator.appVersion, navigator.platform );
	// endregion

	// region 路径
	// 将相对地址转换为绝对地址
	function toAbsURL( url ) {
		var a = document.createElement( 'a' );
		a.href = url;
		return a.href;
	}

	// endregion

	// region 浏览器扩展
	// 为元素添加pageLeft和pageTop属性,元素相对于文档的偏移
	loopArray( ["Left", "Top"], function ( direction ) {
		defineGetter( HTMLElement.prototype, "page" + direction, function () {
			var retVal = 0, cur, body = document.body;

			for ( cur = this; cur !== body; cur = cur.offsetParent || cur.parentElement ) {
				retVal += cur["offset" + direction] - ( cur === this ? 0 : cur["scroll" + direction] );
			}

			return retVal;
		} );
	} );

	// 为UIEvent添加zPageX,zPageY,zClientX,zClientY属性,统一触摸和鼠标
	loopArray( ["pageX", "pageY", "clientX", "clientY"], function ( coordinateName ) {
		Object.defineProperty( UIEvent.prototype, "z" + coordinateName.replace( /^./, function ( ch ) {
			return ch.toUpperCase();
		} ), {
			get : function () {
				return "touches" in this && this.touches[0] !== undefined ? this.touches[0][coordinateName] : this[coordinateName];
			}
		} );
	} );
	// endregion

	// region CSS
	window.nonstandardStyles = {};

	// 设置CSS值,可以设置一条或者设置一组
	function css( el, arg1, arg2 ) {
		function setStyle( styleName, styleValue ) {
			if ( styleName in nonstandardStyles ) {
				loopArray( nonstandardStyles[styleName], function ( styleName ) {
					el.style.setProperty( styleName, styleValue, "" );
				} );
			}
			else {
				el.style.setProperty( styleName, styleValue, "" );
			}
		}

		is.String( arg1 ) ? setStyle( arg1, arg2 ) : loopObj( arg1, setStyle );
		return el;
	}

	css.size = function ( el, width, height ) {
		css( el, {
			width : width + "px",
			height : height + "px"
		} );
	};
	// endregion

	// region 动画
	// 请求连续动画
	var requestAnimate = function () {
		var timeout = null, tasks = LinkedList();

		return function ( task ) {
			var node = null;

			function start() {
				// 如果任务没有添加进链表,添加到链表中
				if ( node === null ) {
					node = tasks.insert( LinkedList.Node( task ), null );

					// 如果当前没有计时,开始计时
					if ( timeout === null ) {
						timeout = setTimeout( function frame() {
							var cur;
							if ( tasks.tail() !== null ) {
								timeout = setTimeout( frame, 1000 / 60 );
								for ( cur = tasks.head(); cur !== null; cur = cur.next ) {
									cur.value();
								}
							}
							else {
								timeout = null;
							}
						}, 1000 / 60 );
					}
				}
			}

			start();

			return {
				start : start,
				remove : function () {
					node && tasks.remove( node );
					node = null;
				}
			};
		};
	}();

	// endregion

	// region 事件
	// 绑定事件
	function bindEvent( el, eventType, response, isCapture ) {
		var remove;

		if ( el.addEventListener ) {
			el.addEventListener( eventType, response, isCapture || false );
			remove = function () {
				el.removeEventListener( eventType, response, isCapture || false );
			};
		}
		else {
			el.attachEvent( "on" + eventType, response );
			remove = function () {
				el.detachEvent( "on" + eventType, response );
			};
		}

		return {
			remove : remove
		};
	}

	// 制作一个事件绑定器
	function Bind( eventType ) {
		return function ( el, response, isCapture ) {
			return bindEvent( el, eventType, response, isCapture );
		};
	}

	// 当元素插入到文档时回调
	function onInsert( el, response ) {
		if ( document.documentElement.contains( el ) ) {
			response && response();
		}
		else {
			var insertEvent = bindEvent( el, "DOMNodeInsertedIntoDocument", function () {
				response && response( el );
				insertEvent.remove();
			} );
		}
	}

	// endregion

	// region ajax
	function ajax( arg ) {
		// 计算url
		var url = arg.url + util.encodeURIObject( arg.arg ),
			xhr = new XMLHttpRequest();

		bindEvent( xhr, "load", function () {
			var data = xhr.responseText;
			try {
				if ( arg.isJson ) {
					data = JSON.parse( data );
				}
			}
			catch ( e ) {
				arg.onError && arg.onError( xhr );
				return;
			}

			arg.onLoad && arg.onLoad( data, xhr );
		} );

		bindEvent( xhr, "error", function () {
			arg.onError && arg.onError( xhr );
		} );

		xhr.open( arg.method || "get", url, true );

		// 添加requestHeader
		arg.requestHeader && loopObj( arg.requestHeader, function ( key, value ) {
			xhr.setRequestHeader( key, value );
		} );

		xhr.send( arg.data || null );

		return xhr;
	}

	// endregion

	// region 加载
	var onLoad = function () {
		var loadEvent = null;
		return function ( callback ) {
			if ( document.readyState === "complete" ) {
				callback();
			}
			else {
				if ( loadEvent === null ) {
					loadEvent = Event();
					var loadHandle = bindEvent( window, "load", function () {
						loadEvent.trig();
						loadHandle.remove();
						loadEvent = null;
					} );
				}

				loadEvent.regist( callback );
			}
		};
	}();
	// endregion

	// region 导出
	// 路径
	zachModule["1"].toAbsURL = toAbsURL;

	// css
	zachModule["1"].css = css;

	// 事件
	zachModule["1"].bindEvent = bindEvent;
	zachModule["1"].Bind = Bind;
	zachModule["1"].onInsert = onInsert;

	// 动画
	zachModule["1"].requestAnimate = requestAnimate;

	// ajax
	zachModule["1"].ajax = ajax;

	// 加载
	zachModule["1"].onLoad = onLoad;
	// endregion
} );

/**
 * Created by 白 on 2014/10/29.
 * 封装一些DOM经典复用
 */

zachModule( function () {
	var util =zachModule["0"],
		is = util.is,
		loopArray = util.loopArray,
		loopObj = util.loopObj,
		insert = util.insert,
		tupleString = util.tupleString,
		LinkedList = util.LinkedList,

		browser =zachModule["1"],
		css = browser.css,
		bindEvent = browser.bindEvent;

	// region css
	insert( nonstandardStyles, {
		transform : ["-webkit-transform", "-ms-transform", "transform"],
		"transform-origin" : ["-webkit-transform-origin", "transform-origin"],
		animation : ["-webkit-animation"],
		transition : ["-webkit-transition", "transition"],
		"backface-visibility" : ["-webkit-backface-visibility", "-mozila-backface-visibility", "backface-visibility"],
		"transform-style" : ["-webkit-transform-style", "transform-style"],
		perspective : ["-webkit-perspective", "perspective"]
	} );

	// 生成CSS样式字符串
	function cssRuleString( cssStyles ) {
		var ruleText = "";
		loopObj( cssStyles, function ( styleName, styleValue ) {
			function addRule( styleName ) {
				ruleText += styleName + ":" + styleValue + ";";
			}

			styleName in nonstandardStyles ? loopArray( nonstandardStyles[styleName], addRule ) : addRule( styleName );
		} );
		return ruleText;
	}

	// 移除CSS值,可以移除一条,或者移除一组
	function removeCss( el, styleName ) {
		function removeStyle( styleName ) {
			function doStyle( styleName ) {
				el.style.removeProperty( styleName );
			}

			styleName in nonstandardStyles ? loopArray( nonstandardStyles[styleName], doStyle ) : doStyle( styleName );
		}

		is.String( styleName ) ? removeStyle( styleName ) : is.Object( styleName ) ? loopObj( styleName, removeStyle ) : loopArray( styleName, removeStyle );
		return el;
	}

	// 添加CSS规则
	var insertCSSRule = function () {
		var userSheet = LinkedList(), systemSheet = LinkedList();
		return function ( ruleText, isSystem ) {
			var styleSheet = isSystem ? systemSheet : userSheet; // 选择样式链表

			// 如果节点尚未创建,创建节点,系统样式表在所有样式表的最前,用户样式表在所有样式表的最后
			if ( styleSheet.el === undefined ) {
				styleSheet.el = document.head.insertBefore( document.createElement( "style" ), isSystem ? document.head.firstChild : null );
			}

			// 创建新规则,位置上最后规则+1
			var lastRule = styleSheet.tail(),
				newRule = styleSheet.insert( LinkedList.Node( lastRule === null ? 0 : lastRule.value + 1 ), null );

			styleSheet.el.sheet.insertRule( ruleText, newRule.value );

			return {
				remove : function () {
					// 后面所有元素的位置-1
					var pos = newRule.value;
					for ( var curNode = newRule.next; curNode !== null; curNode = curNode.next ) {
						curNode.value = pos++;
					}

					// 移除节点并删除规则
					styleSheet.remove( newRule );
					styleSheet.el.sheet.deleteRule( pos );
				}
			};
		}
	}();

	function insertCSSRules( arg1, arg2, arg3 ) {
		function insertRules( selector, styles, isSystem ) {
			var cssText = is.String( styles ) ? styles : cssRuleString( styles );
			insertCSSRule( selector + " {" + cssText + "}", isSystem );
		}

		if ( is.String( arg1 ) ) {
			insertRules( arg1, arg2, arg3 );
		}
		else {
			loopObj( arg1, function ( selector, styles ) {
				insertRules( selector, styles, arg2 );
			} );
		}
	}

	function n( n ) {
		return Math.abs( n ) < 0.01 ? 0 : n;
	}

	css.transform = function () {
		var style = [];
		loopArray( arguments, function ( transform, i ) {
			i !== 0 && style.push( transform );
		} );
		css( arguments[0], "transform", style.join( " " ) );
	};

	css.matrix = function ( m ) {
		return tupleString( "matrix", [n( m[0] ), n( m[1] ), n( m[2] ), n( m[3] ), n( m[4] ), n( m[5] )] );
	};

	css.translate = function ( x, y, z ) {
		return tupleString( "translate3d", [n( x ) + "px", n( y ) + "px", n( z ) + "px"] );
	};

	function Rotate( name ) {
		return function ( val, unit ) {
			return tupleString( name, [n( val ) + ( unit || "rad" )] );
		};
	}

	css.rotateX = Rotate( "rotateX" );
	css.rotateY = Rotate( "rotateY" );
	css.rotateZ = Rotate( "rotateZ" );

	css.scale = function () {
		return "scale(" + Array.prototype.join.call( arguments, "," ) + ")";
	};

	css.px = function ( value ) {
		return value === 0 ? 0 : n( value ) + "px";
	};

	css.s = function ( value ) {
		return value === 0 ? 0 : n( value ) + "s";
	};

	css.url = function ( url ) {
		return "url(" + url + ")";
	};

	// transitionEnd事件
	function onTransitionEnd( el, task ) {
		var handle = bindEvent( el, "webkitTransitionEnd", function () {
			handle.remove();
			task();
		} );
	}

	// 过渡
	function transition( el, transition, style, styleValue, onEnd ) {
		onEnd = is.String( style ) ? onEnd : styleValue;

		if ( ua.android && ua.androidVersion < 3 ) {
			css( el, style, styleValue );
			onEnd && onEnd();
		}
		else {
			css( el, "transition", transition );
			el.transition && el.transition.remove();

			function end() {
				if ( el.transition ) {
					transitionEnd.remove();
					removeEvent.remove();
					removeCss( el, "transition" );
					onEnd && onEnd();
					el.transition = null;
				}
			}

			var removeEvent = bindEvent( el, "DOMNodeRemovedFromDocument", end ),
				transitionEnd = el.transition = bindEvent( el, "webkitTransitionEnd", end );

			setTimeout( function () {
				css( el, style, styleValue );
			}, 20 );
		}
	}

	// endregion

	// region DOM
	// 从文档中移除元素
	function removeNode( node ) {
		node && node.parentNode && node.parentNode.removeChild( node );
	}

	// 创建一个元素的快捷方式
	function element( arg1, arg2, arg3 ) {
		var el, elementArg = {}, parent = arg3;

		// 如果是<div></div>这种形式,直接制作成元素
		if ( arg1.charAt( 0 ) === "<" ) {
			el = document.createElement( "div" );
			el.innerHTML = arg1;
			el = el.firstElementChild;
		}
		// 否则是div.class1.class2#id这种形式
		else {
			var classIdReg = /([.#][^.#]*)/g, classId;
			el = document.createElement( arg1.split( /[#.]/ )[0] );
			while ( classId = classIdReg.exec( arg1 ) ) {
				classId = classId[0];
				classId.charAt( 0 ) === "#" ? el.id = classId.substring( 1 ) : el.classList.add( classId.substring( 1 ) );
			}
		}

		// 参数2是字符串,作为innerHTML
		if ( is.String( arg2 ) ) {
			el.innerHTML = arg2;
		}
		// 是对象的话,每个字段处理
		else if ( is.Object( arg2 ) ) {
			elementArg = arg2;
		}
		// 如果是数组,视为子元素
		else if ( is.Array( arg2 ) ) {
			elementArg.children = arg2;
		}
		// 否则视为父元素
		else {
			parent = arg2;
		}

		elementArg && loopObj( elementArg, function ( key, value ) {
			if ( value !== undefined ) {
				switch ( key ) {
					case "classList":
						if ( is.String( value ) ) {
							el.classList.add( value );
						}
						else if ( is.Array( value ) ) {
							loopArray( value, function ( className ) {
								el.classList.add( className );
							} );
						}
						break;
					case "css":
						css( el, value );
						break;
					case "children":
						if ( is.Array( value ) ) {
							loopArray( value, function ( node ) {
								el.appendChild( node );
							} );
						}
						else {
							el.appendChild( value );
						}
						break;
					default:
						if ( key.substring( 0, 5 ) === "data-" ) {
							el.setAttribute( key, value );
						}
						else {
							el[key] = value;
						}
						break;
				}
			}
		} );

		parent && parent.appendChild( el );
		return el;
	}

	// 根据flag添加或删除class
	function switchClass( el, flag, className ) {
		flag ? el.classList.add( className ) : el.classList.remove( className );
	}

	// 切换状态,将class从fromState切换到toState
	function toggleState( el, fromState, toState ) {
		el.classList.remove( fromState );
		el.classList.add( toState );
	}

	// 沿着一个元素向上冒泡,直到root/document,回调每个节点
	function bubble( el, func, root ) {
		var val;
		while ( el !== null && el !== document && el !== root ) {
			if ( val = func( el ) ) {
				return val;
			}
			el = el.parentNode;
		}
	}

	// 当一个事件冒泡到document时,回调冒泡中的每个节点
	function onBubble( eventName, response ) {
		document.addEventListener( eventName, function ( event ) {
			bubble( event.target, function ( node ) {
				response( node );
			}, document.documentElement );
		}, false );
	}

	// 寻找祖先节点
	function findAncestor( el, func ) {
		return bubble( el, function ( el ) {
			if ( func( el ) ) {
				return el;
			}
		} );
	}

	// 焦点时设置focus类
	browser.onLoad( function () {
		onBubble( "focusin", function ( node ) {
			node.classList.add( "focus" );
		} );
		onBubble( "focusout", function ( node ) {
			node.classList.remove( "focus" );
		} );
	} );
	// endregion

	// region 导出
	// css
	zachModule["2"].removeCss = removeCss;
	zachModule["2"].cssRuleString = cssRuleString;
	zachModule["2"].insertCSSRule = insertCSSRule;
	zachModule["2"].insertCSSRules = insertCSSRules;
	zachModule["2"].onTransitionEnd = onTransitionEnd;
	zachModule["2"].transition = transition;

	// DOM
	zachModule["2"].element = element;
	zachModule["2"].removeNode = removeNode;
	zachModule["2"].toggleState = toggleState;
	zachModule["2"].switchClass = switchClass;
	zachModule["2"].bubble = bubble;
	zachModule["2"].onBubble = onBubble;
	zachModule["2"].findAncestor = findAncestor;

	// 导出
	zachModule["2"].css = css;
	zachModule["2"].toAbsURL = browser.toAbsURL;
	zachModule["2"].bindEvent = bindEvent;
	zachModule["2"].Bind = browser.Bind;
	zachModule["2"].onInsert = browser.onInsert;
	zachModule["2"].requestAnimate = browser.requestAnimate;
	zachModule["2"].ajax = browser.ajax;
	zachModule["2"].onLoad = browser.onLoad;
	// endregion
} );

/**
 * Created by 白 on 2014/11/28.
 */

zachModule( function () {
	// 符号函数
	function sign( x ) {
		return x >= 0 ? 1 : -1;
	}

	// 判断一个点是否在一个矩形之内
	function inRect( tx, ty, x, y, width, height ) {
		tx -= x;
		ty -= y;
		return tx >= 0 && tx < width && ty >= 0 && ty < height;
	}

	// 如果x>b,取b,x小于a,取啊
	function range( x, a, b ) {
		if ( a <= b ) {
			return x < a ? a : x > b ? b : x;
		}
		else {
			return range( x, b, a );
		}
	}

	// 判断是否在区间
	function inRange( x, a, b ) {
		if ( a <= b ) {
			return x >= a && x < b;
		}
		else {
			return inRange( x, b, a );
		}
	}

	// 计算(x,y)到(0,0)的距离
	function distance( x, y ) {
		return Math.sqrt( x * x + y * y );
	}

	// 求两个边的正弦
	function sin2( x, y ) {
		return x / distance( x, y );
	}

	// 生成贝塞尔曲线函数
	function Bezier( x1, y1, x2, y2, func ) {
		var xTolerance = 0.0001,
			retVal = func || function ( xTarget ) {
					function bezier( t, p1, p2 ) {
						var ct = 1 - t, ct2 = ct * ct,
							t2 = t * t, t3 = t2 * t,
							tct2 = t * ct2, t2ct = t2 * ct;
						return 3 * p1 * tct2 + 3 * p2 * t2ct + t3;
					}

					function bezierD( t, p1, p2 ) {
						return ( 9 * p1 - 9 * p2 + 3 ) * t * t + ( 6 * p2 - 12 * p1 ) * t + 3 * p1;
					}

					var t = 0.5;
					while ( Math.abs( xTarget - bezier( t, x1, x2 ) ) > xTolerance ) {
						t = t - ( bezier( t, x1, x2 ) - xTarget ) / bezierD( t, x1, x2 );
					}

					return bezier( t, y1, y2 );
				};

		retVal.arg = [x1, y1, x2, y2];
		return retVal;
	}

	zachModule["3"].sign = sign;
	zachModule["3"].inRect = inRect;
	zachModule["3"].range = range;
	zachModule["3"].inRange = inRange;
	zachModule["3"].distance = distance;
	zachModule["3"].sin2 = sin2;
	zachModule["3"].Bezier = Bezier;
} );

/**
 * Created by 白 on 2014/8/4.
 * 封装经典的指针(鼠标/触摸)交互,诸如拖动等
 */

zachModule( function () {
	var util =zachModule["0"],
		insert = util.insert,
		loopArray = util.loopArray,
		Event = util.Event,

		math =zachModule["3"],

		Browser =zachModule["1"],
		bindEvent = Browser.bindEvent,

		SwipeRadius = 8, // 扫半径
		HMoveRatio = 0.8; // 横向移动比例

	// onPointerDown事件,统一光标事件和触摸事件
	function onPointerDown( area, task, bubble ) {
		function bind( startEventName, moveEventName, endEventName ) {
			return util.request( function ( callback ) {
				return area.onTouchStart || area.onCursorDown ?
					ua.msPointer || !ua.canTouch ? area.onCursorDown( callback ) : area.onTouchDown( callback )
					: bindEvent( area, startEventName, callback, bubble );
			}, function ( event ) {
				var pageX = event.zPageX, pageY = event.zPageY,
					startX = pageX, startY = pageY,
					moveEvent = Event(), upEvent = Event(),

					moveHandle = bindEvent( document, moveEventName, function ( event ) {
						pageX = event.zPageX;
						pageY = event.zPageY;

						event.distanceX = pageX - startX;
						event.distanceY = pageY - startY;

						// 将move事件和end事件的注册指令添加到event中
						event.onMove = moveEvent.regist;
						event.onUp = upEvent.regist;

						moveEvent.trig( event, pageX, pageY );
					} ),

					endHandle = bindEvent( document, endEventName, function ( event ) {
						moveHandle.remove();
						endHandle.remove();
						upEvent.trig( event, pageX, pageY );
					} );

				// 将move事件和end事件的注册指令添加到event中
				event.onMove = moveEvent.regist;
				event.onUp = upEvent.regist;
				task( event, pageX, pageY );
			} );
		}

		return ua.canTouch ? bind( "touchstart", "touchmove", "touchend" ) : bind( "mousedown", "mousemove", "mouseup" );
	}

	function onPointerUp( el, callback, bubble ) {
		return el.tagName ? bindEvent( el, ua.canTouch ? "touchend" : "mouseup", callback, bubble ) :
			ua.msPointer || !ua.canTouch ? el.onCursorUp( callback ) : el.onTouchUp( callback );
	}

	// 一般的senser,判断是否超出圆
	function outCircle( event ) {
		return math.distance( event.distanceX, event.distanceY ) > SwipeRadius;
	}

	// 在判断是否出圆的基础上添加方向判断
	function swipeOut( event, isHorizontal ) {
		return outCircle( event ) ? ( Math.abs( math.sin2( event.distanceY, event.distanceX ) ) >= HMoveRatio ) ^ isHorizontal : undefined;
	}

	// 轻触,在没有移除阈值时,同区域抬起时触发
	function onTap( area, response, sense ) {
		sense = sense || outCircle;
		return onPointerDown( area, function ( event ) {
			var senseFailureHandle = onPointerUp( area, function ( event ) {
					// 在区域上抬起时回调
					response( event );
				} ),

				senseHandle = event.onMove( function ( event ) {
					// 超出sense的话,tap失败
					if ( sense( event ) ) {
						senseHandle.remove();
						senseFailureHandle.remove();
					}
				} );

			event.onUp( function () {
				senseFailureHandle.remove();
			} );

		} );
	}

	// 拖动,阈值判断成功触发
	function onDrag( area, dragStart, sense ) {
		sense = util.defaultValue( sense, function ( event ) {
			return outCircle( event ) || undefined;
		} );

		return onPointerDown( area, function ( event ) {
			var senseHandle = event.onMove( function ( event, pageX, pageY ) {
				var senseValue = !sense || sense( event );
				// 到达阈值之后,回调dragStart
				if ( senseValue !== undefined ) {
					senseHandle.remove();

					if ( !senseValue ) {
						return;
					}

					function Track( initialDistance, lastPos ) {
						var lastDirection = initialDistance === 0 ? undefined : initialDistance > 0, track = [], trackTime = 0,
							lastTime = +new Date(),
							startPos = lastPos;

						return {
							// 去抖动
							test : function ( curPos ) {
								return lastDirection === undefined || !( ( curPos - lastPos ) * ( lastDirection ? 1 : -1 ) < -20 );
							},
							track : function ( curPos ) {
								curPos = curPos || lastPos;

								// 计算目标位置和当前方向
								var curTime = +new Date(),
									duration = curTime - lastTime,
									curDirection = curPos === lastPos ? lastDirection : curPos > lastPos;

								if ( curDirection !== lastDirection || duration > 200 ) {
									// 如果转向或者两次移动时间间隔超过200毫秒,重新计时
									track = [];
									trackTime = 0;
								}
								else {
									// 如果一次移动大于200,清空记录
									if ( duration > 200 ) {
										track = [];
										trackTime = 0;
									}
									else {
										trackTime += duration;

										// 如果记录时间超过300毫秒,移除头部部分记录,使其减少到300毫秒
										while ( trackTime > 300 ) {
											trackTime -= track.shift().duration;
										}

										track.push( {
											duration : duration,
											distance : curPos - lastPos
										} );
									}
								}

								// 更新数据
								lastDirection = curDirection;
								lastPos = curPos;
								lastTime = curTime;
							},
							distance : function () {
								return lastPos - startPos + initialDistance;
							},
							direction : function () {
								return lastDirection;
							},
							speed : function () {
								var totalDiff = 0;
								loopArray( track, function ( unit ) {
									totalDiff += unit.distance;
								} );
								return trackTime === 0 ? 0 : totalDiff / trackTime;
							}
						};
					}

					var startTime = new Date(),
						dragMoveEvent = Event(), // 拖拽移动事件
						dragEndEvent = Event(), // 拖拽停止事件
						trackX = Track( event.distanceX, pageX ),
						trackY = Track( event.distanceY, pageY );

					function dragInfo() {
						return {
							distanceX : trackX.distance(),
							distanceY : trackY.distance(),
							directionX : trackX.direction(),
							directionY : trackY.direction()
						}
					}

					// 拖动开始回调
					dragStart( insert( dragInfo(), {
						onDragEnd : dragEndEvent.regist,
						onDragMove : dragMoveEvent.regist
					} ) );

					event.onMove( function ( event, pageX, pageY ) {
						if ( trackX.test( pageX ) && trackY.test( pageY ) ) {
							trackX.track( pageX );
							trackY.track( pageY );

							dragMoveEvent.trig( dragInfo() );
						}
					} );

					event.onUp( function () {
						trackX.track();
						trackY.track();

						// 触发拖动结束事件
						dragEndEvent.trig( insert( dragInfo(), {
							speedX : trackX.speed(),
							speedY : trackY.speed(),
							duration : +new Date() - startTime
						} ) );
					} );
				}
			} );
		} );
	}

	function DragHV( isHorizontal ) {
		return function ( area, response ) {
			return onDrag( area, response, function ( event ) {
				return swipeOut( event, isHorizontal );
			} );
		}
	}

	zachModule["4"].onPointerDown = onPointerDown;
	zachModule["4"].onPointerUp = onPointerUp;
	zachModule["4"].onTap = onTap;

	zachModule["4"].onDrag = onDrag;

	zachModule["4"].onDragH = DragHV( true );
	zachModule["4"].onDragV = DragHV( false );
} );

/**
 * Created by 白 on 2014/10/14.
 */

zachModule( function () {
	var util =zachModule["0"],
		insert = util.insert,
		loopArray = util.loopArray,
		loopObj = util.loopObj,

		dom =zachModule["2"],
		css = dom.css,
		px = css.px,

		pointer =zachModule["4"],
		onPointerDown = pointer.onPointerDown;

	// region util
	function extract( attr, defaultAttr ) {
		var retVal = {};
		loopObj( defaultAttr, function ( key, val ) {
			retVal[key] = attr[key] === undefined ? val : attr[key];
		} );
		return retVal;
	}

	function KeyValueFunction( registFunc ) {
		return function ( k, v ) {
			if ( util.is.Object( k ) ) {
				loopObj( k, registFunc );
			}
			else {
				registFunc( k, v );
			}
		};
	}

	// 日期转换为字符串
	function dateString( date, format ) {
		function intString( number, digitNumber ) {
			function prefix( number ) {
				var retVal = "";
				util.loop( number, function () {
					retVal += "0";
				} );
				return retVal;
			}

			var str = number + "";
			return digitNumber > str.length ? prefix( digitNumber - str.length ) + str : str;
		}

		date = new Date( date );
		var dict = {
			Y : date.getFullYear() + "",
			M : intString( date.getMonth() + 1, 2 ),
			D : intString( date.getDate(), 2 ),
			h : intString( date.getHours(), 2 ),
			m : intString( date.getMinutes(), 2 ),
			s : intString( date.getSeconds(), 2 )
		};

		var lastChar = "", retVal = "", curChar = "";
		for ( var i = 0, len = format.length; i !== len; ++i ) {
			curChar = format.charAt( i );
			if ( curChar === "%" ) {
				retVal += dict[lastChar] || lastChar;
				lastChar = "";
				continue;
			}
			retVal += lastChar;
			lastChar = curChar;
		}

		return retVal + lastChar;
	}

	// 计算图片cover指定宽高的style
	function getImageCoverStyle( img, dWidth, dHeight, arg ) {
		var dRatio = dWidth / dHeight,
			nWidth = img.naturalWidth || img.width || img.clientWidth,
			nHeight = img.naturalHeight || img.height || img.clientHeight,
			nRatio = nWidth / nHeight,
			style = {
				position : "absolute"
			};

		// 计算居中缩放
		if ( dRatio < nRatio ) {
			style.height = px( dHeight );
			style.left = px( ( dWidth - dHeight / nHeight * nWidth) / 2 << 0 );
			style.top = 0;
			ua.ie && ( style.width = px( dHeight * nRatio ) );
			arg && ( arg.h = dHeight );
		}
		else {
			style.width = px( dWidth );
			style.left = 0;
			style.top = px( ( dHeight - dWidth / nWidth * nHeight ) / 2 << 0 );
			ua.ie && ( style.height = px( dWidth / nRatio ) );
			arg && ( arg.h = dWidth / nRatio );
		}

		return style;
	}

	// 制作滑动列表的红点
	function doRedPoints( slideListPanel, redPointsWrapper ) {
		redPointsWrapper = redPointsWrapper || slideListPanel.querySelector( ".red-point .wrapper" ); // 红点容器
		var redPoints = [], curPoint = null; // 红点和当前红点

		// 创建红点
		util.loop( slideListPanel.length(), function () {
			redPoints.push( dom.element( "span", redPointsWrapper ) );
		} );

		slideListPanel.onCutTo( function ( event ) {
			curPoint && curPoint.classList.remove( "active" );
			curPoint = redPoints[event.curIndex];
			curPoint.classList.add( "active" );
		} );
	}

	// endregion

	// region 地图相关
	var bdMapScript = util.Resource( function ( loadDone ) {
		window.bdmapInit = function () {
			loadDone();
			delete window.bdmapInit;
		};

		// 加载百度地图脚本
		dom.element( "script", {
			src : 'http://api.map.baidu.com/api?type=quick&ak=D5a271a3083d77f21c63ff307e9f60b9&v=1.0&callback=bdmapInit'
		}, document.head );
	} );

	// 百度地图脚本的加载器
	function lbsProcedure( procedure ) {
		return function ( arg ) {
			bdMapScript.load( function () {
				procedure( arg );
			} );
		};
	}

	var markerMap = lbsProcedure( function ( arg ) {
		var oMap = dom.element( "div", {
				css : {
					height : "100%",
					width : "100%"
				}
			}, arg.parent ),
			map = new BMap.Map( oMap ),
			points = [];

		// 拖动地图时不触发抽屉,滚动等触摸效果
		onPointerDown( arg.parent, function ( event ) {
			event.stopPropagation();
		} );

		// 添加覆盖物,点击覆盖物会弹出大厦信息
		loopArray( arg.data, function ( item ) {
			var point = new BMap.Point( parseFloat( item.lng ), parseFloat( item.lat ) ),
				marker = new BMap.Marker( point ),
				markerIcon = new BMap.Icon( staticImgSrc( "layout-map-mark.png" ), new BMap.Size( 30, 30 ) );

			marker.setIcon( markerIcon );
			map.addOverlay( marker );
			points.push( point );

			if ( arg.make ) {
				var infoWindow = new BMap.InfoWindow( arg.make( item ) );
				marker.addEventListener( "click", function () {
					marker.openInfoWindow( infoWindow );
				} );
			}
		} );

		// 初始化地图，设置中心点坐标和地图级别
		if ( points.length !== 0 ) {
			map.centerAndZoom( points[0], 16 );
			map.setViewport( points );
		}
		else {
			map.centerAndZoom( "北京市" );
		}

		arg.onLoad && arg.onLoad();
	} );
	// endregion

	zachModule["5"].extract = extract;
	zachModule["5"].dateString = dateString;
	zachModule["5"].KeyValueFunction = KeyValueFunction;
	zachModule["5"].getImageCoverStyle = getImageCoverStyle;
	zachModule["5"].doRedPoints = doRedPoints;
	zachModule["5"].markerMap = markerMap;
} );

/**
 * Created by 白 on 2014/8/5.
 */

zachModule( function () {
	var math =zachModule["3"],
		Bezier = math.Bezier,

		browser =zachModule["1"],
		requestBrowserAnimate = browser.requestAnimate,

		util =zachModule["0"],

		Timing = {
			linear : Bezier( 1, 1, 1, 1, function ( t ) {
				return t;
			} ),
			ease : Bezier( 0.25, 0.1, 0.25, 1 ),
			easeOut : Bezier( 0, 0, .58, 1 ),
			easeInOut : Bezier( 0.42, 0, 0.58, 1 )
		};

	function fromTo( from, to, ratio ) {
		if ( util.is.Array( from ) ) {
			var retVal = [];
			util.loopArray( from, function ( from, i ) {
				retVal.push( fromTo( from, to[i], ratio ) );
			} );
			return retVal;
		}
		else {
			return from + ( to - from ) * ratio;
		}
	}

	// 进度器
	function Progress( arg ) {
		var duration = ( arg.duration || 1 ) * 1000, // 持续时间,传入的是秒数,转换为毫秒
			timing = arg.timing || Timing.ease, // 缓动函数
			progress = -( arg.delay || 0 ) * 1000, // 动画进度
			lastTime = new Date(); // 上帧时间

		return {
			// 计算当前比例
			ratio : function () {
				var now = new Date();
				progress += now - lastTime; // 更新进度
				lastTime = now;

				return progress < 0 ? null : timing( progress >= duration ? 1 : progress / duration );
			},
			// 判断进度是否结束
			isEnd : function () {
				return progress >= duration;
			},
			// 快进到目标比例
			progress : function ( targetRatio ) {
				progress = targetRatio * duration;
				lastTime = new Date()
			}
		};
	}

	function animate( arg, requestAnimate ) {
		var progress = Progress( arg ),
			isFirst = true,
			start = arg.start || 0, end = arg.end || 1;

		function go( ratio ) {
			if ( ratio !== null ) {
				if ( isFirst ) {
					arg.onStart && arg.onStart();
					isFirst = false;
				}

				arg.onAnimate( fromTo( start, end, ratio ) );

				if ( progress.isEnd() ) {
					arg.onEnd && arg.onEnd();
					animateEvent.remove();
				}
			}
		}

		go( 0 );
		var animateEvent = ( requestAnimate || requestBrowserAnimate )( function () {
			go( progress.ratio() );
		} );

		return {
			remove : animateEvent.remove,
			progress : progress.progress
		};
	}

	animate.Bezier = Bezier;
	animate.Timing = Timing;
	animate.Progress = Progress;
	animate.animate = animate;
	animate.fromTo = fromTo;
	zachModule["6"] = animate;
} );

/**
 * Created by 白 on 2014/12/12.
 */

zachModule( function () {
	var util =zachModule["0"],
		loopArray = util.loopArray,
		loop = util.loop;

	zachModule["7"] = {
		// 从数组中移除项
		remove : function ( arr, removeItem ) {
			var retVal = [];
			loopArray( arr, function ( item ) {
				item != removeItem && retVal.push( item );
			} );
			return retVal;
		},

		// 逆转数组
		reverse : function ( arr ) {
			var len = arr.length - 1,
				retVal = len === -1 ? [] : new Array( len );

			loopArray( arr, function ( item, i ) {
				retVal[len - i] = item;
			} );

			return retVal;
		},

		// 缝合多个数组
		zip : function ( arr ) {
			var retVal = [];
			loop( arr[0].length, function ( i ) {
				loopArray( arr, function ( list ) {
					retVal.push( list[i] );
				} );
			} );
			return retVal;
		},

		// 遍历区间
		loopSection : function ( arr, block ) {
			var previous = null;
			loopArray( arr, function ( value ) {
				previous && block( previous, value );
				previous = value;
			} );
			block( previous, null );
		}
	};
} );

/**
 * Created by 白 on 2014/8/4.
 */

zachModule( function () {
	var array =zachModule["7"];

	function w( img ) {
		return img.naturalWidth || img.width || img.clientWidth;
	}

	function h( img ) {
		return img.naturalHeight || img.height || img.clientHeight;
	}

	function cover( img, dWidth, dHeight ) {
		var nWidth = w( img ), nHeight = h( img );
		return dWidth / dHeight < nWidth / nHeight ? dHeight / nHeight : dWidth / nWidth;
	}

	function contain( img, dWidth, dHeight ) {
		var nWidth = w( img ), nHeight = h( img );
		return dWidth / dHeight < nWidth / nHeight ? dWidth / nWidth : dHeight / nHeight;
	}

	function layImageByFrame( img, arg ) {
		var dW = arg.width, dH = arg.height, align = arg.align,
			ratio = arg.size( img, arg.width, arg.height );

		ratio = arg.noStretch ? Math.min( ratio, 1 ) : ratio; // 如果不能拉伸,那么比例最大是1

		function clip( dSize, size, align ) {
			var offset = ( dSize - size * ratio ) * align;
			return offset > 0 ? [0, size, offset, size * ratio] : [-offset / ratio, dSize / ratio, 0, dSize];
		}

		var retVal = [img].concat( array.zip( [clip( dW, w( img ), align[0] ), clip( dH, h( img ), align[1] )] ) );
		retVal.ratio = ratio;

		return retVal;
	}

	function drawImageLayout( gc, l ) {
		var image = l[0],
			tRatio = l.ratio,
			nW = image.naturalWidth, nH = image.naturalHeight,
			sX = l[1], sY = l[2],
			sW = l[3], sH = l[4],
			tX = l[5], tY = l[6],
			tW = l[7], tH = l[8];

		if ( ua.ios ) {
			var ratio = 1 - sW * sH / nW / nH;
			if ( ratio < 0.02 ) {
				gc.drawImage( image, tX, tY, tW, tH );
			}
			else if ( ratio < 0.05 || tW * tH < 6500 ) {
				gc.save();
				gc.beginPath();
				gc.rect( tX, tY, tW, tH );
				gc.clip();
				gc.drawImage( image, -sX / sW * tW, -sY / sH * tH, nW * tRatio, nH * tRatio );
				gc.restore();
			}
			else {
				gc.drawImage.apply( gc, l );
			}
		}
		else {
			gc.drawImage.apply( gc, l );
		}
	}

	zachModule["8"].drawImageLayout = drawImageLayout;
	zachModule["8"].layImageByFrame = layImageByFrame;
	zachModule["8"].Size = {
		contain : contain,
		cover : cover
	};
} );

/**
 * Created by Zuobai on 2014/11/22.
 * 封装经典的2d变换
 */

zachModule( function () {
	var matrix = {
		translate : function ( x, y ) {
			return [1, 0, 0, 1, x, y];
		},
		scale : function ( sx, sy ) {
			return [sx, 0, 0, sy, 0, 0];
		},
		rotate : function ( a ) {
			var sin = Math.sin( a ), cos = Math.cos( a );
			return [cos, sin, -sin, cos, 0, 0];
		}
	};

	function isTransformEqual( lhs, rhs ) {
		return lhs[0] === rhs[0] && lhs[1] === rhs[1] && lhs[2] === rhs[2] &&
			lhs[3] === rhs[3] && lhs[4] === rhs[4] && lhs[5] === rhs[5];
	}

	function inverse( m ) {
		var det = m[0] * m[3] - m[1] * m[2];
		return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
	}

	function transform( m, p ) {
		return [m[0] * p[0] + m[2] * p[1] + m[4] * p[2], m[1] * p[0] + m[3] * p[1] + m[5] * p[2], p[2]];
	}

	function combine( m, n ) {
		return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
	}

	function transformOrigin( transformation, x, y ) {
		return combine( combine( matrix.translate( x, y ), transformation ), matrix.translate( -x, -y ) );
	}

	zachModule["9"].isTransformEqual = isTransformEqual;
	zachModule["9"].matrix = matrix;
	zachModule["9"].inverse = inverse;
	zachModule["9"].transform = transform;
	zachModule["9"].combine = combine;
	zachModule["9"].transformOrigin = transformOrigin;
} );

/**
 * Created by Zuobai on 2014/7/12.
 * zachCanvas 2d GUI系统
 */

zachModule( function () {
	// 引入
	var util =zachModule["0"],
		insert = util.insert,
		loopArray = util.loopArray,
		Event = util.Event,
		recursion = util.recursion,

		transform2d =zachModule["9"],
		matrix = transform2d.matrix,
		combine = transform2d.combine,
		transform = transform2d.transform,
		inverse = transform2d.inverse,

		browser =zachModule["1"],
		Bind = browser.Bind,
		requestAnimate = browser.requestAnimate,
		css = browser.css,

		onMouseOver = Bind( ua.msPointer ? "MSPointerOver" : "mouseover" ),
		onMouseOut = Bind( ua.msPointer ? "MSPointerOut" : "mouseout" ),
		onMouseDown = Bind( ua.msPointer ? "MSPointerDown" : "mousedown" ),
		onMouseUp = Bind( ua.msPointer ? "MSPointerUp" : "mouseup" ),
		onMouseMove = Bind( ua.msPointer ? "MSPointerMove" : "mousemove" ),
		onTouchStart = Bind( "touchstart" ),
		onTouchEnd = Bind( "touchend" ),
		onTouchMove = Bind( "touchmove" ),

		areaCount = 0;

	// 强化版gc
	function Context2D( gc ) {
		var prepare = [1, 0, 0, 1, 0, 0],
			cur = [1, 0, 0, 1, 0, 0],
			transformStack = [];

		// 设置矩阵
		function s() {
			var r = combine( prepare, cur );
			gc.setTransform( r[0], r[1], r[2], r[3], r[4], r[5] );
		}

		// 在当前基础上进行转换
		function t( m ) {
			cur = combine( cur, m );
			s();
		}

		// 几个经典转换
		function ClassicTransform( genFunc ) {
			return function () {
				t( genFunc.apply( null, arguments ) );
			}
		}

		return insert( gc, {
			// 该方法用于设置一个预矩阵,解决dpr变换
			setPrepareTransform : function ( m ) {
				prepare = m;
				s();
			},
			transform : t,
			getTransform : function () {
				return [cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]];
			},
			save : function () {
				CanvasRenderingContext2D.prototype.save.call( gc );
				transformStack.push( cur );
			},
			restore : function () {
				CanvasRenderingContext2D.prototype.restore.call( gc );
				cur = transformStack.pop();
				s();
			},
			translate : ClassicTransform( matrix.translate ),
			rotate : ClassicTransform( matrix.rotate ),
			scale : ClassicTransform( matrix.scale )
		} );
	}

	function Layer() {
		var layer = css( document.createElement( "canvas" ), "display", "block" ),
			gc = Context2D( layer.getContext( "2d" ) ),
			dpr = 1;

		// dpr属性
		util.defineAutoProperty( layer, "dpr", {
			value : ( window.devicePixelRatio || 1 ) / ( gc.webkitBackingStorePixelRatio || gc.mozBackingStorePixelRatio ||
			gc.msBackingStorePixelRatio || gc.oBackingStorePixelRatio || gc.backingStorePixelRatio || 1 ),
			set : function ( val ) {
				gc.dpr = dpr = val;
				gc.setPrepareTransform( matrix.scale( val, val ) );
			}
		} );

		return insert( layer, {
			isDirty : true,
			clear : true,
			// 在层上进行绘制
			draw : function ( drawFunc ) {
				layer.clear && gc.clearRect( 0, 0, layer.width, layer.height );
				gc.layer = layer;
				gc.save();
				drawFunc( gc );
				gc.restore();
			},
			// 调整大小
			resize : function ( width, height ) {
				layer.width = width * layer.dpr;
				layer.height = height * layer.dpr;
				css.size( layer, layer.logicalWidth = width, layer.logicalHeight = height );
				layer.dpr = dpr;
			},
			// 将该层绘制到父层上,记录该层到复层的变换以及parent关系
			drawTo : function ( parentGC ) {
				layer.parentLayer = parentGC.layer;
				layer.transformation = parentGC.getTransform();
				parentGC.drawImage( layer, 0, 0, layer.width, layer.height );
			},
			// 置脏位
			dirty : function () {
				layer.isDirty = true;
				layer.parentLayer && layer.parentLayer.dirty();
			}
		} );
	}

	// Area
	function Area() {
		var draw = null,
			area = {
				id : areaCount++,
				areaFromPoint : null,
				dirty : function () {
					area.parentLayer && area.parentLayer.dirty();
				}
			};

		// draw方法
		Object.defineProperty( area, "draw", {
			set : function ( val ) {
				draw = val;
			},
			get : function () {
				return function ( gc ) {
					gc.getTransform && ( area.transformation = gc.getTransform() );
					area.parentLayer = gc.layer;
					draw( gc );
				}
			}
		} );

		// 添加事件
		loopArray( ["cursorDown", "cursorUp", "cursorMove", "cursorEnter", "cursorLeave",
			"touchDown", "touchMove", "touchUp", "touchEnter", "touchLeave"], function ( eventName ) {
			var event = Event();
			area[eventName] = event.trig;
			area["on" + eventName.replace( /./, function ( c ) {
				return c.toUpperCase();
			} )] = event.regist;
		} );

		return area;
	}

	// 将一个点由page坐标系,转换到area的坐标系
	function coordinatePageToArea( area, p ) {
		return area && area.transformation ? transform( inverse( area.transformation ), coordinatePageToArea( area.parentLayer, p ) ) : p;
	}

	// 将一个点由area坐标系,转换到page坐标系
	function coordinateAreaToPage( area, p ) {
		return area && area.transformation ? coordinateAreaToPage( area.parentLayer, transform( area.transformation, p ) ) : p;
	}

	function Canvas() {
		var canvas = Layer(),
			cursorSystem, touchSystem,
			hasDraw = false, // 第一次绘制,第一次绘制前不会触发光标事件
			animateEvent = Event(); // 动画事件

		// 点事件系统
		function PointEventSystem( systemName, stateName, bindMove, bindDown, bindUp, onDown ) {
			var cursorX = 0, cursorY = 0,
				isIn = false, hoverList = [],
				lastStateName = "last" + stateName, curStateName = "is" + stateName;

			function getHoverList() {
				hoverList = [];

				recursion( function getArea( area ) {
					if ( area ) {
						hoverList.push( area );
						loopArray( area.areaFromPoint ? [].concat( area.areaFromPoint.apply( null, coordinatePageToArea( area, [cursorX, cursorY, 1] ) ) ) : [], getArea );
					}
				}, canvas.root );

				hoverList.reverse();
			}

			// 触发光标移动
			function cursorMove( event, targetHoverList ) {
				if ( !hasDraw ) {
					return;
				}

				// 更新hoverList
				var oldHoverList = hoverList;
				loopArray( oldHoverList, function ( area ) {
					area[lastStateName] = area[curStateName] || false;
					area[curStateName] = false;
				} );

				targetHoverList ? ( hoverList = targetHoverList ) : getHoverList();

				// 计算move和enter
				loopArray( hoverList, function ( area ) {
					area[curStateName] = true;
					trigEvent( area, systemName + "Move", event );

					if ( !area[lastStateName] ) {
						trigEvent( area, systemName + "Enter", event );
					}
				} );

				// 计算leave
				loopArray( oldHoverList, function ( area ) {
					if ( !area[curStateName] ) {
						trigEvent( area, systemName + "Leave", event );
					}
					delete area[lastStateName];
				} );
			}

			// 触发事件
			function trigEvent( area, eventName, event ) {
				area[eventName] && area[eventName]( event, cursorX, cursorY );
			}

			bindMove( canvas, cursorMove );

			// down事件,在触发时同时给出该次down事件的move事件和up事件
			bindDown( canvas, function ( event ) {
				onDown && onDown( event );
				event.preventDefault();

				loopArray( hoverList, function ( area ) {
					trigEvent( area, systemName + "Down", event );
				} );
			} );

			bindUp( canvas, function ( event ) {
				loopArray( hoverList, function ( area ) {
					trigEvent( area, systemName + "Up", event );
				} );
			} );

			return {
				focus : function () {
					isIn = true;
				},
				blur : function () {
					isIn = false;
					cursorMove( event, [] );
				},
				move : function ( x, y ) {
					cursorX = x;
					cursorY = y;
				},
				calculate : function () {
					isIn && cursorMove( {} );
				}
			};
		}

		// 光标系统
		cursorSystem = PointEventSystem( "cursor", "Hover", onMouseMove, onMouseDown, onMouseUp );
		onMouseMove( document, function ( event ) {
			cursorSystem.move( event.pageX, event.pageY );
		}, true );
		onMouseOver( canvas, cursorSystem.focus );
		onMouseOut( canvas, cursorSystem.blur );

		if ( !ua.msPointer ) {
			// 触摸系统
			touchSystem = PointEventSystem( "touch", "Touch", onTouchMove, onTouchStart, onTouchEnd, function ( event ) {
				touchSystem.focus();
				touchSystem.move( event.zPageX, event.zPageY );
				touchSystem.calculate();
			} );
			onTouchMove( document, function ( event ) {
				touchSystem.move( event.zPageX, event.zPageY );
			}, true );
			onTouchEnd( document, touchSystem.blur );
		}

		// 重绘激励
		requestAnimate( function () {
			// 触发动画回调
			animateEvent.trig();

			if ( canvas.isDirty ) {
				canvas.isDirty = false;
				hasDraw = true;

				// 如果有根区域,绘制它
				canvas.root && canvas.draw( canvas.root.draw );

				// 更新光标系统
				cursorSystem.calculate();
				touchSystem && touchSystem.calculate();
			}
		} );

		// 如果改变了位置,重新计算canvas在页面上的位置
		function alter() {
			canvas.transformation = matrix.translate( canvas.pageLeft, canvas.pageTop );
		}

		// 插入时计算位置
		browser.onInsert( canvas, alter );

		return insert( canvas, {
			root : null,
			alter : alter,
			requestAnimate : animateEvent.regist
		} );
	}

	Canvas.Context2D = Context2D;
	Canvas.Layer = Layer;
	Canvas.Area = Area;
	Canvas.coordinatePageToArea = coordinatePageToArea;
	Canvas.coordinateAreaToPage = coordinateAreaToPage;

	zachModule["10"] = Canvas;
} );

/**
 * Created by 白 on 2014/11/19.
 * 经典的滑动面板
 */

zachModule( function () {
	var util =zachModule["0"],
		insert = util.insert,
		extend = util.extend,
		Event = util.Event,
		loop = util.loop,
		loopArray = util.loopArray,

		math =zachModule["3"],
		range = math.range,

		DOM =zachModule["2"],
		css = DOM.css,
		px = css.px,

		animate =zachModule["6"],
		pointer =zachModule["4"];

	function translate( el, left, top ) {
		css( el, "transform", css.translate( el.zLeft = left, el.zTop = top, 0 ) );
	}

	function SlideListPanel( parent, arg ) {
		if ( !SlideListPanel.hasCall ) {
			DOM.insertCSSRules( {
				".z-slide-list-panel" : {
					overflow : "hidden",
					position : "relative"
				},
				".z-slide-list-panel > ul" : {
					height : "100%",
					overflow : "hidden"
				},
				".z-slide-list-panel > ul > li" : {
					height : "100%",
					"float" : "left",
					"min-height" : "1px"
				}
			}, true );
			SlideListPanel.hasCall = true;
		}

		parent.classList.add( "z-slide-list-panel" );

		arg = extend( {
			width : 1,
			cycle : false,
			slideRatio : 1,
			margin : 0
		}, arg || {} );

		var ul = parent.querySelector( "ul" ), items = [],
			isCycle = arg.cycle, slideRatio = arg.slideRatio, margin = arg.margin,
			slideDistance = arg.width + margin,
			disabled = false,

			cutToEvent = Event(),
			animateStartEvent = Event(),
			slideStartEvent = Event(),

			parentWidth, itemWidth, marginWidth, maxItems,

			curCenterIndex = 0,
			inAnimate = false;

		DOM.onInsert( parent, function () {
			parentWidth = parent.offsetWidth;
			itemWidth = parentWidth * arg.width;
			marginWidth = parentWidth * margin;

			// 根据宽度计算最大项数
			maxItems = function () {
				var start = 1;
				while ( arg.width * start + margin * (start - 2) < 1 ) {
					start += 2;
				}
				return start + slideRatio * 2;
			}();

			css( ul, {
				width : px( maxItems * itemWidth + ( margin > 0 ? marginWidth * maxItems : 0 ) ),
				"margin-left" : px( -( maxItems * arg.width - 1 ) / 2 * parentWidth )
			} );
		} );

		if ( ua.win32 ) {
			pointer.onPointerDown( parent, function ( event ) {
				event.preventDefault();
			} );
		}

		// 将ul的子节点添加到items中,并移除它们
		loopArray( ul.children, function ( li ) {
			items.push( li );
		} );
		ul.innerHTML = "";

		function getIndex( index ) {
			return isCycle ? ( index + items.length ) % items.length : index;
		}

		function slideLi( li, isFirst ) {
			css( li, "width", px( itemWidth ) );
			margin && css( li, "margin", "0 " + px( marginWidth / 2 ) );
			isFirst && margin && css( li, px( "margin-left", -marginWidth * ( maxItems - 1 ) / 2 ) );
			return li;
		}

		// 调整元素
		function adjust() {
			var lay = arg.lay,
				centerDiff = -Math.floor( ( ul.zLeft + itemWidth / 2 ) / itemWidth );

			arg.lay && loopArray( ul.children, function ( li, i ) {
				var centerI = ( i - ( maxItems - 1 ) / 2 );

				!li.zEmpty && lay( li, {
					index : centerI - centerDiff,
					offset : centerI * ( itemWidth + marginWidth ) + ul.zLeft,
					width : itemWidth
				} );
			} );
		}

		// 将centerIndex为中心,摆放元素
		function lay( centerIndex ) {
			ul.innerHTML = "";

			function emptyLi() {
				var li = document.createElement( "li" );
				li.zEmpty = true;
				return li;
			}

			translate( ul, 0, 0 );
			loop( maxItems, function ( i ) {
				var targetIndex = i - (maxItems - 1) / 2 + centerIndex,
					li = isCycle && items.length <= 2 ? i === 1 ? items[centerIndex] : emptyLi() :
					items[getIndex( targetIndex )] || emptyLi();
				ul.appendChild( slideLi( li, i === 0 ) );
			} );
			adjust();
			curCenterIndex = centerIndex;

			cutToEvent.trig( {
				curIndex : centerIndex
			} );
		}

		function doWhenItem2( targetPos ) {
			// 取出副项和两个空项,showBlankLi是要显示的,hiddenBlankLi是未显示的
			var subLi = items[getIndex( curCenterIndex + 1 )],
				showBlankLi = ul.children[targetPos > 0 ? 0 : 2],
				hiddenBlankLi = ul.children[targetPos < 0 ? 0 : 2];

			// 如果要显示的不是副项,替换为副项
			if ( showBlankLi !== subLi ) {
				ul.replaceChild( slideLi( document.createElement( "li" ) ), hiddenBlankLi );
				ul.replaceChild( slideLi( subLi ), showBlankLi );
			}
		}

		function cutTo( step ) {
			if ( items.length === 1 ) {
				return;
			}

			var endIndex = range( getIndex( curCenterIndex + step ), 0, items.length - 1 );

			inAnimate = true;
			animateStartEvent.trig( {
				curIndex : curCenterIndex,
				targetIndex : endIndex
			} );

			if ( isCycle && items.length === 2 ) {
				doWhenItem2( -step );
			}

			function endAnimate() {
				lay( endIndex );
				inAnimate = false;
			}

			if ( arg.lay ) {
				animate( {
					start : ul.zLeft,
					end : ( curCenterIndex - endIndex ) * ( itemWidth + marginWidth ),
					onAnimate : function ( pos ) {
						translate( ul, pos << 0, 0 );
						adjust( itemWidth );
					},
					onEnd : endAnimate,
					duration : 0.2
				} );
			}
			else {
				DOM.transition( ul, "0.2s", {
					transform : css.translate( ( isCycle ? -step : ( curCenterIndex - endIndex ) ) * ( 1 + margin ) * itemWidth, 0, 0 )
				}, endAnimate );
			}
		}

		pointer.onDragH( ul, function ( event ) {
			if ( disabled || inAnimate || ( isCycle && items.length === 1 ) ) {
				return;
			}

			slideStartEvent.trig( {
				curIndex : curCenterIndex
			} );

			event.onDragMove( function ( event ) {
				var targetPos = event.distanceX,
					length = items.length;

				if ( !isCycle && ( ( curCenterIndex === 0 && targetPos > 0 ) || ( curCenterIndex === length - 1 && targetPos < 0 ) ) ) {
					targetPos = Math.atan( targetPos / parentWidth / 2 ) * parentWidth * arg.width / 2;
				}
				// 当列表循环,并且只有两项的时候,往左滑时,副项在右,往右滑时,副项在左
				else if ( isCycle && length === 2 ) {
					doWhenItem2( targetPos );
				}

				translate( ul, range( targetPos, -parentWidth + 2, parentWidth - 2 ) * slideDistance, 0 );
				adjust();
			} );

			event.onDragEnd( function ( event ) {
				// 计算移动多少项
				var direction = event.directionX ? 1 : -1,
					step = event.duration < 200 ? -direction : -direction * ( Math.abs( ul.zLeft / parentWidth + direction * 0.3 ) > 0.5 ? 1 : 0 );

				// 触发动画
				cutTo( step );
			} );
		} );

		return insert( parent, {
			item : function ( index ) {
				return items[index];
			},
			disable : function ( val ) {
				disabled = val;
			},
			length : function () {
				return items.length;
			},
			addItem : function ( li ) {
				items.push( li );
			},
			clear : function () {
				curCenterIndex = 0;
				items = [];
			},
			curIndex : function () {
				return curCenterIndex;
			},
			display : lay,
			cutTo : function ( index ) {
				cutTo( index - curCenterIndex );
			},
			cutRight : function ( index ) {
				cutTo( index || 1 );
			},
			onCutTo : cutToEvent.regist,
			onSlideStart : slideStartEvent.regist,
			onAnimateStart : animateStartEvent.regist
		} );
	}

	zachModule["11"] = SlideListPanel;
} );


/**
 * 	author: Hu Jianqing [huhuh1234567@126.com]
 * 	c++ ver. date: Sept., 2012
 * 	js ver. date: Oct., 2013
 * 	intro: base on book 'real-time rendering'
 * 	license: open
 */

zachModule( function () {

	var matrix = {};
	var geometry = {};

	function MatrixFromRows(vs){
		return [
			vs[0][0], vs[0][1], vs[0][2], vs[0][3],
			vs[1][0], vs[1][1], vs[1][2], vs[1][3],
			vs[2][0], vs[2][1], vs[2][2], vs[2][3],
			vs[3][0], vs[3][1], vs[3][2], vs[3][3]
		];
	}

	function MatrixFromColumns(vs){
		return [
			vs[0][0], vs[1][0], vs[2][0], vs[3][0],
			vs[0][1], vs[1][1], vs[2][1], vs[3][1],
			vs[0][2], vs[1][2], vs[2][2], vs[3][2],
			vs[0][3], vs[1][3], vs[2][3], vs[3][3]
		];
	}

	function VectorFromRow(m,i){
		var base = i*4;
		return [
			m[base],
			m[base+1],
			m[base+2],
			m[base+3]
		];
	}

	function VectorFromColumn(m,i){
		return [
			m[i],
			m[i+4],
			m[i+8],
			m[i+12]
		];
	}

	function dot(vl,vr){
		return vl[0]*vr[0]+vl[1]*vr[1]+vl[2]*vr[2]+vl[3]*vr[3];
	}

	function cross(vl,vr){
		return [
			vl[1]*vr[2]-vl[2]*vr[1],
			vl[2]*vr[0]-vl[0]*vr[2],
			vl[0]*vr[1]-vl[1]*vr[0],
			0.0
		];
	}

	function uniform(v){
		var length = 1/Math.sqrt(dot(v,v));
		return [
			v[0]*length,
			v[1]*length,
			v[2]*length,
			v[3]*length
		];
	}

	function transform(m,v){
		return [
			dot(VectorFromRow(m,0),v),
			dot(VectorFromRow(m,1),v),
			dot(VectorFromRow(m,2),v),
			dot(VectorFromRow(m,3),v)
		];
	}

	function combine(m,n){
		return MatrixFromColumns([
			transform(m,VectorFromColumn(n,0)),
			transform(m,VectorFromColumn(n,1)),
			transform(m,VectorFromColumn(n,2)),
			transform(m,VectorFromColumn(n,3))
		]);
	}

	function transpose(m){
		return [
			m[0], m[4], m[8], m[12],
			m[1], m[5], m[9], m[13],
			m[2], m[6], m[10], m[14],
			m[3], m[7], m[11], m[15]
		];
	}

	function inverse(m){
		var D_12_12 = m[5]*m[10]-m[6]*m[9];
		var D_12_02 = m[4]*m[10]-m[6]*m[8];
		var D_12_01 = m[4]*m[9]-m[5]*m[8];
		var D_02_12 = m[1]*m[10]-m[2]*m[9];
		var D_02_02 = m[0]*m[10]-m[2]*m[8];
		var D_02_01 = m[0]*m[9]-m[1]*m[8];
		var D_01_12 = m[1]*m[6]-m[2]*m[5];
		var D_01_02 = m[0]*m[6]-m[2]*m[4];
		var D_01_01 = m[0]*m[5]-m[1]*m[4];
		var D_12_23 = m[6]*m[11]-m[7]*m[10];
		var D_12_13 = m[5]*m[11]-m[7]*m[9];
		var D_12_03 = m[4]*m[11]-m[7]*m[8];
		var M = 1/(m[0]*D_12_12-m[1]*D_12_02+m[2]*D_12_01);
		var M12 = -m[1]*D_12_23+m[2]*D_12_13-m[3]*D_12_12;
		var M13 = m[0]*D_12_23-m[2]*D_12_03+m[3]*D_12_02;
		var M14 = -m[0]*D_12_13+m[1]*D_12_03-m[3]*D_12_01;
		return [
			 D_12_12*M,	-D_02_12*M,	 D_01_12*M,	M12*M,
			-D_12_02*M,	 D_02_02*M,	-D_01_02*M,	M13*M,
			 D_12_01*M,	-D_02_01*M,	 D_01_01*M,	M14*M,
			0,			0,			0,			1
		];
	}

	matrix.unit = function(){
		return [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	};

	matrix.translate = function(x,y,z){
		return [
			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1
		];
	};

	matrix.scale = function(x, y, z) {
		return [
			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1
		];
	};

	matrix.rotateX = function(a) {
		var sa = Math.sin(a);
		var ca = Math.cos(a);
		return [
			1, 0, 0, 0,
			0, ca, -sa, 0,
			0, sa, ca, 0,
			0, 0, 0, 1
		];
	};

	matrix.rotateY = function(a) {
		var sa = Math.sin(a);
		var ca = Math.cos(a);
		return [
			ca, 0, sa, 0,
			0, 1, 0, 0,
			-sa, 0, ca, 0,
			0, 0, 0, 1
		];
	};

	matrix.rotateZ = function(a) {
		var sa = Math.sin(a);
		var ca = Math.cos(a);
		return [
			ca, -sa, 0, 0,
			sa, ca, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	};

	matrix.rotateBase = function(ex, ey, ez) {
		return MatrixFromRows([
			ex,
			ey,
			ez,
			[0, 0, 0, 1]
		]);
	};

	matrix.lookAt = function(eye, center, top) {
		var ez = uniform([eye[0]-center[0], eye[1]-center[1], eye[2]-center[2], 0.0]);
		var ex = uniform(cross(top, ez));
		var ey = uniform(cross(ez, ex));
		return combine(matrix.rotateBase(ex, ey, ez), matrix.translate(-eye[0],-eye[1],-eye[2]));
	};

	matrix.perspectiveProject = function(w, h, n, f) {
		return [
			2.0*n/w, 0, 0, 0,
			0, 2.0*n/h, 0, 0,
			0, 0, -(f+n)/(f-n), -2.0*f*n/(f-n),
			0, 0, -1, 0
		];
	};

	/*
		      z
		      ^
		      |
		    .-|-.---0
		   /  |/   /|
		  .---3---. .
		 /   /   /|/|
		.---.---. 1------>x
		|   |   |/|/
		.---6---. .
		|   |   |/
		4---.---.
	 */
	geometry.crystal = function() {
		return {
			vertex: [
				//0523
				1.0, 1.0, 1.0,
				-1.0, 0.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 0.0, 1.0,
				//0631
				1.0, 1.0, 1.0,
				0.0, -1.0, 0.0,
				0.0, 0.0, 1.0,
				1.0, 0.0, 0.0,
				//0712
				1.0, 1.0, 1.0,
				0.0, 0.0, -1.0,
				1.0, 0.0, 0.0,
				0.0, 1.0, 0.0,
				//1467
				1.0, 0.0, 0.0,
				-1.0, -1.0, -1.0,
				0.0, -1.0, 0.0,
				0.0, 0.0, -1.0,
				//2475
				0.0, 1.0, 0.0,
				-1.0, -1.0, -1.0,
				0.0, 0.0, -1.0,
				-1.0, 0.0, 0.0,
				//3456
				0.0, 0.0, 1.0
				-1.0, -1.0, -1.0,
				-1.0, 0.0, 0.0,
				0.0, -1.0, 0.0,
			],
			index: [
				//023,532(+0)
				0, 2, 3,
				1, 3, 2,
				//031,613(+4)
				4, 6, 7,
				5, 7, 6,
				//012,721(+8)
				8, 10, 11,
				9, 11, 10,
				//167,476(+12)
				12, 14, 15,
				13, 15, 14,
				//275,457(+16)
				16, 18, 19,
				17, 19, 18,
				//356,465(+20)
				20, 22, 23,
				21, 23, 22
			],
			uv: [
				//0523
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
				//0631
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
				//0712
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
				//1467
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
				//2475
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
				//3456
				0.5, 0.0,
				0.5, 1.0,
				0.0, 0.5,
				1.0, 0.5,
			]
		};
	};

	/*
		  y
		  ^
		  |
		  2
		 / \
		0   1---->x
		 \ /
		  3
	 */
	geometry.diamond = function(){
		return {
			vertex: [
				-1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,
				0.0, 1.73, 0.0,
				0.0, -1.73, 0.0
			],
			index: [
				2, 0, 1,
				1, 0, 3
			],
			uv: [
				0.0, 0.5,
				1.0, 0.5,
				0.5, 0.0,
				0.5, 1.0
			]
		};
	};

	/*
		    y
		    ^
		    |
		0---.---1
		|   |   |
		.---.---.---->x
		|   |   |
		2---.---3
	 */
	geometry.square = function(){
		return {
			vertex: [
				-1.0, 1.0, 0.0,
				1.0, 1.0, 0.0,
				-1.0, -1.0, 0.0,
				1.0, -1.0, 0.0
			],
			index: [
				0, 2, 1,
				1, 2, 3
			],
			uv: [
				0.0, 0.0,
				1.0, 0.0,
				0.0, 1.0,
				1.0, 1.0
			]
		}
	};

	zachModule["12"].MatrixFromRows = MatrixFromRows;
	zachModule["12"].MatrixFromColumns = MatrixFromColumns;
	zachModule["12"].VectorFromRow = VectorFromRow;
	zachModule["12"].VectorFromColumn = VectorFromColumn;

	zachModule["12"].dot = dot;
	zachModule["12"].cross = cross;
	zachModule["12"].uniform = uniform;
	zachModule["12"].transform = transform;
	zachModule["12"].combine = combine;
	zachModule["12"].transpose = transpose;
	zachModule["12"].inverse = inverse;

	zachModule["12"].matrix = matrix;
	zachModule["12"].geometry = geometry;

});

/**
 * Created by Zuobai on 2014/11/22.
 */

zachModule( function () {
	var util =zachModule["0"],
		is = util.is,
		LinkedList = util.LinkedList;

	LinkedList.loopNodes = function ( begin, arg2, arg3, arg4 ) {
		var end, block, reverse, cur, retVal;
		if ( is.Function( arg2 ) ) {
			end = null;
			block = arg2;
			reverse = arg3;
		}
		else {
			end = arg2;
			block = arg3;
			reverse = arg4;
		}

		for ( cur = begin; cur !== end; cur = reverse ? cur.previous : cur.next ) {
			if ( ( retVal = block( cur.value, cur ) ) !== undefined ) {
				return retVal;
			}
		}
	};

	LinkedList.loopSection = function ( list, block ) {
		var start = list.head(), startValue = start.value;
		LinkedList.loopNodes( start.next, function ( value ) {
			block( startValue, value );
			startValue = value;
		} );
		block( startValue, null );
	};

	LinkedList.toArray = function ( list ) {
		var arr = [];
		LinkedList.loop( list, function ( value ) {
			arr.push( value );
		} );
		return arr;
	};

	LinkedList.push = function ( list, value ) {
		return list.insert( LinkedList.Node( value ), null );
	};

	LinkedList.pop = function ( list ) {
		var node = list.tail();
		list.remove( node );
		return node.value;
	};

	LinkedList.isBefore = function ( node1, node2 ) {
		for ( ; node2 && node2 !== node1; node2 = node2.next ) {
		}
		return node2 === null;
	};

	zachModule["13"] = LinkedList;
} );

/**
 * 	author:	胡剑青 huhuh1234567@126.com
 * 	date:	2014.12
 */

zachModule(function(){

	var LinkedList =zachModule["13"];

	var prefix = /^[（【“‘]$/;
	var suffix = /^[）】”’，。；：？！、]$/;
	var connector = /^[0-9a-zA-Z`~!@#\$%\^&\*\(\)\-_=\+\[\{\]\}\\\|:;"'<,>\.\?\/]$/;
	var blank = /^[ 	　]$/;
	var enter = /^[\n\r]$/;

	function character(element){
		return element.character||"";
	}

	function isWord(left,right){
		return left&&right&&								//both text
			(prefix.test(left)&&!blank.test(right)||		//prefix is not the end
			!blank.test(left)&&suffix.test(right)||			//suffix is not the begin
			connector.test(left)&&connector.test(right)||	//connectors connect
			blank.test(left)&&blank.test(right));			//blanks connect
	}

	function BuildLines(canBreak,compressBlank){
		return function(beginNode,endNode,width,indent){
			var offset = indent;
			var lineBeginNode = beginNode;
			var wordWidth = 0;
			var wordText = "";
			var wordBeginNode = beginNode;
			var lines = [];
			LinkedList.loopNodes(beginNode,endNode,function(element,node){
				//update word
				wordWidth += element.width;
				wordText += character(element);
				//end word
				if(canBreak(character(element),node.next===endNode? "":character(node.next.value))){
					//new line
					if(enter.test(wordText)){
						lines.push(lineBeginNode);
						lineBeginNode = node.next;
						offset = indent;
					}
					else if(wordBeginNode!==lineBeginNode&&offset+wordWidth>width&&!(compressBlank&&blank.test(character(wordBeginNode.value)))){
						lines.push(lineBeginNode);
						lineBeginNode = wordBeginNode;
						offset = wordWidth;
					}
					else{
						offset += wordWidth;
					}
					//reset word
					wordText = "";
					wordWidth = 0;
					wordBeginNode = node.next;
				}
			});
			lines.push(lineBeginNode);
			return lines;
		};
	}
	var buildAllBreakLines = BuildLines(function(left,right){
		return true;
	},false);
	var buildWordBreakLines = BuildLines(function(left,right){
		return !isWord(left,right);
	},true);

	function alignLeftLine(beginNode,endNode,width,offset){
		var offsetX = offset;
		LinkedList.loopNodes(beginNode,endNode,function(element){
			element.offsetX = offsetX;
			offsetX += element.width;
		});
	}

	function alignSideLine(beginNode,endNode,width,offset){
		//skip back space
		var lastNode = beginNode;
		LinkedList.loopNodes(beginNode,endNode,function(element,node){
			if(!element.character||!blank.test(element.character)){
				lastNode = node;
			}
		});
		//calculate space
		var totalSpaceCount = 0;
		var totalWidth = 0;
		LinkedList.loopNodes(beginNode,lastNode.next,function(element,node){
			totalWidth += element.width;
			if(node.next!==lastNode.next&&!isWord(element.character,node.next.value.character)){
				totalSpaceCount++;
			}
		});
		//calculate x
		var space = totalSpaceCount>0? (width-offset-totalWidth)/totalSpaceCount:0;
		var offsetX = offset;
		var spaceOffsetX = 0;
		var spaceCount = 0;
		LinkedList.loopNodes(beginNode,endNode,function(element,node){
			element.offsetX = offsetX+spaceOffsetX;
			offsetX += element.width;
			if(node.next!==endNode&&!isWord(element.character,node.next.value.character)){
				spaceCount++;
				spaceOffsetX = (space*Math.min(spaceCount,totalSpaceCount)+0.5)<<0;
			}
		});
	}

	zachModule["14"].buildAllBreakLines = buildAllBreakLines;
	zachModule["14"].buildWordBreakLines = buildWordBreakLines;

	zachModule["14"].alignLeftLine = alignLeftLine;
	zachModule["14"].alignSideLine = alignSideLine;

});

/**
 * Created by Zuobai on 2014/12/13.
 */

zachModule( function () {
	var textUtil =zachModule["14"],
		util =zachModule["0"],
		List =zachModule["13"],
		array =zachModule["7"];

	var MeasureGc = function () {
		var gc;
		return function () {
			return gc ? gc : gc = document.createElement( "canvas" ).getContext( "2d" );
		};
	}();

	// 根据style对象生成一个font字符串
	function Font( style ) {
		style = style || {};
		return [style.fontStyle || "normal", style.fontVariant || "normal", style.fontWeight || "normal",
			( style.fontSize || 12 ) + "px", style.fontFamily || "sans-serif"].join( " " );
	}

	// 测量文字
	function measureText( text, style ) {
		var gc = MeasureGc();
		gc.font = Font( style );
		return gc.measureText( text );
	}

	// 根据样式和宽度摆放样式
	function layText( text, width, style ) {
		var gc = MeasureGc(),
			marginCount = 0, lineCount = 0,
			list = List(),
			align = style.align;

		gc.font = Font( style );

		// 计算每个字符的宽度
		util.loopString( text.replace( /\r/g, "" ), function ( ch ) {
			List.push( list, {
				character : ch,
				width : ch === "\n" ? 0 : gc.measureText( ch ).width
			} );

			if ( ch === "\n" ) {
				++marginCount;
			}
		}, true );

		// 断行,遍历断行的结果(区间链表),算对齐
		array.loopSection( style.lineBreak( list.head(), null, width, 0 ), function ( start, end ) {
			start && ( start.value.lineStart = true );
			align( start, end, width, 0 );
			++lineCount;
		} );

		list.style = style;
		list.width = width;
		list.height = lineCount * style.lineHeight + marginCount * ( style.margin || ( style.margin = 0 ) );
		return list;
	}

	// 绘制纯文字排版
	function drawTextLayout( gc, layout ) {
		var style = layout.style,
			lineHeight = style.lineHeight,
			margin = style.margin,
			y = -lineHeight,
			midY = lineHeight / 2 << 0;

		gc.font = Font( style );
		gc.fillStyle = style.color;
		gc.textBaseline = "middle";

		List.loop( layout, function ( node ) {
			if ( node.lineStart ) {
				y += lineHeight;
			}
			if ( node.character === "\n" ) {
				y += margin;
			}

			gc.fillText( node.character, node.offsetX, y + midY );
		} );
	}

	zachModule["15"].LineBreak = {
		breakAll : textUtil.buildAllBreakLines,
		normal : textUtil.buildWordBreakLines
	};

	zachModule["15"].Align = {
		left : textUtil.alignLeftLine,
		side : function ( begin, end, width ) {
			( end && end.previous.value.character !== "\n" ? textUtil.alignSideLine : textUtil.alignLeftLine)( begin, end, width, 0 );
		}
	};

	zachModule["15"].Font = Font;
	zachModule["15"].measureText = measureText;
	zachModule["15"].layText = layText;
	zachModule["15"].drawTextLayout = drawTextLayout;
} );

/**
 * Created by 白 on 2014/11/24.
 * fp引擎相关
 */

(function () {
	var util =zachModule["0"],
		loopArray = util.loopArray,
		extract = util.extract,
		insert = util.insert,
		Event = util.Event,

		dom =zachModule["2"],
		element = dom.element,
		css = dom.css,

		lib =zachModule["5"],
		KeyValueFunction = lib.KeyValueFunction,

		animate =zachModule["6"],

		fp = window.fp = window.fp || {},

		specialPage = window.specialPage = {},
		layoutFormat = window.layoutFormat = {},
		functionPages = window.functionPages = {},
		enterAnimate = window.enterAnimate = {},
		pageEffects = window.pageEffects = {},
		switchAnimates = window.switchAnimates = [];

	insert( ua, {
		iphone4 : ua.iphone && screen.height === 480,
		iphone5 : ua.iphone && screen.height === 568,
		iphone6 : ua.iphone && screen.height > 568,
		mi4 : /Mi 4LTE/gi.test( navigator.userAgent )
	} );

	// 静态图片地址
	window.staticImgSrc = function ( src ) {
		return contentSrc( "image/" + src );
	};

	// 获取组件属性
	window.componentAttr = function ( componentInfo ) {
		return extract( componentInfo, {
			x : 0,
			y : 0,
			opacity : 1,
			scale : 1,
			rotate : 0,
			"z-index" : 0,
			transform : 0
		} );
	};

	// 3个经典的定位函数
	window.center = function ( outLength, innerLength ) {
		return ( outLength - innerLength ) / 2 << 0;
	};

	window.middleY = function ( y, scale ) {
		return ( y - idealHeight / 2 ) * ( scale || 1 ) + clientHeight / 2 << 0;
	};

	window.middleX = function ( x, scale ) {
		return ( x - idealWidth / 2 ) * ( scale || 1 ) + clientWidth / 2 << 0
	};

	// 注册板式
	window.registLayout = KeyValueFunction( function ( name, func ) {
		layoutFormat[name] = func;
	} );

	// 注册页面效果
	window.registPageEffect = KeyValueFunction( function ( name, func ) {
		pageEffects[name] = func;
	} );

	// 注册入场动画
	window.registEnterAnimate = KeyValueFunction( function ( name, info ) {
		enterAnimate[name] = ( !window.highPerformance ? info.fallback : undefined ) || function ( component ) {
			var progress = info.progress ?
				info.progress.apply( null, [component].concat( Array.prototype.slice.call( arguments, 1 ) ) ) : undefined;

			if ( progress ) {
				var tmp = {};
				util.loopObj( progress, function ( ratio, value ) {
					loopArray( ratio.split( " " ), function ( ratio ) {
						tmp[ratio] = value;
					} );
				} );
				progress = tmp;
			}

			return {
				component : component,
				duration : info.duration || 1,
				timing : info.timing || animate.Timing.ease,
				progress : progress,
				onAnimate : info.onAnimate
			};
		};
	} );

	// 注册切页动画
	window.registSwitchAnimate = KeyValueFunction( function ( name, func ) {
		switchAnimates.push( func );
		switchAnimates[name] = func;
	} );

	// 注册功能页
	window.registFunctionPage = function ( name, make ) {
		return functionPages[name] = function ( arg ) {
			// 滑入页面
			function slidePageIn() {
				var page = fp.slidePage();
				make( page, arg.data );
				page.slideIn( arg.noTransition );
			}

			if ( arg.noLog || fp.isLogIn() ) {
				slidePageIn();
			}
			else {
				if ( !fp.canNotLogin ) {
					sessionStorage.setItem( "lastPageIndex", curPageIndex );
					sessionStorage.setItem( "functionData", JSON.stringify( {
						name : name,
						data : arg.data
					} ) );
					fp.logIn( {
						returnUrl : location.href,
						onLogIn : slidePageIn
					} );
				}
				else {
					fp.canNotLogin();
				}
			}
		};
	};

	// 注册特殊页
	window.registSpecialPage = KeyValueFunction( function ( name, load ) {
		specialPage[name] = function () {
			var pageInfo = {
				type : "special",
				load : function ( done ) {
					load( function ( info ) {
						pageInfo.create = function () {
							var page = element( "div.special-page.page" ),
								showEvent = Event(),
								removeEvent = Event();

							insert( page, {
								start : showEvent.trig,
								recycle : removeEvent.trig,
								onShow : showEvent.regist,
								onRemove : removeEvent.regist
							} );

							info.create( page );
							return page;
						};

						done();
					} );
				}
			};

			return pageInfo;
		};
	} );

	window.isImageRect = function ( url ) {
		return /^#/.test( url ) || /^rgba/gi.test( url );
	};

	// 板式页
	window.LayoutPage = function ( pageData ) {
		var layoutData = pageData.layout,
			format = layoutFormat[layoutData.label] || layoutFormat["SingleImage"], // 根据layoutId,选择板式,如果没找到该板式,使用单图板式
			resourceList = ( format.resource || [] ).concat( [] ),
			imageList = layoutData.image || [], // 页面的资源列表和图片列表
			pageEffect = pageData.pageEffect ? pageEffects[pageData.pageEffect] : null,
			effectResource = pageEffect ? ( pageEffect.resource || [] ).concat( [] ) : null; // 页面效果

		return {
			pageData : pageData,
			create : function ( page ) {
				format.create( page, layoutData );

				pageEffect && pageEffect.create( page, effectResource );
				return page;
			},

			load : function ( done ) {
				var loader = util.Loader(),
					shareImg = window.shareImg;

				function doLoad( imgList, srcHandler ) {
					loopArray( imgList, function ( url, i ) {
						loader.load( function ( done ) {
							if ( isImageRect( url ) ) {
								done();
							}
							else {
								// 将src(字符串)替换为元素
								var img = imgList[i] = new Image();

								if ( format.crossOrigin ) {
									img.crossOrigin = "*";
								}

								img.onload = function () {
									img.halfWidth = ( img.naturalWidth || img.width ) / 2 << 0;
									img.halfHeight = ( img.naturalHeight || img.height ) / 2 << 0;
									img.onload = null;

									// 如果还没有分享图,设置为分享图
									if ( !srcHandler && shareImg && shareImg.isSmall && img.halfWidth >= 150 && img.halfHeight >= 150 ) {
										shareImg.isSmall = false;
										shareImg.src = img.src;
									}
									done();
								};

								// 如果图片加载失败,加载404
								img.onerror = function () {
									img.src = staticImgSrc( "firstPage-404.jpg" );
								};
								img.src = srcHandler ? srcHandler( url ) : url;
							}
						} );
					} );
				}

				doLoad( imageList );
				doLoad( resourceList, staticImgSrc );
				effectResource && doLoad( effectResource, staticImgSrc );

				loader.start( function () {
					insert( layoutData, {
						resource : resourceList,
						image : imageList
					} );
					done();
				} );
			}
		};
	};

	// 绑定数据源
	window.bindDataSource = function ( el, fieldName, index ) {
		if ( el.nodeName ) {
			el.classList.add( "layout-component-from-data" );
			el.dataSource = {
				from : fieldName,
				index : index
			};
		}
		return el;
	};

	// 图标
	window.Icon = function ( url, width, height, parent ) {
		var image = new Image();
		image.src = url;
		css( image, {
			width : css.px( width ),
			display : "block",
			position : "absolute"
		} );

		image.componentWidth = width;
		image.componentHeight = height;

		image.pos = function ( x, y ) {
			css( image, {
				x : css.px( x ),
				y : css.px( y )
			} );
		};

		parent && parent.appendChild( image );

		return image;
	};
})();

/**
 * Created by 白 on 2014/9/10.
 */

(function () {
	var util =zachModule["0"],
		loopObj = util.loopObj,
		insert = util.insert,
		Event = util.Event,

		dom =zachModule["2"],
		removeNode = dom.removeNode,
		element = dom.element,
		bubble = dom.bubble,
		toggleState = dom.toggleState,
		transition = dom.transition,
		onTransitionEnd = dom.onTransitionEnd,

		pointer =zachModule["4"],
		onPointerDown = pointer.onPointerDown;

	// 锁定屏幕,不接受鼠标动作
	function lock( isLock, el ) {
		dom.switchClass( el || document.documentElement, isLock, "lock" );
	}

	// 跳转到链接,记录当前页码
	function jump( href ) {
		sessionStorage.setItem( "lastPageIndex", curPageIndex );
		location.href = href;
	}

	// 屏蔽触摸事件
	function preventEvent( targetNode, onRemove ) {
		var body = document.body;

		if ( targetNode ) {
			// 添加class,完成屏蔽
			targetNode.classList.add( "event-all" );
			bubble( targetNode, function ( node ) {
				node.classList.add( "event-target" );
			} );
			body.classList.add( "event-mask" );

			fp.history.pushAction( function () {
				// 移除class,取消屏蔽
				targetNode.classList.remove( "event-all" );
				bubble( targetNode, function ( node ) {
					node.classList.remove( "event-target" );
				} );
				body.classList.remove( "event-mask" );

				downHandle.remove();
				onRemove && onRemove();
			} );

			var downHandle = onPointerDown( document, function ( event ) {
				if ( !targetNode.contains( event.target ) ) {
					event.preventDefault();
					fp.history.back();
				}
			} );
		}
		else {
			var mask = element( "div.body-mask", body );
			fp.history.pushAction( function () {
				removeNode( mask );
				onRemove && onRemove();
			} );

			onPointerDown( mask, function ( event ) {
				event.preventDefault();
				event.stopPropagation();
				fp.history.back();
			} );
		}
	}

	var cookie = function () {
		var cookie = JSON.parse( localStorage.getItem( "cookie" ) || "{}" );

		// 根据过期时间,清理cookie
		loopObj( cookie, function ( key, value ) {
			if ( value.expires < new Date() ) {
				delete cookie[key];
			}
		} );

		// 保存cookie
		function save() {
			localStorage.setItem( "cookie", JSON.stringify( cookie ) );
		}

		save();

		return {
			getItem : function ( key ) {
				return cookie[key] ? cookie[key].value : null;
			},
			setItem : function ( key, value, timeToExpires ) {
				cookie[key] = {
					value : value,
					expires : (new Date()).getTime() + timeToExpires * 1000
				};
				save();
			},
			expires : function ( key, timeToExpires ) {
				if ( cookie[key] ) {
					cookie[key].expires = (new Date()).getTime() + timeToExpires * 1000;
					save();
				}
			},
			remove : function ( key ) {
				delete cookie[key];
				save();
			}
		};
	}();

	// 历史
	var fpHistory = function () {
		var actionList = [],
			hasPush = false;

		setTimeout( function () {
			dom.bindEvent( window, "popstate", function () {
				if ( actionList.length !== 0 ) {
					var oldTop = actionList.top;
					actionList.pop();
					oldTop.onPop( oldTop.actionEnd );

					if ( actionList.length > 1 ) {
						history.pushState( null, "", location.href );
					}
					else {
						hasPush = false;
					}
				}
			} );
		}, 0 );

		return {
			pushAction : function ( onPop ) {
				var actionEndEvent = Event();
				actionList.push( {
					onPop : onPop,
					actionEnd : actionEndEvent.trig
				} );

				if ( !hasPush ) {
					hasPush = true;
					history.pushState( null, "", location.href );
				}

				return actionEndEvent.regist;
			},
			back : function () {
				history.back();
			}
		};
	}();

	// 加载动画
	var Loading = function () {
		// 全局的加载图标
		var globalLoading;

		return function ( parent, delay ) {
			if ( !globalLoading ) {
				globalLoading = element( "div.loading", [
					element( "div.point" ), element( "div.circle" )
				] );
			}

			// 如果不提供父元素,做全局级别的加载,屏蔽事件
			if ( !parent ) {
				lock( true );
				document.body.appendChild( globalLoading );

				return {
					remove : function () {
						lock( false );
						removeNode( globalLoading );
					}
				};
			}
			// 否则做局部的加载
			else {
				var loading = delay ? null : parent.appendChild( globalLoading.cloneNode( true ) ),
					timeout = null;

				delay && ( timeout = setTimeout( function () {
					loading = parent.appendChild( globalLoading.cloneNode( true ) );
				}, delay ) );

				return {
					remove : function () {
						timeout && clearTimeout( timeout );
						removeNode( loading );
					}
				};
			}
		}
	}();

	// 弹出消息
	var alert = function () {
		var msgBox, msg;

		return function ( text, delay ) {
			// 第一次弹出消息时创建消息框
			if ( !msgBox ) {
				msgBox = element( "div.msg-box", document.body );
				msg = element( "div.msg", msgBox );
			}

			msg.innerHTML = text;
			toggleState( msgBox, "remove", "show" );

			function removeMsg() {
				toggleState( msgBox, "show", "remove" );
				tapHandle.remove();
				clearTimeout( timeoutHandle );
			}

			var tapHandle = onPointerDown( document, removeMsg ),
				timeoutHandle = setTimeout( removeMsg, delay || 2000 );
		};
	}();

	// 滑页
	var slidePage = function () {
		var parent = element( "div.slide-page" ),
			slideInEvent = Event(),
			slideOutEvent = Event();

		onPointerDown( parent, function ( event ) {
			event.stopPropagation();
		} );

		return insert( parent, {
			onSlideIn : slideInEvent.regist,
			onSlideOut : slideOutEvent.regist,
			isIn : function () {
				return parent.classList.contains( "slide-in" );
			},
			slideIn : function ( noTransition ) {
				body.appendChild( parent );

				if ( noTransition ) {
					noTransition && parent.classList.add( "no-transition" );
					parent.classList.add( "slide-in" );
					slideInEvent.trig();
				}
				else {
					fp.lock( true );
					setTimeout( function () {
						parent.classList.add( "slide-in" );
						onTransitionEnd( parent, function () {
							fp.lock( false );
							slideInEvent.trig();
						} );
					}, 10 );
				}

				fp.history.pushAction( function () {
					fp.lock( true );
					slideOutEvent.trig();
					parent.classList.remove( "no-transition" );
					parent.classList.remove( "slide-in" );
					onTransitionEnd( parent, function () {
						fp.lock( false );
						removeNode( parent );
					} );
				} );
			}
		} );
	};

	function getSessionData( key, defaultValue ) {
		var retVal = sessionStorage.getItem( key );
		sessionStorage.removeItem( key );
		return retVal === null ? defaultValue : retVal;
	}

	function downloadFirstPage() {
		var systemName;

		if ( ua.iphone ) {
			systemName = "iphone";
		}
		else if ( ua.ipad ) {
			systemName = "ipad";
		}
		else if ( ua.ios ) {
			systemName = "ios-other"
		}
		else if ( ua.android ) {
			systemName = "android";
		}
		else {
			systemName = "other";
		}

		if ( ua.chuye ) {
			fp.alert( "您正在使用初页" );
		}
		else {
			window.AnalyticsDownload && window.AnalyticsDownload( {
				title : "点击下载",
				url : "http://chuye.cloud7.com.cn" + virtualPath + "/download/click/" + systemName + "/" + fp.getWorkInfo().ContentID
			} );

			if ( ua.android ) {
				location.href = "http://a.app.qq.com/o/simple.jsp?pkgname=com.cloud7.firstpage";
			}
			else if ( ua.ios ) {
				location.href = ua.MicroMessenger ? "http://a.app.qq.com/o/simple.jsp?pkgname=com.cloud7.firstpage"
					: "https://itunes.apple.com/cn/app/chu-ye/id910560238?mt=8";
			}
			else {
				location.href = "http://www.cloud7.com.cn/chuye";
			}
		}
	}

	insert( fp, {
		lock : lock,
		jump : jump,
		preventEvent : preventEvent,
		cookie : cookie,
		history : fpHistory,
		Loading : Loading,
		alert : alert,
		slidePage : slidePage,
		getSessionData : getSessionData,
		downloadFirstPage : downloadFirstPage
	} );
})();

/**
 * Created by 白 on 2014/11/24.
 * 初夜系统的启动
 */

(function () {
	var util =zachModule["0"],
		Event = util.Event,

		dom =zachModule["2"],
		element = dom.element,

		imageViewer =zachModule["8"],
		animate =zachModule["6"],

		pointer =zachModule["4"],
		onPointerDown = pointer.onPointerDown,
		onTap = pointer.onTap,
		stopPlaying = false;

	window.stopAudio = function () {
		stopPlaying = true;
	};

	fp.runSystem = function () {
		var loading = fp.Loading();
		ua.chuye = /chuye/gi.test( navigator.userAgent ); // 判断是否在chuye中

		if ( ua.ios ) {
			document.documentElement.classList.add( "ios" );
		}

		if ( ua.win32 ) {
			document.documentElement.classList.add( "win32" );
		}

		window.body = element( "div.body", document.body );

		// 全局屏蔽默认事件,如果某节点需要默认事件,加类.need-default
		onPointerDown( document, function ( event ) {
			var prevent = true;
			dom.bubble( event.target, function ( node ) {
				if ( node.classList.contains( "need-default" ) ) {
					prevent = false;
				}
			} );
			prevent && event.preventDefault();
		} );

		// 启动幻灯片
		window.onSystemPrepare && window.onSystemPrepare( function ( data ) {
			var rawPages = data.pages, // 原始页面
				pageNumber = window.pageNumber = rawPages.length,
				functionData = fp.getSessionData( "functionData" ),
				pages = new Array( pageNumber ), // 已解析的页面
				context = {};

			// 尺寸相关
			window.idealWidth = 320;
			window.idealHeight = 504;

			function resize() {
				window.clientWidth = document.documentElement.clientWidth;
				window.clientHeight = document.documentElement.clientHeight;
				window.xRatio = clientWidth / idealWidth;
				window.yRatio = clientHeight / idealHeight;
				window.globalScale = imageViewer.Size.cover( {
					width : idealWidth,
					height : idealHeight
				}, clientWidth, clientHeight );
			}

			resize();
			dom.bindEvent( window, "resize", function () {
				resize();
				fp.resize && fp.resize();
				window.jumpPage && window.jumpPage( window.curPageIndex );
			} );

			window.color = data.color;
			pages.data = data;

			// 如果有功能数据,构建对应的页面并切出
			if ( functionData ) {
				functionData = JSON.parse( functionData );
				functionPages[functionData.name]( {
					data : functionData.data,
					noTransition : true
				} );
			}

			// 获取页码
			window.getIndex = function ( index ) {
				return ( index + pageNumber ) % pageNumber;
			};

			// 读取某页面
			context.loadPage = function () {
				var loadingTable = [];

				function loadPage( index, times, onLoad ) {
					function loadNext() {
						loadPage( index - 1, times - 1 );
						loadPage( index + 1, times - 1 );
					}

					if ( index >= 0 && times ) {
						index = getIndex( index );
						var loadEvent = loadingTable[index];

						if ( loadEvent !== true ) {
							if ( loadEvent === undefined ) {
								var rawPage = rawPages[index],
									pageInfo = pages[index] = rawPage.special ? specialPage[rawPage.special]() : LayoutPage( rawPage );

								loadEvent = loadingTable[index] = Event();
								pageInfo.load( function () {
									pageInfo.isLoad = true;
									loadEvent.trig();
									loadingTable[index] = true;
									delete pageInfo.load;
									loadNext();
								} );
							}
							else {
								loadNext();
							}

							onLoad && loadEvent.regist( onLoad );
						}
						else {
							onLoad && onLoad();
							loadNext();
						}
					}
				}

				loadPage( window.curPageIndex = parseInt( fp.getSessionData( "lastPageIndex", "0" ), 10 ), 2 );

				return function ( index, onLoad ) {
					var loader = util.Loader();
					util.loopArray( [].concat( index ), function ( index ) {
						loader.load( function ( done ) {
							loadPage( index, 3, done );
						} );
					} );

					loader.start( onLoad );
				};
			}();

			context.startShow = function () {
				loading.remove();

				// 音乐播放
				(function () {
					if ( !window.noMusic && data.music && data.music.src ) {
						var audio = element( "<audio loop></audio>", {
								src : data.music.src
							}, document.body ), // audio标签
							playIcon = element( "div.music-icon", {
								classList : stopPlaying ? [] : ["play"]
							}, body ); // 播放图标

						// 两种方式播放音乐,如果可以直接播放,那么直接播放,否则第一次触摸时播放
						function playMusic() {
							if ( playIcon.classList.contains( "play" ) ) {
								audio.play();
							}
						}

						if ( !ua.ios ) {
							dom.bindEvent( audio, "loadeddata", function () {
								animate( {
									duration : 3,
									onAnimate : function ( ratio ) {
										audio.volume = ratio;
									}
								} );
							} );
						}

						playMusic();

						if ( audio.paused ) {

							var playMusicHandle = onPointerDown( document, function () {
								playMusic();
								playMusicHandle.remove();
							} );
						}

						// 停止播放音乐
						window.stopAudio = function () {
							playIcon.classList.remove( "play" );
							audio.pause();
						};

						// 播放音乐
						window.playAudio = function () {
							playIcon.classList.add( "play" );
							audio.play();
						};

						// 点击图标切换播放状态
						onTap( playIcon, function () {
							playIcon.classList.contains( "play" ) ? stopAudio() : playAudio();
						} );
					}
				})();
			};

			// 获取页面的info,如果info没有load,返回空
			window.getPageInfo = function ( index ) {
				var pageInfo = pages[getIndex( index )];
				return pageInfo && pageInfo.isLoad ? pageInfo : null;
			};

			// 跳转到某个页面
			window.jumpPage = function () {
				var jumpLoadHandle = null;
				return function ( pageIndex ) {
					fp.lock( false );

					// 如果有跳转加载,停止它
					jumpLoadHandle && jumpLoadHandle.remove();

					var newIndex = getIndex( pageIndex ),
						newPageInfo = getPageInfo( newIndex );

					// 如果页面还没加载,加载后跳转到该页面
					if ( !newPageInfo ) {
						fp.lock( true );
						jumpLoadHandle = context.loadPage( newIndex, function () {
							jumpPage( newIndex );
						} );
					}
					// 否则进一步调用ppt.jumpPage
					else {
						fp.jumpPage( newIndex );
						window.curPageIndex = newIndex;
					}
				};
			}();

			// 启动幻灯片
			( window.highPerformance ? CanvasSystem : DOMSystem )( pages, context );
			window.onFirstPageLoad && window.onFirstPageLoad();
		}, loading )
	};
})();

/**
 * Created by 白 on 2014/12/26.
 */

(function () {
	window.d = function ( d ) {
		return d * globalScale << 0;
	};

	function relativeX( srcComponent, srcAlign, tarComponent, tarAlign ) {
		return srcComponent.componentWidth * srcAlign - tarComponent.componentWidth * tarAlign;
	}

	function relativeY( srcComponent, srcAlign, tarComponent, tarAlign ) {
		return srcComponent.componentHeight * srcAlign - tarComponent.componentHeight * tarAlign;
	}

	function RelativeX( srcAlign, tarAlign ) {
		return function ( src, tar ) {
			return relativeX( src, srcAlign, tar, tarAlign );
		}
	}

	function RelativeY( srcAlign, tarAlign ) {
		return function ( src, tar ) {
			return relativeY( src, srcAlign, tar, tarAlign );
		}
	}

	window.position = {
		relativeX : relativeX,
		relativeY : relativeY,
		leftIn : RelativeX( 0, 0 ),
		leftTo : RelativeX( 0, 1 ),
		rightIn : RelativeX( 1, 1 ),
		rightTo : RelativeX( 1, 0 ),
		center : RelativeX( 0.5, 0.5 ),
		topIn : RelativeY( 0, 0 ),
		topTo : RelativeY( 0, 1 ),
		bottomIn : RelativeY( 1, 1 ),
		bottomTo : RelativeY( 1, 0 ),
		middle : RelativeY( 0.5, 0.5 )
	};
})();

/**
 * Created by 白 on 2014/11/5.
 */

(function () {
	if ( window.debug ) {
		return;
	}

	var util =zachModule["0"],
		is = util.is,
		extend = util.extend,

		dom =zachModule["2"],

		token;

	function invokeApi( op ) {
		return dom.ajax( {
			method : "post",
			url : util.concatUrlArg( "http://c.cloud7.com.cn" + op.url, token ? {
				_token : token
			} : {} ),
			data : is.String( op.data ) ? op.data : util.encodeURIObject( op.data ),
			requestHeader : extend( {
				"Accept" : "application/json",
				"Content-Type" : "application/x-www-form-urlencoded"
			}, op.requestHeader || {} ),
			isJson : true,
			onLoad : function ( data ) {
				if ( data.code === 302 ) {
					op.on302 && op.on302( data.data );
				}
				else {
					op.success( data.data );
				}
			}
		} );
	}

	(function () {
		var userInfo = null;

		if ( !ua.MicroMessenger ) {
			fp.canNotLogin = function () {
				fp.alert( "请在微信中使用" );
			};

			fp.isLogIn = function () {
				return false;
			};
		}
		else {
			// 如果参数中有token,说明刚登陆完
			if ( token = location.href.arg._token ) {
				fp.cookie.setItem( "token", token, 7 * 24 * 60 * 60 );

				// 获取用户信息
				fp.getUserInfo = function ( callback ) {
					if ( userInfo ) {
						callback( userInfo );
					}
					else {
						invokeApi( {
							url : "/api/Wechat/CurrentUser",
							success : function ( data ) {
								callback( userInfo = data );
							}
						} );
					}
				};

				fp.isLogIn = function () {
					return true;
				};
			}
			// 否则从localStorage中获取值,此值可能过期,用getUserInfo来确保它已登陆上
			else {
				token = fp.cookie.getItem( "token" );

				// 获取用户信息
				fp.getUserInfo = function ( callback ) {
					callback( userInfo );
				};

				fp.isLogIn = function () {
					return userInfo !== null;
				};

				// 如果有token,立即发起一次获取CurrentUser的请求,以判断是否过期
				if ( token ) {
					var on302 = null,
						onSuccess = null;

					invokeApi( {
						url : "/api/Wechat/CurrentUser",
						on302 : function ( url ) {
							on302 && on302( url );

							fp.logIn = function () {
								invokeApi( {
									url : "/api/Wechat/CurrentUser",
									on302 : fp.jump
								} );
							};
						},
						success : function ( data ) {
							userInfo = data;
							onSuccess && onSuccess();
						}
					} );

					fp.logIn = function ( arg ) {
						if ( userInfo ) {
							arg.onLogIn();
						}
						else {
							on302 = fp.jump;
							onSuccess = arg.onLogIn;
						}
					};
				}
				// 如果没有token,login就是直接跳转
				else {
					fp.logIn = function () {
						location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx9d492ee399e6a24c&redirect_uri=' +
						encodeURIComponent( 'http://c.cloud7.com.cn/Auth?returnUrl=' +
						encodeURIComponent( location.href ) ) +
						'&response_type=code&scope=snsapi_base&state=#wechat_redirect';
					};
				}
			}
		}

		return token;
	}() );

	// 获取评论Summary
	fp.getCommentSummary = function ( callback, workInfo ) {
		invokeApi( {
			url : "/api/Blog/SaveContentSummary",
			data : workInfo,
			success : function ( data ) {
				callback( data );
			}
		} )
	};

	// 获取评论数量
	fp.getCommentCount = function ( callback ) {
		var workInfo = fp.getWorkInfo();

		invokeApi( {
			url : "/api/Blog/GetCommentCounts",
			data : {
				Site : workInfo.Site,
				ContentID : workInfo.ContentID
			},
			success : function ( count ) {
				callback( count[1] );
			}
		} );
	};

	// 获取评论
	fp.getComments = function ( callback, arg ) {
		invokeApi( {
			url : "/api/blog/GetCommentWall",
			data : {
				ContentSummaryID : arg.contentSummaryId
			},
			success : function ( comments ) {
				var retVal = [];
				util.loopArray( comments, function ( data ) {
					retVal.push( {
						text : data.Text,
						userName : data.NickName,
						avatar : data.HeadPhoto || staticImgSrc( "firstPage-defaultAvatar.png" ),
						date : new Date( data.Time )
					} );
				} );

				callback( retVal );
			}
		} );
	};

	// 保存评论
	fp.saveComment = function ( callback, arg ) {
		invokeApi( {
			url : "/api/blog/SaveTextComment",
			data : {
				ContentSummaryID : arg.contentSummaryId,
				Text : arg.text
			},
			success : callback
		} );
	};
})();

/**
 * Created by 白 on 2014/11/5.
 */

(function () {
	var util =zachModule["0"],
		dom =zachModule["2"],
		pointer =zachModule["4"],
		ajax = dom.ajax,

		shareData = window.shareData = {};

	// region 提供接口
	function workId() {
		return window.workDetailUrl.split( "/" ).top;
	}

	// 获取作品信息
	fp.getWorkInfo = function () {
		return {
			Site : "chuye.cloud7.com.cn",
			ContentID : workId(),
			Url : shareData.url || location.href,
			Thumbnail : shareData.picture,
			Title : shareData.title,
			Text : shareData.desc
		};
	};

	// 记录页面访问
	fp.trackPageView = function () {
	};

	// 提交表单
	fp.sendForm = function ( callback, data ) {
		ajax( {
			url : virtualPath + "/Integra/SaveData",
			method : "post",
			requestHeader : {
				"Content-Type" : "application/x-www-form-urlencoded"
			},
			data : util.encodeURIObject( {
				formid : data.id,
				data : JSON.stringify( data.data )
			} ),
			onLoad : callback
		} );
	};
	// endregion

	// region 环境
	// 判断引擎类型
	if ( window.highPerformance === undefined ) {
		if ( ( ua.ios && ua.iosVersion >= 7 ) || ua.win32 || ( /chuye/gi.test( navigator.userAgent ) && !ua.android ) ) {
			window.highPerformance = true;
		}
	}

	// 静态图片
	window.contentSrc = function ( src ) {
		return ( ( contentPath || virtualPath ) + "/Content/" + src ).toLowerCase();
	};

	var shareImg = window.shareImg = ua.MicroMessenger && !window.wxConfig ? dom.element( "img", {
		css : {
			position : "absolute",
			width : "300px",
			left : "-300px",
			"z-index" : -2
		}
	}, document.body ) : null;
	// endregion

	// region 分享
	// 分享到微信
	function shareWeixin() {
		var noDesc = {
				title : shareData.title,
				link : shareData.url,
				imgUrl : shareData.picture,
				success : function () {
					var xhr = new XMLHttpRequest();
					xhr.open( "post", virtualPath + "/Work/Share", true );
					xhr.send( null );
				}
			},
			all = util.extend( noDesc, {
				desc : shareData.desc
			} );

		if ( window.wx && shareData.title !== undefined ) {
			wx.onMenuShareTimeline( noDesc ); // 分享到朋友圈
			wx.onMenuShareAppMessage( all ); // 分享给朋友
			wx.onMenuShareQQ( all ); // 分享到当前目录
			wx.onMenuShareWeibo( all ); // 分享给微博
		}
	}

	if ( ua.MicroMessenger && window.wxConfig ) {
		var wxScript = dom.element( "script", {
			src : "http://res.wx.qq.com/open/js/jweixin-1.0.0.js"
		} );

		wxScript.onload = function () {
			wx.config( util.extend( window.wxConfig, {
				debug : false,
				jsApiList : ["onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "getNetworkType"]
			} ) );

			wx.ready( function () {
				shareWeixin();
				wx.getNetworkType( {
					success : function ( res ) {
						ua.networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
					}
				} );
			} );
		};

		document.head.appendChild( wxScript );
	}

	// 凤凰网分享
	function IfengShareElement( id ) {
		return dom.element( "div", {
			id : id,
			css : {
				display : "none"
			}
		}, ua.win32 ? null : document.body );
	}

	var ifengShare = {
		picture : IfengShareElement( "ifeng_share_thumbnail" ),
		title : IfengShareElement( "ifeng_share_title" ),
		desc : IfengShareElement( "ifeng_share_description" ),
		url : IfengShareElement( "ifeng_share_url" )
	};

	// 设置分享数据
	window.setShareData = function ( data ) {
		if ( data.picture && shareImg ) {
			shareImg.src = data.picture;
			shareImg.onload = function () {
				shareImg.isSmall = ( shareImg.naturalHeight || shareImg.height ) < 300 || ( shareImg.naturalWidth || shareImg.width ) < 300;
			};
		}

		util.insert( shareData, data );
		util.loopObj( data, function ( key, value ) {
			ifengShare[key].innerHTML = value;
		} );

		data.title && ( document.title = data.title );

		shareWeixin();
	};
	// endregion

	// region 启动
	window.onSystemPrepare = function ( load, loadingAnimate ) {
		ajax( {
			url : workDetailUrl + "?" + util.encodeURIObject( {
				isPreview : ua.chuye
			} ),
			isJson : true,
			onLoad : function ( workData ) {
				if ( workData.code === 1401 ) {
					document.documentElement.classList.add( "work-1401" );
					document.documentElement.classList.add( "no-work" );
				}
				else if ( workData.code !== 200 ) {
					loadingAnimate.remove();
					document.documentElement.classList.add( "work-404" );
					document.documentElement.classList.add( "no-work" );
					return;
				}

				workData = workData.data;

				// 计算分享url
				if ( workData ) {
					setShareData( {
						picture : workData.thumbnail,
						title : workData.title,
						url : location.origin + location.pathname,
						desc : workData.description || ""
					} );

					document.description = workData.description || "";
					document.thumbnail = workData.thumbnail;

					// 如果在初夜中,回调的onFirstPageDataLoad方法直到成功
					if ( ua.chuye ) {
						if ( document.onFirstPageDataLoad ) {
							document.onFirstPageDataLoad();
						}
						else {
							var handle = window.setInterval( function () {
								if ( document.onFirstPageDataLoad ) {
									document.onFirstPageDataLoad();
									window.clearInterval( handle );
								}
							}, 1000 );
						}
					}

					var userworks = workData.userworks,
						works = userworks.works,
						pages = workData.pages,
						copyrightPage = {
							layout : {
								label : "copyright",
								author : workData.author,
								image : [workData.headimgurl, works[0].thumbnail, works[1].thumbnail, works[2].thumbnail],
								title : userworks.title,
								works : works,
								commentCount : 0
							}
						};

					workData.praise && pages.push( {
						special : "comment"
					} );

					function loadDone() {
						load( {
							mode : workData.mode || "push",
							color : {
								background : workData.backgroud.color === "FFFFFF" ? "#FFFFFF" : workData.backgroud.color
							},
							pageSwitch : workData.pageSwitch || {
								animateId : "push"
							},
							music : workData.music,
							pages : pages
						} );
					}

					// 处理金酸梅活动
					if ( workId() === "110005" ) {
						var razziesId, storage = localStorage.getItem( "razzies" );
						if ( storage ) {
							var loading = fp.Loading( document.body );
							RazziesPreviewPage( JSON.parse( storage ), function ( previewPage ) {
								localStorage.removeItem( "razzies" );
								loading.remove();
								window.body.appendChild( previewPage );
							} );
						}
						else if ( razziesId = location.href.arg.razzies ) {
							dom.ajax( {
								url : "http://chuye.cloud7.com.cn/beta/Event/GetCustomAwards",
								method : "post",
								requestHeader : {
									"Content-Type" : "application/x-www-form-urlencoded"
								},
								data : util.encodeURIObject( {
									razzies : razziesId
								} ),
								isJson : true,
								onLoad : function ( data ) {
									data = data.data;
									data.image = data.image || [];

									window.setRazziesShareData( {
										text : data.text,
										id : parseInt( razziesId, 10 )
									} );

									pages.push( {
										layout : util.extend( data, {
											label : "razzies-custom"
										} )
									} );
									pages.push( {
										special : "razzies"
									} );
									loadDone();
								}
							} );
						}
						else {
							pages.push( {
								special : "razzies"
							} );
							loadDone();
						}
					}
					else if ( workData.copyrightUrl ) {
						window.copyrightUrl = workData.copyrightUrl;
						pages.push( {
							special : "copyright"
						} );
						loadDone();
					}
					else {
						if ( workData.copyright ) {
							pages.push( copyrightPage );
						}
						else {
							var copyTips = dom.element( "div.copy-tips", window.body );

							function copyComp( x, y, w, h ) {
								return dom.element( "div", {
									css : {
										position : "absolute",
										left : dom.css.px( x / 2 << 0 ),
										top : dom.css.px( y / 2 << 0 ),
										width : dom.css.px( w / 2 << 0 ),
										height : dom.css.px( h / 2 << 0 )
									}
								}, copyTips );
							}

							pointer.onTap( copyComp( 80, 90, 204, 54 ), function () {
								location.href = "http://chuye.cloud7.com.cn";
							} );
							pointer.onTap( copyComp( 336, 90, 204, 54 ), fp.downloadFirstPage );

							pointer.onTap( dom.element( "div.copy-icon", [dom.element( "div.enlarge" )], window.body ), function () {
								document.body.classList.add( "show-copy-tips" );
							} );
						}

						loadDone();
					}
				}

				window.onDataLoad && window.onDataLoad( workData );
			}
		} );
	};
	// endregion
})();

/**
 * Created by 白 on 2014/11/24.
 * Canvas点系统
 */

(function () {
	var util =zachModule["0"],
		extend = util.extend,

		animate =zachModule["6"],

		dom =zachModule["2"],
		element = dom.element,

		css = dom.css,
		removeNode = dom.removeNode,

		pointer =zachModule["4"],
		onTap = pointer.onTap,

		CanvasMode = window.CanvasMode = window.CanvasMode || {};

	// 点击触发事件,仅仅针对这一次点击
	function onTapOnce( element, response ) {
		var tapHandler = onTap( element, function () {
			tapHandler.remove();
			response();
		} );
		return tapHandler;
	}

	// 获取切换动画
	function getSwitchAnimate( data ) {
		var animateId = data && data.pageSwitch ? data.pageSwitch.animateId : null;
		return animateId ? switchAnimates[animateId === "random" ? Math.random() * switchAnimates.length << 0 : animateId] : animateId;
	}

	// 准备snapshot
	window.prepareSnapshot = function ( prev, cur, canvas, style ) {
		var body = window.body;
		prev && body.appendChild( prev );
		cur && body.appendChild( cur );
		removeNode( canvas );
		css( body, style );

		return function () {
			removeNode( prev );
			removeNode( cur );
			body.appendChild( canvas );
			dom.removeCss( body, style );
		};
	};

	CanvasMode.click = function ( pages, fc ) {
		var startPageIndex = window.curPageIndex,
			data = pages.data,
			body = window.body,

			canvas = fc.canvas,
			makePage = fc.makePage,
			setPage = fc.setPage,
			removeCurrentPage = fc.removeCurrentPage,

			tips = startPageIndex === 0 ? element( "div#tap-tips.hide.switch-tips", {
				children : [element( "div.gray-circle" ), element( "div.red-circle" )]
			}, body ) : null; // 点击提示

		window.inClickMode = true;

		function ClickPage( pageInfo ) {
			var newPage = makePage( pageInfo );

			// 点击快进此帧,如果全部运行完,切页
			onTap( newPage, function () {
				if ( !window.preventJump ) {
					if ( !newPage.runNextFrame || !newPage.runNextFrame() ) {
						switchPage( newPage, curPageIndex + 1 );
					}
				}
				window.preventJump = false;
			} );

			// 如果有提示,在该页入场动画结束后显示提示,点击移除
			if ( tips ) {
				newPage.onEnterEnd && newPage.onEnterEnd( function () {
					tips && dom.toggleState( tips, "hide", "show" );
				} );
			}

			fp.trackPageView();
			return newPage;
		}

		function switchPage( prePage, curIndex ) {
			// 更新当前页索引
			window.curPageIndex = getIndex( curIndex );
			var loading = fp.Loading();

			fc.loadPage( curPageIndex, function () {
				var curPageInfo = pages[getIndex( curIndex )];
				loading.remove();

				var newPage = ClickPage( curPageInfo ),
					switchAnimation = prePage.nodeName || curPageInfo.type ? switchAnimates["fade"] :
					getSwitchAnimate( curPageInfo.pageData ) || getSwitchAnimate( data ) || switchAnimates["push"],
					animationInfo = switchAnimation( PageLayer( prePage ), PageLayer( newPage ), canvas ),
					fastForwardHandler;

				// 移除现有的动画
				removeCurrentPage();
				document.body.classList.remove( "show-copy-tips" );
				document.body.classList.remove( "last-page" );
				
				function end() {
					animationInfo.onEnd && animationInfo.onEnd();
					fastForwardHandler.remove();
					setPage( newPage );

					// 判断是否滑到最后一页
					if ( curPageIndex === pageNumber - 1 ) {
						document.body.classList.add( "last-page" );
					}
				}

				// 如果有onDraw,表明是area动画,否则是DOM动画
				if ( animationInfo.onDraw ) {
					var progress = animate.Progress( animationInfo );

					fastForwardHandler = onTapOnce( canvas, function () {
						progress.progress( 1 )
					} );

					canvas.root = {
						draw : function ( gc ) {
							animationInfo.onDraw( gc, progress.ratio() );
							if ( progress.isEnd() ) {
								end();
							}
							else {
								canvas.dirty();
							}
						}
					};

					animationInfo.onStart && animationInfo.onStart();
				}
				else {
					var switchAnimationHandler = animate( extend( animationInfo, {
						onEnd : function () {
							body.appendChild( canvas );
							end();
						}
					} ), canvas.requestAnimate );

					removeNode( canvas );

					// 点击背景,快进切换动画
					fastForwardHandler = onTapOnce( body, function () {
						switchAnimationHandler && switchAnimationHandler.progress( 1 );
					} );
				}

				canvas.dirty();
			} );
		}

		fc.loadPage( startPageIndex, function () {
			var pageInfo = pages[startPageIndex];
			fc.startShow();

			// 点击移除提示
			onTapOnce( body, function () {
				removeNode( tips );
				tips = null;
			} );

			setPage( ClickPage( pageInfo ) );
		} );

		// 直接跳转到某页
		fp.jumpPage = function ( index ) {
			removeCurrentPage();
			setPage( ClickPage( pages[index] ) );
		};
	};
})();

/**
 * Created by 白 on 2014/11/24.
 * Canvas推系统
 */

(function () {
	var util =zachModule["0"],
		loopArray = util.loopArray,

		math =zachModule["3"],
		animate =zachModule["6"],

		dom =zachModule["2"],
		css = dom.css,
		removeNode = dom.removeNode,
		toggleState = dom.toggleState,
		element = dom.element,

		pointer =zachModule["4"],

		CanvasMode = window.CanvasMode = window.CanvasMode || {};

	CanvasMode.push = function ( pages, fc ) {
		var startPageIndex = window.curPageIndex,
			body = window.body,

			canvas = fc.canvas,
			makePage = fc.makePage,
			setPage = fc.setPage,
			removeCurrentPage = fc.removeCurrentPage,

			inDrag = false;

		fc.loadPage( startPageIndex === 0 ? [0, 1] : startPageIndex, function () {
			var tips = startPageIndex === 0 ? element( "div#slide-tips.switch-tips", body ) : null, // 滑动提示
				hasToEnd = false; // 是否已经到达最后一页

			// 向上箭头和加载下页提示
			element( "div.slide-arrow.switch-tips", body );
			element( "div.loading-next-page-tips", body );

			if ( startPageIndex !== 0 ) {
				toggleState( document.body, "can-not-push", "can-push" );
			}

			fc.startShow();
			fp.trackPageView();

			// 第一页加载完后,显示第一页
			setPage( makePage( pages[startPageIndex] ) );

			pointer.onDragV( body, function ( event ) {
				var preInfo = curPageIndex === 0 && !hasToEnd ? null : getPageInfo( curPageIndex - 1 ),
					nextInfo = getPageInfo( curPageIndex + 1 );

				// 如果滑出方向的页没有加载出,不做反应
				if ( inDrag || event.directionY === false && !nextInfo || event.directionY === true && !preInfo ) {
					return;
				}

				// 移除tips
				if ( tips ) {
					removeNode( tips );
					tips = null;
				}

				// 隐藏当前区域,隐藏箭头
				inDrag = true;
				removeCurrentPage();
				toggleState( document.body, "can-push", "can-not-push" );
				document.body.classList.remove( "loading-next-page" );
				document.body.classList.remove( "show-copy-tips" );
				document.body.classList.remove( "last-page" );

				function startNewPage( onEnd ) {
					var curPageInfo = pages[window.curPageIndex],
						curPage = null;

					if ( !curPageInfo.type ) {
						canvas.root = curPage = makePage( curPageInfo );
						canvas.dirty();
					}

					var end = canvas.requestAnimate( function () {
						end.remove();

						onEnd && onEnd();
						setPage( curPage || makePage( curPageInfo ) );

						// 判断是否滑到最后一页
						if ( curPageIndex === pageNumber - 1 ) {
							document.body.classList.add( "last-page" );
							hasToEnd = true;
						}

						// 如果下一页在读,锁屏幕
						document.body.classList.add( "loading-next-page" );
						fc.loadPage( curPageIndex + 1, function () {
							document.body.classList.remove( "loading-next-page" );
							toggleState( document.body, "can-not-push", "can-push" );
						} );

						// 解锁
						inDrag = false;
					} );
				}

				// 简化iphone6的切页动画,减少内存和cpu开销
				if ( ua.iphone6 ) {
					(function () {
						var isNext = !event.directionY,
							newPage = css( body.appendChild( PageLayer( makePage( isNext ? nextInfo : preInfo ) ) ) ),
							className = isNext ? "up" : "down";

						// 更新页码
						window.curPageIndex = getIndex( curPageIndex + ( isNext ? 1 : -1 ) );

						// 往下滑,滑出上一页
						canvas.classList.add( "cur-" + className );
						newPage.classList.add( "new-" + className );

						// 结束事件
						var end = dom.bindEvent( canvas, "webkitAnimationEnd", function () {
							end.remove();

							fp.trackPageView();

							startNewPage( function () {
								removeNode( newPage );

								// 清理class,移除前一个页面,并重制前一个页面的动画
								canvas.classList.remove( "cur-" + className );
								newPage.classList.remove( "new-" + className );
							} );
						} );
					})();
				}
				else {
					(function () {
						// 制作快照
						function Snapshot( info, page ) {
							return info || page ? css( page || body.appendChild( PageLayer( makePage( info ) ) ), "z-index", 5 + Math.abs( info ? 1 : 0 ) ) : null;
						}

						var preSnapshot = Snapshot( preInfo ),
							curSnapshot = Snapshot( null, canvas ),
							nextSnapshot = Snapshot( nextInfo ),
							top = 0,
							minTop = !nextSnapshot ? 0 : -clientHeight,
							maxTop = !preSnapshot ? 0 : clientHeight,
							moveCount = 0;

						function move( targetTop ) {
							top = targetTop;
							var ratio = Math.abs( top / clientHeight / 2 );
							css.transform( curSnapshot, css.translate( 0, top / 4, 0 ), css.scale( 1 - ratio ) );
							preSnapshot && css.transform( preSnapshot, css.translate( 0, top - clientHeight, 0 ) );
							nextSnapshot && css.transform( nextSnapshot, css.translate( 0, top + clientHeight, 0 ) );
						}

						move( 0 );

						event.onDragMove( function ( event ) {
							++moveCount;
							move( math.range( event.distanceY, minTop, maxTop ) );
						} );

						event.onDragEnd( function ( event ) {
							// 计算比例,根据比例选择切到哪页
							var ratio = top / clientHeight + ( event.speedY > 0 ? 0.5 : -0.5 ),
								sign = math.range( event.duration < 300 || moveCount < 3 ? event.distanceY < 0 ? -1 : 1 : ratio <= -0.5 ? -1 : ratio <= 0.5 ? 0 : 1,
									minTop / clientHeight, maxTop / clientHeight ),
								start = top,
								end = sign * clientHeight;

							// 如果翻到了新页,记录pv
							sign !== 0 && fp.trackPageView();

							animate( {
								duration : 0.4,
								onAnimate : function ( ratio ) {
									move( animate.fromTo( start, end, ratio ) );
								},
								onEnd : function () {
									window.curPageIndex = getIndex( curPageIndex - sign );

									// 移除body上的页面,更新index,设置当前页
									startNewPage( function () {
										loopArray( [preSnapshot, curSnapshot, nextSnapshot], removeNode );
										dom.removeCss( canvas, ["transform"] );
									} );
								}
							} );
						} );
					})();
				}
			} );
		} );

		// 直接跳转到某页
		fp.jumpPage = function ( index ) {
			removeCurrentPage();
			setPage( makePage( pages[index] ) );
		};
	};
})();

/**
 * Created by 白 on 2014/9/10.
 */

(function () {
	var util =zachModule["0"],
		loopArray = util.loopArray,
		loopObj = util.loopObj,
		insert = util.insert,
		extend = util.extend,
		Event = util.Event,
		List = util.LinkedList,

		math =zachModule["3"],
		range = math.range,

		animate =zachModule["6"],
		Timing = animate.Timing,

		array =zachModule["7"],

		dom =zachModule["2"],
		css = dom.css,
		removeNode = dom.removeNode,

		Canvas =zachModule["10"],

		Setter = {
			opacity : function ( val ) {
				return range( val, 0, 1 );
			},
			scale : function ( val ) {
				return Math.max( val, 0 )
			}
		};

	function Page() {
		function AbsoluteArea() {
			var area = Canvas.Area(),
				components = [],
				drawComponents = [];

			area.x = area.y = 0;
			area.componentWidth = clientWidth;
			area.componentHeight = clientHeight;

			// 绘制绝对布局区域
			area.draw = function ( gc ) {
				gc.save();

				if ( area.drawSelf ) {
					// 处理透明度
					if ( area.opacity !== 1 ) {
						gc.globalAlpha = area.opacity;
					}

					if ( area.transform !== 0 ) {
						gc.transform( area.transform );
					}

					// 处理变换,根据区域的中心进行变换
					if ( area.scale !== 1 || area.rotate !== 0 ) {
						gc.translate( area.componentWidth / 2 << 0, area.componentHeight / 2 << 0 );
						gc.scale( area.scale, area.scale );
						gc.rotate( area.rotate );
						gc.translate( -area.componentWidth / 2 << 0, -area.componentHeight / 2 << 0 );
					}

					area.drawSelf( gc );
				}
				else {
					gc.fillStyle = "#000000";
					gc.fillRect( 0, 0, clientWidth, clientHeight );
				}

				// 根据z-index进行排序并绘制
				drawComponents = [];
				loopArray( components.sort( function ( lhs, rhs ) {
					return lhs["z-index"] < rhs["z-index"] ? -1 : lhs["z-index"] === rhs["z-index"] ? 0 : 1;
				} ), function ( component ) {
					if ( component.visible ) {
						gc.save();
						gc.translate( component.x, component.y );
						component.draw( gc );
						drawComponents.push( component );
						gc.restore();
					}
				} );

				gc.restore();
			};

			area.areaFromPoint = function ( x, y ) {
				return loopArray( array.reverse( drawComponents ), function ( component ) {
					if ( math.inRect( x, y, component.x, component.y, component.componentWidth, component.componentHeight ) ) {
						return component;
					}
				} );
			};

			return insert( area, {
				component : function ( info ) {
					if ( info.content === undefined ) {
						info = {
							content : info
						};
					}

					var content = info.content,
						area = AbsoluteArea();

					loopObj( extend( componentAttr( info ), {
						visible : true
					} ), function ( name, value ) {
						var setter = Setter[name];
						util.defineAutoProperty( area, name, {
							value : value,
							set : function ( val ) {
								area.dirty();
								return setter ? setter( val ) : val;
							}
						} )
					} );

					components.push( area );
					return insert( area, {
						componentWidth : content.width,
						componentHeight : content.height,
						drawSelf : content.draw,
						transition : function ( info ) {
							return runAnimate( {
								component : area,
								delay : info.delay,
								duration : info.duration,
								timing : info.timing,
								onEnd : info.onEnd,
								progress : {
									0 : info.start,
									100 : info.end
								}
							} );
						},
						infiniteAnimate : function ( info ) {
							return runAnimate( extend( info, {
								component : area
							} ), true );
						},
						remove : function () {
							area.visible = false;
							area.dirty();
						}
					} );
				}
			} );
		}

		// 动画列表
		var parent = AbsoluteArea(),
			animationList = List(),
			startEnterKeyFrame = null,
			enterEndEvent = Event(),
			removeEvent = Event(),
			showEvent = Event(),
			lastEnterKeyFrame = null;

		// 运行动画
		function runAnimate( animationInfo, infinite ) {
			var area = animationInfo.component,
				baseStyle = animationInfo.baseStyle || componentAttr( area ),
				duration = animationInfo.duration,
				timing = animationInfo.timing || Timing.ease,
				frames = [],
				remove;

			if ( animationInfo.progress ) {
				loopObj( animationInfo.progress, function ( ratio, style ) {
					frames.push( {
						time : duration * ( parseInt( ratio, 10 ) / 100 ),
						style : extend( baseStyle, style || {} )
					} );
				} );

				// 头和尾的处理
				if ( frames[0].time !== 0 ) {
					frames.unshift( {
						time : 0,
						style : baseStyle
					} );
				}
				if ( frames.top.time !== duration ) {
					frames.push( {
						time : duration,
						style : baseStyle
					} );
				}
			}

			// 播放动画,并将动画句柄添加到动画
			function doAnimate( onEnd ) {
				return animate( {
					delay : animationInfo.delay,
					duration : duration,
					timing : Timing.linear,
					onStart : animationInfo.onStart,
					onAnimate : function ( totalRatio ) {
						if ( animationInfo.progress ) {
							var time = duration * totalRatio,
								targetFrame = null;

							// 找到所属的时间段
							if ( totalRatio === 1 ) {
								targetFrame = frames.length - 1;
							}
							else {
								loopArray( frames, function ( frame, i ) {
									if ( targetFrame === null && time < frame.time ) {
										targetFrame = i;
									}
								} );
							}

							// 计算当前的ratio,并设置属性
							var start = frames[targetFrame - 1], end = frames[targetFrame],
								ratio = timing( ( time - start.time ) / ( end.time - start.time ) );

							loopObj( start.style, function ( key ) {
								area[key] = animate.fromTo( start.style[key], end.style[key], ratio );
							} );
						}
						else {
							animationInfo.onAnimate( area, totalRatio, baseStyle );
						}

						parent.dirty();
					},
					onEnd : onEnd
				} );
			}

			// 如果不是循环动画,加入到动画列表中,可以点击快进
			if ( !infinite ) {
				var node = animationList.insert( List.Node( doAnimate( function () {
					animationInfo.onEnd && animationInfo.onEnd();
					animationList.remove( node );
				} ) ), null );

				remove = function () {
					animationList.remove( node );
					node.value.remove();
				};
			}
			// 循环动画递归播放
			else {
				var handle = doAnimate( function loopAnimate() {
					handle = doAnimate( loopAnimate );
				} );

				removeEvent.regist( remove = function () {
					handle.remove();
				} );
			}

			return {
				remove : remove
			};
		}

		// 运行一组动画
		function runKeyFrame( keyFrame ) {
			loopArray( keyFrame, function ( animation ) {
				runAnimate( animation );
			} );
		}

		// 绑定关键帧的结束回调
		function onKeyFrameEnd( keyFrame, onEnd ) {
			var count = keyFrame.length;
			if ( count === 0 ) {
				onEnd && onEnd();
			}
			else {
				loopArray( keyFrame, function ( animation ) {
					animation.onEnd = function () {
						animation.onEnter && animation.onEnter();
						if ( --count === 0 ) {
							onEnd && onEnd();
						}
					}
				} );
			}
		}

		return insert( parent, {
			// 回收该页
			recycle : function () {
				// 移除当前运行的所有动画
				List.loop( animationList, function ( animation, node ) {
					animation.remove();
					animationList.remove( node );
				} );

				removeEvent.trig();
			},
			// 注册进入动画
			registEnterAnimation : function ( keyFrameList ) {
				if ( keyFrameList.length === 0 ) {
					return;
				}

				// 将入场动画串联起来
				loopArray( keyFrameList, function ( keyFrame ) {
					// 将元素的属性设置为动画的起始属性,并记录动画的baseStyle
					loopArray( keyFrame, function ( animation ) {
						animation.baseStyle = componentAttr( animation.component );
						if ( animation.progress ) {
							insert( animation.component, animation.progress["0"] || {} );
						}
						else {
							animation.onAnimate( animation.component, 0, animation.component );
						}
					} );

					// 如果有上一帧,上一帧结束后播放本帧
					if ( lastEnterKeyFrame ) {
						onKeyFrameEnd( lastEnterKeyFrame, function () {
							runKeyFrame( keyFrame );
						} );
					}

					if ( startEnterKeyFrame === null ) {
						startEnterKeyFrame = keyFrame;
					}

					lastEnterKeyFrame = keyFrame;
				} );
			},
			// 快进到下一帧
			runNextFrame : function () {
				var isFast = false;

				// 快进当前动画
				List.loop( animationList, function ( animation ) {
					animation.progress( 1 );
					isFast = true;
				} );

				return isFast;
			},
			// 启动进场动画
			start : function () {
				showEvent.trig();

				// 如果有入场动画,启动入场动画,当入场动画最后一帧结束时触发enterEnd事件
				if ( startEnterKeyFrame ) {
					onKeyFrameEnd( lastEnterKeyFrame, enterEndEvent.trig );
					runKeyFrame( startEnterKeyFrame );
				}
				// 否则直接触发enterEnd事件
				else {
					enterEndEvent.trig();
				}
			},
			onShow : showEvent.regist,
			onRemove : removeEvent.regist,
			onEnterEnd : enterEndEvent.regist
		} );
	}

	window.PageLayer = function ( page ) {
		if ( page.nodeName ) {
			return page;
		}
		else {
			var layer = Canvas.Layer();
			layer.classList.add( "layer" );
			layer.resize( clientWidth, clientHeight );
			layer.draw( page.draw );
			return layer;
		}
	};

	window.CanvasSystem = function ( pages, fc ) {
		var body = window.body,
			canvas = body.appendChild( css( Canvas(), {
				position : "absolute",
				left : 0,
				top : 0,
				"z-index" : 4
			} ) ),
			curPage = null; // 当前页面;

		canvas.resize( clientWidth, clientHeight );

		fp.resize = function () {
			canvas.resize( clientWidth, clientHeight );
		};

		insert( fc, {
			canvas : canvas,

			// 根据一个页面制作一个area
			makePage : function ( pageInfo ) {
				if ( pageInfo.type ) {
					return pageInfo.create();
				}
				else {
					var area = Page();
					pageInfo.create( area );
					return area;
				}
			},

			// 将区域设置为当前区域,并启动入场动画
			setPage : function ( page ) {
				if ( page.nodeName ) {
					body.appendChild( page );
					removeNode( canvas );
				}
				else {
					!canvas.parentNode && body.appendChild( canvas );
					canvas.root !== page && ( canvas.root = page );
					canvas.dirty();
				}

				curPage = page;
				page.start();
			},

			// 移除当前区域
			removeCurrentPage : function () {
				canvas.root = null;
				curPage && curPage.nodeName && removeNode( curPage );
				curPage && curPage.recycle();
			}
		} );

		CanvasMode[pages.data.mode]( pages, fc );
	};

	fp.createPage = Page;
}());

/**
 * Created by 白 on 2014/9/10.
 */

(function ( fp ) {
	var util =zachModule["0"],
		loopArray = util.loopArray,
		loopObj = util.loopObj,
		insert = util.insert,
		extend = util.extend,
		tupleString = util.tupleString,
		Event = util.Event,

		dom =zachModule["2"],
		css = dom.css,
		px = css.px,
		s = css.s,
		bindEvent = dom.bindEvent,
		element = dom.element,
		removeNode = dom.removeNode,

		pointer =zachModule["4"],
		animate =zachModule["6"],

		animateCount = 0;

	function Page() {
		var parent = element( "div.page.animation-prepare" ),
			showEvent = Event(),
			removeEvent = Event(),
			curDelay = 0, // 目前的延迟
			enterElements = []; // 已经进入的元素

		parent.x = parent.y = 0;
		parent.componentWidth = clientWidth;
		parent.componentHeight = clientHeight;

		// 根据style,生成css对象
		function genCSS( style ) {
			var transform, origin;
			if ( style.transform === 0 ) {
				transform = [
					css.translate( style.x, style.y, 0 ),
					css.scale( Math.max( style.scale, 0.01 ) ),
					css.rotateZ( style.rotate )
				];
			}
			else {
				transform = [
					css.translate( style.x, style.y, 0 ),
					css.matrix( style.transform ),
					css.scale( Math.max( style.scale, 0.01 ) ),
					css.rotateZ( style.rotate )
				];
				origin = "left top 0";
			}

			return insert( {
				transform : transform.join( " " ),
				"transform-origin" : origin,
				opacity : style.opacity
			}, style["z-index"] === undefined ? {} : {
				"z-index" : style["z-index"]
			} );
		}

		function animationString( el, animation, delay, arg ) {
			// 根据progress,生成css规则字符串
			var animateId = "animate" + animateCount++,
				timing = animation.timing ? tupleString( "cubic-bezier", animation.timing.arg ) : "ease",
				progressString = "";

			loopObj( animation.progress, function ( ratio, attr ) {
				progressString += ratio + "% {" + dom.cssRuleString( genCSS( util.exclude( extend( componentAttr( el ), attr ), ["z-index"] ) ) ) + "}";
			} );

			dom.insertCSSRules( "@-webkit-keyframes " + animateId, progressString );
			return [animateId, timing, s( animation.duration ), s( delay || 0 ), arg].join( " " )
		}

		function AbsoluteElement( parent ) {
			return insert( parent, {
				component : function ( info ) {
					if ( info.content === undefined ) {
						info = {
							content : info
						};
					}

					var content = info.content,
						el = parent.appendChild( content.element() ),
						attr = componentAttr( info );

					// 设置样式
					css( el, extend( genCSS( attr ), {
						position : "absolute",
						left : 0,
						top : 0,
						width : px( content.width ),
						height : px( content.height )
					} ) );

					// 添加样式和尺寸属性
					loopArray( ["x", "y", "opacity", "scale", "rotate", "z-index"], function ( attrName ) {
						Object.defineProperty( el, attrName, {
							get : function () {
								return attr[attrName];
							},
							set : function ( val ) {
								attr[attrName] = val;
								css( el, genCSS( attr ) );
							}
						} );
					} );

					return AbsoluteElement( insert( el, {
						componentWidth : content.width,
						componentHeight : content.height,
						transition : function ( arg ) {
							var timing = arg.timing ? tupleString( "cubic-bezier", arg.timing.arg ) : "ease";
							css( el, "transition", [timing, s( arg.duration ), s( arg.delay || 0 )].join( " " ) );
							css( el, css( genCSS( extend( attr, arg.end ) ) ) );

							var end = bindEvent( el, "webkitTransitionEnd", function () {
								dom.removeCss( el, "transition" );
								arg.onEnd && arg.onEnd( el );
								end.remove();
							} );

							return {
								remove : function () {
								}
							};
						},
						infiniteAnimate : function ( arg ) {
							css( el, "animation", animationString( el, arg, 0, "infinite" ) );
						},
						remove : function () {
							dom.removeNode( el );
						}
					} ) );
				}
			} );
		}

		return insert( AbsoluteElement( parent ), {
			registEnterAnimation : function ( keyFrameList ) {
				loopArray( keyFrameList, function ( keyFrame ) {
					var duration = 0;

					loopArray( keyFrame, function ( animation ) {
						var el = animation.component,
							enterDelay = animation.delay || 0; // 进入延迟;

						// 进入动画和进入回调
						el.enterAnimation = animationString( el, animation, curDelay + enterDelay, "backwards" );
						el.onEnter = animation.onEnter;

						duration = Math.max( animation.duration + enterDelay, duration ); // 计算这一帧需要的延迟

						enterElements.push( el );
					} );

					curDelay += duration; // 更新延迟
				} );

				loopArray( enterElements, function ( el ) {
					// 设置进入动画
					css( el, "animation", el.enterAnimation );

					// 如果有进入回调,在进入动画结束之后回调
					if ( el.onEnter ) {
						var end = bindEvent( el, "webkitAnimationEnd", function () {
							el.onEnter( el );
							end.remove();
						} );
					}
				} );
			},
			start : function () {
				dom.toggleState( parent, "animation-prepare", "animation-run" );
				showEvent.trig();
			},
			onShow : showEvent.regist,
			recycle : removeEvent.trig,
			onRemove : removeEvent.regist
		} );
	}

	window.DOMSystem = function ( pages, fc ) {
		document.documentElement.classList.add( "dom-mode" );

		var body = window.body,
			curPage = null, // 当前页
			startPageIndex = window.curPageIndex,
			hasToEnd = false; // 是否到最后一张

		// 制作页面,返回页面元素,如果页面尚不能制作,返回空,如果页面已经制作,返回制作好的页面
		function newPage( index ) {
			var page,
				newIndex = getIndex( index ),
				pageInfo = pages[newIndex];

			if ( pageInfo && pageInfo.isLoad ) {
				page = pageInfo.special ? pageInfo.create() : pageInfo.create( Page() );
				window.curPageIndex = newIndex;
				body.appendChild( page );

				var loadingNextPageTips = element( "div.loading-next-page-tips.loading-next-page", page );
				fc.loadPage( newIndex + 1, function () {
					removeNode( loadingNextPageTips );
					element( "div.slide-arrow.can-push.switch-tips", page )
				} );

				// 判断是否滑到最后一页
				if ( newIndex === pageNumber - 1 ) {
					hasToEnd = true;
					document.body.classList.add( "last-page" );
				}

				// 记录pv
				fp.trackPageView();

				curPage = page;
				return true;
			}
		}

		// 当第二页加载完毕后显示
		fc.loadPage( startPageIndex === 0 ? [0, 1] : startPageIndex, function () {
			fc.startShow();

			// 建立页,并启动它
			newPage( startPageIndex );
			curPage.start();

			// 如果以第0页进入,构建提示
			var firstPageTips = null;
			if ( startPageIndex === 0 ) {
				firstPageTips = element( "div#slide-tips.switch-tips", body );
				document.body.classList.add( "first" );
			}

			pointer.onDragV( body, function ( event ) {
				// 如果有提示,移除它
				if ( firstPageTips ) {
					removeNode( firstPageTips );
					firstPageTips = null;
					document.body.classList.remove( "first" );
				}

				function cutNew( step, className ) {
					var oldPage = curPage;

					document.body.classList.remove( "show-copy-tips" );
					document.body.classList.remove( "last-page" );

					// 往下滑,滑出上一页
					if ( newPage( curPageIndex + step ) ) {
						fp.lock( true );

						oldPage && oldPage.recycle();
						oldPage.classList.add( "cur-" + className );
						curPage.classList.add( "new-" + className );

						// 结束事件
						var end = dom.bindEvent( curPage, "webkitAnimationEnd", function () {
							end.remove();

							// 清理class,移除前一个页面,并重制前一个页面的动画
							oldPage.classList.remove( "cur-" + className );
							curPage.classList.remove( "new-" + className );
							removeNode( oldPage );

							// 运行新页面的动画
							curPage.start();

							// 解除锁定
							fp.lock( false );
						} );
					}
				}

				if ( event.directionY ) {
					if ( !( curPageIndex === 0 && !hasToEnd ) ) {
						cutNew( -1, "down" );
					}
				}
				else {
					cutNew( 1, "up" );
				}
			} );
		} );

		// 直接跳转到某页
		fp.jumpPage = function ( index ) {
			curPage.recycle();
			removeNode( curPage );
			newPage( index );
			curPage.start();
		};
	};

	window.DOMPage = Page;
}( window.fp ));

/**
 * Created by 白 on 2014/11/13.
 */

(function () {
	var util =zachModule["0"],
		loopArray = util.loopArray,
		insert = util.insert,

		pointer =zachModule["4"],
		onTap = pointer.onTap,
		onPointerDown = pointer.onPointerDown,

		dom =zachModule["2"],
		removeNode = dom.removeNode,
		element = dom.element,
		css = dom.css,
		px = css.px,

		SlideListPanel =zachModule["11"],

		lib =zachModule["5"],

		animate =zachModule["6"],
		z3d =zachModule["12"],
		eye = z3d.matrix.unit,
		rotateX = z3d.matrix.rotateX,
		rotateY = z3d.matrix.rotateY,
		combine = z3d.combine,
		transform = z3d.transform,

		sphereRadius, // 球半径
		maxFragmentsCount, // 最大碎片数
		sphereData; // 球的数据

	// region 表情
	// 处理表情
	var faceList = ["微笑", "撇嘴", "色", "发呆", "得意", "流泪", "害羞", "闭嘴", "睡", "大哭", "尴尬",
		"发怒", "调皮", "呲牙", "惊讶", "难过", "酷", "冷汗", "抓狂", "吐", "偷笑", "愉快", "白眼",
		"傲慢", "饥饿", "困", "惊恐", "流汗", "憨笑", "悠闲", "奋斗", "咒骂", "疑问", "嘘", "晕",
		"疯了", "衰", "骷髅", "敲打", "再见", "擦汗", "抠鼻", "鼓掌", "糗大了", "坏笑", "左哼哼",
		"右哼哼", "哈欠", "鄙视", "委屈", "快哭了", "阴险", "亲亲", "吓", "可怜", "菜刀", "西瓜",
		"啤酒", "篮球", "乒乓", "咖啡", "饭", "猪头", "玫瑰", "凋谢", "嘴唇", "爱心", "心碎", "蛋糕",
		"闪电", "炸弹", "刀", "足球", "瓢虫", "便便", "月亮", "太阳", "礼物", "拥抱", "强", "弱",
		"握手", "胜利", "抱拳", "勾引", "拳头", "差劲", "爱你", "NO", "OK", "爱情", "飞吻", "跳跳",
		"发抖", "怄火", "转圈", "磕头", "回头", "跳绳", "投降"];

	var faces = [];
	loopArray( faceList, function ( faceName, i ) {
		faces[faceName] = faces[i] = {
			name : faceName,
			element : function ( size ) {
				return element( "div.face-icon", {
					css : {
						"background-position" : -i * size + "px 0",
						"background-size" : "auto " + size + "px",
						width : px( size ),
						height : px( size )
					}
				} );
			}
		};
	} );

	// 评论的html,替换其中的表情
	function commentHTML( text, fontSize ) {
		return text.replace( /\[([^\]]*)]/g, function ( faceName ) {
			if ( RegExp.$1 in faces ) {
				return faces[RegExp.$1].element( fontSize ).outerHTML;
			}
			else {
				return faceName;
			}
		} );
	}

	// 随机器
	function RandomMachine( size ) {
		var selected = undefined;
		return {
			value : function ( val ) {
				if ( val === undefined ) {
					var array = [];
					util.loop( size, function ( i ) {
						i !== selected && array.push( i );
					} );
					return selected = array[Math.random() * array.length << 0];
				}
				else {
					selected = val;
				}
			}
		};
	}

	// endregion

	// region 输入框
	function InputBar() {
		var inputBar = element( "div.comment-input-bar.normal", [
				element( "form.text-area.need-default", [
					element( "div.text-area-wrapper", [element( "textarea", {
						placeholder : "评论"
					} )] ),
					element( "div.send-button", "发送" ),
					element( "div.small-icon.icon-keyboard", [element( "div" )] ),
					element( "div.small-icon.icon-face", [element( "div" )] )
				] ),
				element( "div.face-list", [
					element( "ul" ),
					element( "div.red-point", [element( "div.wrapper" )] )
				] )
			] ),
			sendButton = inputBar.querySelector( ".send-button" ),
			textarea = inputBar.querySelector( "textarea" ),

			oFaceList = inputBar.querySelector( "ul" ), curFaceLi = null,
			faceListPanel = null,

			commitEvent = util.Event();

		// 输入时调整位置和发送状态
		function adjustSize() {
			dom.switchClass( sendButton, textarea.value === "", "disabled" );
			css( textarea, "height", 0 );
			css( textarea, "height", textarea.scrollHeight - 6 + "px" );
		}

		// 创建表情列表
		loopArray( faces, function ( item, i ) {
			if ( i % 20 === 0 ) {
				curFaceLi = element( "li.face-list-page", [element( "div.content" )], oFaceList );
			}

			var faceItem = element( "div.face-list-item", [
				item.element( 30 ),
				element( "div.face-list-item-tips.small-icon", [item.element( 40 ), element( "div.caption", item.name )] )
			], curFaceLi.querySelector( ".content" ) );

			faceItem.face = item;
		} );

		// 为每一页添加一个删除键,点击时,如果当前文本最后是表情的话,删除表情
		loopArray( inputBar.querySelectorAll( ".face-list-page" ), function ( li ) {
			onTap( element( "div.delete-face.icon", li.querySelector( ".content" ) ), function () {
				if ( /\[([^\]]*)]$/.test( textarea.value ) ) {
					var deleteLength = RegExp.$1.length + 2;
					textarea.value = textarea.value.substring( 0, textarea.value.length - deleteLength );
				}
				adjustSize();
			} );
		} );

		// 点击键盘按钮,键盘聚焦
		pointer.onPointerUp( inputBar.querySelector( ".icon-keyboard" ), function ( event ) {
			event.preventDefault();
			inputBar.classList.remove( "face-select" );
			textarea.focus();
		} );

		// 键盘聚焦时移除表情选择
		dom.bindEvent( textarea, "focus", function () {
			inputBar.classList.remove( "face-select" );
		} );

		// 点击表情按钮,切换到表情选择
		onPointerDown( inputBar.querySelector( ".icon-face" ), function ( event ) {
			event.preventDefault();
			textarea.blur();
			inputBar.classList.add( "face-select" );

			// 第一次显示slideListPanel时,注册事件
			if ( faceListPanel === null ) {
				faceListPanel = SlideListPanel( oFaceList.parentNode );
				lib.doRedPoints( faceListPanel );
				faceListPanel.display( 0 );

				onPointerDown( faceListPanel, function ( event ) {
					// 当前表情
					var curFace = null;

					// 处理表情,找到当前手指位置的表情,如果是表情,激活它
					function doFace( event, addClass ) {
						event.preventDefault();
						var el = document.elementFromPoint( event.zClientX, event.zClientY ),
							faceListItem = dom.findAncestor( el, function ( el ) {
								return el.classList.contains( "face-list-item" );
							} );

						if ( addClass !== false ) {
							curFace !== null && curFace.classList.remove( "active" );
							faceListItem !== null && faceListItem.classList.add( "active" );
						}
						curFace = faceListItem;
					}

					// 如果0.3秒内没有进入滑动,进入表情选择
					var timeout = setTimeout( function () {
						faceListPanel.disable( true );
						doFace( event );
						event.onMove( doFace );
					}, 200 );

					// 开始滑动时,取消表情选择
					var swipe = faceListPanel.onSlideStart( function () {
						clearTimeout( timeout );
						timeout = null;
					} );

					var lastEvent = event;
					event.onMove( function ( event ) {
						lastEvent = event;
					} );

					event.onUp( function () {
						if ( timeout ) {
							clearTimeout( timeout );
							doFace( lastEvent, false );
						}
						if ( curFace ) {
							curFace.classList.remove( "active" );
							textarea.value = textarea.value + "[" + curFace.face.name + "]";
							adjustSize();
						}
						faceListPanel.disable( false );
						swipe.remove();
					} );
				} );
			}
		} );

		// 点击发送按钮,发送消息
		onTap( sendButton, function () {
			if ( !inputBar.classList.contains( ".empty" ) ) {
				inputBar.classList.remove( "face-select" );
				commitEvent.trig( textarea.value );
			}
		} );

		// 当插入到文档中时,以及输入时调整尺寸
		dom.bindEvent( textarea, "input", adjustSize );
		dom.onInsert( inputBar, adjustSize );

		return insert( inputBar, {
			onCommit : commitEvent.regist,
			value : function ( val ) {
				if ( val !== undefined ) {
					textarea.value = val;
				}
				else {
					return textarea.value;
				}
			},
			focus : function () {
				textarea.focus();
			},
			blur : function () {
				textarea.blur();
			},
			onFocus : function ( task ) {
				return dom.bindEvent( textarea, "focus", task );
			},
			onBlur : function ( task ) {
				return dom.bindEvent( textarea, "blur", task );
			}
		} );
	}

	// endregion

	// region util
	function rotate( matrix, x, y ) {
		return combine( combine( rotateX( -y ), rotateY( x ) ), matrix );
	}

	if ( ua.win32 ) {
		sphereRadius = 126;
		maxFragmentsCount = 60;
	}
	else if ( ua.iphone6 ) {
		sphereRadius = 136;
		maxFragmentsCount = 40;
	}
	else if ( ua.iphone5 ) {
		sphereRadius = 126;
		maxFragmentsCount = 30;
	}
	else if ( ua.iphone4 ) {
		sphereRadius = 100;
		maxFragmentsCount = 20;
	}
	else {
		sphereRadius = 120;
		maxFragmentsCount = 25;
	}

	// 将一个向量转化为方向
	function getDirection( x, y ) {
		var v = Math.sqrt( x * x + y * y );
		return [x / v, y / v];
	}

	// 获取一个点的经纬度
	function getLatLng( p ) {
		var x = p[0], y = p[1], z = p[2],
			r = Math.sqrt( x * x + y * y + z * z );

		return {
			lat : Math.acos( y / r ) - Math.PI / 2,
			lng : p[2] >= 0 ? Math.atan( x / z ) : Math.atan( x / z ) + Math.PI
		}
	}

	// 设置碎片的位置和旋转
	function setTransform( fragment, p, rotateX, rotateY ) {
		css.transform( fragment, css.translate.apply( null, fragment.position = p ),
			css.rotateY( fragment.rotateY = rotateY ),
			css.rotateX( fragment.rotateX = rotateX ) );
	}

	function preventDefault( wc, preventDrag ) {
		if ( preventDrag || window.inClickMode ) {
			// 对评论墙进行触摸操作,不触发换页
			return onPointerDown( wc.fragmentsParent, function ( event ) {
				event.preventDefault();
				if ( wc.fragments.length > 0 ) {
					event.stopPropagation();
				}
			} );
		}
	}

	// endregion

	// region 球
	function Sphere( wc ) {
		var fragments = wc.fragments,
			parent = wc.fragmentsParent,
			r = sphereRadius,
			data = sphereData[Math.max( fragments.length, 4 )],
			curMatrix = null, // 变换矩阵
			curDirection = getDirection( Math.random(), Math.random() ), // 转动方向
			toV = 0.003, curV = toV; // 当前速度和目标速度

		// 设置大小
		wc.setSize( r * 2, r * 2 );

		// 设置预位置
		loopArray( fragments, function ( fragment, i ) {
			var p = fragment.prePosition = [data[i * 3] * r, data[i * 3 + 1] * r, data[i * 3 + 2] * r, 1], // 碎片的球面位置
				latLng = getLatLng( p );

			fragment.isIn = false;
			fragment.preRotateX = latLng.lat;
			fragment.preRotateY = latLng.lng;
			fragment.preRotateZ = 0;
		} );

		// 对球进行变换
		function transformSphere( matrix ) {
			curMatrix = matrix;

			// 计算并设置每个碎片变换后的位置
			loopArray( fragments, function ( fragment ) {
				var p = fragment.position = transform( curMatrix, fragment.prePosition ),
					latLng = getLatLng( p );

				setTransform( fragment, p, latLng.lat, latLng.lng );
			} );
		}

		// 拖拽旋转球体
		var dragHandle = pointer.onDrag( parent, function ( event ) {
				var startMatrix = curMatrix;

				fp.lock( true, parent );
				parent.classList.add( "lock" );
				wc.stopAnimate();
				wc.removeTips();

				event.onDragMove( function ( event ) {
					transformSphere( rotate( startMatrix, event.distanceX / 200, event.distanceY / 200 ) );
				} );

				event.onDragEnd( function ( event ) {
					var vx = event.speedX, vy = event.speedY,
						v = Math.sqrt( vx * vx + vy * vy );

					fp.lock( false, parent );

					curV = v / 10;
					if ( curV !== 0 ) {
						curDirection = [vx / v, vy / v];
					}
					wc.runAnimate();
				} );
			} ),
			preventHandle = preventDefault( wc, true );

		return {
			start : function () {
				transformSphere( eye() );
			},

			canTipsShow : function ( fragment ) {
				return fragment.position[2] > r * 0.2
			},

			onAnimate : function ( count ) {
				var tipsNum = wc.tipsNum();

				curV = curV + ( toV - curV ) / 20; // 速度逼近toV
				transformSphere( rotate( curMatrix, curDirection[0] * curV, curDirection[1] * curV ) ); // 旋转球体

				// 当动画运行20帧,并且速度稳定时,开始弹窗
				if ( ++count > 20 && Math.abs( curV - toV ) < 0.001 ) {
					var showTips = false; // 一次移动最多触发一个弹出提示
					loopArray( fragments, function ( fragment ) {
						// 根据碎片的Z轴位置,调整它的in位
						// 如果一个碎片由非in转为in,根据随机数和当前的数量,决定它是否弹出提示
						if ( !fragment.isIn && fragment.position[2] > r * 0.85 ) {
							var random = Math.random();
							fragment.isIn = true;
							if ( !showTips && fragment.comment &&
								( tipsNum === 0 && random < 0.9 || tipsNum === 1 && random < 0.4 || tipsNum < 2 && random < 0.2 ) ) {
								showTips = fragment.showTips();
							}
						}
						// 如果一个碎片由in转为非in,如果有提示,移除它
						else if ( fragment.isIn && fragment.position[2] < r * 0.85 ) {
							fragment.isIn = false;
							if ( fragment.tips ) {
								fragment.tips.remove( true );
							}
						}
					} );
				}
			},

			onAnimateStop : function () {
				curV = toV;
			},

			remove : function () {
				dragHandle.remove();
				preventHandle && preventHandle.remove();
			}
		};
	}

	// endregion

	// region Helix
	function Helix( wc ) {
		var fragments = wc.fragments,
			parent = wc.fragmentsParent,
			r = 120,
			marginY = Math.min( ( clientHeight - 60 ) / fragments.length - 3 << 0, 30 ),
			marginX = Math.max( 10 / fragments.length, 0.4 ),
			curMatrix = null, // 变换矩阵
			curDirection = true, // 转动方向
			toV = 0.003, curV = toV; // 当前速度和目标速度

		// 设置大小
		wc.setSize( r * 2, clientHeight );

		// 设置预位置
		loopArray( fragments, function ( fragment, i ) {
			i = i % 2 ? ( i + 1 ) / 2 : -i / 2;
			var p = fragment.prePosition = [r * Math.sin( i * marginX ), i * marginY, r * Math.cos( i * marginX ), 1];

			fragment.isIn = false;
			fragment.preRotateX = 0;
			fragment.preRotateY = Math.atan( p[0] / p[2] );
			fragment.preRotateZ = 0;
		} );

		// 对螺旋进行变换
		function transformHelix( matrix ) {
			curMatrix = matrix;

			// 计算并设置每个碎片变换后的位置
			loopArray( fragments, function ( fragment ) {
				var p = fragment.position = transform( curMatrix, fragment.prePosition ),
					lng = Math.atan( p[0] / p[2] );

				setTransform( fragment, p, 0, lng );
				fragment.tips && fragment.tips.adjust();
			} );
		}

		// 拖拽旋转螺旋
		var dragHandle = pointer.onDragH( parent, function ( event ) {
				var startMatrix = curMatrix;

				fp.lock( true, parent );
				parent.classList.add( "lock" );
				wc.stopAnimate();
				wc.removeTips();

				event.onDragMove( function ( event ) {
					transformHelix( rotate( startMatrix, event.distanceX / 200, 0 ) );
				} );

				event.onDragEnd( function ( event ) {
					var vx = event.speedX;

					fp.lock( false, parent );

					curV = Math.abs( vx ) / 10;
					curDirection = vx > 0;
					wc.runAnimate();
				} );
			} ),
			preventHandle = preventDefault( wc );

		return {
			start : function () {
				transformHelix( eye() );
			},

			canTipsShow : function ( fragment ) {
				return fragment.position[2] > r * 0.2
			},

			onAnimate : function ( count ) {
				var showTips = false; // 一次移动最多触发一个弹出提示

				curV = curV + ( toV - curV ) / 20; // 速度逼近toV
				transformHelix( rotate( curMatrix, ( curDirection ? 1 : -1 ) * curV, 0 ) ); // 旋转球体

				// 当动画运行20帧,并且速度稳定时,开始弹窗
				if ( ++count > 20 && Math.abs( curV - toV ) < 0.001 ) {
					loopArray( fragments, function ( fragment ) {
						// 根据碎片的Z轴位置,调整它的in位
						// 如果一个碎片由非in转为in,根据随机数和当前的数量,决定它是否弹出提示
						if ( !fragment.isIn && fragment.position[2] > r * 0.8 ) {
							fragment.isIn = true;
							if ( !showTips && fragment.comment && Math.random() < 0.25 ) {
								showTips = fragment.showTips();
							}
						}
						// 如果一个碎片由in转为非in,如果有提示,移除它
						else if ( fragment.isIn && fragment.position[2] < r * 0.8 ) {
							fragment.isIn = false;
							if ( fragment.tips ) {
								fragment.tips.remove( true );
							}
						}
					} );
				}
			},

			onAnimateStop : function () {
				curV = toV;
			},

			remove : function () {
				dragHandle.remove();
				preventHandle && preventHandle.remove();
			}
		};
	}

	// endregion

	// region 评论墙
	var CommentEffect = [Sphere, Helix];

	function CommentWall( parent, commentData ) {
		var fragmentSize = 30, // 碎片的尺寸

			fragmentsParent = element( "div.fragments-parent", parent ),
			tipsParent = element( "div.tips-parent", parent ),

			fragments = [],

			noNewTips = false, // 没有新的提示
			tipsNum = 0, // 弹框数量

			animateHandle = null,
			mode = null,

			randomMachine = RandomMachine( CommentEffect.length );

		// 运行动画
		function runAnimate() {
			var count = 0;

			// 调整碎片位置
			animateHandle = dom.requestAnimate( function () {
				loopArray( fragments, function ( fragment ) {
					if ( fragment.tips ) {
						fragment.tips.adjust();
					}
				} );

				mode.onAnimate && mode.onAnimate( count++ );
			} );
		}

		// 停止动画
		function stopAnimate() {
			mode.onAnimateStop && mode.onAnimateStop();
			animateHandle && animateHandle.remove();
		}

		// 移除提示
		var removeTips = function () {
			var delayTimeout = null;

			return function ( delay ) {
				loopArray( fragments, function ( fragment ) {
					fragment.tips && fragment.tips.remove();
				} );

				if ( delay ) {
					noNewTips = true;
					delayTimeout && clearTimeout( delayTimeout );
					delayTimeout = setTimeout( function () {
						noNewTips = false;
						delayTimeout = null;
					}, delay );
				}
			}
		}();

		// 评论碎片
		function CommentFragment( comment, onLoad ) {
			var fragment = element( "div.item" ),
				img = new Image();

			img.onload = function () {
				dom.onInsert( img, function () {
					css( img, lib.getImageCoverStyle( img, fragmentSize, fragmentSize ) );
				} );
				fragment.appendChild( img );
				fragment.comment = comment;
				onLoad && onLoad();
			};
			img.src = comment.avatar || staticImgSrc( "firstPage-defaultAvatar.png" );

			// 弹出提示,有缩放效果
			fragment.showTips = function ( force ) {
				if ( force || !noNewTips ) {
					fragment.tips && removeNode( fragment.tips );
					Tips( fragment, true );
					++tipsNum;
					return true;
				}
			};

			onTap( fragment, function () {
				if ( !mode.canTipsShow || mode.canTipsShow( fragment ) ) {
					removeTips();
					stopAnimate();

					var tips = Tips( fragment ),
						removeHandler = pointer.onPointerUp( document, function () {
							removeHandler.remove();
							tips.remove();
							runAnimate();
						}, true );

					tips.adjust();
				}
			} );

			return fragment;
		}

		// 制作碎片
		loopArray( commentData, function ( commentInfo ) {
			var fragment = CommentFragment( commentInfo );
			fragmentsParent.appendChild( fragment );
			fragments.push( fragment );
		} );

		// 提示框
		function Tips( fragment, hasAnimate ) {
			var position = fragment.position,
				comment = fragment.comment,

				tips = element( "div.tips", {
					children : [
						element( "div.name.ellipsis", comment.userName ),
						element( "div.date", lib.dateString( comment.date, "M%-D% h%:m%" ) ),
						element( "div.text", commentHTML( comment.text, 12 ) )
					]
				}, tipsParent ),
				tipsTriangle = element( "div.triangle", tips ),

				tipsX = Math.min( position[0] + 40, ( clientWidth - tips.offsetWidth ) / 2 - 28 ),
				relativeX = tipsX - position[0],
				relativeY = -tips.offsetHeight / 2 - 25,

				scale = 1;

			css( tips, {
				"margin-top" : px( -tips.offsetHeight / 2 ),
				"-webkit-transform-origin" : [px( position[0] + 40 - tipsX + 15 ), "100%", 0].join( " " ),
				visibility : "hidden"
			} );

			css( tipsTriangle, "left", px( position[0] + 40 - tipsX + 15 ) );

			hasAnimate && animate( {
				start : 0.01,
				duration : 0.2,
				onAnimate : function ( ratio ) {
					scale = ratio;
				}
			} );

			function adjust() {
				position = fragment.position;
				css( tips, "visibility", "visible" );
				css.transform( tips, css.translate( position[0] + relativeX, position[1] + relativeY, position[2] ), css.scale( scale ) );
			}

			tips.fragment = fragment;
			fragment.tips = tips;

			return insert( tips, {
				adjust : adjust,
				remove : function ( hasAnimate ) {
					--tipsNum;
					util.request( function ( remove ) {
						!hasAnimate ? remove() : animate( {
							start : 1,
							end : 0.01,
							duration : 0.2,
							onAnimate : function ( ratio ) {
								scale = ratio;
							},
							onEnd : remove
						} );
					}, function () {
						fragment.tips = null;
						removeNode( tips );
					} );
				}
			} );
		}

		// 评论墙上下文
		var wallContext = {
			newComment : function ( commentInfo, onImageLoad ) {
				var newFragment = CommentFragment( commentInfo, function () {
					onImageLoad && onImageLoad();

					stopAnimate();
					fp.lock( true );

					// 将新碎片加载到球中,并缩小
					css.transform( newFragment, css.scale( 0.01 ) );
					fragmentsParent.appendChild( newFragment );

					// 如果数量超出最大数量,移除最后一个
					if ( fragments.length > maxFragmentsCount ) {
						removeNode( fragments.pop() );
					}

					// 将新评论放在第一个
					fragments.unshift( newFragment );

					// 重新制作球
					mode && mode.remove();
					mode = CommentEffect[randomMachine.value()]( wallContext );

					// 将碎片的位置移动到预位置
					animate( {
						duration : 0.5,
						onAnimate : function ( ratio ) {
							loopArray( fragments, function ( fragment ) {
								var n = fragment.prePosition, o = fragment.position;

								if ( fragment !== newFragment ) {
									function p( index ) {
										return animate.fromTo( o[index], n[index], ratio );
									}

									setTransform( fragment, [p( 0 ), p( 1 ), p( 2 )],
										animate.fromTo( fragment.rotateX, fragment.preRotateX, ratio ),
										animate.fromTo( fragment.rotateY, fragment.preRotateY, ratio ) );
								}
								else {
									css.transform( newFragment, css.translate( 0, 0, n[2] ), css.scale( ratio ) );
								}
							} );
						},
						onEnd : function () {
							// 解锁,进行单位变化,重新运行动画并弹出新碎片的提示
							fp.lock( false );
							mode.start();
							runAnimate();
							newFragment.showTips( true );
						}
					} );
				} );
			},
			fragmentsParent : fragmentsParent,
			fragments : fragments,

			setSize : function ( width, height ) {
				loopArray( [fragmentsParent, tipsParent], function ( parent ) {
					css( parent, {
						height : px( height ),
						width : px( width ),
						"margin-left" : px( -width / 2 << 0 ),
						"margin-top" : px( -height / 2 << 0 )
					} );
				} );
			},

			tipsNum : function () {
				return tipsNum;
			},

			runAnimate : runAnimate,
			stopAnimate : stopAnimate,
			removeTips : removeTips
		};

		// 创建一个模式
		mode = CommentEffect[randomMachine.value()]( wallContext );
		mode.start();

		return insert( parent, wallContext );
	}

	// endregion

	// region 评论页
	// 报名表单页
	registSpecialPage( "comment", function ( done ) {
		var summaryId;

		util.procedure( [
			// 获取球数据
			function ( callback ) {
				dom.ajax( {
					url : contentSrc( "sphere.json" ),
					isJson : true,
					onLoad : function ( data ) {
						sphereData = data;
						callback();
					}
				} );
			},

			// 获取contentSummary
			function ( callback ) {
				fp.getCommentSummary( callback, fp.getWorkInfo() );
			},

			// 获取评论
			function ( callback, id ) {
				summaryId = id;
				fp.getComments( callback, {
					contentSummaryId : summaryId
				} );
			},

			// 根据评论制作评论墙
			function ( comments ) {
				var commentWall = CommentWall( element( "div.comment-wall" ), comments.slice( 0, maxFragmentsCount ) );
				if ( commentWall.fragments.length === 0 ) {
					commentWall.classList.add( "empty" );
				}

				done( {
					create : function ( page ) {
						var inputBar = page.appendChild( InputBar() ),
							lastMsg = fp.getSessionData( "comment" ),
							blurHandle;

						// 聚焦时,点击其他地方失焦
						inputBar.onFocus( function () {
							blurHandle = onPointerDown( commentWall, inputBar.blur );
						} );

						inputBar.onBlur( function () {
							blurHandle.remove();
							blurHandle = null;
						} );

						function sendMsg( text, onDone ) {
							var userInfo, loading;

							util.procedure( [
								// 获取用户信息
								function ( callback ) {
									fp.getUserInfo( callback );
								},

								// 保存评论
								function ( callback, tUserInfo ) {
									userInfo = tUserInfo;
									loading = fp.Loading( page, 300 );
									inputBar.blur();
									inputBar.classList.add( "lock" );

									fp.saveComment( callback, {
										text : text,
										contentSummaryId : summaryId
									} );
								},

								// 新建评论
								function () {
									commentWall.newComment( {
										avatar : userInfo.HeadPhoto,
										userName : userInfo.NickName,
										date : new Date(),
										text : text
									}, function () {
										loading.remove();
										inputBar.classList.remove( "lock" );
										inputBar.value( "" );
										commentWall.removeTips( 2000 ); // 移除提示,2秒钟内没有新提示
										commentWall.classList.remove( "empty" );
									} );

									onDone && onDone();
								}
							] );
						}

						lastMsg && fp.isLogIn() && sendMsg( lastMsg, function () {
							fp.alert( "评论发表成功" );
						} );

						inputBar.onCommit( function ( text ) {
							if ( fp.isLogIn() ) {
								sendMsg( text );
							}
							else if ( fp.canNotLogin ) {
								fp.canNotLogin();
							}
							else {
								sessionStorage.setItem( "comment", text );
								sessionStorage.setItem( "lastPageIndex", curPageIndex );
								fp.logIn();
							}
						} );

						page.classList.add( "comment-page" );
						page.appendChild( commentWall );
						page.onShow( commentWall.runAnimate );
						page.onRemove( function () {
							commentWall.stopAnimate();
							commentWall.removeTips();
						} );
					}
				} );
			}
		] );
	} );
	// endregion
})();

/**
 * Created by 白 on 2014/9/11.
 */

(function () {
	var animate =zachModule["6"],
		z2d =zachModule["9"];

	function deg( d ) {
		return d / 180 * Math.PI;
	}

	// region 进入动画
	registEnterAnimate( {
		// 飞入
		flyInto : {
			progress : function ( component, direct ) {
				var startX = component.x, startY = component.y;

				switch ( direct ) {
					case "left":
						startX = -component.componentWidth;
						break;
					case "right":
						startX = clientWidth;
						break;
					case "top":
						startY = -component.componentHeight;
						break;
					case "bottom":
						startY = clientHeight;
						break;
				}

				return {
					"0" : {
						x : startX,
						y : startY
					}
				};
			}
		},

		// 浮现
		emerge : {
			progress : function ( component, direct ) {
				var offsetX = 0, offsetY = 0;
				switch ( direct ) {
					case "left":
						offsetX = -20;
						break;
					case "right":
						offsetX = 20;
						break;
					case "top":
						offsetY = -20;
						break;
					default :
						offsetY = 20;
						break;
				}

				return {
					"0" : {
						x : component.x + offsetX,
						y : component.y + offsetY,
						opacity : 0
					}
				};
			}
		},

		// 缩放
		scale : {
			progress : function () {
				return {
					"0" : {
						scale : 0
					}
				};
			}
		},

		// 缩小
		shrink : {
			duration : 0.6,
			timing : animate.Bezier( .52, .21, .8, .51 ),
			progress : function () {
				return {
					"0" : {
						scale : 5,
						opacity : 0
					}
				}
			}
		},

		// 淡入
		fadeIn : {
			progress : function () {
				return {
					"0" : {
						opacity : 0
					}
				};
			}
		},

		// 回旋
		circleRound : {
			progress : function () {
				return {
					"0" : {
						scale : 0,
						opacity : 0,
						rotate : Math.PI * 2.5
					}
				}
			},
			duration : 0.6
		},

		// 翻转式由远及近
		roundFromFarAndNear : {
			progress : function () {
				return {
					"0" : {
						scale : 0,
						opacity : 0,
						rotate : Math.PI * 0.65
					}
				};
			}
		},

		// 落下并抖动
		fallDownAndShake : {
			timing : animate.Timing.easeOut,
			duration : 0.7,
			progress : function ( component ) {
				var rotate = component.rotate;
				return {
					"0" : {
						y : -component.componentHeight * 2,
						rotate : rotate + deg( -15 )
					},
					"40" : {
						rotate : rotate + deg( -15 )
					},
					"45" : {
						rotate : rotate + deg( 13 )
					},
					"52" : {
						rotate : rotate + deg( -8 )
					},
					"62" : {
						rotate : rotate + deg( 5 )
					},
					"74" : {
						rotate : rotate + deg( -3 )
					},
					"87" : {
						rotate : rotate + deg( 1 )
					}
				};
			}
		}
	} );

	registEnterAnimate( {
		// 曲线向上
		curveUp : {
			onAnimate : function ( area, ratio, baseStyle ) {
				var a = 100, theta = ( 1 - ratio ) * 3;
				area.scale = ( 1 - ratio ) * 0.4 + 1;
				area.opacity = ratio;
				area.x = baseStyle.x + a * theta * Math.cos( theta );
				area.y = baseStyle.y + a * theta * Math.sin( theta );
			},
			duration : 1,
			fallback : enterAnimate.circleRound
		}
	} );
	// endregion

	// region
	registEnterAnimate( {
		// 闪烁
		flash : {
			timing : animate.Timing.linear,
			duration : 1,
			progress : function () {
				return {
					"0 50 100" : {
						opacity : 1
					},
					"25 75" : {
						opacity : 0
					}
				};
			}
		},

		// 震动
		shake : {
			timing : animate.Timing.linear,
			duration : 1,
			progress : function ( component ) {
				return {
					"10 30 50 70 90" : {
						x : component.x - 10
					},
					"20 40 60 80" : {
						x : component.x + 10
					}
				};
			}
		},

		// 摆动
		swing : {
			duration : 1,
			progress : function ( component ) {
				function rotate( angle ) {
					return z2d.transformOrigin( z2d.matrix.rotate( component.rotate + deg( angle ) ),
						component.componentWidth / 2 << 0, 0 );
				}

				return {
					"0 100" : {
						transform : rotate( 0 )
					},
					"20" : {
						transform : rotate( 15 )
					},
					"40" : {
						transform : rotate( -10 )
					},
					"60" : {
						transform : rotate( 5 )
					},
					"80" : {
						transform : rotate( -5 )
					}
				};
			}
		},

		// tada
		tada : {
			timing : animate.Timing.linear,
			duration : 1,
			progress : function ( component ) {
				return {
					"10 20" : {
						scale : 0.9,
						rotate : component.rotate + deg( -3 )
					},
					"30 50 70 90" : {
						scale : 1.1,
						rotate : component.rotate + deg( 3 )
					},
					"40 60 80" : {
						scale : 1.1,
						rotate : component.rotate + deg( -3 )
					}
				};
			}
		},

		// 摇晃
		wobble : {
			timing : animate.Timing.linear,
			duration : 0.8,
			progress : function ( component ) {
				var width = component.componentWidth;

				return {
					"15" : {
						x : component.x + width * -0.25,
						rotate : component.rotate + deg( -5 )
					},
					"30" : {
						x : component.x + width * 0.2,
						rotate : component.rotate + deg( 3 )
					},
					"45" : {
						x : component.x + width * -0.15,
						rotate : component.rotate + deg( -3 )
					},
					"60" : {
						x : component.x + width * 0.1,
						rotate : component.rotate + deg( 2 )
					},
					"75" : {
						x : component.x + width * -0.05,
						rotate : component.rotate + deg( -1 )
					}
				};
			}
		},

		// 弹入
		bounceIn : {
			timing : animate.Bezier( 0.215, 0.610, 0.355, 1.000 ),
			duration : 0.75,
			progress : function () {
				return {
					"0" : {
						opacity : 0,
						scale : 0.3
					},
					"20" : {
						scale : 1.1
					},
					"40" : {
						scale : 0.9
					},
					"60" : {
						scale : 1.03
					},
					"80" : {
						scale : 0.97
					}
				};
			}
		},

		bounceFlying : {
			timing : animate.Bezier( 0.215, 0.610, 0.355, 1.000 ),
			duration : 0.75,
			progress : function ( component, dir ) {
				var x = component.x,
					y = component.y,
					signX = 0, signY = 0;

				switch ( dir ) {
					case "left":
						signX = 1;
						break;
					case "right":
						signX = -1;
						break;
					case "top":
						signY = 1;
						break;
					case "bottom":
						signY = -1;
						break;
				}

				return {
					"0" : {
						x : -3000 * signX,
						y : -3000 * signY
					},
					"60" : {
						x : x + 25 * signX,
						y : y + 25 * signY
					},
					"75" : {
						x : x + -10 * signX,
						y : y + -10 * signY
					},
					"90" : {
						x : x + 5 * signX,
						y : y + 5 * signY
					}
				};
			}
		},

		// 摆动
		rubberBand : {
			duration : 1,
			progress : function ( component ) {
				function scale( x, y ) {
					return z2d.transformOrigin( z2d.matrix.scale( x, y ),
						component.componentWidth / 2 << 0, component.componentHeight / 2 << 0 );
				}

				return {
					"0 100" : {
						transform : scale( 1, 1 )
					},
					"30" : {
						transform : scale( 1.25, 0.75 )
					},
					"40" : {
						transform : scale( 0.75, 1.25 )
					},
					"50" : {
						transform : scale( 1.15, 0.85 )
					},
					"65" : {
						transform : scale( 0.95, 1.05 )
					},
					"75" : {
						transform : scale( 1.05, 0.95 )
					}
				};
			}
		}
	} );
	// endregion
})();

/**
 * Created by 白 on 2014/12/2.
 * 图片相关的组件
 */

(function () {
	var dom =zachModule["2"],
		element = dom.element,
		css = dom.css,
		px = css.px,

		util =zachModule["0"],
		loopArray = util.loopArray,
		pointer =zachModule["4"],
		animate =zachModule["6"],
		math =zachModule["3"],
		imageViewer =zachModule["8"],
		lib =zachModule["5"];

	window.Content = window.Content || {};
	window.Component = window.Component || {};

	Content.Custom = function ( img, width, height ) {
		if ( isImageRect( img ) ) {
			return Content.Rect( {
				color : img,
				width : width,
				height : height
			} );
		}
		else {
			return Content.Image( img, width, height );
		}
	};

	// 图片
	Content.Image = function ( img, arg1, arg2 ) {
		var width, height;

		if ( arg2 === undefined ) {
			width = img.halfWidth;
			height = img.halfHeight;
		}
		else {
			width = arg1;
			height = arg2;
		}

		if ( arg1 !== undefined && arg2 === undefined ) {
			width *= arg1;
			height *= arg1;
		}

		css( img, {
			position : "absolute",
			width : px( width ),
			height : px( height ),
			left : 0,
			top : 0
		} );

		return {
			width : width,
			height : height,
			element : function () {
				return img.hasChild || ( ua.ios && !ua.win32 ) || ( ua.safari && !ua.android ) ?
					element( "div", [img.cloneNode( true )] ) : img.cloneNode( true );
			},
			draw : function ( gc ) {
				gc.drawImage( img, 0, 0, width, height );
			}
		};
	};

	// 图片覆盖
	Content.ImageCover = function ( img, width, height ) {
		var layout = imageViewer.layImageByFrame( img, {
			width : width,
			height : height,
			size : imageViewer.Size.cover,
			align : [0.5, 0.5]
		} );

		return {
			width : width,
			height : height,
			element : function () {
				return element( "div", {
					css : {
						overflow : "hidden"
					},
					children : css( img.cloneNode( false ), lib.getImageCoverStyle( img, width, height ) )
				} );
			},
			draw : function ( gc ) {
				imageViewer.drawImageLayout( gc, layout );
			}
		};
	};

	// 边框
	Content.Border = function ( content, borderStyle ) {
		var borderWidth = borderStyle.width || 0,
			borderColor = borderStyle.color || "transparent",
			borderRadius = borderStyle.radius || 0,
			width = content.width,
			height = content.height;

		return {
			width : width + borderWidth,
			height : height + borderWidth,
			element : function () {
				return css( content.element(), {
					"overflow" : "hidden",
					"box-sizing" : "border-box",
					border : ["solid", px( borderWidth ), borderColor].join( " " ),
					"border-radius" : px( borderRadius )
				} );
			},
			draw : function ( gc ) {
				gc.save();
				if ( borderRadius ) {
					gc.beginPath();
					gc.moveTo( borderRadius, 0 );
					gc.lineTo( width - borderRadius, 0 );
					gc.arcTo( width, 0, width, borderRadius, borderRadius );
					gc.lineTo( width, height - borderRadius );
					gc.arcTo( width, height, width - borderRadius, height, borderRadius );
					gc.lineTo( borderRadius, height );
					gc.arcTo( 0, height, 0, height - borderRadius, borderRadius );
					gc.lineTo( 0, borderRadius );
					gc.arcTo( 0, 0, borderRadius, 0, borderRadius );
					gc.clip();
				}

				gc.save();
				gc.translate( borderWidth, borderWidth );
				content.draw( gc );
				gc.restore();

				if ( borderWidth ) {
					gc.fillStyle = borderColor;
					gc.fillRect( 0, 0, width, borderWidth );
					gc.fillRect( 0, 0, borderWidth, height );
					gc.fillRect( width, 0, borderWidth, height + borderWidth );
					gc.fillRect( 0, height, width + borderWidth, borderWidth );
				}
				gc.restore();
			}
		};
	};

	// 相框图片
	Content.FrameImage = function ( arg ) {
		var img = arg.img,
			frame = arg.frame,
			frameWidth = arg.frameWidth << 0,
			frameHeight = arg.frameHeight << 0,
			imgX = arg.imgX << 0,
			imgY = arg.imgY << 0,
			imgWidth = arg.imgWidth + 1 << 0,
			imgHeight = arg.imgHeight + 1 << 0,
			layout = imageViewer.layImageByFrame( img, {
				width : imgWidth,
				height : imgHeight,
				size : imageViewer.Size.cover,
				align : [0.5, 0.5]
			} );

		function draw( gc ) {
			gc.save();
			gc.translate( imgX, imgY );
			imageViewer.drawImageLayout( gc, layout );
			gc.restore();
			gc.drawImage( frame, 0, 0, frameWidth, frameHeight );
		}

		return {
			width : frameWidth,
			height : frameHeight,
			element : function () {
				return element( "div", {
					css : {
						overflow : "hidden"
					},
					children : [
						element( "div", {
							css : {
								position : "absolute",
								overflow : "hidden",
								left : css.px( imgX ),
								top : css.px( imgY ),
								width : css.px( imgWidth ),
								height : css.px( imgHeight )
							},
							children : css( img.cloneNode( false ), lib.getImageCoverStyle( img, imgWidth, imgHeight ) )
						} ),
						css( frame.cloneNode( false ), {
							position : "absolute",
							left : 0,
							right : 0,
							top : 0,
							bottom : 0,
							width : css.px( frameWidth ),
							height : css.px( frameHeight ),
							"z-index" : 1
						} )
					]
				} );
			},
			draw : draw
		};
	};

	// 背景图片
	Component.BackgroundImage = function ( page, img, zIndex ) {
		return page.component( {
			content : Content.ImageCover( img, clientWidth, clientHeight ),
			x : 0,
			y : 0,
			"z-index" : zIndex || 0
		} );
	};

	Component.MultiImageArea = function ( arg ) {
		var page = arg.page,
			parent = arg.parent,
			len = arg.contents.length,
			width = parent.componentWidth,
			height = parent.componentHeight,
			components = [],
			enterAnimation = [],
			duration = math.range( 3 / len, 0.08, 0.6 ),
			delay = math.range( 1.5 / len, 0.04, 0.3 ),
			deg = arg.sign * Math.min( 25 / len * Math.PI / 180, 4 * Math.PI / 180 ),
			icon = arg.icon,
			auto;

		bindDataSource( parent, "multi-image" );

		loopArray( arg.contents, function ( component, i ) {
			component["z-index"] = 10000 + i;
			component.rotate = ( i + 1 - len ) * deg;

			enterAnimation.push( {
				component : component,
				duration : 0.6,
				delay : i * 0.3,
				progress : {
					"0" : {
						rotate : -Math.PI / 6,
						scale : !ua.ios && !ua.iphone6 ? 1 : 3,
						x : -width * 2.4,
						y : height * 2.4
					}
				}
			} );

			components.push( component );
		} );

		util.request( function ( bindGesture ) {
			arg.noAnimation === true ? page.onShow( bindGesture ) : enterAnimation.top.onEnter = bindGesture;
		}, function () {
			if ( icon ) {
				css( icon.prev, "opacity", 1 );
				css( icon.next, "opacity", 1 );
			}

			var curTopIndex = len - 1,
				resetAnimation = null;

			function clear() {
				if ( resetAnimation ) {
					loopArray( resetAnimation, function ( animation ) {
						animation.remove();
					} );
					resetAnimation = null;
				}
			}

			function reset( index ) {
				clear();
				resetAnimation = [];
				util.loop( len, function ( pos ) {
					var bottomImage = components[( ( index + pos ) % len + len ) % len];
					resetAnimation[pos] = bottomImage.transition( {
						end : {
							rotate : ( pos + 1 - len ) * deg
						},
						timing : animate.Timing.easeOut,
						delay : delay * pos / 2,
						duration : duration / 2
					} );
				} );
			}

			function fly( direction ) {
				if ( !window.highPerformance ) {
					fp.lock( true );
				}

				clear();
				var flyIndex = curTopIndex,
					flyImage = components[( flyIndex % len + len ) % len];

				flyImage.transition( {
					end : {
						x : ( direction ? clientWidth : -width ) - parent.x,
						y : 0,
						opacity : 0
					},
					duration : 0.3,
					onEnd : function () {
						flyImage.x = 0;
						flyImage.opacity = 1;
						flyImage["z-index"] -= len;
						flyImage.rotate = ( 1 - len ) * deg;

						reset( flyIndex );
						fp.lock( false );
					}
				} );

				--curTopIndex;
			}

			pointer.onDragH( parent, function ( event ) {
				fly( event.directionX );
			} );

			if ( arg.auto ) {
				auto = setTimeout( function () {
					fly( Math.random() > 0.5 );
					auto = setTimeout( arguments.callee, 3000 );
				}, 1500 );
			}
		} );

		page.onRemove( function () {
			auto && clearTimeout( auto );
		} );

		if ( icon ) {
			var prev = icon.prev, next = icon.next;

			loopArray( [prev, next], function ( arrow ) {
				css( arrow, {
					"z-index" : "10000",
					opacity : 0,
					"-webkit-transition" : "0.8s"
				} );
			} );

			css( prev, {
				left : css.px( position.leftIn( page, prev ) + 15 ),
				top : css.px( position.middle( parent, prev ) + parent.y ),
				"-webkit-animation" : "guidePrev 1.5s infinite"
			} );

			css( next, {
				left : css.px( position.rightIn( page, next ) - 15 ),
				top : css.px( position.middle( parent, next ) + parent.y ),
				"-webkit-animation" : "guideNext 1.5s infinite"
			} );

			page.onShow( function () {
				window.body.appendChild( prev );
				window.body.appendChild( next );
			} );

			page.onRemove( function () {
				dom.removeNode( prev );
				dom.removeNode( next );
			} );
		}

		return {
			enterAnimation : enterAnimation
		};
	}
})();

/**
 * Created by 白 on 2015/1/8.
 * 各种页面效果
 */

(function () {
	var dom =zachModule["2"],
		Canvas =zachModule["10"],
		util =zachModule["0"];

	registPageEffect( "flake", {
		resource : ["firstpage-flake.png"],
		create : function ( page, resource ) {
			var snowLayer = null,
				animateHandle = null;

			page.onShow( function () {
				snowLayer = Canvas.Layer();

				var flakes = [],
					fakesNum = 20;

				if ( ua.iphone4 ) {
					fakesNum = 25;
				}
				else if ( ua.iphone5 ) {
					fakesNum = 30;
				}
				else if ( ua.iphone6 && ua.win32 ) {
					fakesNum = 40;
				}

				dom.css( snowLayer, {
					position : "absolute",
					left : 0,
					right : 0,
					top : 0,
					bottom : 0,
					"z-index" : 100,
					"pointer-events" : "none"
				} );

				snowLayer.resize( clientWidth, clientHeight );

				function Flake() {
					return {
						x : Math.random() * clientWidth << 0,
						y : ( Math.random() - 1 ) * clientHeight << 0,
						omega : Math.random() * Math.PI,
						size : ( Math.random() * 8 + 10 ) << 0,
						speed : Math.random() + 1,
						a : Math.random() * 10 + 2
					};
				}

				util.loop( fakesNum, function () {
					flakes.push( Flake() );
				} );

				window.body.appendChild( snowLayer );
				animateHandle = dom.requestAnimate( function () {
					snowLayer.draw( function ( gc ) {
						util.loopArray( flakes, function ( flake, i ) {
							var y = flake.y += flake.speed,
								x = flake.x + Math.sin( flake.y * 0.02 + flake.omega ) * flake.a,
								size = flake.size;

							gc.drawImage( resource[0], x, y, size, size );

							if ( flake.y >= clientHeight ) {
								flake = Flake();
								flake.y = -20;
								flakes[i] = flake;
							}
						} );
					} );
				} );
			} );

			page.onRemove( function () {
				animateHandle.remove();
				dom.removeNode( snowLayer );
			} );
		}
	} );
})();


/**
 * Created by 白 on 2014/10/13.
 * 形状相关的组件
 */

(function () {
	var dom =zachModule["2"],
		element = dom.element,
		css = dom.css,
		px = css.px;

	window.Content = window.Content || {};

	// 矩形,如未提供颜色,就是一个空矩形
	Content.Rect = function ( info ) {
		var color = info.color || "";

		return {
			width : info.width,
			height : info.height,
			element : function () {
				return element( "div", {
					css : {
						background : color
					}
				} );
			},
			draw : function ( gc ) {
				if ( color ) {
					gc.fillStyle = color;
					gc.fillRect( 0, 0, info.width, info.height );
				}
			}
		};
	};

	// 圆形
	Content.Circle = function ( info ) {
		var r = info.r;

		return {
			width : r * 2,
			height : r * 2,
			element : function () {
				return element( "div", {
					css : {
						"border-radius" : px( r ),
						background : info.color
					}
				} );
			},
			draw : function ( gc ) {
				gc.save();
				gc.beginPath();
				gc.arc( r, r, r, 0, 2 * Math.PI );
				gc.closePath();
				gc.fillStyle = info.color;
				gc.fill();
				gc.restore();
			}
		}
	};
})();

/**
 * Created by 白 on 2014/10/13.
 * 文本相关的组件
 */

(function () {
	var dom =zachModule["2"],
		element = dom.element,
		css = dom.css,
		px = css.px,

		util =zachModule["0"],
		insert = util.insert,
		loopArray = util.loopArray,

		textViewer =zachModule["15"],
		Font = textViewer.Font;

	window.Content = window.Content || {};

	// 根据info生成css字体样式
	function cssFontStyle( info ) {
		var retVal = {};
		util.loopObj( info, function ( key, value ) {
			switch ( key ) {
				case "fontSize":
					retVal["font-size"] = px( value );
					break;
				case "lineHeight":
					retVal["line-height"] = px( value );
					break;
				case "fontWeight":
					retVal["font-weight"] = value;
					break;
				case "fontStyle":
					retVal["font-style"] = value;
					break;
				case "color":
					retVal["color"] = value;
					break;
			}
		} );
		return retVal;
	}

	// 测量元素
	function measureElement( el ) {
		var retVal;

		el = el.cloneNode( true );
		document.body.appendChild( el );
		css( el, {
			position : "absolute"
		} );
		retVal = {
			width : el.offsetWidth,
			height : el.offsetHeight
		};
		dom.removeNode( el );
		return retVal;
	}

	// 标签,不需指定宽度.文字多长,宽度就是多少
	Content.Label = function ( info ) {
		var text = info.text,
			el = element( "span", {
				css : insert( cssFontStyle( info ), {
					display : "inline-block",
					"white-space" : "nowrap"
				} ),
				innerHTML : text
			} );

		return {
			width : window.highPerformance ? textViewer.measureText( text, info ).width : measureElement( el ).width,
			height : info.lineHeight,
			element : function () {
				return el.cloneNode( true );
			},
			draw : function ( gc ) {
				// 绘制
				gc.font = Font( info );
				gc.textBaseline = "middle";
				gc.fillStyle = info.color;
				gc.fillText( text, 0, info.lineHeight / 2 << 0 );
			}
		};
	};

	// 行文本,需指定宽度,多出可截取,默认居中
	Content.LineText = function ( info ) {
		var text = info.text,
			width = info.width,
			drawText;

		return {
			width : width,
			height : info.lineHeight,
			element : function () {
				return element( "span", {
					css : insert( cssFontStyle( info ), {
						"text-align" : info.isLeft ? "left" : "center",
						width : px( info.width ),
						"white-space" : "nowrap"
					}, info.overflow ? {
						overflow : "hidden",
						"white-space" : "nowrap",
						"text-overflow" : "ellipsis"
					} : {} ),
					innerHTML : text
				} );
			},
			draw : function ( gc ) {
				// 绘制
				gc.font = Font( info );
				gc.textBaseline = "middle";
				gc.fillStyle = info.color;

				function getWidth( text ) {
					return gc.measureText( text ).width;
				}

				// 计算需要绘制的文字
				if ( drawText === undefined ) {
					if ( info.overflow && getWidth( text ) > width ) {
						for ( var i = 0; i !== text.length; ++i ) {
							if ( getWidth( text.substring( 0, i + 1 ) + "…" ) > width ) {
								break;
							}
						}
						drawText = text.substring( 0, i ) + "…";
					}
					else {
						drawText = text;
					}
				}

				gc.fillText( drawText, info.isLeft ? 0 : center( width, getWidth( drawText ) ), info.lineHeight / 2 << 0 );
			}
		};
	};

	// 块文本
	Content.BlockText = function ( info ) {
		var text = info.text,
			el, textLayout;

		if ( window.highPerformance ) {
			textLayout = textViewer.layText( text, info.width, insert( info, {
				lineBreak : info.breakWord ? textViewer.LineBreak.breakAll : textViewer.LineBreak.normal,
				align : info.breakWord ? textViewer.Align.left : textViewer.Align.side
			} ) );
		}
		else {
			el = element( "div", {
				css : insert( cssFontStyle( info ), {
					width : px( info.width )
				} )
			} );

			loopArray( text.split( "\n" ), function ( p ) {
				element( "p", {
					innerHTML : p || "&nbsp",
					css : insert( {
						margin : px( info.margin * 2 ) + " 0"
					}, info.breakWord ? {
						"word-break" : "break-all",
						"word-wrap" : "break-word"
					} : {} )
				}, el );
			} );
		}

		return {
			width : info.width,
			height : window.highPerformance ? textLayout.height : measureElement( el ).height,
			element : function () {
				return el.cloneNode( true );
			},
			draw : function ( gc ) {
				textViewer.drawTextLayout( gc, textLayout );
			}
		};
	};
})();

/**
 * Created by 白 on 2014/8/11.
 */

(function () {
	var dom =zachModule["2"],
		util =zachModule["0"],
		animate =zachModule["6"],
		math =zachModule["3"],
		Canvas =zachModule["10"];

	registSwitchAnimate( "chessboard", function ( prev, cur, canvas ) {
		var css = dom.css,
			px = css.px,

			clear = prepareSnapshot( null, null, canvas, {
				perspective : 1000,
				background : "#FFFFFF"
			} ),

			numX = 4, numY = 5,

			fragments = [], row,// 碎片矩阵(二维数组),列(一维数组),碎片(数组,[0]是前元素,[1]是当前元素)
			left = 0, top = 0, right, bottom, width, height;// 一个碎片的左,上,右,下坐标和宽高

		if ( clientWidth > clientHeight ) {
			numX = 5;
			numY = 4;
		}

		// 制作碎片
		util.loop( numX, function ( i ) {
			right = ( i + 1 ) / numX * clientWidth << 0;
			top = 0;
			row = [];
			fragments.push( row );

			util.loop( numY, function ( j ) {
				bottom = ( j + 1 ) / numY * clientHeight << 0;
				width = right - left;
				height = bottom - top;

				var fragment = [];
				fragment.start = Math.random(); // 启动时间
				fragment.isTurn = false; // 是否翻转过

				util.loop( 2, function ( n ) {
					var img = n === 0 ? prev : cur,
						layer = Canvas.Layer();

					layer.resize( width, height );
					layer.draw( function ( gc ) {
						var dpr = gc.dpr;
						gc.drawImage( img, left * dpr, top * dpr, width * dpr, height * dpr, 0, 0, width, height )
					} );

					css( layer, {
						position : "absolute",
						left : px( left ),
						top : px( top ),
						"backface-visibility" : "hidden",
						"z-index" : 2 - n
					} );

					window.body.appendChild( layer );
					fragment.push( layer );
				} );

				row.push( fragment );
				top = bottom;
			} );

			left = right;
		} );

		function rotate( fragment, ratio ) {
			var prev = fragment[0], cur = fragment[1];
			if ( !fragment.isTurn && ratio < 0.5 ) {
				css( prev, "z-index", 1 );
				css( cur, "z-index", 0 );
				fragment.isTurn = true;
			}

			if ( fragment.isTurn && ratio >= 0.5 ) {
				css( prev, "z-index", 0 );
				css( cur, "z-index", 1 );
				fragment.isTurn = false;
			}

			css.transform( prev, css.rotateY( ratio * Math.PI ) );
			css.transform( cur, css.rotateY( ratio * Math.PI + Math.PI ) );
		}

		var turnDuration = 0.4, // 翻转时长
			speed = 1 / turnDuration, // 速度倍率
			randomRange = ( 1 - turnDuration ) / 2, // 随机范围
			lastStart = 1 - turnDuration - randomRange;  // 最后启动时间

		return {
			duration : 1.6,
			timing : animate.Timing.linear,
			onAnimate : function ( t ) {
				css( prev, "visibility", "hidden" );
				css( cur, "visibility", "hidden" );

				var fragment;
				for ( var i = 0; i !== numX; ++i ) {
					for ( var j = 0; j !== numY; ++j ) {
						fragment = fragments[i][j];
						rotate( fragment, math.range( ( t - i / ( numX - 1 ) * lastStart - fragment.start * randomRange ) * speed, 0, 1 ) );
					}
				}
			},
			onEnd : function () {
				clear();

				// 移除碎片
				for ( var i = 0; i !== numX; ++i ) {
					for ( var j = 0; j !== numY; ++j ) {
						for ( var n = 0; n !== 2; ++n ) {
							dom.removeNode( fragments[i][j][n] );
						}
					}
				}
			}
		};
	} );
})();


/**
 * Created by 白 on 2014/8/11.
 */

(function () {
	var dom =zachModule["2"],
		animate =zachModule["6"];

	registSwitchAnimate( "cube", function ( prev, cur, canvas ) {
		var css = dom.css,
			isTurn = false,
			r = clientWidth / 2,
			clear = prepareSnapshot( prev, cur, canvas, {
				perspective : 1000,
				background : "#FFFFFF"
			} );

		return {
			duration : 1,
			timing : animate.Timing.linear,
			onAnimate : function ( ratio ) {
				if ( !isTurn && ratio < 0.5 ) {
					css( prev, "z-index", 6 );
					css( cur, "z-index", 5 );
					isTurn = true;
				}

				if ( isTurn && ratio >= 0.5 ) {
					isTurn = false;
					css( prev, "z-index", 5 );
					css( cur, "z-index", 6 );
				}

				var prevRad = ratio * Math.PI / 2,
					curRad = ratio * Math.PI / 2 - Math.PI / 2,
					prevZ = Math.cos( prevRad ) * r - r,
					pz = prevZ + Math.sin( prevRad ) * r;

				css.transform( prev, css.translate( -r * Math.sin( prevRad ), 0, prevZ - pz ), css.rotateY( -prevRad ) );
				css.transform( cur, css.translate( -r * Math.sin( curRad ), 0, Math.cos( curRad ) * r - r - pz ), css.rotateY( -curRad ) );
			},
			onEnd : clear
		};
	} );
})();

/**
 * Created by Zuobai on 2014/8/9.
 */

(function () {
	var dom =zachModule["2"],
		animate =zachModule["6"],
		math =zachModule["3"];

	registSwitchAnimate( "fade", function ( prev, cur, canvas ) {
		var css = dom.css,
			clear = prepareSnapshot( prev, cur, canvas, {} );

		return {
			duration : 0.8,
			timing : animate.Timing.linear,
			onAnimate : function ( ratio ) {
				css( prev, "opacity", 1 - ratio );
				css( cur, "opacity", ratio );
			},
			onEnd : clear
		};
	} );
})();


/**
 * Created by 白 on 2014/8/11.
 */

(function () {
	var dom =zachModule["2"],
		animate =zachModule["6"];

	registSwitchAnimate( "overturn", function ( prev, cur, canvas ) {
		var css = dom.css,
			isTurn = false,
			r = clientWidth / 2,
			clear = prepareSnapshot( prev, cur, canvas, {
				perspective : 1000,
				background : "#FFFFFF"
			} );

		return {
			duration : 1,
			timing : animate.Timing.linear,
			onAnimate : function ( ratio ) {
				if ( !isTurn && ratio < 0.5 ) {
					css( prev, "z-index", 6 );
					css( cur, "z-index", 5 );
					isTurn = true;
				}

				if ( isTurn && ratio >= 0.5 ) {
					isTurn = false;
					css( prev, "z-index", 5 );
					css( cur, "z-index", 6 );
				}

				var z = Math.sin( ( 0.5 - Math.abs( ratio - 0.5 ) ) * Math.PI ) * r * 0.6;

				css.transform( prev, css.translate( 0, 0, -z ), css.rotateY( ratio * Math.PI ) );
				css.transform( cur, css.translate( 0, 0, -z ), css.rotateY( ratio * Math.PI + Math.PI ) );
			},
			onEnd : clear
		};
	} );
})();

/**
 * Created by Zuobai on 2014/8/9.
 */

registSwitchAnimate( "push", function ( prev, cur ) {
	return {
		duration : 0.8,
		onDraw : function ( gc, ratio ) {
			gc.save();
			gc.drawImage( prev, 0, -ratio * clientHeight, clientWidth, clientHeight );
			gc.drawImage( cur, 0, ( 1 - ratio ) * clientHeight, clientWidth, clientHeight );
			gc.restore();
		}
	};
} );

/**
 * Created by Zuobai on 2014/8/9.
 */
(function () {
	var dom =zachModule["2"],
		animate =zachModule["6"];

	registSwitchAnimate( "switch", function ( prev, cur, canvas ) {
		var css = dom.css,
			isTurn = false,
			half = clientWidth / 2,
			clear = prepareSnapshot( prev, cur, canvas, {
				perspective : 1200,
				background : "#FFFFFF"
			} );

		return {
			duration : 1,
			timing : animate.Timing.linear,
			onAnimate : function ( ratio ) {
				ratio = ratio * 2;
				if ( ratio <= 1 ) {
					if ( !isTurn ) {
						css( cur, "z-index", 5 );
						css( prev, "z-index", 6 );
						isTurn = true;
					}

					css.transform( prev, css.translate( ratio * half << 0, 0, -ratio * 150 ),
						css.rotateY( -ratio * 30, "deg" ) );

					css.transform( cur, css.translate( -ratio * half << 0, 0, -150 + ( 1 - ratio ) * -150 ),
						css.rotateY( ratio * 30, "deg" ) );
				}
				else {
					ratio = ratio - 1;
					var rRatio = 1 - ratio;
					if ( isTurn ) {
						css( cur, "z-index", 6 );
						css( prev, "z-index", 5 );
						isTurn = false;
					}

					css.transform( prev, css.translate( rRatio * half << 0, 0, -150 + ratio * -150 ),
						css.rotateY( -rRatio * 30, "deg" ) );

					css.transform( cur, css.translate( -rRatio * half << 0, 0, ( 1 - ratio ) * -150 ),
						css.rotateY( rRatio * 30, "deg" ) );
				}
			},
			onEnd : clear
		};
	} );
})();

/**
 * Created by Zuobai on 2014/8/9.
 */

(function () {
	var util =zachModule["0"],
		animate =zachModule["6"];

	registSwitchAnimate( "tease", function ( prev, cur ) {
		return {
			duration : 0.8,
			timing : animate.Timing.linear,
			onDraw : function ( gc, t ) {
				var dpr = gc.dpr,
					width = clientWidth * dpr;
				gc.drawImage( cur, 0, 0, clientWidth, clientHeight );

				util.loop( 8, function ( i ) {
					var top = i / 8 * clientHeight << 0,
						nextTop = ( i + 1 ) / 8 * clientHeight << 0,
						height = nextTop - top;

					var ratio = Math.max( t * 2 + ( i + 1 ) / 8 - 1, 0 );

					gc.drawImage( prev, 0, top * dpr, width, height * dpr,
						( i % 2 === 0 ? 1 : -1 ) * ratio * ratio * clientWidth, top, clientWidth, height );
				} );
			}
		};
	} );
})();

/**
 * Created by 白 on 2014/10/17.
 * 联系我们板式
 */

(function () {
	var util =zachModule["0"],
		lib =zachModule["5"],
		pointer =zachModule["4"];

	registLayout( "contact", {
		resource : ["layout-contact-background.png", "layout-context-text-frame.png"],
		create : function ( page, data ) {
			var textFrame = data.resource[1],
				textFrameWidth = textFrame.halfWidth,
				textFrameHeight = textFrame.halfHeight;

			Component.BackgroundImage( page, data.image[0] );

			// 联系我们+线
			page.component( {
				content : Content.ImageCover( data.resource[0], clientWidth, clientHeight ),
				x : 0,
				y : 0,
				"z-index" : 1
			} );

			var frames = [];
			util.loopArray( [
				{
					caption : "联系电话",
					click : function ( text ) {
						location.href = "tel:" + text;
					}
				},
				{
					caption : "联系邮箱",
					click : function ( text ) {
						location.href = "mailto:" + text;
					}
				},
				{
					caption : "官方网站",
					click : function ( text ) {
						fp.jump( text );
					}
				},
				{
					caption : "微信号"
				},
				{
					caption : "微博",
					click : function ( text ) {
						fp.jump( "http://weibo.com/n/" + text );
					}
				}
			], function ( info, i ) {
				if ( data.text[i] === "" ) {
					return;
				}

				var paddingX = 14,
					marginX = 8,
					captionLabel = Content.Label( {
						text : info.caption + "：",
						lineHeight : 44,
						fontSize : 14,
						color : "#FFFFFF"
					} ),
					captionWidth = captionLabel.width,
					text = data.text[i],
					textContent = Content.BlockText( {
						text : data.text[i],
						lineHeight : 16,
						fontSize : 12,
						color : "#FFFFFF",
						margin : 0,
						width : textFrameWidth - 2 * paddingX - marginX - captionWidth,
						breakWord : true
					} );

				data.resource[1].hasChild = true;
				var frame = page.component( {
					content : Content.Image( data.resource[1] ),
					x : ( clientWidth - textFrameWidth ) / 2 << 0,
					"z-index" : 2
				} );

				frame.component( {
					content : captionLabel,
					x : paddingX,
					y : 0
				} );

				frame.component( {
					content : textContent,
					x : paddingX + marginX + captionWidth,
					y : center( 44, textContent.height )
				} );

				pointer.onTap( frame, function () {
					window.preventJump = true;
					info.click && info.click( text );
				} );

				frames.push( frame );
			} );

			// 摆放frame
			var startY = middleY( 143 ),
				totalHeight = 315,
				frameNumber = frames.length,
				margin = ( totalHeight - textFrameHeight * frameNumber ) / ( frameNumber + 1 ) << 0;

			util.loopArray( frames, function ( frame, i ) {
				frame.y = startY + margin * ( i + 1 ) + textFrameHeight * i;
			} );
		}
	} );
})();

/**
 * Created by 白 on 2014/9/16.
 * 最后一页
 */

(function () {
	var util =zachModule["0"],
		dom =zachModule["2"],
		pointer =zachModule["4"],
		isTrace = false;

	registSpecialPage( "copyright", function ( done ) {
		dom.ajax( {
			url : window.copyrightUrl,
			onLoad : function ( innerHTML ) {
				var div = dom.element( "div", innerHTML ),
					body = div.querySelector( "#content" );

				util.loopArray( div.querySelectorAll( "style" ), function ( node ) {
					document.head.appendChild( node );
				} );

				done( {
					create : function ( page ) {
						page.innerHTML = body.outerHTML;

						util.loopArray( page.querySelectorAll( "a" ), function ( node ) {
							pointer.onPointerDown( node, function ( event ) {
								event.preventDefault();
							} );
							pointer.onTap( node, function () {
								location.href = node.href;
							} );
						} );
					}
				} );
			}
		} );
	} );

	registLayout( "copyright", {
		resource : ["layout-copyright-background.png"],
		create : function ( page, data ) {
			var author = data.author,
				background = data.resource[0],

				authorLabel = Content.Label( {
					text : author,
					lineHeight : 16,
					fontSize : 16,
					fontStyle : "italic",
					color : "#fc5e28"
				} ),
				authorWidth = authorLabel.width,

				captionLabel = Content.Label( {
					text : "作品",
					lineHeight : 16,
					fontSize : 16,
					fontStyle : "italic",
					color : "#A3AEC1"
				} ),
				captionWidth = captionLabel.width,

				blankWidth = 20,
				totalWidth = authorWidth + blankWidth + captionWidth;

			// 背景+头像遮罩
			page.component( {
				content : Content.Image( background ),
				x : center( clientWidth, background.halfWidth ),
				y : center( clientHeight, background.halfHeight ) + 15,
				"z-index" : 1
			} );

			// 用户头像
			page.component( {
				content : Content.ImageCover( data.image[0], 56, 56 ),
				x : middleX( 136 ),
				y : middleY( 81 )
			} );

			// xx用户 作品
			var authorLine = page.component( {
				content : Content.Rect( {
					width : totalWidth,
					height : 16
				} ),
				x : center( clientWidth, totalWidth ),
				y : middleY( 154 ),
				"z-index" : 2
			} );

			authorLine.component( {
				content : authorLabel,
				x : 0,
				y : 0
			} );

			authorLine.component( {
				content : captionLabel,
				x : authorWidth + blankWidth,
				y : 0
			} );

			// xx的作品列表
			page.component( {
				content : Content.LineText( {
					text : data.title,
					width : 241,
					lineHeight : 14,
					fontSize : 12,
					color : "#A3AEC1",
					isLeft : true
				} ),
				x : middleX( 40 ),
				y : middleY( 203 ),
				"z-index" : 2
			} );

			// 作品链接
			var workX = [40, 130, 220];
			util.loopArray( data.works, function ( workData, i ) {
				if ( i > 2 ) {
					return;
				}

				var work = page.component( {
					content : Content.Rect( {
						width : 60,
						height : 83
					} ),
					x : middleX( workX[i] ),
					y : middleY( 233 ),
					"z-index" : 2
				} );

				// 图像
				work.component( {
					content : Content.ImageCover( data.image[i + 1], 60, 60 ),
					x : 0,
					y : 0,
					"z-index" : 2
				} );

				// 名称
				work.component( {
					content : Content.LineText( {
						text : workData.title,
						width : 80,
						lineHeight : 14,
						fontSize : 10,
						color : "#A3AEC1",
						overflow : true,
						isLeft : true
					} ),
					x : 0,
					y : 69,
					"z-index" : 2
				} );

				// 点击跳转
				pointer.onTap( work, function () {
					window.preventJump = true;
					location.href = workData.url;
				} );
			} );

			// 我要创作按钮
			pointer.onTap( page.component( {
				content : Content.Rect( {
					width : 140,
					height : 40
				} ),
				x : center( clientWidth, 140 ),
				y : middleY( 343 ),
				"z-index" : 2
			} ), fp.downloadFirstPage );

			// 我要创作按钮
			pointer.onTap( page.component( {
				content : Content.Rect( {
					width : 150,
					height : 40
				} ),
				x : center( clientWidth, 150 ),
				y : middleY( 418 ),
				"z-index" : 2
			} ), function () {
				location.href = "http://chuye.cloud7.com.cn";
			} );

			if ( !isTrace ) {
				window.AnalyticsDownload && window.AnalyticsDownload( {
					title : "下载页",
					url : "http://chuye.cloud7.com.cn" + virtualPath + "/download/" + fp.getWorkInfo().ContentID
				} );
				isTrace = true;
			}
		}
	} );
})();

/**
 * Created by 白 on 2014/12/8.
 * 自定义样式,用户可以自己决定动画的样式
 */

(function () {
	var util =zachModule["0"],
		math =zachModule["3"],
		customMap = {
			// region 第一批
			"fly-into-left" : {
				func : enterAnimate.flyInto,
				arg : ["left"]
			},
			"fly-into-top" : {
				func : enterAnimate.flyInto,
				arg : ["top"]
			},
			"fly-into-right" : {
				func : enterAnimate.flyInto,
				arg : ["right"]
			},
			"fly-into-bottom" : {
				func : enterAnimate.flyInto,
				arg : ["bottom"]
			},

			"emerge-left" : {
				func : enterAnimate.emerge,
				arg : ["left"]
			},
			"emerge-top" : {
				func : enterAnimate.emerge,
				arg : ["top"]
			},
			"emerge-right" : {
				func : enterAnimate.emerge,
				arg : ["right"]
			},
			"emerge-bottom" : {
				func : enterAnimate.emerge,
				arg : ["bottom"]
			},

			scale : enterAnimate.scale,
			"fade-in" : enterAnimate.fadeIn,
			"circle-round" : enterAnimate.circleRound,
			"round-from-far-and-near" : enterAnimate.roundFromFarAndNear,
			"curve-up" : enterAnimate.curveUp,
			"fall-down-and-shake" : enterAnimate.fallDownAndShake,
			shrink : enterAnimate.shrink,

			// 第二批
			flash : enterAnimate.flash,
			shake : enterAnimate.shake,
			wobble : enterAnimate.wobble,
			tada : enterAnimate.tada,

			"bounce-in" : enterAnimate.bounceIn,
			"bounce-in-down" : {
				func : enterAnimate.bounceFlying,
				arg : ["bottom"]
			},
			"bounce-in-up" : {
				func : enterAnimate.bounceFlying,
				arg : ["top"]
			},
			"bounce-in-left" : {
				func : enterAnimate.bounceFlying,
				arg : ["left"]
			},
			"bounce-in-right" : {
				func : enterAnimate.bounceFlying,
				arg : ["right"]
			},

			// 第三批
			swing : enterAnimate.swing,
			"rubber-band" : enterAnimate.rubberBand
		};

	registLayout( "custom", {
		create : function ( page, data ) {
			var component = [], imageInfo = data.imageinfo;

			// 计算元素
			util.loopArray( imageInfo, function ( info, i ) {
				var img = data.image[i], comp;

				function border( content ) {
					return info.maskRadius ? Content.Border( content, {
						radius : info.maskRadius
					} ) : content;
				}

				if ( info !== null ) {
					var width = info.width,
						height = img.halfWidth ? width / img.halfWidth * img.halfHeight : info.height;

					comp = page.component( {
						content : border( Content.Custom( img, width * globalScale, height * globalScale ) ),
						x : math.range( middleX( info.x, globalScale ), 0, clientWidth - width * globalScale ),
						y : middleY( info.y, globalScale ),
						rotate : info.rotate || 0
					} );
				}
				else {
					comp = page.component( {
						content : ( isImageRect( img ) ? Content.Custom : Content.ImageCover )( img, clientWidth, clientHeight )
					} );
				}

				comp["z-index"] = i;
				bindDataSource( component[i] = comp, "image", i );
			} );

			// 计算动画
			var curStart = 0, animationList = [];
			util.loopArray( imageInfo, function ( info, i ) {
				if ( info && info.animation ) {
					var animation = ( customMap[info.animation] || customMap["fly-into-left"] ),
						func = animation.func || animation,
						animationInfo = util.insert( func.apply( null, [component[i]].concat( animation.arg || [] ) ), {
							delay : info["animation-delay"],
							duration : info["animation-duration"]
						} );

					if ( animationInfo.delay === undefined || animationInfo.delay === null ) {
						animationInfo.delay = curStart;
					}

					curStart = animationInfo.delay + animationInfo.duration;

					animationList.push( animationInfo );
				}
			} );
			page.registEnterAnimation( [animationList] );
		}
	} );
})();

/**
 * Created by 白 on 2014/9/12.
 * 框+图的板式
 */

(function () {
	var util =zachModule["0"],
		lib =zachModule["5"];

	var registFrameImageLayout = lib.KeyValueFunction( function ( name, info ) {
		registLayout( name, {
			resource : [info.frame],
			create : function ( page, data ) {
				var enterAnimation = [];

				// 遍历图片,分配区域,并计算入场动画
				util.loopArray( data.image, function ( img, i ) {
					var imgInfo = info.img[i], // 图片信息
						area = bindDataSource( page.component( {
							content : Content.ImageCover( img, Math.ceil( imgInfo.width * xRatio ) + 1, Math.ceil( imgInfo.height * yRatio ) + 1 ),
							x : imgInfo.x * xRatio << 0,
							y : imgInfo.y * yRatio << 0
						} ), "image", i ),
						enterAnimationInfo = imgInfo.enterAnimate; // 进入动画信息

					enterAnimation.push( [enterAnimate[enterAnimationInfo.name].apply(
						null, [area].concat( [enterAnimationInfo.arg] ) )] );
				} );

				// 相框图
				page.component( {
					content : Content.Image( data.resource[0], clientWidth, clientHeight ),
					x : 0,
					y : 0,
					"z-index" : 100
				} );

				page.registEnterAnimation( enterAnimation );
			}
		} );
	} );

	registFrameImageLayout( {
		"MutipleImage02" : {
			frame : "layout-MutipleImage02-frame.png",
			img : [
				{
					x : 25,
					y : 16,
					width : 280,
					height : 157,
					enterAnimate : {
						name : "flyInto",
						arg : "left"
					}
				},
				{
					x : 25,
					y : 173,
					width : 280,
					height : 157,
					enterAnimate : {
						name : "flyInto",
						arg : "right"
					}
				},
				{
					x : 25,
					y : 330,
					width : 280,
					height : 157,
					enterAnimate : {
						name : "flyInto",
						arg : "left"
					}
				}
			]
		},
		"MutipleImage03" : {
			frame : "layout-MutipleImage03-frame.png",
			img : [
				{
					x : 15,
					y : 15,
					width : 290,
					height : 231,
					enterAnimate : {
						name : "flyInto",
						arg : "top"
					}
				},
				{
					x : 15,
					y : 250,
					width : 143,
					height : 239,
					enterAnimate : {
						name : "flyInto",
						arg : "left"
					}
				},
				{
					x : 162,
					y : 250,
					width : 143,
					height : 239,
					enterAnimate : {
						name : "flyInto",
						arg : "right"
					}
				}
			]
		}
	} );
})();

/**
 * Created by Zuobai on 2014/10/1.
 * 图文板式
 */

(function () {
	var util =zachModule["0"],
		rgba = util.TupleString( "rgba" ),
		dom =zachModule["2"],
		Canvas =zachModule["10"];

	function SimpleText( img, x, y ) {
		return {
			content : Content.Image( img ),
			x : middleX( x ),
			y : middleY( y ),
			"z-index" : 5
		};
	}

	// region 背景图+纯色矩形+三段文字板式
	function RectLayout( pos ) {
		return {
			create : function ( page, data ) {
				var fontSize = [27, 16, 10],
					textTop = [22, 57, 88],
					rectHeight = 115 * yRatio << 0,
					rectTop, imgTop, imgBottom;

				switch ( pos ) {
					case "top":
						rectTop = 0;
						imgTop = rectHeight;
						imgBottom = clientHeight;
						break;
					case "middle":
						rectTop = clientHeight * 0.6 << 0;
						imgTop = 0;
						imgBottom = clientHeight;
						break;
					case "bottom":
						imgTop = 0;
						rectTop = imgBottom = clientHeight - rectHeight;
						break;
				}

				var animationList = [],
					backgroundColor = color.background || "#FFFFFF";

				util.loopArray( data.text, function ( text, i ) {
					var comp = bindDataSource( page.component( {
						content : Content.LineText( {
							text : text,
							lineHeight : fontSize[i],
							fontSize : fontSize[i],
							color : backgroundColor === "#FFFFFF" ? "#000000" : "#FFFFFF",
							width : clientWidth
						} ),
						x : 0,
						y : rectTop + textTop[i] * yRatio << 0,
						"z-index" : 2
					} ), "text", i );

					// 文字浮现
					if ( text ) {
						animationList.push( [enterAnimate.emerge( comp )] );
					}
				} );

				// 背景图
				bindDataSource( page.component( {
					content : Content.ImageCover( data.image[0], clientWidth, imgBottom - imgTop ),
					x : 0,
					y : imgTop
				} ), "image", 0 );

				// 矩形
				page.component( {
					content : Content.Rect( {
						color : backgroundColor,
						width : clientWidth,
						height : rectHeight
					} ),
					x : 0,
					y : rectTop,
					"z-index" : 1
				} );

				page.registEnterAnimation( animationList );
			}
		};
	}

	registLayout( "ImageText01", RectLayout( "top" ) );
	registLayout( "ImageText02", RectLayout( "bottom" ) );
	registLayout( "ImageText03", RectLayout( "middle" ) );
	// endregion

	// region 单图
	registLayout( "SingleImage", {
		create : function ( page, data ) {
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );
		}
	} );
	// endregion

	// region 背景图+透明层+文字板式
	function PureTextLayout( style ) {
		var padding = style.padding;

		return {
			create : function ( page, data ) {
				var text = Content.BlockText( {
					text : data.text[0],
					margin : style.margin,
					lineHeight : style.lineHeight,
					fontSize : style.fontSize,
					color : style.color,
					width : clientWidth - 2 * padding
				} );

				// 背景
				bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

				// 透明层
				page.component( {
					content : Content.Rect( {
						width : clientWidth,
						height : clientHeight,
						color : style.background
					} ),
					x : 0,
					y : 0,
					"z-index" : 1
				} );

				page.registEnterAnimation( [
					[enterAnimate.emerge( bindDataSource( page.component( {
						content : text,
						"z-index" : 2,
						x : padding,
						y : center( clientHeight, text.height )
					} ), "text", 0 ) )]
				] );
			}
		};
	}

	// 黑色透明层
	registLayout( "ImageText04", PureTextLayout( {
		margin : 5,
		lineHeight : 25,
		fontSize : 15,
		color : "#FFFFFF",
		background : rgba( 0, 0, 0, 0.8 ),
		padding : 20
	} ) );

	// 白色透明层
	registLayout( "ImageText07", PureTextLayout( {
		margin : 5,
		lineHeight : 25,
		fontSize : 14,
		color : "#333333",
		background : rgba( 255, 255, 255, 0.85 ),
		padding : 20
	} ) );
	// endregion

	// 互联网分析沙龙,电商专场
	registLayout( "ImageText05", {
		create : function ( page, data ) {
			var padding = 17,
				blockWidth = 191,
				textContent = Content.BlockText( {
					text : data.text[0],
					width : blockWidth - 2 * padding,
					lineHeight : 30,
					fontSize : 22,
					color : "#FFFFFF",
					breakWord : true
				} ),
				backgroundHeight = Math.max( textContent.height + 20, 60 );

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 透明颜色背景
			var background = page.component( {
				content : Content.Rect( {
					width : blockWidth,
					height : backgroundHeight,
					color : rgba( 0, 0, 0, 0.85 )
				} ),
				x : clientWidth - blockWidth,
				y : center( clientHeight, backgroundHeight ),
				"z-index" : 1
			} );

			// 文字
			bindDataSource( background.component( {
				content : textContent,
				x : padding,
				y : center( backgroundHeight, textContent.height )
			} ), "text", 0 );
		}
	} );

	// 国际创新峰会,三段文字依次飞入
	registLayout( "ImageText06", {
		create : function ( page, data ) {
			var padding = 17,
				blockWidth = 250,
				blockHeight = 350;

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 透明颜色背景
			var background = page.component( {
				content : Content.Rect( {
					width : blockWidth,
					height : blockHeight,
					color : rgba( 0, 0, 0, 0.85 )
				} ),
				x : center( clientWidth, blockWidth ),
				y : center( clientHeight, blockHeight ),
				"z-index" : 1
			} );

			function Text( i, y ) {
				var text = Content.BlockText( {
					text : data.text[i],
					width : blockWidth - 2 * padding,
					lineHeight : 25,
					fontSize : 14,
					color : "#FFFFFF",
					breakWord : true
				} );

				return util.extend( enterAnimate.flyInto( bindDataSource( background.component( {
					content : text,
					x : padding,
					y : y + center( 97, text.height )
				} ), "text", i ), "right" ), {
					delay : 0.3 * i
				} );
			}

			page.registEnterAnimation( [
				[Text( 0, 35 ), Text( 1, 132 ), Text( 2, 229 )]
			] );
		}
	} );

	// 他们特立独行
	registLayout( "ImageText08", {
		create : function ( page, data ) {
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );
			var textImg = Content.Image( data.image[1], globalScale );

			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : textImg,
					x : clientWidth - textImg.width,
					y : middleY( 354, globalScale ),
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 他们有一个共同的名字
	registLayout( "ImageText09", {
		create : function ( page, data ) {
			var textImg = Content.Image( data.image[1], globalScale );
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : textImg,
					x : center( clientWidth, textImg.width ),
					y : middleY( 289, globalScale ),
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 有一家咖啡馆
	registLayout( "ImageText10", {
		create : function ( page, data ) {
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : Content.Image( data.image[1], globalScale ),
					x : 25,
					y : middleY( 155, globalScale ),
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 越极客,越性感
	registLayout( "ImageText11", {
		create : function ( page, data ) {
			var textImg = Content.Image( data.image[1], globalScale ),
				textImg1 = Content.Image( data.image[2], globalScale );

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : textImg,
					x : center( clientWidth, textImg.width ),
					y : middleY( 189, globalScale ),
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )],
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : textImg1,
					x : center( clientWidth, textImg1.width ),
					y : middleY( 269, globalScale ),
					"z-index" : 5,
					duration : 1
				} ), "image", 2 ) )]
			] );
		}
	} );

	// 马云
	registLayout( "ImageText12", {
		resource : ["layout-ImageText12-mayun.jpg", "layout-ImageText12-mask.png"],
		create : function ( page, data ) {
			var textImg = data.image[1],
				imgHeight = 818 / 1008 * clientHeight,
				maskHeight = 400 / 1008 * clientHeight;

			// 马云头像
			page.component( {
				content : Content.ImageCover( data.resource[0], clientWidth / 2, imgHeight ),
				x : 0,
				y : 0
			} );

			// 上传的头像
			bindDataSource( page.component( {
				content : Content.ImageCover( data.image[0], clientWidth / 2, imgHeight ),
				x : clientWidth / 2,
				y : 0
			} ), "image", 0 );

			// 红色遮罩
			var mask = page.component( {
				content : Content.ImageCover( data.resource[1], clientWidth, maskHeight ),
				x : 0,
				y : clientHeight - maskHeight,
				"z-index" : 5
			} );

			// 文字
			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( mask.component( {
					content : Content.Image( textImg ),
					x : ( clientWidth - textImg.halfWidth ) / 2 << 0,
					y : 75,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 新年大发
	registLayout( "ImageText13", {
		create : function ( page, data ) {
			var rectHeight = 248 / 2 * yRatio,
				rectTop = clientHeight - rectHeight,
				textImg = data.image[1],
				imgWidth = textImg.halfWidth * yRatio << 0;

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 矩形
			var rect = page.component( {
				content : Content.Rect( {
					color : "#FFFFFF",
					width : clientWidth,
					height : rectHeight
				} ),
				x : 0,
				y : rectTop
			} );

			// 文字
			page.registEnterAnimation( [
				[enterAnimate.fadeIn( bindDataSource( rect.component( {
					content : Content.Image( textImg, imgWidth, textImg.halfHeight * yRatio << 0 ),
					x : center( clientWidth, imgWidth ),
					y : ( 766 - ( 1008 - 248 ) ) / 2 * yRatio << 0,
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 黄有维,1965年,湖南岳阳人
	registLayout( "ImageText14", {
		create : function ( page, data ) {
			var textImg = Content.Image( data.image[1], globalScale );

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[enterAnimate.emerge( bindDataSource( page.component( {
					content : textImg,
					x : clientWidth - 14 - textImg.width,
					y : middleY( 78 ),
					"z-index" : 5,
					duration : 1
				} ), "image", 1 ) )]
			] );
		}
	} );

	// 他的作品格调清新,充满阳光和朝气
	registLayout( "ImageText15", {
		create : function ( page, data ) {
			var textImg1 = data.image[1],
				textImg2 = data.image[2],
				textPaddingY = 40,
				textPaddingX = 23,
				margin = 15,
				textHeight = textImg1.halfHeight + textImg2.halfHeight + margin,
				rectWidth = Math.max( textImg1.halfWidth, 246 ) + textPaddingX * 2,
				rectLeft = ( clientWidth - rectWidth ) / 2,
				rectHeight = textHeight + textPaddingY * 2,
				rectTop = ( clientHeight - rectHeight ) / 2;

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 矩形
			var rect = page.component( {
				content : Content.Rect( {
					width : rectWidth,
					height : rectHeight,
					color : "rgba(255,255,255,0.9)"
				} ),
				x : rectLeft,
				y : rectTop
			} );

			// 文字
			function MyText( text, x, y, i ) {
				return enterAnimate.emerge( bindDataSource( rect.component( {
					content : Content.Image( text ),
					x : x << 0,
					y : y << 0,
					"z-index" : 5,
					duration : 1
				} ), "image", i ) );
			}

			page.registEnterAnimation( [
				[MyText( textImg1, textPaddingX, textPaddingY, 1 )],
				[MyText( textImg2, rectWidth - textPaddingX - textImg2.halfWidth,
					textPaddingY + textImg1.halfHeight + margin, 2 )]
			] );
		}
	} );

	// 稻城亚丁
	registLayout( "ImageText16", {
		create : function ( page, data ) {
			var textImg1 = data.image[1], textImg2 = data.image[2];

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[enterAnimate.fadeIn( bindDataSource( page.component( SimpleText( textImg1, 324 / 2, 114 / 2 ) ), "image", 1 ) )],
				[enterAnimate.fadeIn( bindDataSource( page.component( SimpleText( textImg2, 330 / 2, 114 / 2 + textImg1.halfHeight + 5 ) ), "image", 2 ) )]
			] );
		}
	} );

	// 沙雅
	registLayout( "ImageText17", {
		create : function ( page, data ) {
			var textImg1 = data.image[1], textImg2 = data.image[2];

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[enterAnimate.fadeIn( bindDataSource( page.component( SimpleText( textImg1, 68 / 2, 696 / 2 ) ), "image", 1 ) )],
				[enterAnimate.fadeIn( bindDataSource( page.component( SimpleText( textImg2, 76 / 2, 696 / 2 + textImg1.halfHeight + 5 ) ), "image", 2 ) )]
			] );
		}
	} );

	var ImageText2122 = {
		create : function ( page, data ) {
			var textImg1 = data.image[1], textImg2 = data.image[2];

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg1, 516 / 2, 195 / 2 ) ), "image", 1 ), "right" ),
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg2, 516 / 2 + textImg1.halfWidth - textImg2.halfWidth,
						195 / 2 + textImg1.halfHeight + 5 ) ), "image", 2 ), "left" )
				]
			] );
		}
	};

	registLayout( "ImageText21", ImageText2122 );
	registLayout( "ImageText22", ImageText2122 );

	registLayout( "ImageText23", {
		create : function ( page, data ) {
			var textImg1 = data.image[1], textImg2 = data.image[2];

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg1, 60 / 2, 140 / 2 ) ), "image", 1 ), "top" ),
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg2, 64 / 2, 140 / 2 + textImg1.halfHeight + 5 ) ), "image", 2 ), "bottom" )
				]
			] );
		}
	} );

	registLayout( "ImageText24", {
		create : function ( page, data ) {
			var textImg1 = data.image[1], textImg2 = data.image[2];

			// 背景
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg1, 82 / 2, 720 / 2 ) ), "image", 1 ), "top" ),
					enterAnimate.emerge( bindDataSource( page.component( SimpleText( textImg2, 86 / 2, 720 / 2 + textImg1.halfHeight + 5 ) ), "image", 2 ), "bottom" )
				]
			] );
		}
	} );

	// 愤怒的丘吉尔
	registLayout( "ImageText25", {
		create : function ( page, data ) {
			var image = Content.Image( data.image[1], globalScale );
			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( {
						content : image,
						x : center( clientWidth, image.width ),
						y : middleY( idealHeight - 40 - data.image[1].halfHeight, globalScale )
					}, "top" ), "image", 1 ) )
				]
			] );
		}
	} );

	// 初夜在乎你的感受,所以才用心表达
	registLayout( "ImageText26", {
		create : function ( page, data ) {
			var image = Content.Image( data.image[1], globalScale ),
				image2 = Content.Image( data.image[2], globalScale );

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( {
						content : image,
						x : 0,
						y : middleY( 588 / 2, globalScale )
					} ), "image", 1 ), "right" )
				],
				[
					enterAnimate.emerge( bindDataSource( page.component( {
						content : image2,
						x : middleX( 144 / 2, globalScale ),
						y : middleY( 588 / 2, globalScale ) + image.height
					} ), "image", 2 ), "right" )]
			] );
		}
	} );

	// Happy new year 2015
	registLayout( "ImageText27", {
		resource : ["firstpage-flake.png"],
		create : function ( page, data ) {
			var image = Content.Image( data.image[1], globalScale );

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 文字
			page.registEnterAnimation( [
				[
					enterAnimate.emerge( bindDataSource( page.component( {
						content : image,
						x : center( clientWidth, image.width ),
						y : middleY( 503 / 2, globalScale )
					} ), "image", 1 ) )
				]
			] );

			if ( window.highPerformance ) {
				var snowLayer = Canvas.Layer(),
					flakes = [],
					fakesNum = 40;

				if ( ua.iphone4 ) {
					fakesNum = 25;
				}
				else if ( ua.iphone5 ) {
					fakesNum = 30;
				}
				else if ( ua.iphone6 ) {
					fakesNum = 40;
				}

				dom.css( snowLayer, {
					position : "absolute",
					left : 0,
					right : 0,
					top : 0,
					bottom : 0,
					"z-index" : 100,
					"pointer-events" : "none"
				} );
				snowLayer.resize( clientWidth, clientHeight );

				function Flake() {
					return {
						x : Math.random() * clientWidth << 0,
						y : ( Math.random() - 1 ) * clientHeight << 0,
						omega : Math.random() * Math.PI,
						size : ( Math.random() * 8 + 10 ) << 0,
						speed : Math.random() + 1,
						a : Math.random() * 10 + 2
					};
				}

				util.loop( fakesNum, function () {
					flakes.push( Flake() );
				} );

				var animateHandle = null;

				page.onShow( function () {
					window.body.appendChild( snowLayer );
					animateHandle = dom.requestAnimate( function () {
						snowLayer.draw( function ( gc ) {
							util.loopArray( flakes, function ( flake, i ) {
								var y = flake.y += flake.speed,
									x = flake.x + Math.sin( flake.y * 0.02 + flake.omega ) * flake.a,
									size = flake.size;

								gc.drawImage( data.resource[0], x, y, size, size );

								if ( flake.y >= clientHeight ) {
									flake = Flake();
									flake.y = -20;
									flakes[i] = flake;
								}
							} );
						} );
					} );
				} );

				page.onRemove( function () {
					animateHandle.remove();
					dom.removeNode( snowLayer );
				} );
			}
		}
	} );
})();

/**
 * Created by 白 on 2014/10/17.
 */

(function () {
	var lib =zachModule["5"],
		dom =zachModule["2"],
		pointer =zachModule["4"],
		element = dom.element,

		infoWindowTemplate = '<div class="map-info-window"><div class="name"></div><div class="info"><div>地址:<span class="address"></span></div></div></div>';

	registLayout( "map", {
		resource : ["layout-map-location.png"],
		create : function ( page, data ) {
			var icon = data.resource[0],
				slidePage;

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			// 地图图标
			var iconArea = bindDataSource( page.component( {
				content : Content.Image( icon ),
				x : center( clientWidth, icon.halfWidth ),
				y : middleY( 574 / 2 )
			} ), "map", 0 );

			// 地址
			page.component( {
				content : Content.LineText( {
					text : data.location[0].address,
					lineHeight : 12,
					fontSize : 12,
					color : "#FFFFFF",
					width : clientWidth
				} ),
				x : 0,
				y : middleY( 682 / 2 )
			} );

			// 地图图标闪烁
			page.onShow( function () {
				iconArea.infiniteAnimate( {
					duration : 3,
					progress : {
						0 : {
							opacity : 1
						},
						50 : {
							opacity : 0.4
						}
					}
				} );
			} );

			// 点击地图图标,弹出地图页
			pointer.onTap( page.component( {
				content : Content.Rect( {
					width : 120,
					height : 100
				} ),
				x : center( clientWidth, 120 ),
				y : middleY( 574 / 2 - 20 )
			} ), function () {
				window.preventJump = true;

				// 如果没有地图页,创建它
				if ( !slidePage ) {
					slidePage = fp.slidePage();
					slidePage.classList.add( "map-slide-page" );

					var back = slidePage.appendChild( element( "div.title-bar", {
							children : [element( "div.icon.back" ), element( "div.line" ), element( "div.caption" )]
						} ) ),
						loading = fp.Loading( slidePage );

					pointer.onTap( back, fp.history.back );

					lib.markerMap( {
						data : data.location,
						parent : slidePage,
						make : function ( item ) {
							var infoWindow = element( infoWindowTemplate );
							infoWindow.querySelector( ".name" ).innerHTML = item.name;
							infoWindow.querySelector( ".address" ).innerHTML = item.address;
							return infoWindow;
						},
						onLoad : loading.remove
					} );
				}

				slidePage.slideIn();
			} );
		}
	} );
})();

/**
 * Created by 白 on 2014/9/24.
 */

(function () {
	var util =zachModule["0"],
		loopArray = util.loopArray;

	registLayout( "MutipleImage01", {
		create : function ( page, data ) {
			var imgComponents = [],
				scale = Math.min( 1, yRatio ) * globalScale,
				multiImageFrame = page.component( {
					content : Content.Rect( {
						width : 244 * scale << 0,
						height : 410 * scale << 0
					} )
				} );

			loopArray( data.image, function ( img ) {
				imgComponents.push( multiImageFrame.component( Content.Border( Content.ImageCover( img, multiImageFrame.componentWidth, multiImageFrame.componentHeight ), {
					width : 3,
					color : "#FFFFFF"
				} ) ) );
			} );

			// 多图框
			multiImageFrame.x = position.center( page, multiImageFrame );
			multiImageFrame.y = position.middle( page, multiImageFrame );

			// 多图
			var multiImageArea = Component.MultiImageArea( {
				page : page,
				contents : imgComponents,
				sign : -1,
				parent : multiImageFrame,
				icon : {
					prev : Icon( staticImgSrc( "layout-MutipleImage01-arrow-left.png" ), 20, 32 ),
					next : Icon( staticImgSrc( "layout-MutipleImage01-arrow-right.png" ), 20, 32 )
				}
			} );

			page.registEnterAnimation( [multiImageArea.enterAnimation] );
		}
	} );

	registLayout( "MutipleImage04", {
		resource : ["layout-MutipleImage04-background.jpg"],
		create : function ( page, data ) {
			var imgComponents = [];

			page.component( Content.Image( data.resource[0], clientWidth, clientHeight ) );

			var image1 = bindDataSource( page.component( Content.Image( data.image[0], globalScale ) ), "image", 0 ),
				image2 = bindDataSource( page.component( Content.Image( data.image[1], globalScale ) ), "image", 1 ),
				image3 = bindDataSource( page.component( Content.Image( data.image[2], globalScale ) ), "image", 2 ),
				multiImageFrame = page.component( Content.Rect( {
					width : 356 / 2 * globalScale << 0,
					height : 518 / 2 * globalScale << 0
				} ) );

			var margin1 = d( 11 ),
				margin2 = d( 19 ),
				margin3 = d( 39 );

			loopArray( [image1, image2, image3, multiImageFrame], function ( component ) {
				component.x = position.center( page, component );
			} );

			image1.y = ( clientHeight - ( image1.componentHeight + image2.componentHeight + image3.componentHeight +
			multiImageFrame.componentHeight + margin1 + margin2 + margin3 ) ) / 2 << 0;
			image2.y = position.bottomTo( image1, image2 ) + margin1 + image1.y;
			image3.y = position.bottomTo( image2, image3 ) + margin2 + image2.y;
			multiImageFrame.y = position.bottomTo( image3, multiImageFrame ) + margin3 + image3.y;

			loopArray( data.image.slice( 3 ), function ( img ) {
				imgComponents.push( multiImageFrame.component( Content.Border( Content.ImageCover( img, multiImageFrame.componentWidth, multiImageFrame.componentHeight ), {
					width : 1,
					color : "#FFFFFF"
				} ) ) );
			} );

			// 多图
			var multiImageArea = Component.MultiImageArea( {
				page : page,
				contents : imgComponents,
				sign : -1,
				parent : multiImageFrame,
				icon : {
					prev : Icon( staticImgSrc( "layout-MutipleImage04-arrow-left.png" ), 14, 22 ),
					next : Icon( staticImgSrc( "layout-MutipleImage04-arrow-right.png" ), 14, 22 )
				}
			} );

			page.registEnterAnimation( [
				[enterAnimate.emerge( image1 )],
				[enterAnimate.emerge( image2 )],
				[enterAnimate.emerge( image3 )],
				multiImageArea.enterAnimation
			] );
		}
	} );
})();

/**
 * Created by 白 on 2014/12/23.
 * 凤凰网-金酸梅版式
 */

(function () {
	var util =zachModule["0"],
		lib =zachModule["5"],

		pointer =zachModule["4"],

		dom =zachModule["2"],
		element = dom.element,
		css = dom.css,

		ifengAndroid = ua.android && location.href.arg.ifeng;

	function registRazziesLayout( name, isSingle ) {
		registLayout( name, {
			resource : ["layout-razzies-background-single.png", "layout-razzies-background-double.png",
				"layout-razzies-banner-left.png", "layout-razzies-banner-center.png", "layout-razzies-banner-right.png",
				"layout-razzies-cup.png"],
			create : function ( page, data ) {
				var awardName = data.text[2].split( "\n" );

				Component.BackgroundImage( page, data.resource[isSingle ? 0 : 1], 1 );

				// 横幅文字内容
				var bannerTextContent = Content.Label( {
						fontSize : 15 * globalScale << 0,
						lineHeight : 15 * globalScale << 0,
						color : "#fdf1c8",
						text : data.text[0]
					} ),
					bannerWidth = bannerTextContent.width + 50 * globalScale << 0;

				// 横幅
				var banner = page.component( {
						content : Content.Rect( {
							width : bannerWidth,
							height : 36 * globalScale << 0
						} ),
						x : center( clientWidth, bannerWidth ),
						y : middleY( 153, globalScale ),
						"z-index" : 2
					} ),
					bannerSideWidth = 20 * globalScale << 0;

				// 横幅左
				banner.component( {
					content : Content.Image( data.resource[2], globalScale ),
					x : 0,
					y : 0
				} );

				// 横幅中
				banner.component( {
					content : Content.Image( data.resource[3], banner.componentWidth - bannerSideWidth * 2 + 8, banner.componentHeight ),
					x : bannerSideWidth - 3,
					y : 0
				} );

				// 横幅右
				banner.component( {
					content : Content.Image( data.resource[4], globalScale ),
					x : banner.componentWidth - bannerSideWidth,
					y : 0
				} );

				// 横幅字
				bindDataSource( banner.component( {
					content : bannerTextContent,
					x : center( banner.componentWidth, bannerTextContent.width ),
					y : center( 30 * globalScale << 0, bannerTextContent.height )
				} ), "text", 0 );

				// 文字
				var textWidth = 250 * globalScale;
				var text = bindDataSource( page.component( {
					content : Content.BlockText( {
						width : textWidth,
						lineHeight : 20 * globalScale << 0,
						fontSize : 12 * globalScale << 0,
						text : data.text[1],
						color : "#fdf1c9"
					} ),
					x : center( clientWidth, textWidth ),
					y : middleY( 200, globalScale ),
					"z-index" : 2
				} ), "text", 1 );

				// 头像,single一个,double两个
				if ( isSingle ) {
					bindDataSource( page.component( {
						content : Content.ImageCover( data.image[0], 104 * globalScale << 0, 104 * globalScale << 0 ),
						x : middleX( 108, globalScale ),
						y : middleY( 41, globalScale )
					} ), "image", 0 );
				}
				else {
					bindDataSource( page.component( {
						content : Content.ImageCover( data.image[0], 104 * globalScale << 0, 104 * globalScale << 0 ),
						x : middleX( 56, globalScale ),
						y : middleY( 41, globalScale )
					} ), "image", 0 );
					bindDataSource( page.component( {
						content : Content.ImageCover( data.image[1], 104 * globalScale << 0, 104 * globalScale << 0 ),
						x : middleX( 161, globalScale ),
						y : middleY( 41, globalScale )
					} ), "image", 1 );
				}

				// 奖杯
				data.resource[5].hasChild = true;
				var cup = page.component( {
						content : Content.Image( data.resource[5], globalScale ),
						x : middleX( 132 / 2, globalScale ),
						y : middleY( 566 / 2, globalScale ),
						"z-index" : 2
					} ),
					rectWidth = 85 * globalScale << 0;

				// 奖杯标题
				var cupCaption = bindDataSource( cup.component( {
						content : Content.Rect( {
							height : 37 * globalScale << 0,
							width : rectWidth
						} ),
						x : center( cup.componentWidth, rectWidth ) - 1,
						y : 129 * globalScale << 0
					} ), "text", 2 ),
					cupCaptionFontSize = 15 * globalScale << 0,
					cupCaptionColor = "#40234a";

				// 一段文字的处理
				if ( awardName.length === 1 ) {
					cupCaption.component( {
						content : Content.LineText( {
							fontSize : cupCaptionFontSize,
							lineHeight : cupCaptionFontSize,
							fontWeight : "bold",
							width : rectWidth,
							text : awardName[0],
							color : cupCaptionColor
						} ),
						y : center( cupCaption.height, cupCaptionFontSize ),
						x : 0
					} );
				}
				// 两段文字的处理
				else {
					cupCaption.component( {
						content : Content.LineText( {
							fontSize : cupCaptionFontSize,
							lineHeight : cupCaptionFontSize,
							fontWeight : "bold",
							width : rectWidth,
							text : awardName[0],
							color : cupCaptionColor
						} ),
						y : 0,
						x : 0
					} );

					cupCaption.component( {
						content : Content.LineText( {
							fontSize : cupCaptionFontSize,
							lineHeight : cupCaptionFontSize,
							fontWeight : "bold",
							width : rectWidth,
							text : awardName[1],
							color : cupCaptionColor
						} ),
						y : 20 * globalScale << 0,
						x : 0
					} );
				}

				// 动画
				page.registEnterAnimation( [
					[enterAnimate.fallDownAndShake( banner )],
					[enterAnimate.emerge( text )],
					[util.insert( enterAnimate.shrink( cup ), {
						delay : 0.3
					} )]
				] );
			}
		} );
	}

	registRazziesLayout( "razzies-single", true );
	registRazziesLayout( "razzies-double", false );

	// 设置金酸梅分享
	window.setRazziesShareData = function ( data ) {
		var text = data.text;
		window.setShareData( {
			url : util.removeUrlArg( util.concatUrlArg( location.href, {
				razzies : data.id
			} ), ["ifeng"] ),
			title : "2014中国自媒体金酸媒奖：凤凰新闻与" + text[2] + "联合颁发",
			desc : text[0] + "等大咖喜获“金酸媒”奖。 也想颁奖？点我！"
		} );
	};

	// 金酸梅预览
	window.RazziesPreviewPage = function ( data, onLoad ) {
		var text = data.text;
		var pageInfo = LayoutPage( {
				layout : {
					label : "razzies-custom",
					image : [data.image],
					text : text,
					preview : JSON.stringify( {
						id : data.id,
						image : [data.image],
						text : text
					} )
				}
			} ),
			previewPage = DOMPage();

		window.setRazziesShareData( data );

		pageInfo.load( function () {
			window.highPerformance = false;
			pageInfo.create( previewPage );
			dom.toggleState( document.body, "can-push", "can-not-push" );
			onLoad && onLoad( previewPage );
			previewPage.start();
		} );

		pointer.onPointerDown( previewPage, function ( event ) {
			event.preventDefault();
			event.stopPropagation();
		} );

		css( previewPage, {
			width : css.px( clientWidth ),
			height : css.px( clientHeight ),
			"z-index" : 5,
			background : "#000000"
		} );
	};

	registSpecialPage( "razzies", function ( done ) {
		var loader = util.Loader();

		function Img( src ) {
			var img = new Image();
			loader.load( function ( done ) {
				img.onload = function () {
					done();
					img.onload = done;
				};
				img.src = staticImgSrc( src );
			} );
			return img;
		}

		var background = Img( "layout-razzies-make.png" ),
			addPhoto = Img( ifengAndroid ? "layout-razzies-default-cup.png" : "layout-razzies-add-photo.png" ),
			copyright = Img( "layout-razzies-copyright.png" );

		loader.start( function () {
			var form;
			done( {
				create : function ( page ) {
					if ( !form ) {
						css( background, lib.getImageCoverStyle( background, clientWidth, clientHeight ) );

						var uploadFail = false;

						form = element( "form", {
							css : {
								position : "absolute",
								left : 0,
								right : 0,
								top : 0,
								bottom : 0,
								"z-index" : 0
							}
						} );

						css( background, {
							"pointer-events" : "none",
							"z-index" : 3
						} );
						form.appendChild( background );

						function el( el, width, height, x, y, zIndex ) {
							css( el, {
								position : "absolute",
								left : css.px( middleX( x / 2 << 0, globalScale ) ),
								top : css.px( middleY( y / 2 << 0, globalScale ) ),
								width : css.px( width / 2 * globalScale << 0 ),
								height : css.px( height / 2 * globalScale << 0 ),
								"box-sizing" : "border-box",
								"z-index" : zIndex
							} );

							pointer.onPointerDown( el, function ( event ) {
								event.stopPropagation();
							} );
							return el;
						}

						var curFocus = null;

						function Input( arg ) {
							var input = element( arg.textArea ? "textarea" : "input", {
								classList : "text",
								css : {
									border : "none",
									"line-height" : css.px( arg.lineHeight || ( arg.height / 2 * globalScale << 0 ) ),
									"font-size" : css.px( arg.fontSize * globalScale << 0 ),
									padding : arg.textArea ? "4px 6px" : "0 4px",
									resize : "none",
									color : arg.color,
									background : "transparent",
									"text-align" : arg.textArea ? "start" : "center",
									"font-weight" : arg.bold || "normal"
								},
								name : arg.name
							}, form );

							input.arg = arg;
							input.maxLength = arg.max;
							arg.className && ( input.classList.add( arg.className ));
							arg.placeholder && ( input.placeholder = arg.placeholder );

							dom.bindEvent( input, "focus", function () {
								curFocus = input;
							} );

							pointer.onPointerDown( input, function ( event ) {
								event.stopPropagation();
							} );

							return el( input, arg.width, arg.height, arg.x, arg.y, 3 );
						}

						// 上传图片的框
						var frame = el( element( "div", form ), 216, 216, 212, 62, 2 );
						css( frame, {
							"pointer-events" : "none"
						} );
						frame.appendChild( addPhoto );
						css( addPhoto, lib.getImageCoverStyle( addPhoto, 108 * globalScale << 0, 108 * globalScale << 0 ) );

						if ( !ifengAndroid ) {
							// 上传按钮
							var uploadImg = el( element( "input", {
								type : "file",
								name : "picture",
								accept : "image/*"
							}, form ), 216, 216, 212, 62, 1 );

							uploadFail = "请上传照片";

							uploadImg.onchange = function () {
								var file = uploadImg.files[0];

								var reader = new FileReader();
								reader.onload = function () {
									uploadFail = false;
									addPhoto.onload = function () {
										dom.removeCss( addPhoto, "width" );
										dom.removeCss( addPhoto, "height" );
										css( addPhoto, lib.getImageCoverStyle( addPhoto, 108, 108 ) );
									};
									addPhoto.src = file.type ? reader.result :
									"data:application/octet-stream;" + reader.result.substr( reader.result.indexOf( "base64," ) );
								};
								reader.readAsDataURL( file );
							};
						}

						Input( {
							width : 130,
							height : 46,
							x : 312,
							y : 306,
							fontSize : 14,
							name : "Honoree",
							caption : "获奖人",
							index : 0,
							color : "#fdf1c8",
							min : 2,
							max : 4,
							bold : "bold"
						} );

						css.transform( Input( {
							width : 134,
							height : 40,
							x : 484,
							y : 576,
							fontSize : 14,
							name : "Awards",
							caption : "颁奖人",
							index : 2,
							bold : "bold",
							color : "#d8271c",
							min : 2,
							max : 4
						} ), css.rotateZ( -20, "deg" ) );

						Input( {
							width : 504,
							height : 134,
							x : 68,
							y : 390,
							fontSize : 12,
							lineHeight : 18,
							name : "Reason",
							className : "reason",
							textArea : true,
							index : 1,
							caption : "获奖理由",
							placeholder : "获奖理由：",
							min : 10,
							max : 60,
							color : "#2d3e0a"
						} );

						dom.insertCSSRules( {
							"::-webkit-input-placeholder" : {
								color : "#2d3e0a"
							}
						} );

						Input( {
							width : 210,
							height : 46,
							x : 236,
							y : 680,
							fontSize : 20,
							name : "AwardsName",
							caption : "获奖名称",
							index : 3,
							min : 2,
							max : 5,
							color : "#fdf1c8",
							bold : "bold"
						} );

						pointer.onPointerDown( form, function () {
							curFocus && curFocus.blur();
						} );

						var button = el( element( "div", form ), 206, 84, 219, 803, 3 );
						pointer.onTap( button, function () {
							curFocus && curFocus.blur();
							var error = "", text = [];

							function newError( text ) {
								error !== "" && ( error += "<br>" );
								error += text;
							}

							if ( uploadFail !== false ) {
								newError( uploadFail );
							}

							util.loopArray( form.querySelectorAll( ".text" ), function ( input ) {
								var arg = input.arg;
								if ( input.value.length < arg.min ) {
									newError( arg.caption + "至少" + arg.min + "个字" );
								}
								text[arg.index] = input.value;
							} );

							if ( error ) {
								fp.alert( error );
							}
							else {
								fp.lock( true, form );
								var loading = fp.Loading( body );
								dom.ajax( {
									method : "post",
									url : "http://chuye.cloud7.com.cn/beta/Event/AwardsCustom",
									data : new FormData( form ),
									isJson : true,
									onLoad : function ( data ) {
										RazziesPreviewPage( {
											image : addPhoto.src,
											text : text,
											id : data.data
										}, function ( previewPage ) {
											loading.remove();
											body.appendChild( previewPage );
										} );
									}
								} );
							}
						} );

						form.appendChild( el( copyright, 326, 20, 158, 948, 3 ) );
						pointer.onTap( copyright, fp.downloadFirstPage );
					}

					page.appendChild( form );
				}
			} );
		} );
	} );

	registLayout( "razzies-custom", {
		resource : ["layout-razzies-background-custom.png",
			"layout-razzies-banner-left-new.png", "layout-razzies-banner-center-new.png", "layout-razzies-banner-right-new.png",
			"layout-razzies-print.png", "layout-razzies-share.png", "layout-razzies-more.png", "layout-razzies-copyright.png",
			"layout-razzies-cup.png", "layout-razzies-tips-continue.png", "layout-razzies-default-cup.png"],
		create : function ( page, data ) {
			var noImage = !data.image || data.image.length === 0 || !data.image[0];

			Component.BackgroundImage( page, data.resource[0], 1 );

			// 横幅文字内容
			var bannerTextContent = Content.Label( {
					fontSize : 15 * globalScale << 0,
					lineHeight : 15 * globalScale << 0,
					color : "#fdf1c8",
					text : "获奖人：" + data.text[0]
				} ),
				bannerWidth = bannerTextContent.width + 50 * globalScale << 0;

			// 横幅
			var banner = page.component( {
					content : Content.Rect( {
						width : bannerWidth,
						height : 35 * globalScale << 0
					} ),
					x : center( clientWidth, bannerWidth ),
					y : middleY( 150, globalScale ),
					"z-index" : 2
				} ),
				bannerSideWidth = 20 * globalScale << 0;

			// 横幅左
			banner.component( {
				content : Content.Image( data.resource[1], globalScale ),
				x : 0,
				y : 0
			} );

			// 横幅中
			banner.component( {
				content : Content.Image( data.resource[2], banner.componentWidth - bannerSideWidth * 2 + 8, banner.componentHeight ),
				x : bannerSideWidth - 3,
				y : 0
			} );

			// 横幅右
			banner.component( {
				content : Content.Image( data.resource[3], globalScale ),
				x : banner.componentWidth - bannerSideWidth,
				y : 0
			} );

			// 横幅字
			banner.component( {
				content : bannerTextContent,
				x : center( banner.componentWidth, bannerTextContent.width ),
				y : center( 30 * globalScale << 0, bannerTextContent.height )
			} );

			// 文字
			var textWidth = 250 * globalScale;
			var text = bindDataSource( page.component( {
				content : Content.BlockText( {
					width : textWidth,
					lineHeight : 20 * globalScale << 0,
					fontSize : 12 * globalScale << 0,
					text : data.text[1],
					color : "#2d3e0a"
				} ),
				x : center( clientWidth, textWidth ),
				y : middleY( 196, globalScale ),
				"z-index" : 2
			} ), "text", 1 );

			// 头像
			page.component( {
				content : Content.ImageCover( noImage ? data.resource[10] : data.image[0], 104 * globalScale << 0, 104 * globalScale << 0 ),
				x : middleX( 108, globalScale ),
				y : middleY( 33, globalScale )
			} );

			// 盖章
			data.resource[4].hasChild = true;
			var print = page.component( {
					content : Content.Image( data.resource[4], globalScale ),
					x : middleX( 462 / 2, globalScale ),
					y : middleY( 496 / 2, globalScale ),
					rotate : -20 / 180 * Math.PI,
					"z-index" : 2
				} ),
				rectWidth = print.componentHeight;

			// 盖章标题
			var printCaption = print.component( {
					content : Content.Rect( {
						height : rectWidth,
						width : rectWidth
					} ),
					x : 0,
					y : 0
				} ),
				printCaptionFontSize = 14 * globalScale << 0,
				printCaptionColor = "#d8271c";

			// 盖章上的文字
			printCaption.component( {
				content : Content.LineText( {
					fontSize : printCaptionFontSize,
					lineHeight : printCaptionFontSize,
					fontWeight : "bold",
					width : rectWidth,
					text : "颁奖人",
					color : printCaptionColor
				} ),
				y : 25 * globalScale << 0,
				x : 0
			} );

			printCaption.component( {
				content : Content.LineText( {
					fontSize : printCaptionFontSize,
					lineHeight : printCaptionFontSize,
					fontWeight : "bold",
					width : rectWidth,
					text : data.text[2],
					color : printCaptionColor
				} ),
				y : 45 * globalScale << 0,
				x : 0
			} );

			// 预览状态,不用奖杯,有两个按钮
			if ( data.preview ) {
				(function () {
					var awardFontSize = 20 * globalScale << 0,
						awardText = page.component( {
							content : Content.LineText( {
								fontSize : awardFontSize,
								lineHeight : awardFontSize,
								fontWeight : "bold",
								width : clientWidth,
								text : "年度" + data.text[3] + "奖",
								color : "#fdf1c8"
							} ),
							y : middleY( 680 / 2, globalScale ),
							x : 0,
							"z-index" : 2
						} );

					function goDownload() {
						localStorage.setItem( "razzies", data.preview );
						fp.downloadFirstPage();
					}

					// 版权行
					pointer.onTap( page.component( {
						content : Content.Image( data.resource[7], globalScale ),
						x : middleX( 158 / 2, globalScale ),
						y : middleY( 948 / 2, globalScale ),
						"z-index" : 2
					} ), goDownload );

					var share = page.component( {
						content : Content.Image( data.resource[5], globalScale ),
						x : middleX( 96 / 2, globalScale ),
						y : middleY( 804 / 2, globalScale ),
						"z-index" : 2
					} );

					pointer.onTap( share, function () {
						var imgSrc = ua.MicroMessenger ?
							ua.ios ? "firstpage-tips-up-ios.png" : "firstpage-tips-up-android.png" :
							ua.ios ? "firstpage-tips-down-ios.png" : "firstpage-tips-down-android.png";

						var tipsPage = element( "div", {
							css : {
								position : "absolute",
								left : 0,
								right : 0,
								top : 0,
								bottom : 0,
								"z-index" : 10000,
								background : util.tupleString( "url", [staticImgSrc( imgSrc )] ),
								"background-position" : ua.MicroMessenger ? "right top" : "center bottom",
								"background-size" : "cover",
								"background-color" : "rgba(0,0,0,0.9)"
							}
						}, document.body );

						pointer.onTap( tipsPage, function () {
							dom.removeNode( tipsPage );
						} );
					} );

					// 更多按钮,点击下载初夜
					var more = page.component( {
						content : Content.Image( data.resource[6], globalScale ),
						x : middleX( 344 / 2, globalScale ),
						y : middleY( 804 / 2, globalScale ),
						"z-index" : 2
					} );

					pointer.onTap( more, goDownload );

					page.registEnterAnimation( [
						[enterAnimate.fallDownAndShake( banner )],
						[enterAnimate.emerge( text )],
						[enterAnimate.circleRound( awardText )],
						[util.insert( enterAnimate.shrink( print ), {
							delay : 0.3
						} )],
						[enterAnimate.emerge( share ),
							enterAnimate.emerge( more )]
					] );
				})();
			}
			// 非预览状态,有奖杯
			else {
				if ( noImage ) {
					(function () {
						var awardFontSize = 20 * globalScale << 0,
							awardText = page.component( {
								content : Content.LineText( {
									fontSize : awardFontSize,
									lineHeight : awardFontSize,
									fontWeight : "bold",
									width : clientWidth,
									text : "年度" + data.text[3] + "奖",
									color : "#fdf1c8"
								} ),
								y : middleY( 680 / 2, globalScale ),
								x : 0,
								"z-index" : 2
							} );

						var continueSlide = page.component( {
							content : Content.Image( data.resource[9], globalScale ),
							x : middleX( 201 / 2, globalScale ),
							y : middleY( 853 / 2, globalScale ),
							"z-index" : 2
						} );

						page.registEnterAnimation( [
							[enterAnimate.fallDownAndShake( banner )],
							[enterAnimate.emerge( text )],
							[enterAnimate.circleRound( awardText )],
							[util.insert( enterAnimate.shrink( print ), {
								delay : 0.3
							} )],
							[util.insert( enterAnimate.fadeIn( continueSlide ), {
								delay : 2
							} )]
						] );
					})();
				}
				else {
					(function () {
						// 奖杯
						data.resource[8].hasChild = true;
						var cup = page.component( {
								content : Content.Image( data.resource[8], globalScale ),
								x : middleX( 132 / 2, globalScale ),
								y : middleY( 551 / 2, globalScale ),
								"z-index" : 2
							} ),
							rectWidth = 85 * globalScale << 0;

						// 奖杯标题
						var cupCaption = cup.component( {
								content : Content.Rect( {
									height : 37 * globalScale << 0,
									width : rectWidth
								} ),
								x : center( cup.componentWidth, rectWidth ) - 1,
								y : 129 * globalScale << 0
							} ),
							cupCaptionFontSize = 15 * globalScale << 0,
							cupCaptionColor = "#40234a";

						cupCaption.component( {
							content : Content.LineText( {
								fontSize : cupCaptionFontSize,
								lineHeight : cupCaptionFontSize,
								fontWeight : "bold",
								width : rectWidth,
								text : "年度",
								color : cupCaptionColor
							} ),
							y : 0,
							x : 0
						} );

						cupCaption.component( {
							content : Content.LineText( {
								fontSize : cupCaptionFontSize,
								lineHeight : cupCaptionFontSize,
								fontWeight : "bold",
								width : rectWidth,
								text : data.text[3] + "奖",
								color : cupCaptionColor
							} ),
							y : 20 * globalScale << 0,
							x : 0
						} );

						// 动画
						page.registEnterAnimation( [
							[enterAnimate.fallDownAndShake( banner )],
							[enterAnimate.emerge( text )],
							[util.insert( enterAnimate.shrink( cup ), {
								delay : 0.3
							} )],
							[util.insert( enterAnimate.shrink( print ), {
								duration : 0.4
							} )]
						] );
					})();
				}
			}
		}
	} );
})();

/**
 * Created by 白 on 2014/11/3.
 * 刮刮卡板式
 */

(function () {
	var util =zachModule["0"],
		dom =zachModule["2"],
		pointer =zachModule["4"],
		Canvas =zachModule["10"],
		imageViewer =zachModule["8"];

	registLayout( "scratch-card", {
		crossOrigin : "*",
		create : function ( page, data ) {
			page.component( {
				content : Content.ImageCover( data.image[0], clientWidth, clientHeight ),
				x : 0,
				y : 0
			} );

			if ( !data.complete ) {
				var up = page.component( {
						content : Content.ImageCover( data.image[1], clientWidth, clientHeight ),
						x : 0,
						y : 0
					} ),
					scratchLayer = Canvas.Layer(),
					imgLayout = imageViewer.layImageByFrame( data.image[1], {
						width : clientWidth,
						height : clientHeight,
						size : imageViewer.Size.cover,
						align : [0.5, 0.5]
					} );

				page.onShow( function () {
					// 刮层
					scratchLayer.resize( clientWidth, clientHeight );
					scratchLayer.classList.add( "scratch-card" );
					scratchLayer.draw( function ( gc ) {
						imageViewer.drawImageLayout( gc, imgLayout );
					} );
					document.body.appendChild( scratchLayer );
					document.body.classList.add( "hide-tips" );

					var line = [];
					var pointerHandle = pointer.onPointerDown( scratchLayer, function ( event, pageX, pageY ) {
						var points = [], isIn = true;
						line.push( points );

						event.preventDefault();
						event.stopPropagation();

						points.push( {
							x : pageX,
							y : pageY
						} );

						event.onMove( function ( event, pageX, pageY ) {
							points.push( {
								x : pageX,
								y : pageY
							} );
						} );

						event.onUp( function () {
							isIn = false;
						} );

						// 动画循环
						var animateHandle = dom.requestAnimate( function () {
							scratchLayer.draw( function ( gc ) {
								imageViewer.drawImageLayout( gc, imgLayout );
								gc.lineCap = "round";
								gc.lineJoin = "round";

								gc.globalCompositeOperation = "destination-out";
								gc.beginPath();

								util.loopArray( line, function ( points ) {
									util.loopArray( points, function ( point, i ) {
										i === 0 ? gc.moveTo( point.x, point.y ) : gc.lineTo( point.x, point.y );
									} );

									gc.lineWidth = 50;
									if ( ua.android ) {
										scratchLayer.style.display = 'none';
										//noinspection BadExpressionStatementJS
										scratchLayer.offsetHeight;
										scratchLayer.style.display = 'inherit';
									}
									gc.stroke();
								} );

								if ( !isIn ) {
									var error = false;
									animateHandle.remove();

									try {
										// 抬起时判断是否划过了30%,划过后移除刮刮卡效果
										var imgData = gc.getImageData( 0, 0, scratchLayer.width, scratchLayer.height ),
											pixels = imgData.data, count = 0;

										for ( var i = 0, j = pixels.length; i < j; i += 4 ) {
											if ( pixels[i + 3] < 128 ) {
												++count;
											}
										}
									}
									catch ( e ) {
										error = true;
									}

									if ( error || count / ( pixels.length / 4 ) > 0.3 ) {
										pointerHandle.remove();

										// 淡出动画
										dom.transition( scratchLayer, "0.8s", {
											opacity : 0
										}, function () {
											// 移除层
											document.body.classList.remove( "hide-tips" );
											data.complete = true;
											dom.removeNode( scratchLayer );
										} );
									}
								}
							} );
						} );
					} );

					up.remove();
				} );

				page.onRemove( function () {
					dom.removeNode( scratchLayer );
				} );
			}
		}
	} );
})();

/**
 * Created by 白 on 2014/9/15.
 * 按钮相关板式
 */

(function () {
	var util =zachModule["0"],
		dom =zachModule["2"],
		element = dom.element,
		pointer =zachModule["4"];

	function middleY( y ) {
		return y - 504 / 2 + clientHeight / 2 << 0;
	}

	registLayout( "Sign-Up02", {
		create : function ( page, data ) {
			var yList = {
					top : 148,
					middle : 417,
					bottom : 687
				},
				buttonSize = 125;

			bindDataSource( page.component( {
				content : Content.ImageCover( data.image[0], clientWidth, clientHeight ),
				x : 0,
				y : 0
			} ), "image", 0 );

			pointer.onTap( bindDataSource( page.component( {
				content : Content.Rect( {
					width : buttonSize,
					height : buttonSize
				} ),
				x : ( clientWidth - buttonSize ) / 2 << 0,
				y : middleY( yList[data.position[0]] / 2 )
			} ), "link", 0 ), function () {
				fp.jump( data.actionlinks[0] );
			} );
		}
	} );

	// 报名表单页
	var signUpFormPage = registFunctionPage( "sign-up", function ( page, formInfo ) {
		var formTemplate = JSON.parse( formInfo.template ), // 表单模板
			pageContent = element( "div.page-content", page ), // 报名页的内容部分
			form = element( "form", {
				action : "/"
			}, pageContent ),
			back = element( "div.icon.back", page ), // 返回按钮
			curFocus = null,
			lastInput = null,
			inputList = [], // 输入列表
			hideField = {}; // 隐藏字段

		page.classList.add( "sign-up-form-slide-page" );
		page.classList.add( "scroll" );

		pointer.onTap( back, fp.history.back );

		// 提交表单
		function submit() {
			curFocus && curFocus.blur();
			var formData = [], unfilled = [];

			function pushField( component, value ) {
				formData.push( {
					name : component.name,
					label : component.label,
					value : value
				} );
			}

			// 收集输入字段
			var errors = [];
			util.loopArray( inputList, function ( item ) {
				var value = item.input.value;
				// 如果是必填字段,检查是否为空,若为空,添加到未填数组中
				if ( item.data.required ) {
					if ( value === "" ) {
						unfilled.push( item.data.label );
						item.input.classList.add( "error" );
					}
					else {
						var validateInfo = item.validate ? item.validate( value ) : null;
						if ( validateInfo ) {
							errors.push( validateInfo );
							item.input.classList.add( "error" );
						}
						else {
							pushField( item.data, value );
							item.input.classList.remove( "error" );
						}
					}
				}
				else {
					pushField( item.data, item.input.value );
				}
			} );

			// 如果未填数组不为空,提示
			if ( unfilled.length !== 0 || errors.length !== 0 ) {
				fp.alert( ( unfilled.length ? [unfilled.join( "，" ) + "不能为空。"] : [] ).concat( errors ).join( "<br>" ) );
			}
			else {
				var loader = util.Loader(),
					loading = fp.Loading( page ),
					userInfo = {};

				fp.lock( true, pageContent );

				// 如果用户登录了,收集用户信息
				if ( fp.isLogIn() ) {
					loader.load( function ( loadDone ) {
						fp.getUserInfo( function ( data ) {
							userInfo = data;
							loadDone();
						} );
					} );
				}

				// 收集完信息后,整理数据,提交表单
				loader.start( function () {
					var hideData = {
						"报名时间" : new Date().getTime(),
						"微信昵称" : userInfo.NickName,
						"微信头像" : userInfo.HeadPhoto,
						"微信性别" : userInfo.Sex,
						"微信City" : userInfo.City,
						"微信Province" : userInfo.Province,
						"微信Country" : userInfo.Country
					};

					util.loopObj( hideField, function ( name, item ) {
						pushField( item, hideData[name] === undefined ? "" : hideData[name] );
					} );

					// 发送提交表单请求
					fp.sendForm( function () {
						loading.remove();

						// 弹出提示,1秒后移除页面
						fp.alert( formTemplate.data.submitComplete.value, 1000 );
						setTimeout( function () {
							if ( page.isIn() ) {
								fp.history.back();
							}
						}, 1000 );
					}, {
						id : formInfo.formId,
						data : formData
					} );
				} );
			}
		}

		dom.bindEvent( form, "submit", function ( event ) {
			event.preventDefault();
		} );

		util.loopArray( formTemplate.data.component, function ( component ) {
			if ( component.enable ) {
				if ( component.visiable ) {
					// 显示字段
					switch ( component.name ) {
						case "textbox":
							// 文本框
							(function () {
								var wrapper = {},
									label = element( "label", form ),
									caption = wrapper.caption = element( "div.caption", component.label + "：", label ), // 字段名
									input = wrapper.input = element( "input", {
										placeholder : component.placeholder,
										name : component.id
									}, label );

								switch ( component.label ) {
									case "电话":
										input.type = "tel";
										break;
									case "邮箱":
										input.type = "email";
										wrapper.validate = function ( value ) {
											return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value ) ?
												null : "请输入正确的邮箱地址";
										};
										break;
								}

								// 获得焦点时,更新curFocus
								dom.bindEvent( input, "focus", function () {
									curFocus = input;
								} );

								// 如果是必填的,添加一个必填字段坐标
								if ( component.required ) {
									element( "div.required.icon", caption );
								}

								// 如果有上一个input,按回车时更新到此焦点
								if ( lastInput ) {
									dom.bindEvent( lastInput, "keypress", function ( event ) {
										if ( event.keyCode === 13 ) {
											input.focus();
										}
									} );
								}

								lastInput = input;
								wrapper.data = component;
								inputList.push( wrapper );
							})();
							break;
						case "btn":
							// 按钮,目前一律视为提交按钮
							(function () {
								var label = element( "label", form ),
									button = element( "div.button", {
										innerHTML : component.value
									}, label );

								pointer.onTap( button, submit );
							})();
							break;
					}
				}
				else {
					hideField[component.label] = component;
				}
			}
		} );

		if ( lastInput ) {
			dom.bindEvent( lastInput, "keypress", function ( event ) {
				if ( event.keyCode === 13 ) {
					submit();
				}
			} );
		}
	} );

	registLayout( "Sign-Up03", {
		create : function ( page, data ) {
			page.component( {
				content : Content.ImageCover( data.image[0], clientWidth, clientHeight ),
				x : 0,
				y : 0
			} );

			var button = data.image[1];
			pointer.onTap( page.component( {
				content : Content.Image( button ),
				x : ( clientWidth - button.halfWidth ) / 2 << 0,
				y : middleY( 208 )
			} ), function () {
				window.preventJump = true;

				signUpFormPage( {
					data : data.signup,
					noLog : !JSON.parse( data.signup.template ).allowAnymous
				} );
			} );
		}
	} );
})();

/**
 * Created by 白 on 2015/1/20.
 */

(function () {
	var animate =zachModule["6"],
		util =zachModule["0"],
		z2d =zachModule["9"];

	registLayout( "valentine-01", {
		resource : ["layout-valentine-01-background.png"],
		create : function ( page, data ) {
			// 底层的三幅图
			util.loopArray( [{
				x : 62,
				y : 608,
				width : 230,
				height : 324,
				rotate : -6 / 180 * Math.PI
			}, {
				x : 348,
				y : 608,
				width : 230,
				height : 324
			}, {
				x : 222,
				y : 90,
				width : 356,
				height : 462
			}], function ( info, i ) {
				page.component( {
					content : Content.ImageCover( data.image[i], info.width / 2 * globalScale, info.height / 2 * globalScale ),
					x : middleX( info.x / 2, globalScale ),
					y : middleY( info.y / 2, globalScale ),
					rotate : info.rotate || 0
				} );
			} );

			// 背景
			Component.BackgroundImage( page, data.resource[0], 1 );

			// 两段文字
			var text1 = bindDataSource( page.component( Content.Image( data.image[3], globalScale ) ), "image", 3 ),
				text2 = bindDataSource( page.component( Content.Image( data.image[4], globalScale ) ), "image", 4 );

			text1["z-index"] = text2["z-index"] = 2;
			text2.x = text1.x = middleX( 70 / 2, globalScale );
			text1.y = middleY( 82 / 2, globalScale );
			text2.y = position.bottomTo( text1, text2 ) + text1.y + d( 9 );

			page.registEnterAnimation( [
				[enterAnimate.fadeIn( text1 )],
				[enterAnimate.fadeIn( text2 )]
			] );
		}
	} );

	registLayout( "valentine-02", {
		resource : ["layout-valentine-02-background.jpg", "layout-valentine-02-frame.png", "layout-valentine-02-love.png",
			"layout-valentine-02-rose.png"],
		create : function ( page, data ) {
			var imgComponents = [];

			// 背景
			page.component( Content.Image( data.resource[0], clientWidth, clientHeight ) );

			// 多图
			var multiImageFrame = page.component( {
				content : Content.Rect( {
					width : 191 * yRatio << 0,
					height : 200 * yRatio << 0
				} )
			} );

			util.loopArray( data.image.slice( 1 ), function ( img ) {
				imgComponents.push( multiImageFrame.component( Content.FrameImage( {
					frame : data.resource[1],
					img : img,
					imgX : 13 * yRatio,
					imgY : 15 * yRatio,
					imgWidth : 164 * yRatio,
					imgHeight : 162 * yRatio,
					frameWidth : multiImageFrame.componentWidth,
					frameHeight : multiImageFrame.componentHeight
				} ) ) );
			} );

			Component.MultiImageArea( {
				page : page,
				contents : imgComponents,
				sign : -1,
				parent : multiImageFrame,
				noAnimation : true,
				auto : true
			} );

			// Love
			var love = page.component( Content.Image( data.resource[2], yRatio ) );

			// 字
			var textFrame = page.component( Content.Rect( {
				width : 78 * yRatio,
				height : 16 * yRatio << 0
			} ) );
			var text = bindDataSource( page.component( Content.Image( data.image[0], yRatio ) ), "image", 0 );

			// 玫瑰
			var rose = page.component( Content.Image( data.resource[3], yRatio ) );

			// 所有元素水平居中
			util.loopArray( [multiImageFrame, love, textFrame, rose], function ( comp ) {
				comp.x = center( clientWidth, comp.componentWidth );
			} );
			multiImageFrame.y = Math.round( 74 / 2 * yRatio );
			love.y = position.bottomTo( multiImageFrame, love ) + multiImageFrame.y + Math.round( 25 * yRatio );
			textFrame.y = position.bottomTo( love, textFrame ) + love.y + Math.round( 20 * yRatio );
			text.x = position.center( textFrame, text ) + textFrame.x;
			text.y = position.middle( textFrame, text ) + textFrame.y;
			rose.y = clientHeight - rose.componentHeight + 2;

			page.onShow( function () {
				function rotateRose( rad ) {
					return z2d.transformOrigin( z2d.matrix.rotate( rad ),
						rose.componentWidth / 2 << 0, rose.componentHeight * 1.5 << 0 );
				}

				rose.infiniteAnimate( {
					timing : animate.Timing.linear,
					duration : 3.6,
					progress : {
						0 : {
							transform : rotateRose( 0 )
						},
						25 : {
							transform : rotateRose( 0.2 )
						},
						50 : {
							transform : rotateRose( 0 )
						},
						75 : {
							transform : rotateRose( -0.2 )
						},
						100 : {
							transform : rotateRose( 0 )
						}
					}
				} );
			} );
		}
	} );
})();

/**
 * Created by 白 on 2014/10/17.
 */

(function () {
	var dom =zachModule["2"],
		pointer =zachModule["4"];

	function middleY( y ) {
		return y - 508 / 2 + clientHeight / 2 << 0;
	}

	registLayout( "video", {
		resource : ["layout-video-icon.png"],
		create : function ( page, data ) {
			var icon = data.resource[0],
				iconSize = icon.halfWidth,
				iconX = ( clientWidth - iconSize ) / 2 << 0,
				iconY = middleY( 436 / 2 ),
				videoSrc = data.video[0];

			bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

			pointer.onTap( bindDataSource( page.component( {
				content : Content.Image( icon ),
				"z-index" : 2,
				x : iconX,
				y : iconY
			} ), "video", 0 ), function () {
				window.preventJump = true;

				// 构建视频页,尝试识别iframe
				var slidePage, iframe;

				// 如果识别出了iframe,创建滑页
				if ( iframe = dom.element( "div", videoSrc ).querySelector( "iframe" ) ) {
					slidePage = fp.slidePage();
					slidePage.onSlideIn( function () {
						window.stopAudio && window.stopAudio();
					} );
					slidePage.onSlideOut( function () {
						window.playAudio && window.playAudio();
					} );

					slidePage.classList.add( "video-slide-page" );
					iframe.width = clientWidth;
					iframe.height = clientWidth / 16 * 9 << 0;

					dom.css( iframe, {
						position : "absolute",
						left : 0,
						top : dom.css.px( ( clientHeight - iframe.height ) / 2 << 0 )
					} );

					var loading = fp.Loading( slidePage );
					iframe.onload = function () {
						loading.remove();
						iframe.onload = null;
					};
					slidePage.appendChild( iframe );
					pointer.onTap( dom.element( "div.close", slidePage ), fp.history.back );
				}

				if ( slidePage ) {
					slidePage.slideIn();
				}
				else if ( /(^http:\/\/)|(^https:\/\/)/.test( videoSrc ) ) {
					fp.jump( videoSrc );
				}
				else {
					alert( "未识别的视频地址" );
				}
			} );

			var circle = page.component( {
				content : Content.Circle( {
					color : "#FFFFFF",
					r : iconSize / 2 << 0
				} ),
				"z-index" : 1,
				x : iconX,
				y : iconY
			} );

			page.onShow( function () {
				circle.infiniteAnimate( {
					duration : 2.5,
					progress : {
						0 : {
							scale : 1,
							opacity : 0.8
						},
						100 : {
							scale : 2,
							opacity : 0
						}
					}
				} );
			} );
		}
	} );
})();

/**
 * Created by Json on 2014/11/18.
 */

registLayout( "ImageText18", {
	create : function ( page, data ) {
		// 背景
		bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

		page.registEnterAnimation( [
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[1] ),
					x : (clientWidth - data.image[1].halfWidth) / 2,
					y : clientHeight * 0.229167
				}
			), "image", 1 ) )],
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[2] ),
					x : (clientWidth - data.image[2].halfWidth ) / 2,
					y : clientHeight * 0.229167 + data.image[1].halfHeight + 29
				}
			), "image", 2 ) )],
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[3] ),
					x : (clientWidth - data.image[3].halfWidth) / 2,
					y : clientHeight * 0.229167 + data.image[1].halfHeight + data.image[2].halfHeight + 51
				}
			), "image", 3 ) )]
		] );
	}
} );

registLayout( "ImageText19", {
	create : function ( page, data ) {
		// 背景
		bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

		page.registEnterAnimation( [
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[1] ),
					x : (clientWidth - data.image[1].halfWidth) / 2,
					y : clientHeight * 0.84126 - data.image[3].halfHeight - data.image[2].halfHeight - data.image[1].halfHeight - 51
				}
			), "image", 1 ) )],
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[2] ),
					x : (clientWidth - data.image[2].halfWidth ) / 2,
					y : clientHeight * 0.84126 - data.image[3].halfHeight - 12 - data.image[2].halfHeight - 10
				}
			), "image", 2 ) )],
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.Image( data.image[3] ),
					x : (clientWidth - data.image[3].halfWidth) / 2,
					y : clientHeight * 0.84126 - data.image[3].halfHeight
				}
			), "image", 3 ) )]
		] );
	}
} );


registLayout( "ImageText20", {
	create : function ( page, data ) {
		// 背景
		bindDataSource( Component.BackgroundImage( page, data.image[0] ), "image", 0 );

		var title = bindDataSource( page.component(
			{
				content : Content.BlockText( {
					width : clientWidth - 150,
					fontSize : 27,
					lineHeight : 35,
					text : data.text[0],
					fontWeight : "bold",
					color : "white"
				} ),
				x : 75,
				y : 95
			}
		), "text", 0 );


		page.registEnterAnimation( [
			[enterAnimate.emerge( title )],
			[enterAnimate.emerge( bindDataSource( page.component(
				{
					content : Content.BlockText( {
						width : clientWidth - 150,
						fontSize : 10,
						lineHeight : 20,
						text : data.text[1],
						color : "#d2d2d2"
					} ),
					x : 75,
					y : 95 + title.componentHeight + 26
				}
			), "text", 1 ) )]
		] );
	}
} );
