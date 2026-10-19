# Editar el juego

Este documento **es** la configuración del juego. Cambia un número o una frase, guarda, y el juego cambia.

**Cómo editarlo desde el móvil:** abre este archivo en github.com → ✏️ (lápiz) → cambia lo que quieras → *Commit changes*. En un minuto GitHub aplica el cambio solo y deja un commit «Aplicar EDITAR_JUEGO.md». Si algo está mal escrito, la acción de GitHub sale en rojo con la línea exacta y el juego no cambia.

**Reglas para no romper nada:**

- Cambia sólo lo que va **después de los dos puntos** (`- **Etiqueta:** valor`). No cambies las etiquetas en negrita.
- Las líneas con sangría (las que empiezan con espacios, en gris al verlo) son **notas de ayuda**: se regeneran solas, editarlas no cambia nada.
- Los decimales pueden ir con coma (`4,5`) o punto (`4.5`).
- Para añadir una frase, añade otra línea `- …` en su grupo. Para quitarla, borra la línea (cada grupo necesita al menos una).
- Escribe notas libres para el equipo al final, en **Notas de revisión**: es lo único que se conserva tal cual.

<!-- sección: ajustes -->
## 1. Ajustes de la guardia

- **Vidas al empezar:** 3
  - Entre 1 y 9.
- **Monedas de un jugador nuevo:** 150
  - Sólo afecta a quien juega por primera vez.
- **Segundos por pregunta:** 45
  - Reloj completo, sin racha.
- **Segundos mínimos con racha larga:** 15
  - La racha nunca baja el reloj de aquí.
- **Cuánto aprieta la racha al reloj:** 4,5
  - 0 = la racha no acorta el reloj. 4,5 = actual.
- **Milisegundos antes del avance automático:** 3500
  - 3500 = 3,5 segundos para leer la retroalimentación.
- **Pausa antes de mostrar la retroalimentación (ms):** 450
  - Deja ver qué opción era la correcta.
- **Monedas por acierto:** 25
  - Antes de bonos.
- **Experiencia por acierto:** 50
  - La experiencia sube el rango (R1 → LEYENDA).
- **Bono máximo por rapidez:** 30
  - Monedas extra si respondes con el reloj intacto.
- **Reloj restante para contar como reflejo:** 0,6
  - Entre 0 y 1. 0,6 = con el 60 % del reloj aún por gastar.
- **Aciertos seguidos para subir el multiplicador:** 3
  - Cada escalón suma ×0,5.
- **Multiplicador máximo:** 3
  - 3 = la racha triplica como mucho.
- **Multa por firmar una nota equivocada:** 60
  - Firmar dobla lo ganado si aciertas.
- **Pacientes por pase de visita:** 5
  - Cada cuántos pacientes evalúa el Dr. Celada.
- **Precio de la pista:** 50
  - Descarta una opción incorrecta.
- **Precio de una vida:** 100
- **Precio del tiempo extra:** 30
- **Segundos que compra el tiempo extra:** 30

<!-- sección: briefing -->
## 2. Briefing del menú (lo que dice el Dr. Celada)

- **Presentación:** Estás de guardia. No eres observador: decides con información incompleta en un servicio saturado.
- **Regla:** Decide con la información disponible: no siempre tendrás el panorama completo.
- **Regla:** Responde rápido: el reloj que te sobra se paga en monedas, y cada racha lo acorta.
- **Regla:** Firma la nota si estás seguro: cobras el doble, o pagas la multa.
- **Regla:** Cada {pase} pacientes el Dr. Celada pasa lista y reparte bono.
- **Cierre:** El error honesto pesa menos que una decisión mal razonada.
  - `{pase}` se sustituye por el número de «Pacientes por pase de visita».

<!-- sección: residentes -->
## 3. Residentes

Cada bloque es un residente. Para añadir uno, copia un bloque entero: el sprite debe existir en `assets/sprites/`.

### Dra. Aguilar
- **Frase propia:** Ya lo interrogué; te resumo lo importante.
- **Sprite:** aguilar_atlas.png

### Dr. Solis
- **Frase propia:** Yo ya le hubiera dado algo, pero mejor dime tú.
- **Sprite:** solis_atlas.png

### Dra. Ríos
- **Frase propia:** Con calma: los datos están completos, la decisión es tuya.
- **Sprite:** rios_atlas.png

### Dr. Mendoza
- **Frase propia:** No me gusta cómo se ve… ¿lo checas conmigo?
- **Sprite:** mendoza_atlas.png

### Dra. Ferrer
- **Frase propia:** Te lo pongo en una línea: hay que decidir ya.
- **Sprite:** ferrer_atlas.png

### Dr. Castañeda
- **Frase propia:** El interrogatorio no me cuadra del todo, júzgalo tú.
- **Sprite:** castaneda_atlas.png

