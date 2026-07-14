/* ============================================================
   MATHHERO – juego.js
   ============================================================
   Juego educativo matemático de batalla por turnos.
   El jugador responde preguntas de matemáticas para atacar al
   jefe enemigo. Si acierta, el enemigo pierde vida; si falla,
   el jugador pierde vida. Gana quien sobreviva.

   ESTRUCTURA DEL ARCHIVO:
   ─────────────────────────────────────────
   1.  CONFIGURACIÓN MODIFICABLE  ← Propiedades que puedes cambiar
   2.  DATOS DE NIVELES           ← Los 6 niveles con sus subniveles
   3.  ESTADO DEL JUEGO           ← Variables que controlan la partida
   4.  TEMPORIZADOR               ← Cuenta regresiva por pregunta
   5.  HELPERS DOM                ← Funciones para manipular la interfaz
   6.  AUDIO / SONIDO             ← Efectos de sonido y música de fondo
   7.  GENERADOR DE PREGUNTAS     ← Crea preguntas aleatorias según el tipo
   8.  PANTALLA DE NIVELES        ← Construye la cuadrícula de selección
   9.  INICIO DE SUBNIVEL         ← Prepara y lanza una partida
   10. SISTEMA DE CÓMIC           ← Muestra viñetas antes de ciertos niveles
   11. ARENA DE BATALLA           ← Configura la zona visual de combate
   12. CARGA DE PREGUNTAS         ← Muestra cada pregunta en pantalla
   13. LÓGICA ACIERTO/FALLO       ← Qué pasa al acertar o fallar
   14. INTERFAZ (HUD)             ← Actualiza barras de vida y puntos
   15. EFECTOS VISUALES           ← Rayos, ataques especiales, aliados
   16. FIN DE SUBNIVEL            ← Victoria, derrota, desbloqueo
   17. PAUSA / SALIR              ← Pausar, reanudar y salir del juego
   18. CONFETTI                   ← Partículas de celebración
   19. INICIALIZACIÓN             ← Código que se ejecuta al cargar la página
   20. TECLADO                    ← Atajos de teclado (1-4, Escape)
   ============================================================ */

'use strict';

/* ╔═══════════════════════════════════════════════════════════════╗
   ║  1. CONFIGURACIÓN MODIFICABLE                                ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Cambia estos valores para ajustar la dificultad, velocidad  ║
   ║  y balance del juego sin tocar el resto del código.           ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * PREGUNTAS_POR_SUBNIVEL (número):
 *   Cantidad de preguntas que se hacen en cada subnivel normal.
 *   Más preguntas = partida más larga.
 *   Valor por defecto: 10
 */
const PREGUNTAS_POR_SUBNIVEL = 10;

/**
 * DAÑO_ENEMIGO_POR_ERROR (número):
 *   Vida que pierde el JUGADOR cuando responde INCORRECTAMENTE.
 *   Con vida inicial de 100, a 20 de daño aguantas 5 errores.
 *   Subir este valor hace el juego más difícil.
 *   Valor por defecto: 20
 */
const DAÑO_ENEMIGO_POR_ERROR = 20;

/**
 * DAÑO_JUGADOR_POR_ACIERTO (número):
 *   Vida que pierde el ENEMIGO cuando el jugador ACIERTA.
 *   Con vida de 100, a 20 de daño necesitas 5 aciertos para ganar.
 *   Bajar este valor hace el juego más largo.
 *   Valor por defecto: 20
 */
const DAÑO_JUGADOR_POR_ACIERTO = 20;

/**
 * SEGUNDOS_TEMPORIZADOR (número):
 *   Tiempo en segundos que tiene el jugador para responder cada pregunta.
 *   Si llega a 0 sin responder, cuenta como respuesta incorrecta.
 *   Valor por defecto: 15
 */
const SEGUNDOS_TEMPORIZADOR = 15;

/**
 * COLORES_CONFETI (array de colores hex):
 *   Colores aleatorios de las partículas de confeti en la pantalla de victoria.
 */
const COLORES_CONFETI = ['#ffd700', '#ff6d00', '#00e676', '#2196f3', '#e91e63', '#9c27b0', '#fff'];

/**
 * ESPECIALES / OBJETOS (arrays de emojis):
 *   Emojis que aparecen como efectos visuales durante ataques especiales.
 *   Puedes agregar o quitar emojis a tu gusto.
 */
const ESPECIALES = ['🌟', '💥', '⚡', '🔥', '🚀', '💫', '🎆', '🎇', '🏹', '⭐'];
const OBJETOS    = ['🗡️', '🔱', '🔮', '🪄', '💎', '🍄', '🌀', '🌊', '☄️', '🎮'];


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  2. DATOS DE NIVELES                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Array con los 6 niveles del juego. Cada nivel contiene:     ║
   ║  - id:          Número identificador (1-6)                   ║
   ║  - nombre:      Texto que se muestra en la tarjeta           ║
   ║  - emoji:       Icono del tipo de operación                  ║
   ║  - nombreJefe:  Nombre del villano de ese nivel              ║
   ║  - emojiJefe:   Emoji del villano (respaldo si falta imagen) ║
   ║  - color:       Color temático del nivel                     ║
   ║  - subniveles:  Array con 3 dificultades (fácil/medio/difíc) ║
   ║                                                               ║
   ║  Cada SUBNIVEL contiene:                                     ║
   ║  - id:       Identificador "nivel-subnivel" (ej: "1-2")     ║
   ║  - nombre:   Nombre de la dificultad                         ║
   ║  - tipo:     Tipo de operación (suma/resta/multi/divi/mixto) ║
   ║  - max:      Rango máximo de los números en las preguntas    ║
   ║  - imgJefe:  Ruta a la imagen del jefe para ese subnivel     ║
   ╚═══════════════════════════════════════════════════════════════╝ */
const NIVELES = [
  {
    id: 1, nombre: 'Sumas', emoji: '➕',
    nombreJefe: 'Monstruo Rojo', emojiJefe: '👹',
    color: '#ff6d00',
    subniveles: [
      { id: '1-1', nombre: 'Fácil',   tipo: 'suma', max: 10, imgJefe: 'assets/nivel1/boss_1_1.png' },
      { id: '1-2', nombre: 'Medio',   tipo: 'suma', max: 20, imgJefe: 'assets/nivel1/boss_1_2.png' },
      { id: '1-3', nombre: 'Difícil', tipo: 'suma', max: 50, imgJefe: 'assets/nivel1/boss_1_3.png' }
    ]
  },
  {
    id: 2, nombre: 'Restas', emoji: '➖',
    nombreJefe: 'Dragón', emojiJefe: '🐉',
    color: '#2196f3',
    subniveles: [
      { id: '2-1', nombre: 'Fácil',   tipo: 'resta', max: 10, imgJefe: 'assets/nivel2/boss_2_1.png' },
      { id: '2-2', nombre: 'Medio',   tipo: 'resta', max: 20, imgJefe: 'assets/nivel2/boss_2_2.png' },
      { id: '2-3', nombre: 'Difícil', tipo: 'resta', max: 50, imgJefe: 'assets/nivel2/boss_2_3.png' }
    ]
  },
  {
    id: 3, nombre: 'Multiplicaciones', emoji: '✖️',
    nombreJefe: 'Alien', emojiJefe: '👾',
    color: '#4caf50',
    subniveles: [
      { id: '3-1', nombre: 'Fácil',   tipo: 'multi', max: 3, imgJefe: 'assets/nivel3/boss_3_1.png' },
      { id: '3-2', nombre: 'Medio',   tipo: 'multi', max: 5, imgJefe: 'assets/nivel3/boss_3_2.png' },
      { id: '3-3', nombre: 'Difícil', tipo: 'multi', max: 9, imgJefe: 'assets/nivel3/boss_3_3.png' }
    ]
  },
  {
    id: 4, nombre: 'Divisiones', emoji: '➗',
    nombreJefe: 'Esqueleto', emojiJefe: '💀',
    color: '#9c27b0',
    subniveles: [
      { id: '4-1', nombre: 'Fácil',   tipo: 'divi', max: 3, imgJefe: 'assets/nivel4/boss_4_1.png' },
      { id: '4-2', nombre: 'Medio',   tipo: 'divi', max: 5, imgJefe: 'assets/nivel4/boss_4_2.png' },
      { id: '4-3', nombre: 'Difícil', tipo: 'divi', max: 9, imgJefe: 'assets/nivel4/boss_4_3.png' }
    ]
  },
  {
    id: 5, nombre: 'Combinado', emoji: '🌟',
    nombreJefe: '¡Jefe Final!', emojiJefe: '🤖',
    color: '#ffd700',
    subniveles: [
      { id: '5-1', nombre: 'Nivel A', tipo: 'mixto', max: 20, imgJefe: 'assets/nivel5/boss_5_1.png' },
      { id: '5-2', nombre: 'Nivel B', tipo: 'mixto', max: 30, imgJefe: 'assets/nivel5/boss_5_2.png' },
      { id: '5-3', nombre: 'Nivel C', tipo: 'mixto', max: 50, imgJefe: 'assets/nivel5/boss_5_3.png' }
    ]
  },
  {
    id: 6, nombre: '¡Maestro!', emoji: '💠',
    nombreJefe: '⚠️ MathLord', emojiJefe: '🔮',
    color: '#ff1744',
    esJefeFinal: true,   // Marca este nivel como el jefe final del juego
    subniveles: [
      {
        id: '6-1', nombre: 'Desafío', tipo: 'parentesis', max: 99,
        imgJefe: 'assets/nivel6/boss_6_1.png',
        temporizadorEspecial: 30,   // Este subnivel tiene 30 seg en vez de 15
        preguntasParaGanar: 5,      // Necesita 5 aciertos para ganar
        maxPreguntas: 10            // Máximo 10 preguntas (5 errores = derrota)
      }
    ]
  }
];

