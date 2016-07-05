import Plugin from 'stc-plugin';
import {extend} from 'stc-helper';
import {createToken, TokenType} from 'flkit';
import {isMaster} from 'cluster';
import UglifyJSPlugin from 'stc-uglify';
import CSSCompressPlugin from 'stc-css-compress';

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		let allToken = await this.getAst(),
			inlinedTokenIds = [];

		allToken.forEach((token, idx) => {
			if (isTag(token, "script") || isTag(token, "link")) {
				if (propExists(token, "inline")) {
					inlinedTokenIds.push(idx);
				}
			}
		});

		await Promise.all(
			inlinedTokenIds.map(
				idx => this.replaceTokenPromise(allToken, idx)
					.catch((err) => {
						this.error(`Token replace error`, allToken[idx].loc.start.line, allToken[idx].loc.start.column);
						console.error(err);
					})
			)
		);

		return { allToken };
	}

	/**
	 * replaceTokenPromise()
	 * For each token,
	 * return a promise which
	 * inlines file, generate a token and replaces original token
	 */
	async replaceTokenPromise(allToken, idx) {
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

		let file = await this.getFileByPath(path),
			content;

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
	}

	/**
	 * update
	 */
	update(data) {
		if (!data) {
			return;
		}
		this.setAst(data.allToken);
	}

	/**
	 * We wont use cluster
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