### Dra. Herrera
- **Frase propia:** La familia está afuera preguntando. ¿Qué les digo?
- **Sprite:** herrera_atlas.png

### Dr. Valdez
- **Frase propia:** Tranquilidad… bueno, la que se pueda a esta hora.
- **Sprite:** valdez_atlas.png

<!-- sección: frases -->
## 4. Frases de los residentes

El juego elige una al azar de cada grupo, sin repetir la última.

### Presenta un paciente estable <!-- presentNormal -->
- No tengo tiempo para revisar todo, dime qué hacemos.
- Esto puede esperar… o no. Tú decides.
- Si lo mandamos a casa y se complica, va a rebotar.
- Te presento el caso; la sala está llena y hay prisa.
- Ya está el expediente. ¿Cuál es tu impresión?

### Presenta un paciente agitado <!-- presentTachy -->
- Viene muy agitado, apenas podemos contenerlo. ¿Qué hacemos?
- Está taquicárdico y no coopera. Necesito una indicación ya.
- Se altera más con cada minuto. Tú decides.
- Seguridad ya está enterada, pero esto es clínico. ¿Indicaciones?

### Presenta un paciente hipoactivo <!-- presentBrady -->
- Casi no responde; lo trajeron los familiares.
- Lleva horas sin moverse ni comer. Esto no me gusta.
- Hipoactivo, apenas contesta. ¿Por dónde empezamos?

### Tras un acierto <!-- ok -->
- ¡Eso! Ya lo estamos indicando.
- De acuerdo, tiene sentido. Procedo.
- Bien visto. Aviso a enfermería.
- Anotado. El paciente va a agradecerlo.

### Tras un acierto en racha (3 o más) <!-- okStreak -->
- Otra más… hoy estás en modo intratable.
- Así da gusto pasar la guardia.
- El Dr. Celada tiene que estar viendo esto.
- A este ritmo, vaciamos la sala antes del cambio de turno.

### Tras acertar con la nota firmada <!-- okSigned -->
- Firmaste y acertaste. Eso es tenerlas bien puestas.
- Con tu firma encima y salió limpio. Impresionante.
- Te comprometiste y el paciente lo agradece.

### Tras un error <!-- error -->
- ¿Seguro? El paciente no va bien…
- Uy… eso no salió como esperábamos.
- Se complicó. Hay que replantear.
- El adscrito va a preguntar por esto…

### Tras fallar con la nota firmada <!-- errorSigned -->
- Ay… y lo habías firmado. Eso va a doler.
- Firmaste esa nota. El adscrito la va a leer.
- Con tu nombre encima. Vamos a tener que rehacerlo.

### Cuando se agota el reloj <!-- timeout -->
- Nos quedamos pensando demasiado…
- No decidimos a tiempo; ya intervino el adscrito.
- La demora también es una decisión, y esta costó.

### Cuando el paciente se descompensa <!-- decompensated -->
- ¡Se nos está yendo! Necesito una maniobra de rescate ya.
- Reaccionó mal a lo anterior y ahora está inestable. ¿Qué hacemos?
- Se descompensó. No hay margen para otra equivocación.
- Está peor que hace un minuto. Rápido, ¿qué indicamos?

### Cuando el paciente se estabiliza <!-- rescued -->
- Lo estabilizaste. Respiramos otra vez.
- Ya remonta. Buen rescate.
- Vuelve a estar estable. Estuvo cerca.

<!-- sección: pase -->
## 5. Pase de visita del Dr. Celada

Un nivel por bloque, del mejor al peor. **Desde** es el porcentaje mínimo de aciertos del bloque. Tiene que haber un nivel «Desde: 0 %».

### PASE IMPECABLE
- **Desde:** 100 %
- **Bono:** 200
- **Devuelve una vida:** sí
- **Cara:** euforia
- **Color:** perfecto
- **Frase:** Todo el bloque sin un error. Así se ve una guardia bien llevada.
- **Frase:** Ni un tropiezo en todo el bloque. El servicio lo nota.
- **Frase:** Impecable. Ni una decisión que reprocharte.

### BUEN BLOQUE
- **Desde:** 80 %
- **Bono:** 110
- **Devuelve una vida:** no
- **Cara:** aprueba
- **Color:** bueno
- **Frase:** Sólido. Un desliz no arruina un bloque bien resuelto.
- **Frase:** Vas bien. Sostén el criterio y no te enamores de la primera hipótesis.
- **Frase:** Buen ritmo. Sigue así y salimos vivos del turno.

### ACEPTABLE
- **Desde:** 60 %
- **Bono:** 55
- **Devuelve una vida:** no
- **Cara:** normal
- **Color:** regular
- **Frase:** Pasable. Te faltó rigor en un par de decisiones.
- **Frase:** Ni brillante ni desastroso. Afina el razonamiento.
- **Frase:** Aquí el margen es estrecho. Ajusta antes del siguiente bloque.

