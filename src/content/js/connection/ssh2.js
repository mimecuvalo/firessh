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
  tunnels      : '',

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

      if (this.proxyType != "") {                                                // use a proxy
        proxyInfo = this.proxyService.newProxyInfo(this.proxyType, this.proxyHost, this.proxyPort,
                      Components.interfaces.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST, 30, null);
      }

      this.controlTransport = this.transportService.createTransport(null, 0, this.host, parseInt(this.port), proxyInfo);

      var controlOutstream  = this.controlTransport.openOutputStream(0, 0, 0);
      var controlInstream   = this.controlTransport.openInputStream(0, 0, 0);
      this.controlInstream  = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
      this.controlInstream.setInputStream(controlInstream);

      this.controlOutstream  = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
      this.controlOutstream.setOutputStream(controlOutstream);

      var dataListener = {                                                       // async data listener for the control socket
        onStartRequest  : function(request, context) { },

        onStopRequest   : function(request, context, status) {
          self.legitClose = self.client.legitClose;
          self.onDisconnect(self.relogin);
        },

        onDataAvailable : function(request, context, inputStream, offset, count) {
          try {
            self.transport.fullBuffer += self.controlInstream.readBytes(count);  // read data

            if (!self.gotWelcomeMessage && self.transport.fullBuffer.indexOf('\n') == self.transport.fullBuffer.length - 1) {
              self.onConnected();
            }

            self.transport.run();
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
        }
      };

      var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
      pump.init(controlInstream, -1, -1, 0, 0, false);
      pump.asyncRead(dataListener, null);

      var shell_success = function(shell) {
        self.shell = shell;
        self.channels["main"] = { 'serverSocket' : null, 'chan' : shell, 'bufferOut' : "" };

        self.loginAccepted();
        self.isReady = true;
        self.input();

        if (self.tunnels) {
          var tunnels = self.tunnels.split(",");
          for (var x = 0; x < tunnels.length; ++x) {
            var tunnel = tunnels[x].split(':');
            self.tunnel(tunnel[0], tunnel[1], tunnel[2]);
          }
        }
      };

      this.client = new paramikojs.SSHClient();
      this.client.set_missing_host_key_policy(new paramikojs.AskPolicy());
      var file = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
      file.append("known_hosts");
      var host_keys = !localFile.init('~/.ssh/known_hosts') && sys.platform == 'win32' ? file.path : '~/.ssh/known_hosts';
      if (sys.platform != 'win32' && !localFile.init('~/.ssh').exists()) {
        var dir  = localFile.init('~/.ssh');

        try {
          dir.create(Components.interfaces.nsILocalFile.DIRECTORY_TYPE, 0700);
          localFile.overrideOSXQuarantine(dir.path);
        } catch(ex) {
          this.observer.onDebug(ex);
          this.observer.onError(gStrbundle.getString("dirFail"));
        }
      }
      this.client.load_host_keys(host_keys);

      var auth_success = function() {
        self.client.invoke_shell('xterm-256color', self.width, self.height, shell_success);
      };

      var write = function(out) {
        self.controlOutstream.write(out, out.length);
      };

      this.transport = this.client.connect(this.observer, write, auth_success,
                                      this.host, parseInt(this.port), this.login, this.password, null, this.privatekey);

    } catch(ex) {
      this.observer.onDebug(ex);
      this.onDisconnect();
    }
  },

  tunnel : function(localPort, remoteHost, remotePort) {
    try {
      var self = this;
      var on_success = function(chan) {
        try {
          self.observer.onDebug('Connected!  Tunnel open: ' + localPort + ' to ' + remoteHost + ':' + remotePort);
          var key = localPort + ':' + remoteHost + ':' + remotePort;

          var serverSocket  = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);

          var serverListener = {
            onSocketAccepted : function(serv, transport) {
              var inStream = transport.openInputStream(0, 0, 0);
              var controlInstream  = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
              controlInstream.setInputStream(inStream);

              var controlOutstream  = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
              controlOutstream.setOutputStream(transport.openOutputStream(0, 0, 0));

              var channelData = function() {
                try {
                  var data = chan.recv(65536);
                } catch(ex if ex instanceof paramikojs.ssh_exception.WaitException) {
                  setTimeout(channelData, self.refreshRate);
                  return;
                }
                if (data) {
                  controlOutstream.write(data, data.length);
                }
                setTimeout(channelData, self.refreshRate);
              };
              setTimeout(channelData.bind(self), 0); // get data from remote host & send to local

              var dataListener = {                                                       // async data listener for the control socket
                onStartRequest  : function(request, context) { },

                onStopRequest   : function(request, context, status) { },

                onDataAvailable : function(request, context, inputStream, offset, count) {
                  try {
                    var data = controlInstream.readBytes(count);  // get data from local port & send to remote
                    self.output(data, key);
                  } catch(ex) {
                    self.observer.onDebug(ex);
                  }
                }
              };

              var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
              pump.init(inStream, -1, -1, 0, 0, false);
              pump.asyncRead(dataListener, null);
            },

            onStopListening : function(serv, status) { }
          };

          serverSocket.init(localPort, false, -1);
          serverSocket.asyncListen(serverListener);
          self.channels[key] = { 'serverSocket' : serverSocket, 'chan' : chan, 'bufferOut' : "" };
        } catch (ex) {
          self.observer.onDebug(ex);

          self.observer.onError(gStrbundle.getString("errorConn"));
          alert(gStrbundle.getString("errorConn") + " (" + localPort + ' -> ' + remoteHost + ':' + remotePort + ")");

          return null;
        }
      };
      var chan = this.transport.open_channel('direct-tcpip', [remoteHost, remotePort], ['unknown', 0], on_success);
    } catch (ex) {
      this.observer.onDebug(ex);

      this.observer.onError(gStrbundle.getString("errorConn"));

      return null;
    }
  },

  cleanup : function(isAbort) {
    this._cleanup();
    for (var x in this.channels) {
      if (this.channels[x]['serverSocket']) {
        try {
          this.channels[x]['serverSocket'].close();
        } catch (ex) { }
      }
    }
    this.channels = {};
  },

  resetReconnectState : function() {
    for (var x in this.channels) {
      if (this.channels[x]['serverSocket']) {
        try {
          this.channels[x]['serverSocket'].close();
        } catch (ex) { }
      }
    }
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
    } catch(ex if ex instanceof paramikojs.ssh_exception.WaitException) {
      this.check_stderr();
      return;
    }
    if (stdin) {
      this.observer.onStdin(stdin, 'input', 'input');
    }
    this.check_stderr();
  },

  check_stderr : function() {
    try {
      var stderr = this.shell.recv_stderr(65536);
    } catch(ex if ex instanceof paramikojs.ssh_exception.WaitException) {
      setTimeout(this.input.bind(this), this.refreshRate);
      return;
    }
    if (stderr) {
      this.observer.onError(stderr, 'error', 'error');
    }

    setTimeout(this.input.bind(this), this.refreshRate);
  },

  output : function(out, key) {
    key = key || "main";
    if (!this.channels[key]) {
      return;
    }

    this.channels[key]['bufferOut'] += out;
    this.send_output(key);
  },

  send_output : function(key) {
    while (this.channels[key]['bufferOut'].length > 0) {
      try {
        var n = this.channels[key]['chan'].send(this.channels[key]['bufferOut']);
      } catch(ex if ex instanceof paramikojs.ssh_exception.WaitException) {
        var self = this;
        var wait_callback = function() {
          self.send_output(key);
        }
        setTimeout(wait_callback, this.refreshRate);
        return;
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
