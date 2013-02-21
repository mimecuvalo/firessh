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
		locale/cs \
		locale/da \
		locale/en-US \
		locale/fr \
		locale/it-IT \
		locale/ja-JP \
		locale/pt-PT \
		locale/sv-SE \
		locale/tr \
		locale/zh-CN \
		skin \
		-x "*/CVS/*" "*.in" "*.DS_Store" "*.swp" "*/.git/*" "*.gitignore"
else
	zip -q -r9 chrome/firessh.jar \
		content \
		locale/$FIRESSH_LANG \
		skin \
		-x "*/CVS/*" "*.in" "*.DS_Store" "*.swp" "*/.git/*" "*.gitignore"
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

sed -e s/__VERSION__/$FIRESSH_VER/g ../../../website-firessh/index.html.in > ../../../website-firessh/index.html
