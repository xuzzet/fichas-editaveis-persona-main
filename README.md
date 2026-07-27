# ✦ FICHA AUTOMATIZADA — PERSONA

<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║   " Tu és eu… Eu sou tu. Do oceano da tua alma, emergirei. " ║
╚═══════════════════════════════════════════════════════════╝
```

**Ficha de personagem digital, interativa e reativa para o sistema de RPG Persona.**
HTML5 · CSS3 · JavaScript puro — **sem servidor, sem framework, sem build.**
Abra o `index.html` e roube o coração da sua próxima sessão.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![ES Modules](https://img.shields.io/badge/ES%20Modules-Native-brightgreen?style=flat-square)](#)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](#-qualidade--testes)
[![No Build](https://img.shields.io/badge/Build%20Step-ZERO-e60012?style=flat-square)](#)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-Uso%20Pessoal-blue?style=flat-square)](#-licença)

</div>

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arsenal — Funcionalidades](#arsenal--funcionalidades)
- [Atalhos de Teclado](#atalhos-de-teclado)
- [Primeiros Passos](#primeiros-passos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Sistema de Atributos](#sistema-de-atributos)
- [Sistema de Inventário](#sistema-de-inventário)
- [Perfis de Personagem](#perfis-de-personagem)
- [Estilo Visual & UX](#estilo-visual--ux)
- [Temas Visuais](#temas-visuais)
- [Arquitetura Técnica](#arquitetura-técnica)
- [Persistência de Dados](#persistência-de-dados)
- [Qualidade & Testes](#qualidade--testes)
- [Tecnologias](#tecnologias)
- [FAQ](#faq)
- [Licença](#licença)

---

## Visão Geral

> **TRANSMISSÃO DOS LADRÕES FANTASMA**
> Esqueça o papel amassado e a planilha sem alma. Esta é uma ficha viva.

Uma ficha de personagem completa para o sistema de RPG **Persona**, projetada para rodar **inteiramente no navegador** — sem instalação, servidor ou dependências externas. O objetivo é uma experiência fluida durante as sessões, sem fricção.

A aplicação gira em torno de um **estado centralizado e reativo**: qualquer alteração — subir VIT, ativar um feito, equipar um item — se propaga **na hora** por todos os sistemas dependentes (HP, PM, capacidade de carga, badges de status, painel de Resumo Automático).

O código é organizado em **módulos ES nativos** de responsabilidade isolada, sem dependências circulares e sem nenhuma ferramenta de build.

**Destaques:**

- ★ Abre direto no navegador — um duplo-clique em `index.html`.
- ★ Cálculos automáticos de HP, PM, movimento e capacidade de carga.
- ★ Feitos, condições e modificadores globais com efeitos mecânicos reais.
- ★ **Múltiplos perfis** de personagem (até 6) com troca instantânea.
- ★ **Desfazer / Refazer** e **Backup de segurança** anti-acidente.
- ★ **Rolador de dados** integrado (1d20 + atributo) com histórico.
- ★ Auto-save inteligente com debounce, `MutationObserver` e proteção no fechamento.
- ★ Exportar/Importar JSON, **backup completo**, preencher PDF e capturar PNG.
- ★ 9 temas visuais + escolha de **cenário de fundo**, com troca instantânea e persistência.
- ★ Painel de **Configurações** (engrenagem): perfis, tema, cenário, acessibilidade e ações.
- ★ **PWA instalável** e funcional offline via Service Worker.
- ★ Camada estética **estilo Persona 5** e layout responsivo em duas colunas.
- ★ Retrocompatível — saves antigos são migrados automaticamente.

---

## Arsenal — Funcionalidades

### As 5 Abas

| Aba | O que guarda |
|---|---|
| **Jogo** | Painel principal: identidade, recursos vitais (PV/PM/RD com barras), atributos de combate com sliders, habilidades sociais com sistema de tiers, equipamento ativo, status & aspectos, **rolador de dados**, **Resumo Automático** e a central de **Ações**. |
| **Persona** | Identidade da Persona (nome, Arcana, nível), tabela de **afinidades elementais** (10 elementos × 6 relações) com ícones, grid de **magias & técnicas** com filtros por nome/categoria/elemento, e a árvore de **Despertar / Trama**. |
| **Inventário** | Gerência completa de itens com separação **Equipados / Mochila** em cards. Cada card mostra nome, peso, quantidade, total calculado e notas. Barra de carga com estados Normal / Pesado / Sobrecarregado. |
| **Estado & Vínculos** | **Modificadores** globais (flat ou percentual) sobre qualquer atributo, com toggle ativo/inativo e resumo; **condições de status** pré-definidas com descrição mecânica; e o painel de **Social Links / Confidentes** com pips de rank, filtros, ordenação e benefícios mecânicos. |
| **Crônica** | **Retrato** com modal de zoom, histórico narrativo detalhado, **Diário / Objetivos**, **Pistas & Âncoras** e **Contatos & Locais** em cards com status colorido. |

### Recursos Transversais

| Recurso | Detalhes |
|---|---|
| **Resumo Automático** | Painel dinâmico com atributos finais (base + modificadores), movimento calculado, bônus de feitos, tiers sociais desbloqueados e alertas de condições ativas. |
| **Rolador de Dados** | Clique no **nome** de um atributo ou habilidade social para rolar **1d20 + valor final**. Botão dedicado para **dano de arma**. Histórico de rolagens com críticos destacados. |
| **Desfazer / Refazer** | Pilha de histórico em memória — reverta a última alteração com um clique ou `Ctrl+Z` / `Ctrl+Y`. |
| **Auto-save** | Debounce de 500 ms em `input`/`change`. `MutationObserver` monitora tabelas dinâmicas. `beforeunload` garante o save ao fechar. Indicador "Salvando…" → "Salvo ✔". |
| **Exportar / Importar JSON** | Serialização completa da ficha ativa (retrato, feitos, condições, inventário, vínculos, rolagens…). |
| **Exportar / Importar Tudo** | **Backup completo** de todos os perfis em um único arquivo. |
| **Restaurar Backup** | Recupera o último estado válido salvo automaticamente **antes** de resetar ou importar. |
| **Preencher PDF** | Carrega um PDF modelo e preenche os campos via `pdf-lib`. |
| **Exportar PNG** | Captura visual da ficha via `html2canvas`. |
| **Bibliotecas sob demanda** | `pdf-lib` e `html2canvas` são **locais** (`js/vendor/`) e carregadas só quando usadas — evita baixar ~700 KB no load inicial. |
| **Painel de Configurações** | Engrenagem no topo abre um painel com Perfis, Tema, **Cenário**, Acessibilidade (modo dislexia + daltonismo) e Ações. |
| **Cenário / Plano de fundo** | Escolha entre 5 imagens de ambientação urbana ou desative o fundo — persistido no `localStorage`. |
| **PWA / Offline** | Instalável como app (`manifest.json`) e funciona offline via Service Worker (`sw.js`, cache-first). |
| **API de Debug** | `window.state`, `window.getState()`, `window.setState()`, `window.autoSave()`, `window.recalcAndRender()` no console. |

---

## Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl` + `Z` | Desfazer última alteração |
| `Ctrl` + `Y` · `Ctrl` + `Shift` + `Z` | Refazer alteração |
| `Alt` + `1` … `5` | Ir direto para a aba 1–5 |
| `←` / `→` | Navegar entre as abas quando o foco está na barra de navegação |

