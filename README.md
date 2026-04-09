# Ficha Automatizada — Persona

<div align="center">

**Ficha de personagem digital, editável e reativa para o sistema de RPG Persona.**

Construída com HTML, CSS e JavaScript puro — sem dependências de servidor, frameworks ou build steps.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-Uso%20Pessoal-blue?style=flat-square)](#-licença)

</div>

---

## Sumário

- [Visão Geral](#-visão-geral)
- [Demonstração Rápida](#-demonstração-rápida)
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
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🔭 Visão Geral

O projeto oferece uma ficha de RPG completa que roda inteiramente no navegador. A arquitetura é baseada em **estado centralizado** (`state` → `setState` → `render`) com cálculos puros e renderização reativa, garantindo que qualquer alteração em atributos se propague instantaneamente para todos os sistemas dependentes — HP, PM, capacidade de carga, badges e modificadores.

**Principais diferenciais:**

- Zero infraestrutura — basta abrir `index.html`.
- Cálculos automáticos de HP, PM e capacidade de carga.
- 7 temas visuais com troca instantânea.
- Auto-save inteligente com proteção contra perda de dados.
- Compatibilidade retroativa — saves antigos são migrados automaticamente.

---

## 🖼 Demonstração Rápida

> Abra `index.html` no navegador e comece a preencher. Todos os dados são salvos automaticamente no `localStorage`.

| Recurso | Comportamento |
|---|---|
| Alterar STR ou VIT | HP e capacidade de carga recalculam em tempo real |
| Adicionar item ao inventário | Peso total e barra de carga atualizam instantaneamente |
| Trocar tema | Aplicado imediatamente e persistido entre sessões |
| Fechar o navegador | Dados salvos automaticamente via `beforeunload` |

---

## ✨ Funcionalidades

### Abas do Sistema

| Aba | Descrição |
|---|---|
| **Acesso Rápido** | Painel principal de sessão: atributos de combate (sliders), HP/PM, habilidades sociais com sistema de tiers, aspectos, equipamento rápido e botões de ação (salvar, carregar, exportar, importar, reset). |
| **Modificadores** | Buffs e debuffs globais (flat ou percentual) sobre STR, MAG, TEC, AGI, VIT, LCK, HP e PM com toggle ativo/inativo. Inclui sistema de 9 condições de status pré-definidas com descrições detalhadas. |
| **Persona** | Nome, Arcana e nível da Persona. Deck de magias & técnicas (com nome, tipo elemental, custo, efeito e reordenação). Tabela de afinidades elementais (10 elementos × 6 relações). |
| **Feitos** | 45 feitos especiais organizados em 6 categorias — Geral, Social, Combate, Persona, Atributos e Convicção — com checkbox, descrição completa e pré-requisitos. |
| **Inventário** | Sistema completo de gerenciamento de itens com separação entre **Equipados** e **Mochila**, peso por item, quantidade, cálculo automático de capacidade de carga e feedback visual de sobrecarga. |
| **Vínculos** | Registro de vínculos de Arcana — NPC, Arcana associada, rank (1–10) e observações livres. |
| **Anotações** | Diário de sessão, lista de objetivos, registro de pistas/âncoras com status (Aberta/Em andamento/Resolvida) e contatos/locais. |
| **Lore** | Upload de retrato do personagem (com modal de zoom), histórico detalhado (26 campos narrativos) e características físicas. |

### Recursos Principais

| Recurso | Detalhes |
|---|---|
| **Auto-save inteligente** | Debounce de 500 ms, `MutationObserver` em tabelas dinâmicas, proteção `beforeunload`. Indicador visual "Salvando…" → "Salvo ✔" no canto inferior direito. |
| **Exportar / Importar** | Exporta toda a ficha como `.json`. Importa de volta preservando 100% dos dados, incluindo retrato, feitos, condições e inventário. |
| **Modificadores Globais** | Flat (`+3 STR`) ou percentual (`+20% HP`). Aplicados em cadeia: flat primeiro, percentual depois. Resumo visual dos modificadores ativos. |
| **Sistema de Inventário** | Capacidade = `(FOR × 5) + VIT`. Barra de progresso com 3 estados visuais (Normal, Pesado, Sobrecarregado). Botão para mover itens entre Equipado ↔ Mochila. Migração automática de formato legado. |
| **Tabela de Afinidades** | 10 elementos × 6 relações (Normal, Fraco, Resiste, Anula, Reflete, Absorve). |
| **Condições de Status** | 9 condições: Charme, Pânico, Medo, Fúria, Atordoado, Choque, Lento, Veneno, Derrubado — cada uma com descrição mecânica completa. |
| **Retrato** | Upload local de imagem com preview e modal de visualização ampliada. Persistido no save como Data URL. |
| **7 Temas Visuais** | Troca instantânea via dropdown, persistência automática entre sessões. |
| **UX** | Cards com hover lift, focus ring temático, scrollbar customizada, micro-interações em checkboxes/botões, toasts de feedback não-bloqueantes. |

---

## 🚀 Primeiros Passos

### Pré-requisitos

- Um navegador moderno (Chrome, Firefox, Edge, Safari).
- Nenhuma instalação, servidor ou dependência necessária.

### Instalação

```bash
# Clone o repositório
git clone https://github.com/xuzzet/fichas-editaveis-persona-main.git
cd fichas-editaveis-persona-main
```

### Execução

Abra `index.html` diretamente no navegador, ou use um servidor local:

```bash
# Opção 1 — Abrir diretamente
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux

# Opção 2 — Live Server (VS Code)
# Instale a extensão "Live Server" e clique em "Go Live"

# Opção 3 — Python
python -m http.server 8080
# Acesse http://localhost:8080
```

> Também disponível via **GitHub Pages**, se configurado no repositório.

---

## 🗂 Estrutura do Projeto

```
fichas-editaveis-persona-main/
│
├── index.html              # Estrutura completa — 8 abas, formulários, tabelas, modais
├── styles.css              # Estilos globais, 7 temas visuais, responsividade, animações
├── theme-amarelo-fix.css   # Tema amarelo adicional (opcional, não vinculado por padrão)
├── app.js                  # Lógica principal — estado central, cálculos, renderização,
│                           #   inventário, auto-save, exportação e testes integrados
└── README.md               # Documentação do projeto
```

**Complexidade:**

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura semântica de 8 views com navegação por tabs. Formulários de atributos, tabelas dinâmicas, checkboxes de feitos/condições e seção de lore. |
| `styles.css` | CSS custom properties para temas, layout responsivo com media queries, micro-animações (hover, focus, pulse), barra de capacidade do inventário e otimizações para impressão e touch. |
| `app.js` | ~1700 linhas: IIFE principal com estado centralizado, sistema de modificadores, inventário com peso, feitos, condições, afinidades, snapshot/restore, auto-save com debounce e testes integrados. |

---

## 🎲 Sistema de Atributos

### Combate

Distribuição de **18 pontos** entre 6 atributos (mínimo 1, máximo 12 cada):

| Sigla | Atributo | Uso principal |
|---|---|---|
| **STR** | Força | Dano físico, capacidade de carga |
| **MAG** | Magia | Dano mágico, PM máximo |
| **TEC** | Técnica | Precisão, alcance |
| **AGI** | Agilidade | Esquiva, iniciativa, movimento |
| **VIT** | Vitalidade | HP máximo, resistência, capacidade de carga |
| **LCK** | Sorte | Críticos, cargas de sorte |

**Fórmulas derivadas:**

| Stat | Fórmula |
|---|---|
| HP Máximo | `25 + ((5 + VIT) × Nível)` |
| PM Máximo | `15 + ((MAG + 5) × 2) + ((Nível − 1) × 5)` |
| Capacidade de Carga | `(STR × 5) + VIT` |

### Social

Distribuição de **7 pontos iniciais** entre 6 habilidades (sem limite máximo após a criação):

| Habilidade | Tiers (0–V) |
|---|---|
| **Conhecimento** | Preguiçoso → Ciente → Sabido → Estudado → Enciclopédico → Erudito |
| **Disciplina** | Desatento → Decente → Persistente → Minucioso → Magistral → Transcendente |
| **Empatia** | Indiferente → Inofensivo → Gentil → Generoso → Altruísta → Angelical |
| **Expressão** | Monótono → Rudimentar → Eloquente → Inspirador → Tocante → Fascinante |
| **Coragem** | Tímido → Comum → Determinado → Firme → Destemido → Fodão |
| **Charme** | Sem Graça → Existente → Confiante → Suave → Popular → Debonair |

Cada tier (a cada 5 pontos) desbloqueia uma habilidade especial descrita automaticamente na ficha.

### Arcanas Suportadas

O Louco · O Mago · A Sacerdotisa · A Imperatriz · O Imperador · O Hierofante · Os Enamorados · A Carruagem · A Força · O Eremita · A Roda da Fortuna · A Justiça · O Enforcado · A Morte · A Temperança · O Diabo · A Torre · A Estrela · A Lua · O Sol · O Julgamento · O Mundo

---

## ⚖️ Sistema de Inventário

O inventário implementa um sistema de gerenciamento de carga inspirado em RPGs clássicos.

### Estrutura

Cada item possui: **nome**, **peso**, **quantidade** e **efeito/notas**. Os itens são separados em duas seções:

| Seção | Descrição |
|---|---|
| **⚔️ Equipados** | Itens em uso ativo (armas, armaduras, acessórios) |
| **🎒 Mochila** | Itens carregados mas não equipados |

### Capacidade de Carga

```
Capacidade Máxima = (FOR × 5) + VIT
```

- Utiliza os valores **com modificadores aplicados** (buffs/debuffs inclusos).
- Recalcula automaticamente quando STR, VIT ou modificadores mudam.

### Peso Total

```
Peso Total = Σ (peso × quantidade) de todos os itens
```

### Estados de Carga

| Estado | Condição | Feedback Visual |
|---|---|---|
| **Normal** | Peso < 80% da capacidade | Barra cyan, badge "Normal" |
| **Pesado** | Peso ≥ 80% da capacidade | Barra amarela, badge "Pesado" |
| **Sobrecarregado** | Peso > capacidade | Barra vermelha pulsante, badge "⚠ Sobrecarregado" |

### Ações Disponíveis

- Adicionar item (direto em Equipados ou Mochila)
- Remover item
- Editar nome, peso, quantidade e efeito
- Mover entre Equipado ↔ Mochila com um clique

### Compatibilidade

Saves antigos no formato `{tipo, nome, efeito}` são migrados automaticamente para o novo formato `{nome, peso, qtd, efeito, local}` ao carregar.

---

## 🎨 Temas Visuais

7 temas disponíveis com troca instantânea via dropdown no cabeçalho. A escolha persiste entre sessões via `localStorage`.

| Tema | Paleta |
|---|---|
| **Padrão** | Azul escuro com destaques cyan |
| **Roxo** | Roxo profundo saturado com accent lilás |
| **Claro** | Fundo claro com texto escuro — modo diurno |
| **Vermelho** | Escuro com tons de vermelho intenso |
| **Degradê Verde/Roxo** | Fundo esverdeado com accent esmeralda |
| **Corinthians** | Preto e vermelho |
| **Rosa Pastel** | Tons suaves de rosa e lilás |

Todos os temas utilizam CSS custom properties (`--bg-1`, `--bg-2`, `--accent`, `--ink`, etc.), facilitando a criação de novos temas.

---

## 🏗 Arquitetura Técnica

### Fluxo de Dados

```
Evento DOM
  │
  ▼
setState(partial, options)
  │
  ├── Merge parcial no state
  ├── recalcState()          ← HP, PM, badges, capacidade de carga
  ├── validateState()        ← Clamp HP/PM ≥ 0, ≤ máximo
  ├── render()               ← Campos, badges, social, barra de inventário
  │
  └── debouncedAutoSave()    ← localStorage (500 ms debounce)
```

### API Principal

| Função | Responsabilidade |
|---|---|
| `state` | Objeto único com todos os dados editáveis da ficha |
| `setState(partial, options)` | Merge parcial → recalc condicional → render → auto-save |
| `getState()` | Retorna cópia profunda (sem referências mutáveis) |
| `recalcState()` | Calcula HP/PM máximos e badges a partir de atributos + modificadores |
| `validateState()` | Garante limites válidos de HP/PM (≥ 0, ≤ máximo) |
| `render()` | Atualiza campos simples, badges, social e barra de inventário |
| `renderAll()` | Render completo: tabelas, feitos, condições, modificadores, afinidades, retrato, background |
| `snapshot()` | Serializa `state` para JSON (formato backward-compatible) |
| `applySnapshot(data)` | Restaura JSON → `state` → `recalcState()` → `renderAll()` |
| `applyModifiers(base, mods)` | Função pura: base + flat + percentual → resultado (clamp ≥ 0) |

### API do Inventário

| Função | Responsabilidade |
|---|---|
| `calcInventoryCapacity()` | Calcula `(FOR × 5) + VIT` usando valores com modificadores |
| `calcInventoryWeight()` | Soma `peso × quantidade` de todos os itens |
| `renderInventoryStatus()` | Atualiza barra de capacidade e badge de estado |
| `addInventoryItem(data, local)` | Adiciona item na seção especificada (equipado/mochila) |
| `syncEquipToState()` | Sincroniza DOM → `state.equip` |
| `migrateEquipItem(item)` | Converte formato legado `{tipo}` → formato novo `{local, peso, qtd}` |

### API Global (Debug & Extensão)

Exposta em `window` para uso no console:

```javascript
window.state       // Estado atual completo
window.setState()  // Alterar estado programaticamente
window.getState()  // Cópia profunda do estado
window.autoSave()  // Forçar salvamento imediato
```

---

## 💾 Persistência de Dados

| Mecanismo | Descrição |
|---|---|
| **`localStorage`** | Armazenamento principal — chave `ficha-yby-p3r-skin`. |
| **Auto-save** | Debounce de 500 ms em qualquer evento `input` ou `change`. `MutationObserver` monitora tabelas dinâmicas. `beforeunload` garante save no fechamento. |
| **Exportar JSON** | Gera arquivo `NomeDoPersonagem.json` para backup ou transferência. |
| **Importar JSON** | Restaura ficha completa a partir de arquivo `.json`. |
| **Preencher PDF** | Carrega um PDF modelo e preenche campos via `pdf-lib`. |
| **Exportar PNG** | Captura visual da ficha via `html2canvas`. |

### Formato do Snapshot

O snapshot é um objeto JSON com a seguinte estrutura de alto nível:

```
{
  id: "ficha-yby-p3r-skin",
  acessoRapido: { ... },     // Campos do painel principal
  persona: { ... },          // Dados da Persona
  affinities: { ... },       // Afinidades elementais
  spells: [ ... ],           // Magias & técnicas
  feitos: [ ... ],           // Feitos ativos
  equip: [ ... ],            // Inventário (nome, peso, qtd, efeito, local)
  links: [ ... ],            // Vínculos
  notes: { ... },            // Diário, objetivos, pistas, contatos
  portrait: { src: "..." },  // Retrato (Data URL)
  background: { ... },       // Campos de lore
  conditions: [ ... ],       // Condições ativas
  modifiers: [ ... ]         // Modificadores globais
}
```

---

## 🛠 Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **HTML5** | — | Estrutura semântica da ficha |
| **CSS3** | — | Temas via custom properties, responsividade, animações |
| **JavaScript** | ES5+ | Lógica de estado, cálculos, renderização, persistência |
| [**pdf-lib**](https://pdf-lib.js.org/) | 1.17.1 | Preenchimento de PDFs modelo |
| [**html2canvas**](https://html2canvas.hertzen.com/) | 1.4.1 | Captura visual para exportação PNG |
| **Google Fonts** | — | Barlow Condensed, Inter, Noto Sans JP |

---

## ❓ FAQ

**A ficha funciona offline?**
Sim. Todos os recursos são carregados localmente, exceto fontes do Google (que serão substituídas pela fonte padrão do sistema se indisponíveis).

**Posso usar em celular?**
Sim. O layout é responsivo e inclui otimizações específicas para telas touch (alvos de toque de 44px, font-size mínimo de 16px para inputs).

**Meus dados estão seguros?**
Os dados ficam no `localStorage` do seu navegador. Recomenda-se exportar backups em JSON regularmente. Limpar dados do navegador apagará a ficha.

**Posso criar meu próprio tema?**
Sim. Basta adicionar uma nova classe CSS (ex: `theme-meutema`) definindo as custom properties (`--bg-1`, `--bg-2`, `--accent`, `--ink`, etc.) e registrar no seletor do HTML.

**O que acontece com fichas salvas no formato antigo (sem inventário de peso)?**
São migradas automaticamente. Itens do tipo "Arma", "Armadura" ou "Acessório" vão para Equipados; o restante vai para Mochila. O peso inicia em 0 para itens migrados.

---

## 🤝 Contribuição

Contribuições são bem-vindas. Para contribuir:

1. Faça um fork do repositório.
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`).
3. Faça commit das alterações (`git commit -m 'feat: descrição'`).
4. Envie para o fork (`git push origin feature/nome-da-feature`).
5. Abra um Pull Request.

---

## 📄 Licença

Este projeto é de uso pessoal e livre para fins não comerciais, criado para comunidades de RPG. Consulte o proprietário do repositório para outros usos.
