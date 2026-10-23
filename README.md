# Bautismo de Walter · 01·11·2026

Site do batizado do Walter Möller Schilling, em espanhol e português, com a confirmação de presença gravada numa Planilha Google no Drive.

- **Missa e Batismo:** domingo, 1º de novembro de 2026, 10h30, Parroquia de las Mercedes (Assunção)
- **Almoço e festa:** almoço às 12h30 e café da tarde até as 18h, no Izara Barrio Privado
- **Prazo para confirmar:** quinta-feira, 29 de outubro

O site é estático (HTML, CSS e JavaScript, sem build), feito para o GitHub Pages. Ele abre no idioma do celular do convidado; o link com `?lang=pt` força o português e `?lang=es` força o espanhol.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `index.html` | Página completa, com os textos em espanhol |
| `assets/js/i18n.js` | Todos os textos em português e as mensagens do formulário nos dois idiomas |
| `config.js` | **O único arquivo que vocês precisam editar:** URL da planilha, nomes dos pratos, prazo |
| `assets/css/site.css` | Estilos |
| `assets/js/site.js` | Renda do convite, animações, agenda e formulário |
| `assets/img/` | Fotos otimizadas (sem dados de GPS), aquarela do anjo, imagem de compartilhamento `og.jpg` |
| `assets/fonts/` | Cormorant Garamond e Pinyon Script, hospedadas no próprio site |
| `apps-script/Code.gs` | Script que recebe as confirmações e grava na planilha |

## 1. Ligar a confirmação à planilha no Drive (uns 5 minutos)

1. No Google Drive, crie uma **Planilha Google** em branco, por exemplo “Bautismo Walter – Confirmaciones”.
2. Na planilha, abra **Extensões › Apps Script**. Apague o código que aparecer, cole todo o conteúdo de `apps-script/Code.gs` e salve.
3. No menu de funções, escolha **configurar** e clique em **Executar**. O Google pede autorização: entre com a sua conta, clique em “Avançado” e em “Acessar (não seguro)”, que é o aviso padrão para scripts próprios. Ao voltar à planilha, ela terá as abas **Resumen**, **Respuestas** e **Invitados**.
4. Clique em **Implantar › Nova implantação**, engrenagem › **App da Web**, com:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a **URL do app da Web** (termina em `/exec`) e cole em `config.js`, no campo `endpoint`.
6. Faça o commit. Envie uma confirmação de teste pelo site e confira se ela aparece na planilha; depois apague essa linha de teste.

Enquanto `endpoint` estiver vazio, o formulário funciona em **modo de teste**: mostra o agradecimento, avisa que nada foi gravado e não envia nada.

**Como a planilha se organiza:** cada envio vira uma linha em *Respuestas* e uma linha por pessoa em *Invitados* (com o prato de cada uma). Se a mesma família responder de novo, com o mesmo WhatsApp ou, sem WhatsApp, com o mesmo nome, as linhas anteriores ficam marcadas como `reemplazada` e o *Resumen* conta só a resposta mais recente. O *Resumen* traz famílias que vêm e que não vêm, total de pessoas, adultos, crianças, quantos vão à missa e à festa e a contagem de cada prato.

Se mudar o código do script depois, use **Implantar › Gerenciar implantações › editar › Nova versão**, para manter a mesma URL.

## 2. O cardápio

O almoço segue a proposta do bufê para o dia: entrada de cremoso de coliflor, seis pratos principais (dois de cordeiro, dois de surubim e duas massas) e o café da tarde das 14h às 18h. Ao confirmar, cada pessoa escolhe um prato principal numa lista agrupada por tipo, e a escolha vai para a aba *Invitados*; o *Resumen* soma quantos pratos de cada um foram pedidos, que é o número a passar ao bufê 72 horas antes.

O texto do cardápio exibido na página fica no `index.html` (espanhol) e no `assets/js/i18n.js` (português). As opções do formulário ficam em `config.js`, na lista `platos`: para tirar um prato da escolha, basta apagar a linha dele ali.

## 3. Publicar no GitHub Pages (pelo navegador, sem instalar nada)

1. Extraia o `batizado-walter.zip` numa pasta do computador (no Windows: botão direito › *Extrair tudo*).
2. Em github.com, já logado como `lucasmoller9646`, clique no **+** do canto superior direito › **New repository**. Nome: `batizado-walter`. Visibilidade: **Public** (no plano gratuito o Pages só publica repositórios públicos). Não marque README, .gitignore nem licença. Clique em **Create repository**.
3. Na página do repositório vazio, clique no link **uploading an existing file**.
4. Abra a pasta extraída, selecione **tudo o que está dentro dela** (não a pasta em si): `index.html`, `config.js`, `README.md`, `robots.txt`, `.nojekyll`, `assets` e `apps-script`, e arraste para a área de upload. Espere todos os arquivos aparecerem na lista.
5. Embaixo, em *Commit changes*, escreva algo como “Site do batizado” e clique em **Commit changes**.
6. Confira que o `index.html` aparece na raiz do repositório, ao lado das pastas `assets` e `apps-script`. Se aparecer dentro de outra pasta, apague e refaça o passo 4 arrastando o conteúdo, não a pasta.
7. Vá em **Settings › Pages**. Em *Build and deployment*, *Source*: **Deploy from a branch**; *Branch*: **main** e pasta **/ (root)**. Clique em **Save**.
8. Espere um ou dois minutos (o andamento aparece na aba **Actions**) e recarregue a página de Settings › Pages, que vai mostrar *Your site is live at* **https://lucasmoller9646.github.io/batizado-walter/**.
9. Abra o endereço no celular e confira os dois idiomas (`?lang=pt` força o português).

**Para mudar algo depois:** abra o arquivo no GitHub, clique no lápis (*Edit this file*), altere e clique em **Commit changes**; o site se atualiza em um ou dois minutos. É assim que se cola a URL da planilha no `config.js` (passo 5 da seção 1). Para trocar uma foto, use **Add file › Upload files** na pasta `assets/img` com o mesmo nome de arquivo.

O WhatsApp guarda a prévia do link por um tempo; se o link já tiver sido enviado antes de o site estar no ar, a imagem pode demorar a aparecer.

## Privacidade

A página tem `noindex` e o `robots.txt` bloqueia buscadores, então ela não aparece no Google; só entra quem tiver o link. As fotos foram reprocessadas sem metadados (inclusive localização). Num repositório público, porém, qualquer pessoa com o endereço do repositório consegue ver os arquivos.
