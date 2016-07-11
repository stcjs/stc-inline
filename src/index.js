import Plugin from 'stc-plugin';
import {extend, BackgroundURLMapper, ResourceRegExp} from 'stc-helper';
import {createToken, TokenType} from 'flkit';
import {isMaster} from 'cluster';

import UglifyJSPlugin from 'stc-uglify';
import CSSCompressPlugin from 'stc-css-compress';

const PIC_SIZE_MAX = 32768;
const REG_CSS_URL = /\s*url\(/;

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		let tokens = await this.getAst();
		let content = await this.getContent("utf-8");
		switch (this.file.extname) {
			case "html":
				await Promise.all(
					tokens.map((token, idx) => {
						if (isTag(token, "script") || isTag(token, "link")) {
							if (propExists(token, "inline")) {
								return idx;
							}
						}
					}).filter(idx => !!idx).map(idx => this.handleHTMLTokenPromise(tokens, idx))
				);
				return { tokens };
			case "css":
				if (this.options.datauri) {
					await Promise.all(
						tokens.map((token, idx) => {
							if (token.type === TokenType.CSS_VALUE) {
								if (REG_CSS_URL.test(token.value)) {
									return idx;
								}
							}
						}).filter(idx => !!idx).map(idx => this.handleCSSTokenPromise(tokens, idx))
					);
					return { tokens };
				}
				break;
			case "js":
				if (this.options.jsinline) {
					let newContent = await this.handleJSMatchPromise(content);
					return {
						content: newContent
					};
				}
				break;
			default: return;
		}
	}

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
			return relcontent;
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
		if (file.stat.size > PIC_SIZE_MAX) {
			return;
		}

		let rawContent = await file.getContent(null);
		let base64content = new Buffer(rawContent).toString('base64');

		mapper.url = `data:image/${mapper.type};base64,${base64content}`;
		// todo MIME lookup

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

		try {
			let file = await this.getFileByPath(path),
				content;
		} catch (err) {
			return;
		}

		try {
			if (isTag(token, "script")) {
				if (this.options.uglify) {
					let returnValue = await this.invokePlugin(UglifyJSPlugin, file);
					content = returnValue.content;
				} else {
					content = await file.getContent("utf-8");
				}

				allToken[idx] = createHTMLTagToken("script", content);
			} else if (isTag(token, "link")) {
				if (this.options.uglify) {
					let tokenlist = await this.invokePlugin(CSSCompressPlugin, file);
					allToken[idx] = createHTMLTagToken("style", "", tokenlist);
				} else {
					content = await file.getContent("utf-8");
					allToken[idx] = createHTMLTagToken("style", content);
				}
			}
		} catch (err) {
			this.error(`Token replace error`, allToken[idx].loc.start.line, allToken[idx].loc.start.column);
			console.error(err);
		}
	}

	/**
	 * update
	 */
	update(data) {
		switch (this.file.extname) {
			case "html":
			case "css":
				if (!data || !data.tokens) {
					return;
				}
				this.setAst(data.tokens);
				break;
			case "js":
				this.setContent(data.content);
				break;
			default: return;
		}
	}

	/**
	 * use cluster
	 */
	static cluster() {
		return true;
	}

	/**
	 * We wont use cache
	 */
	static cache() {
		return false;
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
