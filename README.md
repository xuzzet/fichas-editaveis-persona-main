# Ficha Automatizada — Persona

Ficha de personagem digital e editável para o sistema de RPG **Persona**, construída inteiramente com HTML, CSS e JavaScript puro, sem dependências de servidor ou framework. Basta abrir o arquivo `index.html` no navegador para começar a usar.

---

## ✨ Funcionalidades

### Abas disponíveis

| Aba | Descrição |
|---|---|
| **Acesso Rápido** | Painel principal com os dados mais usados em sessão: atributos, HP/PM, habilidades sociais, aspectos, equipamento e ações de salvar/carregar. |
| **Persona** | Identidade da Persona, magias & técnicas e tabela de afinidades elementais. |
| **Feitos** | Sistema de feitos especiais com seleção por nível e validação de limite de ranks. |
| **Equipamentos** | Inventário dinâmico de armas, armaduras, acessórios e itens. |
| **Vínculos** | Registro de vínculos de Arcana (NPCs, rank 1–10 e observações). |
| **Anotações** | Diário livre e lista de objetivos. |
| **Lore** | Retrato do personagem, histórico detalhado e características físicas. |

### Recursos

- **7 temas visuais** — Padrão, Roxo, Claro, Dourado, Vermelho, Degradê Verde/Roxo e Corinthians (persistem via `localStorage`).
- **Salvar / Carregar** — Armazena a ficha completa no `localStorage` do navegador.
- **Exportar / Importar JSON** — Exporta todos os dados em um arquivo `.json` e importa de volta em qualquer momento.
- **Resetar Ficha** — Limpa todos os campos e dados salvos.
- **Tabela de afinidades** — 10 elementos (Físico, Fogo, Gelo, Vento, Raio, Nuclear, PSY, Luz, Trevas, Onipotente) com relações configuráveis por select.
- **Feitos** — Lista curada de habilidades especiais com validação de unicidade, ranks, nível e limite por personagem.
- **Condições** — 9 condições de status pré-definidas (Charme, Pânico, Medo, Fúria, Atordoado, Choque, Lento, Veneno, Derrubado) com flag de ativa/inativa.
- **Retrato do personagem** — Upload de imagem local com modal de visualização ampliada.
- **Notificações toast** — Feedback visual leve e não bloqueante para ações do usuário.

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
├── index.html          # Estrutura completa da ficha (abas, formulários, tabelas)
├── styles.css          # Estilos globais e todos os temas visuais
├── theme-amarelo-fix.css  # Correções de estilo para tema amarelo/dourado
└── app.js              # Toda a lógica de interação, persistência e validação
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

### Social (7 pontos iniciais)

Conhecimento · Disciplina · Empatia · Expressão · Coragem · Charme

---

## 🃏 Arcanas suportadas

O Louco, O Mago, A Sacerdotisa, A Imperatriz, O Imperador, O Hierofante, Os Enamorados, A Carruagem, A Força, O Eremita, A Roda da Fortuna, A Justiça, O Enforcado, A Morte, A Temperança, O Diabo, A Torre, A Estrela, A Lua, O Sol, O Julgamento, O Mundo.

---

## 🛠 Tecnologias

- **HTML5 / CSS3 / JavaScript** (vanilla, sem frameworks)
- [**pdf-lib**](https://pdf-lib.js.org/) `v1.17.1` — geração de PDF
- [**html2canvas**](https://html2canvas.hertzen.com/) `v1.4.1` — captura visual da página
- Google Fonts: Barlow Condensed, Inter, Noto Sans JP

---

## 📄 Licença

Este projeto é de uso pessoal e livre para fins não comerciais, criado para comunidades de RPG. Consulte o proprietário do repositório para outros usos.
