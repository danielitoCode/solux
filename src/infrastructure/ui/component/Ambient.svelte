<!--
  Atmósfera inmersiva compartida: una sola capa fija a ancho completo del viewport.
  Úsala como primer hijo de un contenedor con `isolation: isolate` y `use:scrollDepth`
  (así recibe --scroll y se atenúa al bajar). Solo usa variables del tema.
-->
<script lang="ts">
    // Chispas de luz con valores deterministas (sin Math.random: estable en SSR)
    const sparks = Array.from({ length: 14 }, (_, i) => ({
        x: (i * 37 + 11) % 100,
        size: 2 + (i % 3),
        dur: 14 + ((i * 7) % 10),
        delay: -((i * 23) % 20)
    }));
</script>

<div class="ambient" aria-hidden="true">
    <div class="glow glow-green"></div>
    <div class="glow glow-sun"></div>
    <div class="glow glow-deep"></div>
    <div class="grid-lines"></div>
    <div class="beam"></div>
    {#each sparks as spark, i (i)}
        <i
                class="spark"
                style="--x: {spark.x}%; --s: {spark.size}px; --d: {spark.dur}s; --delay: {spark.delay}s"
        ></i>
    {/each}
</div>

<style>
    .ambient {
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
        opacity: calc(1 - var(--scroll, 0) * 0.6);
    }
    .glow {
        position: absolute;
        border-radius: 50%;
        will-change: transform;
    }
    .glow-green {
        width: 62vw;
        height: 62vw;
        left: -20vw;
        top: 6vh;
        background: radial-gradient(circle, var(--color-primary), transparent 65%);
        opacity: 0.28;
        animation: drift 18s ease-in-out infinite alternate;
    }
    .glow-sun {
        width: 46vw;
        height: 46vw;
        max-width: 760px;
        max-height: 760px;
        right: -6vw;
        top: -8vw;
        background: radial-gradient(circle, var(--color-accent), transparent 65%);
        opacity: 0.16;
        animation: drift 14s ease-in-out infinite alternate-reverse;
    }
    .glow-deep {
        width: 50vw;
        height: 50vw;
        left: 34vw;
        bottom: -26vw;
        background: radial-gradient(circle, var(--color-primary), transparent 65%);
        opacity: 0.2;
        animation: drift 22s ease-in-out infinite alternate;
    }
    @keyframes drift {
        to {
            transform: translate(5vw, 4vh) scale(1.12);
        }
    }
    .grid-lines {
        position: absolute;
        inset: 0;
        background-image:
                linear-gradient(var(--color-border) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
        background-size: 64px 64px;
        opacity: 0.35;
        -webkit-mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%);
        mask-image: radial-gradient(ellipse 70% 60% at 68% 30%, #000, transparent 75%);
    }
    .beam {
        position: absolute;
        top: -20%;
        right: 12%;
        width: 24vw;
        height: 140%;
        background: linear-gradient(180deg, rgba(255, 191, 25, 0.22), transparent 70%);
        transform-origin: top center;
        transform: rotate(16deg);
        filter: blur(28px);
        opacity: 0.55;
        mix-blend-mode: screen;
        animation: beam 10s ease-in-out infinite alternate;
    }
    @keyframes beam {
        to {
            transform: rotate(26deg);
            opacity: 0.85;
        }
    }
    .spark {
        position: absolute;
        bottom: -12px;
        left: var(--x);
        width: var(--s);
        height: var(--s);
        border-radius: 50%;
        background: var(--color-accent);
        box-shadow: 0 0 10px rgba(255, 191, 25, 0.8);
        opacity: 0;
        animation: spark-up var(--d) linear var(--delay) infinite;
    }
    @keyframes spark-up {
        0% {
            transform: translate(0, 0);
            opacity: 0;
        }
        10% {
            opacity: 0.7;
        }
        90% {
            opacity: 0.45;
        }
        100% {
            transform: translate(30px, -108vh);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .glow,
        .beam {
            animation: none;
        }
        .spark {
            display: none;
        }
    }
</style>