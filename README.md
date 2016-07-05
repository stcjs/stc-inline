# stc-inline

Inline css/javascript in html.

Use `inline` attribute in `<link rel="stylesheet">` or `<script>` to trigger this.

```html
<script src="/resource/js/a.js" inline></script>
```

OR you can use `{inline: ""}.inline` to inline other js files.

```js
{inline: "/resource/js/a.js"}.inline;
```

## Usage

```js
// stc.config.js
stc.workflow({
  inline: {
    plugin: inline,
    include: /\.html$/,
    options: {
      uglify: true
    }
  },
});
```

## Roadmap

* [x] support uglify
* [x] use cluster if possilbe
* [ ] support `{inline: ""}.inline` in js files