### REVISIÓN NECESARIA
- **Desde:** 0 %
- **Bono:** 0
- **Devuelve una vida:** no
- **Cara:** enojado
- **Color:** malo
- **Frase:** Demasiados errores. Vuelve a leer los casos que fallaste.
- **Frase:** Esto no se sostiene. Baja la velocidad y piensa.
- **Frase:** El servicio no aguanta este margen de error. Corrígelo ya.

  - Caras posibles: normal, habla, piensa, aprueba, euforia, preocupado, shock, agotado, sorprendido, enojado.
  - Colores posibles: perfecto, bueno, regular, malo.

<!-- sección: casos -->
## 6. Casos: título y dificultad

El título es lo primero que ve el jugador. **No debe nombrar el diagnóstico si el diagnóstico es la respuesta.** Los casos con ⚠️ tienen palabras del título que también aparecen en la respuesta esperada: revísalos primero.

Dificultades posibles: fácil, media, difícil.

**Resumen:** 95 casos · 36 con posible spoiler · 28 fácil · 65 media · 2 difícil

### REAL_GEN_SCH_001_A
- **Título:** Psicosis y Criterios Clínicos: Fenomenología y Criterios
- **Dificultad:** fácil
  - Respuesta 1: Delirios, alucinaciones y/o habla desorganizada

### REAL_GEN_SCH_002_A
- **Título:** Psicosis y Criterios Clínicos: Heterogeneidad Clínica
- **Dificultad:** media
  - Respuesta 1: Contenido delirante

### ⚠️ REAL_GEN_SUI_001_A
- **Título:** Suicidio: Fenomenología y Definiciones
- **Dificultad:** media
  - Respuesta 1: Ideación suicida
  - ⚠️ El título comparte con la respuesta: suicidio

### REAL_GEN_SUI_002_A
- **Título:** Suicidio: Factores de Riesgo
- **Dificultad:** media
  - Respuesta 1: Desesperanza

### REAL_GEN_DEP_001_A
- **Título:** Adulto con dos semanas de tristeza: ¿qué criterio pesa más?
- **Dificultad:** fácil
  - Respuesta 1: Estado de ánimo deprimido o anhedonia

### REAL_GEN_ADHD_001_A
- **Título:** Trastorno del Neurodesarrollo: Fenotipo y Evolución
- **Dificultad:** fácil
  - Respuesta 1: Dificultad para sostener la atención

### REAL_GEN_ADHD_002_A
- **Título:** Trastorno del Neurodesarrollo: Diagnóstico y Circuitos
- **Dificultad:** media
  - Respuesta 1: Déficits en funciones ejecutivas

### REAL_GEN_DELIR_001_A
- **Título:** Delirium: Fenomenología Aguda
- **Dificultad:** media
  - Respuesta 1: Inicio agudo y fluctuación del nivel de conciencia

### REAL_GEN_DELIR_002_A
- **Título:** Delirium: Fisiopatología y Manejo
- **Dificultad:** media
  - Respuesta 1: Identificar y tratar la causa médica subyacente

### REAL_GEN_BIP_001_A
- **Título:** Trastorno del Afecto: Definiciones
- **Dificultad:** media
  - Respuesta 1: Ánimo elevado, expansivo o irritable (con aumento de energía)

### REAL_GEN_BIP_002_A
- **Título:** Trastorno del Afecto: Neurobiología y Manejo
- **Dificultad:** media
  - Respuesta 1: Litio

### REAL_GEN_ASD_001_A
- **Título:** Autismo: Dominios Nucleares
- **Dificultad:** fácil
  - Respuesta 1: Dificultades persistentes en la reciprocidad socioemocional

### REAL_GEN_ASD_002_A
- **Título:** Autismo: Neurobiología y Clínica
- **Dificultad:** media
  - Respuesta 1: Hiper o hiporreactividad a estímulos sensoriales

### REAL_GEN_PTSD_001_A
- **Título:** TEPT: Clusters Sintomáticos
- **Dificultad:** media
  - Respuesta 1: Recuerdos angustiosos recurrentes (flashbacks)

### ⚠️ REAL_GEN_PTSD_002_A
- **Título:** TEPT: Neurobiología y Emoción
- **Dificultad:** media
  - Respuesta 1: Dificultad para regular la respuesta emocional (disregulación)
  - ⚠️ El título comparte con la respuesta: emocion

### REAL_GEN_SLEEP_001_A
- **Título:** Parasomnias: Fenomenología
- **Dificultad:** media
  - Respuesta 1: Conductas automáticas o complejas durante el sueño

