function cloneObject(what) {
  for (i in what) {
    this[i] = what[i];
  }
}

function runInFirefox(path) {
  var windowManager          = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
  var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
  var win                    = windowManagerInterface.getMostRecentWindow("navigator:browser");

  if (win) {
    var theTab               = win.gBrowser.addTab(path);
    win.gBrowser.selectedTab = theTab;
    return;
  }

  try {    // this is used if FireSSH is running as a standalone and there are no browsers open; much more complicated, not very pretty
    var firefoxInstallPath = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                       .get("CurProcD", Components.interfaces.nsILocalFile);
    var firefox            = localFile.init(firefoxInstallPath.path + "\\" + "firefox.exe");

    if (!firefox.exists()) {                                 // try linux
      firefox.initWithPath(firefoxInstallPath.path + "/" + "firefox");
      if (!firefox.exists()) {                               // try os x
        firefox.initWithPath(firefoxInstallPath.path + "/" + "firefox-bin");
      }
    }

    var process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
    process.init(firefox);
    var arguments = new Array(path);
    process.run(false, arguments, arguments.length, {});
  } catch (ex) {
    debug(ex);
  }
}

function tipJar() {
  if (!gDonated) {
    gPrefs.setBoolPref("donated", true);
    runInFirefox("http://firessh.net/donate.html");
  }
}


function setCharAt(str, index, ch) {                         // how annoying
  return str.substr(0, index) + ch + str.substr(index + 1);
}

// thanks to David Huynh
// http://mozilla-firefox-extension-dev.blogspot.com/2004/11/passing-objects-between-javascript.html
function wrapperClass(obj) {
  this.wrappedJSObject = this;
  this.obj             = obj;
}

wrapperClass.prototype = {
  QueryInterface : function(iid) {
    if (iid.equals(Components.interfaces.nsISupports)) {
      return this;
    }

    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
}

function getPlatform() {
  var platform = navigator.platform.toLowerCase();

  if (platform.indexOf('linux') != -1) {
    return 'linux';
  }

  if (platform.indexOf('mac') != -1) {
    return 'mac';
  }

  if (platform.indexOf('win') != -1) {
    return 'windows';
  }

  return 'other';
}

function testAccelKey(event) {
  if (getPlatform() == 'mac') {
    return event.metaKey;
  }

  return event.ctrlKey;
}

function parseArguments(args) {
  args = args.split('?');
  if (args.length < 2) {
    return {};
  }
  args = args[1].split('&');
  
  var parsedArgs = {};
  for (var x = 0; x < args.length; ++x) {
    var split = args[x].split('=');
    parsedArgs[split[0]] = decodeURIComponent(split[1]);
  }

  return parsedArgs;
}

function getArgument(args, field) {
  var parsedArgs = parseArguments(args);
  return parsedArgs[field] || '';
}

function generateArgs(args) {
  if (!args) {
    return '';
  }

  var queryString = '';
  for (var key in args) {
    queryString += (!queryString.length ? '?' : '&') + key + '=' + encodeURIComponent(args[key]);
  }

  return queryString;
}

// Converts objects stored in toSource format to JSON format.
// Not for general purpose usage - this works in FireFTP's case.
// Does not check for example if
// , <string>:
// exists between quotes, i.e. a property value.
function jsonParseWithToSourceConversion(toSource) {
  try {
    return JSON.parse(toSource);
  } catch(ex) {
    // As Borat would say: This is totally awesome. NOT.
    toSource = unescape(toSource.replace(/[^\\]\\x/g, '%'));
    return JSON.parse(toSource.replace(/({|, )(\w+?):/g, '$1"$2":'));
  }
}
