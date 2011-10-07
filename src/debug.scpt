tell application "System Events"
	tell application process "Firefox"
		set frontmost to true
		key code 120 using control down
		keystroke "b"
		key code 125
		delay 1
		keystroke "f"
		key code 125
		key code 36
		delay 2
		key code 36
	end tell
end tell

delay 1
tell application "Firefox" to quit
delay 1
tell application "Firefox" to activate
