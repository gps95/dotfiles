#!/bin/bash
# Usage: ./switch.sh llm   or   ./switch.sh sd

if [ "$1" = "llm" ]; then
  docker compose stop stable-diffusion
  docker compose up -d llama-swap
else
  docker compose stop llama-swap
  docker compose up -d stable-diffusion
fi