### ⚠️ REAL_GEN_SEX_001_A
- **Título:** Disfunciones Sexuales: Definición
- **Dificultad:** media
  - Respuesta 1: Dificultades en la respuesta sexual o el placer
  - ⚠️ El título comparte con la respuesta: sexuales

### REAL_GEN_HIST_001_A
- **Título:** Historia de la Psiquiatría: Evolución Conceptual
- **Dificultad:** fácil
  - Respuesta 1: Modelo biomédico y psicosocial basado en evidencia

### EDU_01_HIST
- **Título:** Evaluación: Signos de Psicosis Activa
- **Dificultad:** media
  - Respuesta 1: Ideas de autorreferencia con suspicacia
  - Respuesta 2: Biometría hemática, TSH/T4 y tamiz toxicológico

### ⚠️ EDU_03_AFECTO
- **Título:** Trastorno del Estado de Ánimo: Rasgos Melancólicos
- **Dificultad:** media
  - Respuesta 1: Con rasgos melancólicos
  - Respuesta 2: Hipersomnia y aumento de apetito/peso
  - ⚠️ El título comparte con la respuesta: rasgos, melancolicos

### EDU_04_ANSIEDAD
- **Título:** Ansiedad: Diagnóstico Diferencial Orgánico
- **Dificultad:** difícil
  - Respuesta 1: Tirotoxicosis / Tormenta Tiroidea
  - Respuesta 2: Perfil tiroideo (TSH, T4 libre)

### EDU_05_TEPT
- **Título:** TEPT: Diagnóstico Sindromático
- **Dificultad:** media
  - Respuesta 1: Flashbacks (reexperimentación)
  - Respuesta 2: Trastorno de Estrés Postraumático (TEPT)

### ⚠️ EDU_06_NEURO
- **Título:** Neurodesarrollo: Autismo Nivel 1 en Adultos
- **Dificultad:** media
  - Respuesta 1: Trastorno del Espectro Autista (Nivel 1)
  - Respuesta 2: Historia de déficits sociales y rigidez desde la infancia temprana
  - ⚠️ El título comparte con la respuesta: nivel

### EDU_07_TDAH
- **Título:** Trastorno del Neurodesarrollo: Fenotipo Adulto
- **Dificultad:** media
  - Respuesta 1: Inquietud subjetiva interna
  - Respuesta 2: Ausencia de episodios de euforia y curso crónico estable

### ⚠️ EDU_08_IMPULSOS
- **Título:** Control de Impulsos: Trastorno Explosivo Intermitente
- **Dificultad:** media
  - Respuesta 1: Trastorno Explosivo Intermitente
  - Respuesta 2: Plan de seguridad: identificar disparadores y retirar acceso a armas
  - ⚠️ El título comparte con la respuesta: explosivo, intermitente

### ⚠️ EDU_09_TOC
- **Título:** Ansiedad y Conductas Repetitivas: Función de la Compulsión
- **Dificultad:** media
  - Respuesta 1: Neutralizar la ansiedad provocada por la obsesión (refuerzo negativo)
  - Respuesta 2: Tiempo invertido (>1 hora/día) y presencia de daño físico
  - ⚠️ El título comparte con la respuesta: ansiedad

### ⚠️ EDU_10_SUBST
- **Título:** Urgencias: Delirium Tremens
- **Dificultad:** media
  - Respuesta 1: Delirium Tremens
  - Respuesta 2: Benzodiacepinas a dosis respuesta
  - ⚠️ El título comparte con la respuesta: delirium, tremens

### EDU_11_PSIC
- **Título:** Psicosis: Fenomenología y Criterios
- **Dificultad:** fácil
  - Respuesta 1: Ideas delirantes de referencia y alucinaciones auditivas
  - Respuesta 2: Espectro de la esquizofrenia y otros trastornos psicóticos

### ⚠️ EDU_12_ORG
- **Título:** Psiquiatría de Enlace: Delirium Infeccioso
- **Dificultad:** media
  - Respuesta 1: Buscar y tratar foco infeccioso (prob. urinario)
  - Respuesta 2: Inicio agudo (horas) y fluctuación de la atención
  - ⚠️ El título comparte con la respuesta: infeccioso

### EDU_16_URGENCIAS
- **Título:** Urgencias: Toxicidad por Psicofármacos
- **Dificultad:** media
  - Respuesta 1: Síndrome Serotoninérgico
  - Respuesta 2: Clonus e hiperreflexia (neuromuscular hiperactivo)

### ⚠️ EDU_17_SEXUAL
- **Título:** Sexualidad: Efectos Adversos de Antidepresivos
- **Dificultad:** media
  - Respuesta 1: Efecto adverso serotoninérgico (estimulación 5-HT2)
  - Respuesta 2: La ausencia de anhedonia y tristeza (eutimia)
  - ⚠️ El título comparte con la respuesta: efectos, adversos

