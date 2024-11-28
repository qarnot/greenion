#!/bin/sh


if [ $(ps --no-headers -o comm 1) != "systemd" ]; then
 printf "\033[31mSystem has not been booted with systemd as init system (PID 1).\033[0m\n"
 printf "\033[31mSkipping installation of the greenion server service\033[0m\n"
 exit
fi

enableService() {
  printf "\033[32m Reload the service unit from disk\033[0m\n"
  systemctl daemon-reload
  printf "\033[32m Unmask the service\033[0m\n"
  systemctl unmask greenion-agent-server.service
  printf "\033[32m Set the preset flag for the service unit\033[0m\n"
  systemctl preset greenion-agent-server.service
  printf "\033[32m Set the enabled flag for the service unit\033[0m\n"
  systemctl enable greenion-agent-server.service
  systemctl restart greenion-agent-server.service
}

action="$1"
if  [ "$1" = "configure" ] && [ -z "$2" ]; then
  # Alpine linux does not pass args, and deb passes $1=configure
  action="install"
elif [ "$1" = "configure" ] && [ -n "$2" ]; then
    # deb passes $1=configure $2=<current version>
  action="upgrade"
fi

case "$action" in
  "1" | "install")
    enableService
    ;;
  "2" | "upgrade")
    # restart the service when upgrading
    enableService
    ;;
  *)
    # Alpine: $1 == version being installed
    enableService
    ;;
esac
