# Solux

Plataforma de gestión para proyectos, inventario, finanzas, reservas, usuarios y soporte.

<p>
  <img src="https://img.shields.io/badge/Svelte_5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Technical considerations

- Frontend: Svelte 5 + SvelteKit + TypeScript.
- Build tool: Vite.
- Backend: Supabase + PostgreSQL.
- Authentication and data access: Supabase.
- Feature modules: auth, backoffice, catalog, consumables, contact, finance, inventory, projects, reservations, support y users.
- Arquitectura organizada por features y capas de dominio.
