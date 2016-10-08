'use strict';

exports.__esModule = true;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _stcPlugin = require('stc-plugin');

var _stcPlugin2 = _interopRequireDefault(_stcPlugin);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _stcHelper = require('stc-helper');

var _flkit = require('flkit');

var _cluster = require('cluster');

var _stcUglify = require('stc-uglify');

var _stcUglify2 = _interopRequireDefault(_stcUglify);

var _stcCssCompress = require('stc-css-compress');

var _stcCssCompress2 = _interopRequireDefault(_stcCssCompress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PIC_SIZE_MAX = 32768;
var REG_CSS_URL = /\s*url\(/;

var InlinePlugin = function (_Plugin) {
	(0, _inherits3.default)(InlinePlugin, _Plugin);

	function InlinePlugin() {
		(0, _classCallCheck3.default)(this, InlinePlugin);
		return (0, _possibleConstructorReturn3.default)(this, _Plugin.apply(this, arguments));
	}

	/**
  * run
  */

	InlinePlugin.prototype.run = function () {
		var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
			var _this2 = this;

			var _ret;

			return _regenerator2.default.wrap(function _callee3$(_context3) {
				while (1) {
					switch (_context3.prev = _context3.next) {
						case 0:
							if (this.options.datauri && this.options.datauri === true) {
								this.options.datauri = PIC_SIZE_MAX;
							}
							return _context3.delegateYield(_regenerator2.default.mark(function _callee2() {
								var _ret2, content, newContent, tokens;

								return _regenerator2.default.wrap(function _callee2$(_context2) {
									while (1) {
										switch (_context2.prev = _context2.next) {
											case 0:
												_context2.t0 = _this2.file.extname;
												_context2.next = _context2.t0 === "css" ? 3 : _context2.t0 === "js" ? 9 : 18;
												break;

											case 3:
												if (!_this2.options.datauri) {
													_context2.next = 8;
													break;
												}

												return _context2.delegateYield(_regenerator2.default.mark(function _callee() {
													var tokens;
													return _regenerator2.default.wrap(function _callee$(_context) {
														while (1) {
															switch (_context.prev = _context.next) {
																case 0:
																	_context.next = 2;
																	return _this2.getAst();

																case 2:
																	tokens = _context.sent;
																	_context.next = 5;
																	return _promise2.default.all(tokens.map(function (token, idx) {
																		if (token.type === _flkit.TokenType.CSS_VALUE) {
																			if (REG_CSS_URL.test(token.value)) {
																				return idx;
																			}
																		}
																	}).filter(function (idx) {
																		return typeof idx !== "undefined";
																	}).map(function (idx) {
																		return _this2.handleCSSTokenPromise(tokens, idx);
																	}));

																case 5:
																	return _context.abrupt('return', {
																		v: {
																			v: { tokens: tokens }
																		}
																	});

																case 6:
																case 'end':
																	return _context.stop();
															}
														}
													}, _callee, _this2);
												})(), 't1', 5);

											case 5:
												_ret2 = _context2.t1;

												if (!((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object")) {
													_context2.next = 8;
													break;
												}

												return _context2.abrupt('return', _ret2.v);

											case 8:
												return _context2.abrupt('break', 26);

											case 9:
												if (!_this2.options.jsinline) {
													_context2.next = 17;
													break;
												}

												_context2.next = 12;
												return _this2.getContent("utf-8");

											case 12:
												content = _context2.sent;
												_context2.next = 15;
												return _this2.handleJSMatchPromise(content);

											case 15:
												newContent = _context2.sent;
												return _context2.abrupt('return', {
													v: {
														content: newContent
													}
												});

											case 17:
												return _context2.abrupt('break', 26);

											case 18:
												if (_this2.isTpl()) {
													_context2.next = 20;
													break;
												}

												return _context2.abrupt('return', {
													v: void 0
												});

											case 20:
												_context2.next = 22;
												return _this2.getAst();

											case 22:
												tokens = _context2.sent;
												_context2.next = 25;
												return _promise2.default.all(tokens.map(function (token, idx) {
													if (isTag(token, "script") || isTag(token, "link")) {
														if (propExists(token, "inline")) {
															return idx;
														}
													}
												}).filter(function (idx) {
													return typeof idx !== "undefined";
												}).map(function (idx) {
													return _this2.handleHTMLTokenPromise(tokens, idx);
												}));

											case 25:
												return _context2.abrupt('return', {
													v: { tokens: tokens }
												});

											case 26:
											case 'end':
												return _context2.stop();
										}
									}
								}, _callee2, _this2);
							})(), 't0', 2);

						case 2:
							_ret = _context3.t0;

							if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
								_context3.next = 5;
								break;
							}

							return _context3.abrupt('return', _ret.v);

						case 5:
						case 'end':
							return _context3.stop();
					}
				}
			}, _callee3, this);
		}));

		function run() {
			return ref.apply(this, arguments);
		}

		return run;
	}();

	/**
  * handleJSMatchPromise()
  * For each file content
  * return a promise which
  * replace `{inline:"xx"}.inline` to corresponding file content
  */


	InlinePlugin.prototype.handleJSMatchPromise = function handleJSMatchPromise(_content) {
		var _this3 = this;

		var content = _content;
		return this.asyncReplace(content, _stcHelper.ResourceRegExp.inline, function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(a, b, c, d) {
				var file, relcontent, returnValue;
				return _regenerator2.default.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								_context4.next = 2;
								return _this3.getFileByPath(d);

							case 2:
								file = _context4.sent;
								relcontent = void 0;

								if (!_this3.options.uglify) {
									_context4.next = 11;
									break;
								}

								_context4.next = 7;
								return _this3.invokePlugin(_stcUglify2.default, file);

							case 7:
								returnValue = _context4.sent;

								relcontent = returnValue.content;
								_context4.next = 14;
								break;

							case 11:
								_context4.next = 13;
								return file.getContent("utf-8");

							case 13:
								relcontent = _context4.sent;

							case 14:
								return _context4.abrupt('return', relcontent);

							case 15:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, _this3);
			}));
			return function (_x, _x2, _x3, _x4) {
				return ref.apply(this, arguments);
			};
		}());
	};

	/**
  * handleCSSTokenPromise()
  * For each CSS_VALUE token containing `url()`,
  * return a promise which
  * modify its value to base64 file content
  */


	InlinePlugin.prototype.handleCSSTokenPromise = function () {
		var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(allToken, idx) {
			var token, mapper, file, rawContent, base64content;
			return _regenerator2.default.wrap(function _callee5$(_context5) {
				while (1) {
					switch (_context5.prev = _context5.next) {
						case 0:
							token = allToken[idx], mapper = void 0;
							_context5.prev = 1;

							mapper = new _stcHelper.BackgroundURLMapper(token.value);
							_context5.next = 8;
							break;

						case 5:
							_context5.prev = 5;
							_context5.t0 = _context5['catch'](1);
							return _context5.abrupt('return');

						case 8:
							if (!mapper.isRemoteUrl()) {
								_context5.next = 10;
								break;
							}

							return _context5.abrupt('return');

						case 10:
							_context5.next = 12;
							return this.getFileByPath(mapper.url);

						case 12:
							file = _context5.sent;

							if (!(file.stat.size > this.options.datauri)) {
								_context5.next = 15;
								break;
							}

							return _context5.abrupt('return');

						case 15:
							_context5.next = 17;
							return file.getContent(null);

						case 17:
							rawContent = _context5.sent;
							base64content = new Buffer(rawContent).toString('base64');


							mapper.url = 'data:' + _mime2.default.lookup(mapper.url) + ';base64,' + base64content;

							token.value = token.ext.value = mapper + "";

						case 21:
						case 'end':
							return _context5.stop();
					}
				}
			}, _callee5, this, [[1, 5]]);
		}));

		function handleCSSTokenPromise(_x5, _x6) {
			return ref.apply(this, arguments);
		}

		return handleCSSTokenPromise;
	}();

	/**
  * handleHTMLTokenPromise()
  * For each token,
  * return a promise which
  * inlines file content, generate a token and replaces original token
  */


	InlinePlugin.prototype.handleHTMLTokenPromise = function () {
		var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(allToken, idx) {
			var path, token, file, content, returnValue, tokenlist;
			return _regenerator2.default.wrap(function _callee6$(_context6) {
				while (1) {
					switch (_context6.prev = _context6.next) {
						case 0:
							path = void 0, token = allToken[idx];


							if (isTag(token, "script")) {
								path = getProp(token, "src");
							} else if (isTag(token, "link")) {
								path = getProp(token, "href");
							}

							if (path) {
								_context6.next = 4;
								break;
							}

							return _context6.abrupt('return');

						case 4:
							file = void 0;
							_context6.prev = 5;
							_context6.next = 8;
							return this.getFileByPath(path);

						case 8:
							file = _context6.sent;
							_context6.next = 14;
							break;

						case 11:
							_context6.prev = 11;
							_context6.t0 = _context6['catch'](5);
							return _context6.abrupt('return');

						case 14:
							_context6.prev = 14;
							content = void 0;

							if (!isTag(token, "script")) {
								_context6.next = 30;
								break;
							}

							if (!this.options.uglify) {
								_context6.next = 24;
								break;
							}

							_context6.next = 20;
							return this.invokePlugin(_stcUglify2.default, file);

						case 20:
							returnValue = _context6.sent;

							content = returnValue.content;
							_context6.next = 27;
							break;

						case 24:
							_context6.next = 26;
							return file.getContent("utf-8");

						case 26:
							content = _context6.sent;

						case 27:

							allToken[idx] = createHTMLTagToken("script", content);
							_context6.next = 42;
							break;

						case 30:
							if (!isTag(token, "link")) {
								_context6.next = 42;
								break;
							}

							if (!this.options.uglify) {
								_context6.next = 38;
								break;
							}

							_context6.next = 34;
							return this.invokePlugin(_stcCssCompress2.default, file);

						case 34:
							tokenlist = _context6.sent;

							allToken[idx] = createHTMLTagToken("style", "", tokenlist);
							_context6.next = 42;
							break;

						case 38:
							_context6.next = 40;
							return file.getContent("utf-8");

						case 40:
							content = _context6.sent;

							allToken[idx] = createHTMLTagToken("style", content);

						case 42:
							_context6.next = 48;
							break;

						case 44:
							_context6.prev = 44;
							_context6.t1 = _context6['catch'](14);

							this.error('Token replace error', allToken[idx].loc.start.line, allToken[idx].loc.start.column);
							console.error(_context6.t1);

						case 48:
						case 'end':
							return _context6.stop();
					}
				}
			}, _callee6, this, [[5, 11], [14, 44]]);
		}));

		function handleHTMLTokenPromise(_x7, _x8) {
			return ref.apply(this, arguments);
		}

		return handleHTMLTokenPromise;
	}();

	InlinePlugin.prototype.update = function update(data) {
		switch (this.file.extname) {
			case "css":
				if (!data || !data.tokens) {
					return;
				}
				this.setAst(data.tokens);
				break;
			case "js":
				if (!data || !data.content) {
					return;
				}
				this.setContent(data.content);
				break;
			default:
				if (!this.isTpl() || !data || !data.tokens) {
					return;
				}
				this.setAst(data.tokens);
		}
	};

	InlinePlugin.cluster = function cluster() {
		return false;
	};

	InlinePlugin.cache = function cache() {
		return false;
	};

	InlinePlugin.include = function include() {
		return [{
			type: 'tpl'
		}, /\.(css|js)$/];
	};

	return InlinePlugin;
}(_stcPlugin2.default);

