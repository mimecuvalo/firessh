function startup() {
  if (gStrbundle || !window['gFocused']) {                            // we get two onload events b/c of the embedded browser
    return;
  }

  if (!$('cmdlog').contentWindow.document.getElementById('terminal')) { // not finished loading embedded browser
    return;
  }

  window.onerror         = detailedError;

  gStrbundle             = $("strings");

  gCli = new cli($('cmdlog').contentWindow);

  gProfileDir            = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
  gAtomService           = Components.classes["@mozilla.org/atom-service;1"].getService            (Components.interfaces.nsIAtomService);
  gLoginManager          = Components.classes["@mozilla.org/login-manager;1"].getService           (Components.interfaces.nsILoginManager);
  gIos                   = Components.classes["@mozilla.org/network/io-service;1"].getService      (Components.interfaces.nsIIOService);
  gPromptService         = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
  gPrefsService          = Components.classes["@mozilla.org/preferences-service;1"].getService     (Components.interfaces.nsIPrefService);
  gFormHistory           = Components.classes["@mozilla.org/satchel/form-history;1"].getService    (Components.interfaces.nsIFormHistory ?
                                                                                                    Components.interfaces.nsIFormHistory :
                                                                                                    Components.interfaces.nsIFormHistory2);
  gLoginInfo             = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",     Components.interfaces.nsILoginInfo, "init");

  gPrefs                 = gPrefsService.getBranch("extensions.firessh.");
  gPlatform              = getPlatform();

  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.addObserver("extensions.firessh", prefsObserver, false);
  }

  gLoadUrl               = gPrefs.getComplexValue("loadurl", Components.interfaces.nsISupportsString).data;

  var wikipedia = 'http://en.wikipedia.org/wiki/Solitaire_(cipher)';
  appendLog("<span id='opening'><span style='cursor:pointer;text-decoration:underline;color:blue;' onclick=\"window.open('http://firessh.mozdev.org','FireSSH');\">"
      + "FireSSH</span> <span>" + gVersion
      + "  '</span><span style='cursor:pointer;text-decoration:underline;' onclick=\"window.open('" + wikipedia + "','wikipedia');\">"
      + "Solitaire</span>'"
      + " " + gStrbundle.getString("opening")
      + "</span><br style='font-size:5pt'/>", 'blue', "info", true);
  //gCmdlogBody.scrollTop = 0;
  
  try {
    appendLog(gStrbundle.getFormattedString("paramiko", ["1.7.7.1"])
      + "<br style='font-size:5pt'/>", 'blue', "info", true);
  } catch(ex) {}  // if we haven't had it translated yet

  readPreferences(true);

  //tipJar();

  if (gLoadUrl) {
    setTimeout(externalLink, 1000);
  } else {
    var connectCallback = function(site) {
      accountChangeHelper(site);
      connect();
      var func = function() {
        $('cmdlog').focus();
      };
      setTimeout(func, 0);
    };

    var connectCancelCallback = function() {
      window.close();
    };

    var params = { callback       : connectCallback,
                   cancelCallback : connectCancelCallback }
    gAccountDialog = window.openDialog("chrome://firessh/content/accountManager.xul", "accountManager", "chrome,dialog,resizable,centerscreen", params);
  }
}

function beforeUnload() {
  return "";
}

function unload() {
  try {
    if (gAccountDialog && !gAccountDialog.closed) {
      gAccountDialog.close();
    }
  } catch (ex) { }

  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.removeObserver("extensions.firessh", prefsObserver, false);
  }

  if (gConnection && gConnection.isConnected) {
    gConnection.disconnect();
  }
}
