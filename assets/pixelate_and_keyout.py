#!/usr/bin/env python3
"""
pixelate_and_keyout.py — PsyCase sprite post-processing

Toma las sprite sheets exportadas de Gemini (fondo verde #00FF00) y:
  1. Quita el verde y lo convierte en transparencia real (canal alfa).
  2. Fuerza un look pixel art retro real (downscale + upscale sin suavizado,
     paleta de colores reducida).
  3. Opcionalmente separa la sheet en 10 (o N) imágenes individuales, una por
     pose, listas para el juego.

REQUISITOS (una sola vez):
    pip install pillow numpy

USO BÁSICO — una sola imagen, deja el sheet completo procesado:
    python pixelate_and_keyout.py --input celada.png --output celada_out.png

USO CON SEPARACIÓN EN POSES — parte el sheet 5x2 en 10 archivos:
    python pixelate_and_keyout.py --input celada.png --outdir celada_poses \
        --grid 5x2

USO POR LOTES — procesa todos los .png de una carpeta:
    python pixelate_and_keyout.py --input ./crudos --outdir ./procesados \
        --grid 5x2 --batch

AJUSTES ÚTILES:
    --pixel-size 8       tamaño de "pixel" retro (más alto = más chunky/retro)
    --colors 24          cuántos colores en la paleta final (menos = más retro)
    --key-color 0,255,0  color exacto del fondo verde a quitar
    --tolerance 60       qué tan agresivo es el filtro para detectar el verde
    --no-key             si ya quitaste el fondo tú mismo, no lo vuelvas a hacer
    --no-pixelate        solo quitar el verde, sin aplicar el efecto pixel art

NOMBRES DE POSE (por defecto, para --grid 5x2, orden fila por fila):
    normal, speaking, thinking, ok, streak,
    worried, shock, exhausted, surprised, angry
Puedes cambiarlos con --pose-names "normal,speaking,thinking,ok,streak,worried,shock,exhausted,surprised,angry"
"""

import argparse
import os
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("Faltan librerías. Instala con:\n    pip install pillow numpy")
    sys.exit(1)


DEFAULT_POSE_NAMES_10 = [
    "normal", "speaking", "thinking", "ok", "streak",
    "worried", "shock", "exhausted", "surprised", "angry",
]

DEFAULT_POSE_NAMES_8 = [
    "normal", "speaking", "thinking", "ok",
    "streak", "worried", "shock", "exhausted",
]


def remove_green_screen(img: Image.Image, key_color=(0, 255, 0), tolerance=60, feather=25) -> Image.Image:
    """Chroma-keys out a solid green background and returns an RGBA image
    with real transparency. Includes a soft edge (feather) so hair/edges
    don't look hard-cut, and a simple green-spill correction."""
    img = img.convert("RGBA")
    arr = np.array(img).astype(np.float32)

    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    kr, kg, kb = key_color

    dist = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)

    # Soft alpha ramp: fully transparent below tolerance, fully opaque above
    # tolerance+feather, smooth ramp in between.
    alpha_mult = np.clip((dist - tolerance) / max(feather, 1), 0, 1)
    a_new = a * alpha_mult

    # Green-spill correction on the pixels we keep (common on edges/hair):
    # if green is clearly the dominant channel, pull it down toward the
    # average of red and blue so no green fringe remains.
    spill_mask = (g > r) & (g > b)
    g_corrected = np.where(spill_mask, (r + b) / 2.0, g)

    out = np.stack([r, g_corrected, b, a_new], axis=-1)
    out = np.clip(out, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode="RGBA")


