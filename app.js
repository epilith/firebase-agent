#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var conf          = require('./config');
var fbutil        = require('./lib/fbutil');
var PathMonitor   = require('./lib/PathMonitor');
var SearchQueue   = require('./lib/SearchQueue');

fbutil.auth(conf.FB_URL, conf.FB_TOKEN).done(function() {
   PathMonitor.process(conf.FB_URL, conf.flows, conf.FB_PATH);
});
