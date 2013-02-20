function ssh2Observer() {
  inherit(this, new baseObserver());
}

ssh2Observer.prototype = {
  onDirNotFound : function(buffer) { alert('NOT_IMPLEMENTED'); },

  onSftpCache : function(buffer, new_key, cacheCallback) {
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

    var iframe;
    var iframePopup;

    gCacheKey = key;
    gCacheCallback = function(answer) {
      document.body.removeChild(iframePopup);
      cacheCallback(answer);
      gCli.input.focus();
    };

    iframe = document.createElement('iframe');
    iframe.src = 'cachePrompt.html';
    iframe.id = 'cache-prompt-iframe';

    iframePopup = document.createElement('div');
    iframePopup.id = 'cache-prompt-popup';
    iframePopup.appendChild(iframe);
    document.body.appendChild(iframePopup);
  }
}
