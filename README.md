# stc-inline

Inline css/javascript in html.

Use `inline` attribute in `<link rel="stylesheet">` or `<script>` to trigger this.

```html
<script src="/resource/js/a.js" inline></script>
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
* [ ] use cluster if possilbe
* [ ] use cache if possible
* [ ] support `{inline: ""}.inline` in js files
