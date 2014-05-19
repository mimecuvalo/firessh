this.manifest = {
    "name": "FireSSH",
    "icon": "icon.png",
    "settings": [
        {
            "tab": chrome.i18n.getMessage("general"),
            "group": chrome.i18n.getMessage("logwindow"),
            "name": "debugmode",
            "type": "checkbox",
            "label": chrome.i18n.getMessage("debug"),
        },
        {
            "tab": chrome.i18n.getMessage("interface"),
            "group": chrome.i18n.getMessage("appearance"),
            "name": "size",
            "type": "popupButton",
            "label": chrome.i18n.getMessage("size"),
            "options": [
                ["9"], ["10"], ["11"], ["12"], ["13"], ["14"], ["15"], ["16"],
                ["17"], ["18"], ["20"], ["22"], ["24"], ["26"], ["28"], ["30"],
                ["32"], ["34"], ["36"], ["40"], ["44"], ["48"], ["56"], ["64"],
                ["72"]
            ]
        },
        {
            "tab": chrome.i18n.getMessage("interface"),
            "group": chrome.i18n.getMessage("appearance"),
            "name": "fgColor",
            "type": "color",
            "label": chrome.i18n.getMessage("text"),
        },
        {
            "tab": chrome.i18n.getMessage("interface"),
            "group": chrome.i18n.getMessage("appearance"),
            "name": "bgColor",
            "type": "color",
            "label": chrome.i18n.getMessage("background"),
        },
        {
            "tab": chrome.i18n.getMessage("interface"),
            "group": chrome.i18n.getMessage("bell"),
            "name": "audible",
            "type": "checkbox",
            "label": chrome.i18n.getMessage("audible")
        },
        {
            "tab": chrome.i18n.getMessage("connect"),
            "group": chrome.i18n.getMessage("recovery"),
            "name": "network",
            "type": "slider",
            "min": 1,
            "max": 600,
            "step": 1,
            "display": true,
            "displayModifier": function (value) {
                return value;
            },
            "label": chrome.i18n.getMessage("network")
        },
        {
            "tab": chrome.i18n.getMessage("connect"),
            "group": chrome.i18n.getMessage("recovery"),
            "name": "keepalivemode",
            "type": "checkbox",
            "label": chrome.i18n.getMessage("keepalivemode")
        },
        {
            "tab": chrome.i18n.getMessage("connect"),
            "group": chrome.i18n.getMessage("recovery"),
            "name": "timeoutmode",
            "type": "checkbox",
            "label": chrome.i18n.getMessage("timeout")
        },
        {
            "tab": chrome.i18n.getMessage("connect"),
            "group": chrome.i18n.getMessage("recovery"),
            "name": "retry",
            "type": "slider",
            "min": 1,
            "max": 600,
            "step": 1,
            "display": true,
            "displayModifier": function (value) {
                return value;
            },
            "label": chrome.i18n.getMessage("retryd")
        },
        {
            "tab": chrome.i18n.getMessage("connect"),
            "group": chrome.i18n.getMessage("recovery"),
            "name": "attempts",
            "type": "slider",
            "min": 1,
            "max": 600,
            "step": 1,
            "display": true,
            "displayModifier": function (value) {
                return value;
            },
            "label": chrome.i18n.getMessage("retrya")
        },
        {
            "tab": chrome.i18n.getMessage("credits"),
            "group": "FireSSH",
            "name": "none",
            "type": "description",
            "text": '<label id="version">0.94.5    </label>' +
              '<a href="http://www.nightlight.ws" style="margin-right: 10px; color:#03c; text-decoration:underline">Mime &#268;uvalo</label>' +
              '<a href="http://firessh.net" style="margin-right: 10px; color:#03c; text-decoration:underline">http://firessh.net</label>'
        },
        {
            "tab": chrome.i18n.getMessage("credits"),
            "group": chrome.i18n.getMessage("thanks"),
            "name": "none",
            "type": "description",
            "text":
              '<ul>' +
                '<li>3ARRANO (Eskerrik asko, Milesker!)</li>' +
                '<li>Erik Anderson</li>' +
                '<li>BatBat (Merci!)</li>' +
                '<li>Scott Bentley (many thanks!)</li>' +
                '<li>bhupin (Merci!)</li>' +
                '<li>Dan Boneh (for AES code)</li>' +
                '<li>Paolo Borla (Grazie!)</li>' +
                '<li>Jed Brown</li>' +
                '<li>Patrick Brunschwig (for help on IPC)</li>' +
                '<li>ccpp0 (i18n rock*)</li>' +
                '<li>Siva Chandran P (for vt100 code)</li>' +
                '<li>Abel Chaouqi (Merci!)</li>' +
                '<li>Jason Clark</li>' +
                '<li>Closure Library Authors (for arc4 code)</li>' +
                '<li>DakSrbija (Hvala!)</li>' +
                '<li>damufo (Gracias!)</li>' +
                '<li>Darehanl (고맙습니다!)</li>' +
                '<li>Declan (謝謝!)</li>' +
                '<li>Devin Pohly (a million thanks!)</li>' +
                '<li>Tomasz Dominikowski (Dziekuje!)</li>' +
                '<li>Edgar (Gracias!)</li>' +
                '<li>Elric Erekose</li>' +
                '<li>Renato Fabbeni (Grazie!)</li>' +
                '<li>Daniel Muñiz Fontoira (Grazas!)</li>' +
                '<li>Ze Francisco (Obrigado!)</li>' +
                '<li>freaktechnik (Dankeschön!)</li>' +
                '<li>Fux (Danke!)</li>' +
                '<li>Hendrik Gebhardt (Danke!)</li>' +
                '<li>gezmen (Te&#351;ekk&#252;rler!)</li>' +
                '<li>goofy (Merci!)</li>' +
                '<li>gutierrez (Obrigado!)</li>' +
                '<li>Mike Hamburg (for AES code)</li>' +
                '<li>Alfons Van Hees (Dank u!)</li>' +
                '<li>helge4 (Tack!)</li>' +
                '<li>Angel Herr&#225;ez (Gracias!)</li>' +
                '<li>Bob Henson</li>' +
                '<li>Petr Hlávka</li>' +
                '<li>iacchi (Grazie!)</li>' +
                '<li>Iacopo Benesperi (Grazie!)</li>' +
                '<li>isn (Spasibo!)</li>' +
                '<li>Mikkel Jensen (Tak!)</li>' +
                '<li>Joergen (Tak!)</li>' +
                '<li>jojaba (Merci!)</li>' +
                '<li>Erkan Kaplan (Te&#351;ekk&#252;rler!)</li>' +
                '<li>Kohsuke Kawaguchi (for .ppk file porting)"</li>' +
                '<li>Tan Chew Keong (thanks for security advice!)</li>' +
                '<li>kneekoo (Multumesc!)</li>' +
                '<li>Frank Kohlhepp (For the fantastic fancy settings library!)</li>' +
                '<li>Michael Kraft (all hail!)</li>' +
                '<li>Andrew M. Kuchling (for pycrypto work)</li>' +
                '<li>Lakrits (Jag tackar!)</li>' +
                '<li>Jacinto Leal (Gracias!)</li>' +
                '<li>Robin Leffmann (for blowfish code)</li>' +
                '<li>Dwayne C. Litzenberger (for the outstanding pycrypto library)"</li>' +
                '<li>lloco (Obrigado!)</li>' +
                '<li>loveleeyoungae (Cám ơn!)</li>' +
                '<li>Hrvoje Majer (krcko) (Hvala!)</li>' +
                '<li>Pedro Marques (Obrigado!)</li>' +
                '<li>Norah Marinkovic (ありがとう!)</li>' +
                '<li>mikk_s (Děkuji!)</li>' +
                '<li>miles (Hvala!)</li>' +
                '<li>Mook (for help on IPC)</li>' +
                '<li>moZes (Tanke!)</li>' +
                '<li>Xavier Mor-Mur (Gràcies!)</li>' +
                '<li>Mark Moraes (for pycrypto work)</li>' +
                '<li>Sol Neckels (thanks!)</li>' +
                '<li>nico@nc (Merci!)</li>' +
                '<li>Sumito_Oda (ありがとう!)</li>' +
                '<li>OMNIpotus</li>' +
                '<li>Sunjae Park (너를 감사하십시요!)</li>' +
                '<li>Pedsann (Obrigado!)</li>' +
                '<li>Petertc (謝謝!)</li>' +
                '<li>Robey Pointer (for the paramiko library - I stand on the shoulders of giants)</li>' +
                '<li>Rhinoferos (Merci!)</li>' +
                '<li>Rickcart (謝謝!)</li>' +
                '<li>Ritargatan (Jag tackar!)</li>' +
                '<li>Javi Romero (Gracias!)</li>' +
                '<li>Branislav Rozbora (D\'akujem!)</li>' +
                '<li>Jesadavut Saengsawang (Khop Khun Mak!)</li>' +
                '<li>Will Schleter</li>' +
                '<li>SerdarSahin (Te&#351;ekk&#252;rler!)</li>' +
                '<li>Sergeys (Spasibo!)</li>' +
                '<li>Sampan Sittiwantana (Khop Khun Mak!)</li>' +
                '<li>Marco Simonetti (Grazie!)</li>' +
                '<li>Alex Sirota</li>' +
                '<li>Benjamin Smedberg (for help on IPC)</li>' +
                '<li>smg (Te&#351;ekk&#252;rler!)</li>' +
                '<li>Martin Srebotnjak (Hvala!)</li>' +
                '<li>Emily Stark (for AES code)</li>' +
                '<li>Tyler Sticka (for the fantastic logo!)</li>' +
                '<li>Phil Summers</li>' +
                '<li>Kálmán Szalai (Köszönöm!)</li>' +
                '<li>Simon Tatham (for a brilliant SFTP client!)</li>' +
                '<li>Team erweiterungen.de (Danke!)</li>' +
                '<li>Paul Tero (for DES3 code)</li>' +
                '<li>unarist (ありがとう!)</li>' +
                '<li>urko (Gracias!)</li>' +
                '<li>Aigar Vals (Täname!)</li>' +
                '<li>Momchil Valkov (Merci, Blagodaria!)</li>' +
                '<li>V@no</li>' +
                '<li>Nick Vidal (Obrigado!)</li>' +
                '<li>Ladislav Vykukal (D&#283;kuji!)</li>' +
                '<li>Martijn Weisbeek (Dank u!)</li>' +
                '<li>Tom Wu (for the BigInteger library)</li>' +
                '<li>yfdyh000 (谢谢!)</li>' +
                '<li>Boris Zbarsky (thanks for your help!)</li>' +
                '<li>Shixin Zeng (谢谢!)</li>' +
                '<li>Leszek(teo) &#379;yczkowski (Dziekuje!)</li>' +
                '<li>MozDev Group, Inc. (you guys rock!)</li>' +
              '</ul>'
        },
        {
            "tab": chrome.i18n.getMessage("credits"),
            "group": chrome.i18n.getMessage("thanks"),
            "name": "none",
            "type": "description",
            "text": chrome.i18n.getMessage("allothers")
        },
        {
            "tab": chrome.i18n.getMessage("credits"),
            "group": chrome.i18n.getMessage("thanks"),
            "name": "none",
            "type": "description",
            "text": chrome.i18n.getMessage("special")
        }
    ]
};
