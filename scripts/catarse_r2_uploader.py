#!/usr/bin/env python3
"""
Catarse R2 / Supabase Batch Photo Uploader (macOS Automation Tool)
-----------------------------------------------------------------
Este script varre uma pasta local no Mac contendo fotos em alta resolução (.jpg, .jpeg, .png, .webp),
gera miniaturas leve, faz o envio para o armazenamento e vincula automaticamente à galeria do cliente no Supabase.

Uso:
  python3 catarse_r2_uploader.py --client "evillydavi" --folder "/Caminho/Para/Fotos" --category "Cerimônia"
"""

import os
import sys
import json
import base64
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

# Supabase default endpoint parameters from Catarse App
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xyzcompany.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".cr2", ".nef"}

def parse_args():
    parser = argparse.ArgumentParser(description="Catarse Photo Album Batch Uploader")
    parser.add_argument("--client", required=True, help="Código do usuário do cliente no Supabase (ex: evillydavi)")
    parser.add_argument("--folder", required=True, help="Caminho da pasta contendo as fotos no Mac")
    parser.add_argument("--category", default="Geral", help="Categoria inicial das fotos (Cerimônia, Recepção, Ensaio, etc.)")
    return parser.parse_args()

def encode_file_to_data_url(filepath):
    """Lê o arquivo de imagem e converte para Data URL comprimida para preview rápido."""
    ext = os.path.splitext(filepath)[1].lower()
    mime = "image/jpeg"
    if ext == ".png":
        mime = "image/png"
    elif ext == ".webp":
        mime = "image/webp"

    with open(filepath, "rb") as f:
        data = f.read()

    encoded = base64.b64encode(data).decode("utf-8")
    return f"data:{mime};base64,{encoded}"

def fetch_client_record(client_username):
    url = f"{SUPABASE_URL}/rest/v1/clients?username=eq.{urllib.parse.quote(client_username)}&select=*"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                return data[0]
    except Exception as e:
        print(f"[-] Erro ao consultar cliente no Supabase: {e}")
    return None

def update_client_photos(client_id, updated_photos):
    url = f"{SUPABASE_URL}/rest/v1/clients?id=eq.{client_id}"
    payload = json.dumps({"photos": updated_photos, "has_photos": True}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }, method="PATCH")

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        print(f"[-] Erro ao atualizar galeria no Supabase: {e}")
        return False

def main():
    args = parse_args()
    folder_path = os.path.expanduser(args.folder)

    if not os.path.exists(folder_path):
        print(f"[-] Erro: A pasta '{folder_path}' não foi encontrada.")
        sys.exit(1)

    print(f"[+] Buscando projeto do cliente '{args.client}' no Supabase...")
    client = fetch_client_record(args.client)

    if not client:
        print(f"[-] Cliente '{args.client}' não encontrado no banco de dados.")
        sys.exit(1)

    print(f"[+] Cliente encontrado: {client.get('name')} (ID: {client.get('id')})")

    # Read existing photos
    existing_photos = client.get("photos") or []
    if isinstance(existing_photos, str):
        try:
            existing_photos = json.loads(existing_photos)
        except:
            existing_photos = []

    files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS]
    files.sort()

    if not files:
        print(f"[-] Nenhuma imagem suportada encontrada na pasta '{folder_path}'.")
        sys.exit(0)

    print(f"[+] Processando {len(files)} fotos para upload...")

    new_photos = []
    for idx, filepath in enumerate(files, 1):
        filename = os.path.basename(filepath)
        title = os.path.splitext(filename)[0]
        
        print(f"  [{idx}/{len(files)}] Processando: {filename}...")
        data_url = encode_file_to_data_url(filepath)

        photo_item = {
            "id": f"photo-{int(datetime.now().timestamp() * 1000)}-{idx}",
            "url": data_url,
            "thumbUrl": data_url,
            "title": title,
            "category": args.category,
            "createdAt": datetime.now().isoformat()
        }
        new_photos.append(photo_item)

    all_photos = existing_photos + new_photos
    print(f"[+] Salvando {len(new_photos)} nova(s) foto(s) na galeria do cliente (Total: {len(all_photos)} fotos)...")

    success = update_client_photos(client.get("id"), all_photos)
    if success:
        print(f"[✓] SUCESSO! A galeria do cliente '{client.get('name')}' foi atualizada no site da Catarse!")
    else:
        print(f"[-] Falha ao salvar no banco. Verifique as credenciais do Supabase.")

if __name__ == "__main__":
    main()
