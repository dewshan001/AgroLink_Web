# Agrolink
Web Based Agriculture Community Management System

## Development

### One-time setup

Install dependencies for both projects:

```bash
cd api
npm install

cd ..\client
npm install
```

### Run API + Client together (two terminals)

This repo includes a VS Code compound task that starts both the backend and frontend in two separate VS Code terminals.

1. In VS Code, open the repo root folder.
2. Run: **Terminal → Run Task… → Dev: All**
	- (Shortcut: **Ctrl+Shift+B** runs **Dev: All** as the default build task.)

Ports:
- Client: http://localhost:3000
- API: http://localhost:5000

Stop:
- **Terminal → Run Task… → Terminate Task…**
