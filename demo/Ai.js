(function() {

	//补充ECMAScript5里的方法
	var arrayMethod = Array.prototype;
	if(!arrayMethod.forEach) {
		arrayMethod.forEach = function(fn, sc){
			for(var i = 0, l = this.length >>> 0; i < l; i++){
				if (i in this)
					fn.call(sc, this[i], i, this);
			}
		};
	}
	if(!arrayMethod.map) {
		arrayMethod.map = function(fn, sc){
			for(var i = 0, copy = [], l = this.length >>> 0; i < l; i++){
				if (i in this)
					copy[i] = fn.call(sc, this[i], i, this);
			}
			return copy;
		};
	}
	if(!arrayMethod.indexOf) {
		arrayMethod.indexOf = function(value, from){
			var len = this.length >>> 0;

			from = Number(from) || 0;
			from = Math[from < 0 ? 'ceil' : 'floor'](from);
			if(from < 0) {
				from = Math.max(from + len, 0);
			}

			for(; from < len; from++) {
				if(from in this && this[from] === value) {
					return from;
				}
			}

			return -1;
		};
	}
	Array.isArray || (Array.isArray = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	});
	Object.keys || (Object.keys = function(o) {
		var ret=[],p;
		for(p in o)
			if(Object.prototype.hasOwnProperty.call(o,p))
				ret.push(p);
		return ret;
	});
	Object.create || (Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	});

	document.head = document.head || document.getElementsByTagName('head')[0];

})();
var $$ = (function() {
	var lib = {},
		state = {},
		list = {},
		LOADING = 1,
		LOADED = 2,
		baseUrl = location.href.replace(/\/[^/]*$/, '/');
	/**
	 * @public 设置script的url的映射关系，为版本自动化做准�?
	 * @param {url} �?��映射的url
	 * @param {url} 映射的结�?
	 * @param {boolean} 是否强制覆盖，可�?
	 */
	function join(key, url, force) {
		if(arguments.length == 0) {
			return lib;
		}
		else if(arguments.length == 1) {
			return lib[key];
		}
		else {
			//join时可能不是绝对路径�?是相对根路径，由构建工具生成
			url = path(url);
			if(force || !lib[key]) {
				lib[key] = url;
			}
		}
	}
	/**
	 * @public 可并行加载script文件，且仅加载一�?
	 * @param {url} script的url
	 * @param {Function} 回调
	 * @param {String} script编码，可省略
	 */
	function load(url, cb, charset) {
		cb = cb || function(){};
		url = path(url);
		if(state[url] == LOADED) {
			cb();
		}
		else if(state[url] == LOADING) {
			list[url].push(cb);
		}
		else {
			state[url] = LOADING;
			list[url] = [cb];
			//创建script
			var s = document.createElement('script');
			s.async = true;
			if(charset)
				s.charset = charset;
			//版本自动�?
			s.src = lib[url] || url;
			function ol() {
				s.onload = s.onreadystatechange = null;
				state[url] = LOADED;
				list[url].forEach(function(cb) {
					cb();
				});
				list[url] = [];
				setTimeout(function() {
					document.head.removeChild(s);
				}, 1);
			}
			if(s.addEventListener)
				s.onload = s.onerror = ol;
			else {
				s.onreadystatechange = function() {
					if(/loaded|complete/.test(this.readyState))
						ol();
				};
			}
			document.head.appendChild(s);
		}
	}
	/**
	 * @public 读取/设置全局根路�?
	 * @param {String} 设置的路�?
	 * @return {String} 根路�?
	 */
	function base(url) {
		if(url)
			baseUrl = url;
		return baseUrl;
	}
	/**
	 * @public 获取绝对路径
	 * @param {string} url �?��转换的url
	 * @param {string} 依赖的url
	 * @return {String} 转换的结�?
	 */
	function path(url, depend) {
		if(/^https?:\/\//.test(url))
			return url;
		depend = depend || baseUrl;
		var match = /(.+:\/\/)(.+)/.exec(depend);
		var temp = match[2].split('/');
		temp.pop();
		temp[0] = match[1] + temp[0];
		if(url.charAt(0) == '/')
			return temp.join('/') + url;
		else if(url.indexOf('../') == 0) {
			while(url.indexOf('../') == 0) {
				url = url.slice(3);
				temp.pop();
			}
			return temp.join('/') + '/' + url;
		}
		else if(url.indexOf('./') == 0)
			url = url.slice(2);
		return temp.join('/') + '/' + url;
	}

	return {
		join: join,
		load: load,
		base: base,
		path: path
	}
})();
var require,
	define;

(function() {

	var toString = Object.prototype.toString,
		lib = {},
		relation = {},
		finishUrl,
		defQueue,
		delayCount = 0,
		delayQueue = [],
		interactive = document.attachEvent && !window['opera'],
		lock = {};

	function isString(o) {
        return toString.call(o) == '[object String]';
	}
	function isFunction(o) {
        return toString.call(o) == '[object Function]';
	}
	function isUndefined(o) {
		return typeof o === 'undefined';
	}

	/**
	 * @public amd定义接口
	 * @param {string} 模块id，可选，省略为script文件url
	 * @param {array} 依赖模块id，可�?
	 * @param {Function/object} 初始化工�?
	 */
	define = function(id, dependencies, factory) {
		if(arguments.length == 1) {
			factory = id;
			id = dependencies = null;
		}
		else {
			if(!isString(id)) {
				factory = dependencies;
				dependencies = id;
				id = null;
			}
			if(!Array.isArray(dependencies)) {
				factory = dependencies;
				dependencies = null;
			}
		}
		var module = {
			id: id,
			dependencies: dependencies || [],
			//另外�?��依赖写法，�?过factory.toString()方式匹配，智能获取依赖列�?
			rdep: isFunction(factory) ? getDepedencies(factory.toString()) : [],
			factory: factory
		};
		//具名模块
		if(id)
			lib[id] = module;
		//记录factory和module的hash对应关系
		if(isFunction(factory))
			record(factory, module);
		//构建工具合并的模块先声明了url，可以直接跳过以后所有�?�?
		if(finishUrl) {
			fetch(module, finishUrl);
			return;
		}
		if(document.currentScript) {
			fetch(module, document.currentScript.src || location.href.replace(/#.*/, ''));
			return;
		}
		//ie下利用interactive特�?降低并发情况下非�?��性错误几�?
		if(interactive) {
			var s = document.head.getElementsByTagName('script'),
				i = s.length - 1;
			for(; i >= 0; i--) {
				if(s[i].readyState == 'interactive') {
					fetch(module, s[i].hasAttribute ? s[i].src : s[i].getAttribute('src', 4));
					return;
				}
			}
		}
		//走正常�?辑，存入def队列
		if(defQueue)
			defQueue.push(module);
		finishUrl = null;
	}
	define.amd = { jQuery: true };
	define.url = function(url) {
		finishUrl = getAbsUrl(url);
	}
	function fetch(mod, url) {
		mod.uri = url;
		lib[url] = mod;
		finishUrl = null;
	}
	function record(factory, mod, callee) {
		var ts = getFunKey(factory);
		(relation[ts] = relation[ts] || []).push({
			f: factory,
			m: mod
		});
	}
	function getFunKey(factory) {
		return factory.toString().slice(0, 32);
	}
	/**
	 * @public 加载使用模块方法
	 * @param {string/array} 模块id或url
	 * @param {Function} 加载成功后回�?
	 * @param {string} 模块的强制编码，可省�?
	 * @param {array} 加载的链记录
	 */
	function use(ids, cb, charset, chain) {
		defQueue = defQueue || []; //use之前的模块为手动添加在页面script标签的模块或合并在�?库中的模块，它们�?��排除在外
		chain = chain || [];
		var idList = isString(ids) ? [ids] : ids, wrap = function() {
			var keys = idList.map(function(v) {
				return lib[v] ? v : getAbsUrl(v);
			}), mods = [];
			keys.forEach(function(k) {
				var mod = getMod(k);
				if(!mod.exports) {
					var deps = [];
					mod.exports = {};
					//有依赖参数为依赖的模块，否则默认为require, exports, module3个默认模�?
					if(mod.dependencies && mod.dependencies.length) {
						mod.dependencies.forEach(function(d) {
							//使用exports模块用作导出
							if(d == 'exports')
								deps.push(mod.exports);
							//使用module模块即为本身
							else if(d == 'module')
								deps.push(mod);
							else {
								var m = lib[d] || getMod(getAbsUrl(d, mod.uri));
								deps.push(m.exports);
							}
						});
						deps.push(require);
						deps.push(mod.exports);
						deps.push(mod);
					}
					else
						deps = [require, mod.exports, mod];
					if(isFunction(mod.factory)) {
						var ret = mod.factory.apply(null, deps);
						mod.exports = isUndefined(ret) ? mod.exports : ret;
					}
					else {
						mod.exports = mod.factory;
					}
					delete mod.factory;
					mod.dependencies = mod.dependencies.concat(mod.rdep);
					delete mod.rdep;
				}
				mods.push(mod.exports);
			});
			cb.apply(null, mods);
		}, recursion = function() {
			var urls = idList.map(function(v) {
				return lib[v] ? v : getAbsUrl(v);
			}), deps = [];
			urls.forEach(function(url) {
				var mod = getMod(url),
					d = mod.dependencies;
				//尚未初始化的模块�?��循环依赖和统计依�?
				if(isUndefined(mod.exports)) {
					checkCyclic(mod, {}, []);
					d.forEach(function(id) {
						deps.push(lib[id] ? id : getAbsUrl(id, mod.uri));
					});
					mod.rdep.forEach(function(id) {
						deps.push(lib[id] ? id : getAbsUrl(id, mod.uri));
					});
				}
			});
			//如果有依赖，先加载依赖，否则直接回调
			if(deps.length)
				use(deps, wrap, charset, Object.create(chain));
			else
				wrap();
		};
		if(isString(ids)) {
			var url = getAbsUrl(ids);
			if(lib[ids] || lib[url])
				recursion();
			else {
				chain.push(url);
				$$.load(url, function() {
					//延迟模式下onload先于exec，进�?次幂延迟算法等待
					if(delayQueue.length)
						delayQueue.push(cb);
					else
						cb();
					function cb() {
						//必须判断重复，防�?个use线程加载同一个script同时触发2次callback
						if(!lib[url]) {
							if(defQueue.length) {
								var mod = defQueue.shift();
								fetch(mod, url);
							}
							else {
								d2();
								return;
							}
						}
						recursion();
						//如果还在延迟排队，执行延迟队�?
						if(delayQueue.length)
							delayQueue.shift()();
					}
					function d2() {
						//等待到defQueue中有了的时�?即可停止延迟，另外当lib[url]有了的时候也可以，因为可能是打包合并的模块文件onload抢先了，此时合并的文件的模块没有存入defQueue，但在define.finish中传入url存入了lib[url]
						if(defQueue.length || lib[url]) {
							delayCount = 0;
							cb();
							if(delayQueue.length)
								delayQueue.shift()();
						}
						else {
							if(delayCount > 5) {
								//这里可能有极低几率不准确，因为ie情况下define没进队列但得到了url属�?，因此判断模块是否存在并执行；理论上倘若define还没执行但模块有老的，会出错
								if(lib[url]) {
									delayCount = 0;
									recursion();
									if(delayQueue.length)
										delayQueue.shift()();
									return;
								}
								throw new Error('2^ delay is too long to wait:\n' + chain.join(' -> '));
							}
							setTimeout(d2, Math.pow(2, delayCount++) << 4); //2 ^ n * 16的时间等比累�?
						}
					}
				}, charset);
			}
		}
		else {
			var remote = ids.length;
			ids.forEach(function(id) {
				use(id, function() {
					if(--remote == 0)
						recursion();
				}, charset, Object.create(chain));
			});
		}
	}
	/**
	 * private �?��循环依赖
	 * @param {object} 模块
	 * @param {hashmap} 历史记录
	 * @param {array} 依赖顺序
	 */
	function checkCyclic(mod, history, list) {
		if(!mod)
			return;
		var id = mod.uri || mod.id;
		list.push(id);
		if(history[id])
			throw new Error('cyclic dependencies:\n' + list.join('\n'));
		history[id] = true;
		mod.dependencies && mod.dependencies.forEach(function(dep) {
			checkCyclic(lib[dep] || lib[getAbsUrl(dep, mod.uri)], Object.create(history), Object.create(list));
		});
	}
	/**
	 * private 根据传入的id或url获取模块
	 * @param {string} 模块id或url
	 */
	function getMod(s) {
		var mod = lib[s];
		if(!mod)
			throw new Error('module undefined:\n' + s);
		return mod;
	}
	/**
	 * 根据依赖script的url获取绝对路径
	 * @param {string} url �?��转换的url
	 * @param {string} 依赖的url
	 */
	function getAbsUrl(url, depend) {
		//自动末尾补加.js
		if(!/\.\w+$/.test(url))
			url += '.js';
		if(url.charAt(0) == '/')
			depend = $$.base();
		return $$.path(url, depend);
	}
	//默认的require虚拟模块
	require = function(id, cb, charset) {
		if(arguments.length == 0) {
			return lib;
		}
		else if(arguments.length == 1) {
			if(lib[id])
				return lib[id].exports;
			var caller = arguments.callee.caller,
				ts = getFunKey(caller),
				mod;
			relation[ts].forEach(function(o) {
				if(caller == o.f)
					mod = o.m;
			});
			return getMod(getAbsUrl(id, mod.uri)).exports;
		}
		else {
			use(id, cb, charset);
		}
	};
	//仅对构建调试工具有效，不自动打包进来模块
	require.async = require;
	//同步使用模块，之后使用的必须等到同步执行完成�?
	require.sync = function(id, cb, charset) {
		if(!Array.isArray(id)) {
			id = [id];
		}
		id = id.map(function(id) {
			return id.charAt(0) == '/' ? id.slice(1) : id;
		});
		function wrap() {
			var first = true,
				args = Array.prototype.slice.call(arguments, 0);
			id.forEach(function(id) {
				if(lock[id][0] != wrap) {
					first = false;
				}
			});
			if(first) {
				wrap.execed = true;
				cb.apply(null, args);
				id.forEach(function(id) {
					lock[id].shift();
					while(lock[id].length) {
						var w = lock[id][0];
						if(w.execed) {
							lock[id].shift();
						}
						else if(w.init && !w.execed) {
							w.execed = true;
							w.apply(null, w.args);
							lock[id].shift();
						}
						else {
							break;
						}
					}
				});
			}
			else {
				wrap.args = args;
				wrap.init = true;
			}
		}
		id.forEach(function(id) {
			lock[id] = lock[id] || [];
			lock[id].push(wrap);
		});
		require(id, wrap, charset);
	};

	define('require', require);
	//exports和module
	define('exports', {});
	define('module', {});

	function getDepedencies(s) {
		if(s.indexOf('require', 11) == -1) {
			return [];
		}
		var index = 11, peek, length = s.length, isReg = true, modName = false, parentheseState = false, parentheseStack = [], res = [];
		while(index < length) {
			readch();
			if(isBlank()) {
			}
			else if(isQuote()) {
				dealQuote();
				isReg = true;
			}
			else if(peek == '/') {
				readch();
				if(peek == '/') {
					index = s.indexOf('\n', index);
					if(index == -1) {
						index = s.length;
					}
					isReg = true;
				}
				else if(peek == '*') {
					index = s.indexOf('*/', index) + 2;
					isReg = true;
				}
				else if(isReg) {
					dealReg();
					isReg = false;
				}
				else {
					index--;
					isReg = true;
				}
			}
			else if(isWord()) {
				dealWord();
			}
			else if(peek == '(') {
				parentheseStack.push(parentheseState);
				isReg = true;
			}
			else if(peek == ')') {
				isReg = parentheseStack.pop();
			}
			else {
				isReg = peek != ']';
				modName = false;
			}
		}
		return res;
		function readch() {
			peek = s.charAt(index++);
		}
		function isBlank() {
			return /\s/.test(peek);
		}
		function isQuote() {
			return peek == '"' || peek == "'";
		}
		function dealQuote() {
			var start = index,
				c = peek,
				end = s.indexOf(c, start);
			if(s.charAt(end - 1) != '\\') {
				index = end + 1;
			}
			else {
				while(index < length) {
					readch();
					if(peek == '\\') {
						index++;
					}
					else if(peek == c) {
						break;
					}
				}
			}
			if(modName) {
				res.push(s.slice(start, index - 1));
				modName = false;
			}
		}
		function dealReg() {
			index--;
			while(index < length) {
				readch();
				if(peek == '\\') {
					index++;
				}
				else if(peek == '/') {
					break;
				}
				else if(peek == '[') {
					while(index < length) {
						readch();
						if(peek == '\\') {
							index++;
						}
						else if(peek == ']') {
							break;
						}
					}
				}
			}
		}
		function isWord() {
			return /[\w$.]/.test(peek);
		}
		function dealWord() {
			if(/[\w$.]/.test(s.charAt(index))) {
				var r = /^[\w$.]+/.exec(s.slice(index - 1))[0];
				modName = (/^require(\s*\.\s*async)?$/.test(r));
				index += r.length - 1;
				parentheseState = ['if', 'for', 'while'].indexOf(r) != -1;
				isReg = ['else', 'in', 'return', 'typeof', 'delete'].indexOf(r) != -1;
			}
			else {
				modName = false;
				isReg = false;
			}
		}
	}

})();
/**
 * @import base/fix.js
 * @import base/lang.js
 * @import base/amd.js
 */
