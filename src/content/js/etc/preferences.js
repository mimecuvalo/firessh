function readPreferences(init, opt_callback) {
  try {
    chrome.storage.local.get(null, function(storage) {
      gKeys                    = JSON.parse(storage["keys"] || '{}');
      gLoadUrl                 = storage["loadurl"] || "";
      gDefaultAccount          = storage["defaultaccount"] || "";
      gDebugMode               = parseInt(storage["debugmode"]);
      gDonated                 = parseInt(storage["donated"]);
      gPasswordMode            = parseInt(storage["passwordmode"]);
      gCreditsMode             = parseInt(storage["credits"] === undefined ?
          "1" : storage["credits"]);

      // TODO, need to check if system has andale mono
      if (gCli) {
        //gCli.font                = storage["font"];
        gCli.fontSize            = storage["size"];
        gCli.defaultColor        = storage["fgColor"];
        gCli.defaultBGColor      = storage["bgColor"];
        gCli.enableBell          = parseInt(storage["audible"]);
        gCli.resetAppearance(init);
      }

      if (gConnection) {
        gConnection.keepAliveMode       = parseInt(storage["keepalivemode"]);
        gConnection.networkTimeout      = parseInt(storage["network"]);
        gConnection.reconnectAttempts   = parseInt(storage["attempts"]);
        gConnection.reconnectInterval   = parseInt(storage["retry"]);
        gConnection.reconnectMode       = parseInt(storage["timeoutmode"]);
        gConnection.useCompression      = parseInt(storage["compressmode"]);
      }

      gSiteManager = JSON.parse(storage.siteManager || '[]');

      if (opt_callback) {
        opt_callback();
      }
    });
  } catch (ex) {
    debug(ex);
  }
}

function showPreferences() {
  window.open("../fancy-settings/source/index.html");
}
