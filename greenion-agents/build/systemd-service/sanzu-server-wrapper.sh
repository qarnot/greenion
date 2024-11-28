#!/bin/sh

# this assumes exactly one user is logged in
export XAUTHORITY="$(ls /run/user/*/gdm/Xauthority | head -n 1)"

export DISPLAY=:0

/usr/bin/sanzu_server $@
