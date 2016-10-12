import Plugin from 'stc-plugin';
import mime from "mime";
import {extend, BackgroundURLMapper, ResourceRegExp, isRemoteUrl} from 'stc-helper';
import {createToken, TokenType} from 'flkit';
import {isMaster} from 'cluster';

import UglifyJSPlugin from 'stc-uglify';
import CSSCompressPlugin from 'stc-css-compress';

const PIC_SIZE_MAX = 32768;
const REG_CSS_URL = /\s*url\(/;

const JS_REPLACE_ARR = [
	[/\\/g, "\\u005C"],
	[/"/g, "\\u0022"],
	[/'/g, "\\u0027"],
	[/\//g, "\\u002F"],
	[/\r/g, "\\u000A"],
	[/\n/g, "\\u000D"],
	[/\t/g, "\\u0009"]
];

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		if (this.options.datauri && !Number.isInteger(this.options.datauri)) {
			this.options.datauri = PIC_SIZE_MAX;
		}
		switch (this.file.extname) {
			case "css":
				if (this.options.datauri) {
					let tokens = await this.getAst();
					await Promise.all(
						tokens.map((token, idx) => {
							if (token.type === TokenType.CSS_VALUE) {
								if (REG_CSS_URL.test(token.value)) {
									return idx;
								}
							}
						}).filter(idx => typeof idx !== "undefined")
							.map(idx => this.handleCSSTokenPromise(tokens, idx))
					);
					return { tokens };
				}
				break;
			case "js":
				if (this.options.jsinline) {
					let content = await this.getContent("utf-8");
					let newContent = await this.handleJSMatchPromise(content);
					return {
						content: newContent
					};
				}
				break;
			default:
				if (!this.isTpl()) {
					return;
				}
				let tokens = await this.getAst();
				await Promise.all(
					tokens.map((token, idx) => {
						if (isTag(token, "script") || isTag(token, "link")) {
							if (propExists(token, "inline")) {
								return idx;
							}
						}
					}).filter(idx => typeof idx !== "undefined")
						.map(idx => this.handleHTMLTokenPromise(tokens, idx))
				);
				return { tokens };
		}
	}
	escapeStyleTokenlist(tokenlist) {
		tokenlist.forEach((token) => {
			if (token.type === TokenType.CSS_VALUE) {
				token.value = this.escapeStyleContent(token.value)
			}
		});
	}
	escapeStyleContent(content) {
		return content.replace(/<\/style>/g, "\\3c/style\\3e");
	}
	escapeScriptContent(content) {
		return content.replace(/<\/script>/g, '\\x3c/script\\x3e');
	}
	escapeJsContent(content) {
		let str = content;

		for (var i = 0; i < JS_REPLACE_ARR.length; i++) {
			str = str.replace(JS_REPLACE_ARR[i][0], JS_REPLACE_ARR[i][1]);
		}
		return str;
	}
	/**
	 * handleJSMatchPromise()
	 * For each file content
	 * return a promise which
	 * replace `{inline:"xx"}.inline` to corresponding file content
	 */
	handleJSMatchPromise(_content) {
		let content = _content;
		return this.asyncReplace(content, ResourceRegExp.inline, async (a, b, c, d) => {
			let file = await this.getFileByPath(d);
			let relcontent;
			if (this.options.uglify) {
				let returnValue = await this.invokePlugin(UglifyJSPlugin, file);
				relcontent = returnValue.content;
			} else {
				relcontent = await file.getContent("utf-8");
			}
			relcontent = this.escapeJsContent(relcontent);
			return `{code:"${relcontent}"}`;
		});
	}

	/**
	 * handleCSSTokenPromise()
	 * For each CSS_VALUE token containing `url()`,
	 * return a promise which
	 * modify its value to base64 file content
	 */
	async handleCSSTokenPromise(allToken, idx) {
		let token = allToken[idx],
			mapper;
		try {
			mapper = new BackgroundURLMapper(token.value);
		} catch (err) {
			return;
		}

		if (mapper.isRemoteUrl()) {
			return;
		}

		let file = await this.getFileByPath(mapper.url);
		if (file.stat.size > this.options.datauri) {
			return;
		}

		let rawContent = await file.getContent(null);
		let base64content = new Buffer(rawContent).toString('base64');

		mapper.url = `data:${mime.lookup(mapper.url)};base64,${base64content}`;

		token.value = token.ext.value = mapper + "";
	}

	/**
	 * handleHTMLTokenPromise()
	 * For each token,
	 * return a promise which
	 * inlines file content, generate a token and replaces original token
	 */
	async handleHTMLTokenPromise(allToken, idx) {
		let path,
			token = allToken[idx];

		if (isTag(token, "script")) {
			path = getProp(token, "src");
		} else if (isTag(token, "link")) {
			path = getProp(token, "href");
		}
		if (!path) {
			return;
		}

		if(isRemoteUrl(path)) {
			if(!this.options.allowRemote) {
				return;
			}

			try {
				let content = await this.getContentFromUrl(path);
				content = content.toString();
				if (isTag(token, "script")) {
					content = this.escapeScriptContent(content);
					allToken[idx] = createHTMLTagToken("script", content);
				} else if (isTag(token, "link")) {
					content = this.escapeStyleContent(content);
					allToken[idx] = createHTMLTagToken("style", content);
				}
			} catch(e) {
				console.log(e);
				console.error(`Internet error, request for ${path} failed.`);
			}
			return;
		}

		let file;
		try {
			file = await this.getFileByPath(path);
		} catch (err) {
			return;
		}

		try {
			let content;
			if (isTag(token, "script")) {
				if (this.options.uglify) {
					let returnValue = await this.invokePlugin(UglifyJSPlugin, file);
					content = returnValue.content;
				} else {
					content = await file.getContent("utf-8");
				}

				content = this.escapeScriptContent(content);
				allToken[idx] = createHTMLTagToken("script", content);
			} else if (isTag(token, "link")) {
				if (this.options.uglify) {
					let tokenlist = await this.invokePlugin(CSSCompressPlugin, file);
					this.escapeStyleTokenlist(tokenlist);
					allToken[idx] = createHTMLTagToken("style", "", tokenlist);
				} else {
					content = await file.getContent("utf-8");
					content = this.escapeStyleContent(content);
					allToken[idx] = createHTMLTagToken("style", content);
				}
			}
		} catch (err) {
			// this.error(`Token replace error`, allToken[idx].loc.start.line, allToken[idx].loc.start.column);
			console.error(err);
		}
	}

	update(data) {
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
	}

	static cluster() {
		return false;
	}

	static cache() {
		return false;
	}

	static include() {
		return [{
			type: 'tpl'
		}, /\.(css|js)$/
		];
	}
}

function isTag(token, tagname) {
	if (token.type) {
		switch (token.type) {
			case TokenType.HTML_TAG_START:
				return token.ext.tagLowerCase === tagname;
			case TokenType.HTML_TAG_TEXTAREA:
				return tagname === "textarea";
			case TokenType.HTML_TAG_SCRIPT:
				return tagname === "script";
			case TokenType.HTML_TAG_STYLE:
				return tagname === "style";
			case TokenType.HTML_TAG_PRE:
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
	for (let attr of getProps(token)) {
		if (attr.nameLowerCase === attrname) {
			return attr.value;
		}
	}
	return;
}

function propExists(token, attrname) {
	for (let attr of getProps(token)) {
		if (attr.nameLowerCase === attrname) {
			return true;
		}
	}
	return false;
}

function delProp(token, attrname) {
	var srcID = -1,
		props = getProps(token);

	props.forEach((attr, index) => {
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
	let token;
	if (tagName === "style" || tagName === "script") {
		token = createToken(`html_tag_${tagName}`, `<${tagName}>${content}</${tagName}>`);

		token.ext.start = createToken(TokenType.HTML_TAG_START, `<${tagName}>`, token);
		token.ext.start.ext = {};
		token.ext.start.ext.attrs = [];
		token.ext.start.ext.tag = tagName;
		token.ext.start.ext.tagLowerCase = tagName;

		token.ext.content = createToken(TokenType.HTML_RAW_TEXT, content, token);
		token.ext.content.ext.tokens = contentTokens;

		token.ext.end = createToken(TokenType.HTML_TAG_END, `</${tagName}>`, token);
		token.ext.end.ext.tag = tagName;
		token.ext.end.ext.tagLowerCase = tagName;
	} // todo to be extended
	return token;
}
