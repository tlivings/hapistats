# Hapistats

Hapi metrics plugin for HTTP requests This plugin uses [measured](https://github.com/felixge/node-measured) to gather request and memory metrics and supports statsd.

### Setup

Add this plugin to your [Hapi Composer Manifest](http://spumko.github.io/resource/api/#hapi-composer).

### Configuration

`path` - http route path for metrics data, `/-/metrics` by default.

`statsd` - an object containing statsd options.

Example:

```json
{
    "host": "localhost",
    "port": 8125,
    "interval": 5000,
    "scope": ""
}
```

### Viewing

Hit `settings.path` or `/-/metrics` by default.