/**
 * ALIADOS: Imágenes de los personajes aliados que aparecen al acertar.
 * Cada aliado tiene frases de ánimo definidas más abajo en FRASES_ALIADOS.
 */
const ALIADOS = [
  'assets/aliados/aliado1_gato.png',
  'assets/aliados/aliado2_mago.png',
  'assets/aliados/aliado3_tech.png'
];


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  3. ESTADO DEL JUEGO                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Objeto mutable que almacena TODO el estado de la partida    ║
   ║  actual. Se resetea al iniciar cada subnivel.                 ║
   ╚═══════════════════════════════════════════════════════════════╝ */
let estado = {
  indiceNivelActual:      0,     // Índice en el array NIVELES (0-5)
  indiceSubnivelActual:   0,     // Índice del subnivel dentro del nivel (0-2)
  vidaJugador:            100,   // Puntos de vida del héroe (0 = derrota)
  vidaEnemigo:            100,   // Puntos de vida del jefe (0 = victoria)
  puntuacion:             0,     // Puntos acumulados en el subnivel
  racha:                  0,     // Aciertos consecutivos actuales
  mejorRacha:             0,     // Mayor racha alcanzada en el subnivel
  contadorAciertos:       0,     // Total de respuestas correctas
  indicePregunta:         0,     // Pregunta actual (0-indexed)
  preguntas:              [],    // Array de preguntas generadas para el subnivel
  respondiendo:           false, // true mientras se procesa una respuesta (evita doble clic)
  pausado:                false, // true cuando el juego está en pausa
  sonidoActivo:           true,  // true = sonido habilitado, false = mudo
  progreso:               {},    // Registro de subniveles completados { "1-1": { completado: true } }
  nivelDesbloqueado:      1,     // Mayor nivel desbloqueado (1-6)
  subnivelDesbloqueado:   { 1:1, 2:1, 3:1, 4:1, 5:1 },  // Subnivel desbloqueado por nivel
  juegoActivo:            false, // BUGFIX: indica si hay una partida en curso
  intervaloTemporizador:  null,  // Referencia al setInterval del timer
  segundosTemporizador:   15,    // Segundos restantes del timer actual
  maxTemporizador:        15     // Máximo de segundos (para calcular el % de la barra)
};


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  4. TEMPORIZADOR DE PREGUNTA                                  ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Cuenta regresiva visual que se activa con cada pregunta.     ║
   ║  Si llega a 0, cuenta como respuesta incorrecta.              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * iniciarTemporizador():
 *   Inicia la cuenta regresiva para la pregunta actual.
 *   Usa el valor de temporizadorEspecial del subnivel si existe,
 *   o SEGUNDOS_TEMPORIZADOR como valor por defecto.
 */
function iniciarTemporizador() {
  detenerTemporizador();  // Limpiar cualquier timer anterior
  const nvl = NIVELES[estado.indiceNivelActual];
  const sn  = nvl.subniveles[estado.indiceSubnivelActual];
  const segundos = sn.temporizadorEspecial || SEGUNDOS_TEMPORIZADOR;
  estado.segundosTemporizador = segundos;
  estado.maxTemporizador = segundos;
  actualizarUITemporizador(segundos);

  // Cada segundo: decrementar y actualizar la barra visual
  estado.intervaloTemporizador = setInterval(() => {
    if (estado.pausado || estado.respondiendo) return;  // No contar si está pausado
    estado.segundosTemporizador--;
    actualizarUITemporizador(estado.segundosTemporizador);
    if (estado.segundosTemporizador <= 0) {
      detenerTemporizador();
      alAgotarseTiempo();  // Tratar como respuesta incorrecta
    }
  }, 1000);
}

/**
 * detenerTemporizador():
 *   Detiene el intervalo del timer. Se llama al responder,
 *   al pausar, al salir del juego o al terminar el subnivel.
 */
function detenerTemporizador() {
  if (estado.intervaloTemporizador) {
    clearInterval(estado.intervaloTemporizador);
    estado.intervaloTemporizador = null;
  }
}

/**
 * actualizarUITemporizador(segundos):
 *   Actualiza la barra visual y el texto del temporizador.
 *   Cuando quedan pocos segundos, cambia a color rojo (clase 'advertencia').
 */
function actualizarUITemporizador(segundos) {
  const barra = document.getElementById('barraReloj');
  const texto = document.getElementById('textoReloj');
  if (!barra || !texto) return;

  // Calcular porcentaje restante para el ancho de la barra
  const maxSeg = estado.maxTemporizador || SEGUNDOS_TEMPORIZADOR;
  const pct = (segundos / maxSeg) * 100;
  barra.style.width = pct + '%';

  // Umbral de advertencia: 5 seg si max≤15, 10 seg si max>15
  const umbral = maxSeg <= 15 ? 5 : 10;
  if (segundos <= umbral) {
    barra.classList.add('advertencia');   // Barra roja parpadeante
    texto.classList.add('urgente');       // Texto rojo más grande
  } else {
    barra.classList.remove('advertencia');
    texto.classList.remove('urgente');
  }
  texto.textContent = '⏱ ' + segundos;
}

/**
 * alAgotarseTiempo():
 *   Se ejecuta cuando el temporizador llega a 0.
 *   Muestra la respuesta correcta, penaliza al jugador y avanza.
 */
