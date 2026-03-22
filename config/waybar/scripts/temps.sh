#!/usr/bin/env bash

read_temp() {
    local path="$1"
    if [[ -f $path ]]; then
        awk '{ printf "%.1f", $1/1000 }' $path
    else
        echo "N/A"
    fi
}

# ===== RUTAS ESTABLES =====

CPU_PATH="/sys/devices/pci0000:00/0000:00:18.3/hwmon/hwmon*/temp1_input"
GPU_PATH="/sys/devices/pci0000:00/0000:00:08.1/0000:0d:00.0/hwmon/hwmon*/temp1_input"
SSD_PATH="/sys/devices/pci0000:00/0000:00:02.2/0000:0c:00.0/nvme/nvme0/hwmon*/temp1_input"
RAM1_PATH="/sys/devices/pci0000:00/0000:00:14.0/i2c-12/12-0051/hwmon/hwmon*/temp1_input"
RAM2_PATH="/sys/devices/pci0000:00/0000:00:14.0/i2c-12/12-0053/hwmon/hwmon*/temp1_input"

CPU=$(read_temp $CPU_PATH)
GPU=$(read_temp $GPU_PATH)
SSD=$(read_temp $SSD_PATH)
RAM1=$(read_temp $RAM1_PATH)
RAM2=$(read_temp $RAM2_PATH)

#TEXT="  ${CPU}°C | 󰢮  ${GPU}°C |   ${SSD}°C |   ${RAM1}/${RAM2}°C"
TEXT="  ${CPU}°C | 󰢮  ${GPU}°C |  ${SSD}°C"
TOOLTIP="CPU: ${CPU}°C\\nGPU: ${GPU}°C\\nSSD: ${SSD}°C\\nRAM1: ${RAM1}°C\\nRAM2: ${RAM2}°C"

printf '{"text":"%s","tooltip":"%s"}\n' "$TEXT" "$TOOLTIP"

