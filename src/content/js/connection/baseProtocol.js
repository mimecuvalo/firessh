// if you're actually interested in reusing this class for your app
// it'd be a good idea to get in contact with me, Mime Cuvalo: mimecuvalo@gmail.com

function baseProtocol() {
}
baseProtocol.prototype = {
  // read-write variables
  protocol             : "",
  observer             : null,
  host                 : "",
  port                 : -1,
  login                : "",
  password             : "",
  keepAliveMode        : true,           // keep the connection alive with NOOP's
  networkTimeout       : 30,             // how many seconds b/f we consider the connection to be stale and dead
  proxyHost            : "",
  proxyPort            : 0,
  proxyType            : "",
  reconnectAttempts    : 40,             // how many times we should try reconnecting
  reconnectInterval    : 10,             // number of seconds in b/w reconnect attempts
  reconnectMode        : true,           // true if we want to attempt reconnecting
  useCompression       : true,           // true if we try to do compression
  errorConnectStr      : "Unable to make a connection.  Please try again.", // set to error msg that you'd like to show for a connection error

  // read-only variables
  transportService     : Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService),
  proxyService         : Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService  (Components.interfaces.nsIProtocolProxyService),
  toUTF8               : Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService       (Components.interfaces.nsIUTF8ConverterService),
  fromUTF8             : Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService   (Components.interfaces.nsIScriptableUnicodeConverter),
  isAttemptingConnect  : false,
  isConnected          : false,          // are we connected?
  isReady              : false,          // are we busy writing/reading the control socket?
  isReconnecting       : false,          // are we attempting a reconnect?
  legitClose           : true,           // are we the ones initiating the close or is it a network error
  reconnectsLeft       : 0,              // how many times more to try reconnecting
  networkTimeoutID     : 0,              // a counter increasing with each read and write

  controlTransport     : null,
  controlInstream      : null,
  controlOutstream     : null,

  connectedHost        : "",             // name of the host we connect to plus username
  version              : "",  // version of this class - used to avoid collisions in cache

  // functions that should be implemented by derived classes
  connect                : function(reconnect) { alert('NOT_IMPLEMENTED'); },
  cleanup                : function(isAbort) { alert('NOT_IMPLEMENTED'); },      // cleanup internal variables
  keepAlive              : function() { alert('NOT_IMPLEMENTED'); },
  recoverFromDisaster    : function() { alert('NOT_IMPLEMENTED'); },

  // optional functions to override
  resetReconnectState : function() { },                                          // called when starting to reconnect, should reset certain internal variables to have clean slate for fresh connection
  sendQuitCommand : function(legitClose) { },                                    // called when shutting down the connection
  sendAbortCommand : function() { },                                             // called when aborting

  // private functions that should not be overridden
  // if a function has a _ prefix, it should be called by corresponding functions (without _ prefix) in derived classes

  setupConnect : function(reconnect) {
    if (!reconnect) {                                                            // this is not a reconnection attempt
      this.isReconnecting = false;
      this.reconnectsLeft = parseInt(this.reconnectAttempts);

      if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
        this.reconnectsLeft = 1;
      }
    }

    ++this.networkTimeoutID;                                                     // just in case we have timeouts from previous connection
    this.isAttemptingConnect = true;
  },

  onConnected : function() {
    this.isConnected       = true;                                               // good to go
    this.isAttemptingConnect = false;

    this.observer.onConnected();

    this.isReconnecting    = false;
    this.reconnectsLeft    = parseInt(this.reconnectAttempts);                   // setup reconnection settings

    if (!this.reconnectsLeft || this.reconnectsLeft < 1) {
      this.reconnectsLeft = 1;
    }
  },

  disconnect : function() {                                                      // user has requested an explicit disconnect
    this.legitClose = true;                                                      // this close() is ok, don't try to reconnect
    this.isConnected = false;
    this.cleanup();

    this.sendQuitCommand(true);
  },

  onDisconnect : function(relogin) {                                             // called when disconnected
    if ((!this.isConnected && !this.legitClose) || this.isAttemptingConnect) {   // no route to host
      this.observer.onAppendLog(this.errorConnectStr, 'error', "error");
    }

    this.isConnected = false;
    this.isAttemptingConnect = false;

    this.kill();

    this.observer.onDisconnected(relogin || (!this.legitClose && this.reconnectMode && this.reconnectsLeft > 0));
    this.observer.onIsReadyChange(true);

    if (!this.legitClose && this.reconnectMode) {                                // try reconnecting
      this.resetReconnectState();

      if (this.reconnectsLeft < 1) {
        this.isReconnecting = false;
      } else {
        this.isReconnecting = true;

        this.observer.onReconnecting();

        var self = this;
        var func = function() { self.reconnect(); };
        try {
          setTimeout(func, this.reconnectInterval * 1000);
        } catch(ex) {
          // do nothing
          // we get here on window beforeunload and settimeout is invalid
        }
      }
    } else {
      this.legitClose = true;
      this.cleanup();
    }
  },

  kill : function() {
    try {
      this.controlInstream.close();
    } catch(ex) {
      this.observer.onDebug(ex);
    }

    try {
      this.controlOutstream.close();
    } catch(ex) {
      this.observer.onDebug(ex);
    }
  },

  _cleanup : function(isAbort) {
    this.isReady            = false;

    ++this.networkTimeoutID;
  },

  reconnect : function()  {                                                      // ahhhh! our precious connection has been lost,
    if (!this.isReconnecting) {                                                  // must...get it...back...our...precious
      return;
    }

    --this.reconnectsLeft;

    this.connect(true);
  },

  loginAccepted : function() {
    if (this.legitClose) {
      this.observer.onWelcomed();
    }

    var newConnectedHost = this.login + "@" + this.host;

    this.observer.onLoginAccepted(newConnectedHost != this.connectedHost);

    if (newConnectedHost != this.connectedHost) {
      this.legitClose = true;
    }

    this.connectedHost = newConnectedHost;                                       // switching to a different host or different login

    if (!this.legitClose) {
      this.recoverFromDisaster();                                                // recover from previous disaster
      return false;
    }

    this.legitClose   = false;

    return true;                                                                 // proceed normally
  },

  loginDenied : function(buffer) {
    if (this.type == 'transfer') {
      this.observer.onLoginDenied();
    }

    this.cleanup();                                                              // login failed, cleanup variables

    if (this.type != 'transfer' && this.type != 'bad') {
      this.observer.onError(buffer);
    }

    this.isConnected = false;

    this.kill();

    if (this.type == 'transfer') {
      this.type = 'bad';
    }

    if (this.type != 'transfer' && this.type != 'bad') {
      var self = this;
      var func = function() { self.observer.onLoginDenied(); };
      setTimeout(func, 0);
    }
  },

  resetConnection : function() {
    this.legitClose = false;                                                     // still stuck on a command so, try to restart the connection the hard way

    this.sendQuitCommand();

    this.kill();
  }
};

function setProtocol(protocol) {
  var protocolMap = { 'ssh2' : { 'transport': ssh2Mozilla, 'observer': ssh2Observer } };

  gConnection = new protocolMap[protocol].transport(new protocolMap[protocol].observer());
  gConnection.errorConnectStr = gStrbundle.getString("errorConn");
  gConnection.version         = gVersion;

  readPreferences();
}
