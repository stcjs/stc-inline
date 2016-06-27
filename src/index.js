import Plugin from 'stc-plugin';
import {extend} from 'stc-helper';
//import {isMaster} from 'cluster';

const PATH_REG = /\b(?:href|src)=("|'|)([-a-zA-Z0-9@:%_\+.~#?&/=]+)\1/;

export default class InlinePlugin extends Plugin {
	/**
	 * run
	 */
	async run() {
		let content = await this.getContent('utf-8');
		let tokens = await this.getAst();

		let inlinedToken = tokens
			.map((token, idx) => extend(token, { idx }))
			.filter(token => token.type === "html_tag_start" || token.type === "html_tag_script")
			.filter(token => /^(<link|<script)/.test(token.value))
			.filter(token => /\binline/.test(token.value));

		if (!inlinedToken.length) {
			return { tokens };
		}

		await Promise.all(inlinedToken.map(token => {
			let path = this.htmlValueToPath(token.value);
			if (!path) {
				console.log(`Inline: parse error for: ${token.value} @${this.file._path}`)
				return Promise.resolve();
			}
			return this.getFileByPath(path)
				.then((file) => file.getContent("utf-8"))
				.then((content) => {
					tokens[token.idx].value = content;
				})
				.catch((err) => {
					console.error(err);
					console.log(`Inline: cannot find file: ${path} @${this.file._path}`);
				});
		}));

		return { tokens };
	}
	/**
	 * htmlValueToPath
	 * get path from an html value
	 * SAMPLE INPUT:  "<link rel="stylesheet" href="a.css?2" inline>"
	 * SAMPLE OUTPUT: "a.css?2"
	 */
	htmlValueToPath(val) {
		let matches = PATH_REG.exec(val);
		return matches && matches.length && matches[2];
	}
	/**
	 * update
	 */
	update(data) {
		this.setAst(data.tokens);
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