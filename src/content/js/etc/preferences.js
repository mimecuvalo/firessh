function readPreferences(init) {
  try {
    gDefaultAccount          = gPrefs.getComplexValue("defaultaccount", Components.interfaces.nsISupportsString).data;
    gDebugMode               = gPrefs.getBoolPref("debugmode");
    gDonated                 = gPrefs.getBoolPref("donated");
    gPasswordMode            = gPrefs.getBoolPref("passwordmode");

    // TODO, need to check if system has andale mono
    //gCli.font                = gPrefs.getCharPref("font");
    gCli.fontSize            = gPrefs.getCharPref("size");
    gCli.defaultColor        = gPrefs.getCharPref("fgColor");
    gCli.defaultBGColor      = gPrefs.getCharPref("bgColor");
    gCli.enableBell          = gPrefs.getBoolPref("audible");
    gCli.resetAppearance(init);

    if (gConnection) {
      gConnection.keepAliveMode       = gPrefs.getBoolPref("keepalivemode");
      gConnection.networkTimeout      = gPrefs.getIntPref ("network");
      gConnection.proxyHost           = gPrefs.getComplexValue("proxyhost", Components.interfaces.nsISupportsString).data;
      gConnection.proxyPort           = gPrefs.getIntPref ("proxyport");
      gConnection.proxyType           = gPrefs.getCharPref("proxytype");
      gConnection.reconnectAttempts   = gPrefs.getIntPref ("attempts");
      gConnection.reconnectInterval   = gPrefs.getIntPref ("retry");
      gConnection.reconnectMode       = gPrefs.getBoolPref("timeoutmode");
      gConnection.useCompression      = gPrefs.getBoolPref("compressmode");
    }

  } catch (ex) {
    debug(ex);
  }
}

function showPreferences() {
  var branch       = gPrefsService.getBranch("browser.");
  var instantApply = branch.getBoolPref("preferences.instantApply");
  window.openDialog("chrome://firessh/content/preferences.xul", "preferences", "chrome,resizable,centerscreen"
                                                                               + (instantApply ? ",dialog=no" : ",modal,dialog"));
}

var prefsObserver = {
  observe : function(prefsbranch, topic, data) {
    readPreferences();
  }
};
