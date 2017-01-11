var gConnection;                // the main connection - where the magic happens
var gVersion  = "0.94.11";  // version of FireSSH we're using
var gPlatform;                  // holds what platform we're on
var gSiteManager;               // hold site manager data
var gAccount;                   // name of the account we're connecting to
var gFolder;                    // current folder
var gCli;                       // the cli

// XXX this is some crap but it'll work for now. see rsakey.js for more details
var gRsaKeyWorkerJs = 'chrome://firessh/content/js/connection/paramikojs/sign_ssh_data_worker.js';

var gDefaultAccount;            // from prefs: select the opened account
var gDebugMode;                 // from prefs: show debug msgs in log or not
var gDonated;                   // from prefs: donated or not
var gLoadUrl;                   // from prefs: ssh url to open onload
var gPasswordMode;              // from prefs: save password or not
var gCreditsMode;               // from prefs: show credit lines toggle

var gStrbundle;                 // $() references
var gAccountDialog;

var gProfileDir;                // services
var gAtomService;
var gLoginManager;
var gLoginInfo;
var gIos;
var gPromptService;
var gPrefsService;
var gPrefs;
