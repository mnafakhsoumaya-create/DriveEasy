# DriveEasy frontend

Angular 22 standalone app for the DriveEasy vehicle-rental platform.

## Run locally

Requirements: Node.js 22.22.3+ or 24.15.0+, npm, and the DriveEasy backend services.

```powershell
cd driveeasy-frontend
npm ci
npm start
```

Open <http://localhost:4200>. The app calls the backend only through the API Gateway at <http://localhost:8080>.

Start the backend first, in this order: `service-registry` (8761), `config-server` (8888), `vehicule-service` (8081), `client-service` (8082), `location-service` (8083), and `api-gateway` (8080). From each service directory, run `mvn spring-boot:run` in its own terminal.

## Included screens and actions

- Dashboard with monthly revenue, active rentals, occupancy, and fleet counts.
- Vehicle and client lists with text filtering; create and edit forms; guarded delete actions.
- Rental creation with price simulation, reservation, departure, return, cancellation, and late-fee calculation.
- Gateway connectivity message when the API is unavailable.

All data is held in memory by the backend services and resets when a service restarts.
