# ShortsForge AI

## Uso

Iniciá con `npm run dev`. En **IA · Cualquier Tema**, elegí canal, estilo y un objetivo de 15, 20 o 30 segundos. Agregá el tema y datos comprobados. **Generar todo automáticamente** prepara guion, imágenes, voz y subtítulos. La descarga se inicia con **Exportar video** en el Studio.

**Viralidad:** cada guion usa una fórmula del banco de ganchos (`hooks/formulas.json`, 100 fórmulas × 10 triggers, con rotación para no repetir); el chip bajo el gancho muestra cuál se usó y **🎲 Otro gancho** la reescribe con otra fórmula. En **Lab · Virales** se pega la transcripción de un video viral: se desglosa segundo a segundo y sus ganchos quedan en el banco propio (`banco_virales.json` en la carpeta de medios) alimentando los guiones de ese canal. Los subtítulos incluyen el estilo **CapCut Pop** (palabra por palabra con pop-in), predeterminado en Humor y Épico.

**Estilos, memes y gráficos** ofrece documental, fútbol épico, humor y explicación; reacciones animadas, porcentajes ingresados manualmente, GIF propios y efectos sonoros. GIF: hasta 5 MB y límite de memoria de decodificación. Sonidos propios: hasta 5 MB y 10 segundos. Los efectos se incluyen en la exportación. Aplicar otro estilo reemplaza los efectos sonoros del estilo anterior.

Los subtítulos por palabra usan los tiempos reales de Edge TTS. La duración final sigue la voz completa: el objetivo no corta la narración. Mantené la pestaña visible mientras se exporta. El navegador elige MP4 o WebM; el video se graba en tiempo real.

## Configuración y guardado

Se conservan tus proveedores y credenciales existentes, leídos desde variables de entorno o `E:/DelMonte/automatizacion/.env`. Se necesita Python con Edge TTS compatible con `boundary="WordBoundary"`.

La biblioteca guarda proyectos en el navegador y origen usados. Las preferencias de canal se recuerdan al generar o cambiar de canal. Audios e imágenes generados se guardan en la carpeta indicada por `shortsforge.config.json`, actualmente `E:/ShortsForgeAI-media` para evitar llenar C:. `SHORTSFORGE_MEDIA_DIR` permite sobrescribirla. Sin configuración se usa `.shortsforge-media`. Las imágenes externas del respaldo dependen de su URL. El servidor local debe seguir ejecutándose; un HTML estático no reemplaza las rutas de IA. `npm run preview` también sirve esas rutas.

Las cinco variantes consultan tus proveedores para cada guion e imagen, consumiendo cuota. No hay conexión a YouTube Analytics ni predicción de vistas. La actividad muestra solicitudes reales. El ZIP Python sigue siendo una plantilla separada: los efectos nuevos se exportan desde el Studio.

## Verificación

`npm run typecheck` y `npm run build`.

`npm run test:browser` requiere servidor en `127.0.0.1:5178`, Playwright y Chromium. Acepta `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` y `SHORTSFORGE_TEST_OUTPUT` para instalaciones existentes. Prueba generación automática y variantes con medios controlados, exportación, guardado, GIF, sonidos propios y errores; también realiza una petición real a `/api/tts`.

Verificado: guion real mediante FreeLLMAPI; voz real con marcas por palabra; MP4 con video H.264 1080×1920 y audio; GIF y sonido personalizado exportados; biblioteca persistente y errores explícitos de voz.