### EDU_18_TCA
- **Título:** Conducta Alimentaria: Criterios de Ingreso en Trastorno de la Conducta Alimentaria
- **Dificultad:** media
  - Respuesta 1: Bradicardia severa (<45 lpm) e inestabilidad hemodinámica
  - Respuesta 2: Síndrome de Realimentación (hipofosfatemia, falla cardíaca)

### EDU_19_PERS
- **Título:** Personalidad: Rasgos de la Personalidad (Trastorno de la Personalidad)
- **Dificultad:** media
  - Respuesta 1: Desregulación emocional e impulsividad con relaciones inestables y miedo al abandono
  - Respuesta 2: Evaluar riesgo suicida y crear Plan de Seguridad

### EDU_20_TALLER
- **Título:** Alteraciones Psicomotoras: Diagnóstico y Manejo
- **Dificultad:** media
  - Respuesta 1: Prueba de desafío con Lorazepam (Benzodiacepina)
  - Respuesta 2: Empeoramiento y precipitación de Síndrome Neuroléptico Maligno

### ⚠️ EDU_21_ANSIEDAD_GAD
- **Título:** Ansiedad y Preocupación (Trastorno de Ansiedad): Diferencial
- **Dificultad:** media
  - Respuesta 1: Trastorno de Ansiedad Generalizada (TAG)
  - Respuesta 2: Preocupación (worry) difícil de controlar y persistente
  - ⚠️ El título comparte con la respuesta: ansiedad, preocupacion

### CLIN_001_PANICO
- **Título:** Urgencias de Ansiedad: Crisis vs. Ansiedad y Preocupación
- **Dificultad:** fácil
  - Respuesta 1: Inicio súbito y alcanza máxima intensidad en minutos

### ⚠️ CLIN_002_FOBIA_SOCIAL
- **Título:** Ansiedad y Fobias: Ansiedad de Actuación
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de ansiedad social (fobia social) de tipo actuación
  - ⚠️ El título comparte con la respuesta: ansiedad, actuacion

### CLIN_003_ANOREXIA
- **Título:** Trastorno de la Conducta Alimentaria Nerviosa: Criterios Diagnósticos
- **Dificultad:** fácil
  - Respuesta 1: Distorsión de la imagen corporal (alteración en la percepción del peso)

### CLIN_004_BULIMIA
- **Título:** Caso Clínico: Mujer de 22 años
- **Dificultad:** fácil
  - Respuesta 1: Peso corporal normal o superior al mínimo esperado

### ⚠️ CLIN_005_TDM_ESPECIFICADOR
- **Título:** Trastorno del Estado de Ánimo: Especificador Atípico
- **Dificultad:** media
  - Respuesta 1: Con características atípicas
  - ⚠️ El título comparte con la respuesta: atipico

### CLIN_006_TRASTORNO_ADAPTACION
- **Título:** Caso Clínico: Mujer de 30 años
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de adaptación con estado de ánimo depresivo

### ⚠️ CLIN_007_TOC_INSIGHT
- **Título:** Ansiedad y Conductas Repetitivas: Niveles de Insight
- **Dificultad:** media
  - Respuesta 1: Insight bueno o regular
  - ⚠️ El título comparte con la respuesta: insight

### ⚠️ CLIN_008_HIPOCONDRIA
- **Título:** Trastorno de Ansiedad por Enfermedad (Hipocondría)
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de ansiedad por enfermedad (hipocondría)
  - ⚠️ El título comparte con la respuesta: ansiedad, enfermedad, hipocondria

### CLIN_009_CONVERSION
- **Título:** Caso Clínico: Mujer de 25 años
- **Dificultad:** media
  - Respuesta 1: Trastorno de conversión (síntoma neurológico funcional)

### ⚠️ CLIN_010_TRASTORNO_FACTICIO
- **Título:** Trastorno Facticio (Síndrome de Münchausen)
- **Dificultad:** media
  - Respuesta 1: Trastorno facticio (Síndrome de Münchausen)
  - ⚠️ El título comparte con la respuesta: facticio, sindrome, munchausen

### CLIN_011_ABSTINENCIA_ALCOHOL
- **Título:** Síndrome de Abstinencia Alcohólica
- **Dificultad:** media
  - Respuesta 1: Benzodiacepinas (ej. lorazepam o diazepam) con dosis ajustadas según síntomas

### CLIN_012_DUELO_COMPLICADO
- **Título:** Reacción ante Pérdidas Afectivas vs. Trastorno del Estado de Ánimo
- **Dificultad:** media
  - Respuesta 1: Trastorno depresivo mayor

