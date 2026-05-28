"use strict";

/**
 * Generator — Procedural Case Engine (Modular V3)
 * Crea casos infinitos con 20 módulos clínicos enriquecidos con datos paraclínicos,
 * adaptabilidad a dificultad (fácil/media/difícil) y nivel educativo (licenciatura/residencia/especialidad),
 * además de explicaciones estructuradas con rationale, take_home y why_not.
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
        },
        residencia: {
          instruction: "¿Cuál es el dominio RDoC primario y la primera línea de estabilización farmacológica indicada?",
          expected_answer: "Positive Valence Systems (Recompensa) e iniciar Carbonato de Litio o Valproato",
          distractors: [
            "Negative Valence Systems e iniciar Fluoxetina",
            "Cognitive Systems e iniciar Metilfenidato",
            "Arousal Systems e iniciar Benzodiacepinas en monoterapia"
          ],
          rationale: "En la manía, hay una desregulación masiva de los sistemas de valencia positiva (búsqueda de recompensa y grandiosidad). El litio o valproato son los estabilizadores del ánimo estándar de oro.",
          take_home: "La manía representa una hiperactividad del circuito de recompensa frontoestriatal, tratable con estabilizadores y antipsicóticos.",
          why_not: [
            { option: "Negative Valence Systems e iniciar Fluoxetina", reason: "Fluoxetina (antidepresivo) está contraindicada en manía aguda ya que empeora el cuadro clínico e induce ciclado." },
            { option: "Cognitive Systems e iniciar Metilfenidato", reason: "Metilfenidato es un estimulante que agravaría severamente la agitación y la psicosis maníaca." },
            { option: "Arousal Systems e iniciar Benzodiacepinas en monoterapia", reason: "Las benzodiacepinas ayudan con la agitación o el sueño, pero no tratan la etiología afectiva subyacente de la manía." }
          ]
        },
        especialidad: {
          instruction: "Paciente agitado que rechaza la vía oral. ¿Cuál es el manejo de rescate de primera línea?",
          expected_answer: "Antipsicótico atípico intramuscular (ej. Olanzapina o Aripiprazol) y contención física si hay riesgo inminente",
          distractors: [
            "Haloperidol IM combinado con Amitriptilina oral",
            "Litio por sonda nasogástrica forzada",
            "Aplicación inmediata de Terapia Electroconvulsiva (TEC) sin sedación"
          ],
          rationale: "Ante agitación grave psicótica con rechazo a la vía oral, los antipsicóticos atípicos IM ofrecen rapidez, seguridad y mejor perfil extrapiramidal que los típicos.",
          take_home: "La vía intramuscular con atípicos es la preferida en urgencias por su rapidez de acción y tolerabilidad.",
          why_not: [
            { option: "Haloperidol IM combinado con Amitriptilina oral", reason: "La amitriptilina es un antidepresivo tricíclico altamente delirogénico que empeoraría gravemente la manía." },
            { option: "Litio por sonda nasogástrica forzada", reason: "El uso de sonda nasogástrica de forma forzada es sumamente invasivo, inseguro en agitación y éticamente cuestionable." },
            { option: "Aplicación inmediata de Terapia Electroconvulsiva (TEC) sin sedación", reason: "La TEC requiere anestesia y relajación muscular obligatoria, y no es el primer paso antes de intentar farmacoterapia IM." }
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
        },
        residencia: {
          instruction: "¿A qué dominio RDoC corresponde la sintomatología depresiva y qué grupo de fármacos es el de elección?",
          expected_answer: "Negative Valence Systems (Pérdida/Desesperanza) e inhibidores selectivos de la recaptura de serotonina (ISRS)",
          distractors: [
            "Positive Valence Systems (Hiperactividad) y estimulantes dopaminérgicos",
            "Cognitive Systems y benzodiacepinas de acción prolongada",
            "Sensorimotor Systems y estabilizadores del canal de sodio"
          ],
          rationale: "La depresión se mapea en los sistemas de valencia negativa de RDoC bajo la dimensión de pérdida y amenaza sostenida. Los ISRS son la primera línea farmacológica recomendada.",
          take_home: "Los ISRS son la opción de primera línea por su favorable balance de eficacia y perfil de efectos adversos.",
          why_not: [
            { option: "Positive Valence Systems (Hiperactividad) y estimulantes dopaminérgicos", reason: "El paciente sufre de hipoactividad del sistema de recompensa (anhedonia); los estimulantes no son antidepresivos eficaces a largo plazo." },
            { option: "Cognitive Systems y benzodiacepinas de acción prolongada", reason: "Las benzodiacepinas no tienen propiedades antidepresivas e incrementan el letargo y el riesgo de dependencia." },
            { option: "Sensorimotor Systems y estabilizadores del canal de sodio", reason: "Los estabilizadores de canales de sodio no actúan sobre las redes serotoninérgicas de la depresión afectiva." }
          ]
        },
        especialidad: {
          instruction: "Paciente que no responde a dos ensayos adecuados de ISRS y mantiene ideación suicida activa. ¿Manejo indicado?",
          expected_answer: "Considerar depresión resistente; indicar Terapia Electroconvulsiva (TEC) o Esketamina intranasal",
          distractors: [
            "Aumentar el ISRS al triple de la dosis máxima permitida",
            "Cambiar a psicoterapia de apoyo únicamente y suspender fármacos",
            "Iniciar Alprazolam intravenoso a dosis sedantes continuas"
          ],
          rationale: "La falta de respuesta a dos antidepresivos diferentes a dosis y tiempo adecuados define la depresión resistente. En casos con alto riesgo suicida, la TEC o la esketamina brindan una respuesta rápida y antisuicida evidenciable.",
          take_home: "La TEC y la esketamina son intervenciones altamente eficaces y de acción rápida para la depresión resistente con riesgo suicida.",
          why_not: [
            { option: "Aumentar el ISRS al triple de la dosis máxima permitida", reason: "Triplicar la dosis máxima no añade eficacia y expone al paciente a toxicidad severa y síndrome serotoninérgico." },
            { option: "Cambiar a psicoterapia de apoyo únicamente y suspender fármacos", reason: "La suspensión de fármacos en un cuadro grave de depresión resistente aumenta críticamente el riesgo de suicidio." },
            { option: "Iniciar Alprazolam intravenoso a dosis sedantes continuas", reason: "El alprazolam es un ansiolítico, no antidepresivo, y la sedación no elimina la ideación suicida de fondo." }
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
        },
        residencia: {
          instruction: "¿Qué vía dopaminérgica está hiperactiva en los síntomas positivos de este paciente y qué fármaco es adecuado?",
          expected_answer: "Vía mesolímbica; iniciar Risperidona u Olanzapina",
          distractors: [
            "Vía nigroestriada; iniciar Biperideno en monoterapia",
            "Vía tuberoinfundibular; iniciar Cabergolina",
            "Vía mesocortical; iniciar Metilfenidato"
          ],
          rationale: "La sintomatología positiva (delirios, alucinaciones) es secundaria a la hiperactividad dopaminérgica en la vía mesolímbica. Los antipsicóticos atípicos actúan bloqueando los receptores D2 en esta región.",
          take_home: "La vía mesolímbica es la responsable de los síntomas positivos psicóticos; su bloqueo D2 disminuye la psicosis.",
          why_not: [
            { option: "Vía nigroestriada; iniciar Biperideno en monoterapia", reason: "La vía nigroestriada se encarga del control motor. El biperideno es un anticolinérgico para efectos extrapiramidales, no trata la psicosis." },
            { option: "Vía tuberoinfundibular; iniciar Cabergolina", reason: "La vía tuberoinfundibular regula la prolactina; la cabergolina es un agonista dopaminérgico que exacerbaría severamente la psicosis." },
            { option: "Vía mesocortical; iniciar Metilfenidato", reason: "La vía mesocortical está asociada a síntomas negativos y cognitivos (hipodopaminergia). Los estimulantes empeoran la psicosis activa mesolímbica." }
          ]
        },
        especialidad: {
          instruction: "El paciente desarrolla rigidez severa en tubo de plomo, fiebre de 39.5°C, taquicardia y elevación masiva de creatincinasa (CK). ¿Diagnóstico y manejo?",
          expected_answer: "Síndrome Neuroléptico Maligno (SNM); suspender antipsicóticos, dar soporte y administrar Dantroleno o Bromocriptina",
          distractors: [
            "Distonía aguda severa; aumentar la dosis del antipsicótico de inmediato",
            "Encefalitis viral; realizar punción lumbar e iniciar Aciclovir como único manejo",
            "Agitación psicomotriz extrema; aplicar contención física por 48 horas continuas"
          ],
          rationale: "La tríada de rigidez muscular extrapiramidal severa, hipertermia, inestabilidad autonómica y CK elevada tras antipsicóticos confirma el SNM, una emergencia vital que exige retirar el antipsicótico de inmediato y dar tratamiento específico.",
          take_home: "El SNM es una complicación potencialmente mortal; la suspensión inmediata del neuroléptico es obligatoria.",
          why_not: [
            { option: "Distonía aguda severa; aumentar la dosis del antipsicótico de inmediato", reason: "Aumentar el antipsicótico en presencia de SNM es una negligencia grave que incrementa dramáticamente la mortalidad." },
            { option: "Encefalitis viral; realizar punción lumbar e iniciar Aciclovir como único manejo", reason: "Aunque simula fiebre y rigidez nucal, la CK masivamente elevada y la rigidez generalizada en tubo de plomo tras neurolépticos apuntan a SNM." },
            { option: "Agitación psicomotriz extrema; aplicar contención física por 48 horas continuas", reason: "La contención prolongada agrava la rabdomiólisis y la hipertermia, empeorando el pronóstico del SNM." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC y qué tratamiento de mantenimiento a largo plazo es el indicado?",
          expected_answer: "Negative Valence Systems (Amenaza aguda/Miedo) e inhibidores selectivos de la recaptura de serotonina (ISRS) más TCC",
          distractors: [
            "Positive Valence Systems y benzodiacepinas a permanencia como monoterapia",
            "Social Processes y antipsicóticos típicos a dosis altas",
            "Cognitive Systems y Metilfenidato"
          ],
          rationale: "Las crisis de pánico representan la activación desadaptativa del sistema de amenaza aguda (miedo/pánico) en RDoC. La primera línea a largo plazo es un ISRS combinado con Terapia Cognitivo-Conductual (TCC).",
          take_home: "Los ISRS y la TCC son la combinación terapéutica más eficaz para prevenir la recurrencia de crisis de pánico.",
          why_not: [
            { option: "Positive Valence Systems y benzodiacepinas a permanencia como monoterapia", reason: "Las benzodiacepinas alivian el síntoma agudo, pero no tratan la desregulación serotoninérgica de fondo y conllevan riesgo de tolerancia y dependencia." },
            { option: "Social Processes y antipsicóticos típicos a dosis altas", reason: "Los antipsicóticos típicos a dosis altas conllevan graves riesgos extrapiramidales y metabólicos sin beneficio demostrado en pánico puro." },
            { option: "Cognitive Systems y Metilfenidato", reason: "El metilfenidato es un estimulante simpaticomimético que inducirá o empeorará gravemente las crisis de pánico." }
          ]
        },
        especialidad: {
          instruction: "Paciente con crisis recurrentes y agorafobia que no tolera los ISRS por efectos adversos gastrointestinales graves. Alternativa indicada:",
          expected_answer: "Cambiar a un IRSN (ej. Venlafaxina) o un antidepresivo tricíclico (ej. Imipramina)",
          distractors: [
            "Suspender toda terapia farmacológica y realizar psicoanálisis clásico",
            "Agregar benzodiacepinas intramusculares de forma fija 3 veces al día",
            "Iniciar Litio a dosis máximas de mantenimiento"
          ],
          rationale: "Los IRSN como la venlafaxina o antidepresivos tricíclicos como la imipramina son opciones de segunda línea altamente efectivas para el trastorno de pánico ante la intolerancia a los ISRS.",
          take_home: "La venlafaxina y la imipramina representan segundas líneas farmacológicas robustas en trastorno de pánico.",
          why_not: [
            { option: "Suspender toda terapia farmacológica y realizar psicoanálisis clásico", reason: "La agorafobia grave requiere terapia basada en evidencia (TCC con exposición) y el tratamiento biológico alternativo sigue siendo necesario." },
            { option: "Agregar benzodiacepinas intramusculares de forma fija 3 veces al día", reason: "Las benzodiacepinas IM fijas triplican el riesgo de adicción, sedación profunda y accidentes sin tratar la etiología de fondo." },
            { option: "Iniciar Litio a dosis máximas de mantenimiento", reason: "El litio es un estabilizador del ánimo para trastorno bipolar, carece de indicación y eficacia en el trastorno de pánico puro." }
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
        },
        residencia: {
          instruction: "¿Qué receptor ionotrópico está desensibilizado crónicamente debido al alcohol y qué cofactor vitamínico debe administrarse antes de la glucosa?",
          expected_answer: "Receptor GABA-A (desensibilizado) y receptor NMDA (sobreexcitado); administrar Tiamina (Vitamina B1)",
          distractors: [
            "Receptor de Dopamina D2 y administrar Piridoxina",
            "Receptor de Serotonina 5-HT2A y administrar Ácido Fólico",
            "Receptor Nicotínico y administrar Vitamina B12"
          ],
          rationale: "El alcohol es un modulador alostérico positivo de GABA-A. Al retirarlo, hay hipoactividad gabaérgica y sobreexcitación glutamatérgica (NMDA). La tiamina debe administrarse siempre antes de la glucosa para evitar desencadenar la Encefalopatía de Wernicke.",
          take_home: "La tiamina previene el síndrome de Wernicke-Korsakoff y debe preceder a cualquier infusión de glucosa.",
          why_not: [
            { option: "Receptor de Dopamina D2 y administrar Piridoxina", reason: "La fisiopatología no se centra en D2 primario sino en el balance GABA/Glutamato, y la piridoxina no previene el Wernicke." },
            { option: "Receptor de Serotonina 5-HT2A y administrar Ácido Fólico", reason: "Los receptores 5-HT2A están relacionados con psicodélicos, no con abstinencia alcohólica, y el ácido fólico es un coadyuvante hematológico secundario." },
            { option: "Receptor Nicotínico y administrar Vitamina B12", reason: "La vitamina B12 se usa para anemia perniciosa o neuropatías desmielinizantes crónicas, no previene la neurotoxicidad por piruvato deshidrogenasa deficiente." }
          ]
        },
        especialidad: {
          instruction: "Paciente con Delirium Tremens que presenta convulsiones tónico-clónicas generalizadas recurrentes. Manejo indicado:",
          expected_answer: "Diazepam o Lorazepam por vía intravenosa en bolos lentos y asegurar vía aérea",
          distractors: [
            "Iniciar infusión de Fenitoína a dosis de impregnación neurológica",
            "Administrar Haloperidol IM inmediato para controlar los movimientos convulsivos",
            "Aplicar contención física estrecha y esperar la resolución espontánea"
          ],
          rationale: "Las convulsiones por abstinencia alcohólica responden selectivamente a los agonistas gabaérgicos (benzodiacepinas IV). La fenitoína no es eficaz para las convulsiones puras de abstinencia alcohólica.",
          take_home: "Las benzodiacepinas IV son el anticonvulsivo de elección en las crisis asociadas a abstinencia alcohólica.",
          why_not: [
            { option: "Iniciar infusión de Fenitoína a dosis de impregnación neurológica", reason: "La fenitoína carece de eficacia demostrada para las convulsiones provocadas por abstinencia alcohólica gabaérgica." },
            { option: "Administrar Haloperidol IM inmediato para controlar los movimientos convulsivos", reason: "El haloperidol reduce significativamente el umbral convulsivo, pudiendo empeorar y prolongar el estado epiléptico." },
            { option: "Aplicar contención física estrecha y esperar la resolución espontánea", reason: "Las convulsiones recurrentes provocan rabdomiólisis, hipoxia y daño neuronal si no se detienen farmacológicamente." }
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
        },
        residencia: {
          instruction: "¿Qué circuito neurobiológico está implicado y qué tratamiento farmacológico de primera línea a dosis altas está indicado?",
          expected_answer: "Circuito Córtico-Estriado-Tálamo-Cortical (CETC) e inhibidores selectivos de la recaptura de serotonina (ISRS) como Fluoxetina o Fluvoxamina",
          distractors: [
            "Circuito de la Amígdala extendida y Benzodiacepinas de alta potencia",
            "Vía Tuberoinfundibular y Antipsicóticos típicos",
            "Red Fronto-Parietal y estimulantes dopaminérgicos"
          ],
          rationale: "El TOC se asocia con hipermetabolismo e hiperconectividad en el asa córtico-estriado-tálamo-cortical. Los ISRS a dosis elevadas (superiores a las antidepresivas) son la primera línea farmacológica.",
          take_home: "El TOC requiere dosis de ISRS significativamente más altas que las utilizadas en la depresión mayor.",
          why_not: [
            { option: "Circuito de la Amígdala extendida y Benzodiacepinas de alta potencia", reason: "Las benzodiacepinas disminuyen la ansiedad de forma aguda pero no modifican el circuito obsesivo subyacente y conllevan dependencia." },
            { option: "Vía Tuberoinfundibular y Antipsicóticos típicos", reason: "Los antipsicóticos típicos a dosis altas no tratan el TOC e incluso pueden empeorar los síntomas obsesivos al bloquear D2 masivamente." },
            { option: "Red Fronto-Parietal y estimulantes dopaminérgicos", reason: "Los estimulantes dopaminérgicos aumentan la perseveración motora e intelectual, empeorando críticamente el TOC." }
          ]
        },
        especialidad: {
          instruction: "Paciente con TOC grave y resistente que ha fallado a tres ensayos de ISRS a dosis máximas más EPR. ¿Cuál es la estrategia de potenciación indicada?",
          expected_answer: "Potenciar el ISRS añadiendo dosis bajas de un antipsicótico atípico (ej. Risperidona o Aripiprazol) o considerar Clomipramina",
          distractors: [
            "Indicar hospitalización prolongada para aislamiento social completo",
            "Suspender toda la medicación y realizar terapia electroconvulsiva (TEC) unilateral",
            "Agregar un antidepresivo IMAO clásico sin periodo de lavado previo"
          ],
          rationale: "La potenciación de ISRS con dosis bajas de antipsicóticos atípicos cuenta con la mayor evidencia para TOC resistente. La clomipramina (tricíclico serotoninérgico) es una alternativa sumamente potente si se toleran sus efectos anticolinérgicos.",
          take_home: "La risperidona o el aripiprazol en dosis bajas son potentes coadyuvantes en el tratamiento del TOC resistente.",
          why_not: [
            { option: "Indicar hospitalización prolongada para aislamiento social completo", reason: "El aislamiento social y la institucionalización no curan el TOC y aumentan la cronicidad y la discapacidad funcional." },
            { option: "Suspender toda la medicación y realizar terapia electroconvulsiva (TEC) unilateral", reason: "La TEC tiene poca eficacia en el TOC primario sin comorbilidad afectiva grave y no reemplaza a las guías de potenciación farmacológica." },
            { option: "Agregar un antidepresivo IMAO clásico sin periodo de lavado previo", reason: "Combinar ISRS con IMAO sin lavado de varias semanas causa un síndrome serotoninérgico fatal con alta probabilidad." }
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
        },
        residencia: {
          instruction: "¿En qué dominio RDoC se clasifica este trastorno y qué marcador clínico diferencial es útil en la exploración de la marcha?",
          expected_answer: "Sensorimotor Systems (Trastorno motor funcional) y la marcha fluctuante e incongruente ('astasia-abasia')",
          distractors: [
            "Negative Valence Systems y la presencia de rigidez en rueda dentada",
            "Cognitive Systems y la afasia de Broca",
            "Social Processes y la ecolalia"
          ],
          rationale: "El trastorno de conversión motora se clasifica principalmente bajo los Sistemas Sensorimotores de RDoC. La marcha con bamboleo excesivo sin caídas reales ('astasia-abasia') es un marcador clínico funcional típico.",
          take_home: "La marcha funcional (astasia-abasia) es espectacular y variable, demostrando la integridad de los circuitos motores básicos.",
          why_not: [
            { option: "Negative Valence Systems y la presencia de rigidez en rueda dentada", reason: "La rigidez en rueda dentada es típica de extrapiramidalismo (Parkinson), no de debilidad funcional conversiva pura." },
            { option: "Cognitive Systems y la afasia de Broca", reason: "La afasia de Broca se debe a lesión estructural del lóbulo frontal izquierdo; no es un síntoma de conversión motora de extremidades." },
            { option: "Social Processes y la ecolalia", reason: "La ecolalia pertenece a trastornos del desarrollo o del lenguaje social, ajeno a la parálisis motora conversiva." }
          ]
        },
        especialidad: {
          instruction: "Paciente con ceguera conversiva persistente que no responde a la psicoterapia básica. ¿Cuál es una opción de intervención intensiva indicada?",
          expected_answer: "Fisioterapia especializada o estimulación magnética transcraneal (EMT) complementaria más abordaje de trauma psicológico",
          distractors: [
            "Forzar al paciente a caminar a oscuras en un pasillo con obstáculos",
            "Realizar un electroshock de rescate sin consentimiento",
            "Administrar dosis inmunosupresoras de Metilprednisolona intravenosa"
          ],
          rationale: "La fisioterapia funcional o la estimulación cerebral complementaria actúan modulando la corteza sensoromotora y prefrontal, ayudando a restablecer el control motor y la integración perceptiva.",
          take_home: "La fisioterapia especializada y la psicoeducación son intervenciones de alta eficacia para la conversión.",
          why_not: [
            { option: "Forzar al paciente a caminar a oscuras en un pasillo con obstáculos", reason: "Es una técnica humillante e insegura que expone a caídas físicas reales y empeora la disociación conversiva." },
            { option: "Realizar un electroshock de rescate sin consentimiento", reason: "La TEC carece de indicación en la conversión pura y su aplicación sin consentimiento viola los derechos fundamentales del paciente." },
            { option: "Administrar dosis inmunosupresoras de Metilprednisolona intravenosa", reason: "Los corticosteroides no tienen cabida en patologías funcionales psiquiátricas y conllevan efectos adversos endocrinológicos graves." }
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
        },
        residencia: {
          instruction: "¿Qué alteración de neurotransmisores es la base del déficit de memoria y qué fármaco inhibidor de la acetilcolinesterasa está indicado?",
          expected_answer: "Déficit de Acetilcolina por degeneración de neuronas colinérgicas; iniciar Donepezilo, Galantamina o Rivastigmina",
          distractors: [
            "Exceso de Serotonina; iniciar Fluoxetina a dosis altas",
            "Déficit de Dopamina en el estriado; iniciar Levodopa con Carbidopa",
            "Exceso de Glutamato; iniciar Memantina únicamente como primera opción en demencia leve"
          ],
          rationale: "La enfermedad de Alzheimer se caracteriza por la pérdida de neuronas colinérgicas en el núcleo basal de Meynert. Los inhibidores de la acetilcolinesterasa (Donepezilo, Rivastigmina, Galantamina) aumentan la disponibilidad de acetilcolina en la sinapsis.",
          take_home: "Los inhibidores de colinesterasa son el pilar farmacológico en etapas leves a moderadas del Alzheimer.",
          why_not: [
            { option: "Exceso de Serotonina; iniciar Fluoxetina a dosis altas", reason: "La fluoxetina es un antidepresivo y no revierte el déficit colinérgico nuclear de la memoria en la enfermedad de Alzheimer." },
            { option: "Déficit de Dopamina en el estriado; iniciar Levodopa con Carbidopa", reason: "El déficit dopaminérgico estriatal es característico del Parkinson; la levodopa puede exacerbar los delirios de robo en pacientes con Alzheimer." },
            { option: "Exceso de Glutamato; iniciar Memantina únicamente como primera opción en demencia leve", reason: "La memantina es un antagonista NMDA indicado en fases moderadas a severas; no es la primera elección óptima en demencia leve aislada." }
          ]
        },
        especialidad: {
          instruction: "Paciente en fase moderada-severa que presenta agitación psicomotriz vespertina y delirios paranoides de robo que ponen en riesgo su cuidado. ¿Manejo farmacológico indicado?",
          expected_answer: "Iniciar dosis bajas de un antipsicótico atípico (ej. Risperidona) con monitorización estrecha del riesgo cardiovascular",
          distractors: [
            "Administrar dosis altas de Haloperidol intravenoso continuo",
            "Iniciar Diazepam 10mg por las noches",
            "Restricción física fija en cama las 24 horas del día"
          ],
          rationale: "Para los síntomas conductuales y psicológicos graves de la demencia (SCPD) que no responden a medidas no farmacológicas y conllevan peligro, la risperidona en dosis bajas está indicada, evaluando el incremento del riesgo de ACV/mortalidad en ancianos.",
          take_home: "Los antipsicóticos en ancianos con demencia conllevan un recuadro de advertencia ('black box warning') por eventos cardiovasculares.",
          why_not: [
            { option: "Administrar dosis altas de Haloperidol intravenoso continuo", reason: "El haloperidol IV en dosis altas tiene un riesgo crítico de prolongación del intervalo QT y torsión de puntas en ancianos, además de causar parkinsonismo severo." },
            { option: "Iniciar Diazepam 10mg por las noches", reason: "El diazepam tiene una vida media muy prolongada en ancianos, induciendo sedación diurna, confusión, ataxia y caídas con fractura de cadera." },
            { option: "Restricción física fija en cama las 24 horas del día", reason: "La contención mecánica continua causa úlceras por presión, trombosis venosa profunda, delirio y aumento de la mortalidad." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC está primariamente afectado y cuál es la estrategia no farmacológica prioritaria de manejo?",
          expected_answer: "Arousal/Regulatory Systems (Regulación de la conciencia) y medidas ambientales (reorientación constante, luz natural diurna, movilización temprana)",
          distractors: [
            "Positive Valence Systems y aislamiento sensorial en habitación oscura",
            "Social Processes y contención física preventiva continua en cama",
            "Sensorimotor Systems y sedación profunda con benzodiacepinas de larga acción"
          ],
          rationale: "El delirium representa el fallo agudo del sistema de alertamiento y conciencia (Arousal Systems). El pilar del manejo es ambiental: reorientar al paciente, mantener el ciclo sueño-vigilia y corregir la causa física subyacente.",
          take_home: "El manejo no farmacológico (orientación, ciclo luz-oscuridad) es la intervención más eficaz para resolver el delirium.",
          why_not: [
            { option: "Positive Valence Systems y aislamiento sensorial en habitación oscura", reason: "El aislamiento en oscuridad total desorienta aún más al paciente y exacerba drásticamente el delirium." },
            { option: "Social Processes y contención física preventiva continua en cama", reason: "La contención mecánica triplica la duración y la severidad del delirium y aumenta la agitación y las caídas." },
            { option: "Sensorimotor Systems y sedación profunda con benzodiacepinas de larga acción", reason: "Las benzodiacepinas son delirogénicas en ancianos y empeoran significativamente el delirium hipoactivo al profundizar el letargo." }
          ]
        },
        especialidad: {
          instruction: "Paciente con delirium que presenta agitación extrema intermitente que interrumpe la infusión de antibióticos y pone en riesgo las vías invasivas. ¿Farmacoterapia indicada?",
          expected_answer: "Administrar dosis bajas de Haloperidol oral/IM o un antipsicótico atípico (ej. Quetiapina) solo si hay riesgo de retiro de dispositivos",
          distractors: [
            "Administrar una infusión continua de Midazolam intravenoso a dosis sedantes",
            "Indicar infusión forzada de Fenitoína sódica profiláctica",
            "Iniciar tratamiento prolongado con Carbonato de Litio"
          ],
          rationale: "El uso de antipsicóticos en delirium está restringido a casos de agitación severa con riesgo inminente para sí mismo o para tratamientos vitales (retirar catéteres). Se debe usar la menor dosis posible y suspender al resolverse el delirium.",
          take_home: "Los antipsicóticos en delirium son únicamente sintomáticos de rescate y no curan el cuadro orgánico subyacente.",
          why_not: [
            { option: "Administrar una infusión continua de Midazolam intravenoso a dosis sedantes", reason: "El midazolam profundizaría la inatención y puede causar una agitación paradójica severa en pacientes ancianos." },
            { option: "Indicar infusión forzada de Fenitoína sódica profiláctica", reason: "La fenitoína es un anticonvulsivo, carece de propiedades antipsicóticas o ansiolíticas en el delirium agudo." },
            { option: "Iniciar tratamiento prolongado con Carbonato de Litio", reason: "El litio es nefrotóxico, requiere estrecho control y empeoraría gravemente el estado confusional agudo." }
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
        },
        residencia: {
          instruction: "¿Qué alteración del eje endocrinológico y qué antidepresivos son de primera elección para el TEPT?",
          expected_answer: "Hiperactividad del eje Hipotálamo-Hipófisis-Adrenal (HHA) con hipersensibilidad de receptores de glucocorticoides; iniciar un ISRS (ej. Sertralina o Paroxetina)",
          distractors: [
            "Exceso de Hormona Tiroidea (T4 libre) e iniciar propanolol como única terapia",
            "Déficit de Prolactina e iniciar Cabergolina",
            "Hiperactividad de la Glándula Pineal e iniciar Melatonina"
          ],
          rationale: "El TEPT se asocia a una disregulación del eje HHA con niveles plasmáticos bajos de cortisol pero hipersensibilidad de los receptores de glucocorticoides. Los ISRS (Sertralina, Paroxetina) son la primera línea farmacológica aprobada.",
          take_home: "La sertralina y la paroxetina son los únicos ISRS con aprobación formal extensa para el tratamiento del TEPT.",
          why_not: [
            { option: "Exceso de Hormona Tiroidea (T4 libre) e iniciar propanolol como única terapia", reason: "El hipertiroidismo causa temblor y taquicardia, pero no explica los flashbacks disociativos ni la reexperimentación traumática del TEPT." },
            { option: "Déficit de Prolactina e iniciar Cabergolina", reason: "El eje de la prolactina no es el pilar patogénico del TEPT y los agonistas dopaminérgicos pueden inducir psicosis." },
            { option: "Hiperactividad de la Glándula Pineal e iniciar Melatonina", reason: "La melatonina ayuda a regular el sueño pero no trata la hipervigilancia diurna ni la evitación ni la anhedonia traumática." }
          ]
        },
        especialidad: {
          instruction: "Paciente con TEPT que presenta pesadillas hiperrealistas refractarias graves que interrumpen por completo el sueño. ¿Fármaco adyuvante indicado?",
          expected_answer: "Prazosina (antagonista alfa-1 adrenérgico)",
          distractors: [
            "Clonazepam a dosis máximas antes de dormir",
            "Zolpidem a dosis de impregnación continuas",
            "Haloperidol IM nocturno"
          ],
          rationale: "La prazosina es un bloqueador alfa-1 que disminuye la descarga noradrenérgica en el sistema nervioso central durante la noche, demostrando alta eficacia en reducir la frecuencia e intensidad de las pesadillas por TEPT.",
          take_home: "La prazosina modula la hiperactividad autonómica nocturna, aliviando las pesadillas refractarias del TEPT.",
          why_not: [
            { option: "Clonazepam a dosis máximas antes de dormir", reason: "Las benzodiacepinas alteran la arquitectura del sueño (disminuyen REM y delta) y pueden empeorar los síntomas disociativos del TEPT." },
            { option: "Zolpidem a dosis de impregnación continuas", reason: "El zolpidem induce el sueño pero no evita las pesadillas adrenérgicas de reexperimentación y puede inducir sonambulismo peligroso." },
            { option: "Haloperidol IM nocturno", reason: "El haloperidol carece de indicación para pesadillas del TEPT y expone a efectos extrapiramidales y disquinesia tardía." }
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
        },
        residencia: {
          instruction: "¿Qué síndrome metabólico potencialmente mortal se previene con una realimentación lenta y controlada, y qué electrolito es el marcador clave?",
          expected_answer: "Síndrome de Realimentación; vigilar y reponer niveles de Fósforo sérico",
          distractors: [
            "Síndrome de Wernicke; vigilar Calcio sérico",
            "Cetoacidosis diabética; vigilar Glucosa capilar únicamente",
            "Síndrome de Lisis Tumoral; vigilar Ácido Úrico"
          ],
          rationale: "Al reintroducir carbohidratos, se dispara la insulina, movilizando el fósforo, potasio y magnesio hacia el compartimiento intracelular de forma masiva. El fósforo bajo es la marca del Síndrome de Realimentación, causando colapso cardíaco y diafragmático.",
          take_home: "La hipofosfatemia severa en la realimentación puede desencadenar paro cardíaco, edema y debilidad muscular extrema.",
          why_not: [
            { option: "Síndrome de Wernicke; vigilar Calcio sérico", reason: "El síndrome de Wernicke se asocia a deficiencia de tiamina (B1), no a la caída del calcio sérico." },
            { option: "Cetoacidosis diabética; vigilar Glucosa capilar únicamente", reason: "La cetoacidosis ocurre por deficiencia absoluta de insulina en diabetes tipo 1, no por inanición pura con realimentación controlada." },
            { option: "Síndrome de Lisis Tumoral; vigilar Ácido Úrico", reason: "Ocurre por destrucción rápida de células tumorales tras quimioterapia, no por inicio de nutrición en desnutrición extrema." }
          ]
        },
        especialidad: {
          instruction: "Paciente con anorexia que rechaza cooperar con la sonda de alimentación enteral a pesar de riesgo inminente de paro cardíaco. ¿Abordaje ético-clínico indicado?",
          expected_answer: "Alimentación forzada por sonda de forma terapéutica y bajo marco legal de protección del paciente por carecer de competencia en estado crítico de inanición",
          distractors: [
            "Respetar la autonomía y dejar que el paciente continúe ayunando en el hospital hasta que decida comer",
            "Dar el alta voluntaria inmediata para evitar problemas legales con la familia",
            "Realizar Terapia Electroconvulsiva (TEC) para 'abrir el apetito'"
          ],
          rationale: "La desnutrición severa altera el juicio cognitivo y la competencia mental del paciente para la toma de decisiones. Ante riesgo inminente de muerte, el principio de beneficencia prevalece, permitiendo la alimentación por sonda forzada bajo estricto apego legal y clínico.",
          take_home: "En situaciones de riesgo vital por anorexia extrema, la alimentación enteral forzada es legalmente defendible bajo criterios de beneficencia médica.",
          why_not: [
            { option: "Respetar la autonomía y dejar que el paciente continúe ayunando en el hospital hasta que decida comer", reason: "Permitir el ayuno hasta la muerte en un estado de competencia gravemente alterado por inanición equivale a omisión de auxilio médico." },
            { option: "Dar el alta voluntaria inmediata para evitar problemas legales con la familia", reason: "El alta voluntaria en un paciente con inestabilidad metabólica extrema constituye un abandono clínico peligroso." },
            { option: "Realizar Terapia Electroconvulsiva (TEC) para 'abrir el apetito'", reason: "La TEC no está indicada ni cuenta con evidencia para revertir el ayuno en anorexia de forma aguda." }
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
        },
        residencia: {
          instruction: "¿Qué modelo de psicoterapia cuenta con la mayor evidencia científica para el TLP y qué dominio RDoC está implicado en la disregulación emocional?",
          expected_answer: "Terapia Dialéctico-Conductual (DBT) y Negative Valence Systems (Reactividad emocional/Inestabilidad del afecto)",
          distractors: [
            "Psicoanálisis ortodoxo clásico y Redes Sensorimotoras",
            "Terapia familiar sistémica pura y Positive Valence Systems",
            "Terapia Cognitivo-Conductual clásica para el pánico y Redes de Arousal únicamente"
          ],
          rationale: "La DBT, desarrollada por Marsha Linehan, es el tratamiento de elección para el TLP por su enfoque en la tolerancia al malestar y regulación emocional. En RDoC, se asocia principalmente a hipersensibilidad de los sistemas de valencia negativa.",
          take_home: "La Terapia Dialéctico-Conductual (DBT) es el estándar de oro psicoterapéutico para el tratamiento del TLP.",
          why_not: [
            { option: "Psicoanálisis ortodoxo clásico y Redes Sensorimotoras", reason: "El psicoanálisis no enfocado en trauma o límites suele desorganizar o frustrar a los pacientes con TLP agudo, careciendo de evidencia en autolesiones." },
            { option: "Terapia familiar sistémica pura y Positive Valence Systems", reason: "Aunque la familia influye, la disfunción es la inestabilidad afectiva de valencia negativa intrapersonal del paciente." },
            { option: "Terapia Cognitivo-Conductual clásica para el pánico y Redes de Arousal únicamente", reason: "Las técnicas de pánico no abordan la desregulación interpersonal, el vacío crónico ni la impulsividad autolesiva del TLP." }
          ]
        },
        especialidad: {
          instruction: "Paciente con TLP que presenta conductas autolesivas repetitivas severas y amenaza con suicidarse de inmediato tras enterarse que su terapeuta tomará vacaciones de 1 semana. ¿Estrategia recomendada?",
          expected_answer: "Establecer límites terapéuticos claros, reforzar las habilidades de DBT aprendidas y activar el plan de crisis acordado, evitando la hospitalización psiquiátrica prolongada que suele empeorar el cuadro",
          distractors: [
            "Hospitalizar de forma forzada por 3 meses para protección completa",
            "Prometer no tomar las vacaciones para evitar que el paciente sufra",
            "Iniciar polifarmacia con 3 antipsicóticos y 2 benzodiacepinas de alta potencia"
          ],
          rationale: "En el TLP, la hospitalización psiquiátrica prolongada a menudo induce regresión conductual y mayor dependencia. Se debe priorizar el mantenimiento de límites, uso del plan de crisis y el apoyo a las habilidades del paciente en el entorno ambulatorio.",
          take_home: "Las hospitalizaciones en pacientes con TLP deben ser cortas, enfocadas a crisis agudas y evitar la regresión institucional.",
          why_not: [
            { option: "Hospitalizar de forma forzada por 3 meses para protección completa", reason: "La hospitalización forzada prolongada suele desencadenar regresión conductual severa, autolesiones intrahospitalarias y pérdida de la funcionalidad." },
            { option: "Prometer no tomar las vacaciones para evitar que el paciente sufra", reason: "Someterse al chantaje rompe el encuadre profesional, refuerza la manipulación y destruye la relación terapéutica de forma definitiva." },
            { option: "Iniciar polifarmacia con 3 antipsicóticos y 2 benzodiacepinas de alta potencia", reason: "La polifarmacia masiva no trata la estructura de la personalidad y expone a sedación profunda, disquinesias e interacciones medicamentosas graves." }
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
        },
        residencia: {
          instruction: "¿En qué dominio RDoC se clasifica la patología nuclear de este paciente y qué intervención terapéutica tiene mayor evidencia?",
          expected_answer: "Social Processes (Procesos Sociales) y el análisis conductual aplicado (terapia ABA)",
          distractors: [
            "Cognitive Systems y estimulantes de dopamina",
            "Negative Valence Systems e inmunoglobulina intravenosa",
            "Sensorimotor Systems y antipsicóticos a altas dosis"
          ],
          rationale: "El TEA se enmarca bajo los procesos sociales de RDoC (comunicación social y reciprocidad). La terapia con mayor evidencia es el análisis conductual aplicado (ABA) para desarrollo de habilidades funcionales.",
          take_home: "La intervención temprana basada en modelos conductuales estructurados (como ABA) optimiza el pronóstico funcional en el TEA.",
          why_not: [
            { option: "Cognitive Systems y estimulantes de dopamina", reason: "Los estimulantes no tratan el déficit social ni comunicativo primario del TEA y pueden aumentar la rigidez motora." },
            { option: "Negative Valence Systems e inmunoglobulina intravenosa", reason: "El autismo no es una enfermedad autoinmune primaria tratable con inmunoglobulinas, careciendo esta terapia de evidencia sólida." },
            { option: "Sensorimotor Systems y antipsicóticos a altas dosis", reason: "Los antipsicóticos atípicos (Risperidona) se usan a dosis bajas para irritabilidad severa, no para tratar la reciprocidad social del TEA." }
          ]
        },
        especialidad: {
          instruction: "Paciente pediátrico con TEA que presenta autoagresiones severas (se golpea la cabeza contra la pared) e irritabilidad que impiden la terapia. ¿Farmacoterapia de soporte indicada?",
          expected_answer: "Administrar dosis bajas de Risperidona o Aripiprazol con monitorización estrecha de peso y prolactina",
          distractors: [
            "Iniciar Fluoxetina a dosis altas",
            "Administrar infusiones de Clonidina fija",
            "Prescribir metilfenidato a dosis máximas de liberación inmediata"
          ],
          rationale: "La risperidona y el aripiprazol son los únicos psicofármacos con aprobación de la FDA para tratar la irritabilidad severa y las conductas autoagresivas en el TEA en niños, monitorizando el aumento de peso y prolactina.",
          take_home: "La risperidona y el aripiprazol disminuyen la agresión en TEA, pero requieren vigilancia metabólica estrecha.",
          why_not: [
            { option: "Iniciar Fluoxetina a dosis altas", reason: "La fluoxetina no disminuye la irritabilidad impulsiva y suele inducir una activación conductual excesiva (ansiedad, agitación) en niños con autismo." },
            { option: "Administrar infusiones de Clonidina fija", reason: "La clonidina es útil en TDAH con hiperactividad pero carece de la misma eficacia que los atípicos para autoagresiones físicas repetitivas." },
            { option: "Prescribir metilfenidato a dosis máximas de liberación inmediata", reason: "El metilfenidato a dosis máximas en TEA genera hiperactividad paradójica, irritabilidad, llanto fácil y anorexia marcada." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC y qué fármaco no benzodiacepínico agonista selectivo de receptores GABA-A (Z-drug) está indicado para el tratamiento a corto plazo?",
          expected_answer: "Arousal/Regulatory Systems (Sueño/Vigilia) y Zolpidem o Eszopiclona por un periodo máximo de 4 semanas",
          distractors: [
            "Positive Valence Systems y Metilfenidato por las mañanas",
            "Negative Valence Systems e Imipramina a dosis máximas",
            "Sensorimotor Systems y Carisoprodol nocturno"
          ],
          rationale: "El insomnio es una disfunción del sistema de alerta/sueño de RDoC. Los análogos de benzodiacepinas ('Z-drugs' como zolpidem o eszopiclona) actúan de forma selectiva sobre la subunidad alfa-1 de GABA-A, indicados por corto tiempo.",
          take_home: "Las Z-drugs (Zolpidem) se asocian a menor distorsión de la arquitectura del sueño que las benzodiacepinas tradicionales.",
          why_not: [
            { option: "Positive Valence Systems y Metilfenidato por las mañanas", reason: "El metilfenidato aumentaría la estimulación autonómica diurna e intensificaría significativamente el insomnio nocturno." },
            { option: "Negative Valence Systems e Imipramina a dosis máximas", reason: "La imipramina es un tricíclico con importantes efectos secundarios cardiovasculares y anticolinérgicos, no es primera elección para insomnio primario." },
            { option: "Sensorimotor Systems y Carisoprodol nocturno", reason: "El carisoprodol es un relajante muscular con alto potencial adictivo y metabolitos sedantes tóxicos, no indicado en insomnio crónico." }
          ]
        },
        especialidad: {
          instruction: "Paciente con insomnio de conciliación crónico refractario que rechaza los inductores por temor a la adicción. ¿Cuál es una alternativa innovadora no adictiva autorizada?",
          expected_answer: "Antagonista de los receptores de Orexina (ej. Suvorexant o Lemborexant) o Melatonina de liberación prolongada",
          distractors: [
            "Iniciar infusión de Propofol nocturna administrada por familiares",
            "Prescribir infusiones masivas de té de valeriana y tila",
            "Uso continuo de Fenobarbital a dosis sedantes"
          ],
          rationale: "Los antagonistas duales de receptores de orexina (DORA) como el suvorexant bloquean el sistema del alertamiento del cerebro, induciendo un sueño fisiológico sin provocar tolerancia física o abstinencia.",
          take_home: "Los antagonistas de orexina modulan activamente la vigilia y no conllevan el potencial adictivo gabaérgico.",
          why_not: [
            { option: "Iniciar infusión de Propofol nocturna administrada por familiares", reason: "El propofol requiere monitoreo anestésico estricto; su administración doméstica es ilegal y altamente mortal (ej. caso Michael Jackson)." },
            { option: "Prescribir infusiones masivas de té de valeriana y tila", reason: "Los tés herbales carecen de potencia y base científica probada para revertir un trastorno de insomnio crónico severo." },
            { option: "Uso continuo de Fenobarbital a dosis sedantes", reason: "El fenobarbital es un barbitúrico con estrecho margen terapéutico, inducción enzimática severa y alta letalidad por sobredosis." }
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
        },
        residencia: {
          instruction: "¿En qué dominio RDoC se clasifica este cuadro y qué antidepresivo con propiedades analgésicas duales es el indicado?",
          expected_answer: "Negative Valence Systems (Ansiedad por la salud) e inhibidores de la recaptura de serotonina y noradrenalina (IRSN) como la Duloxetina",
          distractors: [
            "Positive Valence Systems y Benzodiacepinas a altas dosis",
            "Sensorimotor Systems y Haloperidol oral de mantenimiento",
            "Cognitive Systems y Metilfenidato"
          ],
          rationale: "Se asocia a los sistemas de valencia negativa de RDoC (aprehensión, hipervigilancia al dolor y ansiedad por enfermar). Los IRSN (Duloxetina, Venlafaxina) modulan las vías descendentes del dolor, ofreciendo un beneficio dual analgésico y ansiolítico.",
          take_home: "Los IRSN como la duloxetina modulan eficazmente las vías del dolor nociceptivo en los síndromes de somatización.",
          why_not: [
            { option: "Positive Valence Systems y Benzodiacepinas a altas dosis", reason: "Las benzodiacepinas aumentan la pasividad y no disminuyen los síntomas dolorosos crónicos, facilitando la dependencia." },
            { option: "Sensorimotor Systems y Haloperidol oral de mantenimiento", reason: "El haloperidol expone a distonías y discinesia tardía sin poseer indicación analgésica para el dolor crónico funcional." },
            { option: "Cognitive Systems y Metilfenidato", reason: "El metilfenidato aumenta la descarga autonómica, pudiendo exacerbar severamente las sensaciones corporales (palpitaciones, mareo) y la ansiedad por enfermar." }
          ]
        },
        especialidad: {
          instruction: "Paciente con dolores somáticos crónicos refractarios que exige someterse a una cirugía exploratoria lumbar mayor. ¿Conducta recomendada por el especialista?",
          expected_answer: "Rechazar de forma empática pero firme la cirugía por carecer de indicación médica, explicar los riesgos de yatrogenia y focalizar la consulta en la funcionalidad diaria",
          distractors: [
            "Autorizar la cirugía como efecto placebo para satisfacer la demanda del paciente",
            "Enviar a psiquiatría forense para hospitalización psiquiátrica involuntaria inmediata",
            "Administrar infusiones intratecales de morfina de por vida"
          ],
          rationale: "El principio de no maleficencia prohíbe realizar intervenciones invasivas sin indicación médica objetiva. Los procedimientos invasivos en pacientes con trastorno de somatización suelen cronificar y agravar el dolor.",
          take_home: "La no maleficencia prohíbe realizar cirugías 'placebo' innecesarias que incrementan el daño físico en la somatización.",
          why_not: [
            { option: "Autorizar la cirugía como efecto placebo para satisfacer la demanda del paciente", reason: "Esto viola el principio de no maleficencia y expone al paciente a complicaciones quirúrgicas reales, con alto riesgo de empeorar el dolor." },
            { option: "Enviar a psiquiatría forense para hospitalización psiquiátrica involuntaria inmediata", reason: "El trastorno de somatización no representa un criterio de internamiento involuntario por psicosis o riesgo suicida agudo." },
            { option: "Administrar infusiones intratecales de morfina de por vida", reason: "Los opioides intratecales a permanencia conllevan riesgos severos de adicción, depresión respiratoria e hiperalgesia inducida por opioides." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC y qué fármaco de mantenimiento a largo plazo está indicado?",
          expected_answer: "Social Processes (Comunicación/Reciprocidad social) o Negative Valence Systems (Amenaza potencial) e inhibidores selectivos de la recaptura de serotonina (ISRS)",
          distractors: [
            "Positive Valence Systems y Metilfenidato a permanencia",
            "Cognitive Systems y benzodiacepinas fijas a dosis máximas",
            "Sensorimotor Systems y Haloperidol"
          ],
          rationale: "La ansiedad social se sitúa en los procesos sociales y de valencia negativa (amenaza a la posición social/miedo al rechazo). Los ISRS (Sertralina, Paroxetina, Escitalopram) son el estándar de mantenimiento farmacológico.",
          take_home: "Los ISRS modulan las redes del miedo social y la reactividad de la amígdala a largo plazo.",
          why_not: [
            { option: "Positive Valence Systems y Metilfenidato a permanencia", reason: "El metilfenidato incrementa la descarga autonómica (temblor, taquicardia) y agrava la ansiedad en situaciones públicas." },
            { option: "Cognitive Systems y benzodiacepinas fijas a dosis máximas", reason: "Las benzodiacepinas fijas a dosis altas inducen deterioro cognitivo y dependencia, sin corregir la etiología serotoninérgica de fondo." },
            { option: "Sensorimotor Systems y Haloperidol", reason: "El haloperidol expone a distonías e impregnación extrapiramidal sin beneficio en trastornos de ansiedad social primarios." }
          ]
        },
        especialidad: {
          instruction: "Paciente con ansiedad social puramente de ejecución (ej. solo hablar en público) que requiere manejo inmediato sintomático ocasional. ¿Opción terapéutica adecuada?",
          expected_answer: "Prescribir un beta-bloqueador (ej. Propranolol 10-40mg) 30 a 60 minutos antes de la presentación social",
          distractors: [
            "Administrar Haloperidol intramuscular de rescate antes de hablar",
            "Recomendar beber 2 tequilas antes de cada presentación laboral",
            "Tratamiento permanente con Clomipramina a dosis máximas"
          ],
          rationale: "Los beta-bloqueadores mitigan eficazmente la descarga autonómica periférica (temblor de manos, taquicardia, voz temblorosa) en fobias sociales de desempeño, sin nublar el sensorio cognitivo.",
          take_home: "El propranolol a dosis bajas bloquea la respuesta simpática periférica en las crisis de ansiedad de desempeño.",
          why_not: [
            { option: "Administrar Haloperidol intramuscular de rescate antes de hablar", reason: "El haloperidol IM induce sedación o distonía de la lengua, imposibilitando la oratoria en público." },
            { option: "Recomendar beber 2 tequilas antes de cada presentación laboral", reason: "Fomenta el alcoholismo secundario como automedicación y puede deteriorar el desempeño intelectual y motor." },
            { option: "Tratamiento permanente con Clomipramina a dosis máximas", reason: "La clomipramina permanente no es necesaria en fobias de desempeño aisladas y tiene un severo perfil anticolinérgico seco." }
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
        },
        residencia: {
          instruction: "¿Qué mecanismo de acción tiene la cocaína a nivel de la hendidura sináptica y qué contraindicación absoluta de beta-bloqueadores puros debe evitarse?",
          expected_answer: "Bloqueo de la recaptura de dopamina, noradrenalina y serotonina; contraindicación absoluta de Propranolol por estimulación alfa sin oposición",
          distractors: [
            "Agonismo directo de receptores GABA-A y contraindicación de Diazepam",
            "Bloqueo de receptores histaminérgicos H1 y contraindicación de Difenhidramina",
            "Inhibición de la síntesis de melatonina y contraindicación de Zolpidem"
          ],
          rationale: "La cocaína bloquea los transportadores DAT, NET y SERT, aumentando los niveles de monoaminas. Los beta-bloqueadores puros (Propranolol) dejan libres los receptores alfa-1, desencadenando una vasoconstricción masiva e infarto agudo de miocardio.",
          take_home: "Evitar beta-bloqueadores puros en intoxicación por cocaína; la estimulación alfa-1 sin oposición causa infarto coronario.",
          why_not: [
            { option: "Agonismo directo de receptores GABA-A y contraindicación de Diazepam", reason: "La cocaína es estimulante, no estimula GABA; las benzodiacepinas (Diazepam) son precisamente el tratamiento de elección." },
            { option: "Bloqueo de receptores histaminérgicos H1 y contraindicación de Difenhidramina", reason: "El H1 regula la alergia y el sueño, no es el mecanismo de la toxicidad simpática coronaria de la cocaína." },
            { option: "Inhibición de la síntesis de melatonina y contraindicación de Zolpidem", reason: "El zolpidem no tiene interacciones simpaticomiméticas ni relevancia en la vasoconstricción coronaria." }
          ]
        },
        especialidad: {
          instruction: "Paciente con intoxicación por cocaína y dolor torácico isquémico persistente con hipertensión grave que no cede a benzodiacepinas. ¿Fármaco vasodilatador de rescate indicado?",
          expected_answer: "Administrar Nitroglicerina sublingual/IV o Fentolamina (bloqueador alfa-adrenérgico puro)",
          distractors: [
            "Administrar una dosis de Metoprolol IV rápido",
            "Iniciar infusión de Adrenalina a dosis máximas",
            "Dar de alta con indicación de reposo en casa"
          ],
          rationale: "La nitroglicerina o la fentolamina contrarrestan de forma directa el vasoespasmo coronario y la vasoconstricción sistémica mediada por la estimulación alfa-adrenérgica provocada por la cocaína.",
          take_home: "La nitroglicerina y la fentolamina son los vasodilatadores de elección para el espasmo coronario por cocaína.",
          why_not: [
            { option: "Administrar una dosis de Metoprolol IV rápido", reason: "El metoprolol es un beta-bloqueador que generaría vasoconstricción coronaria sin oposición alfa, empeorando críticamente la isquemia." },
            { option: "Iniciar infusión de Adrenalina a dosis máximas", reason: "La adrenalina empeoraría la taquicardia y causaría ruptura aórtica o infarto masivo por exceso adrenérgico." },
            { option: "Dar de alta con indicación de reposo en casa", reason: "El paciente con dolor torácico isquémico e hipertensión grave requiere monitorización estricta por riesgo de arritmias letales y muerte." }
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
        },
        residencia: {
          instruction: "¿Qué criterio temporal es sine qua non en el DSM-5 para diferenciar este trastorno de un trastorno bipolar con características psicóticas?",
          expected_answer: "Presencia de delirios o alucinaciones durante al menos 2 semanas en ausencia de un episodio afectivo mayor",
          distractors: [
            "Presencia de síntomas maníacos por más de 6 meses seguidos",
            "Ausencia absoluta de síntomas depresivos a lo largo de la vida",
            "Deterioro cognitivo severo desde la infancia temprana"
          ],
          rationale: "Para diagnosticar trastorno esquizoafectivo, los síntomas psicóticos deben persistir al menos 2 semanas sin síntomas afectivos activos. Si los delirios solo ocurren durante la manía/depresión, el diagnóstico es trastorno bipolar/depresivo con características psicóticas.",
          take_home: "La regla de las 2 semanas psicóticas 'puras' separa al trastorno esquizoafectivo de la bipolaridad psicótica.",
          why_not: [
            { option: "Presencia de síntomas maníacos por más de 6 meses seguidos", reason: "Los episodios maníacos raramente duran 6 meses continuos sin tratamiento y no es el umbral diferenciador temporal del DSM-5." },
            { option: "Ausencia absoluta de síntomas depresivos a lo largo de la vida", reason: "El subtipo depresivo del trastorno esquizoafectivo cursa con episodios de depresión mayor; la presencia de depresión no excluye el trastorno." },
            { option: "Deterioro cognitivo severo desde la infancia temprana", reason: "El deterioro cognitivo temprano sugiere trastornos del neurodesarrollo o discapacidad intelectual, no esquizoafectivo." }
          ]
        },
        especialidad: {
          instruction: "Paciente con trastorno esquizoafectivo que mantiene agitación y alucinaciones refractarias a pesar de uso óptimo de Litio y Olanzapina. ¿Siguiente paso recomendado?",
          expected_answer: "Considerar refractariedad; iniciar protocolo para Clozapina o valorar Terapia Electroconvulsiva (TEC)",
          distractors: [
            "Agregar un segundo antidepresivo tricíclico de alta potencia",
            "Administrar dosis masivas de benzodiacepinas IV de por vida",
            "Suspender toda la medicación y realizar psicoanálisis intensivo"
          ],
          rationale: "La clozapina es el único antipsicótico con indicación formal de alta eficacia para la esquizofrenia y el trastorno esquizoafectivo resistente al tratamiento, mejorando drásticamente el pronóstico afectivo y psicótico.",
          take_home: "La clozapina representa el último peldaño de alta eficacia para la psicosis refractaria en el trastorno esquizoafectivo.",
          why_not: [
            { option: "Agregar un segundo antidepresivo tricíclico de alta potencia", reason: "Los antidepresivos tricíclicos exacerbarían severamente la psicosis y la manía afectiva subyacente." },
            { option: "Administrar dosis masivas de benzodiacepinas IV de por vida", reason: "Las benzodiacepinas IV de por vida inducen coma, insuficiencia respiratoria y adicción profunda, sin tratar la psicosis refractaria." },
            { option: "Suspender toda la medicación y realizar psicoanálisis intensivo", reason: "Suspender la medicación en un paciente resistente y grave agrava críticamente el riesgo de suicidio y agitación agresiva." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC y qué disfunción de neurotransmisores está implicada en el control de impulsos de este paciente?",
          expected_answer: "Cognitive Systems (Control de impulsos) o Negative Valence Systems e hipofuncionalidad serotoninérgica en el córtex prefrontal",
          distractors: [
            "Positive Valence Systems e hiperactividad colinérgica cortical",
            "Social Processes e hipofuncionalidad dopaminérgica nigroestriada",
            "Arousal Systems e hiperactividad pineal"
          ],
          rationale: "La agresividad impulsiva se asocia a un déficit de serotonina en la corteza prefrontal, lo que disminuye el control inhibitorio (Cognitive Systems) sobre las estructuras subcorticales como la amígdala.",
          take_home: "La hipofuncionalidad serotoninérgica prefrontal disminuye la capacidad de frenar los arrebatos impulsivos de ira.",
          why_not: [
            { option: "Positive Valence Systems e hiperactividad colinérgica cortical", reason: "La acetilcolina no es el pilar de la agresividad impulsiva; el litio o los ISRS actúan sobre la vía de la serotonina." },
            { option: "Social Processes e hipofuncionalidad dopaminérgica nigroestriada", reason: "La vía nigroestriada dopaminérgica regula el movimiento motor extrapiramidal, no el control emocional prefrontal." },
            { option: "Arousal Systems e hiperactividad pineal", reason: "La glándula pineal y la melatonina regulan el sueño circadiano, ajeno a los arrebatos violentos diurnos impulsivos." }
          ]
        },
        especialidad: {
          instruction: "Paciente con Trastorno Explosivo Intermitente que no responde a ISRS ni a la TCC y mantiene conductas violentas que amenazan la integridad familiar. ¿Estrategia farmacológica de potenciación recomendada?",
          expected_answer: "Agregar un estabilizador del ánimo (ej. Valproato de Magnesio o Litio) o dosis bajas de un antipsicótico atípico",
          distractors: [
            "Prescribir benzodiacepinas de alta potencia a dosis máximas fijas",
            "Suspender toda terapia e indicar aislamiento social permanente voluntario",
            "Iniciar polifarmacia con 3 estimulantes dopaminérgicos"
          ],
          rationale: "Los estabilizadores del ánimo (valproato, litio) reducen la impulsividad y la reactividad emocional al modular la excitabilidad neuronal. Los antipsicóticos atípicos ayudan en la contención de la conducta impulsiva.",
          take_home: "El valproato y el litio son potentes adyuvantes para mitigar la agresividad impulsiva refractaria.",
          why_not: [
            { option: "Prescribir benzodiacepinas de alta potencia a dosis máximas fijas", reason: "Las benzodiacepinas pueden desinhibir la conducta agresiva en pacientes con control de impulsos deficiente, empeorando los arrebatos de ira." },
            { option: "Suspender toda terapia e indicar aislamiento social permanente voluntario", reason: "El aislamiento permanente no es realista, arruina la funcionalidad y constituye un abandono de tratamiento médico." },
            { option: "Iniciar polifarmacia con 3 estimulantes dopaminérgicos", reason: "Los estimulantes dopaminérgicos aumentan significativamente la agresividad, la irritabilidad y el insomnio en pacientes explosivos." }
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
        },
        residencia: {
          instruction: "¿Qué dominio RDoC y qué fármaco estabilizador con propiedades antidepresivas o antipsicótico atípico específico está indicado para la depresión bipolar?",
          expected_answer: "Negative Valence Systems (Afecto depresivo/Pérdida) e iniciar Quetiapina, Lurasidona o Lamotrigina",
          distractors: [
            "Positive Valence Systems e iniciar Metilfenidato",
            "Cognitive Systems e iniciar Donepezilo",
            "Arousal Systems e iniciar Alprazolam"
          ],
          rationale: "La depresión bipolar cursa con profunda disfunción de valencia negativa. Los tratamientos aprobados de primera línea son la quetiapina, lurasidona o lamotrigina (esta última previene episodios depresivos a largo plazo).",
          take_home: "La quetiapina y la lurasidona son los fármacos con mayor nivel de evidencia de primera línea para la depresión bipolar aguda.",
          why_not: [
            { option: "Positive Valence Systems e iniciar Metilfenidato", reason: "El metilfenidato inducirá viraje maníaco y agitación psicomotriz extrema en pacientes bipolares de forma muy rápida." },
            { option: "Cognitive Systems e iniciar Donepezilo", reason: "El donepezilo es un inhibidor de colinesterasa para demencias; carece de propiedades estabilizadoras del afecto o antidepresivas bipolares." },
            { option: "Arousal Systems e iniciar Alprazolam", reason: "El alprazolam es una benzodiacepina que puede aliviar la ansiedad pero no trata el episodio depresivo de fondo y expone a dependencia." }
          ]
        },
        especialidad: {
          instruction: "Paciente con depresión bipolar grave que mantiene ideas suicidas activas refractarias y rechaza la vía oral. ¿Manejo de rescate recomendado?",
          expected_answer: "Terapia Electroconvulsiva (TEC) bilateral bajo sedación o infusión controlada de Ketamina IV en unidad especializada",
          distractors: [
            "Administrar una dosis de amitriptilina intramuscular",
            "Aplicar contención física fija y dejar en ayuno por 24 horas",
            "Administrar dosis elevadas de Diazepam intravenoso continuo"
          ],
          rationale: "La TEC es el tratamiento más rápido, seguro y eficaz para la depresión bipolar refractaria con alto riesgo suicida. Las infusiones de ketamina representan una alternativa de rápida acción antisuicida en entornos especializados.",
          take_home: "La TEC destaca por su rapidez y alta eficacia antisuicida en la depresión bipolar grave refractaria.",
          why_not: [
            { option: "Administrar una dosis de amitriptilina intramuscular", reason: "La amitriptilina IM provocará un viraje maníaco severo y desestabilizará por completo el trastorno bipolar del paciente." },
            { option: "Aplicar contención física fija y dejar en ayuno por 24 horas", reason: "La privación de alimentos e inmovilización forzada no tratan la depresión de fondo, elevan la agitación y violan los derechos del paciente." },
            { option: "Administrar dosis elevadas de Diazepam intravenoso continuo", reason: "El diazepam deprime el sistema nervioso y el centro respiratorio sin poseer acción antidepresiva o estabilizadora del ánimo." }
          ]
        }
      }
    }
  ];

  function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function createCase(filters = {}) {
    const level = filters.educational_level || "licenciatura";
    const difficulty = filters.difficulty || "media";

    const mod = getRandom(SYMPTOM_MODULES);
    const name = `${getRandom(NAMES)} ${getRandom(LAST_NAMES)}`;
    const age = getRandom(AGES);
    const context = getRandom(CONTEXTS);
    
    // 2 síntomas aleatorios del módulo para variar el texto clínico
    const shuffledSymptoms = [...mod.symptoms].sort(() => 0.5 - Math.random());
    const selectedSymptoms = shuffledSymptoms.slice(0, 2).join(" ");
    
    // Obtener labs paraclínicos basados en dificultad
    const labText = mod.labs[difficulty] || mod.labs.media;

    const story = `Paciente de ${age}, ${name}, se encuentra ${context}. Presenta el siguiente cuadro: "${selectedSymptoms}"\n\n[Datos Clínicos/Paraclínicos] ${labText}`;

    // Obtener la tarea adecuada para el nivel educativo
    const taskData = mod.tasks[level] || mod.tasks.licenciatura;

    return {
      case_id: `MODULAR_${mod.type}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      title: mod.title,
      educational_level: level,
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