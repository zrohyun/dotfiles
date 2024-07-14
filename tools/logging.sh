#!/bin/bash

set_for_logging() {
    # LOGFILE
    #? TODO: set log level like LOGLEVEL=[DEBUG|INFO|WARN|ERROR]
    LOGFILE="./log.log.$(date +%Y%m%d.%H%M%S)" # "${TEMPDIR:-/tmp}/log.log.$(date +%Y%m%d.%H%M%S)"

    # exec 3>&-
    exec > >(tee -a "$LOGFILE") 2>&1

    verbose=true
    xtrace=true

    if $verbose; then
        set -v
    fi
    if $xtrace; then
        set -x
    fi
}