### ⚠️ CLIN_013_INSOMNIO
- **Título:** Trastorno de Alteraciones del Ciclo Vigilia-Sueño: Criterios
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de insomnio (dificultad para iniciar el sueño)
  - ⚠️ El título comparte con la respuesta: sueno

### CLIN_014_NARCOLEPSIA
- **Título:** Caso Clínico: Joven de 20 años
- **Dificultad:** media
  - Respuesta 1: Narcolepsia tipo 1 (con cataplejía)

### CLIN_015_TRASTORNO_PERSONALIDAD_LIMITE_CRITERIOS
- **Título:** Trastorno de la Personalidad: Criterios DSM-5
- **Dificultad:** media
  - Respuesta 1: Al menos 4: inestabilidad afectiva, vacío, autolesiones, miedo al abandono

### CLIN_016_TRASTORNO_PERSONALIDAD_ANTISOCIAL
- **Título:** Caso Clínico: Hombre de 28 años
- **Dificultad:** media
  - Respuesta 1: Trastorno antisocial de la personalidad

### ⚠️ CLIN_017_EFECTOS_ADVERSOS_ISRS
- **Título:** Efectos Adversos de ISRS: Náuseas, Cefalea y Disfunción Sexual
- **Dificultad:** fácil
  - Respuesta 1: Informar que náuseas y cefalea son transitorias (1-2 semanas); la disfunción sexual puede persistir y manejarse específicamente; mantener dosis
  - ⚠️ El título comparte con la respuesta: nauseas, cefalea, disfuncion, sexual

### CLIN_018_ANTIPSICOTICOS_METABOLICOS
- **Título:** Antipsicóticos Atípicos: Síndrome Metabólico
- **Dificultad:** media
  - Respuesta 1: Peso, glucemia en ayunas, perfil lipídico y presión arterial

### ⚠️ CLIN_019_LITIO_MONITOREO
- **Título:** Litio: Niveles Terapéuticos y Tóxicos
- **Dificultad:** media
  - Respuesta 1: Aumento del nivel de litio por interacción con AINE (ibuprofeno)
  - ⚠️ El título comparte con la respuesta: litio

### CLIN_020_BENZODIACEPINAS_DEPENDENCIA
- **Título:** Benzodiacepinas: Tolerancia y Dependencia
- **Dificultad:** fácil
  - Respuesta 1: Reducción gradual de la dosis (desescalada) durante semanas o meses

### HOSP_001_DELIRIUM_UCI
- **Título:** Delirium en Paciente Crítico: Manejo de Agitación
- **Dificultad:** media
  - Respuesta 1: Identificar y tratar la causa subyacente (ej. infección, hipoxia, fármacos)

### ⚠️ HOSP_002_DEMENCIA_VASCULAR
- **Título:** Trastorno Deterioro Cognitivo Vascular: Inicio Escalonado
- **Dificultad:** media
  - Respuesta 1: Demencia vascular
  - ⚠️ El título comparte con la respuesta: vascular

### ⚠️ HOSP_003_DEPRESION_POSTPARTO
- **Título:** Trastorno del Estado de Ánimo Postparto: 'Maternity Blues' vs. Trastorno del Estado de Ánimo
- **Dificultad:** fácil
  - Respuesta 1: Depresión postparto
  - ⚠️ El título comparte con la respuesta: postparto

### HOSP_004_MANIA_CRITERIOS
- **Título:** Caso Clínico: Hombre de 30 años
- **Dificultad:** media
  - Respuesta 1: Episodio maníaco

### HOSP_005_ESQUIZOFRENIA_PROGNOSTICO
- **Título:** Psicosis y Criterios Clínicos: Factores de Buen Pronóstico
- **Dificultad:** media
  - Respuesta 1: Mujer de 35 años con inicio brusco tras despido laboral y delirios de persecución

### HOSP_006_TRASTORNO_CORTA_DURACION
- **Título:** Espectro de la Esquizofrenia: Criterios Temporales
- **Dificultad:** media
  - Respuesta 1: Trastorno psicótico breve

### HOSP_007_INDICACIONES_TEC
- **Título:** Terapia Electroconvulsiva (TEC): Indicaciones
- **Dificultad:** media
  - Respuesta 1: Depresión mayor severa con rechazo absoluto a la ingesta de líquidos y sólidos

### HOSP_008_SINDROME_NEUROLEPTICO_MALIGNO
- **Título:** SNM: Clínica y Manejo
- **Dificultad:** media
  - Respuesta 1: Elevación masiva de Creatina Fosfoquinasa (CPK)

### HOSP_009_WERNICKE
- **Título:** Encefalopatía de Urgencia Neuro-Nutricional
- **Dificultad:** media
  - Respuesta 1: Administrar Tiamina IM o IV

