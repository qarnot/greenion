#!/bin/sh

set -ex

# either 'Server' or 'Client'
KIND=$1

candle "Greenion${KIND}Installer.wxs"
light "Greenion${KIND}Installer.wixobj" -sval
