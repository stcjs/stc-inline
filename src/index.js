import Plugin from 'stc-plugin';
import {extend} from 'stc-helper';
//import {createToken} from 'flkit';
//import {isMaster} from 'cluster';

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		let allToken = await this.getAst(),
			tokenIndex = new Map(),
			inlinedToken = allToken.filter((token, idx) => {
				if (isTag(token, "script") || isTag(token, "link")) {
					if (propExists(token, "inline")) {
						tokenIndex.set(token, idx);
						return true;
					}
				}
				return false;
			});

		await Promise.all(inlinedToken.map(token => {
			let path = getUrl(token);
			if (!path) {
				console.log(`Inline: parse error for: ${token.value} @${this.file._path}`)
				return Promise.resolve();
			}
			return this.getFileByPath(path)
				.then((file) => file.getContent("utf-8"))
				.catch((err) => {
					console.error(err);
					console.log(`Inline: cannot find file: ${path} @${this.file._path}`);
				})
				.then((content) => {
					allToken[tokenIndex.get(token)] = setContent(token, content);
				})
				.catch((err) => {
					console.error(err);
					console.log(`Inline: content token parse error ${path} @${this.file._path}`);
				});
		}));

		return { allToken };
	}
	/**
	 * update
	 */
	async update(data) {
		if (!data) {
			return;
		}
		await this.setAst(data.allToken);
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

function isTag(token, tagname) {
	if (token.type) {
		switch (token.type) {
			case "html_tag_start":
				return token.ext.tagLowerCase === tagname;
			case "html_tag_textarea":
				return tagname === "textarea";
			case "html_tag_script":
				return tagname === "script";
			case "html_tag_style":
				return tagname === "style";
			case "html_tag_pre":
				return tagname === "pre";
			// case "html_tag_end":
			// 	return token.ext.tagLowerCase === tagname;
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
	let val = Number.POSITIVE_INFINITY;
	getProps(token).forEach(attr => {
		if (attr.nameLowerCase === attrname) {
			val = attr.value;
		}
	});
	return val === Number.POSITIVE_INFINITY ? null : val;
}

function propExists(token, attrname) {
	for(let attr of getProps(token)) {
		if(attr.nameLowerCase === attrname) {
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

function getUrl(token) {
	if (isTag(token, "script")) {
		return getProp(token, "src");
	} else if (isTag(token, "link")) {
		return getProp(token, "href");
	}
}

function setContent(token, content) {
	if (isTag(token, "script")) {
		delProp(token, "src");
		delProp(token, "inline");
		token.ext.content.value = content;

		return token;
	} else if (isTag(token, "link")) {
		let styleToken = this.createToken("html_tag_style", `<style>${content}</style>`);

		styleToken.ext.start = this.createToken("html_tag_start", "<style>", styleToken);
		styleToken.ext.start.ext = {};
		styleToken.ext.start.ext.attrs = [];
		styleToken.ext.start.ext.tag = "style";
		styleToken.ext.start.ext.tagLowerCase = "style";

		styleToken.ext.content = this.createToken("html_raw_text", content, styleToken);

		styleToken.ext.end = this.createToken("html_tag_end", "</style>", styleToken);
		styleToken.ext.end.ext.tag = "style";
		styleToken.ext.end.ext.tagLowerCase = "style";

		return styleToken;
	}
}
