/**
 * Utilidades de movimiento compartidas por las vistas de SOLUX.
 * Todas respetan prefers-reduced-motion y evitan trabajo en dispositivos táctiles.
 */

export const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

/** Duración en ms, o 0 si el usuario prefiere menos movimiento. */
export const ms = (value: number) => (reduced ? 0 : value);

/** Revela el elemento al entrar en pantalla (añade la clase `in`). */
export function reveal(node: HTMLElement, delay = 0) {
    if (reduced || typeof IntersectionObserver === 'undefined') {
        node.classList.add('in');
        return;
    }
    node.style.setProperty('--delay', `${delay}ms`);
    const io = new IntersectionObserver(
        ([entry]) => {
            if (!entry.isIntersecting) return;
            node.classList.add('in');
            io.disconnect();
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
}

/** Inclinación 3D + parallax por capas según el puntero (--rx, --ry, --mx, --my). */
export function tilt(node: HTMLElement) {
    if (reduced || !finePointer) return;
    let raf = 0;
    const set = (x: number, y: number) => {
        node.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        node.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
        node.style.setProperty('--mx', x.toFixed(3));
        node.style.setProperty('--my', y.toFixed(3));
    };
    const move = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => set(x, y));
    };
    const leave = () => {
        cancelAnimationFrame(raf);
        set(0, 0);
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return {
        destroy() {
            cancelAnimationFrame(raf);
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerleave', leave);
        }
    };
}

/** Profundidad de scroll: expone --py (px, parallax) y --scroll (0…1, atenúa la atmósfera). */
export function scrollDepth(node: HTMLElement) {
    if (reduced) return;
    let raf = 0;
    const update = () => {
        raf = 0;
        const y = Math.min(window.scrollY, 700);
        node.style.setProperty('--py', (y * 0.1).toFixed(1));
        node.style.setProperty('--scroll', (y / 700).toFixed(3));
    };
    const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return {
        destroy() {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        }
    };
}

/** Foco de luz que sigue al cursor dentro de la tarjeta (--sx, --sy). */
export function spotlight(node: HTMLElement) {
    if (reduced || !finePointer) return;
    const move = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        node.style.setProperty('--sx', `${e.clientX - r.left}px`);
        node.style.setProperty('--sy', `${e.clientY - r.top}px`);
    };
    node.addEventListener('pointermove', move);
    return { destroy: () => node.removeEventListener('pointermove', move) };
}