exports.default = InlinePlugin;


function isTag(token, tagname) {
	if (token.type) {
		switch (token.type) {
			case _flkit.TokenType.HTML_TAG_START:
				return token.ext.tagLowerCase === tagname;
			case _flkit.TokenType.HTML_TAG_TEXTAREA:
				return tagname === "textarea";
			case _flkit.TokenType.HTML_TAG_SCRIPT:
				return tagname === "script";
			case _flkit.TokenType.HTML_TAG_STYLE:
				return tagname === "style";
			case _flkit.TokenType.HTML_TAG_PRE:
				return tagname === "pre";
			default:
		}
	}

	return false;
}

function getProps(token) {
	// todo to be extended
	if (isTag(token, "script")) {
		return token.ext.start.ext.attrs;
	} else if (isTag(token, "link")) {
		return token.ext.attrs;
	}
}

function getProp(token, attrname) {
	for (var _iterator = getProps(token), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
		var _ref;

		if (_isArray) {
			if (_i >= _iterator.length) break;
			_ref = _iterator[_i++];
		} else {
			_i = _iterator.next();
			if (_i.done) break;
			_ref = _i.value;
		}

		var attr = _ref;

		if (attr.nameLowerCase === attrname) {
			return attr.value;
		}
	}
	return;
}

