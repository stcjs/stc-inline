import Plugin from 'stc-plugin';
import {extend} from 'stc-helper';
import {createToken} from 'flkit';
//import {isMaster} from 'cluster';

function getPropAttr(token) {
	if (token._t === "script") {
		return token.ext.start.detail.attrs;
	} else if (token._t === "link") {
		return token.detail.attrs;
	}
}

function getProp(token, attrname) {
	let val = Number.POSITIVE_INFINITY;
	getPropAttr(token).forEach(attr => {
		if (attr.nameLowerCase === attrname) {
			val = attr.value;
		}
	});
	return val;
}

function getUrl(token) {
	if (token._t === "script") {
		return getProp(token, "src");
	} else if (token._t === "link") {
		return getProp(token, "href");
	}
}

function delProp(token, attrname) {
	var srcID = -1,
		props = getPropAttr(token);

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

function setContent(allToken, token, content) {
	if (token._t === "script") {
		delProp(token, "src");
		delProp(token, "inline");
		allToken[token._i].ext.content.value = content;
	} else if (token._t === "link") {
		let styleTag = createToken("html_tag_style", `<style>${content}</style>`);

		styleTag.ext.start = createToken("html_tag_start", "<style>", styleTag);
		styleTag.ext.content = createToken("html_raw_text", content, styleTag);
		styleTag.ext.end = createToken("html_tag_end", "</style>", styleTag);

		styleTag.ext.end.ext.tag = "style";
		styleTag.ext.end.ext.tagLowerCase = "style";

		styleTag.ext.start.detail = {};
		styleTag.ext.start.detail.attrs = [];
		styleTag.ext.start.detail.tag = "style";
		styleTag.ext.start.detail.tagLowerCase = "style";
		allToken[token._i] = styleTag;
	}
}

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		let tokens = await this.getAst();

		let inlinedToken = tokens
			.filter((token, idx) => {
				if (token.type === "html_tag_start" && token.detail.tag === "link") {
					token._t = "link";
					token._i = idx;
					return true;
				} else if (token.type === "html_tag_script") {
					token._t = "script";
					token._i = idx;
					return true;
				}
				return false;
			})
			.filter(token => getProp(token, "inline") !== Number.POSITIVE_INFINITY);

		if (!inlinedToken.length) {
			return;
		}

		await Promise.all(inlinedToken.map(token => {
			let path = getUrl(token);
			if (!path) {
				console.log(`Inline: parse error for: ${token.value} @${this.file._path}`)
				return Promise.resolve();
			}
			return this.getFileByPath(path)
				.then((file) => file.getContent("utf-8"))
				.then((content) => setContent(tokens, token, content))
				.catch((err) => {
					console.error(err);
					console.log(`Inline: cannot find file: ${path} @${this.file._path}`);
				});
		}));

		return { tokens };
	}
	/**
	 * update
	 */
	async update(data) {
		if (!data) {
			return;
		}
		await this.setAst(data.tokens);
	}
	/**
	 * use cluster
	 */
	static cluster() {
		return false;
	}
	/**
	 * use cache
	 */
	static cache() {
		return false;
	}
}