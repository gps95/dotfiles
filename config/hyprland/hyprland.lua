-- Hyprland Lua Configuration

-- Generated from hyprland.conf migration

-- ==============================

-- MONITORS AND WORKSPACES

-- ==============================

monitor = { "HDMI-A-1,preferred,0x0,1.5", "HDMI-A-2,preferred,auto,1" }

workspace = {

"1,monitor:HDMI-A-1",

"2,monitor:HDMI-A-1",

"3,monitor:HDMI-A-1",

"4,monitor:HDMI-A-1",

"5,monitor:HDMI-A-1",

"6,monitor:HDMI-A-1",

"7,monitor:HDMI-A-1",

"8,monitor:HDMI-A-2",

"9,monitor:HDMI-A-2",

"10,monitor:HDMI-A-2",

}

-- HighDPI xwayland scaling problems

xwayland = {

force_zero_scaling = true,

}

-- ==============================

-- MY PROGRAMS

-- ==============================

$terminal = "kitty"

$fileManager = "thunar"

$menu = "wofi --show drun"

-- ==============================

-- AUTOSTART

-- ==============================

exec-once = { "waybar &", "hyprpaper &", "[workspace 1 silent] firefox &" }

-- ==============================

-- ENVIRONMENT VARIABLES

-- ==============================

env = {

"XCURSOR_SIZE,24",

"HYPRCURSOR_SIZE,24",

"GDK_SCALE,1",

"QT_SCALE_FACTOR,1",

"QT_AUTO_SCREEN_SCALE_FACTOR,1",

"XWAYLAND_SCALE,1",

}

-- ==============================

-- LOOK AND FEEL

-- ==============================

general = {

gaps_in = 5,

gaps_out = 5,

border_size = 2,

col.active_border = "rgba(33ccffee) rgba(00ff99ee) 45deg",

col.inactive_border = "rgba(595959aa)",

resize_on_border = false,

allow_tearing = false,

layout = "dwindle",

}

decoration = {

rounding = 10,

rounding_power = 2,

active_opacity = 1.0,

inactive_opacity = 1.0,

shadow = {

enabled = true,

range = 4,

render_power = 3,

color = "rgba(1a1a1aee)",

},

blur = {

enabled = true,

size = 3,

passes = 1,

vibrancy = 0.1696,

},

}

animations = {

enabled = "yes, please :)",

bezier = {

"easeOutQuint, 0.23, 1, 0.32, 1",

"easeInOutCubic, 0.65, 0.05, 0.36, 1",

"linear, 0, 0, 1, 1",

"almostLinear, 0.5, 0.5, 0.75, 1",

"quick, 0.15, 0, 0.1, 1",

},

animation = {

"global, 1, 10, default",

"border, 1, 5.39, easeOutQuint",

"windows, 1, 4.79, easeOutQuint",

"windowsIn, 1, 4.1, easeOutQuint, popin 87%",

"windowsOut, 1, 1.49, linear, popin 87%",

"fadeIn, 1, 1.73, almostLinear",

"fadeOut, 1, 1.46, almostLinear",

"fade, 1, 3.03, quick",

"layers, 1, 3.81, easeOutQuint",

"layersIn, 1, 4, easeOutQuint, fade",

"layersOut, 1, 1.5, linear, fade",

"fadeLayersIn, 1, 1.79, almostLinear",

"fadeLayersOut, 1, 1.39, almostLinear",

"workspaces, 1, 1.94, almostLinear, fade",

"workspacesIn, 1, 1.21, almostLinear, fade",

"workspacesOut, 1, 1.94, almostLinear, fade",

"zoomFactor, 1, 7, quick",

},

}

dwindle = {

preserve_split = true,

}

master = {

new_status = "master",

}

misc = {

force_default_wallpaper = 0,

disable_hyprland_logo = true,

}

-- ==============================

-- INPUT

-- ==============================

input = {

kb_layout = "us",

kb_variant = "intl",

kb_model = "",

kb_options = "",

kb_rules = "",

follow_mouse = 1,

sensitivity = 0,

touchpad = {

natural_scroll = false,

},

}