---

## Primeiros Passos

### Pré-requisitos

- Navegador moderno com suporte a ES Modules (Chrome 61+, Firefox 60+, Edge 16+, Safari 11+).
- Para desenvolvimento/testes: **Node.js 18+** (opcional — a ficha em si não precisa).

### Instalação

```bash
git clone https://github.com/xuzzet/fichas-editaveis-persona-main.git
cd fichas-editaveis-persona-main
```

### Execução

```bash
# Abrir diretamente no navegador
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux

# Ou usar um servidor local (recomendado)
python -m http.server 8080
# → http://localhost:8080
```

> **VS Code:** instale a extensão **Live Server** e clique em "Go Live" para recarregamento automático.

---

## Estrutura do Projeto

```
fichas-editaveis-persona-main/
│
├── index.html                  # Estrutura da aplicação — 5 abas, formulários, cards, modais
├── manifest.json               # Manifesto PWA (nome, ícones, cores, instalação)
├── sw.js                       # Service Worker — cache offline (cache-first)
├── package.json                # Scripts de dev (test/lint/format) — a ficha roda sem ele
│
├── Elements/                   # Ícones PNG dos elementos e imagens de fundo
│
├── css/                        # Módulos CSS (orquestrados por css/main.css)
│   ├── main.css                #   @import de todos os módulos, na ordem correta
│   ├── variables.css           #   Custom properties globais (:root)
│   ├── reset.css · base.css    #   Reset, html/body, wrap, tooltip, toast
│   ├── layout.css              #   hud, grid, row*, stat, view
│   ├── components.css          #   card, section-title, badge, panel, botões
│   ├── cards.css · forms.css   #   Cards e formulários (inputs, sliders)
│   ├── tabs.css                #   Menu de navegação por abas
│   ├── themes.css              #   9 temas de cor (classes no body)
│   ├── social-skills.css       #   Habilidades sociais e tiers
│   ├── spells.css              #   Cards de magias & técnicas + filtros
│   ├── feats.css               #   Lista de feitos
│   ├── inventory.css           #   Barra de carga, cards de item
│   ├── modifiers.css           #   Cards de modificadores
│   ├── conditions.css          #   Condições de status
│   ├── links.css               #   Vínculos: pips de rank, filtros, resumo
│   ├── notes.css               #   Diário/Objetivos, pistas, contatos
│   ├── persona.css             #   Afinidades, Resumo Automático
│   ├── awakening-cards.css     #   Cards de despertar
│   ├── awakening-tree.css      #   Árvore de Despertar / Trama
│   ├── dice.css                #   Rolador de dados e histórico
│   ├── lore.css                #   Retrato e histórico narrativo
│   ├── profiles.css            #   Barra de perfil, menu e modais
│   ├── quick-access.css        #   Ajustes da aba Jogo
│   ├── background.css          #   Cenário de fundo (cidade)
│   ├── animations.css          #   Animações e keyframes
│   ├── responsive.css          #   @media mobile, touch e print
│   ├── redesign.css            #   Refino visual global
│   ├── a11y.css                #   Acessibilidade (foco, contraste, aria)
│   ├── visual-polish.css       #   Polimento estético (texturas, barras PV/PM)
│   ├── layout-enhancements.css #   Abas fixas + layout 2 colunas (desktop)
│   ├── p5-style.css            #   Camada estética estilo Persona 5 Royal
│   └── mobile/                 #   Ajustes finos para telas pequenas
│       ├── navigation-mobile.css · ficha-mobile.css
│       └── cards-mobile.css · persona-mobile.css
│
└── js/                         # Módulos ES nativos (arquitetura modular por pastas)
    ├── app.js                  #   Bootstrap — initApp, eventos, auto-save, atalhos, API global
    ├── app/                    #   Núcleo da app (extraído de app.js)
    │   ├── core.js             #     renderAll, setState, getState
    │   ├── profile-flows.js    #     Fluxos de reset/troca/CRUD de perfis
    │   └── portrait.js         #     Upload e modal do retrato
    ├── constants.js            #   Dados estáticos: arcanas, elementos, feitos, condições, social
    ├── data/                   #   Dados de conteúdo
    │   └── awakening-data.js   #     Mapa de arcanas, vertentes e tiers do Despertar
    ├── utils.js                #   Utilitários: $, $$, clampInt, debounce
    ├── state.js                #   Estado centralizado e conjuntos de field IDs
    ├── calculations.js         #   Cálculos puros: HP, PM, modificadores, feitos, social, condições
    ├── ui.js                   #   Barrel de UI + render() (orquestrador)
    ├── ui/                     #   Submódulos de UI
    │   ├── dom-cache.js        #     Cache de elementos DOM (ids)
    │   ├── fields.js           #     render de campos e badges
    │   ├── auto-summary.js     #     Painel de Resumo Automático
    │   ├── affinities.js       #     Afinidades elementais e arcanos
    │   ├── portrait-bg.js      #     Render de retrato, background e lore
    │   ├── toast.js            #     Notificações toast
    │   └── textareas.js        #     Auto-resize de textareas
    ├── social-skills.js        #   Barrel das habilidades sociais
    ├── social/                 #   Submódulos das habilidades sociais
    │   ├── hexagram.js         #     Geometria e animação do hexagrama
    │   ├── render.js           #     renderSocial
    │   └── build.js            #     Construção do SVG do hexagrama
    ├── inventory.js            #   Barrel do inventário + renderTables/initInventoryButtons
    ├── inventory/              #   Submódulos por domínio
    │   ├── items.js            #     Itens, peso e capacidade de carga
    │   ├── spells.js           #     Magias & técnicas + filtros
    │   ├── links.js            #     Social Links / Confidentes
    │   ├── clues.js            #     Pistas & Âncoras
    │   └── contacts.js         #     Contatos & Locais
    ├── dice.js                 #   Barrel do rolador de dados
    ├── dice/                   #   Submódulos do rolador
    │   ├── engine.js           #     Motor puro: rolagens, fórmulas, stats
    │   └── ui.js               #     Histórico, ações e interface do rolador
    ├── feats.js                #   UI, render e sync dos feitos
    ├── conditions.js           #   UI, render e sync das condições
    ├── modifiers.js            #   UI, render e resumo dos modificadores
    ├── awakening.js            #   Árvore de Despertar / Trama
    ├── profiles.js             #   Sistema de perfis (até 6) e persistência
    ├── profiles-ui.js          #   Barra de perfil, menus e modais
    ├── storage.js              #   snapshot() / applySnapshot() — serialização
    ├── backup.js               #   Backup de segurança antes de ações destrutivas
    ├── history.js              #   Pilha de Desfazer / Refazer
    ├── themes.js               #   themeMap, applyTheme, initTheme
    ├── background.js           #   Seletor de cenário de fundo (initBackground)
    ├── settings.js             #   Painel de Configurações (engrenagem)
    ├── accessibility.js        #   Modo dislexia e filtros de daltonismo
    ├── tabs.js                 #   Navegação entre abas + atalhos de teclado
    ├── import-export.js        #   Exportar/importar JSON, backup total, PDF, PNG
    ├── vendor-loader.js        #   Carregamento sob demanda de pdf-lib / html2canvas
    ├── visual-enhancements.js  #   Barras de PV/PM e realces visuais
    └── vendor/                 #   pdf-lib e html2canvas (locais)
```

