function connect(noAccountChange, showPassDialog) {
  gConnection.width = gCli.cols;
  gConnection.height = gCli.rows;

  gConnection.host = gConnection.host.replace(/^ssh:\/*/i, '');    // error checking - get rid of 'ssh://'

  if (gConnection.host && gConnection.host.charAt(gConnection.host.length - 1) == '/') {
    gConnection.host = gConnection.host.substring(0, gConnection.host.length - 1);
  }

  if (!gConnection.host) {                                                  // need to fill in the host
    error(_("alertFillHost"));
    return;
  }

  if (!gConnection.port || !parseInt(gConnection.port)) {                   // need a valid port
    error(_("alertFillPort"));
    return;
  }

  appendLog("Connecting to " + gConnection.host + "...\n", 'input', 'info', false);

  /*if (!gConnection.login || (!gConnection.password && gPasswordMode) || showPassDialog) {      // get a password if needed
    var password = window.prompt(_('passwordTitle'));

    if (password) {
      gConnection.password   = password;
    } else {
      window.close();
      return;
    }
  }*/

  var debugSite = new cloneObject(gConnection);
  debugSite.password = "";
  debugSite.observer = "";
  for (var property in gConnection) {
    if (typeof gConnection[property] == "function") {
      delete debugSite[property];
    }
  }

  debug(  "gConnection:"  + JSON.stringify(debugSite)
      + ", userAgent:"    + navigator.userAgent, "DEBUG");

  gConnection.connect();
}

function disconnect() {
  document.title    = "FireSSH";

  gConnection.disconnect();
}

function isReady() {
  return gConnection.isReady;
}
