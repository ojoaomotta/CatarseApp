# Instalar Catarse apenas no seu iPhone, sem App Store

Você pode usar uma conta Apple gratuita (Personal Team) para assinar e instalar o app no seu próprio aparelho pelo Xcode. Não é necessário publicar na App Store nem pagar a assinatura Apple Developer para esse teste pessoal. A autorização gratuita dura 7 dias; depois é necessário renovar a instalação. Não há atualização permanente de IPA diretamente pelo GitHub nesse modo.

Fonte: https://developer.apple.com/help/account/basics/about-your-developer-account

## Preparação no Mac

1. Instale o **Xcode completo** pela App Store do Mac. As Command Line Tools sozinhas não bastam.
2. Abra o Xcode e conclua a configuração inicial. Aceites de termos e autenticação devem ser feitos pelo proprietário da conta.
3. Em Xcode → Settings → Apple Accounts, entre na sua conta Apple. Use a própria interface da Apple; não envie senha ao chat.
4. Conecte e desbloqueie seu iPhone. Faça os passos de confiança do dispositivo e de modo de desenvolvedor que o Xcode/iPhone solicitarem.
5. Na pasta do projeto, execute `npm run app:ios:prepare`. O script usa o Xcode apenas para este processo, sem mudar a seleção global de ferramentas do Mac.
6. Abra o projeto gerado dentro de `src-tauri/gen/apple` no Xcode. No target do app, em Signing & Capabilities, deixe o gerenciamento de assinatura automático e selecione seu **Personal Team**.
7. Se a Apple informar que o identificador está indisponível, use um identificador pessoal único no projeto e na configuração Tauri correspondente; não altere o identificador dos pacotes desktop existentes.
8. Escolha seu iPhone como destino e execute Run. Autorize o desenvolvedor no aparelho se o iOS pedir.

A instalação exige o Mac, o iPhone conectado/pareado e a conta Apple no Xcode; não é possível completar essas etapas só com o artefato de simulador do GitHub. Não inscreva a conta no programa pago se sua intenção é apenas testar com Personal Team.

## Uso e atualização

A central do app se conecta ao mesmo endereço e banco do site. Melhorias do painel aparecem online ao abrir; não há cópia separada dos registros. A assinatura gratuita do pacote nativo precisa ser renovada pelo Xcode após expirar, mesmo que o painel continue atualizado.

Para uso diário sem renovar a assinatura, a opção já disponível é Safari → Compartilhar → Adicionar à Tela de Início → Abrir como App.

## Lojas alternativas no Brasil

Lojas alternativas são um canal diferente da instalação de desenvolvimento. A Apple passou a permitir essa distribuição no Brasil em iPhones elegíveis, a partir do iOS 26.5; as condições regionais e o processo de autenticação/distribuição ainda se aplicam. Isso não transforma qualquer IPA do GitHub em um arquivo livremente instalável.

Fontes:
- https://support.apple.com/pt-br/117767
- https://developer.apple.com/br/support/app-distribution-in-brazil