gesture = { "3, horizontal, workspace" }

device = {

name = "epic-mouse-v1",

sensitivity = -0.5,

}

-- ==============================

-- KEYBINDINGS

-- ==============================

$mainMod = "ALT"

-- Toggle game mode on mainmod+M

bind = {

"$mainMod, M, submap, gamemode",

"$mainMod, M, exec, notify-send \"Game Mode\" \"Keybinds disabled — Super+M to restore\"",

}

-- GAMEMODE SUBMAP

submap = "gamemode"

bind = {

"$mainMod, M, submap, reset",

"$mainMod, M, exec, notify-send \"Game Mode\" \"Keybinds restored\"",

}

submap = "reset"

-- Normal keybinds

bind = {

"$mainMod, Q, exec, $terminal",

"$mainMod, A, exec, emacs",

"$mainMod, C, killactive,",

"$mainMod, E, exec, $fileManager",

"$mainMod, V, togglefloating,",

"$mainMod, R, exec, $menu",

"$mainMod, J, layoutmsg, togglesplit",

-- Move focus with mainMod + arrow keys

"$mainMod, left, movefocus, l",

"$mainMod, right, movefocus, r",

"$mainMod, up, movefocus, u",

"$mainMod, down, movefocus, d",

-- Switch workspaces with mainMod + [0-9]

"$mainMod, 1, workspace, 1",

"$mainMod, 2, workspace, 2",

"$mainMod, 3, workspace, 3",

"$mainMod, 4, workspace, 4",

"$mainMod, 5, workspace, 5",

"$mainMod, 6, workspace, 6",

"$mainMod, 7, workspace, 7",

"$mainMod, 8, workspace, 8",

"$mainMod, 9, workspace, 9",

"$mainMod, 0, workspace, 10",

-- Move active window to a workspace with mainMod + SHIFT + [0-9]

"$mainMod SHIFT, 1, movetoworkspace, 1",

"$mainMod SHIFT, 2, movetoworkspace, 2",

"$mainMod SHIFT, 3, movetoworkspace, 3",

"$mainMod SHIFT, 4, movetoworkspace, 4",

"$mainMod SHIFT, 5, movetoworkspace, 5",

"$mainMod SHIFT, 6, movetoworkspace, 6",

"$mainMod SHIFT, 7, movetoworkspace, 7",

"$mainMod SHIFT, 8, movetoworkspace, 8",

"$mainMod SHIFT, 9, movetoworkspace, 9",

"$mainMod SHIFT, 0, movetoworkspace, 10",

-- Move/resize windows with mainMod + LMB/RMB and dragging

"$mainMod, mouse:272, movewindow",

"$mainMod, mouse:273, resizewindow",

-- Hyprshot screenshots

", Print, exec, hyprshot -m region --clipboard-only",

"SHIFT, Print, exec, hyprshot -m region",

}

-- Laptop multimedia keys for volume and LCD brightness

bindel = {

",XF86AudioRaiseVolume, exec, wpctl set-volume -l 1 @DEFAULT_AUDIO_SINK@ 5%+",

",XF86AudioLowerVolume, exec, wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-",

",XF86AudioMute, exec, wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle",

",XF86AudioMicMute, exec, wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle",

",XF86MonBrightnessUp, exec, brightnessctl -e4 -n2 set 5%+",

",XF86MonBrightnessDown, exec, brightnessctl -e4 -n2 set 5%-",

}

-- Requires playerctl

bindl = {

", XF86AudioNext, exec, playerctl next",

", XF86AudioPause, exec, playerctl play-pause",

", XF86AudioPlay, exec, playerctl play-pause",

", XF86AudioPrev, exec, playerctl previous",

}

-- ==============================

-- WINDOWS

-- ==============================

windowrulev2 = {

-- Ignore maximize requests from all apps

"suppress_event maximize,class:.*",

-- Fix some dragging issues with XWayland

"no_focus,xwayland:1,title:^,class:^,float:1,fullscreen:0,pin:0",

-- Hyprland-run windowrule

"move 20 monitor_h-120,class:hyprland-run,force",

}