/* ============================================================
   MATHHERO – animaciones.js
   ============================================================
   Maneja todas las animaciones visuales del juego:
   - Fondos de arena por nivel (imágenes + partículas)
   - Animaciones del villano (entrada, ataque, daño, muerte)
   - CSS dinámico inyectado para animaciones complejas
   - Estilos de burbujas de aliados

   ESTRUCTURA DEL ARCHIVO:
   ─────────────────────────────────────────
   1. FONDOS POR NIVEL     ← Configuración de imagen/partículas por nivel
   2. CONFIGURAR ARENA      ← Aplica fondo y genera partículas
   3. ANIMACIONES VILLANO   ← Entrada, rugido, ataque, daño, muerte
   4. CSS DINÁMICO          ← @keyframes inyectados al <head>
   5. INICIALIZACIÓN        ← Auto-ejecuta al cargar la página

   NOTA: Este archivo depende de que juego.js defina los IDs
   del DOM en español (arenaBatalla, contenedorEnemigo, etc.)
   ============================================================ */


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  1. FONDOS POR NIVEL                                          ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Cada nivel tiene su propia imagen de fondo, color de acento  ║
   ║  y tipo de partículas ambientales.                            ║
   ║                                                               ║
   ║  PROPIEDADES MODIFICABLES:                                    ║
   ║  - img:        Ruta a la imagen de fondo del nivel            ║
   ║  - acento:     Color hexadecimal para sombras/brillos         ║
   ║  - particulas: Tipo de partículas ('hojas','fuego','chispas', ║
   ║                'estrellas','nieve')                            ║
   ╚═══════════════════════════════════════════════════════════════╝ */
const FONDOS_ARENA = {
  1: { img: 'assets/nivel1/fondo_nivel1.png', acento: '#00e676', particulas: 'hojas' },
  2: { img: 'assets/nivel2/fondo_nivel2.png', acento: '#ff9800', particulas: 'fuego' },
  3: { img: 'assets/nivel3/fondo_nivel3.png', acento: '#9c27b0', particulas: 'chispas' },
  4: { img: 'assets/nivel4/fondo_nivel4.png', acento: '#ff1744', particulas: 'fuego' },
  5: { img: 'assets/nivel5/fondo_nivel5.png', acento: '#00bcd4', particulas: 'estrellas' },
  6: { img: 'assets/nivel6/fondo_nivel6.png', acento: '#ffd700', particulas: 'chispas' }
};


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  2. CONFIGURAR FONDO DE ARENA                                 ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Aplica la imagen de fondo del nivel actual y genera          ║
   ║  partículas animadas (emojis flotantes) sobre el escenario.  ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * configurarFondoArena(idNivel):
 *   Se llama al inicio de cada subnivel desde juego.js → configurarArena().
 *   1. Limpia elementos del nivel anterior
 *   2. Aplica la imagen de fondo al elemento .capa-fondo-arena
 *   3. Crea un contenedor de partículas y las inicia
 */
function configurarFondoArena(idNivel) {
  const cfg   = FONDOS_ARENA[idNivel] || FONDOS_ARENA[1];
  const arena = document.getElementById('arenaBatalla');
  if (!arena) return;

  // Limpiar elementos dinámicos del nivel anterior
  arena.querySelectorAll('.particulas-arena, .piso-arena').forEach(el => el.remove());

  // Aplicar imagen de fondo a la capa bg
  arena.style.background = '#000';  // Fondo negro de base
  const capaFondo = arena.querySelector('.capa-fondo-arena');
  if (capaFondo) {
    capaFondo.style.cssText = `
      position:absolute; inset:0;
      background-image: url('${cfg.img}');
      background-size: 100% 100%;         /* Estira la imagen para cubrir toda el área */
      background-position: center center;
      background-repeat: no-repeat;
      z-index: 0;
    `;
  }

  // Crear contenedor de partículas sobre el fondo
  const particulas = document.createElement('div');
  particulas.className = 'particulas-arena';
  particulas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden;';
  arena.appendChild(particulas);
  iniciarParticulas(particulas, cfg.particulas, cfg.acento);
}

