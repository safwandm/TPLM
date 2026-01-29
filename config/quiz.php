<?php

return [
    'base_score' => env('QUIZ_BASE_SCORE', 5),
    'time_bonus_score' => env('QUIZ_TIME_BONUS_SCORE', 5),
    'start_delay' => env('QUIZ_START_DELAY', 5),
    'question_break_time' => env('QUIZ_QUESTION_BREAK_TIME', 5),
    'starting_hp' => env('QUIZ_STARTING_HP', 3),
];
