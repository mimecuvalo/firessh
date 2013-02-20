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

    var flags    = gPromptService.BUTTON_TITLE_YES    * gPromptService.BUTTON_POS_0 +
                   gPromptService.BUTTON_TITLE_NO     * gPromptService.BUTTON_POS_2 +
                   gPromptService.BUTTON_TITLE_CANCEL * gPromptService.BUTTON_POS_1;
    var response = gPromptService.confirmEx(window, gStrbundle.getString("sftpCacheTitle"),
                                                    gStrbundle.getFormattedString("sftpCache", [key]), flags,
                                                    null, null, null, null, {});
    cacheCallback(response == 0 ? 'y' : (response == 2 ? 'n' : ''));
  }
}
