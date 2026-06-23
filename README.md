# Duolingo – mikroservisna platforma za učenje jezika

**Domaći 2 (RNAEP) + Seminarski rad** – nadogradnja mikroservisne arhitekture:
arhitektura vođena događajima (Apache Kafka), CI/CD (GitHub Actions), bezbednost,
monitoring (Prometheus + Grafana) i napredni distribuirani paterni.

- **Studenti:** Stefan Božić (2022/0147), Luka Arsov (2022/0475)
- **Repo (GitHub Classroom):** `rnaep-oas-projekat-webappzaucenjejezika_2022_0147`

Korisnički interfejs (React + Vite) preuzet je sa predmeta **Internet tehnologije**
i prevezan na **API Gateway**; backend su nezavisni mikroservisi (princip
*database-per-service*) sa asinhronom komunikacijom preko **Kafke**.

---

## 1. Arhitektura

| Sloj | Komponenta | Tehnologija | Baza | Uloga u EDA |
|---|---|---|---|---|
| Klijent | `frontend` | React 19 + Vite + Zustand + Tailwind v4 | – | – |
| Ulaz | `gateway` | Express reverse-proxy + security + metrics | – | – |
| Servis | `user-service` | Express, JWT (Bearer) | PostgreSQL | – |
| Servis | `course-service` | jezici, kursevi, upisi, admin statistika | PostgreSQL | **Producer** |
| Servis | `lesson-service` | lekcije, prevod, rečnik (Circuit Breaker) | PostgreSQL | – |
| Servis | `assessment-service` | testovi i ocenjivanje | PostgreSQL | **Producer** |
| Servis | `progress-service` | napredak korisnika (read model preko Kafke) | MongoDB | **Consumer** |
| Servis | `notification-service` | notifikacije | PostgreSQL | **Consumer** |
| Servis | `enrollment-processor` | **hibridni modul** | – | **Consumer + Producer** |
| Servis | `speech-service` | speaking vežbe | – | **Producer** |
| Servis | `media-service` | multimedija | – | – |
| Broker | `kafka` | Apache Kafka (KRaft, bez ZooKeeper-a) | – | – |
| Eksterni | `libretranslate` | LibreTranslate (self-hostovan) | – | – |
| Monitoring | `prometheus`, `grafana` | metrike + dashboard | – | – |

Klijent komunicira isključivo sa Gateway-em (`http://localhost:8080`). Servisi
nemaju zajedničku bazu – referenciraju se preko ID vrednosti i internih HTTP poziva.

---

## 2. Arhitektura vođena događajima (Apache Kafka)

Komunikacija oko upisa, notifikacija i napretka prebačena je iz sinhronog HTTP-a
u **asinhronu, preko Kafke**.

### Kafka topici (5)
| Topic | Opis |
|---|---|
| `enrollment-created` | objavljuje se kada se student upiše na kurs |
| `enrollment-status-changed` | promena statusa upisa (active/completed/cancelled) |
| `notification-requested` | zahtev za slanje notifikacije |
| `progress-updated` | ažuriranje read modela napretka |
| `learning-dlq` | dead-letter topic za neuspele obrade |

### Producer-i i Consumer-i
- **Producer-i:** `course-service` (enrollment-created, enrollment-status-changed),
  `enrollment-processor` (notification-requested, progress-updated),
  `assessment-service` i `speech-service` (progress-updated).
- **Consumer-i:** `enrollment-processor` (enrollment-created),
  `notification-service` (notification-requested),
  `progress-service` (progress-updated).

### Hibridni modul – `enrollment-processor` (Consumer + Producer)
Obavezni hibridni servis: **konzumira** `enrollment-created`, izvršava poslovnu
logiku (formira poruku dobrodošlice i inicijalni zapis napretka), pa **publikuje**
dva nova događaja – `notification-requested` i `progress-updated`. U slučaju greške
objavljuje na `learning-dlq`.

```
[course-service] --enrollment-created--> [enrollment-processor]
                                              |  (poslovna logika)
                          notification-requested      progress-updated
                                  |                          |
                        [notification-service]        [progress-service]
                          (zapis notifikacije)        (read model napretka)
```

---

## 3. Napredni distribuirani patern – Circuit Breaker

Od tri ponuđena paterna (Saga, CQRS, Circuit Breaker) implementiran je
**Circuit Breaker** (biblioteka `opossum`), mehanizam zaštite od kaskadnih
otkazivanja. Ako neki servis ili eksterni API postane nedostupan/spor, prekidač
se „otvara" i odmah vraća podrazumevani (**fallback**) odgovor, dajući zavisnosti
vremena da se oporavi – umesto da zahtevi vise i ruše ceo lanac.

Primenjen je tamo gde postoje pozivi ka spoljnim/zavisnim komponentama:
- `lesson-service` – pozivi ka **LibreTranslate** i **Free Dictionary API**. Kad
  se prekidač otvori, vraća se fallback (`provider: "fallback"`, tj. poruka da
  prevod/rečnik trenutno nije dostupan), umesto da zahtev visi.
- `course-service` – interni pozivi ka `user-service` i `lesson-service` (imena
  korisnika, statistika) idu kroz prekidače sa fallback vrednostima (prazna mapa /
  nule), pa admin statistika radi i kada je zavisni servis privremeno nedostupan.

