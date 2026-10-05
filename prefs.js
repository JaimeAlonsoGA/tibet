// SPDX-License-Identifier: GPL-2.0-or-later
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {CHARACTERS, ORDER, RANDOM} from './characters.js';

const PREVIEW_SIZE = 128;

export default class TibetPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window._settings = settings;

        const page = new Adw.PreferencesPage();
        window.add(page);

        const characterGroup = new Adw.PreferencesGroup({title: 'Character'});
        page.add(characterGroup);

        const picker = new Gtk.Box({
            spacing: 12,
            homogeneous: true,
            halign: Gtk.Align.CENTER,
        });
        characterGroup.add(picker);

        let first = null;
        for (const id of [...ORDER, RANDOM]) {
            const button = new Gtk.ToggleButton({
                child: this._buildPreview(id),
                active: settings.get_string('character') === id,
                css_classes: ['flat'],
            });
            if (first)
                button.set_group(first);
            else
                first = button;
            button.connect('toggled', () => {
                if (button.active)
                    settings.set_string('character', id);
            });
            picker.append(button);
        }

        const timingGroup = new Adw.PreferencesGroup();
        page.add(timingGroup);

        const interval = Adw.SpinRow.new_with_range(1, 240, 5);
        interval.title = 'Interval (min)';
        settings.bind('interval-minutes', interval, 'value', Gio.SettingsBindFlags.DEFAULT);
        timingGroup.add(interval);

        const tryButton = new Gtk.Button({
            icon_name: 'media-playback-start-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
        });
        tryButton.connect('clicked', () => settings.set_boolean('show-now', true));
        const tryRow = new Adw.ActionRow({title: 'Try now', activatable_widget: tryButton});
        tryRow.add_suffix(tryButton);
        timingGroup.add(tryRow);
    }

    _buildPreview(id) {
        if (id === RANDOM)
            return this._buildTile(new Gtk.Image({
                icon_name: 'media-playlist-shuffle-symbolic',
                pixel_size: PREVIEW_SIZE / 2,
                width_request: PREVIEW_SIZE,
                height_request: PREVIEW_SIZE,
            }), 'Random');

        const character = CHARACTERS[id];
        const dir = this.dir.get_child('assets').get_child(id);

        const overlay = new Gtk.Overlay();
        character.layers.forEach((layer, i) => {
            const picture = new Gtk.Picture({
                file: dir.get_child(layer.file),
                content_fit: Gtk.ContentFit.CONTAIN,
                width_request: PREVIEW_SIZE,
                height_request: PREVIEW_SIZE,
            });
            if (i === 0)
                overlay.set_child(picture);
            else
                overlay.add_overlay(picture);
        });

        return this._buildTile(overlay, character.name);
    }

    _buildTile(image, name) {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
            margin_top: 6,
            margin_bottom: 6,
        });
        box.append(image);
        box.append(new Gtk.Label({label: name}));
        return box;
    }
}
