# Lumyn

Lumyn is a mobile-first scripture journaling prototype for couples. The interface still uses mock journal and sharing data; this milestone adds structured scripture metadata and Come, Follow Me schedules for 2025 and 2026.

## Run locally

```sh
npm install
npm run dev
```

Before deploying, validate the local datasets and build:

```sh
npm run test:data
npm run validate:data
npm run build
```

## Data sources

- Canon names: [official scripture index](https://www.churchofjesuschrist.org/study/scriptures?lang=eng).
- 2025 and 2026 weekly assignments: the official [Doctrine and Covenants 2025](https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-doctrine-and-covenants-2025?lang=eng) and [Old Testament 2026](https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026?lang=eng) manuals.
- Chapter and verse bounds: metadata derived from the [public-domain reference dataset](https://github.com/bcbooks/scriptures-json/tree/3bda76e40add4582165340ea6b1198dc6ad26ae1/reference). Only book names and verse counts are included in this app; no scripture text is included.