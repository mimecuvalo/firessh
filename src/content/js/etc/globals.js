var gConnection;                // the main connection - where the magic happens
var gVersion  = "0.93.3";  // version of FireSSH we're using
var gPlatform;                  // holds what platform we're on
var gSiteManager;               // hold site manager data
var gKeys;                      // the private keys
var gAccount;                   // name of the account we're connecting to
var gFolder;                    // current folder
var gCli;                       // the cli
var gCacheKey;                  // the cache key we're looking at
var gCacheCallback;             // the callback to return to after the user decides if the key is good or not

// XXX this is some crap but it'll work for now. see rsakey.js for more details
var gRsaKeyWorkerJs = 'js/connection/paramikojs/sign_ssh_data_worker.js';

var gDefaultAccount;            // from prefs: select the opened account
var gDebugMode;                 // from prefs: show debug msgs in log or not
var gDonated;                   // from prefs: donated or not
var gLoadUrl;                   // from prefs: ssh url to open onload
var gPasswordMode;              // from prefs: save password or not
