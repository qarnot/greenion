#!/bin/bash
set -eu

xdg-mime default /usr/share/applications/greenion-client-protocol.desktop x-scheme-handler/greenion-open


if command -v update-desktop-database >/dev/null; then
  update-desktop-database /usr/share/applications
fi
