function connect(noAccountChange, showPassDialog) {
  gConnection.width = gCli.cols;
  gConnection.height = gCli.rows;

  gConnection.host = gConnection.host.replace(/^ssh:\/*/i, '');    // error checking - get rid of 'ssh://'

  if (gConnection.host && gConnection.host.charAt(gConnection.host.length - 1) == '/') {
    gConnection.host = gConnection.host.substring(0, gConnection.host.length - 1);
  }

  if (gConnection.host == "about:mozilla") {                                // just for fun
    window.openDialog("chrome://fireftp/content/welcome.xul", "welcome", "chrome,dialog,resizable,centerscreen", "", true);
    return;
  }

  if (!gConnection.host) {                                                  // need to fill in the host
    alert(gStrbundle.getString("alertFillHost"));
    return;
  }

  if (!gConnection.port || !parseInt(gConnection.port)) {                   // need a valid port
    alert(gStrbundle.getString("alertFillPort"));
    return;
  }

  appendLog("Connecting to " + gConnection.host + "...\n", 'input', 'info', false);

  if (!gConnection.login || (!gConnection.password && gPasswordMode) || showPassDialog) {      // get a password if needed
    var passwordObject        = new Object();
    passwordObject.login      = gConnection.login;
    passwordObject.password   = gConnection.password;
    passwordObject.privatekey = gConnection.privatekey;
    passwordObject.returnVal  = false;

    window.openDialog("chrome://firessh/content/password.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

    if (passwordObject.returnVal) {
      gConnection.login      = passwordObject.login;
      gConnection.password   = passwordObject.password;
      gConnection.privatekey = passwordObject.privatekey;
    } else {
      window.close();
      return;
    }
  }

  if (gConnection.privatekey) {
    var pk = localFile.init(gConnection.privatekey);

    if (!pk || !pk.exists()) {
      alert(gStrbundle.getString("pkNotFound"));
      return;
    }
  }

  var debugSite = new cloneObject(gConnection);
  debugSite.account = "";
  debugSite.host = "";
  debugSite.login = "";
  debugSite.port = "";
  debugSite.password = "";
  debugSite.observer = "";
  for (var property in gConnection) {
    if (typeof gConnection[property] == "function") {
      delete debugSite[property];
    }
  }

  debug(  "gConnection:"  + debugSite.toSource()
      + ", userAgent:"      + navigator.userAgent, "DEBUG");

  gConnection.connect();
}

function disconnect() {
  document.title    = "FireSSH";

  gConnection.disconnect();
}

function isReady() {
  return gConnection.isReady;
}
