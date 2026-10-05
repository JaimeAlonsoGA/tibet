UUID := tibet@JaimeAlonsoGA.github.io
ZIP := $(UUID).shell-extension.zip

.PHONY: pack install clean

pack:
	gnome-extensions pack --force --extra-source=characters.js --extra-source=assets .

install: pack
	gnome-extensions install --force $(ZIP)

clean:
	rm -f $(ZIP)