Stanja prekidača (zatvoren → otvoren → poluotvoren) i fallback se jasno vide u
ponašanju servisa kada se zavisnost ugasi.

---

## 4. Bezbednost aplikacije

| Ranjivost | Mehanizam |
|---|---|
| **SQL Injection** | isključivo **parametrizovani upiti** (`pg` – `$1, $2 …`); nema konkatenacije korisničkog ulaza u SQL |
| **XSS** | `helmet` bezbednosna zaglavlja + **sanitizacija/encoding** ulaznih stringova (`xss` lib) u telu zahteva; React dodatno enkodira izlaz |
| **CSRF** | autentikacija je **stateless JWT u `Authorization` zaglavlju** (otporno na ambient-cookie CSRF) + **anti-CSRF provera `Origin`** zaglavlja na svim POST/PUT/DELETE zahtevima na Gateway-u |
| **IDOR** | autorizacioni sloj rigorozno proverava vlasništvo nad resursom: izmena upisa samo admin ili predavač tog kursa; izmena/brisanje lekcije samo vlasnik/admin; `/student/:id/...` i `/teacher/:id/...` samo sam korisnik ili admin |
| **CORS** | `cors` allowlist – pristup dozvoljen **isključivo klijentskoj aplikaciji** (`http://localhost:3000`), konfigurabilno preko `CORS_ORIGINS` |

Implementacija je u `gateway/src/security.js` i istom modulu u svakom servisu.

---

## 5. Monitoring (Prometheus + Grafana)

Svaki servis kroz `prom-client` izlaže **`/metrics`**: standardne telemetrijske
metrike (CPU, memorija/RSS, event loop), **broj HTTP zahteva** (`http_requests_total`,
`http_request_duration_seconds`) i **broj Kafka poruka** (`kafka_messages_total`
sa labelama topic/role).

- **Prometheus** (`monitoring/prometheus.yml`) skuplja metrike sa svih servisa.
- **Grafana** dolazi sa automatski provisioned Prometheus datasource-om i
  dashboard-om „Duolingo – pregled mikroservisa" (status servisa, HTTP rate po
  servisu, Kafka poruke po topic-u, iskorišćenost memorije).

---

## 6. CI/CD (GitHub Actions)

Workflow `.github/workflows/ci.yml` okida se na push/PR ka `main` i `develop`:
1. **test** – pokreće unit/funkcionalne testove (`node --test`) za `user-service`,
   `course-service`, `lesson-service` (JWT, mapiranje jezika, XSS sanitizacija).
2. **build** – gradi **Docker image za svaki servis** (matrix). Na push u
   `main`/`develop` dodatno radi **push na GitHub Container Registry (GHCR)**
   koristeći ugrađeni `GITHUB_TOKEN` (bez dodatnih secret-a).

---

## 7. Pokretanje

```bash
docker compose up --build
```

> Napomena: Kafka prvo podiže broker, a LibreTranslate pri prvom pokretanju skida
> jezičke modele (par minuta) pa prevod proradi tek tada.

### Pristupne tačke
| Šta | Adresa |
|---|---|
| Klijent (UI) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin / admin) |
| Kafka (broker) | localhost:9092 |
| LibreTranslate | http://localhost:5000 |

### Demo nalozi (lozinka: `password`)
| Uloga | Email |
|---|---|
| admin | `admin@mail.com` |
| teacher | `teacher@mail.com` (+ `ana@mail.com`, `marko@mail.com`) |
| student | `student@mail.com` (+ `student1@mail.com` … `student12@mail.com`) |

Seed je deterministički (`admin = 1`, `teacheri = 2,3,4`, `studenti = 5…17`) pa se
ID vrednosti poklapaju između servisa.

---

## 8. API ugovor (kroz Gateway, prefiks `/api`)

**Auth → user-service:** `POST /register`, `POST /login`, `GET /me`, `POST /logout`
**Jezici/Kursevi/Upisi/Admin → course-service:** `/languages`, `/courses`,
`/teacher/:id/courses`, `/enrollments`, `/student/:id/enrollments`, `/admin/stats`
**Lekcije/Prevod/Rečnik → lesson-service:** `/lessons`, `/translate`, `/dictionary/:word`
**Ostalo:** `/assessments`, `/progress`, `/notifications`, `/speech`, `/media`

Oblici odgovora identični su ugovoru koji klijent očekuje, pa UI radi bez izmena.

---

## 9. GitFlow i dokumentacija

Projekat koristi GitFlow: grane `main` i `develop`, `feature/*` grane, PR-ovi sa
review-om i semantičko tagovanje (`v1.0.0`).
Dizajn iz Domaćeg 1 nalazi se u [`docs/Domaci_1.pdf`](docs/Domaci_1.pdf).
Kanban/Issues praćenje pokriveno je kroz predmet *Upravljanje rizikom* (Grupa II).

## 10. Dva eksterna API-ja (open-source i besplatni, bez ključa)
1. **LibreTranslate** – self-hostovan (AGPL), `GET /api/translate`.
2. **Free Dictionary API** – `GET /api/dictionary/:word`.
