# Hapistats

Hapi metrics plugin for HTTP requests This plugin uses [measured](https://github.com/felixge/node-measured) to gather request and memory metrics.

### Setup

Add this plugin to your [Hapi Composer Manifest](http://spumko.github.io/resource/api/#hapi-composer).

### Configuration

`path` http route path for metrics data.

### Viewing

Hit `settings.path` or `/-/metrics` by default.