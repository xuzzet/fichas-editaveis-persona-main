# Ficha Automatizada — Persona

Ficha de personagem digital e editável para o sistema de RPG **Persona**, construída inteiramente com HTML, CSS e JavaScript puro, sem dependências de servidor ou framework. Arquitetura baseada em **estado centralizado** (`state` → `setState` → `render`), com cálculos puros e renderização reativa. Basta abrir o arquivo `index.html` no navegador para começar a usar.

---

## ✨ Funcionalidades

### Abas disponíveis

| Aba | Descrição |
|---|---|
| **Acesso Rápido** | Painel principal com os dados mais usados em sessão: atributos de combate, HP/PM, habilidades sociais, aspectos, equipamento rápido e ações de salvar/carregar. |
| **Modificadores** | Buffs e debuffs globais (flat ou percentual) que afetam atributos em tempo real, e sistema de 9 condições de status. |
| **Persona** | Identidade da Persona, magias & técnicas e tabela de afinidades elementais. |
| **Feitos** | 45 feitos especiais organizados em 6 categorias (Geral, Social, Combate, Persona, Atributos, Convicção) com checkboxes fixos. |
| **Equipamentos** | Inventário dinâmico de armas, armaduras, acessórios e itens. |
| **Vínculos** | Registro de vínculos de Arcana (NPCs, rank 1–10 e observações). |
| **Anotações** | Diário livre, lista de objetivos, pistas/âncoras e contatos/locais. |
| **Lore** | Retrato do personagem, histórico detalhado (26 campos) e características físicas. |

### Recursos

- **7 temas visuais** — Padrão, Roxo, Claro, Vermelho, Degradê Verde/Roxo, Corinthians e Rosa Pastel (persistem via `localStorage`).
- **Auto-save inteligente** — Salvamento automático com debounce (500 ms), MutationObserver em tabelas dinâmicas e proteção `beforeunload`. Indicador visual "Salvando…" / "Salvo ✔" no canto inferior.
- **Salvar / Carregar** — Armazena a ficha completa no `localStorage` do navegador.
- **Exportar / Importar JSON** — Exporta todos os dados em um arquivo `.json` e importa de volta em qualquer momento.
- **Resetar Ficha** — Limpa todos os campos e dados salvos.
- **Modificadores Globais** — Sistema de buffs/debuffs (flat ou %) aplicados sobre STR, MAG, TEC, AGI, VIT, LCK, HP e PM, com toggle de ativo/inativo e resumo visual.
- **Tabela de afinidades** — 10 elementos (Físico, Fogo, Gelo, Vento, Raio, Nuclear, PSY, Luz, Trevas, Onipotente) com 6 relações configuráveis.
- **Feitos** — 45 feitos organizados em categorias (Geral, Social, Combate, Persona, Atributos, Convicção) com cards de checkbox e descrição.
- **Condições** — 9 condições de status pré-definidas (Charme, Pânico, Medo, Fúria, Atordoado, Choque, Lento, Veneno, Derrubado) com flag de ativa/inativa.
- **Retrato do personagem** — Upload de imagem local com modal de visualização ampliada.
- **Notificações toast** — Feedback visual leve e não bloqueante para ações do usuário.
- **UX refinada** — Cards com hover lift, inputs com focus ring temático, tabs em container com glow, scrollbar customizada, micro-interações em checkboxes e botões, botões de ação diferenciados (primário/perigo).
- **Estado centralizado** — Objeto `state` único que concentra todos os dados da ficha. Alterações via `setState()` disparam recálculo, validação, renderização e auto-save automaticamente. API exposta (`window.state`, `window.setState`, `window.getState`) para debug e extensão.

---

## 🚀 Como usar

Não há instalação necessária. O projeto funciona diretamente no navegador:

```bash
# Clone o repositório
git clone https://github.com/xuzzet/fichas-editaveis-persona-main.git

# Abra o arquivo no navegador
cd fichas-editaveis-persona-main
# Abra index.html diretamente, ou use uma extensão como Live Server no VS Code
```

Ou acesse diretamente pelo GitHub Pages, se disponível.

---

## 🗂 Estrutura do Projeto

```
fichas-editaveis-persona-main/
├── index.html             # Estrutura completa da ficha (8 abas, formulários, tabelas)
├── styles.css             # Estilos globais, 7 temas visuais e micro-interações
├── theme-amarelo-fix.css  # Tema amarelo externo (opcional, não vinculado por padrão)
├── app.js                 # Estado central, cálculos puros, renderização reativa, auto-save
└── README.md              # Este arquivo
```

---

## 🎲 Atributos do Personagem

### Combate (18 pontos — mín. 1, máx. 12 por atributo)

| Sigla | Atributo |
|---|---|
| STR | Força |
| MAG | Magia |
| TEC | Técnica |
| AGI | Agilidade |
| VIT | Vitalidade |
| LCK | Sorte |

### Social (7 pontos iniciais — sem limite máximo após a criação)

Conhecimento · Disciplina · Empatia · Expressão · Coragem · Charme

Cada habilidade possui sistema de tiers (0–V) com descrições automáticas.

---

## 🃏 Arcanas suportadas

O Louco, O Mago, A Sacerdotisa, A Imperatriz, O Imperador, O Hierofante, Os Enamorados, A Carruagem, A Força, O Eremita, A Roda da Fortuna, A Justiça, O Enforcado, A Morte, A Temperança, O Diabo, A Torre, A Estrela, A Lua, O Sol, O Julgamento, O Mundo.

---

## 🎨 Temas

| Tema | Descrição |
|---|---|
| Padrão | Azul escuro com destaques em azul claro |
| Roxo | Roxo profundo saturado com accent lilás |
| Claro | Fundo claro com texto escuro — modo diurno |
| Vermelho | Escuro com tons de vermelho intenso |
| Degradê Verde/Roxo | Fundo esverdeado com accent verde esmeralda |
| Corinthians | Preto e vermelho — homenagem ao clube |
| Rosa Pastel | Tons suaves de rosa e lilás — modo pastel |

---

## 🏗 Arquitetura

```
Evento DOM → setState(partial) → recalcState() → validateState() → render() → autoSave()
```

| Conceito | Descrição |
|---|---|
| `state` | Objeto único com todos os dados editáveis da ficha |
| `setState(partial, options)` | Merge parcial → recalc condicional → render → auto-save |
| `getState()` | Retorna cópia profunda (sem referências internas) |
| `recalcState()` | Calcula HP/PM máximos e badges a partir de atributos + modificadores |
| `validateState()` | Clamp de HP/PM (≥ 0, ≤ máximo) |
| `render()` | Atualiza campos simples, badges e social |
| `renderAll()` | Render completo: tabelas, feitos, condições, modificadores, afinidades, retrato, background |
| `snapshot()` | Serializa `state` para formato JSON (backward-compatible) |
| `applySnapshot(data)` | Deserializa JSON → `state` → `renderAll()` |
| `applyModifiers()` | Função pura: base + flat + percentual → resultado (clamp ≥ 0) |

---

## 🛠 Tecnologias

- **HTML5 / CSS3 / JavaScript** (vanilla, sem frameworks)
- [**pdf-lib**](https://pdf-lib.js.org/) `v1.17.1` — geração de PDF
- [**html2canvas**](https://html2canvas.hertzen.com/) `v1.4.1` — captura visual da página
- Google Fonts: Montserrat, Barlow Condensed, Inter, Noto Sans JP

---

## 📄 Licença

Este projeto é de uso pessoal e livre para fins não comerciais, criado para comunidades de RPG. Consulte o proprietário do repositório para outros usos.
