# Duolingo – mikroservisna platforma za učenje jezika (Domaći 2, RNAEP)

Praktična implementacija mikroservisne arhitekture projektovane u Domaćem 1.
Korisnički interfejs (React + Vite) preuzet je iz projekta sa predmeta
**Internet tehnologije** i prevezan na **API Gateway**, dok je celokupan backend
realizovan kao skup nezavisnih mikroservisa (princip *database-per-service*),
uz asinhronu komunikaciju preko **RabbitMQ** message broker-a.

- **Studenti:** Stefan (2022/0147), Luka Arsov (2022/0475)
- **Repo (GitHub Classroom):** `rnaep-oas-projekat-webappzaucenjejezika_2022_0147`

---

## Arhitektura

| Sloj | Komponenta | Tehnologija | Baza |
|---|---|---|---|
| Klijent | `frontend` (UI) | React 19 + Vite + Zustand + Tailwind v4 | – |
| Ulaz | `gateway` | Express reverse-proxy (jedinstvena ulazna tačka) | – |
| Servis | `user-service` | Express, JWT (Bearer) | PostgreSQL |
| Servis | `course-service` | Express (jezici, kursevi, upisi, admin statistika) | PostgreSQL |
| Servis | `lesson-service` | Express (lekcije, prevod, rečnik) | PostgreSQL |
| Servis | `assessment-service` | Express (testovi/kvizovi) | PostgreSQL |
| Servis | `progress-service` | Express (napredak korisnika) | MongoDB |
| Servis | `notification-service` | Express (notifikacije, consumer) | PostgreSQL |
| Servis | `speech-service` | Express (govor/izgovor) | – |
| Servis | `media-service` | Express (medijski sadržaj) | – |
| Broker | `rabbitmq` | RabbitMQ (topic exchange `learning.events`) | – |
| Eksterni | `libretranslate` | LibreTranslate (self-hostovan) | – |

Klijent komunicira **isključivo** sa API Gateway-em (`http://localhost:8080`),
koji zahteve prosleđuje odgovarajućem servisu. Servisi nemaju zajedničku bazu –
međusobno se referenciraju preko ID vrednosti i internih HTTP poziva.

---

## Dva eksterna API-ja (open-source i besplatni, bez ključa)

1. **LibreTranslate** – self-hostovan (AGPL), pokriva prevod (`GET /api/translate`),
   `provider: "LibreTranslate"`. Učitani jezici: en, de, es, fr, it, pt.
2. **Free Dictionary API** – `GET /api/dictionary/:word` (značenja, izgovor, audio).

Dodatno, UI koristi **FlagCDN** slike zastava za jezike.

---

## Pokretanje

```bash
docker compose up --build
```

> Napomena: pri prvom pokretanju LibreTranslate skida jezičke modele (par minuta),
> pa prevod proradi tek kad se taj kontejner podigne.

### Pristupne tačke
| Šta | Adresa |
|---|---|
| Klijentska aplikacija (UI) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| RabbitMQ konzola | http://localhost:15672 (guest / guest) |
| LibreTranslate | http://localhost:5000 |

### Demo nalozi (lozinka: `password`)
| Uloga | Email |
|---|---|
| admin | `admin@mail.com` |
| teacher | `teacher@mail.com` (+ `ana@mail.com`, `marko@mail.com`) |
| student | `student@mail.com` (+ `student1@mail.com` … `student12@mail.com`) |

Seed je deterministički: `admin = 1`, `teacheri = 2,3,4`, `studenti = 5…17`, pa
se ID vrednosti poklapaju između servisa (npr. `course.teacher_id` →
korisnik iz `user-service`-a).

---

## API ugovor (sve rute idu kroz Gateway, prefiks `/api`)

**Auth → user-service:** `POST /register`, `POST /login`, `GET /me`, `POST /logout`
**Jezici → course-service:** `GET /languages`, `GET /languages/:id`, `POST/PUT/DELETE /languages…` (admin)
**Kursevi → course-service:** `GET /courses`, `GET /courses/:id`, `GET /teacher/:id/courses`, `POST/PUT/DELETE /courses…` (admin)
**Upisi → course-service:** `GET /enrollments`, `POST /enrollments` (student), `PUT /enrollments/:id` (admin/predavač), `GET /student/:id/enrollments`
**Lekcije → lesson-service:** `GET /lessons`, `GET /lessons/:id`, `POST/PUT/DELETE /lessons…` (predavač/admin)
**Admin → course-service:** `GET /admin/stats` (agregira podatke iz user/course/lesson servisa)
**Prevod/rečnik → lesson-service:** `GET /translate`, `GET /dictionary/:word`

Oblici odgovora (envelope `{languages}`, `{course}`, `{enrollment}`, …) i polja
resursa identični su ugovoru koji klijent očekuje, pa UI radi bez ikakve izmene.

---

## Event-driven tok (RabbitMQ)

`course-service` pri upisu studenta objavljuje `enrollment.created`, a pri promeni
statusa `enrollment.updated` na exchange `learning.events`. Poruke konzumiraju:
- **notification-service** – generiše notifikaciju (push/email log),
- **progress-service** – evidentira napredak (kolekcija u MongoDB).

Servisi `assessment-service`, `speech-service` i `media-service` deo su projektovane
arhitekture iz Domaćeg 1; pokrenuti su i dostupni kroz Gateway (health endpoint),
a njihovo površinsko povezivanje u UI predviđeno je za narednu iteraciju.

---

## Kontejnerizacija

Svaki servis ima `Dockerfile`; celina se orkestrira kroz `docker-compose.yml`
(11 servisa + 6 baza + RabbitMQ + LibreTranslate). Baze koriste imenovane
volume-e za perzistenciju.

---

## GitFlow i dokumentacija

Projekat koristi GitFlow: grane main/develop, feature grane, PR-ovi sa review-om i tagovanje verzija (v1.0.0).
Dizajn iz Domaćeg 1 nalazi se u [`docs/Domaci_1.pdf`](docs/Domaci_1.pdf).
Kanban/Issues praćenje pokriveno je kroz predmet *Upravljanje rizikom* (Grupa II).