### Grafo de Dependências (núcleo)

```
constants.js  ─────────────────────────────► (nenhuma)
utils.js      ─────────────────────────────► (nenhuma)
state.js      ─────────────────────────────► (nenhuma)
themes.js     ─────────────────────────────► (nenhuma)
calculations.js ───────────────────────────► state, constants, utils
ui.js         ─────────────────────────────► state, constants, calculations, social-skills, inventory
storage.js    ─────────────────────────────► state, calculations, inventory, feats, conditions, modifiers, ui
profiles.js   ─────────────────────────────► storage
history.js    ─────────────────────────────► (injeção via initHistory)
import-export.js ──────────────────────────► state, storage, profiles, vendor-loader, ui
app.js        ─────────────────────────────► todos os módulos acima
```

Sem dependências circulares — funções de render são passadas por injeção quando necessário.

> **Arquitetura modular:** os módulos maiores foram divididos por responsabilidade em subpastas (`js/ui/`, `js/inventory/`, `js/dice/`, `js/social/`, `js/app/`, `js/data/`). O arquivo homônimo (ex.: `js/ui.js`) atua como *barrel*, re-exportando a API pública — os importadores continuam usando `./ui.js` sem alterações.

---

## Sistema de Atributos

### Atributos de Combate

Distribuição de **18 pontos** entre 6 atributos (mínimo 1, máximo 12):

