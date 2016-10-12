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

Setting `datauri` to true or a integer number can inline base64-ified small images in CSS. "Small images" is defined by the value of `datauri`.
If `datauri` is trusy and isn't a number, the treshold will be automatically set to 32.768kb. [According to this](https://msdn.microsoft.com/en-us/library/cc848897(v=vs.85).aspx).

Setting `allowRemote` to true can request online js/css files and then bundle them in HTML.

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
      allowRemote: true
    }
  },
});
```

## Roadmap

* [x] HTML JS inline support
* [x] HTML CSS inline support
* [x] support uglify
* [x] use cluster if possilbe
* [x] support `{inline: ""}.inline` in js files
* [x] support picture base64-ify in css files
* [x] MIME lookup for css datauri inline