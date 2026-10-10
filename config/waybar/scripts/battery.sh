#!/usr/bin/env bash
# Battery module content. The module itself is hidden via exec-if when no
# battery exists (e.g. desktop tower), so this script only runs on laptops.

BAT_DIR=$(ls -d /sys/class/power_supply/BAT* 2>/dev/null | head -1)
[ -z "$BAT_DIR" ] && exit 1

capacity=$(cat "$BAT_DIR/capacity" 2>/dev/null)
status=$(cat "$BAT_DIR/status" 2>/dev/null)
[ -z "$capacity" ] && exit 1

charging=0
case "$status" in *Charging*) charging=1;; esac

default_icons=("󰈎" "󰇺" "󰇻" "󰇼" "󰇽" "󰇾" "󰇿" "󰈀" "󰈁" "󰈂" "󰇹")
charging_icons=("󰣟" "󰣜" "󰈆" "󰈇" "󰈈" "󰣝" "󰈉" "󰣞" "󰈊" "󰈋" "󰈅")

idx=$(( (capacity * 10 + 5) / 10 ))
[ $idx -gt 10 ] && idx=10

if [ "$charging" -eq 1 ]; then
    icon="${charging_icons[$idx]}"
else
    icon="${default_icons[$idx]}"
fi

printf '{"text":"%s%%%s","tooltip":"%s (%s%%)"}\n' "$capacity" "$icon" "${status:-Unknown}" "$capacity"
