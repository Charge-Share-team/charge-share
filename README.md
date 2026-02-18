# Charge.Share ⚡🤝

Charge.Share is a community-led EV charging platform designed to democratize access to electric vehicle power. By combining real-world public data with a peer-to-peer hosting model, we empower users to find, book, and share charging points.

## 🚀 Key Features
- **Hybrid Mapping:** Merges [Open Charge Map](https://openchargemap.org/) public data with private host listings.
- **25km Pulse Scan:** Advanced spatial queries (PostGIS) to find compatible chargers within a 25km radius.
- **Compatibility Filtering:** Automatically filters results based on your vehicle's plug type (Type 2, CCS, etc.).
- **Dark Mode UI:** A sleek, high-contrast interface designed for low-light driving conditions.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Maps:** Leaflet.js / OpenStreetMap
- **Data:** Open Charge Map API

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account with PostGIS enabled
- An Open Charge Map API Key

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/charge-share.git](https://github.com/your-username/charge-share.git)