| Sigla | Atributo | Uso principal |
|---|---|---|
| **STR** | Força | Dano físico, capacidade de carga |
| **MAG** | Magia | Dano mágico, PM máximo |
| **TEC** | Técnica | Precisão, alcance, crítico |
| **AGI** | Agilidade | Esquiva, iniciativa, movimento |
| **VIT** | Vitalidade | HP máximo, resistência física, carga |
| **LCK** | Sorte | Críticos, cargas de sorte |

**Fórmulas derivadas:**

| Stat derivado | Fórmula |
|---|---|
| HP Máximo | `25 + ((5 + VIT) × Nível)` |
| PM Máximo | `15 + ((MAG + 5) × 2) + ((Nível − 1) × 5)` |
| Capacidade de Carga | `(STR × 5) + VIT` |
| Movimento | `AGI + 3` metros (dobra com Prodígio em Corrida, cai à metade com Lento) |

### Habilidades Sociais

Distribuição de **7 pontos iniciais** entre 6 habilidades. Um novo tier a cada 5 pontos:

| Habilidade | Tiers (I → V) |
|---|---|
| **Conhecimento** | Ciente → Sabido → Estudado → Enciclopédico → Erudito |
| **Disciplina** | Decente → Persistente → Minucioso → Magistral → Transcendente |
| **Empatia** | Inofensivo → Gentil → Generoso → Altruísta → Angelical |
| **Expressão** | Rudimentar → Eloquente → Inspirador → Tocante → Fascinante |
| **Coragem** | Comum → Determinado → Firme → Destemido → Fodão |
| **Charme** | Existente → Confiante → Suave → Popular → Debonair |

