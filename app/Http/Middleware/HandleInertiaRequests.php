<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array {
        return array_merge(parent::share($request),[
            'auth' => [
                'user' => $request->user(), // ← これが無いと props.auth が undefined になる
        ],
            'flash' => fn () => $request->session()->get('flash'),
        ]);
    }


}
