function ssh2Mozilla(observer) {
  inherit(this, new baseProtocol());
  this.observer = observer;

  setTimeout(this.keepAlive.bind(this), 60000);
}

ssh2Mozilla.prototype = {
  // override base class variables
  protocol     : 'ssh2',

  // read-write variables
  privatekey   : "",                                                             // private key for ssh connections
  width        : 80,
  height       : 24,

  // internal variables
  channels     : {},
  refreshRate  : 10,
  transport    : null,
  client       : null,
  shell        : null,
  relogin      : false,


  connect : function(reconnect) {
    this.setupConnect(reconnect);
    this.observer.version = this.version;
    this.relogin = false;

    try {                                                                        // create a control socket
      var proxyInfo = null;
      var self      = this;

      var onDataRead = function(readInfo) {
        try {
          if (readInfo.resultCode < 0) {
            throw "Disconnected!";
          }

          var data = readInfo.data;
          if (!data) {
            return;
          }
          var view = new Uint8Array(data);

          var str = ""
          for (var x = 0; x < view.length; ++x) {
            str += String.fromCharCode(view[x]);
          }

          self.transport.fullBuffer += str;  // read data

          if (!self.gotWelcomeMessage && self.transport.fullBuffer.indexOf('\n') == self.transport.fullBuffer.length - 1) {
            self.onConnected();
          }

          self.transport.run();

          self.socket.read(self.socketId, onDataRead);
        } catch(ex) {
          self.observer.onDebug(ex);

          if (ex instanceof paramikojs.ssh_exception.AuthenticationException) {
            self.client.legitClose = true;
            self.relogin = true;
            self.loginDenied(ex.message);
            return;
          }

          self.onDisconnect();
        }
      };

      var onCreate = function(socketInfo) {
        self.socketId = socketInfo.socketId;
        self.observer.onDebug("Connected! SocketId: " + self.socketId);
        self.socket.connect(self.socketId, self.host, parseInt(self.port), function() {
          self.socket.read(self.socketId, onDataRead);
        });
      };

      self.socket.create("tcp", null, onCreate);

      var shell_success = function(shell) {
        self.shell = shell;
        self.channels["main"] = { 'chan' : shell, 'bufferOut' : "" };

        self.loginAccepted();
        self.isReady = true;
        self.input();
      };

      this.client = new paramikojs.SSHClient();
      this.client.set_missing_host_key_policy(new paramikojs.AskPolicy());
      this.client.load_host_keys('known_hosts');

      var auth_success = function() {
        self.client.invoke_shell('xterm', self.width, self.height, shell_success);
      };

      var write = function(out) {
        var buf = new ArrayBuffer(out.length);
        var view = new Uint8Array(buf);
        for (var x = 0; x < out.length; ++x) {
          view[x] = out.charCodeAt(x);
        }

        self.socket.write(self.socketId, buf, function() {});
      };

      this.transport = this.client.connect(this.observer, write, auth_success,
                                      this.host, parseInt(this.port), this.login, this.password, null, this.privatekey);

    } catch(ex) {
      this.observer.onDebug(ex);
      this.onDisconnect();
    }
  },

  cleanup : function(isAbort) {
    this._cleanup();
    this.channels = {};
  },

  resetReconnectState : function() {
    this.channels = {};
  },

  sendQuitCommand : function(legitClose) {                                       // called when shutting down the connection
    this.client.close(legitClose);
    this.kill();
  },

  keepAlive              : function() {
    if (this.isConnected && this.keepAliveMode) {
      this.client._transport.global_request('keepalive@lag.net', null, false);
    }

    setTimeout(this.keepAlive.bind(this), 60000);
  },

  input : function() {
    try {
      if (!this.shell || this.shell.closed) {
        this.legitClose = true;
        this.onDisconnect();
        return;
      }
      var stdin = this.shell.recv(65536);
    } catch(ex) {
      if (ex instanceof paramikojs.ssh_exception.WaitException) {
        this.check_stderr();
        return;
      } else {
        throw ex;
      }
    }
    if (stdin) {
      this.observer.onStdin(stdin, 'input', 'input');
    }
    this.check_stderr();
  },

  check_stderr : function() {
    try {
      var stderr = this.shell.recv_stderr(65536);
    } catch(ex) {
      if (ex instanceof paramikojs.ssh_exception.WaitException) {
        setTimeout(this.input.bind(this), this.refreshRate);
        return;
      } else {
        throw ex;
      }
    }
    if (stderr) {
      this.observer.onError(stderr, 'error', 'error');
    }

    setTimeout(this.input.bind(this), this.refreshRate);
  },

  output : function(out, key) {
    key = key || "main";
    this.channels[key]['bufferOut'] += out;
    this.send_output(key);
  },

  send_output : function(key) {
    while (this.channels[key]['bufferOut'].length > 0) {
      try {
        var n = this.channels[key]['chan'].send(this.channels[key]['bufferOut']);
      } catch(ex) {
        if (ex instanceof paramikojs.ssh_exception.WaitException) {
          var self = this;
          var wait_callback = function() {
            self.send_output(key);
          }
          setTimeout(wait_callback, this.refreshRate);
          return;
        } else {
          throw ex;
        }
      }
      if (n <= 0) { // eof
        break;
      }
      this.channels[key]['bufferOut'] = this.channels[key]['bufferOut'].substring(n);
    }
    //setTimeout(this.send_output.bind(this), this.refreshRate);
  },

  recoverFromDisaster    : function() { /* do nothing */ }
}
