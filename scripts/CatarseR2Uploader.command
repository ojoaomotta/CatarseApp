#!/bin/bash
# ==============================================================================
# Catarse R2 Batch Photo Uploader Launcher (macOS)
# ==============================================================================
# Dá dois cliques para executar a automação de upload de fotos da Catarse no Mac.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "================================================================="
echo "        Catarse Film — Automação de Upload de Fotos em Lote     "
echo "================================================================="
echo ""

read -p "Digite o Usuário do Cliente no Catarse App (ex: evillydavi): " CLIENT_USER
read -p "Arraste a pasta com as fotos do Mac para cá e pressione ENTER: " FOLDER_PATH

# Remove aspas se o Finder colocar
FOLDER_PATH=$(echo "$FOLDER_PATH" | tr -d '"' | tr -d "'")

read -p "Digite a Categoria das fotos (ex: Cerimônia, Recepção, Ensaio) [Padrão: Geral]: " CATEGORY
CATEGORY=${CATEGORY:-Geral}

echo ""
echo "Iniciando processamento e upload..."
python3 catarse_r2_uploader.py --client "$CLIENT_USER" --folder "$FOLDER_PATH" --category "$CATEGORY"

echo ""
read -p "Pressione ENTER para sair..."
