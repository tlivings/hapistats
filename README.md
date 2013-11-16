# Hapistats

Hapi metrics plugin for HTTP requests This plugin uses [measured](https://github.com/felixge/node-measured) to gather request and memory metrics.

### Setup

Add this plugin to your [Hapi Composer Manifest](http://spumko.github.io/resource/api/#hapi-composer).

### Configuration

`path` route path for metrics dump.
`memoryInterval` the interval (milliseconds) in which to collect memory histograms.

### Viewing

Hit `settings.path` or `/-/metrics` by default.