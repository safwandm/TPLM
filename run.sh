#!/bin/bash

php artisan serve --port=8001 &
PID1=$!

php artisan reverb:start &
PID2=$!

php artisan queue:work &
PID3=$!

trap "echo 'Stopping...'; kill $PID1 $PID2 $PID3; exit 0" SIGINT

wait
