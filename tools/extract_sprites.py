#!/usr/bin/env python3
"""Re-extrae los sprite sheets a tiras limpias de 4x1 con celdas cuadradas.

Problema original: las hojas venían como 4 columnas x 1 fila, pero el juego las
recortaba con metadatos erróneos (rows:2/4 + pctY) dejando cabezas cortadas, y
las celdas no cuadradas se deformaban dentro del avatar cuadrado. Paciente 2
además nunca se recortó del fondo magenta.

Este script, para cada hoja:
  1. Separa en 4 columnas iguales (el layout real de todas las hojas).
  2. Quita el fondo croma (magenta) cuando existe.
  3. Detecta la cabeza de cada figura y recorta un cuadro tipo busto,
     centrado y a escala uniforme, sobre transparencia real.
  4. Ensambla una tira 4x1 de celdas cuadradas (CELL x CELL).
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

# Directorio con las HOJAS ORIGINALES (sin procesar). Se define por variable de
# entorno para no leer nunca la propia salida ya reextraída de assets/sprites.
SRC = os.environ.get("SRCDIR", "assets/sprites_src")
CELL = 512  # tamaño final de cada celda cuadrada

# Ajuste de encuadre por hoja: (K = factor ancho-cabeza -> lado del cuadro,
# top_frac = holgura sobre la cabeza como fracción del lado).
# Valores por defecto; se pueden afinar por archivo.
DEFAULT = dict(K=3.0, top=0.10)
TUNING = {
    # Bustos (cintura para arriba): cabeza grande, menos holgura.
    "Dra. Aguilar.png": dict(K=2.7, top=0.08),
    "Dr. Solís.png":    dict(K=2.7, top=0.08),
    "Dra. Ríos.png":    dict(K=2.7, top=0.08),
    "Dra. Ferrer.png":  dict(K=2.7, top=0.08),
    # Cuerpo entero: cabeza chica respecto al lienzo, un poco más de cuadro.
    "Dr. Mendoza.png":  dict(K=3.0, top=0.10),
    "Dr. Castañeda.png":dict(K=3.2, top=0.10),
    "Dr. Valdez.png":   dict(K=3.0, top=0.09),
    "Dra. Herrera.png": dict(K=2.4, top=0.08),
    "Dr. Celada.png":   dict(K=3.2, top=0.10),
    # Pacientes: escenas con figura de cuerpo entero.
    "paciente 1 Joven Adulto.png":            dict(K=3.3, top=0.10),
    "Paciente 2 Adulta Mayor.png":            dict(K=2.9, top=0.09),
    "Paciente 3 Adulto de Mediana Edad.png":  dict(K=3.3, top=0.10),
}

# Hojas cuyo fondo es magenta opaco (croma sin recortar).
CHROMA_MAGENTA = {"Paciente 2 Adulta Mayor.png"}

# Hojas-escena: la figura está dibujada sobre un fondo opaco (sala de hospital)
# con texto quemado, así que la cabeza no se detecta por alfa. Se define un
# recuadro tipo busto por panel en coordenadas de origen: (cx, top). El lado
# del cuadro es 'side' (constante por hoja para escala uniforme). Panel i ocupa
# la columna [i*cw, (i+1)*cw); cx es absoluto dentro de esa columna.
SCENE_BOXES = {
    "paciente 1 Joven Adulto.png": dict(side=520, boxes=[
        (180, 400), (365, 410), (345, 405), (330, 470),
    ]),
    "Paciente 3 Adulto de Mediana Edad.png": dict(side=700, boxes=[
        (300, 140), (345, 145), (315, 205), (360, 200),
    ]),
}


def dechroma_magenta(arr):
    """Convierte el fondo magenta opaco en alfa transparente."""
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    mag = (r > 170) & (b > 170) & (g < 110)
    a = arr[:, :, 3].copy()
    a[mag] = 0
    arr = arr.copy()
    arr[:, :, 3] = a
    return arr


def _disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def clean_glow(arr, close_r=7, min_speck=30):
    """Cierra el hueco transparente entre el cuerpo y el 'glow' flotante.

    El arte original trae un contorno luminoso de 1-2 px separado del cuerpo
    por una franja transparente de ~10 px: sobre cualquier fondo se ve como
    un aro hueco alrededor de la figura. Aquí se puentea ese hueco (closing),
    se rellenan huecos internos, se quitan motas sueltas y los pixeles que
    pasan a ser opacos toman el color del pixel opaco más cercano (para que
    la franja rellenada no quede negra).
    """
    a = arr[:, :, 3]
    mask = a > 0
    st = _disk(close_r)
    closed = ndimage.binary_closing(mask, structure=st)
    closed = ndimage.binary_fill_holes(closed)
    # Quita componentes diminutos (ruido de glow), conserva gotas/marcas.
    lbl, n = ndimage.label(closed)
    if n > 0:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, index=range(1, n + 1))
        small = np.where(sizes < min_speck)[0] + 1
        if len(small):
            closed[np.isin(lbl, small)] = False
    new = closed & ~mask
    out = arr.copy()
    if new.any():
        idx = ndimage.distance_transform_edt(
            ~mask, return_distances=False, return_indices=True)
        rgb = arr[:, :, :3]
        nearest = rgb[idx[0], idx[1]]
        out[:, :, :3] = np.where(new[:, :, None], nearest, rgb)
    out[:, :, 3] = np.where(closed, 255, 0).astype(np.uint8)
    return out


def erode_alpha(arr, px=1):
    """Encoge el alfa 'px' pixeles para eliminar franjas de croma en los bordes."""
    a = arr[:, :, 3]
    m = a > 16
    for _ in range(px):
        m2 = m.copy()
        m2[1:, :] &= m[:-1, :]
        m2[:-1, :] &= m[1:, :]
        m2[:, 1:] &= m[:, :-1]
        m2[:, :-1] &= m[:, 1:]
        m = m2
    out = arr.copy()
    out[:, :, 3] = np.where(m, a, 0)
    return out


def bust_crop(cell):
    """Recorta un cuadro tipo busto centrado en la cabeza de la figura."""
    arr = np.array(cell)
    a = arr[:, :, 3]
    ys, xs = np.where(a > 16)
    if len(ys) == 0:
        return None
    top, bottom = ys.min(), ys.max()
    fig_h = max(bottom - top, 1)
    # Fila a ~15% de la cabeza para medir su ancho (estable ante gestos/brazos).
    head_row = int(top + 0.15 * fig_h)
    row_cols = np.where(a[head_row] > 16)[0]
    if len(row_cols) < 4:
        # fallback: usa bbox completo
        row_cols = xs
    head_l, head_r = row_cols.min(), row_cols.max()
    head_w = max(head_r - head_l, 1)
    head_cx = (head_l + head_r) / 2.0
    return top, head_cx, head_w


def process(fname, tune):
    im = Image.open(os.path.join(SRC, fname)).convert("RGBA")
    arr = np.array(im)
    if fname in CHROMA_MAGENTA:
        arr = dechroma_magenta(arr)
        arr = erode_alpha(arr, 2)
    # Las hojas-escena son paneles opacos (sin glow flotante); el resto trae
    # el contorno luminoso separado que hay que cerrar.
    if fname not in SCENE_BOXES:
        arr = clean_glow(arr)
    W = arr.shape[1]
    cw = W // 4

    # Hojas-escena: recuadros manuales por panel.
    if fname in SCENE_BOXES:
        spec = SCENE_BOXES[fname]
        side = spec["side"]
        full = Image.fromarray(arr)
        out = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
        for i, (cx, top) in enumerate(spec["boxes"]):
            ax = i * cw + cx
            box = (int(ax - side / 2), int(top),
                   int(ax + side / 2), int(top + side))
            crop = full.crop(box).resize((CELL, CELL), Image.LANCZOS)
            out.alpha_composite(crop, (i * CELL, 0))
        return out

    K, topf = tune["K"], tune["top"]

    cells = []
    for i in range(4):
        x0 = i * cw
        x1 = W if i == 3 else (i + 1) * cw
        cell = Image.fromarray(arr[:, x0:x1])
        info = bust_crop(cell)
        cells.append((cell, info))

    # Escala uniforme por hoja: usa el ancho de cabeza mediano de las 4 celdas.
    head_ws = [c[1][2] for c in cells if c[1]]
    med_hw = float(np.median(head_ws)) if head_ws else cw * 0.3
    side = max(int(round(med_hw * K)), 8)

    out = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
    for i, (cell, info) in enumerate(cells):
        if info is None:
            continue
        top, head_cx, _ = info
        left = head_cx - side / 2.0
        top_y = top - topf * side
        box = (int(round(left)), int(round(top_y)),
               int(round(left + side)), int(round(top_y + side)))
        # Recorta con relleno transparente si la caja excede la celda.
        crop = cell.crop(box)  # PIL rellena con transparente fuera de límites
        crop = crop.resize((CELL, CELL), Image.LANCZOS)
        out.alpha_composite(crop, (i * CELL, 0))
    return out


def main():
    outdir = os.environ.get("OUTDIR", "/tmp/sprites_out")
    os.makedirs(outdir, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".png"):
            continue
        tune = TUNING.get(f, DEFAULT)
        out = process(f, tune)
        out.save(os.path.join(outdir, f))
        print("ok", f, out.size)


if __name__ == "__main__":
    main()
