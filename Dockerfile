FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist


FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    libzip-dev \
    ca-certificates \
 && docker-php-ext-install zip pdo pdo_mysql \
 && rm -rf /var/lib/apt/lists/*

RUN echo "expose_php = Off" > /usr/local/etc/php/conf.d/security.ini

RUN addgroup --system app \
 && adduser --system --ingroup app --home /var/www --shell /usr/sbin/nologin app

WORKDIR /var/www

COPY --chown=app:app . .

COPY --from=vendor --chown=app:app /app/vendor ./vendor

RUN chmod -R 755 /var/www \
 && chmod -R 775 storage bootstrap/cache

ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini-static /tini
RUN chmod +x /tini

USER app

EXPOSE 8000 8080

ENTRYPOINT ["/tini", "--", "./run.sh"]
