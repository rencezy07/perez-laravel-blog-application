<?php

use Laravel\Sanctum\Sanctum;

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => '',

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        'substitute_bindings' => Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],

    'redirect' => null,

    'providers' => [
        'users' => ['driver' => 'eloquent', 'model' => App\Models\User::class],
    ],
];