function propExists(token, attrname) {
	for (var _iterator2 = getProps(token), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
		var _ref2;

		if (_isArray2) {
			if (_i2 >= _iterator2.length) break;
			_ref2 = _iterator2[_i2++];
		} else {
			_i2 = _iterator2.next();
			if (_i2.done) break;
			_ref2 = _i2.value;
		}

		var attr = _ref2;

		if (attr.nameLowerCase === attrname) {
			return true;
		}
	}
	return false;
}

function delProp(token, attrname) {
	var srcID = -1,
	    props = getProps(token);

	props.forEach(function (attr, index) {
		if (attr.nameLowerCase === attrname) {
			srcID = index;
		}
	});

	if (srcID === -1) {
		return;
	}

	props.splice(srcID, 1);
}

function createHTMLTagToken(tagName, content, contentTokens) {
	var token = void 0;
	if (tagName === "style" || tagName === "script") {
		token = (0, _flkit.createToken)('html_tag_' + tagName, '<' + tagName + '>' + content + '</' + tagName + '>');

		token.ext.start = (0, _flkit.createToken)(_flkit.TokenType.HTML_TAG_START, '<' + tagName + '>', token);
		token.ext.start.ext = {};
		token.ext.start.ext.attrs = [];
		token.ext.start.ext.tag = tagName;
		token.ext.start.ext.tagLowerCase = tagName;

		token.ext.content = (0, _flkit.createToken)(_flkit.TokenType.HTML_RAW_TEXT, content, token);
		token.ext.content.ext.tokens = contentTokens;

		token.ext.end = (0, _flkit.createToken)(_flkit.TokenType.HTML_TAG_END, '</' + tagName + '>', token);
		token.ext.end.ext.tag = tagName;
		token.ext.end.ext.tagLowerCase = tagName;
	} // todo to be extended
	return token;
}
//# sourceMappingURL=/Users/huangyan/Workspace/Ref/git/stcjs/stc-inline/lib/index.js.map