/**
 * iniciarParticulas(contenedor, tipo, acento):
 *   Genera partículas (emojis) periódicamente que suben desde abajo.
 *   Cada tipo tiene sus propios emojis, velocidad e intervalo.
 *
 *   TIPOS DISPONIBLES:
 *   - fuego:     🔥 ✨ 💥  (rápidas, cada 400ms)
 *   - nieve:     ❄️ 🌨️ 💎  (lentas, cada 500ms)
 *   - hojas:     🍃 🌿 ✨  (suaves, cada 600ms)
 *   - chispas:   ✨ ⚡ 💜  (muy rápidas, cada 350ms)
 *   - estrellas: ⭐ 🌟 💫  (3 a la vez, cada 450ms)
 */
function iniciarParticulas(contenedor, tipo, acento) {
  // Limpiar intervalo anterior (evitar acumulación)
  if (window._intervaloParticulas) {
    clearInterval(window._intervaloParticulas);
    window._intervaloParticulas = null;
  }

  const configs = {
    fuego:     { emoji: ['🔥','✨','💥'], cantidad: 2, intervalo: 400 },
    nieve:     { emoji: ['❄️','🌨️','💎'], cantidad: 2, intervalo: 500 },
    hojas:     { emoji: ['🍃','🌿','✨'], cantidad: 2, intervalo: 600 },
    chispas:   { emoji: ['✨','⚡','💜'], cantidad: 2, intervalo: 350 },
    estrellas: { emoji: ['⭐','🌟','💫'], cantidad: 3, intervalo: 450 }
  };

  const cfg = configs[tipo] || configs.estrellas;

  // Crear partículas periódicamente
  window._intervaloParticulas = setInterval(() => {
    // Si la arena ya no existe (cambió de pantalla), limpiar
    if (!document.getElementById('arenaBatalla')) {
      clearInterval(window._intervaloParticulas);
      return;
    }
    for (let i = 0; i < cfg.cantidad; i++) {
      const p = document.createElement('div');
      p.textContent = cfg.emoji[Math.floor(Math.random() * cfg.emoji.length)];
      const x = Math.random() * 100;       // Posición horizontal aleatoria (0-100%)
      const dur = 2 + Math.random() * 2;   // Duración de vida (2-4 seg)
      const size = 0.8 + Math.random() * 0.8;  // Tamaño (0.8-1.6rem)
      p.style.cssText = `
        position:absolute;
        left:${x}%;
        bottom:-10%;
        font-size:${size}rem;
        opacity:0.6;
        animation:subirParticula ${dur}s ease-out forwards;
        pointer-events:none;
      `;
      contenedor.appendChild(p);
      // Auto-eliminar al terminar la animación
      setTimeout(() => p.remove(), dur * 1000);
    }
  }, cfg.intervalo);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  3. ANIMACIONES DEL VILLANO                                    ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Cuatro animaciones principales:                              ║
   ║  1. Entrada:  El villano entra desde la derecha con bounce    ║
   ║  2. Ataque:   El villano "golpea" cuando el jugador falla     ║
   ║  3. Daño:     Flash + estrellas cuando recibe daño             ║
   ║  4. Muerte:   Temblor → encogimiento → explosión → desaparece ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * animacionEntradaEnemigo(idNivel):
 *   El villano aparece desde fuera de la pantalla (110%) y
 *   se desliza hasta su posición (62%) con efecto de rebote.
 *   Al llegar, emite un "rugido" visual.
 */
function animacionEntradaEnemigo(idNivel) {
  const contenedor = document.getElementById('contenedorEnemigo');
  const sprite = document.getElementById('spriteEnemigo');
  if (!contenedor || !sprite) return;

  const cfg = FONDOS_ARENA[idNivel] || FONDOS_ARENA[1];

  // Posicionar fuera de la pantalla (invisible)
  contenedor.style.transition = 'none';
  contenedor.style.left = '110%';
  contenedor.style.opacity = '0';

  // Aplicar color de brillo según el nivel
  const interior = document.getElementById('interiorEnemigo');
  if (interior) {
    interior.style.filter = `drop-shadow(0 0 20px ${cfg.acento}) drop-shadow(0 0 40px ${cfg.acento}88)`;
  }

  // Deslizar hacia la posición final con animación elástica (bounce)
  setTimeout(() => {
    contenedor.style.transition = 'left 1.2s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.5s';
    contenedor.style.left = '62%';
    contenedor.style.opacity = '1';
  }, 100);

  // Efecto de rugido al completar la entrada
  setTimeout(() => {
    efectoRugidoEnemigo();
  }, 1300);
}

/**
 * efectoRugidoEnemigo():
 *   Efecto visual de "rugido": emoji 😡 expandiéndose +
 *   ondas de choque circulares que se expanden y desvanecen.
 */
function efectoRugidoEnemigo() {
  const capa = document.getElementById('capaEfectos');
  if (!capa) return;

  // Emoji de rugido que crece y desaparece
  const rugido = document.createElement('div');
  rugido.textContent = '😡';
  rugido.style.cssText = `
    position:absolute;
    left:55%;top:10%;
    font-size:2.5rem;
    animation:animRugido 0.8s forwards;
    pointer-events:none;
    z-index:15;
  `;
  capa.appendChild(rugido);
  setTimeout(() => rugido.remove(), 800);

  // 3 ondas de choque concéntricas
  for (let i = 0; i < 3; i++) {
    const onda = document.createElement('div');
    onda.style.cssText = `
      position:absolute;
      left:62%;top:30%;
      width:20px;height:20px;
      border-radius:50%;
      border:3px solid rgba(255,100,0,0.8);
      animation:ondaChoque ${0.6 + i*0.2}s ${i*0.15}s ease-out forwards;
      pointer-events:none;
      transform:translate(-50%,-50%);
    `;
    capa.appendChild(onda);
    setTimeout(() => onda.remove(), 1200);
  }
}

/**
 * animacionAtaqueEnemigo():
 *   Se ejecuta cuando el jugador falla. El villano:
 *   1. Lanza un emoji 💢 que vuela hacia el héroe
 *   2. El sprite del villano salta hacia adelante brevemente
 */
function animacionAtaqueEnemigo() {
  const interior = document.getElementById('interiorEnemigo');
  const contenedor = document.getElementById('contenedorEnemigo');
  if (!interior || !contenedor) return;

  // Proyectil de ataque (emoji 💢)
  const ataque = document.createElement('div');
  ataque.textContent = '💢';
  ataque.style.cssText = `
    position:absolute;
    font-size:2rem;
    left:62%;top:35%;
    animation:ataqueVillano 0.7s forwards;
    pointer-events:none;
    z-index:15;
  `;
  const capa = document.getElementById('capaEfectos');
  if (capa) {
    capa.appendChild(ataque);
    setTimeout(() => ataque.remove(), 700);
  }

  // El villano salta hacia el héroe (scale + translateX)
  interior.style.transition = 'transform 0.15s';
  interior.style.transform = 'scale(1.3) translateX(-15px)';
  setTimeout(() => {
    interior.style.transform = '';  // Volver a la posición original
    setTimeout(() => { interior.style.transition = ''; }, 200);
  }, 150);
}

/**
 * animacionDañoEnemigo(idNivel):
 *   Se ejecuta cuando el jugador acierta. El villano:
 *   1. Hace flash blanco intenso (brightness)
 *   2. Se encoge y rota brevemente
 *   3. Estrellas ⭐💥✨ aparecen alrededor
 */
function animacionDañoEnemigo(idNivel) {
  const interior = document.getElementById('interiorEnemigo');
  if (!interior) return;

  // Fase 1: Flash blanco (brightness máximo, desaturar)
  interior.style.animation = 'none';
  interior.style.filter = 'brightness(5) saturate(0)';
  interior.style.transform = 'scale(0.85) rotate(5deg)';

  // Fase 2: Volver al color del nivel con sombra de acento
  setTimeout(() => {
    const cfg = FONDOS_ARENA[idNivel] || FONDOS_ARENA[1];
    interior.style.filter = `drop-shadow(0 0 20px ${cfg.acento})`;
    interior.style.transform = '';
    // Fase 3: Restaurar estado normal
    setTimeout(() => {
      interior.style.animation = '';
      interior.style.filter = `drop-shadow(0 0 12px rgba(255,0,0,.6))`;
    }, 200);
  }, 120);

  // Estrellas de impacto alrededor del villano
  const capa = document.getElementById('capaEfectos');
  if (!capa) return;
  ['⭐','💥','✨'].forEach((emoji, i) => {
    const estrella = document.createElement('div');
    estrella.textContent = emoji;
    const angulo = (i / 3) * 360;  // Distribuir en círculo (0°, 120°, 240°)
    estrella.style.cssText = `
      position:absolute;
      left:${65 + Math.cos(angulo * Math.PI/180) * 8}%;
      top:${30 + Math.sin(angulo * Math.PI/180) * 10}%;
      font-size:1.4rem;
      animation:animEstrellaGolpe 0.6s ${i*0.1}s forwards;
      pointer-events:none;
    `;
    capa.appendChild(estrella);
    setTimeout(() => estrella.remove(), 800);
  });
}

/**
 * animacionMuerteEnemigo(callback):
 *   Se ejecuta cuando la vida del enemigo llega a 0.
 *   Secuencia: temblor → flash blanco → encogimiento → explosión de emojis
 *   Ejecuta callback() al terminar (normalmente: finalizarSubnivel(true))
 */
function animacionMuerteEnemigo(callback) {
  const contenedor = document.getElementById('contenedorEnemigo');
  const interior = document.getElementById('interiorEnemigo');
  if (!contenedor || !interior) { if (callback) callback(); return; }

  // Animación CSS: temblor → encoge → rota → desaparece
  contenedor.style.animation = 'morirEnemigo 1.2s forwards';
  interior.style.filter = 'brightness(8) saturate(0)';  // Flash blanco total

  // Explosión de emojis alrededor
  const capa = document.getElementById('capaEfectos');
  if (capa) {
    const emojis = ['💥','⭐','✨','🌟','💫','🔥'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `
        position:absolute;
        left:${55 + Math.random()*20}%;
        top:${10 + Math.random()*40}%;
        font-size:${1.5 + Math.random()}rem;
        animation:explotarParticula 0.8s ${i*0.08}s forwards;
        pointer-events:none;
      `;
      capa.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  // Ejecutar callback después de que termine la animación
  setTimeout(() => { if (callback) callback(); }, 1200);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  4. CSS DINÁMICO PARA ANIMACIONES                              ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Inyecta una etiqueta <style> con los @keyframes necesarios   ║
   ║  para las animaciones que no están en estilos.css.            ║
   ║  Se inyecta solo una vez al inicio del juego.                 ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function inyectarEstilosAnimacion() {
  // Evitar inyectar duplicados
  if (document.getElementById('estilos-animacion')) return;

  const estilo = document.createElement('style');
  estilo.id = 'estilos-animacion';
  estilo.textContent = `

    /* ── Partícula que sube desde abajo ── */
    /* Usada por: iniciarParticulas() */
    @keyframes subirParticula {
      0%   { opacity:0.7; transform:translateY(0) rotate(0deg) scale(1); }
      100% { opacity:0;   transform:translateY(-120px) rotate(30deg) scale(0.5); }
    }

    /* ── Onda de choque del rugido ── */
    /* Usada por: efectoRugidoEnemigo() */
    @keyframes ondaChoque {
      0%   { width:20px; height:20px; opacity:0.9; }
      100% { width:120px; height:120px; opacity:0; transform:translate(-50%,-50%); }
    }

    /* ── Proyectil de ataque del villano ── */
    /* Usada por: animacionAtaqueEnemigo() */
    @keyframes ataqueVillano {
      0%   { opacity:1; transform:translate(0,0) scale(1); }
      50%  { opacity:1; transform:translate(-60px, 10px) scale(1.4); }
      100% { opacity:0; transform:translate(-80px, 20px) scale(0.8); }
    }

    /* ── Estrella de impacto al golpear al villano ── */
    /* Usada por: animacionDañoEnemigo() */
    @keyframes animEstrellaGolpe {
      0%   { opacity:1; transform:scale(0.5); }
      50%  { opacity:1; transform:scale(1.5); }
      100% { opacity:0; transform:scale(0.5) translateY(-30px); }
    }

    /* ── Animación de muerte del villano ── */
    /* Usada por: animacionMuerteEnemigo() */
    @keyframes morirEnemigo {
      0%   { transform:scale(1) rotate(0deg); opacity:1; }
      30%  { transform:scale(1.2) rotate(-10deg); }       /* Se agranda */
      60%  { transform:scale(0.8) rotate(15deg); }        /* Se encoge */
      100% { transform:scale(0) rotate(45deg); opacity:0; } /* Desaparece */
    }

    /* ── Partícula de explosión al morir ── */
    /* Usada por: animacionMuerteEnemigo() */
    @keyframes explotarParticula {
      0%   { opacity:1; transform:scale(0.5) translate(0,0); }
      100% { opacity:0; transform:scale(1.5) translate(
        ${Math.random()>0.5?'':'-'}${20+Math.floor(Math.random()*30)}px,
        -${20+Math.floor(Math.random()*40)}px
      ); }
    }

    /* ── Rugido del villano al entrar ── */
    /* Usada por: efectoRugidoEnemigo() */
    @keyframes animRugido {
      0%   { opacity:1; transform:scale(0.5); }
      50%  { opacity:1; transform:scale(1.5); }
      100% { opacity:0; transform:scale(2); }
    }

    /* ── Contenedor del aliado con animación de entrada ── */
    /* Usada por: invocarAliado() en juego.js */
    .aliado-con-burbuja {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: entradaAliado 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    }

    /* ── Burbuja de texto del aliado ── */
    /* Muestra la frase de ánimo sobre la imagen del aliado */
    .burbuja-aliado {
      position: absolute;
      bottom: calc(100% + 6px);      /* Justo encima del aliado */
      left: 50%;
      transform: translateX(-50%);   /* Centrada horizontalmente */
      background: rgba(0,0,0,0.85);
      color: #ffd700;                /* Texto dorado */
      font-family: 'Fredoka One', cursive;
      font-size: clamp(0.6rem, 2vw, 0.82rem);
      padding: 4px 10px;
      border-radius: 12px;
      border: 1.5px solid #ffd70066;
      white-space: nowrap;
      opacity: 0;                    /* Inicia oculta, se muestra con JS */
      transition: opacity 0.3s;
      pointer-events: none;
      backdrop-filter: blur(4px);
      z-index: 10;
    }

    /* Flecha triangular debajo de la burbuja (apunta al aliado) */
    .burbuja-aliado::after {
      content: '';
      position: absolute;
      top: 100%; left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(0,0,0,0.85);
    }

    /* Animación de entrada del aliado (escala desde 0) */
    @keyframes entradaAliado {
      0%   { opacity:0; transform:scale(0) translateY(20px); }
      100% { opacity:1; transform:scale(1) translateY(0); }
    }

    /* Transiciones suaves para el sprite del enemigo */
    .interior-enemigo {
      transition: filter 0.3s, transform 0.15s;
    }
  `;
  document.head.appendChild(estilo);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  5. INICIALIZACIÓN                                            ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Inyecta los estilos de animación al cargar la página.        ║
   ║  Se ejecuta automáticamente sin necesidad de ser llamada.     ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function iniciarAnimaciones() {
  inyectarEstilosAnimacion();
}

// Auto-inicializar: si el DOM ya cargó, ejecutar inmediatamente;
// si no, esperar al evento DOMContentLoaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarAnimaciones);
} else {
  iniciarAnimaciones();
}