Cada tier aplica bônus de atributo automaticamente (ex.: Conhecimento III → +1 TEC) e desbloqueia habilidades exibidas no Resumo Automático.

### Arcanas Suportadas

O Louco · O Mago · A Sacerdotisa · A Imperatriz · O Imperador · O Hierofante · Os Enamorados · A Carruagem · A Força · O Eremita · A Roda da Fortuna · A Justiça · O Enforcado · A Morte · A Temperança · O Diabo · A Torre · A Estrela · A Lua · O Sol · O Julgamento · O Mundo

---

## Sistema de Inventário

Cada item possui **nome**, **peso** (kg), **quantidade** e **efeito/notas**, distribuído entre duas seções:

| Seção | Descrição |
|---|---|
| **Equipados** | Itens em uso ativo — contam para o peso total |
| **Mochila** | Itens carregados mas não equipados — contam para o peso total |

### Capacidade e Estados de Carga

```
Capacidade Máxima = (STR × 5) + VIT    (com modificadores aplicados)
Peso Total        = Σ (peso × quantidade) de todos os itens
```

| Estado | Condição | Feedback |
|---|---|---|
| **Normal** | Peso < 80% da capacidade | Barra azul/cyan |
| **Pesado** | Peso ≥ 80% da capacidade | Barra amarela |
| **Sobrecarregado** | Peso > capacidade | Barra vermelha pulsante + aviso |

**Retrocompatibilidade:** saves no formato legado `{tipo, nome, efeito}` são migrados automaticamente — "Arma", "Armadura" e "Acessório" vão para Equipados; o resto para a Mochila (peso inicia em 0).

---

## Perfis de Personagem

Gerencie **até 6 personagens** no mesmo navegador, sem sobrescrever um ao outro.

| Recurso | Descrição |
|---|---|
| **Barra de Perfil** | Fica acima da ficha, mostra o perfil atual e abre o menu de troca. |
| **Trocar Perfil** | Alterna instantaneamente; a ficha ativa é salva antes de trocar. |
| **Criar / Gerenciar** | Modais para criar, renomear e excluir perfis. |
| **Backup Completo** | "Exportar Tudo" salva todos os perfis; "Importar Tudo" restaura o conjunto. |

Os perfis ficam no `localStorage` sob a chave `personaProfiles`.

---

## Estilo Visual & UX

Camada puramente estética e de layout — **aditiva**, sem tocar em lógica, cálculos ou estados.

- **Estilo Persona 5 Royal** (`p5-style.css`): títulos de seção como "legendas" inclinadas em itálico, textura halftone sutil no fundo, **entrada cinética dos cards** ao trocar de aba, **estrela de seleção** na aba ativa e hover com leve inclinação.
- **Layout adaptável** (`layout-enhancements.css`): **navegação fixa** (sticky) ao rolar e **duas colunas** na aba Jogo em telas largas — com colapso inteligente dos campos.
- **Barras de PV/PM** (`visual-enhancements.js`): preenchimento animado, com alerta visual quando o PV fica baixo.
- **Acessibilidade** (`a11y.css` + `accessibility.js`): **modo dislexia** (fonte legível, mais espaçamento), filtros de **daltonismo** (protanopia/deuteranopia/tritanopia), estados de foco visíveis, `role`/`aria` na navegação e nas abas, navegação por setas.
- **Movimento responsável:** tudo respeita `prefers-reduced-motion` e a exportação PNG permanece limpa (texturas ficam fora da captura).

> Cores saem sempre das **variáveis do tema** — o estilo P5R se adapta ao tema selecionado, sem paleta fixa.

---

## Temas Visuais

9 temas com troca instantânea via seletor no **painel de Configurações** (engrenagem no topo); a escolha é persistida no `localStorage`.