function alAgotarseTiempo() {
  if (estado.respondiendo || estado.pausado || !estado.juegoActivo) return;
  estado.respondiendo = true;

  // Deshabilitar todos los botones de respuesta
  document.querySelectorAll('.btn-respuesta').forEach(b => b.disabled = true);

  // Resaltar la respuesta correcta en verde
  const q = estado.preguntas[estado.indicePregunta];
  document.querySelectorAll('.btn-respuesta').forEach(b => {
    if (parseInt(b.textContent) === q.respuesta) b.classList.add('correcto');
  });

  mostrarMensaje('⏰ ¡TIEMPO AGOTADO!', 1200);
  alFallar();  // Aplicar penalización

  // Después de 1.4 seg, avanzar a la siguiente pregunta
  setTimeout(() => {
    if (!estado.juegoActivo) return;  // BUGFIX: no avanzar si ya salió del juego
    estado.indicePregunta++;
    cargarPregunta();
  }, 1400);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  5. HELPERS DOM                                               ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Funciones de utilidad para manipular elementos del DOM.      ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Atajo para document.getElementById */
const $ = id => document.getElementById(id);

/**
 * mostrarPantalla(nombre):
 *   Cambia la pantalla visible. Oculta todas las pantallas y activa
 *   solo la que coincide con el nombre dado.
 *   Nombres válidos: 'bienvenida', 'niveles', 'juego', 'victoria', 'derrota'
 */
function mostrarPantalla(nombre) {
  document.querySelectorAll('.pantalla').forEach(s => s.classList.remove('activa'));
  const destino = $(`pantalla-${nombre}`);
  if (destino) destino.classList.add('activa');
  if (nombre === 'niveles') construirPantallaNiveles();  // Reconstruir la cuadrícula
  if (nombre === 'bienvenida') reproducirMusica('bienvenida');
}

/**
 * mostrarMensaje(texto, duracion):
 *   Muestra un mensaje emergente temporal sobre toda la pantalla.
 *   Se usa para: "¡RACHA DE 3!", "¡ATAQUE ESPECIAL!", etc.
 */
function mostrarMensaje(texto, duracion = 1500) {
  const ov = $('superposicion-mensaje');
  $('cajaMensaje').innerHTML = texto;
  ov.classList.remove('oculto');
  setTimeout(() => ov.classList.add('oculto'), duracion);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  6. AUDIO / SONIDO                                            ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Sistema de audio con dos capas:                              ║
   ║  - Efectos de sonido: generados con Web Audio API (tonos)    ║
   ║  - Música de fondo: archivos MP3 por nivel con loop suave    ║
   ╚═══════════════════════════════════════════════════════════════╝ */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let contextoAudio = null;  // Se inicializa al primer uso (requiere interacción del usuario)

/** Obtiene o crea el AudioContext para generar sonidos */
function obtenerContextoAudio() {
  if (!contextoAudio) contextoAudio = new AudioCtx();
  return contextoAudio;
}

/**
 * reproducirTono(freq, type, dur, vol):
 *   Genera un tono sintetizado usando Web Audio API.
 *   - freq: Frecuencia en Hz (ej: 523 = Do5)
 *   - type: Tipo de onda ('sine', 'triangle', 'sawtooth', 'square')
 *   - dur:  Duración en segundos
 *   - vol:  Volumen (0.0 a 1.0)
 */
function reproducirTono(freq, type = 'sine', dur = 0.15, vol = 0.3) {
  if (!estado.sonidoActivo) return;
  try {
    const ctx = obtenerContextoAudio();
    const osc = ctx.createOscillator();      // Oscilador: genera la onda de sonido
    const gain = ctx.createGain();           // Nodo de ganancia: controla el volumen
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);  // Fade out
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

/** Secuencia de 3 notas ascendentes (Do-Mi-Sol) para respuesta correcta */
function sonidoCorrecto() {
  reproducirTono(523, 'triangle', 0.1);
  setTimeout(() => reproducirTono(659, 'triangle', 0.1), 100);
  setTimeout(() => reproducirTono(784, 'triangle', 0.15), 200);
}

/** 2 notas graves descendentes para respuesta incorrecta */
function sonidoIncorrecto() {
  reproducirTono(200, 'sawtooth', 0.2, 0.2);
  setTimeout(() => reproducirTono(150, 'sawtooth', 0.2, 0.2), 150);
}

/** 4 notas ascendentes triunfales para victoria */
function sonidoVictoria() {
  [523,659,784,1047].forEach((f,i) => setTimeout(() => reproducirTono(f,'triangle',0.2), i*120));
}

/** 3 notas descendentes graves para derrota */
function sonidoDerrota() {
  [400,300,200].forEach((f,i) => setTimeout(() => reproducirTono(f,'sawtooth',0.25,0.2), i*150));
}

/** Alterna sonido ON/OFF y actualiza el ícono del botón */
function alternarSonido() {
  estado.sonidoActivo = !estado.sonidoActivo;
  $('btnSonido').textContent = estado.sonidoActivo ? '🔊' : '🔇';
  if (!estado.sonidoActivo) {
    pausarMusica();
  } else {
    reanudarMusica();
  }
}

/* ── MÚSICA DE FONDO POR NIVEL ── */

/**
 * PISTAS_MUSICA: Mapeo de clave → ruta del archivo MP3.
 * Cada nivel tiene su propia pista musical.
 */
const PISTAS_MUSICA = {
  bienvenida: 'audio/audio_inicio.mp3',
  1: 'assets/nivel1/audio_nivel1.mp3',
  2: 'assets/nivel2/audio_nivel2.mp3',
  3: 'assets/nivel3/audio_nivel3.mp3',
  4: 'assets/nivel4/audio_nivel4.mp3',
  5: 'assets/nivel5/audio_nivel5.mp3',
  6: 'assets/nivel6/audio_nivel6.mp3'
};

let elementoMusica = null;   // Elemento <audio> para la música de fondo
let pistaActual = null;      // Clave de la pista que suena actualmente

/**
 * reproducirMusica(clave):
 *   Reproduce la pista de música asociada a la clave dada.
 *   Si la misma pista ya está sonando, no hace nada.
 */
function reproducirMusica(clave) {
  if (!estado.sonidoActivo) { pistaActual = clave; return; }
  const src = PISTAS_MUSICA[clave];
  if (!src) return;
  if (pistaActual === clave && elementoMusica && !elementoMusica.paused) return;

  // Crear el elemento <audio> solo la primera vez
  if (!elementoMusica) {
    elementoMusica = document.createElement('audio');
    elementoMusica.loop = true;        // Repetir indefinidamente
    elementoMusica.volume = 0.35;      // Volumen al 35%
    document.body.appendChild(elementoMusica);
    adjuntarLoopSuave(elementoMusica); // Suavizar el corte al repetir
  }
  if (elementoMusica.src.indexOf(src) === -1) {
    elementoMusica.src = src;
  }
  pistaActual = clave;
  elementoMusica.play().catch(() => {
    // El navegador bloquea autoplay; reintenta al primer clic del usuario
    document.addEventListener('click', () => elementoMusica.play().catch(()=>{}), { once: true });
  });
}

/**
 * adjuntarLoopSuave(audioEl):
 *   Aplica un fade-out justo antes de que la pista termine y un
 *   fade-in cuando reinicia, para evitar el "corte" brusco del loop.
 */
function adjuntarLoopSuave(audioEl) {
  const FADE_MS = 350;  // Duración del desvanecimiento en milisegundos
  let desvaneciendo = false;

  // Detectar cuando faltan pocos milisegundos para el final
  audioEl.addEventListener('timeupdate', () => {
    if (desvaneciendo || !audioEl.duration) return;
    const restante = audioEl.duration - audioEl.currentTime;
    if (restante <= FADE_MS / 1000 && restante > 0) {
      desvaneciendo = true;
      const volBase = audioEl.dataset.volBase ? parseFloat(audioEl.dataset.volBase) : audioEl.volume;
      audioEl.dataset.volBase = volBase;
      const pasos = 8;
      let i = 0;
      const fadeOut = setInterval(() => {
        i++;
        audioEl.volume = Math.max(0, volBase * (1 - i / pasos));
        if (i >= pasos) clearInterval(fadeOut);
      }, FADE_MS / pasos);
    }
  });

  // Subir el volumen gradualmente al reiniciar el loop
  audioEl.addEventListener('seeked', () => {
    if (audioEl.currentTime < 0.2 && desvaneciendo) {
      const volBase = parseFloat(audioEl.dataset.volBase || audioEl.volume);
      const pasos = 8;
      let i = 0;
      const fadeIn = setInterval(() => {
        i++;
        audioEl.volume = Math.min(volBase, volBase * (i / pasos));
        if (i >= pasos) { clearInterval(fadeIn); desvaneciendo = false; }
      }, 350 / pasos);
    }
  });
}

/** Pausa la música de fondo */
function pausarMusica() {
  if (elementoMusica) elementoMusica.pause();
}

/** Reanuda la música de fondo */
function reanudarMusica() {
  if (elementoMusica && pistaActual) elementoMusica.play().catch(() => {});
}

/**
 * desvanecerMusica(duracion):
 *   Baja el volumen gradualmente y luego pausa la música.
 *   Se usa al terminar un subnivel para una transición suave.
 */
function desvanecerMusica(duracion = 600) {
  if (!elementoMusica) return;
  const volInicial = elementoMusica.volume;
  const pasos = 12;
  const tiempoPaso = duracion / pasos;
  let i = 0;
  const fade = setInterval(() => {
    i++;
    elementoMusica.volume = Math.max(0, volInicial * (1 - i / pasos));
    if (i >= pasos) {
      clearInterval(fade);
      elementoMusica.pause();
      elementoMusica.volume = volInicial;  // Restaurar volumen para la próxima vez
    }
  }, tiempoPaso);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  7. GENERADOR DE PREGUNTAS                                    ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Genera preguntas aleatorias según el tipo de operación       ║
   ║  y el rango máximo de números del subnivel.                   ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Genera dos números aleatorios entre 1 y max */
function elegirDos(max) {
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  return [a, b];
}

/**
 * generarPregunta(tipo, max):
 *   Crea una pregunta aleatoria con texto, respuesta correcta
 *   y 4 opciones (1 correcta + 3 distractores cercanos).
 *
 *   Tipos soportados: 'suma', 'resta', 'multi', 'divi', 'mixto', 'parentesis'
 */
function generarPregunta(tipo, max) {
  let respuesta, texto;

  // Si es mixto, elige un tipo aleatorio entre los 4 básicos
  const ops = tipo === 'mixto' ? ['suma', 'resta', 'multi', 'divi'] : [tipo];
  const op  = ops[Math.floor(Math.random() * ops.length)];

  // El tipo 'parentesis' tiene su propio generador especial
  if (tipo === 'parentesis') {
    return generarPreguntaParentesis();
  }

  switch (op) {
    case 'suma': {
      const [a, b] = elegirDos(max);
      respuesta = a + b;
      texto = `${a} + ${b} = ?`;
      break;
    }
    case 'resta': {
      const [a, b] = elegirDos(max);
      const grande = Math.max(a, b), pequeño = Math.min(a, b);
      respuesta = grande - pequeño;
      texto = `${grande} − ${pequeño} = ?`;
      break;
    }
    case 'multi': {
      const [a, b] = elegirDos(max);
      respuesta = a * b;
      texto = `${a} × ${b} = ?`;
      break;
    }
    case 'divi': {
      // Para divisiones exactas: primero genera b y respuesta, luego calcula a = b × resp
      const b = Math.floor(Math.random() * max) + 1;
      const resp0 = Math.floor(Math.random() * max) + 1;
      const a = b * resp0;
      respuesta = resp0;
      texto = `${a} ÷ ${b} = ?`;
      break;
    }
  }

  // Generar 3 distractores (respuestas incorrectas cercanas a la correcta)
  const distractores = new Set();
  while (distractores.size < 3) {
    let d = respuesta + (Math.floor(Math.random() * 7) - 3);  // ±3 del valor real
    if (d < 0) d = 0;
    if (d !== respuesta) distractores.add(d);
  }
  const opciones = mezclar([respuesta, ...distractores]);
  return { texto, respuesta, opciones };
}

/** Genera un número aleatorio de 2 cifras (10-99) */
function numDosDigitos() {
  return Math.floor(Math.random() * 90) + 10;
}

/**
 * generarPreguntaParentesis():
 *   Genera preguntas avanzadas con paréntesis y números de 2 cifras.
 *   Solo se usa en el nivel 6 (jefe final).
 *   Incluye 8 patrones diferentes: (a+b)×c, a×(b+c), etc.
 */
function generarPreguntaParentesis() {
  const patrones = [
    // Patrón 1: (a + b) × c
    () => { const a=numDosDigitos(),b=numDosDigitos(),c=Math.floor(Math.random()*9)+2; const ans=(a+b)*c; return { texto:`(${a} + ${b}) × ${c} = ?`, respuesta: ans }; },
    // Patrón 2: (a - b) × c  (a > b garantizado)
    () => { const b=numDosDigitos(); const a=b+Math.floor(Math.random()*20)+1; const c=Math.floor(Math.random()*9)+2; const ans=(a-b)*c; return { texto:`(${a} − ${b}) × ${c} = ?`, respuesta: ans }; },
    // Patrón 3: a × (b + c)
    () => { const a=Math.floor(Math.random()*9)+2,b=numDosDigitos(),c=numDosDigitos(); const ans=a*(b+c); return { texto:`${a} × (${b} + ${c}) = ?`, respuesta: ans }; },
    // Patrón 4: (a + b) + (c - d)
    () => { const a=numDosDigitos(),b=numDosDigitos(),d=numDosDigitos(); const c=d+Math.floor(Math.random()*30)+1; const ans=(a+b)+(c-d); return { texto:`(${a} + ${b}) + (${c} − ${d}) = ?`, respuesta: ans }; },
    // Patrón 5: (a × b) + c
    () => { const a=Math.floor(Math.random()*9)+2,b=Math.floor(Math.random()*9)+2,c=numDosDigitos(); const ans=(a*b)+c; return { texto:`(${a} × ${b}) + ${c} = ?`, respuesta: ans }; },
    // Patrón 6: (a + b) - c  (resultado positivo)
    () => { const a=numDosDigitos(),b=numDosDigitos(); const c=Math.floor(Math.random()*(a+b-10))+1; const ans=(a+b)-c; return { texto:`(${a} + ${b}) − ${c} = ?`, respuesta: ans }; },
    // Patrón 7: a + (b × c)
    () => { const a=numDosDigitos(),b=Math.floor(Math.random()*9)+2,c=Math.floor(Math.random()*9)+2; const ans=a+(b*c); return { texto:`${a} + (${b} × ${c}) = ?`, respuesta: ans }; },
    // Patrón 8: (a - b) + (c + d)
    () => { const b=numDosDigitos(); const a=b+Math.floor(Math.random()*20)+1; const c=numDosDigitos(),d=numDosDigitos(); const ans=(a-b)+(c+d); return { texto:`(${a} − ${b}) + (${c} + ${d}) = ?`, respuesta: ans }; },
  ];

  const gen = patrones[Math.floor(Math.random() * patrones.length)];
  const { texto, respuesta } = gen();

  // Distractores con mayor dispersión para números grandes
  const distractores = new Set();
  while (distractores.size < 3) {
    const dispersión = Math.max(5, Math.floor(respuesta * 0.1));
    let d = respuesta + (Math.floor(Math.random() * dispersión * 2) - dispersión);
    if (d < 0) d = Math.abs(d);
    if (d !== respuesta) distractores.add(d);
  }
  return { texto, respuesta, opciones: mezclar([respuesta, ...distractores]) };
}

/** Mezcla aleatoriamente un array (usado para desordenar las opciones) */
function mezclar(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/** Genera el array completo de preguntas para un subnivel */
function generarPreguntas(subnivel) {
  const total = subnivel.maxPreguntas || PREGUNTAS_POR_SUBNIVEL;
  const qs = [];
  for (let i = 0; i < total; i++) {
    qs.push(generarPregunta(subnivel.tipo, subnivel.max));
  }
  return qs;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  8. PANTALLA DE NIVELES                                       ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Construye dinámicamente la cuadrícula de tarjetas de nivel   ║
   ║  y el panel de subniveles al hacer clic en uno.               ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Construye la cuadrícula con las 6 tarjetas de nivel */
function construirPantallaNiveles() {
  const cuadricula = $('cuadriculaNiveles');
  cuadricula.innerHTML = '';

  // Limpiar panel de subniveles anterior si existe
  const anterior = document.querySelector('.panel-subnivel');
  if (anterior) anterior.remove();

  NIVELES.forEach((nvl, idx) => {
    const desbloqueado = nvl.id <= estado.nivelDesbloqueado;
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-nivel' + (desbloqueado ? '' : ' bloqueado');

    // Calcular estrellas ganadas (1 por subnivel completado)
    const maxEstrellas = nvl.esJefeFinal ? 1 : 3;
    const estrellas    = Math.min(obtenerEstrellasNivel(nvl.id), maxEstrellas);
    const etiquetaSub  = nvl.esJefeFinal ? '1 desafío final' : '3 subniveles';

    tarjeta.innerHTML = `
      <span class="tn-emoji">${nvl.emojiJefe}</span>
      <div class="tn-nombre">${nvl.nombre}</div>
      <div class="tn-subtitulo">${desbloqueado ? etiquetaSub : '🔒 Bloqueado'}</div>
      <div class="tn-estrellas">${'⭐'.repeat(estrellas)}${'☆'.repeat(maxEstrellas - estrellas)}</div>
    `;
    if (desbloqueado) {
      tarjeta.onclick = () => mostrarSubniveles(nvl, tarjeta);
    }
    cuadricula.appendChild(tarjeta);
  });
}

/** Cuenta cuántos subniveles de un nivel están completados */
function obtenerEstrellasNivel(idNivel) {
  let estrellas = 0;
  NIVELES.find(l => l.id === idNivel)?.subniveles.forEach(sn => {
    if (estado.progreso[sn.id]?.completado) estrellas++;
  });
  return Math.min(estrellas, 3);
}

/** Muestra el panel de subniveles al hacer clic en un nivel */
function mostrarSubniveles(nvl, tarjeta) {
  const anterior = document.querySelector('.panel-subnivel');
  if (anterior) anterior.remove();

  const panel = document.createElement('div');
  panel.className = 'panel-subnivel';
  const botones = nvl.subniveles.map((sn, idx) => {
    // Un subnivel está desbloqueado si es el primero o el anterior está completado
    const desbloqueado = idx === 0 || (estado.progreso[nvl.subniveles[idx-1].id]?.completado);
    const completado = estado.progreso[sn.id]?.completado;
    return `<button class="btn-subnivel ${completado ? 'completado' : ''} ${desbloqueado ? '' : 'bloqueado'}"
      ${desbloqueado ? `onclick="iniciarSubnivel(${nvl.id-1},${idx})"` : 'disabled'}>
      ${sn.nombre}${completado ? ' ✓' : ''}
    </button>`;
  }).join('');
  panel.innerHTML = `<div class="titulo-subnivel">${nvl.emojiJefe} ${nvl.nombre}</div>
    <div class="botones-subnivel">${botones}</div>`;

  const contenido = document.querySelector('.contenido-niveles');
  contenido.appendChild(panel);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  9. INICIO DE SUBNIVEL                                        ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Inicializa todos los valores de la partida y lanza el juego. ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Botón "¡JUGAR!" → muestra la pantalla de selección de niveles */
function iniciarJuego() {
  mostrarPantalla('niveles');
}

/**
 * iniciarSubnivel(indiceNivel, indiceSubnivel):
 *   Resetea el estado y comienza una nueva partida.
 *   Muestra cómic introductorio si el subnivel lo tiene definido.
 */
function iniciarSubnivel(indiceNivel, indiceSubnivel) {
  // Resetear todo el estado de la partida
  estado.indiceNivelActual    = indiceNivel;
  estado.indiceSubnivelActual = indiceSubnivel;
  estado.vidaJugador   = 100;
  estado.vidaEnemigo   = 100;
  estado.puntuacion    = 0;
  estado.racha         = 0;
  estado.mejorRacha    = 0;
  estado.contadorAciertos = 0;
  estado.indicePregunta = 0;
  estado.respondiendo  = false;
  estado.pausado       = false;
  estado.juegoActivo   = true;   // BUGFIX: marcar que hay partida en curso

  const nvl = NIVELES[indiceNivel];
  const sn  = nvl.subniveles[indiceSubnivel];
  estado.preguntas = generarPreguntas(sn);  // Generar preguntas aleatorias

  // Si hay cómic introductorio, mostrarlo antes de jugar
  const paginasComic = COMIC_ANTES[sn.id];
  reproducirMusica(nvl.id);
  if (paginasComic && paginasComic.length > 0) {
    mostrarSecuenciaComic(paginasComic, undefined, () => _lanzarSubnivel(nvl, sn));
  } else {
    _lanzarSubnivel(nvl, sn);
  }
}

/** Función interna que realmente inicia la partida (después del cómic) */
function _lanzarSubnivel(nvl, sn) {
  mostrarPantalla('juego');
  configurarArena(nvl, sn);
  actualizarInterfaz();
  setTimeout(() => cargarPregunta(), 1600);  // Dar tiempo a la animación de entrada
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  10. SISTEMA DE CÓMIC                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Muestra viñetas de historia antes/después de ciertos niveles.║
   ║  El jugador toca la pantalla para avanzar entre páginas.      ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Cómics que se muestran ANTES de jugar un subnivel */
const COMIC_ANTES = {
  '1-1': ['assets/comics/comic_1.png', 'assets/comics/comic_2.png'],
  '1-2': ['assets/comics/comic_3.png'],
  '2-1': ['assets/comics/comic_4.png'],
  '3-1': ['assets/comics/comic_5.png'],
  '4-1': ['assets/comics/comic_6.png'],
  '5-1': ['assets/comics/comic_7.png'],
  '6-1': ['assets/comics/comic_8.png'],
};

/** Cómics que se muestran DESPUÉS de ganar un subnivel */
const COMIC_DESPUES = {
  '6-1': ['assets/comics/comic_9.png'],
};

let _colaComic     = [];    // Imágenes pendientes de mostrar
let _paginaComic   = 0;     // Índice de la página actual
let _callbackComic = null;  // Función a ejecutar al terminar la secuencia

/** Inicia una secuencia de cómic con las imágenes dadas */
function mostrarSecuenciaComic(imagenes, claveMusica, alTerminar) {
  if (!imagenes || imagenes.length === 0) { alTerminar(); return; }
  _colaComic     = imagenes;
  _paginaComic   = 0;
  _callbackComic = alTerminar;

  // Crear el overlay fullscreen si no existe
  let overlay = document.getElementById('overlay-comic');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlay-comic';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:#000;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
    `;
    const img = document.createElement('img');
    img.id = 'img-comic';
    img.style.cssText = `max-width:100%;max-height:100%;object-fit:contain;user-select:none;`;

    const pista = document.createElement('div');
    pista.id = 'pista-comic';
    pista.style.cssText = `
      position:absolute;bottom:18px;left:50%;transform:translateX(-50%);
      color:rgba(255,255,255,0.7);font-family:'Fredoka One',cursive;
      font-size:clamp(0.85rem,2.5vw,1.1rem);
      background:rgba(0,0,0,0.55);padding:6px 20px;border-radius:20px;
      pointer-events:none;
    `;
    pista.textContent = 'Toca para continuar ▶';
    overlay.appendChild(img);
    overlay.appendChild(pista);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', avanzarComic);
  }

  if (claveMusica !== undefined) reproducirMusica(claveMusica);
  _mostrarPaginaComic();
  overlay.style.display = 'flex';
}

/** Muestra la página actual del cómic */
function _mostrarPaginaComic() {
  const img   = document.getElementById('img-comic');
  const pista = document.getElementById('pista-comic');
  if (!img) return;
  img.src = _colaComic[_paginaComic];
  const esUltima = _paginaComic === _colaComic.length - 1;
  pista.textContent = esUltima ? 'Toca para jugar ⚔️' : 'Toca para continuar ▶';
}

/** Avanza al siguiente panel del cómic o cierra la secuencia */
function avanzarComic() {
  _paginaComic++;
  if (_paginaComic < _colaComic.length) {
    _mostrarPaginaComic();
  } else {
    const overlay = document.getElementById('overlay-comic');
    if (overlay) overlay.style.display = 'none';
    if (typeof _callbackComic === 'function') _callbackComic();
  }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  11. ARENA DE BATALLA                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Configura la zona visual de combate: imagen del jefe,        ║
   ║  barras de vida, fondo del nivel y animación de entrada.      ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function configurarArena(nvl, sn) {
  // Mostrar el nombre del jefe
  $('nombreEnemigo').textContent = nvl.nombreJefe;

  // Cargar la imagen del jefe (o usar emoji como respaldo)
  const interiorEl = $('interiorEnemigo');
  interiorEl.innerHTML = '';
  if (sn.imgJefe) {
    const imgJefe = document.createElement('img');
    imgJefe.src = sn.imgJefe;
    imgJefe.alt = nvl.nombreJefe;
    imgJefe.className = 'img-jefe';
    imgJefe.style.cssText = 'width:clamp(140px,26vw,240px);height:auto;object-fit:contain;image-rendering:auto;display:block;';
    imgJefe.onerror = () => { interiorEl.textContent = nvl.emojiJefe; };
    interiorEl.appendChild(imgJefe);
  } else {
    interiorEl.textContent = nvl.emojiJefe;
  }

  // Inicializar las barras de vida al 100%
  actualizarBarraVida('barraVidaJugador', 'textoVidaJugador', 100, 100, '❤️');
  actualizarBarraVida('barraVidaEnemigo', 'textoVidaEnemigo', 100, 100, '💀');

  // Limpiar aliados y efectos del subnivel anterior
  $('filaAliados').innerHTML    = '';
  $('capaEfectos').innerHTML    = '';

  // Resetear completamente el enemigo (posición, animación, filtros)
  const contEnemigo = $('contenedorEnemigo');
  contEnemigo.style.animation  = 'none';
  contEnemigo.style.opacity    = '1';
  contEnemigo.style.transform  = '';
  contEnemigo.style.transition = 'none';
  contEnemigo.style.left       = '62%';

  interiorEl.style.filter    = '';
  interiorEl.style.animation = 'none';
  interiorEl.style.transform = '';

  // Forzar reflow para aplicar el reset de animación
  void contEnemigo.offsetWidth;
  void interiorEl.offsetWidth;
  contEnemigo.style.animation  = '';
  interiorEl.style.animation   = '';

  // Mostrar indicador de nivel actual
  $('infoNivel').textContent = `Nivel ${nvl.id}-${sn.id.split('-')[1]}`;

  // Llamar a las funciones de animaciones.js si están disponibles
  if (typeof configurarFondoArena === 'function') {
    configurarFondoArena(nvl.id);  // Cargar imagen de fondo y partículas
  }
  if (typeof animacionEntradaEnemigo === 'function') {
    animacionEntradaEnemigo(nvl.id);  // Animación de entrada del jefe
  }
}

/**
 * actualizarBarraVida(idBarra, idTexto, actual, max, icono):
 *   Actualiza una barra de vida visual.
 *   - Calcula el porcentaje y ajusta el ancho CSS
 *   - Cambia a rojo si la vida del jugador baja del 30%
 *   - Actualiza el texto numérico con el ícono
 */
function actualizarBarraVida(idBarra, idTexto, actual, max, icono) {
  const pct = Math.max(0, (actual / max) * 100);
  const barra = $(idBarra);
  barra.style.width = pct + '%';
  if (idBarra === 'barraVidaJugador') {
    barra.className = 'barra-vida' + (pct <= 30 ? ' baja' : '');
  }
  $(idTexto).textContent = `${icono} ${Math.ceil(actual)}`;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  12. CARGA DE PREGUNTAS                                       ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Muestra cada pregunta en pantalla con sus 4 opciones.        ║
   ║  Verifica condiciones de victoria/derrota antes de mostrar.   ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function cargarPregunta() {
  // BUGFIX: no cargar pregunta si el juego ya no está activo
  if (!estado.juegoActivo) return;

  const nvl = NIVELES[estado.indiceNivelActual];
  const sn  = nvl.subniveles[estado.indiceSubnivelActual];
  const totalP = sn.maxPreguntas || PREGUNTAS_POR_SUBNIVEL;

  // === Verificar condiciones de fin ===
  if (sn.preguntasParaGanar) {
    // Nivel 6: gana con X aciertos, pierde si se agotan las preguntas
    if (estado.contadorAciertos >= sn.preguntasParaGanar) {
      detenerTemporizador(); finalizarSubnivel(true); return;
    }
    if (estado.indicePregunta >= totalP) {
      detenerTemporizador(); finalizarSubnivel(false); return;
    }
  } else {
    // Niveles normales: gana al completar todas las preguntas
    if (estado.indicePregunta >= totalP) {
      detenerTemporizador(); finalizarSubnivel(true); return;
    }
  }

  // Mostrar el texto de la pregunta
  const q = estado.preguntas[estado.indicePregunta];
  $('textoPregunta').textContent = `${estado.indicePregunta + 1}. ¿Cuánto es ${q.texto}`;

  // Actualizar el contador de preguntas
  if (sn.preguntasParaGanar) {
    $('contadorPreguntas').textContent = `✅ ${estado.contadorAciertos}/${sn.preguntasParaGanar}  ❌ ${estado.indicePregunta - estado.contadorAciertos}/${totalP - sn.preguntasParaGanar}`;
  } else {
    $('contadorPreguntas').textContent = `Pregunta ${estado.indicePregunta + 1}/${totalP}`;
  }

  // Crear los 4 botones de respuesta
  const cuadricula = $('cuadriculaRespuestas');
  cuadricula.innerHTML = '';
  q.opciones.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn-respuesta';
    btn.textContent = opt;
    btn.onclick = () => verificarRespuesta(opt, q.respuesta, btn);
    cuadricula.appendChild(btn);
  });
  $('marcadorRacha').textContent = '';
  estado.respondiendo = false;

  // Iniciar el temporizador para esta pregunta
  iniciarTemporizador();
}

/**
 * verificarRespuesta(seleccionada, correcta, btn):
 *   Se ejecuta al hacer clic en un botón de respuesta.
 *   Compara la opción seleccionada con la correcta.
 */
function verificarRespuesta(seleccionada, correcta, btn) {
  if (estado.respondiendo || estado.pausado || !estado.juegoActivo) return;
  estado.respondiendo = true;
  detenerTemporizador();

  // Deshabilitar todos los botones para evitar múltiples clics
  document.querySelectorAll('.btn-respuesta').forEach(b => b.disabled = true);

  if (seleccionada === correcta) {
    btn.classList.add('correcto');   // Resaltar en verde
    alAcertar();
  } else {
    btn.classList.add('incorrecto');  // Resaltar en rojo
    // También mostrar cuál era la correcta
    document.querySelectorAll('.btn-respuesta').forEach(b => {
      if (parseInt(b.textContent) === correcta) b.classList.add('correcto');
    });
    alFallar();
  }

  // Después de 1.2 seg, avanzar a la siguiente pregunta
  setTimeout(() => {
    if (!estado.juegoActivo) return;  // BUGFIX: no avanzar si salió del juego
    estado.indicePregunta++;
    cargarPregunta();
  }, 1200);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  13. LÓGICA ACIERTO / FALLO                                   ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Funciones que se ejecutan al acertar o fallar una pregunta.  ║
   ║  Actualizan puntos, vida, racha y efectos visuales.           ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Se ejecuta cuando el jugador ACIERTA una respuesta */
function alAcertar() {
  sonidoCorrecto();

  // Actualizar estadísticas
  estado.racha++;
  estado.contadorAciertos++;
  estado.mejorRacha = Math.max(estado.mejorRacha, estado.racha);
  estado.puntuacion += 10 + (estado.racha > 2 ? estado.racha * 3 : 0);  // Bonus por racha
  estado.vidaEnemigo = Math.max(0, estado.vidaEnemigo - DAÑO_JUGADOR_POR_ACIERTO);

  actualizarInterfaz();
  lanzarRayo();       // Efecto visual de rayo ⚡
  invocarAliado();    // Posiblemente invocar un aliado

  // Animación de daño al villano (de animaciones.js)
  const nvl = NIVELES[estado.indiceNivelActual];
  if (typeof animacionDañoEnemigo === 'function') {
    animacionDañoEnemigo(nvl.id);
  }

  // Cada 3 aciertos consecutivos → ataque especial
  if (estado.racha > 0 && estado.racha % 3 === 0) {
    lanzarAtaqueEspecial();
  }

  // Mostrar indicador de racha si es ≥ 2
  if (estado.racha >= 2) {
    $('marcadorRacha').textContent = `🔥 ¡Racha x${estado.racha}! +${estado.racha * 3} pts`;
    mostrarMensaje(`🔥 ¡RACHA DE ${estado.racha}! 🔥`, 900);
  }

  mostrarTextoDaño('-' + DAÑO_JUGADOR_POR_ACIERTO, 'enemigo');
  flashEnemigo();

  // Si el enemigo murió → victoria
  if (estado.vidaEnemigo <= 0) {
    if (typeof animacionMuerteEnemigo === 'function') {
      animacionMuerteEnemigo(() => finalizarSubnivel(true));
    } else {
      setTimeout(() => finalizarSubnivel(true), 600);
    }
  }
}

/** Se ejecuta cuando el jugador FALLA una respuesta o se agota el tiempo */
function alFallar() {
  sonidoIncorrecto();

  estado.racha = 0;  // Reiniciar racha
  estado.vidaJugador = Math.max(0, estado.vidaJugador - DAÑO_ENEMIGO_POR_ERROR);

  actualizarInterfaz();
  temblarArena();         // Sacudir la pantalla
  mostrarEfectoFallo();   // Texto "✗ ¡INCORRECTO!"
  mostrarTextoDaño('-' + DAÑO_ENEMIGO_POR_ERROR, 'jugador');
  avanzarEnemigo();       // El enemigo avanza hacia el héroe

  // Animación de ataque del villano (de animaciones.js)
  if (typeof animacionAtaqueEnemigo === 'function') {
    animacionAtaqueEnemigo();
  }

  // Si la vida baja de 40, invocar aliado de apoyo
  if (estado.vidaJugador <= 40) {
    invocarAliado();
  }

  // Nivel 6: verificar derrota por máximo de errores
  const nvl = NIVELES[estado.indiceNivelActual];
  const sn  = nvl.subniveles[estado.indiceSubnivelActual];
  if (sn.preguntasParaGanar) {
    const errores = estado.indicePregunta + 1 - estado.contadorAciertos;
    const maxErrores = sn.maxPreguntas - sn.preguntasParaGanar;
    if (errores >= maxErrores) {
      setTimeout(() => finalizarSubnivel(false), 600);
      return;
    }
  }

  // Si la vida del jugador llega a 0 → derrota
  if (estado.vidaJugador <= 0) {
    setTimeout(() => finalizarSubnivel(false), 600);
  }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  14. INTERFAZ SUPERIOR (HUD)                                  ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Actualiza las barras de vida y el marcador de puntos.        ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function actualizarInterfaz() {
  actualizarBarraVida('barraVidaJugador', 'textoVidaJugador', estado.vidaJugador, 100, '❤️');
  actualizarBarraVida('barraVidaEnemigo', 'textoVidaEnemigo', estado.vidaEnemigo, 100, '💀');
  $('marcadorPuntos').textContent = `⭐ ${estado.puntuacion}`;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  15. EFECTOS VISUALES                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Rayos, ataques especiales, aliados, texto de daño, etc.     ║
   ║  Se generan dinámicamente y se auto-eliminan con setTimeout. ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Lanza un rayo ⚡ visual del héroe hacia el enemigo */
function lanzarRayo() {
  const capa = $('capaEfectos');
  const el = document.createElement('div');
  el.className = 'rayo';
  el.textContent = '⚡';
  el.style.left = '18%';
  el.style.top  = (30 + Math.random() * 20) + '%';
  capa.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

/**
 * FRASES_ALIADOS: Frases de ánimo que dicen los aliados al aparecer.
 * Cada aliado (gato, mago, tech) tiene su propio estilo de frase.
 */
const FRASES_ALIADOS = {
  'assets/aliados/aliado1_gato.png':  ['¡Eres un guerrero! ⚔️', '¡Sin miedo al combate! 🛡️', '¡Atacad con fuerza! 🐾', '¡La victoria es tuya! 🏆'],
  'assets/aliados/aliado2_mago.png': ['¡El saber es poder! 🔮', '¡Magia matemática! ✨', '¡Tu mente es tu arma! 💎', '¡Conjuro certero! 🌟'],
  'assets/aliados/aliado3_tech.png': ['¡Calculando… correcto! ⚙️', '¡Sistema al 100%! 🟢', '¡Genio en acción! 🔧', '¡Error no detectado! 💡']
};

/**
 * invocarAliado():
 *   Genera un aliado aleatorio (que no esté ya en pantalla)
 *   con una burbuja de frase de ánimo. Se auto-elimina en 4 seg.
 */
function invocarAliado() {
  const fila = $('filaAliados');
  if (!fila) return;

  // Evitar duplicados: verificar qué aliados ya están visibles
  const activosImgs = Array.from(fila.querySelectorAll('img.img-aliado')).map(i => i.dataset.aliado);
  const disponibles = ALIADOS.filter(a => !activosImgs.includes(a));
  if (disponibles.length === 0) return;

  const src = disponibles[Math.floor(Math.random() * disponibles.length)];
  const frases = FRASES_ALIADOS[src];
  const frase = frases[Math.floor(Math.random() * frases.length)];

  // Crear el contenedor del aliado
  const aliado = document.createElement('div');
  aliado.className = 'aliado aliado-con-burbuja';
  aliado.style.position = 'relative';
  aliado.style.animationDelay = (Math.random() * .5) + 's';

  // Imagen del aliado
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'aliado';
  img.className = 'img-aliado';
  img.dataset.aliado = src;
  img.style.cssText = 'width:64px;height:auto;object-fit:contain;image-rendering:auto;display:block;';

  // Burbuja de texto
  const burbuja = document.createElement('div');
  burbuja.className = 'burbuja-aliado';
  burbuja.textContent = frase;

  aliado.appendChild(burbuja);
  aliado.appendChild(img);
  fila.appendChild(aliado);

  // Animar la burbuja: aparece tras 100ms, desaparece tras 2.5s
  setTimeout(() => { burbuja.style.opacity = '1'; }, 100);
  setTimeout(() => { burbuja.style.opacity = '0'; }, 2500);

  // Eliminar el aliado completo tras 4 segundos
  setTimeout(() => aliado.remove(), 4000);
}

/** Lanza 3 emojis como "ataque especial" cuando hay racha x3 */
function lanzarAtaqueEspecial() {
  const capa = $('capaEfectos');
  const seleccion = [...ESPECIALES, ...OBJETOS];
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'ataque-especial';
    el.textContent = seleccion[Math.floor(Math.random() * seleccion.length)];
    el.style.top  = (10 + Math.random() * 40) + '%';
    el.style.left = (5 + Math.random() * 10) + '%';
    el.style.animationDuration = (.8 + Math.random() * .4) + 's';
    el.style.animationDelay   = (i * 0.15) + 's';
    capa.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
  mostrarMensaje('💥 ¡ATAQUE ESPECIAL! 💥', 900);
}

/** Muestra el texto "✗ ¡INCORRECTO!" flotante en la arena */
function mostrarEfectoFallo() {
  const capa = $('capaEfectos');
  const el = document.createElement('div');
  el.className = 'efecto-fallo';
  el.textContent = '✗ ¡INCORRECTO!';
  el.style.top  = '30%';
  el.style.left = '30%';
  capa.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/** Muestra un número de daño flotante (-20) que sube y desaparece */
function mostrarTextoDaño(texto, objetivo) {
  const capa = $('capaEfectos');
  const el = document.createElement('div');
  el.className = 'texto-daño';
  el.textContent = texto;
  if (objetivo === 'enemigo') {
    el.style.left = '60%'; el.style.top = '25%';
    el.style.color = '#ff1744';
  } else {
    el.style.left = '12%'; el.style.top = '35%';
    el.style.color = '#ff6d00';
  }
  capa.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/** Sacude la arena visualmente (efecto de impacto) */
function temblarArena() {
  const arena = $('arenaBatalla');
  arena.classList.add('arena-temblor');
  setTimeout(() => arena.classList.remove('arena-temblor'), 450);
}

/** Flash rojo sobre el sprite del enemigo al recibir daño */
function flashEnemigo() {
  const sprite = $('spriteEnemigo');
  sprite.classList.add('enemigo-golpeado');
  setTimeout(() => sprite.classList.remove('enemigo-golpeado'), 350);
}

/**
 * avanzarEnemigo():
 *   Mueve al enemigo hacia la izquierda proporcionalmente al
 *   daño recibido por el jugador (el jefe se acerca al héroe).
 */
function avanzarEnemigo() {
  const pctDaño = 1 - (estado.vidaJugador / 100);
  const leftPct = 62 - pctDaño * 45;  // De 62% a 17%
  $('contenedorEnemigo').style.left = Math.max(17, leftPct) + '%';
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  16. FIN DE SUBNIVEL                                          ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Maneja victoria y derrota: limpieza, estadísticas, cómics   ║
   ║  post-victoria y desbloqueo del siguiente nivel.              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function finalizarSubnivel(gano) {
  // BUGFIX: no finalizar si ya no hay juego activo (evita doble finalización)
  if (!estado.juegoActivo) return;
  estado.juegoActivo = false;  // Marcar juego como terminado

  // Limpiar recursos en ejecución
  if (window._intervaloParticulas) {
    clearInterval(window._intervaloParticulas);
    window._intervaloParticulas = null;
  }
  detenerTemporizador();
  desvanecerMusica(700);

  const nvl = NIVELES[estado.indiceNivelActual];
  const sn  = nvl.subniveles[estado.indiceSubnivelActual];

  if (gano) {
    sonidoVictoria();
    estado.progreso[sn.id] = { completado: true, puntuacion: estado.puntuacion };
    desbloquearSiguiente(nvl, sn);

    // Si hay cómic post-victoria, mostrarlo antes de la pantalla de victoria
    const paginasDespues = COMIC_DESPUES[sn.id];
    if (paginasDespues && paginasDespues.length > 0) {
      mostrarSecuenciaComic(paginasDespues, undefined, () => _mostrarPantallaVictoria(nvl, sn));
    } else {
      _mostrarPantallaVictoria(nvl, sn);
    }
  } else {
    sonidoDerrota();
    $('estadisticasDerrota').innerHTML = `
      <div>⭐ Puntos: <b>${estado.puntuacion}</b></div>
      <div>🎯 Aciertos: <b>${estado.contadorAciertos}/${estado.preguntas.length}</b></div>
      <div>❤️ Vida restante: <b>${estado.vidaJugador}</b></div>
    `;
    mostrarPantalla('derrota');
  }
}

/** Desbloquea el siguiente nivel al completar el último subnivel de un nivel */
function desbloquearSiguiente(nvl, sn) {
  const idxSn = nvl.subniveles.indexOf(sn);
  if (idxSn >= nvl.subniveles.length - 1) {
    // Último subnivel del nivel → desbloquear siguiente nivel
    if (nvl.id < NIVELES.length) {
      estado.nivelDesbloqueado = Math.max(estado.nivelDesbloqueado, nvl.id + 1);
    }
  }
}

/** Muestra la pantalla de victoria con estadísticas */
function _mostrarPantallaVictoria(nvl, sn) {
  generarConfeti();
  $('mensajeVictoria').textContent = nvl.esJefeFinal
    ? '🏆 ¡Eres el MAESTRO MATEMÁTICO!'
    : `¡Derrotaste a ${nvl.nombreJefe}!`;
  $('estadisticasVictoria').innerHTML = `
    <div>⭐ Puntos: <b>${estado.puntuacion}</b></div>
    <div>🎯 Aciertos: <b>${estado.contadorAciertos}/${estado.preguntas.length}</b></div>
    <div>🔥 Mejor racha: <b>${estado.mejorRacha}</b></div>
  `;
  const haySiguiente = datosSiguienteNivel();
  $('btnSiguiente').style.display = haySiguiente ? '' : 'none';
  mostrarPantalla('victoria');
}

/** Calcula los índices del siguiente nivel/subnivel (o null si no hay más) */
function datosSiguienteNivel() {
  const nvl = NIVELES[estado.indiceNivelActual];
  if (estado.indiceSubnivelActual < nvl.subniveles.length - 1) {
    return { ni: estado.indiceNivelActual, si: estado.indiceSubnivelActual + 1 };
  } else if (estado.indiceNivelActual < NIVELES.length - 1) {
    return { ni: estado.indiceNivelActual + 1, si: 0 };
  }
  return null;
}

/** Botón "Siguiente" en pantalla de victoria */
function siguienteNivel() {
  const siguiente = datosSiguienteNivel();
  if (siguiente) iniciarSubnivel(siguiente.ni, siguiente.si);
  else mostrarPantalla('niveles');
}

/** Botón "Reintentar" en pantalla de derrota */
function reintentar() {
  iniciarSubnivel(estado.indiceNivelActual, estado.indiceSubnivelActual);
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  17. PAUSA / SALIR DEL JUEGO                                  ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  BUGFIX PRINCIPAL: Se agregó la función salirDelJuego() que   ║
   ║  limpia TODOS los recursos antes de salir. Antes, el botón   ║
   ║  "Salir" solo cambiaba de pantalla sin detener el timer,     ║
   ║  lo que causaba victoria/derrota fantasma.                    ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** Pausa el juego: detiene el timer, baja el volumen, muestra el modal */
function pausarJuego() {
  estado.pausado = true;
  detenerTemporizador();
  if (elementoMusica) elementoMusica.volume = 0.1;
  $('modal-pausa').classList.remove('oculto');
}

/** Reanuda el juego: oculta el modal y reactiva el timer */
function reanudarJuego() {
  estado.pausado = false;
  if (elementoMusica) elementoMusica.volume = 0.35;
  $('modal-pausa').classList.add('oculto');

  // Reanudar timer con el tiempo restante (si quedaba tiempo)
  if (!estado.respondiendo && estado.segundosTemporizador > 0) {
    estado.intervaloTemporizador = setInterval(() => {
      if (estado.pausado || estado.respondiendo) return;
      estado.segundosTemporizador--;
      actualizarUITemporizador(estado.segundosTemporizador);
      if (estado.segundosTemporizador <= 0) {
        detenerTemporizador();
        alAgotarseTiempo();
      }
    }, 1000);
  }
}

/**
 * salirDelJuego():
 *   BUGFIX – Función nueva que limpia COMPLETAMENTE el estado del juego
 *   antes de salir a la pantalla de niveles.
 *
 *   PROBLEMA ORIGINAL:
 *   El botón "Salir" en el modal de pausa llamaba directamente a
 *   mostrarPantalla('niveles') sin detener el temporizador ni las
 *   partículas. El timer seguía corriendo en segundo plano y al
 *   llegar a 0 ejecutaba alAgotarseTiempo() → alFallar() →
 *   finalizarSubnivel(false) → mostraba la pantalla de derrota
 *   aunque el jugador ya estaba en la selección de niveles.
 *
 *   SOLUCIÓN:
 *   1. Marcar juegoActivo = false (bloquea setTimeout pendientes)
 *   2. Detener el temporizador
 *   3. Detener las partículas del fondo
 *   4. Desvanecer la música
 *   5. Ocultar el modal de pausa
 *   6. Ir a la pantalla de niveles
 */
function salirDelJuego() {
  // 1. Marcar el juego como inactivo (evita que callbacks pendientes se ejecuten)
  estado.juegoActivo = false;
  estado.pausado     = false;
  estado.respondiendo = true;  // Bloquear cualquier interacción residual

  // 2. Detener el temporizador de preguntas
  detenerTemporizador();

  // 3. Detener las partículas ambientales del fondo
  if (window._intervaloParticulas) {
    clearInterval(window._intervaloParticulas);
    window._intervaloParticulas = null;
  }

  // 4. Desvanecer y detener la música del nivel
  desvanecerMusica(400);

  // 5. Ocultar el modal de pausa
  $('modal-pausa').classList.add('oculto');

  // 6. Navegar a la pantalla de niveles
  mostrarPantalla('niveles');
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  18. CONFETTI                                                  ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Genera 60 partículas de confeti animadas en la pantalla de   ║
   ║  victoria. Cada pieza tiene color, tamaño y velocidad aleat.  ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function generarConfeti() {
  const contenedor = $('contenedorConfeti');
  contenedor.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'pieza-confeti';
    el.style.left = Math.random() * 100 + '%';
    el.style.backgroundColor = COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)];
    el.style.width  = (8 + Math.random() * 10) + 'px';
    el.style.height = (8 + Math.random() * 10) + 'px';
    el.style.borderRadius = Math.random() > .5 ? '50%' : '2px';  // Círculos o cuadrados
    el.style.animationDuration  = (1.5 + Math.random() * 2) + 's';
    el.style.animationDelay     = (Math.random() * 1.5) + 's';
    contenedor.appendChild(el);
  }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  19. INICIALIZACIÓN                                            ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  Código que se ejecuta automáticamente al cargar la página.   ║
   ╚═══════════════════════════════════════════════════════════════╝ */

window.addEventListener('DOMContentLoaded', () => {
  // Intentar reproducir la música de bienvenida
  reproducirMusica('bienvenida');

  // Si la imagen del héroe falla al cargar, usar emoji como respaldo
  const imgHeroe = $('imgHeroe');
  if (imgHeroe) {
    imgHeroe.onerror = () => {
      const padre = imgHeroe.parentNode;
      const span = document.createElement('div');
      span.style.cssText = `font-size:120px;animation:flotarHeroe 3s ease-in-out infinite;
        line-height:1;filter:drop-shadow(0 0 20px gold);`;
      span.textContent = '🦸';
      padre.replaceChild(span, imgHeroe);
    };
  }

  // Desbloquear el AudioContext al primer clic (requerido por navegadores)
  document.addEventListener('click', () => {
    try { obtenerContextoAudio().resume(); } catch(e) {}
  }, { once: true });
});


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  20. ATAJOS DE TECLADO                                         ║
   ║  ─────────────────────────────────────────────────────────── ║
   ║  - Teclas 1-4: Seleccionar opciones de respuesta              ║
   ║  - Escape: Pausar/reanudar el juego                           ║
   ╚═══════════════════════════════════════════════════════════════╝ */

document.addEventListener('keydown', e => {
  // Escape → pausar/reanudar
  if (e.key === 'Escape') {
    const pantallaJuego = $('pantalla-juego');
    if (pantallaJuego.classList.contains('activa')) {
      estado.pausado ? reanudarJuego() : pausarJuego();
    }
  }

  // Teclas 1-4 → seleccionar la respuesta correspondiente
  if (!estado.pausado && $('pantalla-juego').classList.contains('activa')) {
    const mapa = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (mapa[e.key] !== undefined) {
      const btns = document.querySelectorAll('.btn-respuesta');
      if (btns[mapa[e.key]] && !btns[mapa[e.key]].disabled) btns[mapa[e.key]].click();
    }
  }
});