### HOSP_010_INTOXICACION_LITIO
- **Título:** Urgencias por Consumo de Sustancias o Fármacos Aguda por Litio: Manejo
- **Dificultad:** media
  - Respuesta 1: Hemodiálisis

### HOSP_011_PARADIGMA_REDUCCION_DAÑOS
- **Título:** Reducción de Daños en Consumo de Sustancias
- **Dificultad:** fácil
  - Respuesta 1: Proporcionar naloxona a usuarios de heroína para revertir sobredosis

### HOSP_012_CRISIS_AGITACION_AGUDO
- **Título:** Protocolo de Agitación Aguda
- **Dificultad:** media
  - Respuesta 1: Haloperidol 5 mg + Midazolam 5 mg IM

### ⚠️ HOSP_013_TCA_BULIMIA_SIGNOS
- **Título:** Signos Físicos en Trastorno de la Conducta Alimentaria Nerviosa
- **Dificultad:** fácil
  - Respuesta 1: Bulimia nerviosa con conductas purgativas (vómito)
  - ⚠️ El título comparte con la respuesta: conducta, nerviosa

### HOSP_014_COMPLICACION_ANTIPSICOTICOS
- **Título:** Antipsicóticos: Distonía Aguda
- **Dificultad:** fácil
  - Respuesta 1: Biperideno o Difenhidramina IM

### ⚠️ HOSP_015_DELIRIUM_TREMENS_CLINICA
- **Título:** Delirium Tremens: Características
- **Dificultad:** media
  - Respuesta 1: Desorientación y alteración de la conciencia (delirium)
  - ⚠️ El título comparte con la respuesta: delirium

### HOSP_016_SINDROME_SEROTONINERGICO_GRAVE
- **Título:** Toxicidad por Psicofármacos Severo
- **Dificultad:** media
  - Respuesta 1: Síndrome Serotoninérgico

### HOSP_017_REACCION_COCAINA
- **Título:** Urgencias por Consumo de Sustancias o Fármacos por Cocaína: Manejo Inicial
- **Dificultad:** media
  - Respuesta 1: Propranolol (Beta-bloqueador)

### HOSP_018_DEMENCIA_FRONTOTEMPORAL
- **Título:** Caso Clínico: Hombre de 55 años
- **Dificultad:** media
  - Respuesta 1: Demencia frontotemporal

### HOSP_019_TDAH_NIÑOS_CRITERIOS
- **Título:** Caso Clínico: Niño de 8 años
- **Dificultad:** fácil
  - Respuesta 1: No, porque los síntomas no se presentan en dos o más ambientes

### ⚠️ HOSP_020_PSICOSIS_BREVE
- **Título:** Trastorno Psicótico Breve post-estrés
- **Dificultad:** fácil
  - Respuesta 1: Trastorno psicótico breve con estresor notable
  - ⚠️ El título comparte con la respuesta: psicotico, breve, estres

### ⚠️ REAL_GEN_GAD_001_A
- **Título:** Trastorno de Ansiedad y Preocupación: Preocupación Excesiva
- **Dificultad:** fácil
  - Respuesta 1: Preocupación excesiva y difícil de controlar sobre múltiples eventos
  - ⚠️ El título comparte con la respuesta: preocupacion, excesiva

### REAL_GEN_PANIC_001_A
- **Título:** Urgencias de Ansiedad: Crisis Inesperadas
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de Pánico

### ⚠️ REAL_GEN_SAD_001_A
- **Título:** Trastorno de Ansiedad Social: Miedo a la Evaluación
- **Dificultad:** fácil
  - Respuesta 1: Trastorno de Ansiedad Social (Fobia Social)
  - ⚠️ El título comparte con la respuesta: ansiedad, social

### ⚠️ REAL_GEN_OCD_001_A
- **Título:** Ansiedad y Conductas Repetitivas: Obsesiones y Compulsiones
- **Dificultad:** media
  - Respuesta 1: Trastorno Obsesivo-Compulsivo (TOC)
  - ⚠️ El título comparte con la respuesta: obsesiones, compulsiones

### REAL_GEN_PTSD_003_A
- **Título:** TEPT: Clasificación y Síntomas Nucleares
- **Dificultad:** media
  - Respuesta 1: Trastorno de Estrés Postraumático (TEPT); las pesadillas pertenecen al cluster de Intrusión.

### ⚠️ REAL_GEN_BIP_003_A
- **Título:** Trastorno del Afecto: Episodio Hipomaníaco vs. Maníaco
- **Dificultad:** media
  - Respuesta 1: Trastorno Bipolar II (episodio hipomaníaco)
  - ⚠️ El título comparte con la respuesta: episodio, hipomaniaco