| Tema | Paleta |
|---|---|
| **Padrão** | Azul escuro com destaques cyan |
| **Roxo** | Roxo profundo com accent lilás |
| **Claro** | Fundo claro, modo diurno |
| **Vermelho** | Escuro com vermelho intenso |
| **Verde** | Esverdeado com accent esmeralda |
| **Corinthians** | Preto e vermelho |
| **Rosa Pastel** | Tons suaves de rosa e lilás |
| **Kamen Rider** | Preto e verde neon |
| **Amarelo** | Dourado e âmbar |

Todos via CSS custom properties (`--bg`, `--bg-2`, `--accent`, `--ink`, …). Para um novo tema: adicione a classe em `css/themes.css` e registre o mapeamento em `js/themes.js` (`themeMap`).

### Cenário de Fundo

O painel de Configurações também permite trocar a **imagem de ambientação** (camada `body::before`): 5 cenários urbanos ou **Nenhum** para um fundo limpo do tema. A escolha é aplicada por classe no `<body>` e persistida no `localStorage` (`ficha-background`). Definida em `css/background.css` e `js/background.js`.

---

## Arquitetura Técnica

### Fluxo de Dados

```
Evento DOM (input / change / click)
  │
  ▼
setState(partial, options?)
  │
  ├─ merge parcial em state
  ├─ recalcState()     → HP/PM máximos, badges, capacidade de carga
  ├─ validateState()   → clamp HP/PM (≥ 0, ≤ máximo)
  ├─ render()          → campos, badges, social, inventário, resumo
  │
  ├─ recordHistory()   → pilha de Desfazer/Refazer
  └─ debouncedAutoSave() → localStorage (debounce 500 ms)
```

### API Principal

| Função | Responsabilidade |
|---|---|
| `state` | Objeto único e mutável com todos os dados da ficha |
| `setState(partial, opts)` | Merge parcial → recalc → render → auto-save |
| `getState()` | Cópia profunda do estado |
| `renderAll()` | Render completo: tabelas, feitos, condições, afinidades, retrato, lore |
| `render()` | Render rápido: campos, badges, social, inventário, resumo |
| `recalcState()` | Calcula HP/PM máximos e `state._computed` |
| `validateState()` | Garante limites válidos (HP/PM ≥ 0 e ≤ máximo) |
| `snapshot()` | Serializa `state` para JSON (retrocompatível) |
| `applySnapshot(data)` | Restaura JSON → `state` → `recalcState()` → `renderAll()` |

### Sistema de Modificadores

Aplicados em duas passagens: **Flat** (`+N` ao valor base) primeiro, depois **Percentual** (`+N%` sobre o resultado). Fontes combinadas em `recalcState()`:

- Modificadores manuais do jogador (`state.modifiers`)
- Bônus automáticos de feitos ativos (`computeFeitoModifiers()`)
- Bônus automáticos de tiers sociais (`computeSocialModifiers()`)

---

## Persistência de Dados

| Chave / Mecanismo | Descrição |
|---|---|
| `ficha-yby-p3r-skin` | Ficha ativa (armazenamento principal). |
| `personaProfiles` | Todos os perfis de personagem (até 6). |
| `personaSafetyBackup` | Último estado válido antes de resetar/importar. |
| `ficha-theme` | Tema visual selecionado. |
| `ficha-background` | Cenário de fundo selecionado. |
| **Auto-save** | Debounce 500 ms, `MutationObserver` em tabelas, `beforeunload`. |
| **Exportar/Importar JSON** | Backup externo da ficha ativa (migração de formato legado incluída). |
| **Exportar/Importar Tudo** | Backup completo de todos os perfis. |
| **Preencher PDF** | Campos de um PDF modelo via `pdf-lib`. |
| **Exportar PNG** | Captura visual via `html2canvas`. |

### Formato do Snapshot (resumido)

