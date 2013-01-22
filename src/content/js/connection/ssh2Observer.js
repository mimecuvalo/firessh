function ssh2Observer() {
  inherit(this, new baseObserver());
}

ssh2Observer.prototype = {
  onDirNotFound : function(buffer) { alert('NOT_IMPLEMENTED'); },

  onSftpCache : function(buffer, new_key) {
    var key;

    if (new_key) {
      key = new_key;
    } else {
      var key = buffer.replace(/\r\n/g, "\n").split("\n");
      var index = 4;

      for (var x = 0; x < key.length; ++x) {
        if (key[x].indexOf('is:') != -1) {
          index = x + 1;
          break;
        }
      }

      key = key[index];
    }

    // TODO(mime): goddammit chrome apps, what the hell.
    //var response = window.confirm(_('sftpCacheTitle') + '\n\n' + _('sftpCache').replace('%S', key));
    return 'y';//response ? 'y' : '';
  }
}
