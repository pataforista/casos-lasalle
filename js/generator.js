"use strict";

/**
 * Generator — Procedural Case Engine (Modular V3)
 * Respaldo del banco real: sólo se usa cuando el manifest no carga (primera
 * visita sin red) o cuando una combinación de filtros no tiene ningún caso.
 * Cada módulo aporta síntomas, paraclínicos por dificultad y UNA tarea de
 * licenciatura con rationale, take_home y why_not.
 *
 * Las ramas de residencia/especialidad (con preguntas RDoC) se retiraron:
 * el menú sólo ofrece licenciatura y la guía de contenidos veta RDoC/HiTOP.
 */

const Generator = (() => {
  const NAMES = ["Juan", "María", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofía", "Jorge", "Lucía", "Mateo", "Valentina", "Andrés", "Camila", "Gabriela", "Federico", "Mariana", "Santiago"];
  const LAST_NAMES = ["Pérez", "García", "López", "Martínez", "Rodríguez", "González", "Hernández", "Sánchez", "Ramírez", "Cruz", "Vázquez", "Gómez", "Díaz", "Torres"];
  
  const AGES = ["19 años", "25 años", "34 años", "42 años", "58 años", "67 años", "75 años"];
  const CONTEXTS = [
    "en la sala de urgencias",
    "en consulta externa",
    "traído por paramédicos",
    "encontrado en la vía pública",
    "en la planta de medicina interna"
  ];

  // 20 Módulos Clínicos Enriquecidos
  const SYMPTOM_MODULES = [
    {
      type: "Mania",
      title: "Trastorno Bipolar: Manía Aguda",
      symptoms: [
        "Lleva 4 días sin dormir y tiene una energía inagotable.",
        "Habla tan rápido que es difícil entenderle (taquipsiquia y fuga de ideas).",
        "Dice ser el nuevo director del hospital y que comprará Microsoft mañana.",
        "Gasta dinero que no tiene en coches de lujo y regala sus pertenencias."
      ],
      labs: {
        facil: "Signos vitales: FC 95 lpm, PA 120/80 mmHg. Exploración neurológica normal.",
        media: "Constantes: FC 110 lpm, PA 135/85 mmHg. Toxicología en orina: negativa. Tiroides (TSH, T4L) normal.",
        dificil: "Constantes: FC 115 lpm, PA 140/90 mmHg. Litio sérico actual: <0.1 mEq/L (sugiere abandono de tratamiento). Hemograma normal."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico sindromático inicial más probable?",
          expected_answer: "Episodio maníaco agudo",
          distractors: ["Trastorno por Déficit de Atención", "Esquizofrenia paranoide", "Trastorno adaptativo depresivo"],
          rationale: "La combinación de insomnio global de varios días, taquipsiquia, grandiosidad delirante y conductas de riesgo define inequívocamente un episodio maníaco.",
          take_home: "La manía se define por ánimo elevado o irritable, energía aumentada y menor necesidad de sueño por ≥ 1 semana.",
          why_not: [
            { option: "Trastorno por Déficit de Atención", reason: "Aunque comparte la distractibilidad, el TDAH no cursa con grandiosidad delirante ni insomnio global de inicio agudo." },
            { option: "Esquizofrenia paranoide", reason: "Aunque hay delirios, el cuadro de euforia, hiperactividad motora y disminución de la necesidad de sueño orienta primariamente a un trastorno del afecto." },
            { option: "Trastorno adaptativo depresivo", reason: "Es lo opuesto al cuadro de hiperactividad, euforia y energía aumentada descrito." }
          ]
        }
      }
    },
    {
      type: "Depression",
      title: "Trastorno Depresivo Mayor",
      symptoms: [
        "No se ha levantado de la cama en dos semanas.",
        "Refiere que el mundo y su familia estarían mejor sin él/ella (ideas de inutilidad y muerte).",
        "Ha dejado de comer por completo y ha perdido 6 kg en el último mes.",
        "Llora constantemente, no encuentra placer en nada (anhedonia) y tiene apatía severa."
      ],
      labs: {
        facil: "Signos vitales: FC 72 lpm, PA 110/70 mmHg. Exploración física: palidez mucocutánea leve.",
        media: "Constantes: FC 64 lpm. Exámenes: Hemoglobina 11.5 g/dL, TSH 2.1 mIU/L (normal), Electrólitos séricos normales.",
        dificil: "Exámenes: Cortisol libre urinario elevado, TSH 3.5 mIU/L, Sodio sérico 136 mEq/L. Escala de Hamilton: 28 puntos (depresión grave)."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y el primer paso en urgencias?",
          expected_answer: "Trastorno depresivo mayor grave con ideación suicida; realizar evaluación inmediata de riesgo",
          distractors: [
            "Trastorno adaptativo leve; derivar a consulta externa en 2 meses",
            "Esquizofrenia catatónica; iniciar antipsicóticos típicos",
            "Trastorno bipolar fase maníaca; hospitalizar sin consentimiento"
          ],
          rationale: "La presencia de anhedonia severa, melancolía, pérdida de peso marcada e ideación de muerte define un episodio depresivo mayor grave, requiriendo evaluación urgente del riesgo suicida.",
          take_home: "La evaluación del riesgo suicida es prioritaria y obligatoria en todo episodio depresivo severo.",
          why_not: [
            { option: "Trastorno adaptativo leve; derivar a consulta externa en 2 meses", reason: "El cuadro es grave con pérdida de peso sustancial e ideación suicida, por lo que una derivación tardía es peligrosa." },
            { option: "Esquizofrenia catatónica; iniciar antipsicóticos típicos", reason: "Aunque el paciente está postrado, el núcleo fenomenológico es afectivo (tristeza, culpa, anhedonia), no un cuadro psicomotor catatónico primario." },
            { option: "Trastorno bipolar fase maníaca; hospitalizar sin consentimiento", reason: "El cuadro es puramente depresivo, no maníaco." }
          ]
        }
      }
    },
    {
      type: "Psychosis",
      title: "Brote Psicótico Agudo",
      symptoms: [
        "Escucha voces susurrantes que le acusan de crímenes y le dicen que la comida está envenenada.",
        "Cree firmemente que la CIA ha instalado cámaras ocultas en sus globos oculares.",
        "Muestra una desorganización conductual severa, vistiendo varios abrigos gruesos en pleno verano.",
        "Mantiene posturas corporales fijas por horas y tiene mutismo selectivo."
      ],
      labs: {
        facil: "Signos vitales: FC 88 lpm, PA 120/80 mmHg. Reflejos normales.",
        media: "Constantes: FC 92 lpm, T° 36.8 °C. Examen general de orina normal. RMN cerebral sin lesiones agudas.",
        dificil: "Hemograma: Leucocitos 7,200/mm3. Toxicología completa en orina: negativa. Creatincinasa (CK) normal."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el síndrome clínico principal y la conducta inicial?",
          expected_answer: "Brote psicótico agudo; iniciar antipsicótico de segunda generación y descartar causa médica",
          distractors: [
            "Trastorno de ansiedad generalizada; iniciar benzodiacepinas de por vida",
            "Demencia presenil; derivar a residencia de cuidados prolongados",
            "Simulación del comportamiento; dar de alta con apercibimiento"
          ],
          rationale: "Las alucinaciones auditivas, ideas delirantes de persecución/control y la desorganización conductual configuran un brote psicótico agudo, requiriendo iniciar antipsicóticos una vez descartada etiología orgánica.",
          take_home: "Un brote psicótico de inicio requiere descartar causas orgánicas antes de etiquetarlo como psiquiátrico primario.",
          why_not: [
            { option: "Trastorno de ansiedad generalizada; iniciar benzodiacepinas de por vida", reason: "La ansiedad no cursa con delirios sistematizados ni desorganización fenomenológica de la realidad." },
            { option: "Demencia presenil; derivar a residencia de cuidados prolongados", reason: "Es un cuadro agudo y no hay evidencia de deterioro cognitivo crónico cortical previo." },
            { option: "Simulación del comportamiento; dar de alta con apercibimiento", reason: "El sufrimiento del paciente y la fenomenología psicótica descrita no sugieren simulación utilitaria." }
          ]
        }
      }
    },
    {
      type: "Panic",
      title: "Trastorno de Pánico",
      symptoms: [
        "Presenta de forma súbita una opresión precordial intensa con sensación de muerte inminente.",
        "Refiere palpitaciones, sudoración fría, temblor y sensación de falta de aire (disnea).",
        "Teme intensamente volverse loco, perder el control de su cuerpo o sufrir un infarto cardíaco.",
        "Los síntomas alcanzan su pico máximo en menos de 10 minutos y se acompañan de parestesias."
      ],
      labs: {
        facil: "Signos vitales: FC 110 lpm, PA 130/85 mmHg. ECG: taquicardia sinusal.",
        media: "ECG de 12 derivaciones sin elevación del segmento ST ni ondas T patológicas. Troponinas I: negativas.",
        dificil: "Constantes: FC 105 lpm. Gasometría arterial: alcalosis respiratoria compensada por hiperventilación. ECG normal."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico sindromático inicial y el abordaje prioritario?",
          expected_answer: "Crisis de pánico aguda; descartar patología cardíaca/pulmonar urgente, dar tranquilidad y usar ansiolíticos si es necesario",
          distractors: [
            "Infarto agudo de miocardio; enviar a cateterismo cardíaco de emergencia sin ECG",
            "Crisis convulsiva parcial; iniciar Fenitoína sódica intravenosa",
            "Simulación consciente; egresar a domicilio de forma inmediata sin atención"
          ],
          rationale: "La aparición súbita de angustia extrema con síntomas autonómicos y miedo a morir es típica de la crisis de pánico. El descarte rápido de causas orgánicas (infarto, embolia) es mandatorio en urgencias.",
          take_home: "Ante disnea y dolor torácico, primero se descarta patología cardiovascular y luego se aborda la crisis de pánico.",
          why_not: [
            { option: "Infarto agudo de miocardio; enviar a cateterismo cardíaco de emergencia sin ECG", reason: "No se puede enviar a cateterismo invasivo sin realizar antes un ECG y enzimas cardíacas para confirmar isquemia." },
            { option: "Crisis convulsiva parcial; iniciar Fenitoína sódica intravenosa", reason: "El cuadro no tiene características epilépticas (no hay movimientos estereotipados ni alteración focal EEG sugerida)." },
            { option: "Simulación consciente; egresar a domicilio de forma inmediata sin atención", reason: "El paciente experimenta un sufrimiento fisiológico real debido a la hiperventilación y descarga adrenérgica." }
          ]
        }
      }
    },
    {
      type: "Alcohol_Withdrawal",
      title: "Abstinencia Alcohólica: Delirium Tremens",
      symptoms: [
        "Presenta desorientación temporoespacial grave, alucinaciones visuales (ve insectos en la pared) y agitación extrema.",
        "Refiere sudoración profusa, fiebre de 38.2°C y temblor generalizado de grandes oscilaciones.",
        "Consta antecedente de consumo diario de alcohol de alta graduación durante 15 años.",
        "Sus familiares refieren que dejó de beber hace aproximadamente 48 a 72 horas."
      ],
      labs: {
        facil: "Signos vitales: FC 120 lpm, PA 160/100 mmHg, T° 38.1°C.",
        media: "Constantes: FC 125 lpm, PA 170/110 mmHg. Exámenes: AST 180 U/L, ALT 75 U/L (relación >2), GGT 350 U/L. Trombocitopenia leve.",
        dificil: "Constantes: FC 130 lpm. Exámenes: AST/ALT elevadas. Magnesio sérico: 1.2 mEq/L (hipomagnesemia), Potasio 3.2 mEq/L."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y el pilar del tratamiento?",
          expected_answer: "Delirium Tremens (abstinencia alcohólica grave); hospitalizar en área médica y administrar dosis altas de Benzodiacepinas más hidratación",
          distractors: [
            "Brote esquizofrénico paranoide; administrar Haloperidol IM en dosis masivas como monoterapia",
            "Demencia de Korsakoff irreversible; egresar a asilo",
            "Intoxicación alcohólica aguda; administrar carbón activado y café cargado"
          ],
          rationale: "El cuadro de desorientación, alucinaciones (zoopsias), hiperactividad autonómica (fiebre, hipertensión, taquicardia) y antecedentes de cese de ingesta configura el Delirium Tremens, una emergencia médica tratable con benzodiacepinas y soporte.",
          take_home: "El Delirium Tremens es una urgencia médica potencialmente letal que requiere benzodiacepinas IV/VO obligatorias.",
          why_not: [
            { option: "Brote esquizofrénico paranoide; administrar Haloperidol IM en dosis masivas como monoterapia", reason: "El haloperidol en monoterapia disminuye el umbral convulsivo y no previene la muerte por colapso cardiovascular en la abstinencia." },
            { option: "Demencia de Korsakoff irreversible; egresar a asilo", reason: "El Korsakoff es un síndrome amnésico crónico estable; el cuadro actual es un delirium agudo y fluctuante con inestabilidad autonómica." },
            { option: "Intoxicación alcohólica aguda; administrar carbón activado y café cargado", reason: "Es abstinencia (falta de alcohol), no intoxicación activa. El carbón activado y el café son inútiles y peligrosos por riesgo de broncoaspiración." }
          ]
        }
      }
    },
    {
      type: "TOC",
      title: "Trastorno Obsesivo Compulsivo (TOC)",
      symptoms: [
        "Presenta pensamientos intrusivos y persistentes de contaminación por gérmenes letales al tocar objetos cotidianos.",
        "Realiza un ritual de lavado de manos de forma estereotipada exactamente 15 veces consecutivas tras tocar cualquier picaporte.",
        "Reconoce que sus ideas son absurdas e irracionales, pero experimenta una ansiedad insoportable si intenta resistirse al lavado.",
        "Tiene las manos severamente eritematosas, agrietadas y con dermatosis por lavado excesivo."
      ],
      labs: {
        facil: "Signos vitales normales. Exploración física: lesiones descamativas eritematosas en ambas manos.",
        media: "Constantes normales. Biometría hemática normal. Cultivo de lesiones cutáneas en manos: flora cutánea normal sin infección activa.",
        dificil: "Escala Y-BOCS: 26 puntos (TOC grave con preservación de introspección). Hemograma y pruebas metabólicas normales."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y el pilar terapéutico psicoterapéutico?",
          expected_answer: "Trastorno Obsesivo Compulsivo; Terapia Cognitivo-Conductual con Exposición y Prevención de Respuesta (EPR)",
          distractors: [
            "Trastorno esquizotípico de la personalidad; Psicoterapia humanista gestalt",
            "Trastorno delirante de tipo somático; Terapia familiar sistémica",
            "Fobia social simple; Desensibilización sistemática clásica únicamente"
          ],
          rationale: "La combinación de ideas obsesivas (contaminación) y conductas compulsivas (rituales de lavado) que el paciente reconoce como egodistónicas es patognomónico de TOC. La psicoterapia de elección es la EPR.",
          take_home: "La Exposición y Prevención de Respuesta (EPR) es la terapia cognitivo-conductual de elección para el TOC.",
          why_not: [
            { option: "Trastorno esquizotípico de la personalidad; Psicoterapia humanista gestalt", reason: "El trastorno esquizotípico presenta excentricidades de conducta y pensamiento mágico, pero no obsesiones/compulsiones egodistónicas ni dermatosis secundaria." },
            { option: "Trastorno delirante de tipo somático; Terapia familiar sistémica", reason: "El paciente reconoce la irracionalidad de sus ideas (introspección conservada), lo que descarta un trastorno delirante de nivel psicótico." },
            { option: "Fobia social simple; Desensibilización sistemática clásica únicamente", reason: "La fobia social teme el escrutinio de los demás, no la contaminación por bacterias o gérmenes en objetos inanimados." }
          ]
        }
      }
    },
    {
      type: "Conversion",
      title: "Trastorno de Conversión",
      symptoms: [
        "Despierta con imposibilidad total para mover la pierna derecha de forma súbita tras discutir fuertemente con su cónyuge.",
        "A la exploración física, no muestra atrofia muscular ni fasciculaciones. Al levantar la pierna izquierda contra resistencia, apoya firmemente la pierna supuestamente paralizada (Signo de Hoover positivo).",
        "Muestra una llamativa indiferencia afectiva o tranquilidad ante la pérdida repentina de su función motora ('la belle indifférence').",
        "El cuadro no coincide con ninguna distribución anatómica o dermatómica de lesión neurológica."
      ],
      labs: {
        facil: "Signos vitales estables. Reflejos osteotendinosos simétricos y normales. Signo de Hoover positivo.",
        media: "Constantes estables. RMN cerebral y de médula espinal normales. Electromiografía de miembros inferiores: conducción normal.",
        dificil: "Exploración neurológica detallada: sin déficit focal orgánico, Hoover (+), reflejos plantares flexores (Babinski negativo)."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y el abordaje de primera elección?",
          expected_answer: "Trastorno de conversión (síntomas neurológicos funcionales); validación de la realidad de su síntoma, psicoeducación y fisioterapia cognitiva",
          distractors: [
            "Esclerosis lateral amiotrófica; iniciar tratamiento con Riluzol de por vida",
            "Simulación del síntoma con fines utilitarios; confrontar duramente al paciente y dar de alta",
            "Accidente cerebrovascular agudo; iniciar trombólisis intravenosa inmediata"
          ],
          rationale: "Los síntomas neurológicos que no corresponden a patología orgánica y tienen incongruencias físicas (ej. Hoover positivo) son típicos del Trastorno de Conversión. La confrontación es contraproducente; se requiere educación médica y terapia funcional.",
          take_home: "El trastorno de conversión presenta déficits neurológicos reales para el paciente pero sin causa orgánica subyacente demostrable.",
          why_not: [
            { option: "Esclerosis lateral amiotrófica; iniciar tratamiento con Riluzol de por vida", reason: "La ELA es una enfermedad de motoneurona progresiva con atrofia muscular, fasciculaciones e hiperreflexia, ausentes en este cuadro agudo reversible." },
            { option: "Simulación del síntoma con fines utilitarios; confrontar duramente al paciente y dar de alta", reason: "En la conversión, el paciente no produce los síntomas voluntariamente de forma consciente; la confrontación severa rompe la alianza terapéutica y agrava el cuadro." },
            { option: "Accidente cerebrovascular agudo; iniciar trombólisis intravenosa inmediata", reason: "La presencia del Signo de Hoover positivo e incongruencias anatómicas descarta un infarto cerebral agudo, evitando riesgos innecesarios de hemorragia por trombólisis." }
          ]
        }
      }
    },
    {
      type: "Dementia",
      title: "Demencia tipo Alzheimer",
      symptoms: [
        "Paciente de 75 años con pérdida progresiva de memoria a corto plazo de 2 años de evolución.",
        "Tiene dificultad para nombrar objetos cotidianos (anomia) y se pierde frecuentemente en su propia calle.",
        "Su cónyuge refiere que ha dejado de bañarse solo y que ya no puede administrar su pensión mensual.",
        "Se muestra irritable por las tardes, acusando falsamente a su cuidador de robarle sus pertenencias."
      ],
      labs: {
        facil: "Signos vitales normales. Exploración física: reflejos normales para la edad. Examen mental (MMSE): 18 puntos.",
        media: "Constantes estables. Exámenes: Vitamina B12 450 pg/mL, TSH 1.8 mIU/L (normal), VDRL no reactivo. Hemograma normal.",
        dificil: "MMSE: 17/30. RMN cerebral: atrofia temporal medial bilateral e hipertrofia de astas ventriculares. Escala FAST: Estadio 5."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico más probable y los exámenes básicos para descartar causas reversibles?",
          expected_answer: "Trastorno neurocognitivo mayor tipo Alzheimer; solicitar niveles de Vitamina B12, perfil tiroideo y VDRL",
          distractors: [
            "Envejecimiento normal fisiológico; no requiere exámenes y se egresa a domicilio",
            "Delirium agudo fluctuante; hospitalizar de inmediato en UCI cardíaca",
            "Depresión mayor pseudodemencia; iniciar dosis máximas de Amitriptilina"
          ],
          rationale: "El deterioro de la memoria y la pérdida de la funcionalidad (AIVD) definen el Trastorno Neurocognitivo Mayor. Descartar causas reversibles de demencia (déficit de B12, hipotiroidismo, neurosífilis) es una obligación diagnóstica.",
          take_home: "El diagnóstico de demencia requiere documentar la pérdida de independencia funcional y descartar causas metabólicas reversibles.",
          why_not: [
            { option: "Envejecimiento normal fisiológico; no requiere exámenes y se egresa a domicilio", reason: "El envejecimiento normal no cursa con pérdida de la independencia para las actividades instrumentales (manejo del dinero) ni desorientación en la propia calle." },
            { option: "Delirium agudo fluctuante; hospitalizar de inmediato en UCI cardíaca", reason: "El cuadro es crónico y lentamente progresivo (2 años), no un inicio hiperagudo y fluctuante en horas." },
            { option: "Depresión mayor pseudodemencia; iniciar dosis máximas de Amitriptilina", reason: "La amitriptilina es un antidepresivo tricíclico con altísima actividad anticolinérgica que empeoraría drásticamente el deterioro cognitivo." }
          ]
        }
      }
    },
    {
      type: "Delirium_Hypoactive",
      title: "Delirium Hipoactivo",
      symptoms: [
        "Paciente de 78 años en el segundo día postoperatorio de fractura de cadera, se muestra letárgico, inatento y responde lentamente.",
        "Su nivel de conciencia fluctúa drásticamente durante el día, alternando periodos de somnolencia profunda con momentos de lucidez parcial.",
        "No logra restar de 7 en 7 a partir de 100 y olvida las indicaciones básicas dadas hace 5 minutos.",
        "Su cuidador refiere que por las noches se desorienta y susurra incoherentemente."
      ],
      labs: {
        facil: "Signos vitales: FC 80 lpm, PA 115/75 mmHg, T° 37.5°C. Saturación O2 91% al aire ambiente.",
        media: "Constantes estables. Exámenes: Sodio sérico 128 mEq/L (hiponatremia), Leucocitos 13,500/mm3. Examen general de orina: bacterias abundantes.",
        dificil: "Exámenes: Sodio 127 mEq/L, Creatinina 1.9 mg/dL (elevada). EGO positivo para nitritos y leucocitos. Gasometría: hipoxemia leve."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y la etiología primaria sospechada?",
          expected_answer: "Delirium hipoactivo secundario a infección del tracto urinario (ITU) e hiponatremia; realizar abordaje médico completo",
          distractors: [
            "Demencia tipo Alzheimer de inicio súbito; iniciar Donepezilo de inmediato",
            "Depresión mayor melancólica; iniciar Fluoxetina oral",
            "Accidente cerebrovascular isquémico extenso; enviar a quirófano para craneotomía descompresiva"
          ],
          rationale: "La fluctuación del nivel de alerta, la inatención aguda y el perfil post-quirúrgico definen el Delirium Hipoactivo. Los hallazgos de hiponatremia y bacterias en orina apuntan a causas orgánicas desencadenantes.",
          take_home: "El delirium hipoactivo suele pasar desapercibido por su carácter silente, pero su origen es puramente médico.",
          why_not: [
            { option: "Demencia tipo Alzheimer de inicio súbito; iniciar Donepezilo de inmediato", reason: "La demencia no inicia de forma súbita e inestable en 48 horas post-quirúrgicas; el Donepezilo no es un tratamiento para delirium agudo." },
            { option: "Depresión mayor melancólica; iniciar Fluoxetina oral", reason: "El letargo es secundario a la fluctuación del sensorio (inatención orgánica aguda), no a una depresión afectiva primaria, y los antidepresivos no actúan de inmediato." },
            { option: "Accidente cerebrovascular isquémico extenso; enviar a quirófano para craneotomía descompresiva", reason: "No hay déficit motor focalizado (hemiplejía, asimetría facial) que justifique neurocirugía de urgencia sin neuroimagen previa." }
          ]
        }
      }
    },
    {
      type: "PTSD",
      title: "Trastorno de Estrés Postraumático (TEPT)",
      symptoms: [
        "Presenta recuerdos intrusivos y pesadillas vívidas diarias tras sobrevivir a un asalto armado violento hace 6 meses.",
        "Evita activamente pasar por la calle del suceso y rechaza subirse a transportes públicos.",
        "Muestra un estado de hipervigilancia constante, sobresaltándose ante ruidos cotidianos mínimos (hiperacusia autonómica).",
        "Refiere aplanamiento afectivo, sintiéndose incapaz de experimentar alegría o conectarse emocionalmente con su familia."
      ],
      labs: {
        facil: "Signos vitales: FC 90 lpm, PA 118/78 mmHg. Exploración física general sin alteraciones focales.",
        media: "Constantes: FC 96 lpm. Examen toxicológico negativo. ECG: ritmo sinusal normal sin arritmias.",
        dificil: "Polisomnografía (opcional): fragmentación del sueño REM. Escala PCL-5: 52 puntos (TEPT clínicamente severo)."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y la terapia psicológica recomendada de primera línea?",
          expected_answer: "Trastorno de Estrés Postraumático; Psicoterapia Cognitivo-Conductual enfocada en el Trauma o terapia EMDR",
          distractors: [
            "Trastorno límite de la personalidad; terapia psicoanalítica clásica de larga duración",
            "Trastorno adaptativo simple; derivar a consejería laboral genérica",
            "Fobia específica simple; desensibilización clásica únicamente"
          ],
          rationale: "La combinación de reexperimentación (pesadillas, flashbacks), evitación, hiperalerta y alteraciones afectivas que persisten más de un mes tras un trauma severo define el TEPT. Las terapias de primera línea son la TCC enfocada en trauma o EMDR.",
          take_home: "La TCC enfocada en trauma y la EMDR son las psicoterapias con mayor nivel de evidencia para el TEPT.",
          why_not: [
            { option: "Trastorno límite de la personalidad; terapia psicoanalítica clásica de larga duración", reason: "El TLP implica inestabilidad afectiva de larga data en relaciones interpersonales, no un cuadro secundario a un evento traumático delimitado con flashbacks." },
            { option: "Trastorno adaptativo simple; derivar a consejería laboral genérica", reason: "Los trastornos adaptativos son respuestas a estresores cotidianos y no cursan con síntomas tan severos de reexperimentación y evitación fóbica extrema." },
            { option: "Fobia específica simple; desensibilización clásica únicamente", reason: "La fobia simple no cursa con flashbacks, pesadillas disociativas de eventos pasados ni hipervigilancia difusa constante." }
          ]
        }
      }
    },
    {
      type: "Anorexia",
      title: "Anorexia Nerviosa",
      symptoms: [
        "Paciente de 19 años con restricción voluntaria y severa de la ingesta calórica con el fin de perder peso.",
        "Presenta distorsión grave de su imagen corporal, percibiéndose con sobrepeso a pesar de un IMC de 14.5 kg/m2.",
        "Refiere amenorrea secundaria de 4 meses de evolución y tiene intolerancia marcada al frío.",
        "A la exploración: lanugo en espalda, piel xerótica y bradicardia extrema."
      ],
      labs: {
        facil: "Signos vitales: FC 42 lpm, PA 85/55 mmHg, T° 35.8°C. IMC: 14.2 kg/m2.",
        media: "Constantes: FC 40 lpm. Exámenes: Hemoglobina 10.2 g/dL, Leucopenia leve. Potasio sérico 3.1 mEq/L (hipokalemia).",
        dificil: "Exámenes: Potasio 2.9 mEq/L, Fósforo 1.8 mg/dL (bajo), Magnesio 1.4 mEq/L. ECG: bradicardia sinusal y prolongación del intervalo QTc."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y la prioridad inmediata ante los datos de laboratorio?",
          expected_answer: "Anorexia nerviosa de tipo restrictivo grave; hospitalización médica por riesgo cardiovascular y desequilibrio hidroelectrolítico",
          distractors: [
            "Trastorno adaptativo leve; derivar a consejería nutricional electiva en 1 mes",
            "Hipotiroidismo primario severo; iniciar dosis máximas de Levotiroxina sódica únicamente",
            "Bulimia nerviosa purgativa; iniciar Fluoxetina a dosis altas en el domicilio sin vigilancia"
          ],
          rationale: "La restricción alimentaria severa con distorsión de la imagen corporal y un IMC inferior a 15, acompañado de bradicardia e hipokalemia, representa una urgencia médica vital que exige ingreso hospitalario para estabilización cardiovascular y metabólica.",
          take_home: "Un IMC < 15 con inestabilidad autonómica (bradicardia, hipotermia, hipokalemia) es indicación absoluta de ingreso hospitalario.",
          why_not: [
            { option: "Trastorno adaptativo leve; derivar a consejería nutricional electiva en 1 mes", reason: "El estado de desnutrición severa e hipokalemia pone en riesgo inminente de arritmias cardíacas letales a corto plazo." },
            { option: "Hipotiroidismo primario severo; iniciar dosis máximas de Levotiroxina sódica únicamente", reason: "La bradicardia e hipotermia son secundarias a la inanición (hipometabolismo compensatorio); dar levotiroxina de forma exógena aumentará el catabolismo y agravará el daño miocárdico." },
            { option: "Bulimia nerviosa purgativa; iniciar Fluoxetina a dosis altas en el domicilio sin vigilancia", reason: "El paciente no presenta atracones ni purgas sistemáticas y su infrapeso severo define Anorexia, no Bulimia. El tratamiento en el hogar con hipokalemia no compensada es inseguro." }
          ]
        }
      }
    },
    {
      type: "TLP",
      title: "Trastorno Límite de la Personalidad (TLP)",
      symptoms: [
        "Acude a urgencias por presentar cortes superficiales autoinfligidos en ambos antebrazos tras la ruptura de una relación sentimental de 2 semanas.",
        "Refiere un sentimiento crónico de vacío y un miedo intenso a ser abandonado/a por sus seres queridos.",
        "Muestra oscilaciones extremas del afecto en pocas horas, pasando de la idealización a la devaluación absoluta de su terapeuta.",
        "Refiere episodios de ira intensa y descontrolada que frecuentemente terminan en agresiones verbales o conductas autodestructivas."
      ],
      labs: {
        facil: "Signos vitales normales. Heridas en antebrazo superficiales, limpias y sin sangrado activo.",
        media: "Constantes normales. Toxicología urinaria: negativa. Exploración física: cicatrices previas en múltiples etapas de cicatrización en extremidades.",
        dificil: "Heridas superficiales tratadas. Escala de impulsividad de Barratt elevada. Exámenes generales normales."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico de sospecha y la conducta inicial en urgencias?",
          expected_answer: "Trastorno límite de la personalidad; realizar curación de heridas, evaluar el riesgo suicida activo y derivar a psicoterapia especializada",
          distractors: [
            "Episodio psicótico agudo; indicar Haloperidol IM en dosis altas de por vida",
            "Simulación utilitaria; egresar de urgencias sin curar las heridas para no reforzar la conducta",
            "Trastorno bipolar de ciclo rápido; hospitalizar de inmediato en área cerrada de aislamiento"
          ],
          rationale: "La impulsividad, las conductas autolesivas, la inestabilidad en las relaciones interpersonales y la reactividad del afecto orientan a un Trastorno Límite de la Personalidad. La prioridad es asegurar la integridad del paciente mediante curación de heridas y evaluación de riesgo suicida de fondo.",
          take_home: "Las autolesiones en el TLP requieren una respuesta empática, curación de heridas física y evaluación rigurosa del riesgo de suicidio.",
          why_not: [
            { option: "Episodio psicótico agudo; indicar Haloperidol IM en dosis altas de por vida", reason: "Los síntomas no son puramente psicóticos nucleares (no hay delirios sistematizados) y los antipsicóticos de por vida no tratan la base de la personalidad." },
            { option: "Simulación utilitaria; egresar de urgencias sin curar las heridas para no reforzar la conducta", reason: "Negar la curación básica de heridas es una negligencia ética y clínica severa que incrementa el riesgo de infección y el sufrimiento." },
            { option: "Trastorno bipolar de ciclo rápido; hospitalizar de inmediato en área cerrada de aislamiento", reason: "Las oscilaciones del afecto en el TLP ocurren en minutos u horas ante estresores relacionales; el ciclo rápido del trastorno bipolar cursa con episodios afectivos delimitados de varios días." }
          ]
        }
      }
    },
    {
      type: "Autism",
      title: "Trastorno del Espectro Autista",
      symptoms: [
        "Paciente de 6 años es llevado a valoración por nula comunicación verbal e imposibilidad para sostener la mirada (contacto visual pobre).",
        "Muestra conductas repetitivas de aleteo de manos ('flapping') y alineación milimétrica de carritos por horas.",
        "Refiere irritabilidad extrema ante ruidos mínimos cotidianos (ej. licuadora o aspiradora) y rigidez ante cambios de rutina.",
        "Carece de juego simbólico o compartido, interactuando con los demás únicamente para obtener objetos instrumentales."
      ],
      labs: {
        facil: "Signos vitales estables. Exploración neurológica general normal. Examen físico sin malformaciones mayores.",
        media: "Constantes normales. Audiometría completa: normal (descarta hipoacusia como causa del mutismo). electroencefalograma (EEG) normal.",
        dificil: "EEG de vigilia y sueño normal. Cariotipo y análisis genético para síndrome de X frágil: negativo. Escala ADOS-2 confirmatoria."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico más probable y la primera prueba complementaria obligatoria a solicitar ante la falta de lenguaje?",
          expected_answer: "Trastorno del Espectro Autista (TEA); solicitar audiometría completa para descartar hipoacusia",
          distractors: [
            "Retraso simple del lenguaje; esperar a los 10 años para evaluar",
            "Trastorno por Déficit de Atención; iniciar atomoxetina oral",
            "Mutismo selectivo psicógeno únicamente; iniciar terapia de juego tradicional"
          ],
          rationale: "La tríada de alteración en la interacción social recíproca, fallos de comunicación y patrones repetitivos/restringidos orienta a TEA. Ante un niño que no habla, la audiometría es obligatoria para descartar sordera antes de concluir causa neurobiológica.",
          take_home: "La sordera debe descartarse formalmente mediante audiometría en todo paciente pediátrico con retraso del lenguaje.",
          why_not: [
            { option: "Retraso simple del lenguaje; esperar a los 10 años para evaluar", reason: "Esperar a los 10 años es una omisión grave que anula el periodo crítico de plasticidad cerebral para la adquisición del lenguaje." },
            { option: "Trastorno por Déficit de Atención; iniciar atomoxetina oral", reason: "El TDAH afecta la atención y la conducta motora, pero no cursa con el aleteo, la resistencia al cambio ni el aislamiento social profundo del TEA." },
            { option: "Mutismo selectivo psicógeno únicamente; iniciar terapia de juego tradicional", reason: "El mutismo selectivo implica que el niño sí habla en casa pero no en la escuela; en este caso hay nulo lenguaje general y conductas estereotipadas motoras." }
          ]
        }
      }
    },
    {
      type: "Insomnia",
      title: "Insomnio Primario",
      symptoms: [
        "Presenta dificultad severa para conciliar el sueño (latencia > 60 minutos) casi todas las noches desde hace 4 meses.",
        "Refiere despertar cansado/a, con somnolencia diurna importante, fatiga y fallas en la concentración laboral.",
        "Tiene una gran ansiedad y frustración al meterse a la cama, temiendo que no podrá dormir y mirando el reloj constantemente.",
        "El problema del sueño ocurre a pesar de contar con condiciones adecuadas y tiempo suficiente para el descanso."
      ],
      labs: {
        facil: "Signos vitales normales. Examen físico y mental general dentro de rangos normales.",
        media: "Constantes normales. Perfil tiroideo: normal (descarta hipertiroidismo como causa del insomnio). Hemograma normal.",
        dificil: "Polisomnografía (de ser necesaria): eficiencia del sueño < 75%, latencia del sueño aumentada, sin datos de apnea obstructiva del sueño (IAH < 5)."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y la terapia de primera elección no farmacológica recomendada?",
          expected_answer: "Trastorno de insomnio crónico; Terapia Cognitivo-Conductual para el Insomnio (TCC-I)",
          distractors: [
            "Apnea del sueño obstructiva; uso de dispositivo CPAP nasal inmediato sin estudio previo",
            "Depresión bipolar maníaca; hospitalización en área de aislamiento",
            "Insomnio transitorio; recetar Diazepam a permanencia sin límite de tiempo"
          ],
          rationale: "La dificultad para el sueño que persiste por ≥ 3 meses afectando el funcionamiento diurno constituye un Trastorno de Insomnio Crónico. La TCC-I es la intervención de primera línea con mayor nivel de evidencia a largo plazo.",
          take_home: "La TCC-I (restricción del sueño, control de estímulos) es el tratamiento de elección para el insomnio crónico.",
          why_not: [
            { option: "Apnea del sueño obstructiva; uso de dispositivo CPAP nasal inmediato sin estudio previo", reason: "El CPAP requiere una polisomnografía diagnóstica previa para ajustar presiones; además, el cuadro describe dificultad de conciliación por ansiedad, no ronquido con apneas." },
            { option: "Depresión bipolar maníaca; hospitalización en área de aislamiento", reason: "El paciente desea dormir y sufre por no lograrlo; en la manía hay menor necesidad de sueño y no hay frustración al respecto." },
            { option: "Insomnio transitorio; recetar Diazepam a permanencia sin límite de tiempo", reason: "El diazepam a permanencia induce tolerancia, insomnio de rebote al suspender, y riesgo elevado de caídas y adicción." }
          ]
        }
      }
    },
    {
      type: "Somatoform",
      title: "Trastorno de Síntomas Somáticos",
      symptoms: [
        "Paciente de 34 años con historia de dolor abdominal crónico, mareo difuso y dolor articular de 2 años de evolución.",
        "Ha consultado a 8 médicos especialistas diferentes y se ha realizado múltiples RMN y endoscopias, todas normales.",
        "Presenta una ansiedad extrema sobre sus síntomas, dedicando más de 4 horas diarias a buscar enfermedades en internet.",
        "Se muestra sumamente frustrado/a e irritable porque los médicos le dicen que 'no tiene nada y que todo es psicológico'."
      ],
      labs: {
        facil: "Signos vitales normales. Exploración física: sin evidencia de puntos dolorosos articulares orgánicos o abdomen agudo.",
        media: "Constantes normales. Exámenes: Hemograma normal, reactantes de fase aguda (VSG, PCR) negativos. Función renal y hepática normal.",
        dificil: "Endoscopia digestiva: normal. Colonoscopia: normal. Anticuerpos ANA, factor reumatoide: negativos. Perfil tiroideo normal."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico más probable y la estrategia de manejo médico recomendada?",
          expected_answer: "Trastorno de síntomas somáticos; programar visitas regulares con un solo médico de atención primaria de cabecera, evitar estudios diagnósticos innecesarios y referir a TCC",
          distractors: [
            "Fiebre de origen desconocido; hospitalizar de inmediato para repetir las 8 endoscopias",
            "Simulación utilitaria para obtener incapacidad; reportar a su trabajo y suspender atención",
            "Lupus eritematoso sistémico inicial; iniciar dosis altas de Prednisona de por vida"
          ],
          rationale: "La preocupación excesiva desproporcionada por síntomas somáticos crónicos que deterioran la vida diaria define este trastorno. La estrategia es centralizar su atención con un solo médico para evitar la yatrogenia y polifarmacia por 'doctor shopping'.",
          take_home: "La centralización de la atención con un solo médico de cabecera previene la yatrogenia por exámenes médicos repetitivos.",
          why_not: [
            { option: "Fiebre de origen desconocido; hospitalizar de inmediato para repetir las 8 endoscopias", reason: "El paciente no tiene fiebre documentada y repetir estudios invasivos normales solo alimenta su ansiedad somática." },
            { option: "Simulación utilitaria para obtener incapacidad; reportar a su trabajo y suspender atención", reason: "Los síntomas dolorosos y la angustia que experimenta el paciente son reales; no hay evidencia de producción voluntaria consciente con fines delictivos." },
            { option: "Lupus eritematoso sistémico inicial; iniciar dosis altas de Prednisona de por vida", reason: "Los marcadores de autoinmunidad (ANA) y de inflamación son normales; los esteroides tienen efectos adversos severos y no están indicados en dolores somáticos funcionales." }
          ]
        }
      }
    },
    {
      type: "Social_Phobia",
      title: "Trastorno de Ansiedad Social",
      symptoms: [
        "Presenta un temor extremo y persistente a ser evaluado negativamente o humillado al hablar frente a sus compañeros de trabajo.",
        "Refiere temblor visible de manos, sudoración excesiva, enrojecimiento facial y taquicardia cuando debe hacer una presentación.",
        "Evita de forma sistemática reuniones sociales, almuerzos grupales y cualquier situación donde sea el centro de atención.",
        "Reconoce que su miedo es desproporcionado, pero este le impide aceptar un ascenso laboral largamente deseado."
      ],
      labs: {
        facil: "Signos vitales normales en reposo. Exploración general normal.",
        media: "Constantes normales en consulta. Exámenes de laboratorio generales: normales (descarta feocromocitoma).",
        dificil: "Evaluación clínica: Escala de Ansiedad de Liebowitz: 74 puntos (ansiedad social severa). Constantes normales."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico y la intervención de primera elección?",
          expected_answer: "Trastorno de ansiedad social (fobia social); Terapia Cognitivo-Conductual con entrenamiento en habilidades sociales y exposición",
          distractors: [
            "Esquizofrenia paranoide; iniciar Olanzapina a dosis máximas de inmediato",
            "Trastorno de la personalidad antisocial; referir a terapia de grupo obligatoria",
            "Timidez normal evolutiva; recomendar al paciente 'echarle ganas' y no hacer nada"
          ],
          rationale: "El temor marcado a situaciones sociales en las que la persona está expuesta al posible escrutinio de los demás define la Ansiedad Social. La TCC basada en la exposición y reestructuración cognitiva es el tratamiento psicológico de elección.",
          take_home: "La ansiedad social genera una severa disfuncionalidad laboral y responde de forma robusta a la TCC enfocada en exposición.",
          why_not: [
            { option: "Esquizofrenia paranoide; iniciar Olanzapina a dosis máximas de inmediato", reason: "El paciente no tiene delirios de persecución ni alucinaciones; su temor es al juicio social, reconociendo que es desproporcionado (introspección conservada)." },
            { option: "Trastorno de la personalidad antisocial; referir a terapia de grupo obligatoria", reason: "El antisocial viola los derechos de los demás por falta de empatía; en este caso hay angustia e inhibición social por timidez patológica." },
            { option: "Timidez normal evolutiva; recomendar al paciente 'echarle ganas' y no hacer nada", reason: "La timidez no interrumpe el desarrollo laboral ni bloquea ascensos profesionales como ocurre en este caso grave." }
          ]
        }
      }
    },
    {
      type: "Cocaine_Intoxication",
      title: "Urgencias: Intoxicación por Cocaína",
      symptoms: [
        "Paciente traído por paramédicos con marcada agitación psicomotriz, sudoración fría y conducta agresiva delirante.",
        "Refiere opresión torácica intensa, palpitaciones y sensación de que 'la policía lo está persiguiendo' (paranoia).",
        "A la exploración: midriasis bilateral reactiva a la luz, temblores distales y diaforesis profusa.",
        "El paciente confiesa haber consumido una sustancia en polvo blanco por vía nasal hace 1 hora."
      ],
      labs: {
        facil: "Signos vitales: FC 120 lpm, PA 165/105 mmHg, T° 37.8°C. Midriasis bilateral.",
        media: "Constantes: FC 125 lpm, PA 175/110 mmHg. ECG: taquicardia sinusal, sin elevación ST. Toxicología: positivo para metabolitos de cocaína.",
        dificil: "Constantes: FC 130 lpm, PA 185/115 mmHg. Troponinas I normales. Gasometría normal. CPK normal."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico urgente y la primera elección farmacológica para la agitación e hipertensión?",
          expected_answer: "Intoxicación aguda por cocaína (síndrome simpaticomimético); administrar Benzodiacepinas intravenosas (ej. Diazepam o Lorazepam)",
          distractors: [
            "Brote psicótico primario; administrar dosis máximas de Haloperidol IM inmediato en monoterapia",
            "Sobredosis de opiáceos; administrar Naloxona intravenosa inmediata en bolo rápido",
            "Insuficiencia cardíaca aguda; administrar digoxina y beta-bloqueadores puros como Propranolol"
          ],
          rationale: "La intoxicación por cocaína produce un síndrome simpaticomimético severo (hipertensión, taquicardia, agitación, paranoia). Las benzodiacepinas son el tratamiento de primera línea al disminuir la hiperactividad adrenérgica central y periférica.",
          take_home: "Las benzodiacepinas IV controlan de forma segura la agitación e hipertensión en la toxicidad por cocaína.",
          why_not: [
            { option: "Brote psicótico primario; administrar dosis máximas de Haloperidol IM inmediato en monoterapia", reason: "El haloperidol puede agravar la hipertermia, prolongar el intervalo QT y disminuir el umbral convulsivo en intoxicados por cocaína." },
            { option: "Sobredosis de opiáceos; administrar Naloxona intravenosa inmediata en bolo rápido", reason: "El paciente está agitado y midriático (estimulado), no en coma ni con pupilas puntiformes (miosis) típicas de opiáceos." },
            { option: "Insuficiencia cardíaca aguda; administrar digoxina y beta-bloqueadores puros como Propranolol", reason: "El uso de beta-bloqueadores puros (como Propranolol) en intoxicación por cocaína está contraindicado por el riesgo de estimulación alfa-adrenérgica sin oposición, lo que causa vasoespasmo coronario letal." }
          ]
        }
      }
    },
    {
      type: "Esquizoafectivo",
      title: "Trastorno Esquizoafectivo",
      symptoms: [
        "Paciente de 25 años con ideas delirantes de persecución sistematizadas y alucinaciones auditivas de 3 meses de evolución.",
        "De forma paralela, desarrolla en las últimas 3 semanas un cuadro de euforia extrema, verborrea, insomnio global e hiperactividad motora.",
        "Refiere historia previa de escuchar voces que comentaban sus actos durante 2 meses en un periodo donde su estado de ánimo era estable.",
        "El cuadro actual interrumpe gravemente su funcionalidad y se acompaña de compras compulsivas delirantes."
      ],
      labs: {
        facil: "Signos vitales: FC 98 lpm, PA 120/80 mmHg. Examen físico normal.",
        media: "Constantes: FC 102 lpm. Exámenes metabólicos normales. Toxicología urinaria: negativa. Perfil tiroideo normal.",
        dificil: "Hemograma y función renal: normales. Litio sérico negativo. Escala de Young: 22 puntos."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico de sospecha y el abordaje farmacológico de primera elección?",
          expected_answer: "Trastorno esquizoafectivo de tipo bipolar; iniciar un antipsicótico atípico (ej. Risperidona u Olanzapina) combinado con un estabilizador (ej. Litio o Valproato)",
          distractors: [
            "Esquizofrenia paranoide pura; iniciar Haloperidol a dosis altas sin estabilizadores",
            "Depresión unipolar psicótica; iniciar Fluoxetina en monoterapia a dosis máximas",
            "Trastorno límite de la personalidad; referir a terapia cognitivo-conductual únicamente"
          ],
          rationale: "La coexistencia de síntomas psicóticos puros (fuera del episodio afectivo por ≥ 2 semanas) con un episodio maníaco agudo define el Trastorno Esquizoafectivo de tipo Bipolar. Se requiere la combinación de antipsicóticos y estabilizadores.",
          take_home: "El trastorno esquizoafectivo exige la presencia de síntomas psicóticos puros durante al menos 2 semanas en ausencia de síntomas del estado de ánimo.",
          why_not: [
            { option: "Esquizofrenia paranoide pura; iniciar Haloperidol a dosis altas sin estabilizadores", reason: "La esquizofrenia pura no presenta episodios afectivos maníacos completos y severos que requieran estabilizadores del ánimo de forma nuclear." },
            { option: "Depresión unipolar psicótica; iniciar Fluoxetina en monoterapia a dosis máximas", reason: "El paciente presenta euforia, verborrea e hiperactividad (manía), no depresión, y los antidepresivos sin estabilizadores inducen viraje." },
            { option: "Trastorno límite de la personalidad; referir a terapia cognitivo-conductual únicamente", reason: "El TLP no cursa con delirios persecutorios fijos persistentes por meses ni alucinaciones auditivas en ausencia de crisis afectivas." }
          ]
        }
      }
    },
    {
      type: "Explosivo_Intermitente",
      title: "Trastorno Explosivo Intermitente",
      symptoms: [
        "Paciente de 25 años acude por presentar arrebatos agresivos verbales y físicos desproporcionados ante estresores cotidianos mínimos (ej. que alguien se le adelante en el tráfico).",
        "Durante los episodios, destruye objetos valiosos y ha llegado a agredir físicamente a desconocidos sin motivo aparente.",
        "Refiere que tras el arrebato agresivo, experimenta una intensa sensación de culpa, arrepentimiento y autorreproche.",
        "Los episodios agresivos duran menos de 30 minutos y no están motivados por la obtención de dinero u otros fines utilitarios."
      ],
      labs: {
        facil: "Signos vitales normales en consulta. Examen físico normal.",
        media: "Constantes normales. electroencefalograma (EEG): normal (descarta epilepsia del lóbulo temporal). Toxicología urinaria: negativa.",
        dificil: "EEG normal. Resonancia magnética cerebral normal. Escala de agresión implícita elevada. Exámenes metabólicos normales."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico de sospecha y el abordaje terapéutico indicado?",
          expected_answer: "Trastorno explosivo intermitente; Terapia Cognitivo-Conductual enfocada en la regulación de la ira más inhibidores selectivos de la recaptura de serotonina (ISRS)",
          distractors: [
            "Trastorno de la personalidad antisocial; referir a centro penitenciario sin evaluación",
            "Epilepsia del lóbulo temporal afectiva; iniciar Carbamazepina a dosis máximas de por vida únicamente",
            "Simulación utilitaria; dar de alta sin intervención"
          ],
          rationale: "Los arrebatos agresivos recurrentes y desproporcionados que duran menos de 30 minutos y se acompañan de arrepentimiento/culpa son típicos del Trastorno Explosivo Intermitente. Responde a TCC combinada con ISRS.",
          take_home: "El trastorno explosivo intermitente se caracteriza por episodios breves e incontrolables de ira seguidos de remordimiento genuino.",
          why_not: [
            { option: "Trastorno de la personalidad antisocial; referir a centro penitenciario sin evaluación", reason: "El antisocial no experimenta culpa ni remordimiento genuino, y sus agresiones suelen ser planificadas y utilitarias." },
            { option: "Epilepsia del lóbulo temporal afectiva; iniciar Carbamazepina a dosis máximas de por vida únicamente", reason: "Aunque simula arrebatos de ira, el EEG normal y la ausencia de automatismos, aura o estado postictal descartan epilepsia." },
            { option: "Simulación utilitaria; dar de alta sin intervención", reason: "La culpa intensa y la disfuncionalidad familiar y laboral severa indican un trastorno mental real que amerita atención clínica." }
          ]
        }
      }
    },
    {
      type: "Depresion_Bipolar",
      title: "Depresión Bipolar",
      symptoms: [
        "Paciente de 25 años presenta un cuadro depresivo grave con anhedonia, fatiga extrema e hipersomnia de 3 semanas de evolución.",
        "Refiere historia previa, a los 22 años, de un periodo de 5 días de euforia, menor necesidad de sueño y verborrea que no requirió hospitalización.",
        "Ha iniciado manejo hace 4 días con Fluoxetina en monoterapia por su médico general, desarrollando ansiedad extrema e insomnio agudo.",
        "Sus familiares notan que hoy habla muy rápido, está sumamente irritable y tiene pensamientos acelerados (viraje inducido)."
      ],
      labs: {
        facil: "Signos vitales: FC 94 lpm, PA 125/80 mmHg. Exploración física normal.",
        media: "Constantes normales. Toxicología urinaria: negativa. Exámenes tiroideos normales. Litio sérico negativo.",
        dificil: "Constantes normales. Escala de Hamilton: 24 puntos. Antecedente familiar directo de Trastorno Bipolar en primer grado."
      },
      tasks: {
        licenciatura: {
          instruction: "¿Cuál es el diagnóstico clínico correcto, el error farmacológico cometido y el primer paso inmediato?",
          expected_answer: "Depresión bipolar tipo II con viraje farmacológico a hipomanía/mixto; el error fue el uso de un antidepresivo (Fluoxetina) en monoterapia; suspender la Fluoxetina de inmediato",
          distractors: [
            "Depresión unipolar resistente; el error fue dar dosis bajas, por lo que se debe duplicar la Fluoxetina",
            "Esquizofrenia paranoide; el error fue no usar Haloperidol IM inmediato en dosis de impregnación",
            "Trastorno adaptativo; el error fue dar fármacos, por lo que se debe suspender todo y no hacer seguimiento"
          ],
          rationale: "El antecedente de un periodo hipomaníaco previo (5 días de euforia e insomnio) define el Trastorno Bipolar tipo II. El uso de antidepresivos en monoterapia induce viraje maníaco o estados mixtos inestables; la suspensión del antidepresivo es imperativa.",
          take_home: "Los antidepresivos en monoterapia están contraindicados en el trastorno bipolar por el alto riesgo de inducir viraje a manía o estados mixtos.",
          why_not: [
            { option: "Depresión unipolar resistente; el error fue dar dosis bajas, por lo que se debe duplicar la Fluoxetina", reason: "Duplicar la fluoxetina en pleno viraje inducido aumentará críticamente la agitación, el riesgo de viraje maníaco severo y la ideación suicida." },
            { option: "Esquizofrenia paranoide; el error fue no usar Haloperidol IM inmediato en dosis de impregnación", reason: "El cuadro es puramente afectivo bipolar, no esquizofrenia primaria, y el haloperidol en monoterapia puede causar depresión severa post-psicosis." },
            { option: "Trastorno adaptativo; el error fue dar fármacos, por lo que se debe suspender todo y no hacer seguimiento", reason: "El trastorno bipolar tipo II es una patología crónica severa que requiere seguimiento y estabilizadores del ánimo, no un simple abandono." }
          ]
        }
      }
    }
  ];

  function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createCase(filters = {}) {
    const difficulty = filters.difficulty || "media";

    const mod = getRandom(SYMPTOM_MODULES);
    const name = `${getRandom(NAMES)} ${getRandom(LAST_NAMES)}`;
    const age = getRandom(AGES);
    const context = getRandom(CONTEXTS);

    // 2 síntomas aleatorios del módulo para variar el texto clínico
    const selectedSymptoms = shuffle(mod.symptoms).slice(0, 2).join(" ");

    // Obtener labs paraclínicos basados en dificultad
    const labText = mod.labs[difficulty] || mod.labs.media;

    const story = `Paciente de ${age}, ${name}, se encuentra ${context}. Presenta el siguiente cuadro: "${selectedSymptoms}"\n\n[Datos Clínicos/Paraclínicos] ${labText}`;

    const taskData = mod.tasks.licenciatura;

    return {
      case_id: `MODULAR_${mod.type}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      title: mod.title,
      // El título del módulo nombra el diagnóstico, que suele ser la respuesta.
      display_title: `Paciente de ${age} ${context}`,
      educational_level: "licenciatura",
      difficulty: difficulty,
      case_type: "razonamiento_clinico",
      metadata: { is_real_data: false, module_type: mod.type },
      source_chunks: [
        { 
          chunk_id: `GEN_${mod.type}_CH`, 
          text_content: story
        }
      ],
      tasks: [
        {
          task_id: `T_GEN_${mod.type}_${Date.now()}`,
          instruction: taskData.instruction,
          expected_answer: taskData.expected_answer,
          distractors: taskData.distractors,
          rationale: taskData.rationale
        }
      ],
      explanation: {
        rationale: taskData.rationale,
        take_home: taskData.take_home,
        why_not: taskData.why_not
      }
    };
  }

  return { createCase };
})();

window.Generator = Generator;