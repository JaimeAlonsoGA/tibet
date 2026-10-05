import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Graphene from 'gi://Graphene';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {CANVAS, CHARACTERS, ORDER} from './characters.js';

const FADE_MS = 400;
const STRETCH_MS = 1800;
const PARTICLE_INTERVAL_MS = 450;

const BreakOverlay = GObject.registerClass(
class BreakOverlay extends St.Widget {
    constructor(assetsDir, character) {
        const [start, end] = character.colors;
        super({
            reactive: true,
            opacity: 0,
            style_class: 'tibet-overlay',
            style: `background-gradient-start: ${start}; background-gradient-end: ${end};`,
        });

        // ease() jumps straight to the end on unmapped actors, so loops start in open().
        this._loops = [];
        this._monitor = Main.layoutManager.primaryMonitor;
        const {x, y, width, height} = this._monitor;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        this._figureSize = Math.round(Math.min(width, height) * 0.55 / scale);

        this.set_position(0, 0);
        this.set_size(global.stage.width, global.stage.height);

        this._particles = new St.Widget({x, y, width, height, clip_to_allocation: true});
        this.add_child(this._particles);
        this._particleIcon = new Gio.FileIcon({
            file: assetsDir.get_child('particles').get_child(character.particle),
        });

        const content = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true,
            style_class: 'tibet-content',
        });
        const frame = new St.Widget({
            x, y, width, height,
            layout_manager: new Clutter.BinLayout(),
        });
        frame.add_child(content);
        this.add_child(frame);

        content.add_child(this._buildFigure(assetsDir.get_child(character.id), character));

        this._doneButton = new St.Button({
            style_class: 'tibet-done',
            can_focus: true,
            accessible_name: 'OK',
            x_align: Clutter.ActorAlign.CENTER,
            child: new St.Icon({icon_name: 'object-select-symbolic'}),
        });
        this._doneButton.connect('clicked', () => this.close());
        content.add_child(this._doneButton);

        this.connect('destroy', () => this._onDestroy());
    }

    _buildFigure(dir, character) {
        const figure = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            x_align: Clutter.ActorAlign.CENTER,
            pivot_point: new Graphene.Point({x: 0.5, y: 0.95}),
            rotation_angle_z: -3,
        });

        for (const layer of character.layers) {
            const icon = new St.Icon({
                gicon: new Gio.FileIcon({file: dir.get_child(layer.file)}),
                icon_size: this._figureSize,
            });
            figure.add_child(icon);

            if (layer.pivot) {
                icon.pivot_point = new Graphene.Point({
                    x: layer.pivot[0] / CANVAS,
                    y: layer.pivot[1] / CANVAS,
                });
                icon.rotation_angle_z = layer.from;
                this._loop(icon, {rotation_angle_z: layer.to}, STRETCH_MS);
            } else if (layer.breathe) {
                icon.pivot_point = new Graphene.Point({x: 0.5, y: 1});
                this._loop(icon, {scale_y: 1.03, scale_x: 1.01}, STRETCH_MS);
            }
        }

        this._loop(figure, {rotation_angle_z: 3}, STRETCH_MS * 2);
        return figure;
    }

    _loop(actor, props, duration) {
        this._loops.push([actor, props, duration]);
    }

    _startLoops() {
        for (const [actor, props, duration] of this._loops) {
            actor.ease({
                ...props,
                duration,
                mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
                repeatCount: -1,
                autoReverse: true,
            });
        }
    }

    _spawnParticle() {
        const {width, height} = this._monitor;
        const size = Math.round(this._figureSize * (0.05 + Math.random() * 0.06));
        const particle = new St.Icon({
            gicon: this._particleIcon,
            icon_size: size,
            opacity: 210,
            scale_x: 0,
            scale_y: 0,
            pivot_point: new Graphene.Point({x: 0.5, y: 0.5}),
            x: Math.random() * width,
            y: height,
        });
        this._particles.add_child(particle);

        const duration = 6000 + Math.random() * 4000;
        particle.ease({
            scale_x: 1,
            scale_y: 1,
            duration: 800,
            mode: Clutter.AnimationMode.EASE_OUT_BACK,
        });
        particle.ease({
            opacity: 0,
            delay: duration - 1500,
            duration: 1500,
            mode: Clutter.AnimationMode.LINEAR,
        });
        particle.ease({
            translation_y: -height * (0.7 + Math.random() * 0.4),
            translation_x: (Math.random() - 0.5) * size * 4,
            rotation_angle_z: (Math.random() - 0.5) * 90,
            duration,
            mode: Clutter.AnimationMode.EASE_OUT_SINE,
            onStopped: () => particle.destroy(),
        });
    }

    open() {
        Main.layoutManager.addTopChrome(this);

        this._grab = Main.pushModal(this, {actionMode: Shell.ActionMode.SYSTEM_MODAL});
        if (this._grab.get_seat_state() !== Clutter.GrabState.ALL) {
            Main.popModal(this._grab);
            this._grab = null;
        }

        this._startLoops();
        this._particleId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, PARTICLE_INTERVAL_MS, () => {
            this._spawnParticle();
            return GLib.SOURCE_CONTINUE;
        });

        this.ease({opacity: 255, duration: FADE_MS, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        this._doneButton.grab_key_focus();
    }

    close() {
        if (this._closing)
            return;
        this._closing = true;
        this._releaseGrab();
        this.ease({
            opacity: 0,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_IN_QUAD,
            onStopped: () => this.destroy(),
        });
    }

    _releaseGrab() {
        if (this._grab) {
            Main.popModal(this._grab);
            this._grab = null;
        }
    }

    _onDestroy() {
        this._releaseGrab();
        if (this._particleId) {
            GLib.Source.remove(this._particleId);
            this._particleId = 0;
        }
    }
});

export default class TibetExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settings.connectObject(
            'changed::interval-minutes', () => this._schedule(),
            'changed::show-now', () => {
                if (!this._settings.get_boolean('show-now'))
                    return;
                this._settings.set_boolean('show-now', false);
                this._showBreak();
            },
            this);
        this._schedule();
    }

    disable() {
        this._clearTimeout();
        this._settings.disconnectObject(this);
        this._settings = null;

        const overlay = this._overlay;
        this._overlay = null;
        overlay?.destroy();
    }

    _clearTimeout() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    _schedule() {
        this._clearTimeout();
        if (this._overlay)
            return;

        const seconds = this._settings.get_int('interval-minutes') * 60;
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, seconds, () => {
            this._timeoutId = 0;
            this._showBreak();
            return GLib.SOURCE_REMOVE;
        });
    }

    _showBreak() {
        if (this._overlay)
            return;
        this._clearTimeout();

        let id = this._settings.get_string('character');
        if (!ORDER.includes(id))
            id = ORDER[0];

        this._overlay = new BreakOverlay(this.dir.get_child('assets'), {id, ...CHARACTERS[id]});
        this._overlay.connect('destroy', () => {
            this._overlay = null;
            // Null after disable(): no rescheduling then.
            if (this._settings)
                this._schedule();
        });
        this._overlay.open();
    }
}
