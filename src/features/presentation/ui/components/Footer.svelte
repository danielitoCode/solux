<footer class="footer">
  <div>
    <div class="brand footer-brand">
      <span class="brand-mark"><span></span></span>
      <span>SOLUX</span>
    </div>
    <p>Energía solar · Ingeniería eléctrica</p>
  </div>
  <div class="footer-links">
    <a href="/servicios">Servicios</a>
    <a href="/catalogo">Catálogo</a>
    <a href="/proyectos">Proyectos</a>
    <a href="/reservas">Reservas</a>
    <a href="/contacto">Contacto</a>
  </div>
  <span>© {new Date().getFullYear()} SOLUX · Guantánamo, Cuba</span>
</footer>

<style>
  .footer {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 30px 28px 50px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    color: var(--color-muted);
    font-size: 11px;
  }
  .footer-brand {
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
  }
  .brand-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(145deg, var(--color-primary), var(--color-primary-2));
    position: relative;
    overflow: hidden;
    transform: rotate(-5deg);
  }
  .brand-mark::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-accent);
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .brand-mark span {
    width: 14px;
    height: 7px;
    border: 3px solid white;
    border-top: 0;
    border-radius: 0 0 10px 10px;
    position: relative;
    z-index: 1;
  }
  .footer p {
    margin: 8px 0 0;
  }
  .footer-links {
    display: flex;
    gap: 18px;
  }
  .footer-links a:hover {
    color: var(--color-primary);
  }
  @media (max-width: 600px) {
    .footer {
      display: block;
    }
    .footer-links {
      margin: 20px 0;
      flex-wrap: wrap;
    }
  }
</style>
