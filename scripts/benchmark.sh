#!/bin/bash

PROTOS="RTMP;HTTPFLV;HLS;DASH"
RES="["

rm -f ./spectator-tests.json
for p in $(echo $PROTOS | tr ";" "\n"); do
    npx ts-node ./scripts/benchmark.ts $p "$1" "$2"
    RES="$RES$(cat ./spectator-tests.json),"
    echo "$(echo $RES | rev | cut -c 2- | rev)]" > ./spectator-tests.json
done
