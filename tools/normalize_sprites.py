#!/usr/bin/env python3
"""
normalize_sprites.py — reencuadra las sprite sheets de PsyCase.

Las hojas de `assets/sprites/*_out.png` vienen de Gemini en una rejilla 5x2
(10 poses, ver pixelate_and_keyout.py). El problema: dentro de cada celda el
personaje no está centrado — la cabeza se desplaza hasta un 20% del ancho de
celda según la pose, así que el avatar del HUD recorta media cara.

Esta herramienta detecta la cabeza de cada pose y reescribe la hoja con la
cabeza centrada horizontalmente y anclada a una altura constante, dejando
celdas cuadradas. El resultado (`<nombre>_atlas.png`) se puede recortar en el
CSS con aritmética exacta: background-size 500% 200%.

USO:
    python3 tools/normalize_sprites.py                 # procesa todas las hojas
    python3 tools/normalize_sprites.py --check         # solo reporta desviaciones
    python3 tools/normalize_sprites.py --input herrera_out.png

REQUISITOS: pip install pillow numpy
"""

import argparse
import glob
import os
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("Faltan librerías. Instala con:\n    pip install pillow numpy")
    sys.exit(1)

COLS, ROWS = 5, 2

# Orden de poses fila por fila, igual que pixelate_and_keyout.py
POSE_NAMES = [
    "normal", "speaking", "thinking", "ok", "streak",
    "worried", "shock", "exhausted", "surprised", "angry",
]

# Un píxel cuenta como "personaje" a partir de esta opacidad. Las hojas traen
# restos semitransparentes del croma verde que ensucian cualquier bounding box
# calculado con alpha > 0.
ALPHA_SOLID = 200

# Fracción de la altura de celda que se considera "cabeza" a partir del primer
# píxel del personaje. Debe quedarse por encima de los hombros: si la banda los
# alcanza, el ancho detectado se dispara y el centro se va al lado contrario.
HEAD_BAND = 0.30

# Dónde queda la coronilla dentro de la celda ya normalizada.
TARGET_HEAD_TOP = 0.07

# Las hojas traen una línea oscura pegada al filo de cada celda (resto del
# marco con el que se exportaron). Al desplazar la pose esa línea se arrastra y
# deja una banda sucia, así que se recorta y nunca se usa como fuente al
# replicar bordes. Fracción del lado de la celda.
BORDER_TRIM = 0.02

# Tope del reencuadre, en fracción del lado de la celda. La franja que queda al
# descubierto se rellena replicando el borde, y si el borde cae sobre el
# personaje (hombro, bata) la réplica se ve como un churro horizontal. Por
# debajo de este tope la franja es de pocos píxeles y no se nota; más allá,
# vale más dejar la pose ligeramente descentrada que ensuciarla.
MAX_SHIFT_X = 0.10
MAX_SHIFT_Y = 0.06


def solid_mask(cell_alpha):
    return cell_alpha > ALPHA_SOLID


def longest_run(row):
    """(inicio, fin) del tramo contiguo más largo de True, o None."""
    best = None
    best_len = 0
    start = None
    for i, v in enumerate(row):
        if v:
            if start is None:
                start = i
        elif start is not None:
            if i - start > best_len:
                best_len, best = i - start, (start, i - 1)
            start = None
    if start is not None and len(row) - start > best_len:
        best = (start, len(row) - 1)
    return best


def head_box(mask):
    """Devuelve (x0, x1, y_top) de la cabeza, o None si la celda está vacía.

    Recorre la banda superior fila por fila y se queda con el tramo contiguo
    más largo de cada una: el cráneo es el blobo dominante ahí arriba, así que
    una mano levantada, un destello o la libreta quedan fuera por ser tramos
    separados y más cortos. El centro final es la mediana de los centros de
    fila, que aguanta las pocas filas donde la mano sí toca la cabeza.
    """
    rows = np.nonzero(mask.sum(axis=1) > mask.shape[1] * 0.01)[0]
    if len(rows) == 0:
        return None
    y_top = int(rows.min())
    band = mask[y_top:y_top + int(mask.shape[0] * HEAD_BAND)]

    centers, lefts, rights = [], [], []
    for row in band:
        run = longest_run(row)
        # Ignora filas casi vacías (la punta del pelo) y las que ya se comieron
        # media celda: no describen el cráneo.
        if run is None:
            continue
        width = run[1] - run[0] + 1
        if width < mask.shape[1] * 0.08 or width > mask.shape[1] * 0.75:
            continue
        lefts.append(run[0])
        rights.append(run[1])
        centers.append((run[0] + run[1]) / 2)

    if not centers:
        return None
    cx = float(np.median(centers))
    half = float(np.median([r - l for l, r in zip(lefts, rights)])) / 2
    return int(round(cx - half)), int(round(cx + half)), y_top


def clear_border(arr, trim):
    """Borra la línea de marco pegada a los cuatro filos de la celda."""
    if trim <= 0:
        return arr
    arr[:trim, :, 3] = 0
    arr[-trim:, :, 3] = 0
    arr[:, :trim, 3] = 0
    arr[:, -trim:, 3] = 0
    return arr