def pixelate(img: Image.Image, pixel_size=8, colors=24) -> Image.Image:
    """Downscales hard then upscales with nearest-neighbor to force a real
    pixel grid, and quantizes the color palette for a retro feel. Keeps
    the alpha channel intact throughout."""
    img = img.convert("RGBA")
    w, h = img.size

    small_w = max(1, w // pixel_size)
    small_h = max(1, h // pixel_size)

    # Downscale with a smooth filter (averages detail into blocky pixels),
    # then upscale with NEAREST (no smoothing) so pixels stay hard-edged.
    small = img.resize((small_w, small_h), Image.LANCZOS)

    # Quantize colors on the RGB channels only, alpha handled separately.
    rgb = small.convert("RGB")
    quantized_rgb = rgb.quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")

    r, g, b = np.array(quantized_rgb)[..., 0], np.array(quantized_rgb)[..., 1], np.array(quantized_rgb)[..., 2]
    a = np.array(small.getchannel("A"))
    small_final = Image.fromarray(np.stack([r, g, b, a], axis=-1).astype(np.uint8), mode="RGBA")

    pixelated = small_final.resize((w, h), Image.NEAREST)
    return pixelated


def split_grid(img: Image.Image, cols: int, rows: int):
    """Yields (index, cell_image) for a cols x rows grid, left-to-right,
    top-to-bottom."""
    w, h = img.size
    cell_w, cell_h = w // cols, h // rows
    idx = 0
    for row in range(rows):
        for col in range(cols):
            box = (col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)
            yield idx, img.crop(box)
            idx += 1


def process_one(input_path, output_path=None, outdir=None, grid=None,
                 pixel_size=8, colors=24, key_color=(0, 255, 0), tolerance=60,
                 do_key=True, do_pixelate=True, pose_names=None):
    img = Image.open(input_path)

    if do_key:
        img = remove_green_screen(img, key_color=key_color, tolerance=tolerance)
    if do_pixelate:
        img = pixelate(img, pixel_size=pixel_size, colors=colors)

    base_name = os.path.splitext(os.path.basename(input_path))[0]

    if grid:
        cols, rows = grid
        total = cols * rows
        if pose_names is None:
            if total == 10:
                pose_names = DEFAULT_POSE_NAMES_10
            elif total == 8:
                pose_names = DEFAULT_POSE_NAMES_8
            else:
                pose_names = [f"pose{i+1}" for i in range(total)]
        os.makedirs(outdir, exist_ok=True)
        for idx, cell in split_grid(img, cols, rows):
            name = pose_names[idx] if idx < len(pose_names) else f"pose{idx+1}"
            out_path = os.path.join(outdir, f"{base_name}_{name}.png")
            cell.save(out_path)
            print(f"  guardado: {out_path}")
    else:
        if output_path is None:
            output_path = os.path.join(outdir or ".", f"{base_name}_out.png")
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        img.save(output_path)
        print(f"  guardado: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Quita fondo verde y pixela sprites de PsyCase.")
    parser.add_argument("--input", required=True, help="Archivo .png o carpeta (con --batch)")
    parser.add_argument("--output", default=None, help="Ruta de salida para un solo archivo, sin --grid")
    parser.add_argument("--outdir", default=None, help="Carpeta de salida (requerida con --grid o --batch)")
    parser.add_argument("--batch", action="store_true", help="Procesa todos los .png de la carpeta --input")
    parser.add_argument("--grid", default=None, help='Ej: "5x2" para separar la sheet en celdas individuales')
    parser.add_argument("--pose-names", default=None, help="Lista separada por comas, ej: normal,speaking,...")
    parser.add_argument("--pixel-size", type=int, default=8, help="Tamaño de bloque de pixel retro (default 8)")
    parser.add_argument("--colors", type=int, default=24, help="Colores en la paleta final (default 24)")
    parser.add_argument("--key-color", default="0,255,0", help="Color del fondo a quitar, ej: 0,255,0")
    parser.add_argument("--tolerance", type=float, default=60, help="Sensibilidad del chroma key (default 60)")
    parser.add_argument("--no-key", action="store_true", help="No quitar el fondo verde")
    parser.add_argument("--no-pixelate", action="store_true", help="No aplicar el efecto pixel art")

    args = parser.parse_args()

    key_color = tuple(int(x) for x in args.key_color.split(","))
    grid = None
    if args.grid:
        cols, rows = args.grid.lower().split("x")
        grid = (int(cols), int(rows))

    pose_names = args.pose_names.split(",") if args.pose_names else None

    if args.batch:
        if not args.outdir:
            print("Con --batch necesitas indicar --outdir")
            sys.exit(1)
        files = [f for f in os.listdir(args.input) if f.lower().endswith(".png")]
        if not files:
            print(f"No se encontraron .png en {args.input}")
            sys.exit(1)
        for f in files:
            print(f"Procesando {f}...")
            process_one(
                os.path.join(args.input, f),
                outdir=args.outdir,
                grid=grid,
                pixel_size=args.pixel_size,
                colors=args.colors,
                key_color=key_color,
                tolerance=args.tolerance,
                do_key=not args.no_key,
                do_pixelate=not args.no_pixelate,
                pose_names=pose_names,
            )
    else:
        process_one(
            args.input,
            output_path=args.output,
            outdir=args.outdir,
            grid=grid,
            pixel_size=args.pixel_size,
            colors=args.colors,
            key_color=key_color,
            tolerance=args.tolerance,
            do_key=not args.no_key,
            do_pixelate=not args.no_pixelate,
            pose_names=pose_names,
        )

    print("Listo.")


if __name__ == "__main__":
    main()
