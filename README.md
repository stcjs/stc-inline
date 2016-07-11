# stc-inline

Inline css/javascript in html.

Use `inline` attribute in `<link rel="stylesheet">` or `<script>` to trigger this.

```html
<script src="/resource/js/a.js" inline></script>
```

OR you can set `{jsinline: true}` to inline other js files. The syntax shoulde be like this:

```js
var xxx = {inline: "/resource/js/a.js"}.inline;
```

OR you can set `{datauri: true}` to inline small files in css files.

## Usage

```js
// stc.config.js
stc.workflow({
  inline: {
    plugin: inline,
    include: /\.(html|js|css)$/,
    options: {
      uglify: true,
      datauri: true,
      jsinline: true,
    }
  },
});
```

## Roadmap

* [x] support uglify
* [x] use cluster if possilbe
* [x] support `{inline: ""}.inline` in js files
* [x] support picture base64-ify in css files
* [ ] MIME lookup for css datauri inline