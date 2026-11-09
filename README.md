# RPM Car Rental Bot

Внутренний Telegram-бот для менеджеров RPM Rent. Менеджер ищет клиента по никнейму и начисляет попытку либо подтверждает завершённую аренду с начислением cashback в RPM Club.

## Быстрый запуск

1. Скопируйте `.env.example` в `.env`, задайте токен, `ADMIN_TELEGRAM_IDS`, `SUMMARY_CHAT_ID` и DSN RPM Club.
2. Запустите `docker compose up --build -d`.
3. Добавьте автомобили напрямую в БД бота, например: `docker compose exec db psql -U bot -d rental_bot -c "INSERT INTO vehicles(code,title,identifier) VALUES ('A01','BMW 320','А001АА77');"`.
4. Напишите боту `/start` из Telegram ID, внесённого в `ADMIN_TELEGRAM_IDS`.

В Docker схема создаётся из `db/init.sql` только при первом создании тома. Для уже существующей БД применяйте версионируемые SQL-миграции из `db/migrations` после резервной копии.

## Команды сотрудников

- `/new` — сохраняемая пошаговая форма новой аренды; `/cancel` отменяет форму.
- `/find <телефон|имя|username|telegram-id>` — поиск локальной карточки.
- `/club_link <клиент> <UUID RPM Club>` — подтверждаемая привязка найденной записи RPM Club.
- `/rentals`, `/deposits`, `/summary` — рабочие списки и сводка.
- `/issue <id>` — выдача брони.
- `/extend <id> <YYYY-MM-DDTHH:mm>` — продление после проверки конфликта.
- `/complete <id> <yes|no> <0..5> <ISO-время> [комментарий]` — приёмка; комментарий обязателен при `yes`.
- `/deposit_return <id> <сумма> [причина]` — фиксация возврата; повторная операция блокируется.

## RPM Club

Укажите read-only DSN с доступом к `integration.v_members` в `RPM_CLUB_DATABASE_URL` и API DSN с ролью `rpm_rent_bot` в `RPM_CLUB_API_DATABASE_URL`. Для подтверждения аренды на RPM Club должна быть применена миграция `20261106120000_record_rental_cashback.sql` из интеграционного проекта. Бот вызывает `integration.confirm_rental_cashback` только после явного подтверждения менеджером; функция Club сама создаёт завершённую оплаченную аренду, начисляет cashback и защищает повторы.

При подтверждении менеджер указывает сумму в целых рублях, автомобиль и даты аренды. Дата окончания не может быть в будущем.

## Проверка

`npm test` — доменные и прикладные тесты.

`npm run build` — проверка TypeScript.

Подробности: [DEPLOYMENT.md](docs/DEPLOYMENT.md) и [ACCEPTANCE.md](docs/ACCEPTANCE.md).
