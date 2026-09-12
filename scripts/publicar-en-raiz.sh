#!/usr/bin/env bash
#
# Copia el sitio ya construido (out/) a la raíz del repositorio, que es de
# donde GitHub Pages sirve este proyecto.
#
# Publicar así, y no con la acción oficial de Pages, evita tener que cambiar
# el origen de Pages en los ajustes del repositorio: el sitio aparece donde
# Pages ya está mirando.
#
# Para poder limpiar lo de la vuelta anterior sin adivinar, cada ejecución
# anota en .sitio-generado qué entradas de primer nivel creó. La siguiente
# borra exactamente esas y ninguna más.

set -euo pipefail

SALIDA="out"
MANIFIESTO=".sitio-generado"

# Nada de esta lista se borra jamás, pase lo que pase con el manifiesto.
PROTEGIDAS=(
  ".git" ".github" "node_modules" "src" "public" "scripts"
  "package.json" "package-lock.json" "tsconfig.json" "next.config.ts"
  "postcss.config.mjs" "eslint.config.mjs" "next-env.d.ts"
  "README.md" "AGENTS.md" "CLAUDE.md" ".gitignore"
  "firestore.rules" "firestore.indexes.json" "firebase.json"
  ".env.example" ".env.production" "CNAME" "$MANIFIESTO" "$SALIDA"
)

esta_protegida() {
  local candidata="$1"
  for protegida in "${PROTEGIDAS[@]}"; do
    [[ "$candidata" == "$protegida" ]] && return 0
  done
  return 1
}

[[ -d "$SALIDA" ]] || { echo "No existe $SALIDA/. ¿Se ejecutó la compilación?" >&2; exit 1; }

# 1. Retirar lo que publicó la ejecución anterior.
if [[ -f "$MANIFIESTO" ]]; then
  while IFS= read -r entrada; do
    [[ -z "$entrada" ]] && continue
    if esta_protegida "$entrada"; then
      echo "Se omite '$entrada': está protegida." >&2
      continue
    fi
    rm -rf -- "$entrada"
  done < "$MANIFIESTO"
fi

# 2. Copiar el sitio nuevo y anotar qué se copió.
: > "$MANIFIESTO"
shopt -s dotglob nullglob
for ruta in "$SALIDA"/*; do
  entrada="$(basename "$ruta")"
  if esta_protegida "$entrada"; then
    echo "Se omite '$entrada': coincide con un archivo del proyecto." >&2
    continue
  fi
  rm -rf -- "$entrada"
  cp -R -- "$ruta" "$entrada"
  printf '%s\n' "$entrada" >> "$MANIFIESTO"
done
shopt -u dotglob nullglob

echo "Publicadas $(wc -l < "$MANIFIESTO") entradas en la raíz."
