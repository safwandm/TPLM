<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens  ;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'name',
    'email',
    'identifier',
    'password',
    ];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    /**
     * Model boot method.
     *
     * We add global safeguards here so that admin accounts cannot be
     * accidentally modified or deleted through the application layer.
     * This protection applies to ALL deletion attempts (controllers,
     * jobs, tinker, scripts, etc.).
     */
    protected static function booted()
    {
        static::deleting(function ($user) {
            /**
             * SAFEGUARD #1
             * Prevent deletion of admin accounts through the application.
             * Admin users should only be managed directly through the
             * database or seeders.
             */
            if ($user->hasRole('admin')) {
                throw new \Exception('Admin accounts cannot be deleted through the application.');
            }
        });

        static::updating(function ($user) {
            /**
             * SAFEGUARD #2
             * Prevent accidental removal or modification of admin accounts.
             * If the user currently has the admin role, block updates that
             * might change its privileges through normal update flows.
             *
             * This ensures admin accounts remain stable unless explicitly
             * modified at the database level.
             */
            if ($user->hasRole('admin')) {
                throw new \Exception('Admin accounts cannot be modified through the application.');
            }
        });
    }
}
