function externalLink() {                                            // opened up FireSSH using a link in Firefox
  var site = { account  : "", host     : "",    port           : 22,    login    : "", password : "", anonymous : false,
               notes    : "", folder   : "",    privatekey     : "",    protocol : "", tunnel : "",
               temporary : true };

  var uri    = Components.classes["@mozilla.org/network/standard-url;1"].getService(Components.interfaces.nsIURI);
  var toUTF8 = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);
  uri.spec   = gLoadUrl;

  if (!uri.schemeIs("ssh") || gLoadUrl.length <= 6) {                // sanity check
    return;
  }

  if (uri.username) {
    site.login     = unescape(uri.username);
    site.password  = unescape(uri.password);
  }

  site.host = uri.host;
  site.port = uri.port == -1 ? 22 : uri.port;

  try {
    var recordedHost = (site.host.indexOf("ssh.") == 0 ? '' : "ssh.") + site.host + ':' + site.port;
    var logins = gLoginManager.findLogins({}, recordedHost, "FireSSH", null);
    for (var x = 0; x < logins.length; ++x) {
      if (uri.username && logins[x].username != site.login) {
        continue;
      }

      site.login = logins[x].username;
      site.password = logins[x].password;
      break;
    }
  } catch (ex) { }

  site.protocol = "ssh2";

  var prefBranch   = gPrefsService.getBranch("browser.");
  // test to see if the path is a file or directory, rudimentary test to see if slash is at the end
  gLoadUrl         = uri.path.charAt(uri.path.length - 1) == '/' ? "" : unescape(uri.path);

  try {
    gLoadUrl       = toUTF8.convertStringToUTF8(gLoadUrl, "UTF-8", 1);
  } catch (ex) {
    debug(ex);
  }

  gPrefs.setCharPref("loadurl", "");

  tempAccountHelper(site);
}

function tempAccountHelper(site) {
  site.account = site.host;

  accountChangeHelper(site);

  connect(true);
}

function accountChangeHelper(site) {
  setProtocol(site.protocol);

  if (!gConnection.isConnected) {
    gConnection.host       = site.host;
    gConnection.port       = site.port;
    gConnection.login      = site.login;
    gConnection.password   = site.password;
    gConnection.security   = site.security;
    gConnection.privatekey = site.privatekey;
    gConnection.tunnels    = site.tunnels;
  }

  gAccount       = site.account;
  document.title = (gAccount ? gAccount : gConnection.host) + " - FireSSH";

  if (site.account) {
    var sString  = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    sString.data = site.account;
    gPrefs.setComplexValue("defaultaccount", Components.interfaces.nsISupportsString, sString);
  }
}
