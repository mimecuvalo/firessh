/*----------------------------------------------------------------------
 * nsChromeExtensionHandler
 * By Ed Anuff <ed@anuff.com>
 * Protocol handler code based on techniques from:
 *
 *  http://www.nexgenmedia.net/docs/protocol/
 *  http://simile.mit.edu/piggy-bank/
 *
 *----------------------------------------------------------------------
 */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");                               // makes life easier

// Custom protocol related
const kSCHEME = "ssh";
const kPROTOCOL_CID = Components.ID("{dbc42190-21eb-11e0-ac64-0800200c9a66}");
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kPROTOCOL_NAME = "FireSSH SSH Handler";

// Mozilla defined
const kCHROMEHANDLER_CID_STR = "{61ba33c0-3031-11d3-8cd0-0060b0fc14a3}";
const kSTANDARDURL_CONTRACTID = "@mozilla.org/network/standard-url;1";
const kURLTYPE_STANDARD = 1;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIStandardURL = Components.interfaces.nsIStandardURL;
const nsIURI = Components.interfaces.nsIURI;

/*----------------------------------------------------------------------
 * The ChromeExtension Handler
 *----------------------------------------------------------------------
 */

function ChromeExtensionHandler() {
  this.wrappedJSObject = this;
  this._system_principal = null;
}

ChromeExtensionHandler.prototype = {
  classID: kPROTOCOL_CID,
  scheme: kSCHEME,
  defaultPort : -1,
  protocolFlags : nsIProtocolHandler.URI_STD | nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,
  registerExtension : function(ext) { },
  allowPort : function(port, scheme) { return false; },

  newURI : function(spec, charset, baseURI) {
    var new_url = Components.classes[kSTANDARDURL_CONTRACTID].createInstance(nsIStandardURL);
    new_url.init(kURLTYPE_STANDARD, -1, spec, charset, baseURI);
    var new_uri = new_url.QueryInterface(nsIURI);
    return new_uri;
  },

  newChannel : function(uri) {
    var chrome_service = Components.classesByID[kCHROMEHANDLER_CID_STR].getService();
    chrome_service = chrome_service.QueryInterface(nsIProtocolHandler);
    var new_channel = null;

    try {
      if (uri.schemeIs(kSCHEME)) {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        var prefBranch  = prefService.getBranch("extensions.firessh.");
        var sString  = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        sString.data = uri.spec;
        prefBranch.setComplexValue("loadurl", Components.interfaces.nsISupportsString, sString);

        var uri_string = "chrome://firessh/content/firessh.xul";
        uri = chrome_service.newURI(uri_string, null, null);
      }

      new_channel = chrome_service.newChannel(uri);
    } catch (e) {
      throw Components.results.NS_ERROR_FAILURE;
    }

    return new_channel;
  },

  QueryInterface : XPCOMUtils.generateQI([Components.interfaces.nsIProtocolHandler, Components.interfaces.nsISupports, Components.interfaces.nsIObserver]),
	observe: function(){}
};

var components = [ChromeExtensionHandler];                                                                // register components

if (XPCOMUtils.generateNSGetFactory) {
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
} else {
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);
}
