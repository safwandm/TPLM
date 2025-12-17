#!/bin/bash

php artisan serve --host=0.0.0.0&
PID1=$!

php artisan reverb:start &
PID2=$!

php artisan queue:work &
PID3=$!

npm run dev &
PID4=$!

trap "echo 'Stopping...'; kill $PID1 $PID2 $PID3 $PID4; exit 0" SIGINT

wait
