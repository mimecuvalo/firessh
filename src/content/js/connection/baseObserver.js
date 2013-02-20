function baseObserver() { }

baseObserver.prototype = {
  connNo              : 1,

  // optional functions to override
  onWelcomed          : function() { },

  onConnectionRefused : function() {  },

  onConnected : function() {  },

  onLoginAccepted : function(newHost) {
    document.title = gAccount && gAccount != "FireSSH-temp" ? gAccount + " - FireSSH" : "FireSSH";
  },

  onLoginDenied : function() {
    makePopup();
  },

  onDisconnected : function(attemptingReconnect) {
    try {
      document.title = "FireSSH";
      if (!attemptingReconnect) {
        window.close();
      }
    } catch (ex) { }
  },

  onReconnecting : function() {  },

  onError : function(msg, skipAlert) {
    error(msg, false, false, skipAlert);
  },

  onDebug : function(msg, level) {
    debug(msg, level, false);
  },

  onAppendLog : function(msg, css, type) {
    appendLog(msg + "\n", css, type, false);
  },

  onStdin : function(msg, css, type) {
    stdin(msg);
  },

  onIsReadyChange : function(state) {
    try {
      window.onbeforeunload = state ? null : beforeUnload;
    } catch (ex) { }
  }

};
