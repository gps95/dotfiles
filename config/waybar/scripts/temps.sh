#!/usr/bin/env bash
# Waybar temps module.
# Auto-detects hwmon devices by driver name instead of hardcoding PCI paths,
# so it works on different machines (desktop & laptop) without edits.
# If a sensor is missing on a machine, it just shows N/A.

find_hwmon() {  # $1 = driver name -> first hwmon dir
    local h
    for h in /sys/class/hwmon/hwmon*; do
        [[ $(cat "$h/name" 2>/dev/null) == "$1" ]] && { echo "$h"; return 0; }
    done
    return 1
}

find_hwmons() {  # $1 = driver name -> all hwmon dirs
    local h
    for h in /sys/class/hwmon/hwmon*; do
        [[ $(cat "$h/name" 2>/dev/null) == "$1" ]] && echo "$h"
    done
}

read_temp() {  # $1 = hwmon dir -> temp1 in °C, or "N/A"
    local f="${1}/temp1_input"
    if [[ -f $f ]]; then
        awk '{ printf "%.1f", $1/1000 }' "$f"
    else
        echo "N/A"
    fi
}

# CPU: AMD -> k10temp, Intel fallback -> coretemp
CPU_HW=$(find_hwmon k10temp || find_hwmon coretemp)
CPU="${CPU_HW:+$(read_temp "$CPU_HW")}"
CPU="${CPU:-N/A}"

# GPU: there may be several amdgpu sensors (iGPU + dGPU) -> use the hottest
GPU_HW=""
GPU_RAW=0
while IFS= read -r h; do
    [[ -f "$h/temp1_input" ]] || continue
    t=$(<"$h/temp1_input")
    if (( t > GPU_RAW )); then
        GPU_HW=$h
        GPU_RAW=$t
    fi
done < <(find_hwmons amdgpu)
GPU="${GPU_HW:+$(read_temp "$GPU_HW")}"
GPU="${GPU:-N/A}"

# SSD: first nvme device
SSD_HW=$(find_hwmon nvme)
SSD="${SSD_HW:+$(read_temp "$SSD_HW")}"
SSD="${SSD:-N/A}"

# RAM: spd5118 (may be two sticks)
mapfile -t RAM_HW < <(find_hwmons spd5118)
RAM1="${RAM_HW[0]:+$(read_temp "${RAM_HW[0]}")}"
RAM1="${RAM1:-N/A}"
RAM2="${RAM_HW[1]:+$(read_temp "${RAM_HW[1]}")}"
RAM2="${RAM2:-N/A}"

TEXT="  ${CPU}°C | 󰢮  ${GPU}°C |  󰃇 ${SSD}°C"
TOOLTIP="CPU: ${CPU}°C\\nGPU: ${GPU}°C\\nSSD: ${SSD}°C\\nRAM1: ${RAM1}°C\\nRAM2: ${RAM2}°C"

printf '{"text":"%s","tooltip":"%s"}\n' "$TEXT" "$TOOLTIP"