### ⚠️ REAL_GEN_SUD_001_A
- **Título:** Trastorno por Consumo de Sustancias: Criterios
- **Dificultad:** media
  - Respuesta 1: Al menos 4: control deficiente (intentos fallidos y consumo mayor al deseado), deterioro social (incumplimiento de obligaciones y problemas familiares).
  - ⚠️ El título comparte con la respuesta: consumo

### ⚠️ REAL_GEN_NCD_001_A
- **Título:** Trastorno Deterioro Cognitivo Mayor: Trastorno Deterioro Cognitivo
- **Dificultad:** media
  - Respuesta 1: El deterioro cognitivo interfiere con la independencia en las actividades cotidianas.
  - ⚠️ El título comparte con la respuesta: deterioro, cognitivo

### REAL_GEN_ASD_003_A
- **Título:** Caso Clínico: Niño de 4 años
- **Dificultad:** media
  - Respuesta 1: Déficit en la comunicación social (evita el contacto visual, no responde a su nombre) y patrones de comportamiento restringidos y repetitivos (interés por el ventilador, alteración por cambios de ruta).

### REAL_GEN_ADHD_003_A
- **Título:** Trastorno del Neurodesarrollo: Subtipos y Persistencia en Adultos
- **Dificultad:** fácil
  - Respuesta 1: Presentación predominantemente inatenta.

### REAL_GEN_TCA_001_A
- **Título:** Trastorno por Trastorno Alimentario: Sin Conductas Compensatorias
- **Dificultad:** media
  - Respuesta 1: Trastorno por Atracón (Binge-Eating Disorder)

### ⚠️ HOSP_021_TDPM
- **Título:** Salud Reproductiva: Síndrome Premenstrual vs. Trastorno Disfórico Premenstrual
- **Dificultad:** media
  - Respuesta 1: Síndrome Premenstrual (SPM)
  - ⚠️ El título comparte con la respuesta: sindrome, premenstrual

### NEW_001_BDD
- **Título:** Espectro Obsesivo-Compulsivo: Trastorno Dismórfico Corporal
- **Dificultad:** media
  - Respuesta 1: La capacidad de reconocer, al menos en algún momento, que la preocupación por el defecto es excesiva (insight)

### ⚠️ NEW_002_LEWY
- **Título:** Trastorno Deterioro Cognitivo: Demencia con Cuerpos de Lewy
- **Dificultad:** media
  - Respuesta 1: Demencia con cuerpos de Lewy; la extrema sensibilidad a los antipsicóticos D2 (parkinsonismo severo o síndrome neuroléptico maligno)
  - ⚠️ El título comparte con la respuesta: demencia, cuerpos

### NEW_003_TOURETTE
- **Título:** Neurodesarrollo: Trastorno de Tourette
- **Dificultad:** fácil
  - Respuesta 1: Tics motores y vocales presentes, aunque no necesariamente concurrentes, por más de 1 año sin remisión >3 meses

### ⚠️ NEW_004_OPIOID_OVERDOSE
- **Título:** Urgencias por Consumo de Sustancias: Sobredosis por Opioides
- **Dificultad:** fácil
  - Respuesta 1: Naloxona IV/IM; vigilar recurrencia de la depresión respiratoria por vida media más corta que muchos opioides (dosis repetidas o infusión)
  - ⚠️ El título comparte con la respuesta: opioides

### ⚠️ NEW_005_SOMATIC_SYMPTOM
- **Título:** Somatización: Trastorno de Síntomas Somáticos
- **Dificultad:** media
  - Respuesta 1: El foco está en el malestar y deterioro causados por el síntoma físico en sí, no en el miedo a una enfermedad subyacente
  - ⚠️ El título comparte con la respuesta: sintomas

### ⚠️ NEW_006_PROLONGED_GRIEF
- **Título:** Reacción ante Pérdidas: Trastorno de Duelo Prolongado
- **Dificultad:** media
  - Respuesta 1: Trastorno de duelo prolongado; síntomas persistentes ≥12 meses después de la muerte en adultos
  - ⚠️ El título comparte con la respuesta: duelo, prolongado

### NEW_007_AGORAPHOBIA
- **Título:** Ansiedad y Fobias: Agorafobia
- **Dificultad:** fácil
  - Respuesta 1: Miedo a situaciones de las que escapar sería difícil o donde no se recibiría ayuda si aparecen síntomas incapacitantes

### ⚠️ NEW_008_SCHIZOAFFECTIVE
- **Título:** Psicosis y Criterios Clínicos: Trastorno Esquizoafectivo
- **Dificultad:** difícil
  - Respuesta 1: Las 2 semanas de psicosis SÍNTOMAS afectivos (requisito DSM-5 para esquizoafectivo)
  - ⚠️ El título comparte con la respuesta: psicosis, esquizoafectivo

<!-- sección: notas -->
## Notas de revisión

_Escribe aquí comentarios para el equipo. Esta sección se conserva tal cual._
