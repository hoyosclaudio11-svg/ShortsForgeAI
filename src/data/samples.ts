import { VideoProject } from '../types/video';

export const SAMPLE_SHORTS_PROJECTS: VideoProject[] = [
  {
    id: 'sample-cosmos-01',
    title: '3 Secretos del Cosmos Que DesafÃ­an la FÃ­sica',
    topic: 'Misterios del Cosmos y Agujeros Negros',
    variantIndex: 1,
    variantStyleName: 'Misterio & Suspenso Profundo',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    totalDuration: 30,
    fps: 30,
    musicGenre: 'dark_suspense',
    musicVolume: 0.4,
    voiceSpeed: 1.05,
    subtitleStyle: 'hormozi_bold',
    thumbnailUrl: 'https://images.pexels.com/photos/33441872/pexels-photo-33441872.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
    thumbnailHeadline: 'Â¡EL UNIVERSO ESTÃ COLAPSANDO!',
    thumbnailBadgeText: 'NO LO SABÃAS ðŸ˜±',
    createdAt: new Date().toISOString(),
    isPreRenderedSample: true,
    sampleFileName: 'misterios_del_cosmos_shorts.mp4',
    metadata: {
      title: 'ðŸŒŒ 3 Secretos del Universo Que NADIE Puede Explicar #Shorts',
      description: 'Descubre los 3 enigmas mÃ¡s aterradores del cosmos. Â¿QuÃ© hay mÃ¡s allÃ¡ de los agujeros negros? Â¿Por quÃ© la materia oscura no se puede ver? SuscrÃ­bete para mÃ¡s misterios cientÃ­ficos en 60 segundos.\n\nâ±ï¸ TIMESTAMPS:\n0:00 - La Gran Muralla del VacÃ­o\n0:20 - El Sonido de los Agujeros Negros\n0:40 - La Materia Fantasma\n\n#Shorts #Ciencia #Universo #Cosmos #Curiosidades #AstronomÃ­a #Viral',
      tags: ['shorts', 'universo', 'misterios', 'espacio', 'cosmos', 'agujeros negros', 'astronomia', 'curiosidades', 'ciencia', 'youtube shorts'],
      hashtags: ['#Shorts', '#Universo', '#Misterio', '#Ciencia', '#Cosmos', '#ViralShorts'],
      viralHook: 'Si creÃ­as que el universo estaba en calma, esto te volarÃ¡ la cabeza en 60 segundos.',
      callToAction: 'Â¡Comenta quÃ© misterio te da mÃ¡s miedo y suscrÃ­bete para la parte 2!',
      soundtrackName: 'Cosmic Void Drone â€” Royalty Free 432Hz Synth',
      targetAudience: 'Amantes de la ciencia, curiosidades, ciencia ficciÃ³n y misterios espaciales (16-35 aÃ±os)',
      estimatedCTR: 'Sin datos'
    },
    scenes: [
      {
        id: 'cosmos-s1',
        order: 1,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/33441872/pexels-photo-33441872.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Hyperrealistic deep space void, swirling dark matter cosmic clouds, neon ultraviolet nebula filaments, 8k vertical 9:16',
        narrationText: 'Hay un lugar en el cosmos donde no existe NADA. Un vacÃ­o absoluto de mil millones de aÃ±os luz llamado el VacÃ­o de BoÃ¶tes.',
        subtitles: {
          text: 'Existe un VACÃO ABSOLUTO de mil millones de aÃ±os luz...',
          words: [
            { word: 'Existe', start: 0.2, end: 1.0 },
            { word: 'un', start: 1.0, end: 1.4 },
            { word: 'VACÃO', start: 1.4, end: 2.5 },
            { word: 'ABSOLUTO', start: 2.5, end: 4.0 },
            { word: 'de', start: 4.0, end: 4.5 },
            { word: 'MIL', start: 4.5, end: 5.5 },
            { word: 'MILLONES', start: 5.5, end: 7.2 },
            { word: 'de', start: 7.2, end: 7.8 },
            { word: 'AÃ‘OS LUZ ðŸŒŒ', start: 7.8, end: 9.8 }
          ]
        },
        cameraMotion: 'zoom_in',
        transition: 'flash_white',
        filter: 'cinematic_warm',
        badge: 'SECRETO #1'
      },
      {
        id: 'cosmos-s2',
        order: 2,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/35496726/pexels-photo-35496726.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Orion nebula glowing in ultra-vivid magenta and cyan gas clouds with intense star formation, vertical 9:16 cinematic',
        narrationText: 'Los astrÃ³nomos esperaban encontrar miles de galaxias allÃ­. Pero sÃ³lo hallaron oscuridad total. Â¿QuÃ© absorbiÃ³ toda esa materia?',
        subtitles: {
          text: 'Solo hallaron OSCURIDAD TOTAL. Â¿QuÃ© devorÃ³ las galaxias?',
          words: [
            { word: 'Solo', start: 0.2, end: 1.2 },
            { word: 'hallaron', start: 1.2, end: 2.2 },
            { word: 'OSCURIDAD', start: 2.2, end: 3.8 },
            { word: 'TOTAL ðŸ•³ï¸', start: 3.8, end: 5.5 },
            { word: 'Â¿QuÃ©', start: 5.5, end: 6.2 },
            { word: 'devorÃ³', start: 6.2, end: 7.6 },
            { word: 'las', start: 7.6, end: 8.2 },
            { word: 'GALAXIAS?', start: 8.2, end: 9.8 }
          ]
        },
        cameraMotion: 'pan_right',
        transition: 'crossfade',
        filter: 'cyberpunk_neon',
        badge: 'ANOMALÃA'
      },
      {
        id: 'cosmos-s3',
        order: 3,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/33441883/pexels-photo-33441883.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Supermassive black hole event horizon swallowing light with an ultra-bright accretion disk, 9:16 vertical high quality',
        narrationText: 'Segundo secreto: La NASA logrÃ³ grabar ondas de presiÃ³n sonora emitidas por el agujero negro de Perseo. Â¡Suena aterrador!',
        subtitles: {
          text: 'La NASA grabÃ³ el SONIDO REAL de un Agujero Negro ðŸ”Š',
          words: [
            { word: 'La NASA', start: 0.2, end: 1.5 },
            { word: 'grabÃ³', start: 1.5, end: 2.5 },
            { word: 'el', start: 2.5, end: 2.9 },
            { word: 'SONIDO', start: 2.9, end: 4.2 },
            { word: 'REAL', start: 4.2, end: 5.8 },
            { word: 'de un', start: 5.8, end: 6.8 },
            { word: 'AGUJERO', start: 6.8, end: 8.2 },
            { word: 'NEGRO ðŸ”Š', start: 8.2, end: 9.8 }
          ]
        },
        cameraMotion: 'zoom_in',
        transition: 'glitch',
        filter: 'vivid_hyper',
        badge: 'SECRETO #2'
      },
      {
        id: 'cosmos-s4',
        order: 4,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/25752810/pexels-photo-25752810.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Vibrant cosmic dust clouds colliding in deep space, hyper-detailed particles, golden and violet lighting, 9:16 vertical',
        narrationText: 'Es una nota musical en Si bemol, pero 57 octavas por debajo de lo que el oÃ­do humano puede percibir directamente.',
        subtitles: {
          text: 'Una frecuencia 57 octavas por debajo de nuestro oÃ­do...',
          words: [
            { word: 'Una', start: 0.2, end: 1.0 },
            { word: 'frecuencia', start: 1.0, end: 2.5 },
            { word: '57 OCTAVAS', start: 2.5, end: 4.8 },
            { word: 'por debajo', start: 4.8, end: 6.5 },
            { word: 'de nuestro', start: 6.5, end: 7.8 },
            { word: 'OÃDO ðŸ§ ', start: 7.8, end: 9.8 }
          ]
        },
        cameraMotion: 'tilt_up',
        transition: 'wipe_left',
        filter: 'vintage_35mm',
        badge: 'FRECUENCIA'
      },
      {
        id: 'cosmos-s5',
        order: 5,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/30423900/pexels-photo-30423900.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Dark matter web scaffolding connecting distant galaxy superclusters, luminous ethereal threads, 9:16 vertical format',
        narrationText: 'Tercero: El 95% del universo es Materia y EnergÃ­a Oscura. Todo lo que vemos, planetas y estrellas, es solo el 5%.',
        subtitles: {
          text: 'El 95% del Universo es INVISIBLE para nosotros ðŸ‘ï¸',
          words: [
            { word: 'El 95%', start: 0.2, end: 2.0 },
            { word: 'del Universo', start: 2.0, end: 3.8 },
            { word: 'es', start: 3.8, end: 4.3 },
            { word: 'TOTALMENTE', start: 4.3, end: 6.0 },
            { word: 'INVISIBLE', start: 6.0, end: 7.9 },
            { word: 'PARA TI ðŸ‘ï¸', start: 7.9, end: 9.8 }
          ]
        },
        cameraMotion: 'zoom_out',
        transition: 'zoom_blur',
        filter: 'dark_vignette',
        badge: 'SECRETO #3'
      },
      {
        id: 'cosmos-s6',
        order: 6,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/33441876/pexels-photo-33441876.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Vortex of swirling galactic energy expanding to infinity, dazzling star clusters, 9:16 vertical 8k render',
        narrationText: 'Â¿Estamos solos en este inmenso ocÃ©ano? Deja tu teorÃ­a en comentarios y suscrÃ­bete para la parte dos.',
        subtitles: {
          text: 'Â¿Crees que estamos SOLOS? Â¡Comenta y SuscrÃ­bete! ðŸš€',
          words: [
            { word: 'Â¿Crees', start: 0.2, end: 1.2 },
            { word: 'que estamos', start: 1.2, end: 2.5 },
            { word: 'SOLOS? ðŸ‘½', start: 2.5, end: 4.5 },
            { word: 'Deja tu', start: 4.5, end: 5.8 },
            { word: 'opiniÃ³n y', start: 5.8, end: 7.2 },
            { word: 'Â¡SUSCRÃBETE! ðŸš€', start: 7.2, end: 9.8 }
          ]
        },
        cameraMotion: 'dolly_shake',
        transition: 'flash_white',
        filter: 'cinematic_warm',
        badge: 'Â¿QUÃ‰ OPINAS?'
      }
    ]
  },
  {
    id: 'sample-productivity-02',
    title: '5 HÃ¡bitos de Productividad Extrema de CEOs',
    topic: 'Productividad y Enfoque Mental',
    variantIndex: 2,
    variantStyleName: 'Listicle de Alta EnergÃ­a / Hormozi',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    totalDuration: 30,
    fps: 30,
    musicGenre: 'synthwave_pulse',
    musicVolume: 0.38,
    voiceSpeed: 1.12,
    subtitleStyle: 'hormozi_bold',
    thumbnailUrl: 'https://images.pexels.com/photos/30838494/pexels-photo-30838494.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
    thumbnailHeadline: 'Â¡HACKEA TU CEREBRO EN 24H!',
    thumbnailBadgeText: '5 HÃBITOS âš¡',
    createdAt: new Date().toISOString(),
    isPreRenderedSample: true,
    sampleFileName: '5_habitos_productividad_extrema.mp4',
    metadata: {
      title: 'âš¡ 5 HÃ¡bitos Matutinos Que Te HarÃ¡n x10 MÃ¡s Productivo #Shorts',
      description: 'Aplica estos 5 hÃ¡bitos de alto impacto usados por los CEOs mÃ¡s exitosos del mundo para multiplicar tu energÃ­a y enfoque en 60 segundos.\n\nâ±ï¸ HÃBITOS:\n0:00 - Regla de los 90 Minutos\n0:12 - Ducha de Dopamina\n0:24 - Bloqueo de Notificaciones\n0:36 - La Tarea Rana (Deep Work)\n0:48 - Cierre del DÃ­a Sin Pantallas\n\n#Shorts #Productividad #Disciplina #Exito #Habitos #Mindset #DesarrolloPersonal',
      tags: ['shorts', 'productividad', 'habitos', 'exito', 'disciplina', 'enfoque', 'rutina matutina', 'crecimiento personal', 'consejos'],
      hashtags: ['#Shorts', '#Productividad', '#Habitos', '#Exito', '#Mindset', '#Viral'],
      viralHook: 'Si sientes que el dÃ­a no te rinde, estos 5 hÃ¡bitos cambiarÃ¡n tu vida para siempre.',
      callToAction: 'Guarda este Short para aplicarlo maÃ±ana a primera hora.',
      soundtrackName: 'Midnight Cyber Drive â€” Upbeat Synthwave 128 BPM',
      targetAudience: 'Estudiantes, emprendedores, creadores y profesionales que buscan alto rendimiento',
      estimatedCTR: 'Sin datos'
    },
    scenes: [
      {
        id: 'prod-s1',
        order: 1,
        duration: 6,
        imageUrl: 'https://images.pexels.com/photos/30838494/pexels-photo-30838494.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Futuristic glowing wristwatch at dawn, high precision neon dial, modern dark desk aesthetic, vertical 9:16',
        narrationText: 'HÃ¡bito uno: La regla de los 90 minutos. Dedica los primeros 90 minutos de tu dÃ­a exclusivamente a tu proyecto mÃ¡s importante.',
        subtitles: {
          text: 'HÃBITO #1: La Regla de Oro de los 90 Minutos â±ï¸',
          words: [
            { word: 'HÃBITO #1:', start: 0.2, end: 1.8 },
            { word: 'La Regla', start: 1.8, end: 3.0 },
            { word: 'de Oro', start: 3.0, end: 4.2 },
            { word: 'de los', start: 4.2, end: 5.0 },
            { word: '90 MINUTOS', start: 5.0, end: 7.5 },
            { word: 'SIN DISTRACCIONES ðŸš«', start: 7.5, end: 11.5 }
          ]
        },
        cameraMotion: 'zoom_in',
        transition: 'flash_white',
        filter: 'cyberpunk_neon',
        badge: 'HÃBITO #1'
      },
      {
        id: 'prod-s2',
        order: 2,
        duration: 6,
        imageUrl: 'https://images.pexels.com/photos/19935026/pexels-photo-19935026.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Cozy modern minimalist morning coffee workspace, soft sunlight hitting laptop, vertical 9:16 clean shot',
        narrationText: 'HÃ¡bito dos: Cero redes sociales antes de las 10 AM. Proteger tu atenciÃ³n matutina evita los picos tempranos de cortisol.',
        subtitles: {
          text: 'HÃBITO #2: Cero TelÃ©fono antes de las 10:00 AM ðŸ“±âŒ',
          words: [
            { word: 'HÃBITO #2:', start: 0.2, end: 1.6 },
            { word: 'CERO', start: 1.6, end: 2.8 },
            { word: 'TELÃ‰FONO', start: 2.8, end: 4.5 },
            { word: 'antes de las', start: 4.5, end: 6.2 },
            { word: '10:00 AM', start: 6.2, end: 8.5 },
            { word: 'PROTEGE TU FOCO ðŸ›¡ï¸', start: 8.5, end: 11.5 }
          ]
        },
        cameraMotion: 'pan_left',
        transition: 'wipe_left',
        filter: 'cinematic_warm',
        badge: 'HÃBITO #2'
      },
      {
        id: 'prod-s3',
        order: 3,
        duration: 6,
        imageUrl: 'https://images.pexels.com/photos/5477685/pexels-photo-5477685.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Modern minimalist white analog wall clock with vibrant blue office tools, overhead crisp studio light, 9:16 vertical',
        narrationText: 'HÃ¡bito tres: La tÃ©cnica Pomodoro 50/10. Trabaja 50 minutos con foco lÃ¡ser y descansa 10 minutos caminando sin pantallas.',
        subtitles: {
          text: 'HÃBITO #3: Bloques de Enfoque LÃ¡ser 50/10 ðŸŽ¯',
          words: [
            { word: 'HÃBITO #3:', start: 0.2, end: 1.6 },
            { word: 'Bloques de', start: 1.6, end: 3.0 },
            { word: 'ENFOQUE', start: 3.0, end: 4.5 },
            { word: 'LÃSER 50/10', start: 4.5, end: 7.2 },
            { word: 'DESCANSA', start: 7.2, end: 8.8 },
            { word: 'CAMINANDO ðŸš¶', start: 8.8, end: 11.5 }
          ]
        },
        cameraMotion: 'zoom_out',
        transition: 'push_up',
        filter: 'natural',
        badge: 'HÃBITO #3'
      },
      {
        id: 'prod-s4',
        order: 4,
        duration: 6,
        imageUrl: 'https://images.pexels.com/photos/7818231/pexels-photo-7818231.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Minimalist workspace with digital code and notebook displaying big bold goals, warm golden lighting, 9:16 vertical',
        narrationText: 'HÃ¡bito cuatro: Come la rana primero. Haz la tarea mÃ¡s difÃ­cil y temida nada mÃ¡s empezar la jornada para liberar tu mente.',
        subtitles: {
          text: 'HÃBITO #4: Haz lo MÃS DIFÃCIL primero ðŸ¸âš¡',
          words: [
            { word: 'HÃBITO #4:', start: 0.2, end: 1.8 },
            { word: 'Haz lo', start: 1.8, end: 2.8 },
            { word: 'MÃS DIFÃCIL', start: 2.8, end: 5.2 },
            { word: 'nada mÃ¡s', start: 5.2, end: 6.8 },
            { word: 'EMPEZAR', start: 6.8, end: 8.6 },
            { word: 'EL DÃA ðŸš€', start: 8.6, end: 11.5 }
          ]
        },
        cameraMotion: 'tilt_down',
        transition: 'crossfade',
        filter: 'vivid_hyper',
        badge: 'HÃBITO #4'
      },
      {
        id: 'prod-s5',
        order: 5,
        duration: 6,
        imageUrl: 'https://images.pexels.com/photos/23228196/pexels-photo-23228196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Evening minimalist wooden desk with warm desk lamp illuminating an organized planner and tea, 9:16 vertical',
        narrationText: 'HÃ¡bito cinco: AuditorÃ­a nocturna de tres minutos. Planifica tus tres victorias de maÃ±ana antes de dormir.',
        subtitles: {
          text: 'HÃBITO #5: Define 3 Victorias antes de Dormir ðŸ†',
          words: [
            { word: 'HÃBITO #5:', start: 0.2, end: 1.8 },
            { word: 'Define tus', start: 1.8, end: 3.2 },
            { word: '3 VICTORIAS', start: 3.2, end: 5.8 },
            { word: 'para maÃ±ana.', start: 5.8, end: 7.8 },
            { word: 'Â¡GUARDA ESTE', start: 7.8, end: 9.4 },
            { word: 'SHORT! ðŸ“Œ', start: 9.4, end: 11.5 }
          ]
        },
        cameraMotion: 'dolly_shake',
        transition: 'flash_white',
        filter: 'cinematic_warm',
        badge: 'HÃBITO #5'
      }
    ]
  },
  {
    id: 'sample-rome-03',
    title: 'La Brutal Verdad de los Gladiadores de Roma',
    topic: 'Historia Ã‰pica y Gladiadores Romanos',
    variantIndex: 3,
    variantStyleName: 'CinemÃ¡tico Documental / Oro Antiguo',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    totalDuration: 30,
    fps: 30,
    musicGenre: 'cinematic_epic',
    musicVolume: 0.42,
    voiceSpeed: 1.0,
    subtitleStyle: 'cinematic_gold',
    thumbnailUrl: 'https://images.pexels.com/photos/29710611/pexels-photo-29710611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
    thumbnailHeadline: 'Â¡TODO LO QUE CREÃAS ERA MENTIRA!',
    thumbnailBadgeText: 'ROMA ANTIGUA âš”ï¸',
    createdAt: new Date().toISOString(),
    isPreRenderedSample: true,
    sampleFileName: 'enigmas_roma_antigua_gladiadores.mp4',
    metadata: {
      title: 'âš”ï¸ El Mito de los Gladiadores Romanos Que Hollywood te OcultÃ³ #Shorts',
      description: 'Casi todo lo que viste en las pelÃ­culas sobre gladiadores es falso. No morÃ­an en cada combate ni luchaban sin reglas. Conoce la realidad arqueolÃ³gica de Roma en 60 segundos.\n\nâ±ï¸ CAPÃTULOS:\n0:00 - Las Reglas del Coliseo\n0:15 - El Negocio Millonario\n0:30 - La Dieta Vegetariana de los Guerreros\n0:45 - Los Pulgares Hacia Arriba\n\n#Shorts #Historia #RomaAntigua #Gladiadores #Coliseo #Curiosidades #Educacion',
      tags: ['shorts', 'gladiadores', 'roma', 'historia', 'coliseo romano', 'imperio romano', 'curiosidades historicas', 'arqueologia'],
      hashtags: ['#Shorts', '#Historia', '#Roma', '#Gladiadores', '#Coliseo', '#ViralShorts'],
      viralHook: 'Hollywood te mintiÃ³ sobre los gladiadores de Roma, y esta es la impactante prueba.',
      callToAction: 'Â¿Te gustarÃ­a haber vivido en la Roma Imperial? Comenta abajo.',
      soundtrackName: 'Epic Gladiator Horns â€” Cinematic Battle Orchestra',
      targetAudience: 'Aficionados a la historia bÃ©lica, documentales, cine y curiosidades del mundo antiguo',
      estimatedCTR: 'Sin datos'
    },
    scenes: [
      {
        id: 'rome-s1',
        order: 1,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/29710611/pexels-photo-29710611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Ancient Roman gladiator marble bust sculpture in dramatic moody golden museum lighting, 9:16 vertical 8k',
        narrationText: 'Casi todo lo que Hollywood te enseÃ±Ã³ sobre los gladiadores es una completa mentira histÃ³rica.',
        subtitles: {
          text: 'Hollywood te MINTIÃ“ sobre los gladiadores de Roma âš”ï¸',
          words: [
            { word: 'Hollywood', start: 0.2, end: 1.5 },
            { word: 'te MINTIÃ“', start: 1.5, end: 3.5 },
            { word: 'sobre los', start: 3.5, end: 4.8 },
            { word: 'GLADIADORES', start: 4.8, end: 7.2 },
            { word: 'DE ROMA ðŸ›ï¸', start: 7.2, end: 9.8 }
          ]
        },
        cameraMotion: 'zoom_in',
        transition: 'flash_white',
        filter: 'cinematic_warm',
        badge: 'MITO VS REALIDAD'
      },
      {
        id: 'rome-s2',
        order: 2,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/25365241/pexels-photo-25365241.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Epic low angle shot of the Roman Colosseum under dramatic sunset clouds with golden stone arches, 9:16 vertical',
        narrationText: 'Primero: No morÃ­an en cada combate. Entrenar a un gladiador costaba una fortuna a los lanistas.',
        subtitles: {
          text: 'NO MORÃAN en cada combate: Eran atletas millonarios ðŸ’°',
          words: [
            { word: 'NO MORÃAN', start: 0.2, end: 2.2 },
            { word: 'en cada combate:', start: 2.2, end: 4.5 },
            { word: 'Eran atletas', start: 4.5, end: 6.8 },
            { word: 'MILLONARIOS ðŸ’°', start: 6.8, end: 9.8 }
          ]
        },
        cameraMotion: 'pan_left',
        transition: 'crossfade',
        filter: 'vintage_35mm',
        badge: 'DATO #1'
      },
      {
        id: 'rome-s3',
        order: 3,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/32981273/pexels-photo-32981273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Roman legionary gladiator in ornate iron and bronze armor looking intensely at the arena, 9:16 vertical',
        narrationText: 'HabÃ­a Ã¡rbitros en la arena que detenÃ­an la pelea de inmediato si uno de los dos resultaba herido gravemente.',
        subtitles: {
          text: 'HabÃ­a ÃRBITROS con varas que frenaban el combate ðŸ›‘',
          words: [
            { word: 'HabÃ­a', start: 0.2, end: 1.0 },
            { word: 'ÃRBITROS', start: 1.0, end: 2.8 },
            { word: 'con varas', start: 2.8, end: 4.5 },
            { word: 'que FRENABAN', start: 4.5, end: 6.8 },
            { word: 'el combate ðŸ›‘', start: 6.8, end: 9.8 }
          ]
        },
        cameraMotion: 'zoom_out',
        transition: 'wipe_left',
        filter: 'noir_contrast',
        badge: 'REGLAMENTO'
      },
      {
        id: 'rome-s4',
        order: 4,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/33549725/pexels-photo-33549725.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Spectacular sunset light streaming through Colosseum arena arches, dust motes in golden light, 9:16 vertical',
        narrationText: 'Segundo secreto: Su dieta era casi vegetariana. ComÃ­an cebada, frijoles y cenizas ricas en calcio para endurecer sus huesos.',
        subtitles: {
          text: 'Su dieta era VEGETARIANA: Cebada y cenizas de calcio ðŸŒ¾',
          words: [
            { word: 'Su dieta', start: 0.2, end: 1.6 },
            { word: 'era', start: 1.6, end: 2.2 },
            { word: 'VEGETARIANA:', start: 2.2, end: 4.5 },
            { word: 'Cebada y', start: 4.5, end: 6.5 },
            { word: 'CENIZAS', start: 6.5, end: 8.2 },
            { word: 'DE CALCIO ðŸŒ¾', start: 8.2, end: 9.8 }
          ]
        },
        cameraMotion: 'tilt_up',
        transition: 'zoom_blur',
        filter: 'cinematic_warm',
        badge: 'DATO #2'
      },
      {
        id: 'rome-s5',
        order: 5,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/33594268/pexels-photo-33594268.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Epic classical Roman heroic statue overlooking empire under dramatic stormy skies, vertical 9:16 composition',
        narrationText: 'Y el gesto del pulgar: Un pulgar hacia arriba significaba desenvainar la espada y ejecutar; hacia abajo significaba perdÃ³n.',
        subtitles: {
          text: 'Â¡El pulgar hacia ARRIBA significaba MUERTE! ðŸ‘Žâž¡ï¸ðŸ‘',
          words: [
            { word: 'Â¡El pulgar', start: 0.2, end: 1.8 },
            { word: 'hacia ARRIBA', start: 1.8, end: 4.0 },
            { word: 'significaba', start: 4.0, end: 5.8 },
            { word: 'LA MUERTE! âš”ï¸', start: 5.8, end: 7.8 },
            { word: 'El cine', start: 7.8, end: 8.6 },
            { word: 'lo invirtiÃ³.', start: 8.6, end: 9.8 }
          ]
        },
        cameraMotion: 'pan_right',
        transition: 'push_up',
        filter: 'vintage_35mm',
        badge: 'DATO #3'
      },
      {
        id: 'rome-s6',
        order: 6,
        duration: 5,
        imageUrl: 'https://images.pexels.com/photos/32281485/pexels-photo-32281485.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        imagePrompt: 'Ancient Roman sunbeam through arena ruins, heroic gladiator shadow, 9:16 vertical dramatic',
        narrationText: 'Â¿Hubieras sobrevivido un dÃ­a en el Coliseo? SuscrÃ­bete para mÃ¡s secretos de la historia antigua.',
        subtitles: {
          text: 'Â¿HabrÃ­as sobrevivido en Roma? Â¡Comenta y SuscrÃ­bete! ðŸ›ï¸',
          words: [
            { word: 'Â¿HabrÃ­as', start: 0.2, end: 1.5 },
            { word: 'sobrevivido', start: 1.5, end: 3.5 },
            { word: 'en Roma? ðŸ›ï¸', start: 3.5, end: 5.8 },
            { word: 'Â¡Deja tu comentario', start: 5.8, end: 7.8 },
            { word: 'y SUSCRÃBETE! ðŸ””', start: 7.8, end: 9.8 }
          ]
        },
        cameraMotion: 'dolly_shake',
        transition: 'flash_white',
        filter: 'cinematic_warm',
        badge: 'Â¿QUÃ‰ HARÃAS?'
      }
    ]
  },

  {
    "id":  "sample-nube-01",
    "title":  "El gato que quería volar ⚡ Su sueño imposible se hizo realidad",
    "topic":  "Cuento corto: un gato callejero llamado Nube que soñaba con volar",
    "variantIndex":  1,
    "variantStyleName":  "🎬 IA · Guion Cinemático (LLM)",
    "aspectRatio":  "9:16",
    "width":  1080,
    "height":  1920,
    "totalDuration":  30,
    "fps":  30,
    "musicGenre":  "cinematic_epic",
    "musicVolume":  0.35,
    "voiceSpeed":  1.05,
    "subtitleStyle":  "cinematic_gold",
    "thumbnailUrl":  "/genimg/img-2-1788300246811",
    "thumbnailHeadline":  "Nube no era un gato normal... soñaba con tocar las nubes",
    "thumbnailBadgeText":  "HISTORIA 🎬",
    "createdAt":  "2026-09-01T20:40:00.000Z",
    "isPreRenderedSample":  true,
    "sampleFileName":  "nube_el_gato_que_queria_volar.mp4",
    "metadata":  {
                     "title":  "El gato que quería volar ⚡ Su sueño imposible se hizo realidad",
                     "description":  "La increíble historia de Nube, un gato callejero que desafió todas las leyes de la gravedad por su sueño de volar. #shorts #cuentocorto",
                     "tags":  [
                                  "shorts",
                                  "cuento",
                                  "historia",
                                  "gato",
                                  "viral"
                              ],
                     "hashtags":  [
                                      "#Shorts",
                                      "#Gatos",
                                      "#CuentosCortos",
                                      "#Animación",
                                      "#Sueños"
                                  ],
                     "viralHook":  "Nube no era un gato normal... soñaba con tocar las nubes",
                     "callToAction":  "¿Qué sueño imposible tienes tú? ¡Cuéntame en comentarios!",
                     "soundtrackName":  "CINEMATIC EPIC — Royalty Free Studio Master",
                     "targetAudience":  "Audiencia general de cuentos e historias en formato vertical",
                     "estimatedCTR":  'Sin datos'
                 },
    "scenes":  [
                   {
                       "id":  "nube-s1",
                       "order":  1,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-2-1788300246811",
                       "imagePrompt":  "Close-up vertical de un gato gris con ojos azules brillantes mirando hacia el cielo, atardecer naranja, estilo ilustración 3D realista, detalles 8K",
                       "narrationText":  "Nube era un gato callejero diferente. Mientras otros cazaban ratones, él pasaba horas mirando a los pájaros con ojos de envidia. Quería volar.",
                       "subtitles":  {
                                         "text":  "Un gato que soñaba con volar"
                                     },
                       "cameraMotion":  "zoom_in",
                       "transition":  "crossfade",
                       "filter":  "cinematic_warm",
                       "badge":  "INICIO"
                   },
                   {
                       "id":  "nube-s2",
                       "order":  2,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-3-1788300265224",
                       "imagePrompt":  "Gato gris saltando desde un tejado rojo en plena ciudad, patas extendidas como alas, estilo cinematográfico con iluminación dramática",
                       "narrationText":  "Los otros gatos se burlaban: \u0027Eres un felino, no un pájaro\u0027. Pero Nube no escuchó. Comenzó a saltar desde tejados, aleteando sus patas como alas.",
                       "subtitles":  {
                                         "text":  "Todos se reían de su sueño"
                                     },
                       "cameraMotion":  "pan_left",
                       "transition":  "wipe_left",
                       "filter":  "cinematic_warm",
                       "badge":  "PERSONAJES"
                   },
                   {
                       "id":  "nube-s3",
                       "order":  3,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-4-1788300284289",
                       "imagePrompt":  "Gato gris acurrucado junto a paloma blanca con ala herida en un callejón oscuro, luz lunar filtrándose, estilo realismo mágico 8K",
                       "narrationText":  "Un día conoció a una paloma herida que no podía volar. Nube la cuidó y ella, al recuperarse, le enseñó todos sus secretos sobre el viento.",
                       "subtitles":  {
                                         "text":  "La paloma que lo cambió todo"
                                     },
                       "cameraMotion":  "zoom_out",
                       "transition":  "crossfade",
                       "filter":  "cinematic_warm",
                       "badge":  "CONFLICTO"
                   },
                   {
                       "id":  "nube-s4",
                       "order":  4,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-5-1788300318523",
                       "imagePrompt":  "Gato en lo alto de rascacielos al atardecer, pelaje ondeando con el viento, ciudad difuminada abajo, perspectiva épica vertical",
                       "narrationText":  "El secreto era esperar el viento perfecto. Nube subió al edificio más alto del barrio. Los gatos abajo se burlaban: \u0027Se va a matar el tonto\u0027.",
                       "subtitles":  {
                                         "text":  "El salto que cambiaría todo"
                                     },
                       "cameraMotion":  "tilt_up",
                       "transition":  "zoom_blur",
                       "filter":  "cinematic_warm",
                       "badge":  "EL GIRO"
                   },
                   {
                       "id":  "nube-s5",
                       "order":  5,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-6-1788300337399",
                       "imagePrompt":  "Gato gris suspendido en el aire entre nubes doradas, patas extendidas como planeando, expresión de éxtasis, cielo épico 8K",
                       "narrationText":  "Nube saltó... y esta vez no cayó. El viento lo atrapó, sus patas se movieron exactamente como la paloma le enseñó. ¡Estaba volando! Los gatos abajo no lo podían creer.",
                       "subtitles":  {
                                         "text":  "El momento en que Nube voló"
                                     },
                       "cameraMotion":  "zoom_in",
                       "transition":  "push_up",
                       "filter":  "cinematic_warm",
                       "badge":  "CLÍMAX"
                   },
                   {
                       "id":  "nube-s6",
                       "order":  6,
                       "duration":  10,
                       "imageUrl":  "/genimg/img-7-1788300356281",
                       "imagePrompt":  "Silueta de gato volando contra luna llena, ciudad iluminada abajo, estilo cinematográfico épico, tonos azules y plateados, ultra HD",
                       "narrationText":  "Desde ese día, Nube el gato volador se hizo leyenda. Su historia nos enseña que hasta los sueños más imposibles pueden volverse realidad... si tienes el valor de saltar.",
                       "subtitles":  {
                                         "text":  "Los sueños sí se cumplen"
                                     },
                       "cameraMotion":  "dolly_shake",
                       "transition":  "flash_white",
                       "filter":  "cinematic_warm",
                       "badge":  "MORALEJA"
                   }
               ]
}
];
