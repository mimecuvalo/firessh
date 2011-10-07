#!/bin/bash

mkdir chrome

if [ $FIRESSH_MASTER -eq 1 ]
then
	cp chrome.manifest.master chrome.manifest
else
	sed -e s/__l10n__/$FIRESSH_LANG/g chrome.manifest.in > chrome.manifest
fi

cp -R icons chrome/icons

if [ $FIRESSH_MASTER -eq 1 ]
then
	sed -e s/__l10n__/$FIRESSH_LANG/g \
			-e s/__VERSION__/$FIRESSH_VER/g \
			-e s/__MINVERSION__/$FIRESSH_MIN/g \
			-e s/__MAXVERSION__/$FIRESSH_MAX/g \
			install.rdf.master > install.rdf
else
	if [ $FIRESSH_LANG = "en-US" ]
	then
		sed -e s/__l10n__/$FIRESSH_LANG/g \
				-e s/__VERSION__/$FIRESSH_VER/g \
				-e s/__MINVERSION__/$FIRESSH_MIN/g \
				-e s/__MAXVERSION__/$FIRESSH_MAX/g \
				install.rdf.in > install.rdf
	else
		sed -e s/__l10n__/$FIRESSH_LANG/g \
				-e s/__VERSION__/$FIRESSH_VER/g \
				-e s/__MINVERSION__/$FIRESSH_MIN/g \
				-e s/__MAXVERSION__/$FIRESSH_MAX/g \
				install.rdf.l10n > install.rdf
	fi
fi

sed -e s/__VERSION__/$FIRESSH_VER/g content/js/etc/globals.js.in > content/js/etc/globals.js

if [ $FIRESSH_MASTER -eq 1 ]
then
	zip -q -r9 chrome/firessh.jar \
		content \
		locale/da \
		locale/en-US \
		locale/fr \
		locale/it-IT \
		locale/ja-JP \
		locale/pt-PT \
		locale/sv-SE \
		locale/zh-CN \
		skin \
		-x "*/CVS/*" "*.in" "*.DS_Store" "*.swp"
else
	zip -q -r9 chrome/firessh.jar \
		content \
		locale/$FIRESSH_LANG \
		skin \
		-x "*/CVS/*" "*.in" "*.DS_Store" "*.swp"
fi

if [ $FIRESSH_LANG = "en-US" ]
then
	rm ../downloads/firessh.xpi
else
	rm ../downloads/firessh_$FIRESSH_LANG.xpi	
fi

if [ $FIRESSH_LANG = "en-US" ]
then
  zip -q -9 ../downloads/firessh.xpi \
    chrome/firessh.jar \
    chrome/icons/default/firessh-main-window.ico \
    chrome/icons/default/firessh-main-window.xpm \
    components/sshProtocol.js \
    defaults/preferences/firessh.js \
    chrome.manifest \
    install.rdf \
    license.txt
else
  zip -q -9 ../downloads/firessh_$FIRESSH_LANG.xpi \
    chrome/firessh.jar \
    chrome/icons/default/firessh-main-window.ico \
    chrome/icons/default/firessh-main-window.xpm \
    components/sshProtocol.js \
    defaults/preferences/firessh.js \
    chrome.manifest \
    install.rdf \
    license.txt
fi

rm -rf chrome

if [ $FIRESSH_DEBUG -eq 1 ]
then
	osascript debug.scpt
	exit
fi

if [ $FIRESSH_LANG = "en-US" ]
then
	FIRESSH_MD5=`md5 -q ../downloads/firessh.xpi`

	sed -e s#http:\/\/downloads.mozdev.org\/firessh\/firessh___l10n__.xpi#https:\/\/addons.mozilla.org\/firefox\/downloads\/latest\/684#g \
			-e s/__VERSION__/$FIRESSH_VER/g \
			-e s/__MINVERSION__/$FIRESSH_MIN/g \
			-e s/__MAXVERSION__/$FIRESSH_MAX/g \
			-e s/__MD5__/$FIRESSH_MD5/g \
			../www/update.rdf.in > ../www/update.rdf

	sed -e s/__VERSION__/$FIRESSH_VER/g \
			../www/index.html.in > ../www/index.html
else
	FIRESSH_MD5=`md5 -q ../downloads/firessh_$FIRESSH_LANG.xpi`

	sed -e s/__l10n__/$FIRESSH_LANG/g \
			-e s/__VERSION__/$FIRESSH_VER/g \
			-e s/__MINVERSION__/$FIRESSH_MIN/g \
			-e s/__MAXVERSION__/$FIRESSH_MAX/g \
			-e s/__MD5__/$FIRESSH_MD5/g \
			../www/update.rdf.in > ../www/update_$FIRESSH_LANG.rdf

	# See https://bugzilla.mozilla.org/show_bug.cgi?id=396525#c8
	# See mccoy_cmdline_xuluwarrior.patch in http://www.mozdev.org/source/browse/firessh/src/ written by Adrian Williams
	/Applications/McCoy.app/Contents/MacOS/mccoy -command update -updateRDF /Users/Mime/Sites/firessh/firessh/www/update_$FIRESSH_LANG.rdf -key firessh
fi