def shift_cell(cell, dx, dy):
    """Desplaza la celda replicando los bordes.

    El personaje llega hasta el filo de la celda (los hombros están cortados),
    así que un desplazamiento a secas dejaría una franja transparente donde
    debería seguir la bata. Replicar la columna/fila del borde rellena ese
    hueco sin costura visible: en pixel art de colores planos el borde ya es
    un bloque uniforme, y como la réplica es fila por fila, arriba se copia
    fondo transparente y abajo se copia la bata, que es justo lo que toca.
    """
    arr = np.array(cell)
    h, w = arr.shape[:2]
    trim = max(1, int(round(min(h, w) * BORDER_TRIM)))
    clear_border(arr, trim)

    if dx:
        arr = np.roll(arr, dx, axis=1)
        # Se replica desde la primera columna limpia, no desde el filo, para no
        # arrastrar lo que quedó del marco.
        if dx > 0:
            arr[:, :dx + trim] = arr[:, dx + trim:dx + trim + 1]
        else:
            src = w + dx - trim - 1
            arr[:, src:] = arr[:, src - 1:src]
    if dy:
        arr = np.roll(arr, dy, axis=0)
        if dy > 0:
            arr[:dy + trim, :] = arr[dy + trim:dy + trim + 1, :]
        else:
            src = h + dy - trim - 1
            arr[src:, :] = arr[src - 1:src, :]

    return Image.fromarray(arr)


def analyze(path):
    """Devuelve la lista de desviaciones (dx, dy) en % de celda por pose."""
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    cw, ch = W / COLS, H / ROWS
    alpha = np.array(im)[:, :, 3]
    out = []
    for i in range(COLS * ROWS):
        r, c = divmod(i, COLS)
        sub = alpha[int(r * ch):int((r + 1) * ch), int(c * cw):int((c + 1) * cw)]
        hb = head_box(solid_mask(sub))
        if hb is None:
            out.append(None)
            continue
        x0, x1, y_top = hb
        head_cx = (x0 + x1) / 2
        dx = sub.shape[1] / 2 - head_cx
        dy = TARGET_HEAD_TOP * sub.shape[0] - y_top
        out.append((dx / sub.shape[1] * 100, dy / sub.shape[0] * 100))
    return out


def normalize(path, out_path):
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    cw, ch = W // COLS, H // ROWS
    # Celda cuadrada: el avatar se muestra en un contenedor cuadrado, así el
    # CSS no tiene que compensar ninguna relación de aspecto.
    side = min(cw, ch)
    alpha = np.array(im)[:, :, 3]

    atlas = Image.new("RGBA", (side * COLS, side * ROWS), (0, 0, 0, 0))
    report = []

    for i in range(COLS * ROWS):
        r, c = divmod(i, COLS)
        box = (int(c * W / COLS), int(r * H / ROWS),
               int(c * W / COLS) + cw, int(r * H / ROWS) + ch)
        cell = im.crop(box)
        sub = alpha[box[1]:box[3], box[0]:box[2]]

        hb = head_box(solid_mask(sub))
        dx = dy = 0
        if hb is not None:
            x0, x1, y_top = hb
            dx = int(round(cw / 2 - (x0 + x1) / 2))
            dy = int(round(TARGET_HEAD_TOP * ch - y_top))
            # Un desplazamiento vertical grande subiría los hombros y dejaría
            # el torso hueco; la cabeza ya viene bien anclada en casi todas las
            # poses, así que sólo se corrigen desviaciones moderadas.
            dx = max(-int(cw * MAX_SHIFT_X), min(int(cw * MAX_SHIFT_X), dx))
            dy = max(-int(ch * MAX_SHIFT_Y), min(int(ch * MAX_SHIFT_Y), dy))
        # Siempre pasa por shift_cell, aunque no haya que mover nada: es quien
        # limpia el marco oscuro del filo, y si sólo lo hicieran las poses
        # desplazadas el borde aparecería en unas sí y en otras no.
        cell = shift_cell(cell, dx, dy)
        report.append((POSE_NAMES[i], dx, dy))

        # Recorte centrado a celda cuadrada
        if cw != side or ch != side:
            left = (cw - side) // 2
            top = (ch - side) // 2
            cell = cell.crop((left, top, left + side, top + side))

        atlas.paste(cell, (c * side, r * side))

    atlas.save(out_path)
    return side, report


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", default="assets/sprites", help="carpeta de hojas")
    ap.add_argument("--input", help="procesa una sola hoja (nombre de archivo)")
    ap.add_argument("--check", action="store_true",
                    help="solo reporta la desviación de cada pose, no escribe nada")
    args = ap.parse_args()

    if args.input:
        sheets = [os.path.join(args.dir, args.input)]
    else:
        sheets = sorted(glob.glob(os.path.join(args.dir, "*_out.png")))

    if not sheets:
        print("No se encontraron hojas *_out.png en", args.dir)
        return 1

    for path in sheets:
        name = os.path.basename(path)
        if args.check:
            devs = analyze(path)
            worst = max((abs(d[0]) for d in devs if d), default=0)
            print(f"{name:20s} desviación máx {worst:5.1f}% | " +
                  " ".join(f"{POSE_NAMES[i]}:{d[0]:+.0f}" if d else f"{POSE_NAMES[i]}:?"
                           for i, d in enumerate(devs)))
        else:
            out_path = path.replace("_out.png", "_atlas.png")
            side, report = normalize(path, out_path)
            moved = [f"{p}:{dx:+d}" for p, dx, _ in report if dx]
            print(f"{name:20s} -> {os.path.basename(out_path)} "
                  f"({COLS}x{ROWS} de {side}px) recentradas: {len(moved)}/10")
    return 0


if __name__ == "__main__":
    sys.exit(main())
