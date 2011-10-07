var localFile = {
  init : function(path) {
    try {
      var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(path);
      return file;
    } catch (ex) {
      return null;
    }
  },

  overrideOSXQuarantine : function(path) {
    if (gPlatform == 'mac') {                // since when is mac so vista-like?
      var command = this.init("/bin/sh");
      var args = ["-c", "/usr/bin/xattr -d com.apple.quarantine " + path];
      var process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(command);
      process.run(true, args, args.length, {});
    }
  },
}
