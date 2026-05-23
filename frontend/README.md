This is a minimal React + Vite frontend for the Lego Pincér app.

Commands:

```bash
cd frontend
npm install
npm run dev
```

Pages:
- `/` product listing and order modal
- `/admin` admin-only orders list (requires basic auth credentials to fetch from backend)

Notes:
- Product data is currently mocked in `src/components/ProductList.jsx`.
- Update the API paths if the backend runs at a different base URL.
