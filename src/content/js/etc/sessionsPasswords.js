function externalLink() {                                            // opened up FireSSH using a link in Firefox
  var site = { account  : "", host     : "",    port           : 22,    login    : "", password : "", anonymous : false,
               notes    : "", folder   : "",    privatekey     : "",    protocol : "", tunnel : "",
               temporary : true };

  var uri    = parseUri(gLoadUrl);

  if (uri.protocol != "ssh" || gLoadUrl.length <= 6) {                // sanity check
    return;
  }

  if (uri.user) {
    site.login     = unescape(uri.user);
    site.password  = unescape(uri.password);
  }

  site.host = uri.host;
  site.port = uri.port == -1 ? 22 : uri.port;
  // TODO(mime)
  //site.privatekey = getArgument('?' + window.location.hash.substring(1), 'pkey');
  site.protocol = "ssh2";

  // test to see if the path is a file or directory, rudimentary test to see if slash is at the end
  gLoadUrl         = uri.path.charAt(uri.path.length - 1) == '/' ? "" : unescape(uri.path);

  chrome.storage.local.set({"loadurl": ""});

  tempAccountHelper(site);
}

function tempAccountHelper(site) {
  site.account = site.host;

  accountChangeHelper(site);
}

function accountChangeHelper(site) {
  setProtocol(site.protocol);

  var acctMgr = document.getElementById('account-manager-popup');
  if (acctMgr) {
    acctMgr.parentNode.removeChild(acctMgr);
  }

  if (!gConnection.isConnected) {
    gConnection.host       = site.host;
    gConnection.port       = site.port;
    gConnection.login      = site.login;
    gConnection.password   = site.password;
    gConnection.security   = site.security;
    gConnection.privatekey = site.privatekey;
    //gConnection.tunnels    = site.tunnels;
  }

  gAccount       = site.account;
  document.title = (gAccount ? gAccount : gConnection.host) + " - FireSSH";

  if (window.location.protocol == 'chrome-extension:') {
    window.location.hash = generateArgs({ 'account': gAccount }).substring(1);
  }

  if (site.account) {
    chrome.storage.local.set({"defaultaccount": site.account});
  }

  connect(true);
  gCli.input.focus();
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri(str) {
  var  o   = parseUri.options,
       m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
       uri = {},
       i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};
