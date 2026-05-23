# Ficha Automatizada — Persona

<div align="center">

**Ficha de personagem digital, interativa e reativa para o sistema de RPG Persona.**  
Construída com HTML5, CSS3 e JavaScript puro — sem dependências de servidor, frameworks ou build steps.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![ES Modules](https://img.shields.io/badge/ES%20Modules-Native-brightgreen?style=flat-square)](#)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-Uso%20Pessoal-blue?style=flat-square)](#-licença)

</div>

---

## Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Primeiros Passos](#-primeiros-passos)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Sistema de Atributos](#-sistema-de-atributos)
- [Sistema de Inventário](#-sistema-de-inventário)
- [Temas Visuais](#-temas-visuais)
- [Arquitetura Técnica](#-arquitetura-técnica)
- [Persistência de Dados](#-persistência-de-dados)
- [Tecnologias](#-tecnologias)
- [FAQ](#-faq)
- [Licença](#-licença)

---

## Visão Geral

Este projeto é uma ficha de personagem completa para o sistema de RPG **Persona**, desenvolvida para rodar inteiramente no navegador — sem instalação, servidor ou dependências externas. O objetivo é oferecer uma experiência fluida durante as sessões, eliminando fichas em papel ou planilhas estáticas.

A aplicação é baseada em um **estado centralizado e reativo**: qualquer alteração em um atributo — como aumentar VIT ou ativar um feito — propaga-se instantaneamente por todos os sistemas dependentes, incluindo HP, PM, capacidade de carga, badges de status e o painel de resumo automático.

Após uma refatoração completa, o código está organizado em **15 módulos ES nativos** com responsabilidades isoladas, sem dependências circulares e sem nenhum framework ou ferramenta de build.

**Destaques do projeto:**

- Abre direto no navegador — basta um double-click em `index.html`.
- Cálculos automáticos de HP, PM, movimento e capacidade de carga.
- Sistema de feitos, condições e modificadores globais com efeitos mecânicos.
- 9 temas visuais com troca instantânea e persistência automática.
- Auto-save inteligente com debounce, MutationObserver e proteção no fechamento.
- Exportação e importação em JSON, preenchimento de PDF e captura em PNG.
- Retrocompatível — saves criados em versões anteriores são migrados automaticamente.

---

## Funcionalidades

### Abas do Sistema

| Aba | Descrição |
|---|---|
| **Acesso Rápido** | Painel principal: atributos de combate com sliders, HP/PM atual e máximo, habilidades sociais com sistema de tiers, aspectos, equipamento rápido, retrato do personagem e botões de ação. |
| **Persona** | Nome, Arcana e nível da Persona. Tabela de afinidades elementais (10 elementos × 6 relações). Deck de magias e técnicas com tipo elemental, custo, efeito e reordenação por drag (↑↓). |
| **Feitos** | 45+ feitos organizados em categorias (Geral, Social, Combate, Persona, Atributos, Convicção). Cada feito exibe descrição completa, pré-requisitos e aplica seus efeitos automáticos ao ativar. |
| **Inventário** | Gerenciamento completo de itens com separação **Equipados / Mochila**, peso por item, quantidade, cálculo automático de capacidade e barra visual de sobrecarga. |
| **Modificadores** | Buffs e debuffs globais (flat ou percentual) sobre qualquer atributo, com toggle ativo/inativo e resumo visual. 9 condições de status pré-definidas com descrição mecânica detalhada. |
| **Vínculos** | Registro de vínculos de Arcana: NPC, Arcana, rank (1–10) e observações. |
| **Anotações** | Diário de sessão, objetivos, pistas/âncoras com status (Aberta / Em andamento / Resolvida) e registro de contatos/locais. |
| **Lore** | Upload de retrato com modal de zoom. Histórico detalhado do personagem (origem, personalidade, aparência, motivação e 20+ campos narrativos). |

### Recursos Transversais

| Recurso | Detalhes |
|---|---|
| **Resumo Automático** | Painel gerado dinamicamente exibindo atributos finais (base + modificadores), movimento calculado, bônus de feitos e habilidades sociais desbloqueadas e alertas de condições ativas. |
| **Auto-save** | Debounce de 500 ms em qualquer evento `input`/`change`. `MutationObserver` monitora tabelas dinâmicas. `beforeunload` garante o save ao fechar. Indicador visual "Salvando…" → "Salvo ✔". |
| **Exportar / Importar JSON** | Serialização completa da ficha, incluindo retrato, feitos, condições e inventário. |
| **Preencher PDF** | Carrega um PDF modelo e preenche todos os campos via `pdf-lib`. |
| **Exportar PNG** | Captura visual da ficha completa via `html2canvas`. |
| **9 Temas Visuais** | Troca instantânea via dropdown. Paleta baseada em CSS custom properties — fácil de estender. |
| **API de Debug** | `window.state`, `window.setState()`, `window.getState()`, `window.autoSave()` disponíveis no console. |

---

## Primeiros Passos

### Pré-requisitos

- Navegador moderno com suporte a ES Modules (Chrome 61+, Firefox 60+, Edge 16+, Safari 11+).
- Nenhuma instalação, CLI ou ferramenta de build necessária.

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

# Ou usar um servidor local (recomendado para evitar restrições de CORS)
python -m http.server 8080
# → http://localhost:8080
```

> **VS Code:** instale a extensão **Live Server** e clique em "Go Live" para recarregamento automático.

---

## Estrutura do Projeto

```
fichas-editaveis-persona-main/
│
├── index.html                  # Estrutura da aplicação — 8 abas, formulários, tabelas, modais
├── styles.css                  # Estilos globais, 9 temas, responsividade, animações
├── theme-amarelo-fix.css        # Overrides específicos do tema Amarelo
│
└── js/                         # Módulos ES nativos
    ├── app.js                  # Entry point — inicialização, renderAll, setState, auto-save
    ├── constants.js            # Dados estáticos: arcanas, elementos, feitos, condições, social
    ├── utils.js                # Utilitários: $, $$, clampInt, debounce
    ├── state.js                # Estado centralizado e field ID sets
    ├── calculations.js         # Cálculos puros: HP, PM, modificadores, feitos, social, condições
    ├── ui.js                   # Cache DOM, renderFields, renderBadges, afinidades, toast, resumo
    ├── social-skills.js        # Painel HX (radar animado), buildSocialUI, renderSocial
    ├── inventory.js            # Tabelas de inventário, peso, magias, vínculos, pistas, contatos
    ├── feats.js                # buildFeitosUI, renderFeitos, syncFeitosToState
    ├── conditions.js           # buildConditionsUI, renderConditions, syncConditionsToState
    ├── modifiers.js            # buildModifiersUI, renderModifiers, renderModSummary
    ├── storage.js              # snapshot(), applySnapshot() — serialização e restauração
    ├── themes.js               # themeMap, applyTheme, initTheme
    ├── tabs.js                 # initTabs — navegação entre abas
    └── import-export.js        # Exportar/importar JSON, preencher PDF, capturar PNG
```

### Grafo de Dependências

```
constants.js  ──────────────────────────────────────────────► (nenhuma)
utils.js      ──────────────────────────────────────────────► (nenhuma)
state.js      ──────────────────────────────────────────────► (nenhuma)
themes.js     ──────────────────────────────────────────────► (nenhuma)
tabs.js       ──────────────────────────────────────────────► (nenhuma)
calculations.js ────────────────────────────────────────────► state, constants, utils
social-skills.js ───────────────────────────────────────────► state, constants
inventory.js  ──────────────────────────────────────────────► state, constants, utils
ui.js         ──────────────────────────────────────────────► state, constants, calculations,
              │                                                social-skills, inventory
feats.js      ──────────────────────────────────────────────► state, constants, calculations, ui
conditions.js ──────────────────────────────────────────────► state, constants, calculations, ui
modifiers.js  ──────────────────────────────────────────────► state, constants, calculations, ui
storage.js    ──────────────────────────────────────────────► state, calculations, inventory,
              │                                                feats, conditions, modifiers, ui
import-export.js ───────────────────────────────────────────► state, storage, ui
app.js        ──────────────────────────────────────────────► todos os módulos acima
```

Sem dependências circulares. `storage.js` recebe `renderAll` por injeção via `setRenderAll(fn)`.

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
| Movimento | `AGI + 3` metros (dobrado com Prodígio em Corrida, reduzido à metade com Lento) |

### Habilidades Sociais

Distribuição de **7 pontos iniciais** entre 6 habilidades. Tiers desbloqueados a cada 5 pontos:

| Habilidade | Tiers (I → V) |
|---|---|
| **Conhecimento** | Ciente → Sabido → Estudado → Enciclopédico → Erudito |
| **Disciplina** | Decente → Persistente → Minucioso → Magistral → Transcendente |
| **Empatia** | Inofensivo → Gentil → Generoso → Altruísta → Angelical |
| **Expressão** | Rudimentar → Eloquente → Inspirador → Tocante → Fascinante |
| **Coragem** | Comum → Determinado → Firme → Destemido → Fodão |
| **Charme** | Existente → Confiante → Suave → Popular → Debonair |

Cada tier aplica automaticamente bônus de atributo (ex: Conhecimento III → +1 TEC) e desbloqueia habilidades especiais exibidas no Resumo Automático.

### Arcanas Suportadas

O Louco · O Mago · A Sacerdotisa · A Imperatriz · O Imperador · O Hierofante · Os Enamorados · A Carruagem · A Força · O Eremita · A Roda da Fortuna · A Justiça · O Enforcado · A Morte · A Temperança · O Diabo · A Torre · A Estrela · A Lua · O Sol · O Julgamento · O Mundo

---

## Sistema de Inventário

### Estrutura dos Itens

Cada item possui: **nome**, **peso** (kg), **quantidade** e **efeito/notas**. Itens são distribuídos entre duas seções:

| Seção | Descrição |
|---|---|
| **Equipados** | Itens em uso ativo — contam para o peso total |
| **Mochila** | Itens carregados mas não equipados — contam para o peso total |

### Capacidade e Estados de Carga

```
Capacidade Máxima = (STR × 5) + VIT    (valores com modificadores aplicados)
Peso Total        = Σ (peso × quantidade) de todos os itens
```

| Estado | Condição | Feedback |
|---|---|---|
| **Normal** | Peso < 80% da capacidade | Barra azul/cyan |
| **Pesado** | Peso ≥ 80% da capacidade | Barra amarela |
| **Sobrecarregado** | Peso > capacidade | Barra vermelha pulsante + ícone de aviso |

### Retrocompatibilidade

Saves criados no formato legado `{tipo, nome, efeito}` são migrados automaticamente: itens do tipo "Arma", "Armadura" ou "Acessório" vão para Equipados; os demais vão para Mochila. O peso é iniciado em 0.

---

## Temas Visuais

9 temas disponíveis com troca instantânea via dropdown no cabeçalho. A escolha é persistida no `localStorage`.

| Tema | Paleta |
|---|---|
| **Padrão** | Azul escuro com destaques cyan |
| **Roxo** | Roxo profundo com accent lilás |
| **Claro** | Fundo claro, modo diurno |
| **Vermelho** | Escuro com tons de vermelho intenso |
| **Verde** | Fundo esverdeado com accent esmeralda |
| **Corinthians** | Preto e vermelho |
| **Rosa Pastel** | Tons suaves de rosa e lilás |
| **Kamen Rider** | Preto e verde neon |
| **Amarelo** | Dourado e âmbar |

Todos os temas são implementados via CSS custom properties (`--bg-1`, `--bg-2`, `--accent`, `--ink`, etc.). Para criar um novo tema, basta adicionar uma classe `.theme-nomedotema` com as propriedades correspondentes.

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
  ├─ recalcState()          → HP/PM máximos, badges, capacidade de carga
  ├─ validateState()        → clamp HP/PM (≥ 0, ≤ máximo)
  ├─ render()               → campos, badges, social, inventário, resumo
  │
  └─ debouncedAutoSave()    → localStorage (debounce 500 ms)
```

### API Principal

| Função | Responsabilidade |
|---|---|
| `state` | Objeto único e mutável com todos os dados da ficha |
| `setState(partial, opts)` | Merge parcial → recalc condicional → render → auto-save |
| `getState()` | Cópia profunda do estado sem referências mutáveis |
| `renderAll()` | Renderização completa: tabelas, feitos, condições, afinidades, retrato, lore |
| `render()` | Renderização rápida: campos, badges, social, inventário, resumo |
| `recalcState()` | Calcula HP/PM máximos e `state._computed` a partir de atributos e modificadores |
| `validateState()` | Garante limites válidos (HP/PM ≥ 0 e ≤ máximo) |
| `snapshot()` | Serializa `state` para JSON (formato retrocompatível) |
| `applySnapshot(data)` | Restaura JSON → `state` → `recalcState()` → `renderAll()` |

### Sistema de Modificadores

Modificadores são aplicados em duas passagens:

1. **Flat** (`+N` ao valor base) — aplicado primeiro.
2. **Percentual** (`+N%` sobre o resultado flat) — aplicado depois.

Fontes de modificadores combinadas em `recalcState()`:
- Modificadores manuais do jogador (`state.modifiers`)
- Bônus automáticos de feitos ativos (`computeFeitoModifiers()`)
- Bônus automáticos de tiers sociais (`computeSocialModifiers()`)

---

## Persistência de Dados

| Mecanismo | Descrição |
|---|---|
| **localStorage** | Chave `ficha-yby-p3r-skin`. Armazenamento principal. |
| **Auto-save** | Debounce 500 ms, `MutationObserver` em tabelas, `beforeunload`. |
| **Exportar JSON** | Arquivo `NomeDoPersonagem.json` para backup externo. |
| **Importar JSON** | Restaura ficha completa, com migração automática de formato legado. |
| **Preencher PDF** | Preenche campos de um PDF modelo via `pdf-lib`. |
| **Exportar PNG** | Captura visual da ficha completa via `html2canvas`. |

### Formato do Snapshot

```json
{
  "id": "ficha-yby-p3r-skin",
  "acessoRapido": { "CharClass": "...", "CharLvl": 1, "CharSTR": 3, "..." },
  "persona":      { "PerName": "...", "PerArcana": "...", "PerLvl": 1, "..." },
  "affinities":   { "Físico": "Normal", "Fogo": "Fraco", "..." },
  "spells":       [ { "nome": "...", "tipo": "Fogo", "custo": "8 PM", "efeito": "..." } ],
  "feitos":       [ { "id": "atleta", "ativo": true } ],
  "equip":        [ { "nome": "...", "peso": 1.5, "qtd": 1, "efeito": "...", "local": "equipado" } ],
  "links":        [ { "nome": "...", "arcana": "O Mago", "rank": 3, "obs": "..." } ],
  "notes":        { "diary": "...", "goals": "...", "clues": [], "contacts": [] },
  "portrait":     { "src": "data:image/..." },
  "background":   { "bgOrigem": "...", "bgPersonalidade": "..." },
  "conditions":   [ { "id": "lento", "ativa": true } ],
  "modifiers":    [ { "nome": "Buff STR", "tipo": "flat", "valor": 2, "alvo": "STR", "ativo": true } ],
  "feitoConfig":  {}
}
```

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **HTML5** | — | Estrutura semântica da aplicação |
| **CSS3** | — | Custom properties para temas, responsividade, animações |
| **JavaScript** | ES Modules (nativo) | Lógica de estado, cálculos, renderização, persistência |
| [**pdf-lib**](https://pdf-lib.js.org/) | 1.17.1 | Preenchimento de PDFs modelo (CDN) |
| [**html2canvas**](https://html2canvas.hertzen.com/) | 1.4.1 | Captura visual em PNG (CDN) |
| **Google Fonts** | — | Barlow Condensed, Inter, Noto Sans JP |

---

## FAQ

**A ficha funciona offline?**  
Sim. Toda a lógica é local. Apenas fontes do Google e as duas bibliotecas CDN (pdf-lib, html2canvas) requerem conexão — se indisponíveis, as demais funcionalidades continuam operando normalmente.

**Posso usar em celular ou tablet?**  
Sim. O layout é responsivo, com alvos de toque de 44px mínimo e `font-size` de 16px nos inputs para evitar zoom automático no iOS.

**Meus dados ficam seguros?**  
Os dados ficam armazenados apenas no `localStorage` do seu navegador e nunca são enviados a nenhum servidor. Recomenda-se exportar backups em JSON regularmente, pois limpar dados do navegador apaga a ficha.

**O que acontece ao importar uma ficha no formato antigo?**  
A ficha é migrada automaticamente. Itens do inventário legado recebem peso 0 e são alocados na seção correta (Equipados ou Mochila) com base no tipo original.

**Como criar um novo tema?**  
Adicione uma classe `.theme-nomedotema` no CSS definindo as custom properties (`--bg-1`, `--bg-2`, `--accent`, `--ink`, `--accent-alt`, etc.) e registre o mapeamento em `js/themes.js` dentro do objeto `themeMap`.

---

## Licença

Este projeto é de uso pessoal e livre para fins não comerciais, criado para comunidades de RPG de mesa. Para outros usos, entre em contato com o proprietário do repositório.
