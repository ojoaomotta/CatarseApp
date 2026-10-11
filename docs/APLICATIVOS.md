# Aplicativos Catarse

## Arquitetura

O pacote Tauri 2 contém a tela local de abertura. No desktop, essa tela consulta o release público do GitHub, baixa uma atualização quando houver, verifica a assinatura e instala antes de abrir a central. Sem atualização ou após escolher continuar numa falha, um comando nativo verifica `/api/health` e navega para `https://catarseadm.vercel.app/`.

A central online usa cookies de primeira parte no próprio domínio. Não há credenciais embutidas, cópia do banco, API paralela, mudança de CORS ou acesso direto do app ao Supabase. É necessário estar conectado. O usuário entra com o mesmo cadastro do site; a sessão do navegador não é copiada para o aplicativo.

As permissões nativas pertencem somente à origem local da tela de abertura. A página remota não recebe capacidades de updater, arquivos, shell ou comandos. Os arquivos do app antigo não são incluídos no pacote. O identificador `com.catarse.central` foi preservado.

## Plataformas

- Mac: DMG universal (Intel e Apple Silicon), fundo próprio e instalação em Aplicativos. Sem Developer ID/notarização por enquanto.
- Windows: NSIS EXE x64 em português, por usuário, sem exigir administrador. Sem Authenticode por enquanto.
- Android: APK ARM64, assinado por chave persistente. O Android confirma a instalação/atualização do APK. Não existe atualização silenciosa de APK neste projeto.
- iPhone: app web via Safari → Compartilhar → Adicionar à Tela de Início. O projeto nativo é compilado separadamente para simulador. Instalação pessoal via Xcode permite uma conta Apple gratuita, com renovação em 7 dias; veja IPHONE-PESSOAL.md. TestFlight/App Store exigem Apple Developer, certificados e provisioning profile. Artefato de simulador não instala em aparelho.

O app web instalado não armazena os registros financeiros em cache. O service worker guarda apenas uma página pública para indicar falta de conexão. Melhorias do painel online são recebidas ao recarregar; novos binários desktop usam o updater do GitHub.

## Release

1. Atualizar a mesma versão em package.json, package-lock.json, Cargo.toml/Cargo.lock e tauri.conf.json.
2. Executar `npm run build:native`, `cargo check --manifest-path src-tauri/Cargo.toml` e os testes financeiros.
3. Executar o workflow `Catarse installers` (ou enviar tag `app-vX.Y.Z`).
4. O workflow cria/reutiliza um rascunho; compila Mac/Windows/Android e anexa artefatos e assinaturas. Depois que todas as compilações terminam, a etapa final reconstrói latest.json a partir das assinaturas dos arquivos finais para evitar metadados antigos em recompilações.
5. Baixar os artefatos e executar `node scripts/verify-release.mjs DIRETORIO`. O verificador confere plataformas, versão, URL, arquivos e assinaturas criptográficas contra a chave pública embarcada.
6. Conferir o resultado e publicar o rascunho. Somente releases publicados aparecem na consulta de atualização e na página `/install.html`.

Não substituir a chave privada de atualização existente: instalações anteriores confiam na chave pública já distribuída. O segredo `TAURI_SIGNING_PRIVATE_KEY` permanece no GitHub. A chave Android e sua senha têm cópia privada em `.catarse-finance-data/app-signing/` e secrets `ANDROID_KEY_BASE64`/`ANDROID_KEY_PASSWORD`; nunca devem entrar no Git. Guardar backup seguro dessa pasta para futuras versões Android.

## Limites de validação

Compilar ou verificar uma assinatura não equivale a testar uma instalação em aparelho. Registrar quais sistemas/aparelhos foram testados antes de afirmar compatibilidade completa. A atualização do app 0.9 pode exigir uma reinstalação inicial, porque aquela versão não tinha as permissões de updater configuradas corretamente.
