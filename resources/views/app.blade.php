<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>

    <link rel="icon" type="logo/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="logo/png" sizes="16x16" href="/favicon-16.png">

    <link rel="apple-touch-icon" href="/favicon-32.png">

    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb">

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    <!-- @routes -->
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>