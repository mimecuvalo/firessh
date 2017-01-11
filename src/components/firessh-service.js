/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

const MEDIATOR_CONTRACTID =
    "@mozilla.org/appshell/window-mediator;1";
const ASS_CONTRACTID =
    "@mozilla.org/appshell/appShellService;1";
const RDFS_CONTRACTID =
    "@mozilla.org/rdf/rdf-service;1";
const CATMAN_CONTRACTID =
    "@mozilla.org/categorymanager;1";
const PPMM_CONTRACTID =
    "@mozilla.org/parentprocessmessagemanager;1";

const STARTUP_CID =
    Components.ID("{b0243ea2-dab2-413f-8886-d7c7e701460e}");


Cu.import("chrome://firessh/content/js/etc/protocol-handlers.jsm");


function spawnFireSSH(uri, count)
{
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    var prefBranch  = prefService.getBranch("extensions.firessh.");
    var sString  = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    sString.data = uri;
    prefBranch.setComplexValue("loadurl", Components.interfaces.nsISupportsString, sString);

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
    var browserWindow = wm.getMostRecentWindow("navigator:browser");
    browserWindow.openUILinkIn("chrome://firessh/content/firessh.xul", 'current');
    return true;
}



function ProcessHandler()
{
}

ProcessHandler.prototype =
{
    /* nsISupports */
    QueryInterface(iid)
    {
        if (iid.equals(Ci.nsISupports) ||
            iid.equals(Ci.nsIObserver) ||
            iid.equals(Ci.nsIMessageListener))
        {
            return this;
        }

        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    /* nsIObserver */
    observe(subject, topic, data)
    {
        if (topic !== "profile-after-change")
            return;

        const ppmm = Cc[PPMM_CONTRACTID].getService(Ci.nsIMessageBroadcaster);
        ppmm.loadProcessScript("chrome://firessh/content/js/etc/protocol-script.js", true);
        ppmm.addMessageListener("FireSSH:SpawnFireSSH", this);
    },

    /* nsIMessageListener */
    receiveMessage(msg)
    {
        if (msg.name !== "FireSSH:SpawnFireSSH")
            return;

        spawnFireSSH(msg.data.uri);
    },
};


const StartupFactory =
{
    createInstance(outer, iid)
    {
        if (outer)
            throw Cr.NS_ERROR_NO_AGGREGATION;

        if (!iid.equals(Ci.nsISupports))
            throw Cr.NS_ERROR_NO_INTERFACE;

        // startup:
        return new ProcessHandler();
    },
};


const FireSSHModule =
{
    registerSelf(compMgr, fileSpec, location, type)
    {
        compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);

        debug("*** Registering ssh protocol handler.\n");
            FireSSHProtocols.initObsolete(compMgr, fileSpec, location, type);

        debug("*** Registering done.\n");
    },

    unregisterSelf(compMgr, fileSpec, location)
    {
    },

    getClassObject(compMgr, cid, iid)
    {
        // Checking if we're disabled in the Chrome Registry.
        var rv;
        try
        {
            const rdfSvc = Cc[RDFS_CONTRACTID].getService(Ci.nsIRDFService);
            const rdfDS = rdfSvc.GetDataSource("rdf:chrome");
            const resSelf = rdfSvc.GetResource("urn:mozilla:package:firessh");
            const resDisabled = rdfSvc.GetResource("http://www.mozilla.org/rdf/chrome#disabled");
            rv = rdfDS.GetTarget(resSelf, resDisabled, true);
        }
        catch (e)
        {
        }
        if (rv)
            throw Cr.NS_ERROR_NO_INTERFACE;

        if (cid.equals(SSHPROT_HANDLER_CID))
            return SSHProtocolHandlerFactory;

        if (cid.equals(STARTUP_CID))
            return StartupFactory;

        if (!iid.equals(Ci.nsIFactory))
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;

        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    canUnload(compMgr)
    {
        return true;
    },
};


/* entrypoint */
function NSGetModule(compMgr, fileSpec)
{
    return FireSSHModule;
}

function NSGetFactory(cid)
{
    return FireSSHModule.getClassObject(null, cid, null);
}
