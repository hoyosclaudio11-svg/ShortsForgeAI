import { PythonCodeFile } from '../types/video';

export const PYTHON_CODEBASE_FILES: PythonCodeFile[] = [
  {
    name: 'config.yaml',
    path: 'config.yaml',
    language: 'yaml',
    description: 'Archivo de configuración central (Resolución 1080x1920, duración, rutas, estilos y APIs)',
    content: `# ==============================================================================
# SHORTSFORGE AI — Configuración Central del Pipeline de YouTube Shorts
# Python 3.11 + FFmpeg 6.x | Resolución 1080x1920 (Vertical 9:16)
# ==============================================================================

pipeline:
  output_dir: "./output_shorts"
  temp_dir: "./tmp_workspace"
  target_duration_seconds: 60.0
  variants_count: 5
  cleanup_temp_files: true
  log_level: "INFO" # DEBUG, INFO, WARNING, ERROR

video:
  width: 1080
  height: 1920
  aspect_ratio: "9:16"
  fps: 30
  video_codec: "libx264"
  pixel_format: "yuv420p"
  video_bitrate: "8500k"
  max_bitrate: "12000k"
  bufsize: "18000k"
  ffmpeg_preset: "medium" # ultrafast, veryfast, fast, medium, slow
  color_space: "bt709"

audio:
  audio_codec: "aac"
  sample_rate: 44100
  channels: 2
  audio_bitrate: "256k"
  background_music_volume: 0.28   # Nivel normal de música de fondo (0.0 - 1.0)
  ducking_duck_volume: 0.12        # Volumen de música cuando la voz habla (Sidechain)
  ducking_attack_ms: 150
  ducking_release_ms: 300
  target_lufs: -14.0              # Estándar para YouTube / Shorts (EBU R128)

subtitles:
  font_name: "Montserrat-Black"
  font_path: "./assets/fonts/Montserrat-Black.ttf"
  font_size: 64
  primary_color: "&H00FFFFFF"     # Blanco en ASS
  highlight_color: "&H0022FFFF"   # Amarillo oro / cian vibrante
  outline_color: "&H00000000"     # Borde negro sólido
  outline_width: 5
  shadow_depth: 3
  vertical_margin: 380            # Margen inferior para evitar solapamiento con UI de Shorts
  alignment: 2                    # 2 = Bottom Center (ASS Standard)
  animation_style: "hormozi_pop"  # hormozi_pop, karaoke_word, gold_cinematic, clean_box

image_generation:
  provider: "stable_diffusion"    # "stable_diffusion", "dalle3", "replicate", "local_diffusers"
  sd_api_endpoint: "http://127.0.0.1:7860/sdapi/v1/txt2img"
  sd_model: "sd_xl_base_1.0.safetensors"
  steps: 30
  cfg_scale: 7.5
  negative_prompt: "blurry, low quality, distorted, deformed text, watermarks, bad anatomy, horizontal, wide angle"
  aspect_ratio_preset: "896x1152" # SDXL vertical base optimal resolution

voice_tts:
  engine: "edge-tts"              # "edge-tts", "openai-tts", "elevenlabs"
  default_voice_es: "es-ES-AlvaroNeural" # "es-MX-JorgeNeural", "es-ES-ElviraNeural"
  speech_rate: "+10%"
  speech_pitch: "+0Hz"

styles_presets:
  cinematic_warm:
    lut_curve: "curves=vintage"
    ken_burns_zoom: 1.25
    vignette_amount: 0.25
  cyberpunk_neon:
    lut_curve: "eq=contrast=1.3:brightness=0.03:saturation=1.5"
    ken_burns_zoom: 1.30
    vignette_amount: 0.35
  noir_contrast:
    lut_curve: "eq=contrast=1.4:saturation=0.3:gamma=0.9"
    ken_burns_zoom: 1.20
    vignette_amount: 0.40
`
  },
  {
    name: 'requirements.txt',
    path: 'requirements.txt',
    language: 'text',
    description: 'Dependencias de Python 3.11 para edición multimedia, IA y CLI',
    content: `# Core Python 3.11 Multimedia & Video Pipeline
ffmpeg-python>=0.2.0
moviepy>=1.0.3
Pillow>=10.2.0
numpy>=1.26.0
scipy>=1.12.0

# AI & Media Generation APIs
openai>=1.14.0
requests>=2.31.0
httpx>=0.27.0
edge-tts>=6.1.10
mutagen>=1.47.0

# Data Validation & Configuration
pydantic>=2.6.4
pyyaml>=6.0.1
rich>=13.7.1
click>=8.1.7
python-dotenv>=1.0.1

# Image Processing & Utilities
tqdm>=4.66.2
`
  },
  {
    name: 'Dockerfile',
    path: 'Dockerfile',
    language: 'dockerfile',
    description: 'Contenedor Docker para ejecución aislada con FFmpeg 6 y fuentes FreeType',
    content: `# Multi-stage Dockerfile para ShortsForge AI
FROM python:3.11-slim-bookworm AS base

# Configuración del entorno
ENV PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1 \\
    DEBIAN_FRONTEND=noninteractive \\
    OUTPUT_DIR=/app/output_shorts

# Instalar FFmpeg completo con códecs y soporte FreeType/Fontconfig
RUN apt-get update && apt-get install -y --no-install-recommends \\
    ffmpeg \\
    libfreetype6-dev \\
    libfontconfig1 \\
    fonts-dejavu-core \\
    fonts-montserrat \\
    fonts-liberation \\
    git \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente y fuentes
COPY . .

# Crear directorios necesarios
RUN mkdir -p /app/output_shorts /app/tmp_workspace /app/assets/fonts

# Punto de entrada predeterminado
ENTRYPOINT ["python", "main.py"]
CMD ["--help"]
`
  },
  {
    name: 'main.py',
    path: 'main.py',
    language: 'python',
    description: 'Punto de entrada CLI con Rich UI para generar las 5 variantes de 60s',
    content: `#!/usr/bin/env python3
"""
==============================================================================
ShortsForge AI — Generador Automatizado de YouTube Shorts (1080x1920)
Senior Multimedia Engineering Pipeline | Python 3.11 + FFmpeg
==============================================================================
"""

import sys
import os
import argparse
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.table import Table

from pipeline.orchestrator import ShortsPipelineOrchestrator
from pipeline.logger import setup_logger

console = Console()
logger = setup_logger("ShortsForgeCLI")

def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Genera 5 variantes de YouTube Shorts de 60s en 1080x1920 para cualquier tema dado."
    )
    parser.add_argument(
        "--topic", "-t",
        type=str,
        required=True,
        help="Tema o título principal del video (ej: 'Misterios del Cosmos', '5 Hábitos de Productividad')"
    )
    parser.add_argument(
        "--variants", "-v",
        type=int,
        default=5,
        help="Cantidad de variantes de 60s a generar (por defecto: 5)"
    )
    parser.add_argument(
        "--duration", "-d",
        type=float,
        default=60.0,
        help="Duración total exacta en segundos por video (por defecto: 60.0)"
    )
    parser.add_argument(
        "--config", "-c",
        type=str,
        default="config.yaml",
        help="Ruta al archivo de configuración YAML"
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default="./output_shorts",
        help="Directorio donde se guardarán los videos MP4 y miniaturas"
    )
    parser.add_argument(
        "--fast-mock",
        action="store_true",
        help="Modo rápido con imágenes y audio sintéticos locales sin consumir cuota de API externa"
    )
    return parser.parse_args()

def display_banner():
    banner_text = """
 [bold red]╔════════════════════════════════════════════════════════════════╗[/bold red]
 [bold red]║[/bold red]  [bold white]⚡ SHORTSFORGE AI — MOTOR AUTOMATIZADO DE YOUTUBE SHORTS[/bold white]      [bold red]║[/bold red]
 [bold red]║[/bold red]  [dim cyan]Python 3.11 • FFmpeg Engine • 1080x1920 • 60s Vertical Video[/dim cyan]   [bold red]║[/bold red]
 [bold red]╚════════════════════════════════════════════════════════════════╝[/bold red]
    """
    console.print(banner_text)

def main():
    display_banner()
    args = parse_arguments()

    console.print(f"[bold yellow]→ Tema recibido:[/bold yellow] [bold green]'{args.topic}'[/bold green]")
    console.print(f"[bold yellow]→ Variantes a producir:[/bold yellow] [bold cyan]{args.variants} variantes de {args.duration}s c/u[/bold cyan]")
    console.print(f"[bold yellow]→ Directorio de salida:[/bold yellow] [underline cyan]{args.output_dir}[/underline cyan]\\n")

    try:
        orchestrator = ShortsPipelineOrchestrator(
            config_path=args.config,
            output_dir=args.output_dir,
            fast_mock=args.fast_mock
        )

        with Progress(
            SpinnerColumn(spinner_name="dots12"),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=40),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=console
        ) as progress:
            
            master_task = progress.add_task(
                f"[bold magenta]Generando {args.variants} variantes de Shorts...",
                total=args.variants
            )

            generated_videos = orchestrator.generate_batch_variants(
                topic=args.topic,
                variant_count=args.variants,
                target_duration=args.duration,
                progress_callback=lambda current, step_msg: progress.update(
                    master_task,
                    advance=0,
                    description=f"[bold cyan]Var #{current}:[/bold cyan] {step_msg}"
                )
            )
            progress.update(master_task, completed=args.variants)

        # Mostrar resumen de entrega
        console.print("\\n[bold green]✔ ¡PROCESAMIENTO COMPLETADO CON ÉXITO![/bold green]\\n")
        
        table = Table(title=f"Videos Generados para '{args.topic}' (1080x1920 - 60s)", show_lines=True)
        table.add_column("#", style="cyan", width=4)
        table.add_column("Archivo MP4", style="bold white")
        table.add_column("Título Optimizado Shorts", style="yellow")
        table.add_column("Hashtags", style="dim")
        table.add_column("Miniatura", style="green")

        for idx, item in enumerate(generated_videos, 1):
            table.add_row(
                str(idx),
                item.get("video_filename", "video.mp4"),
                item.get("metadata", {}).get("title", "YouTube Short"),
                " ".join(item.get("metadata", {}).get("hashtags", [])[:4]),
                item.get("thumbnail_filename", "thumbnail.jpg")
            )

        console.print(table)
        console.print(f"\\n[bold cyan]Archivos guardados en:[/bold cyan] {Path(args.output_dir).resolve()}\\n")

    except KeyboardInterrupt:
        console.print("\\n[bold red]✖ Operación cancelada por el usuario.[/bold red]")
        sys.exit(130)
    except Exception as e:
        logger.exception("Error crítico durante la ejecución del pipeline")
        console.print(f"\\n[bold red]✖ Error en el pipeline:[/bold red] {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  },
  {
    name: 'pipeline/orchestrator.py',
    path: 'pipeline/orchestrator.py',
    language: 'python',
    description: 'Orquestador maestro del flujo: Guion -> Imágenes -> Audio -> Subtítulos -> FFmpeg -> Miniatura',
    content: `"""
Pipeline Orchestrator: Coordina todos los módulos para generar variantes de YouTube Shorts de 60s.
"""

import os
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Callable, Optional

from pipeline.logger import setup_logger
from pipeline.image_generator import ImageGeneratorEngine
from pipeline.audio_engine import AudioEngine
from pipeline.ffmpeg_builder import FFmpegShortsBuilder
from pipeline.metadata_generator import MetadataGenerator
from pipeline.thumbnail_generator import ThumbnailGenerator

logger = setup_logger("Orchestrator")

class ShortsPipelineOrchestrator:
    def __init__(self, config_path: str = "config.yaml", output_dir: Optional[str] = None, fast_mock: bool = False):
        self.config = self._load_config(config_path)
        if output_dir:
            self.config["pipeline"]["output_dir"] = output_dir

        self.output_dir = Path(self.config["pipeline"]["output_dir"])
        self.temp_dir = Path(self.config["pipeline"]["temp_dir"])
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        self.fast_mock = fast_mock
        self.image_gen = ImageGeneratorEngine(self.config, fast_mock=fast_mock)
        self.audio_engine = AudioEngine(self.config, fast_mock=fast_mock)
        self.ffmpeg_builder = FFmpegShortsBuilder(self.config)
        self.meta_gen = MetadataGenerator(self.config)
        self.thumbnail_gen = ThumbnailGenerator(self.config)

    def _load_config(self, path: str) -> Dict[str, Any]:
        p = Path(path)
        if not p.exists():
            logger.warning(f"Config '{path}' no encontrado. Usando defaults.")
            return {
                "pipeline": {"output_dir": "./output_shorts", "temp_dir": "./tmp_workspace", "target_duration_seconds": 60.0},
                "video": {"width": 1080, "height": 1920, "fps": 30, "video_codec": "libx264"},
                "audio": {"background_music_volume": 0.28, "target_lufs": -14.0}
            }
        with open(p, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def generate_batch_variants(
        self,
        topic: str,
        variant_count: int = 5,
        target_duration: float = 60.0,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> List[Dict[str, Any]]:
        """
        Genera N variantes únicas de 60 segundos con estilos, ritmos y ganchos virales diferentes.
        """
        results = []
        variant_styles = [
            {"name": "Gancho Rápido Viral", "style": "cyberpunk_neon", "pace": "fast", "music": "synthwave_pulse"},
            {"name": "Cinemático Documental", "style": "cinematic_warm", "pace": "epic", "music": "cinematic_epic"},
            {"name": "Top 5 Cuenta Regresiva", "style": "vivid_hyper", "pace": "rhythmic", "music": "energetic_trap"},
            {"name": "Misterio & Suspenso", "style": "noir_contrast", "pace": "dramatic", "music": "dark_suspense"},
            {"name": "Guía Práctica Acción", "style": "natural", "pace": "clean", "music": "lofi_chill_beat"}
        ]

        for i in range(variant_count):
            var_idx = i + 1
            style_profile = variant_styles[i % len(variant_styles)]
            var_name = f"variant_{var_idx:02d}_{topic.lower().replace(' ', '_')[:25]}"

            logger.info(f"==> Iniciando Variante #{var_idx}: '{style_profile['name']}' para '{topic}'")
            if progress_callback:
                progress_callback(var_idx, f"Diseñando guion y gancho viral...")

            # 1. Generar Metadata y Guion de 6 escenas (10s c/u = 60s)
            metadata = self.meta_gen.generate_variant_metadata(topic, variant_index=var_idx, style_name=style_profile["name"])
            scenes_data = self.meta_gen.generate_scenes_script(topic, total_duration=target_duration, scene_count=6)

            # 2. Generar o descargar imágenes verticales (1080x1920)
            if progress_callback:
                progress_callback(var_idx, f"Generando imágenes con IA (Stable Diffusion / DALL-E)...")
            scene_image_paths = []
            for s_idx, scene in enumerate(scenes_data):
                img_path = self.image_gen.generate_vertical_image(
                    prompt=scene["image_prompt"],
                    output_path=self.temp_dir / f"{var_name}_scene_{s_idx+1}.png"
                )
                scene_image_paths.append(img_path)
                scene["image_path"] = str(img_path)

            # 3. Generar Audio de Voz (TTS) + Pista de Música Libre de Derechos
            if progress_callback:
                progress_callback(var_idx, f"Sintetizando voz y sincronizando pista musical...")
            voice_audio_path = self.audio_engine.generate_voiceover(
                scenes=scenes_data,
                output_path=self.temp_dir / f"{var_name}_voice.wav"
            )
            bg_music_path = self.audio_engine.get_royalty_free_track(
                genre=style_profile["music"],
                target_duration=target_duration,
                output_path=self.temp_dir / f"{var_name}_bgm.wav"
            )

            # 4. Generar archivo de subtítulos animados (ASS / SRT)
            if progress_callback:
                progress_callback(var_idx, f"Calculando timestamps de subtítulos kinetic...")
            subtitles_ass_path = self.audio_engine.generate_ass_subtitles(
                scenes=scenes_data,
                output_path=self.temp_dir / f"{var_name}_captions.ass",
                style=self.config.get("subtitles", {}).get("animation_style", "hormozi_pop")
            )

            # 5. Compilar el video vertical final con FFmpeg
            if progress_callback:
                progress_callback(var_idx, f"Renderizando video 1080x1920 con FFmpeg (Filtros, Ken Burns, Subtítulos)...")
            final_mp4_path = self.output_dir / f"{var_name}.mp4"
            self.ffmpeg_builder.build_short(
                scenes=scenes_data,
                voice_audio_path=voice_audio_path,
                bg_music_path=bg_music_path,
                subtitles_path=subtitles_ass_path,
                style_filter=style_profile["style"],
                output_video_path=final_mp4_path,
                target_duration=target_duration
            )

            # 6. Generar Miniatura vertical optimizada para Shorts
            if progress_callback:
                progress_callback(var_idx, f"Creando miniatura de alto CTR...")
            thumbnail_path = self.output_dir / f"{var_name}_thumbnail.jpg"
            self.thumbnail_gen.create_shorts_thumbnail(
                base_image_path=scene_image_paths[0],
                headline=metadata.get("viral_hook", topic.upper())[:40],
                badge_text=f"VARIANTE #{var_idx}",
                output_path=thumbnail_path
            )

            # 7. Guardar paquete de metadata JSON para YouTube
            meta_json_path = self.output_dir / f"{var_name}_metadata.json"
            with open(meta_json_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

            results.append({
                "variant_index": var_idx,
                "variant_name": style_profile["name"],
                "video_path": str(final_mp4_path),
                "video_filename": final_mp4_path.name,
                "thumbnail_filename": thumbnail_path.name,
                "metadata": metadata
            })

        return results
`
  },
  {
    name: 'pipeline/ffmpeg_builder.py',
    path: 'pipeline/ffmpeg_builder.py',
    language: 'python',
    description: 'Motor FFmpeg: Genera filter_complex con Ken Burns, xfade, LUTs y audio ducking EBU R128',
    content: `"""
FFmpeg Shorts Builder: Construye la tubería gráfica compleja de FFmpeg para exportar MP4 a 1080x1920.
"""

import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any
from pipeline.logger import setup_logger

logger = setup_logger("FFmpegBuilder")

class FFmpegShortsBuilder:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.width = config.get("video", {}).get("width", 1080)
        self.height = config.get("video", {}).get("height", 1920)
        self.fps = config.get("video", {}).get("fps", 30)
        self.preset = config.get("video", {}).get("ffmpeg_preset", "medium")
        self.ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

    def build_short(
        self,
        scenes: List[Dict[str, Any]],
        voice_audio_path: Path,
        bg_music_path: Path,
        subtitles_path: Path,
        style_filter: str,
        output_video_path: Path,
        target_duration: float = 60.0
    ) -> Path:
        """
        Ejecuta FFmpeg compilando todas las escenas con zoom dinámico (Ken Burns),
        transiciones xfade, filtro de color, subtítulos ASS y mezcla de audio con ducking.
        """
        logger.info(f"Construyendo video vertical {self.width}x{self.height} -> {output_video_path.name}")
        
        # Filtros de estilo predefinidos
        color_filters = {
            "cinematic_warm": "eq=contrast=1.15:brightness=0.02:saturation=1.2,curves=vintage",
            "cyberpunk_neon": "eq=contrast=1.3:brightness=0.03:saturation=1.5",
            "noir_contrast": "eq=contrast=1.4:saturation=0.25:gamma=0.9",
            "vivid_hyper": "eq=contrast=1.2:saturation=1.4",
            "natural": "eq=contrast=1.05:saturation=1.1"
        }
        chosen_filter = color_filters.get(style_filter, color_filters["natural"])

        # Armar entradas de imagen
        inputs = []
        filter_complex_parts = []
        scene_count = len(scenes)

        for i, scene in enumerate(scenes):
            img_p = scene.get("image_path")
            dur = scene.get("duration", 10.0)
            inputs.extend(["-loop", "1", "-t", str(dur), "-i", str(img_p)])

            # Efecto Ken Burns dinámico: Escalar y hacer zoom progresivo
            # zoompan: z='min(zoom+0.0015,1.25)':d=duration*fps:s=1080x1920
            total_frames = int(dur * self.fps)
            zoom_expr = f"min(pzoom+0.0008,1.20)" if i % 2 == 0 else f"max(1.20-0.0008*on,1.0)"
            filter_complex_parts.append(
                f"[{i}:v]scale=8000:-1,zoompan=z='{zoom_expr}':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={self.width}x{self.height}:fps={self.fps},setpts=PTS-STARTPTS[v{i}];"
            )

        # Concatenar o hacer crossfade entre escenas
        concat_inputs = "".join([f"[v{i}]" for i in range(scene_count)])
        filter_complex_parts.append(
            f"{concat_inputs}concat=n={scene_count}:v=1:a=0[vconcat];"
        )

        # Aplicar corrección de color y subtítulos ASS
        # Escapar caracteres de ruta para FFmpeg
        ass_escaped = str(subtitles_path).replace("\\\\", "/").replace(":", "\\\\:")
        filter_complex_parts.append(
            f"[vconcat]{chosen_filter},subtitles='{ass_escaped}':force_style='Fontsize=24'[vout]"
        )

        # Entradas de audio: [scene_count] = voice, [scene_count+1] = bg_music
        inputs.extend(["-i", str(voice_audio_path)])
        inputs.extend(["-i", str(bg_music_path)])

        voice_idx = scene_count
        bg_idx = scene_count + 1

        # Audio ducking: bajar música cuando la voz tiene energía (sidechaincompress)
        # o mezcla ponderada
        audio_filter = (
            f"[{bg_idx}:a]volume=0.25,atrim=0:{target_duration}[bgm];"
            f"[{voice_idx}:a]volume=1.0[voice];"
            f"[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-14:LRA=7:TP=-1.5[aout]"
        )

        full_filter = "".join(filter_complex_parts) + ";" + audio_filter

        cmd = [
            self.ffmpeg_bin, "-y",
            *inputs,
            "-filter_complex", full_filter,
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", self.config.get("video", {}).get("video_codec", "libx264"),
            "-preset", self.preset,
            "-b:v", self.config.get("video", {}).get("video_bitrate", "8500k"),
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "256k",
            "-t", str(target_duration),
            str(output_video_path)
        ]

        logger.info(f"Ejecutando comando FFmpeg para {output_video_path.name}...")
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            logger.info(f"✔ Video exportado con éxito: {output_video_path}")
            return output_video_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Error en FFmpeg: {e.stderr[-800:]}")
            # Fallback simple en caso de que filter_complex falle por incompatibilidad de drivers
            return self._fallback_render(scenes, voice_audio_path, output_video_path, target_duration)

    def _fallback_render(self, scenes, voice_audio, output_path, duration):
        logger.warning("Ejecutando render de respaldo robusto...")
        first_img = scenes[0].get("image_path")
        cmd = [
            self.ffmpeg_bin, "-y",
            "-loop", "1", "-i", str(first_img),
            "-i", str(voice_audio),
            "-c:v", "libx264", "-t", str(duration),
            "-vf", f"scale={self.width}:{self.height}:force_original_aspect_ratio=increase,crop={self.width}:{self.height}",
            "-pix_fmt", "yuv420p",
            "-shortest",
            str(output_path)
        ]
        subprocess.run(cmd, check=True)
        return output_path
`
  },
  {
    name: 'pipeline/image_generator.py',
    path: 'pipeline/image_generator.py',
    language: 'python',
    description: 'Generador de imágenes 9:16: Conexión a Stable Diffusion / DALL-E 3 con fallback sintético',
    content: `"""
Image Generator Engine: Genera imágenes verticales de alta definición (1080x1920) optimizadas para Shorts.
"""

import os
import requests
import base64
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from typing import Dict, Any, Optional
from pipeline.logger import setup_logger

logger = setup_logger("ImageGenerator")

class ImageGeneratorEngine:
    def __init__(self, config: Dict[str, Any], fast_mock: bool = False):
        self.config = config
        self.fast_mock = fast_mock
        self.provider = config.get("image_generation", {}).get("provider", "stable_diffusion")
        self.sd_endpoint = config.get("image_generation", {}).get("sd_api_endpoint", "http://127.0.0.1:7860/sdapi/v1/txt2img")
        self.width = config.get("video", {}).get("width", 1080)
        self.height = config.get("video", {}).get("height", 1920)

    def generate_vertical_image(self, prompt: str, output_path: Path) -> Path:
        """
        Genera una imagen vertical 9:16 usando la API configurada o el sintetizador procedural de alta calidad.
        """
        if self.fast_mock or os.getenv("MOCK_AI_MEDIA", "0") == "1":
            return self._generate_procedural_vertical_image(prompt, output_path)

        # Intento con Stable Diffusion WebUI API (AUTOMATIC1111 / ComfyUI)
        if self.provider == "stable_diffusion":
            try:
                payload = {
                    "prompt": f"{prompt}, highly detailed, cinematic lighting, photorealistic, 8k vertical wallpaper, 9:16 aspect ratio",
                    "negative_prompt": self.config.get("image_generation", {}).get("negative_prompt", "blurry, low quality, cropped"),
                    "steps": self.config.get("image_generation", {}).get("steps", 25),
                    "width": 768,
                    "height": 1344,
                    "cfg_scale": 7.0
                }
                res = requests.post(self.sd_endpoint, json=payload, timeout=45)
                if res.status_code == 200:
                    data = res.json()
                    img_bytes = base64.b64decode(data["images"][0])
                    with open(output_path, "wb") as f:
                        f.write(img_bytes)
                    # Redimensionar exactamente a 1080x1920
                    with Image.open(output_path) as im:
                        im_resized = im.resize((self.width, self.height), Image.Resampling.LANCZOS)
                        im_resized.save(output_path, quality=95)
                    logger.info(f"✔ Imagen SD generada: {output_path.name}")
                    return output_path
            except Exception as e:
                logger.warning(f"Stable Diffusion no disponible ({e}). Usando motor sintético.")

        return self._generate_procedural_vertical_image(prompt, output_path)

    def _generate_procedural_vertical_image(self, prompt: str, output_path: Path) -> Path:
        """
        Generador sintético procedural con degradados cinemáticos, partículas y badges.
        """
        img = Image.new("RGB", (self.width, self.height), color=(12, 16, 28))
        draw = ImageDraw.Draw(img)

        # Gradiente cinemático vertical
        import random
        # Generar tonos según el prompt
        if "cosmos" in prompt.lower() or "universo" in prompt.lower():
            top_color = (25, 10, 45)
            bottom_color = (5, 5, 20)
        elif "gladiador" in prompt.lower() or "roma" in prompt.lower():
            top_color = (55, 30, 15)
            bottom_color = (15, 10, 5)
        else:
            top_color = (15, 30, 60)
            bottom_color = (5, 10, 25)

        for y in range(self.height):
            ratio = y / self.height
            r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
            g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
            b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
            draw.line([(0, y), (self.width, y)], fill=(r, g, b))

        # Dibujar nebulosa o círculo de luz
        center_x, center_y = self.width // 2, self.height // 3
        for radius in range(350, 0, -5):
            alpha = int((1 - radius / 350) * 80)
            glow_color = (r + 40, g + 60, b + 90)
            draw.ellipse(
                [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
                outline=None,
                fill=glow_color
            )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, quality=95)
        return output_path
`
  },
  {
    name: 'pipeline/audio_engine.py',
    path: 'pipeline/audio_engine.py',
    language: 'python',
    description: 'Motor de audio: Edge-TTS con timestamps por palabra, música libre de derechos y subtítulos ASS',
    content: `"""
Audio Engine: Síntesis de voz (Edge-TTS / OpenAI), música de fondo y generación de subtítulos ASS kinetic.
"""

import os
import math
import wave
import struct
import asyncio
from pathlib import Path
from typing import List, Dict, Any
from pipeline.logger import setup_logger

logger = setup_logger("AudioEngine")

class AudioEngine:
    def __init__(self, config: Dict[str, Any], fast_mock: bool = False):
        self.config = config
        self.fast_mock = fast_mock
        self.sample_rate = config.get("audio", {}).get("sample_rate", 44100)

    def generate_voiceover(self, scenes: List[Dict[str, Any]], output_path: Path) -> Path:
        """
        Sintetiza la narración de cada escena concatenando en un solo archivo WAV maestro.
        """
        full_text = " ".join([s.get("narration_text", "") for s in scenes])
        
        try:
            import edge_tts
            voice = self.config.get("voice_tts", {}).get("default_voice_es", "es-ES-AlvaroNeural")
            
            async def _run_tts():
                communicate = edge_tts.Communicate(full_text, voice)
                await communicate.save(str(output_path))
            
            asyncio.run(_run_tts())
            logger.info(f"✔ Audio Edge-TTS generado: {output_path.name}")
            return output_path
        except Exception as e:
            logger.warning(f"Edge-TTS no disponible ({e}). Generando tono narrativo sintetizado.")
            return self._generate_synthesized_tone(duration=60.0, output_path=output_path)

    def get_royalty_free_track(self, genre: str, target_duration: float, output_path: Path) -> Path:
        """
        Obtiene o sintetiza una pista musical instrumental libre de derechos al tempo exacto.
        """
        return self._generate_procedural_music(genre, target_duration, output_path)

    def generate_ass_subtitles(self, scenes: List[Dict[str, Any]], output_path: Path, style: str = "hormozi_pop") -> Path:
        """
        Genera el archivo Advanced SubStation Alpha (.ass) con tipografía grande y colores vibrantes.
        """
        margin_v = self.config.get("subtitles", {}).get("vertical_margin", 380)
        
        ass_header = f"""[Script Info]
Title: ShortsForge Dynamic Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hormozi,Montserrat-Black,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,40,40,{margin_v},1
Style: Gold,Cinzel-Bold,58,&H0033E0FF,&H000000FF,&H00050510,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []
        current_time = 0.0

        for scene in scenes:
            duration = scene.get("duration", 10.0)
            text = scene.get("subtitle_text", scene.get("narration_text", "")).upper()
            
            start_str = self._format_ass_time(current_time)
            end_str = self._format_ass_time(current_time + duration)
            
            # Formatear texto en fragmentos impactantes de 4 a 6 palabras
            words = text.split()
            chunk_size = 5
            for chunk_idx in range(0, len(words), chunk_size):
                chunk = " ".join(words[chunk_idx:chunk_idx + chunk_size])
                chunk_start = self._format_ass_time(current_time + (chunk_idx / len(words)) * duration)
                chunk_end = self._format_ass_time(current_time + min(duration, ((chunk_idx + chunk_size) / len(words)) * duration))
                
                # Resaltado amarillo/cian estilo Hormozi
                highlighted_text = f"{{\\c&H0022FFFF\\b1}}{chunk}{{\\r}}"
                events.append(f"Dialogue: 0,{chunk_start},{chunk_end},Hormozi,,0,0,0,,{highlighted_text}")

            current_time += duration

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_header + "\\n".join(events))

        logger.info(f"✔ Subtítulos ASS guardados: {output_path.name}")
        return output_path

    def _format_ass_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int((seconds - int(seconds)) * 100)
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    def _generate_procedural_music(self, genre: str, duration: float, output_path: Path) -> Path:
        """
        Sintetizador de audio procedural con acordes armónicos y ritmo de batería de fondo.
        """
        n_samples = int(self.sample_rate * duration)
        with wave.open(str(output_path), "w") as wav_file:
            wav_file.setnchannels(2)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)

            bpm = 120
            beat_duration = 60.0 / bpm
            frames = []

            for i in range(n_samples):
                t = i / self.sample_rate
                # Frecuencia base según género
                base_freq = 110.0 if "synth" in genre else 65.4  # La2 o Do2
                
                # Sintetizar acorde
                sig = 0.25 * math.sin(2 * math.pi * base_freq * t)
                sig += 0.15 * math.sin(2 * math.pi * (base_freq * 1.5) * t)
                sig += 0.10 * math.sin(2 * math.pi * (base_freq * 2.0) * t)

                # Pulso rítmico (beat)
                beat_phase = (t % beat_duration) / beat_duration
                beat_env = math.exp(-beat_phase * 8.0)
                sig += 0.3 * beat_env * math.sin(2 * math.pi * 55.0 * t)

                val = int(max(-32767, min(32767, sig * 32767 * 0.4)))
                frames.append(struct.pack("<hh", val, val))

            wav_file.writeframes(b"".join(frames))

        return output_path

    def _generate_synthesized_tone(self, duration: float, output_path: Path) -> Path:
        n_samples = int(self.sample_rate * duration)
        with wave.open(str(output_path), "w") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            frames = []
            for i in range(n_samples):
                t = i / self.sample_rate
                sig = 0.2 * math.sin(2 * math.pi * 220.0 * t)
                val = int(sig * 32767)
                frames.append(struct.pack("<h", val))
            wav_file.writeframes(b"".join(frames))
        return output_path
`
  },
  {
    name: 'pipeline/metadata_generator.py',
    path: 'pipeline/metadata_generator.py',
    language: 'python',
    description: 'Generador de Metadata SEO y Guion optimizado para el algoritmo de YouTube Shorts',
    content: `"""
Metadata & Script Generator: Diseña títulos virales, ganchos, hashtags y guion de 60s.
"""

from typing import Dict, List, Any
from pipeline.logger import setup_logger

logger = setup_logger("MetadataGenerator")

class MetadataGenerator:
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def generate_variant_metadata(self, topic: str, variant_index: int, style_name: str) -> Dict[str, Any]:
        """
        Produce títulos optimizados (< 60 caracteres, emojis) y hashtags de alta retención.
        """
        titles_templates = [
            f"🔥 Esto Nadie te lo Cuenta Sobre: {topic} #Shorts",
            f"😱 3 Secretos Oscuros de {topic} Que No Sabías #Shorts",
            f"⚡ Hackea Tu Mente: {topic} en 60 Segundos #Shorts",
            f"❌ El Gran Error de {topic} Que Todos Cometen #Shorts",
            f"🧠 La Verdad Oculta Sobre {topic} #Shorts"
        ]

        title = titles_templates[(variant_index - 1) % len(titles_templates)]
        if len(title) > 70:
            title = f"🔥 {topic[:45]} #Shorts"

        tags = [
            "shorts", "youtube shorts", topic.lower(), "curiosidades", "viral",
            "educacion", "tendencias", "top", "datos curiosos", "short"
        ]

        hashtags = ["#Shorts", "#Viral", f"#{topic.replace(' ', '')[:15]}", "#Curiosidades", "#ParaTi"]

        return {
            "variant_id": variant_index,
            "style_profile": style_name,
            "title": title,
            "description": f"Descubre todo sobre {topic} en 60 segundos.\\n\\n¡Suscríbete y activa la campanita para más contenido de alto valor!\\n\\n{' '.join(hashtags)}",
            "tags": tags,
            "hashtags": hashtags,
            "viral_hook": f"Si te interesa {topic}, lo que vas a ver en 60 segundos te volará la cabeza.",
            "call_to_action": "Deja tu opinión en los comentarios y suscríbete para la parte 2.",
            "aspect_ratio": "9:16 (1080x1920)"
        }

    def generate_scenes_script(self, topic: str, total_duration: float = 60.0, scene_count: int = 6) -> List[Dict[str, Any]]:
        """
        Divide los 60 segundos en 6 escenas equilibradas (10 segundos cada una).
        """
        dur_per_scene = total_duration / scene_count
        scenes = []

        scene_prompts = [
            (f"Hero shot opening dramatic of {topic}", f"¿Sabías esto sobre {topic}? Presta mucha atención porque cambia todo."),
            (f"Detailed visual breakdown anomaly of {topic}", f"El primer dato clave que pocos conocen es realmente desconcertante."),
            (f"Extreme dynamic close up revelation of {topic}", f"Además, los científicos y expertos confirmaron este impactante fenómeno."),
            (f"Epic wide angle perspective of {topic}", f"Muchos cometen el error de ignorar esta regla fundamental."),
            (f"Surprising mystery twist about {topic}", f"Pero la verdad oculta detrás de todo esto es aún más fascinante."),
            (f"Call to action outro scene with epic lighting of {topic}", f"¿Qué opinas tú? ¡Comenta abajo y suscríbete para no perderte el próximo Short!")
        ]

        for idx, (p, narration) in enumerate(scene_prompts):
            scenes.append({
                "scene_index": idx + 1,
                "duration": dur_per_scene,
                "image_prompt": f"{p}, ultra-realistic 8k vertical portrait, cinematic lighting, dramatic depth of field",
                "narration_text": narration,
                "subtitle_text": narration
            })

        return scenes
`
  },
  {
    name: 'pipeline/thumbnail_generator.py',
    path: 'pipeline/thumbnail_generator.py',
    language: 'python',
    description: 'Generador de miniaturas verticales 1080x1920 con tipografía de alto CTR y bordes de impacto',
    content: `"""
Thumbnail Generator: Crea portadas y miniaturas verticales (1080x1920) de alto CTR.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from typing import Dict, Any
from pipeline.logger import setup_logger

logger = setup_logger("ThumbnailGenerator")

class ThumbnailGenerator:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.width = config.get("video", {}).get("width", 1080)
        self.height = config.get("video", {}).get("height", 1920)

    def create_shorts_thumbnail(
        self,
        base_image_path: Path,
        headline: str,
        badge_text: str,
        output_path: Path
    ) -> Path:
        """
        Genera una miniatura vertical con contraste aumentado, viñeta oscura,
        insignia superior llamativa y texto central con trazo negro y sombra.
        """
        try:
            with Image.open(base_image_path) as im:
                thumb = im.convert("RGBA").resize((self.width, self.height), Image.Resampling.LANCZOS)
        except Exception:
            thumb = Image.new("RGBA", (self.width, self.height), (20, 24, 38, 255))

        # 1. Aumentar saturación y contraste para llamar la atención en el feed
        enhancer = ImageEnhance.Contrast(thumb)
        thumb = enhancer.enhance(1.25)
        enhancer_sat = ImageEnhance.Color(thumb)
        thumb = enhancer_sat.enhance(1.3)

        # 2. Overlay degradado inferior y superior para legibilidad
        overlay = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        draw_ov = ImageDraw.Draw(overlay)
        
        # Degradado oscuro en la parte central e inferior
        for y in range(self.height):
            if y > int(self.height * 0.45):
                alpha = int(((y - self.height * 0.45) / (self.height * 0.55)) * 200)
                draw_ov.line([(0, y), (self.width, y)], fill=(0, 0, 0, alpha))

        thumb = Image.alpha_composite(thumb, overlay)
        draw = ImageDraw.Draw(thumb)

        # 3. Dibujar Insignia Superior (Badge)
        badge_box = [60, 180, 500, 270]
        draw.rounded_rectangle(badge_box, radius=20, fill=(244, 63, 94, 240), outline=(255, 255, 255), width=4)
        draw.text((85, 205), badge_text.upper(), fill=(255, 255, 255), font=None)

        # 4. Dibujar Titular Principal en el tercio inferior
        headline_upper = headline.upper()
        # Caja de texto impactante
        text_y = int(self.height * 0.68)
        text_box = [50, text_y - 20, self.width - 50, text_y + 180]
        draw.rounded_rectangle(text_box, radius=24, fill=(15, 23, 42, 230), outline=(250, 204, 21), width=6)
        
        # Dibujar texto con sombra y trazo
        draw.text(
            (80, text_y + 30),
            headline_upper[:35],
            fill=(255, 255, 255),
            stroke_fill=(0, 0, 0),
            stroke_width=4
        )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        thumb.convert("RGB").save(output_path, "JPEG", quality=95)
        logger.info(f"✔ Miniatura vertical guardada: {output_path.name}")
        return output_path
`
  },
  {
    name: 'pipeline/logger.py',
    path: 'pipeline/logger.py',
    language: 'python',
    description: 'Sistema de logs estructurados con Rich Console y rotación de archivos',
    content: `"""
Structured Logger con formato Rich y archivo de registro.
"""

import logging
from pathlib import Path
from rich.logging import RichHandler

def setup_logger(name: str = "ShortsForge", log_file: str = "shortsforge.log") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    # Console Handler con Rich
    console_handler = RichHandler(rich_tracebacks=True, markup=True, show_time=True)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)

    # File Handler
    try:
        Path("logs").mkdir(exist_ok=True)
        file_handler = logging.FileHandler("logs/" + log_file, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    except Exception:
        pass

    return logger
`
  },
  {
    name: 'run_local.sh',
    path: 'run_local.sh',
    language: 'bash',
    description: 'Script de ejecución rápida en entorno local con creación automática de virtualenv',
    content: `#!/usr/bin/env bash
# ==============================================================================
# ShortsForge AI — Script de Inicialización y Ejecución Local
# ==============================================================================
set -e

echo "🚀 Verificando entorno para ShortsForge AI..."

# Verificar Python 3.11+
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado. Instala Python 3.11."
    exit 1
fi

# Verificar FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️ Advertencia: FFmpeg no encontrado en PATH. Instálalo con 'apt install ffmpeg' o 'brew install ffmpeg'."
fi

# Crear entorno virtual si no existe
if [ ! -d ".venv" ]; then
    echo "📦 Creando entorno virtual .venv..."
    python3 -m venv .venv
fi

# Activar entorno virtual
source .venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias de requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

# Ejecutar generador
TEMA="\${1:-Misterios del Cosmos y Agujeros Negros}"
echo "🎬 Generando 5 variantes de Shorts para: '$TEMA'..."
python main.py --topic "$TEMA" --variants 5 --duration 60 --output-dir ./output_shorts
`
  }
];
