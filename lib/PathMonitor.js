var fbutil = require('./fbutil');

function PathMonitor(firebaseUrl, name, flow) {
   this.ref = fbutil.fbRef(firebaseUrl, flow.in);
   this.fb = fbutil.fbRef(firebaseUrl);
   console.log('Indexing %s/%s using path "%s"', path.index, path.type, fbutil.pathName(this.ref));

   this.filter = flow.filter || function() { return true; };
   this.parse = flow.parser || function(data) { return parseKeys(data, path.fields, path.omit) };
   this.flow = flow;
   this._init();
}

PathMonitor.prototype = {
   _init: function() {
      this.addMonitor = this.ref.on('child_added', this._process.bind(this, this._childAdded));
      this.changeMonitor = this.ref.on('child_changed', this._process.bind(this, this._childChanged));
      this.removeMonitor = this.ref.on('child_removed', this._process.bind(this, this._childRemoved));
   },

   _stop: function() {
      this.ref.off('child_added', this.addMonitor);
      this.ref.off('child_changed', this.changeMonitor);
      this.ref.off('child_removed', this.removeMonitor);
   },

   _process: function(fn, snap) {
      var dat = snap.val();
      if( this.filter(dat) ) {
         fn.call(this, snap.name(), this.parse(dat));
      }
   },

   _childAdded: function(key, data) {
      var name = nameFor(this, key);
      // insert new elements
      this.out.forEach(function(outPath) {
        var outVal = makeObj(this.value, data);
        var outPath = makePath(this.outPath);
        fb.child(outPath).set(outVal);
      });
   },

   _childChanged: function(key, data) {
      var name = nameFor(this, key);
      this.esc.index(this.index, this.type, data, key)
         .on('data', function(data) {
            console.log('updated', name);
         })
         .on('error', function(err) {
            console.error('failed to update %s: %s', name, err);
         })
         .exec();
   },

   _childRemoved: function(key, data) {
      var name = nameFor(this, key);
      this.esc.deleteDocument(this.index, this.type, key, function(error, data) {
         if( error ) {
            console.error('failed to delete %s: %s'.red, name, error);
         }
         else {
            console.log('deleted'.cyan, name);
         }
      })
   }
};


function nameFor(path, key) {
   return path.index + '/' + path.type + '/' + key;
}

function parseKeys(data, fields, omit) {
  if (!data || typeof(data)!=='object') {
    return data;
  }
  var out = data;
  // restrict to specified fields list
  if( Array.isArray(fields) && fields.length) {
    out = {};
    fields.forEach(function(f) {
      if( data.hasOwnProperty(f) ) {
        out[f] = data[f];
      }
    })
  }
  // remove omitted fields
  if( Array.isArray(omit) && omit.length) {
    omit.forEach(function(f) {
      if( out.hasOwnProperty(f) ) {
        delete out[f];
      }
    })
  }
  return out;
}

exports.process = function(esc, firebaseUrl, paths, dynamicPathUrl) {
   paths && paths.forEach(function(pathProps) {
      new PathMonitor(esc, firebaseUrl, pathProps);
   });
   if (dynamicPathUrl) {
      new DynamicPathMonitor(fbutil.fbRef(firebaseUrl, dynamicPathUrl), function(pathProps) {
        return new PathMonitor(esc, firebaseUrl, pathProps);
      });
   }
};
