#!/bin/bash

PROTOS="RTMP;HTTPFLV;HLS;DASH"
RES="["

rm -f ./spectator-tests.json
for p in $(echo $PROTOS | tr ";" "\n"); do
    npx ts-node ./scripts/benchmark.ts $p
    RES="$RES$(cat ./spectator-tests.json)"
done
RES="$RES]"
echo "$RES" > ./spectator-tests.json