```json
{
  "id": "ficha-yby-p3r-skin",
  "acessoRapido": { "CharClass": "...", "CharLvl": 1, "CharSTR": 3 },
  "persona":      { "PerName": "...", "PerArcana": "...", "PerLvl": 1 },
  "affinities":   { "Físico": "Normal", "Fogo": "Fraco" },
  "spells":       [ { "nome": "...", "tipo": "Fogo", "custo": "8 PM", "efeito": "..." } ],
  "feitos":       [ { "id": "atleta", "ativo": true } ],
  "equip":        [ { "nome": "...", "peso": 1.5, "qtd": 1, "local": "equipado" } ],
  "links":        [ { "nome": "...", "arcana": "O Mago", "rank": 3, "status": "Ativo" } ],
  "notes":        { "diary": "...", "goals": "...", "clues": [], "contacts": [] },
  "conditions":   [ { "id": "lento", "ativa": true } ],
  "modifiers":    [ { "nome": "Buff STR", "tipo": "flat", "valor": 2, "alvo": "STR", "ativo": true } ],
  "portrait":     { "src": "data:image/..." },
  "background":   { "bgOrigem": "..." },
  "rollHistory":  [],
  "personaAwakenings": []
}
```

---

## Qualidade & Testes

Ferramentas de desenvolvimento opcionais (a ficha roda sem elas). Requerem Node.js.

```bash
npm install          # instala devDependencies
npm test             # roda a suíte de testes (vitest run)
npm run test:watch   # testes em modo watch
npm run lint         # análise estática (eslint js)
npm run format       # formatação (prettier)
npm run format:check # verifica formatação sem alterar
```

| Camada | Ferramenta |
|---|---|
| **Testes unitários** | [Vitest](https://vitest.dev/) — cálculos puros e utilitários em `tests/` |
| **Lint** | ESLint |
| **Formatação** | Prettier |
| **Integração Contínua** | GitHub Actions (`.github/workflows/ci.yml`) — instala, testa e faz lint a cada push |

Os testes cobrem funções **puras** (cálculo de HP/PM, tiers sociais, utilitários) — sem dependência de DOM.

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **HTML5** | — | Estrutura semântica da aplicação |
| **CSS3** | — | Arquitetura modular (`/css/`), custom properties para temas, responsividade, animações |
| **JavaScript** | ES Modules (nativo) | Estado, cálculos, renderização, persistência |
| [**pdf-lib**](https://pdf-lib.js.org/) | 1.17.1 | Preenchimento de PDF (local, sob demanda) |
| [**html2canvas**](https://html2canvas.hertzen.com/) | 1.4.1 | Captura em PNG (local, sob demanda) |
| [**Vitest**](https://vitest.dev/) | ^2.1 | Testes unitários (dev) |
| **ESLint / Prettier** | ^8.57 / ^3.3 | Lint e formatação (dev) |
| **Google Fonts** | — | Barlow Condensed, Inter, Noto Sans JP |

---

## FAQ

**A ficha funciona offline?**
Sim. É um **PWA**: um Service Worker (`sw.js`) faz cache dos assets (estratégia cache-first) e o `manifest.json` permite instalá-la como app. Toda a lógica é local; apenas as fontes do Google exigem conexão na primeira carga. `pdf-lib` e `html2canvas` são locais.

**Posso usar em celular ou tablet?**
Sim. Layout responsivo, alvos de toque de 44 px e `font-size` 16 px nos inputs para evitar zoom automático no iOS.

**Meus dados ficam seguros?**
Ficam **só** no `localStorage` do seu navegador — nunca são enviados a nenhum servidor. Exporte backups em JSON regularmente, pois limpar os dados do navegador apaga as fichas.

**Perdi algo ao resetar/importar. E agora?**
Use **Restaurar Backup**: o último estado válido é salvo automaticamente antes de qualquer ação destrutiva.

**O que acontece ao importar uma ficha antiga?**
É migrada automaticamente — itens legados recebem peso 0 e vão para a seção correta (Equipados/Mochila).

**Como criar um novo tema?**
Adicione `.theme-nomedotema` em `css/themes.css` com as custom properties (`--bg`, `--bg-2`, `--bg-3`, `--stroke`, `--accent`, `--accent-2`, `--ink`, `--ink-dim`, `--danger`, `--ok`) e registre o mapeamento em `js/themes.js` (`themeMap`).

---

## Licença

Projeto de **uso pessoal** e livre para fins **não comerciais**, criado para comunidades de RPG de mesa. Para outros usos, entre em contato com o proprietário do repositório.

<div align="center">

```
─────────────────────  ★  ─────────────────────
  " Take Your Heart. "  —  Phantom Thieves
─────────────────────  ★  ─────────────────────
```

</div>
