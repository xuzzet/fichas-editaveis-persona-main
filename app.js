// ===== Retrato do Personagem (Portrait) =====
document.addEventListener('DOMContentLoaded', function() {
  const portraitBtn = document.getElementById('portraitBtn');
  const portraitInput = document.getElementById('portraitInput');
  const portraitPreview = document.getElementById('portraitPreview');
  const portraitZoomBtn = document.getElementById('portraitZoomBtn');
  const portraitModal = document.getElementById('portraitModal');
  const portraitModalImg = document.getElementById('portraitModalImg');
  const portraitModalClose = document.getElementById('portraitModalClose');
  let portraitImgSrc = '';

  if (portraitBtn && portraitInput && portraitPreview) {
    portraitBtn.addEventListener('click', () => portraitInput.click());
    portraitInput.addEventListener('change', () => {
      const file = portraitInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          portraitImgSrc = e.target.result;
          portraitPreview.innerHTML = `<img src='${portraitImgSrc}' alt='Retrato' style='max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);'/>`;
        };
        reader.readAsDataURL(file);
      } else {
        portraitImgSrc = '';
        portraitPreview.innerHTML = '';
      }
    });
  }

  if (portraitZoomBtn && portraitModal && portraitModalImg && portraitModalClose) {
    portraitZoomBtn.addEventListener('click', function() {
      if (portraitImgSrc) {
        portraitModalImg.src = portraitImgSrc;
        portraitModal.style.display = 'flex';
      }
    });
    portraitModalClose.addEventListener('click', function() {
      portraitModal.style.display = 'none';
      portraitModalImg.src = '';
    });
    portraitModal.addEventListener('click', function(e) {
      if (e.target === portraitModal) {
        portraitModal.style.display = 'none';
        portraitModalImg.src = '';
      }
    });
  }
});
const ELEMENTS = [
  "Físico",
  "Fogo",
  "Gelo",
  "Vento",
  "Raio",
  "Nuclear",
  "PSY",
  "Luz",
  "Trevas",
  "Onipotente"
];
const EL_IDS = {
  "Físico": "Fisico",
  "Fogo": "Fogo",
  "Gelo": "Gelo",
  "Vento": "Vento",
  "Raio": "Raio",
  "Nuclear": "Nuclear",
  "PSY": "PSY",
  "Luz": "Luz",
  "Trevas": "Trevas",
  "Onipotente": "Onipotente"
};
// ...existing code...
  // ===== Tema Dinâmico =====
  const themeSelect = document.getElementById('themeSelect');
  const themeMap = {
    padrao: 'theme-padrao',
    roxo: 'theme-roxo',
    claro: 'theme-claro',
    dourado: 'theme-dourado',
    vermelho: 'theme-vermelho',
    degrade: 'theme-degrade',
    corinthians: 'theme-corinthians'
  };
  function applyTheme(theme) {
    Object.values(themeMap).forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(themeMap[theme] || themeMap.padrao);
  }
  function saveTheme(theme) {
    localStorage.setItem('ficha-theme', theme);
  }
  function loadTheme() {
    return localStorage.getItem('ficha-theme') || 'padrao';
  }
  if (themeSelect) {
    themeSelect.value = loadTheme();
    applyTheme(themeSelect.value);
    themeSelect.addEventListener('change', function() {
      applyTheme(this.value);
      saveTheme(this.value);
    });
  }

  // ===== Toast Notification System =====
  // Provides lightweight user feedback without blocking interaction
  function showToast(message, type='info', duration=3000){
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation after a frame
    requestAnimationFrame(()=> {
      setTimeout(()=> {
        toast.classList.add('out');
        setTimeout(()=> toast.remove(), 300);
      }, duration);
    });
  }

  // Função para resetar todos os campos da ficha
  function resetFicha() {
    // Seleciona todos os inputs, selects e textareas dentro do .wrap
    const root = document.querySelector('.wrap');
    const fields = root.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      if (field.type === 'number' || field.type === 'range') {
        field.value = field.min || '';
      } else if (field.type === 'checkbox' || field.type === 'radio') {
        field.checked = false;
      } else if (field.tagName === 'SELECT') {
        field.selectedIndex = 0;
      } else {
        field.value = '';
      }
    });
    // Limpa tabelas dinâmicas se existirem
    ['tbl-eq','tbl-spell','tbl-link','tbl-clue','tbl-ctt','tbl-mod'].forEach(id => {
      const tbody = document.querySelector(`#${id} tbody`);
      if (tbody) tbody.innerHTML = '';
    });
    // Limpa estados visuais de listas fixas (feitos/condições)
    document.querySelectorAll('.feat-item').forEach(el => el.classList.remove('feat-active'));
    document.querySelectorAll('.cond-item').forEach(el => el.classList.remove('cond-active'));
    // Limpa afinidades
    const afBody = document.getElementById('af-body');
    if (afBody) afBody.innerHTML = '';
    if(typeof buildAffinityTable === 'function') buildAffinityTable();
    // Limpa notas de teste
    const testsOut = document.getElementById('tests-out');
    if (testsOut) testsOut.textContent = 'Clique em Testes para rodar as verificações.';
    // Remove dados do localStorage (mesma chave usada para salvar)
    localStorage.removeItem('ficha-yby-p3r-skin');
  }

  // Adiciona evento ao botão de reset
  const resetBtn = document.getElementById('reset');
  if(resetBtn) resetBtn.addEventListener('click', resetFicha);
  // ...existing code...
// ===== Utilitários =====
const $ = (q)=>document.querySelector(q);
const $$ = (q)=>Array.from(document.querySelectorAll(q));
function clampInt(n,min,max){ n=Math.trunc(+n||0); return Math.min(max,Math.max(min,n)); }

// ===== Inicialização de Tabs =====
function initTabs() {
  $$(".tab").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".tab").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    $$(".view").forEach(v=>v.classList.remove("active")); $("#"+btn.dataset.view).classList.add("active");
    const resizeNow = ()=>{ if(typeof window.initAutoResizeTextareas === 'function') window.initAutoResizeTextareas(); };
    if(typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(resizeNow); else setTimeout(resizeNow, 0);
  }));
}

// ===== Inicialização de Arcana =====
const ARCANAS = ["", "0 - Louco","I - Mago","II - Sacerdotisa","III - Imperatriz","IV - Imperador","V - Hierofante","VI - Enamorados","VII - Carruagem","VIII - Força","IX - Eremita","X - Roda da Fortuna","XI - Justiça","XII - Enforcado","XIII - Morte","XIV - Temperança","XV - Diabo","XVI - Torre","XVII - Estrela","XVIII - Lua","XIX - Sol","XX - Julgamento","XXI - Mundo"];
// ===== Lista de Feitos (versão reformulada completa — 45 feitos) =====
const FEITOS_LIST = [
  // ── Geral ──
  { id: 'mente_aberta', name: 'Mente Aberta', cat: 'Geral', desc: 'Durante uma cena de Interlúdio, pode selecionar uma Magia de seu Deck como principal de Mente Aberta. Em combate pode utilizá-la por apenas 1 PM. Pode ser utilizado igual à sua MAG (Limitado a 3 Usos).' },
  { id: 'longe_do_fim', name: 'Longe do Fim', cat: 'Geral', desc: 'Recebe +5 de PM Máximo extra para cada Novo Nível (Afeta Níveis posteriores).' },
  { id: 'habil', name: 'Hábil', cat: 'Geral', desc: 'Concede +1 para uma Habilidade de Combate ou +3 para uma Habilidade Social. (Pode ser adquirido várias vezes)' },

  // ── Social ──
  { id: 'furioso', name: 'Furioso', cat: 'Social', desc: 'Você pode, como uma Ação Rápida, receber os efeitos de Fúria. Você não pode ser curado desse Status ou se recuperar naturalmente dele até o final do seu próximo turno e não recebe mais a Penalidade de Acerto enquanto enfurecido.', prereq: 'Tier I em Coragem' },
  { id: 'auxilio_altruista', name: 'Auxílio Altruísta', cat: 'Social', desc: 'Como uma Ação Padrão, você pode sacrificar até 50% do seu PV atual para aumentar o PV Máximo de um alvo adjacente igual à quantidade sacrificada. Alvos dessa habilidade que estiverem com 0 PV só recebem o sacrifício como Cura.', prereq: 'Tier I em Empatia' },
  { id: 'um_em_espirito', name: 'Um em Espírito', cat: 'Social', desc: 'Quando você atingir uma Fraqueza pela primeira vez em uma Sombra ou atingir um Golpe Crítico, você pode Atacar novamente com uma Ação Livre. (O Ataque Extra causado por atingir uma Fraqueza só é ativado uma única vez por combate, mas Golpes Críticos continuam aplicando os Ataques Extras.)', prereq: 'Tier I em Conhecimento ou Disciplina' },
  { id: 'explorador', name: 'Explorador', cat: 'Social', desc: 'Qualquer teste de Disciplina relacionado à ação de Procurar e Investigar no Metaverso; o Narrador tratará seu personagem como permanentemente procurando. Você pode re-rolar qualquer teste relacionado à procura de itens ou aparatos, uma vez por teste.', prereq: 'Tier I em Disciplina' },

  // ── Combate — Armas ──
  { id: 'esp_espadas', name: 'Especialização em Espadas', cat: 'Combate', desc: 'Enquanto Empunhar uma Espada, selecione 2 Tipos de Magia para receber Vantagem. Caso seja bem sucedido contra a magia, pode se mover Metade do Movimento com uma Ação Livre. (Não pode ser alocado na sua Fraqueza Elemental)', prereq: 'Tier I em Disciplina' },
  { id: 'esp_corpo_a_corpo', name: 'Especialização em Corpo a Corpo', cat: 'Combate', desc: 'Enquanto estiver Desarmado ou Empunhar qualquer tipo de Manoplas, você ganha +2 Dados em testes de Acerto e aumenta em 1 Passo o seu dado de dano. (Não afeta Magias)', prereq: 'Tier I em Coragem' },
  { id: 'esp_lanca', name: 'Especialização em Lança', cat: 'Combate', desc: 'Com uma Lança Equipada e um Inimigo entra ou sai do alcance da sua lança, você pode desferir um ataque básico como Ação Livre e caso seja bem sucedido, Interrompe o alvo e causa perda de sua Ação Padrão.', prereq: '5 de Agilidade' },
  { id: 'esp_chicotes', name: 'Especialização em Chicotes', cat: 'Combate', desc: 'Enquanto estiver com um Chicote Equipado, sempre que você atingir um inimigo com um Ataque Básico, aumenta a dificuldade de Penalidades em 15% de chance, limitado a 30% de Chance.', prereq: 'Tier I de Charme e 4 de Agilidade' },
  { id: 'esp_arcos', name: 'Especialização em Arcos', cat: 'Combate', desc: 'Trate o Alcance de qualquer Arco que você empunhar como o Dobro de seu Alcance. Ao Declarar um Ataque com um Arco, ignore Penalidade por Cobertura Parcial ou por Camuflagem e cause MAG ou AGI como pontos de Dano Extra. Esse dano é aplicado até mesmo se o ataque errar como Dano Onipotente.', prereq: 'Tier I de Disciplina e 4 de Agilidade ou Magia' },
  { id: 'esp_armas_fogo', name: 'Especialização em Armas de Fogo', cat: 'Combate', desc: 'Se você acertar um Ataque Básico com uma Arma de Fogo em sua distância máxima, você ganha Vantagem e se estiver em alcance corpo a corpo recebe Desvantagem em acerto, mas causa Dano Máximo.', prereq: 'Tier I de Disciplina e 4 de Agilidade ou Magia' },
  { id: 'esp_escudos_placas', name: 'Especialização em Escudos e Placas', cat: 'Combate', desc: 'Com um Escudo ou Armadura Pesada equipado, como uma Ação Completa, você pode optar por adotar uma postura defensiva e ganhar Resistência a todos os tipos de dano e Soma Novamente seu Vigor como RD até seu próximo turno.', prereq: '6 de Vigor' },
  { id: 'esp_adagas', name: 'Especialização em Adagas', cat: 'Combate', desc: 'Seus ataques com Adagas têm +1 de Alcance, podem ser arremessadas sem Desvantagem e podem ser recuperadas sem necessidade de testes. E soma sua Agilidade como Dano Extra. (Aplica em Ataque Básico e Magias)', prereq: '6 de Agilidade' },
  { id: 'fisico_gladiador', name: 'Físico do Gladiador', cat: 'Combate', desc: 'Uma Vez por Combate — Quando você declarar uma Magia Física que pode aplicar um efeito de Status, você causa Automaticamente o efeito, funcionando tanto em Benéficos & Maligno. E adiciona sua Força como Dados de Dano Extra.', prereq: '4 de Força' },

  // ── Persona ──
  { id: 'transe_monge_fogo', name: 'Transe do Monge de Fogo', cat: 'Persona', desc: 'Quando você causa dano com uma Magia de Fogo, você pode Incendiar o espaço ocupado pelo(s) alvo(s) pelas próximas Duas rodadas. Espaços incendiados causam Magia como dano de Fogo contra qualquer Sombra que terminar seu turno nesse espaço ou passar por ele durante seu movimento; caso o alvo estiver Queimando, recebe o Dobro de Dano. (Cada Sombra só pode tomar dano de cada espaço incendiado uma vez por rodada.)', prereq: 'Persona possuir Tipo Fogo' },
  { id: 'toque_rainha_gelo', name: 'Toque da Rainha de Gelo', cat: 'Persona', desc: 'Quando você Derrotar um inimigo usando uma Magia de Gelo, cause Congelado em um alvo adjacente Automaticamente e caso possua Buffs ativos, aumente sua duração em +2 Rodadas.\nCongelado: Alvos Congelados tem metade de seu movimento e recebem Dobro de Dano do próximo Dano Físico ou Raio utilizado contra ele.', prereq: 'Persona possuir Tipo Gelo' },
  { id: 'investida_ventos', name: 'Investida da Cavalaria dos Ventos', cat: 'Persona', desc: 'Depois de acertar um alvo com uma Magia de Vento, você Reduz da próxima Rolagem de Reação do alvo igual a sua Magia.\nCusto: 10 PM — Cria um Tornado de 6 Metros de Raio ao redor do alvo atingido; enquanto inimigos estiverem dentro do Tornado devem fazer um teste de Agilidade contra DT = 10 + Magia, caso falhe se tornam Caídos até sua próxima rodada.', prereq: 'Persona possuir Tipo Vento' },
  { id: 'maos_lorde_raio', name: 'Mãos do Lorde do Raio', cat: 'Persona', desc: 'Ao atingir um alvo com uma Magia de Raio você pode gastar 8 de PM para tornar Magias de Alvo único em efeito de Área mantendo seu Dado de Dano; caso a Magia de Raio já seja em área, aumenta a chance de todos os alvos receberem Choque em 30%.\nChoque: Alvos que sofrerem de Choque ficam atordoados por 1 Rodada.', prereq: 'Persona possuir Tipo Raio' },
  { id: 'sombra_assassino_nuclear', name: 'Sombra do Assassino Nuclear', cat: 'Persona', desc: 'Aumente seu limite de Acúmulo em +2. Você ganha a capacidade de "Transferir" os acúmulos de Radiação para um Alvo Inimigo, igual à sua Vitalidade por rodada. Alvos inimigos que passarem seu limite ativam o mesmo efeito que ocorreria se você excedesse seu limite de contadores. (O Usuário deve fazer um teste de Magia vs Vitalidade do Alvo)', prereq: 'Persona possuir Tipo Nuclear' },
  { id: 'caos_psicocinetico', name: 'Caos do Vidente Psicocinético', cat: 'Persona', desc: 'Efeitos de Status são Ampliados e recebem as seguintes adições:\n• Chance de Efeito: Todo efeito de Status com 50% de Chance ou menor se torna 80%. (NÃO AFETA EFEITOS DE EXECUTAR)\n• Recuperação de Efeito: Todo efeito de 33% de Recuperação se torna 25% e se já for 25% se torna 18%.\n• Redução de Habilidade de Combate: Todo Status de -3 se torna -4.', prereq: 'Persona possuir Tipo Psíquico' },
  { id: 'voto_clerigo_luz', name: 'Voto do Clérigo da Luz', cat: 'Persona', desc: 'Quando você causa dano com uma Magia de Luz, você pode gastar 6 de PM para ganhar Vitalidade + Magia como Pontos de Vida temporários. Enquanto você tiver PV temporário, você não pode ativar esse Feito novamente. (PV temporário é somado ao seu PV máximo, é gasto antes do seu PV normal e não pode ser recuperado)', prereq: 'Persona possuir Tipo Luz' },
  { id: 'ritual_herege_trevas', name: 'Ritual do Herege das Trevas', cat: 'Persona', desc: 'Quando você Derrotar uma Sombra usando uma magia do Tipo Trevas, você pode escolher entre: Reciclar o Custo da Magia utilizada de volta como PM ou causar Metade do Dano utilizado no alvo derrotado anteriormente em até 1d4 alvos que você pode ver (Automaticamente).', prereq: 'Persona possuir Tipo Trevas' },
  { id: 'vanguarda_onipotente', name: 'Vanguarda Onipotente', cat: 'Persona', desc: 'Quando você Acertar um Crítico com uma Magia Onipotente, ignore qualquer teste de esquiva de todos os alvos afetados e rouba seus PM igual sua MAG.', prereq: 'Persona possuir Tipo Onipotente' },
  { id: 'sacerdotisa_milagre', name: 'Sacerdotisa do Milagre Divino', cat: 'Persona', desc: 'Reduz MAG no custo de PM em Magias de Cura & Reviver e quando usar uma magia de Alvo Único pode escolher até MAG = Alvos Extras para receber metade da cura do alvo principal. E sempre que for bem sucedido em Curar um Aliado que estiver acima da Metade da Vida Máxima, retira 1 Efeito de Status maligno.', prereq: 'Persona possuir Tipo Cura' },
  { id: 'olho_onipotente', name: '"O Olho Onipotente que tudo Vê"', cat: 'Persona', desc: 'No início do combate recebe MAG = Contadores para utilizar suas habilidades de Intel. Todo início de rodada a primeira Magia de Intel não consome nenhum tipo de Ação independente do custo. E recebe +5 em Testes contra qualquer Efeito mental.', prereq: 'Persona possuir Tipo Intel' },

  // ── Atributos ──
  { id: 'mente_afiada', name: 'Mente Afiada', cat: 'Atributos', desc: 'Você sempre sabe onde está localizado em relação a outros pontos que já conhece; sempre tem uma estimativa precisa das horas; e recebe Crítico Automático para lembrar-se de qualquer evento que tenha presenciado nos últimos sete dias.', prereq: '10 de Conhecimento' },
  { id: 'impiedoso', name: 'Impiedoso', cat: 'Atributos', desc: 'Pode Re-rolar o acerto de um ataque que você declarou nesse turno com +5 de Acerto. (2 Usos por Combate e recebe +1 Uso nos níveis 6, 12 e 18)', prereq: '5 de Técnica' },
  { id: 'atleta', name: 'Atleta', cat: 'Atributos', desc: 'Calcule seu movimento com FOR ao invés de AGI. Você pode saltar uma distância igual a metade do seu movimento. Você tem sucesso automático em testes de escalada em superfícies até 1m acima da sua altura. (Só pode ser escolhido uma vez)', prereq: '3 de Força' },
  { id: 'duravel', name: 'Durável', cat: 'Atributos', desc: 'Uma vez por dia, você pode escolher um Tipo que sua Persona não seja Fraca contra. Você ganha 5 Redução de Dano contra aquele Tipo por 3 rodadas. Isso não é um efeito de Buff e acumula com efeitos de Buff. (Só pode ser escolhido uma vez)', prereq: '2 de Vitalidade' },
  { id: 'duelista_defensivo', name: 'Duelista Defensivo', cat: 'Atributos', desc: 'Quando você tomar dano de um ataque, você pode dobrar sua Redução de Dano para esse ataque, mas reduza sua Redução de Dano para 0 depois do cálculo de dano até o final do seu próximo turno. (Só pode ser escolhido uma vez)', prereq: '3 de Vitalidade' },
  { id: 'olhos_de_aguia', name: 'Olhos de Águia', cat: 'Atributos', desc: 'Todas as armas que você utilizar ganham a palavra-chave "Tiro Distante 1" enquanto você a tiver equipada. Se a arma já possuir Tiro Distante, aumente o efeito em 1. (Só pode ser escolhido uma vez)', prereq: '3 de Técnica' },
  { id: 'baforada_gigantesca', name: 'Baforada Gigantesca', cat: 'Atributos', desc: 'Magias com alcance limitado ganham +1 de alcance. Habilidades que atingem alvos adjacentes agora podem afetar alvos a um metro a mais de distância do alvo (+1/rank extra). (Só pode ser escolhido uma vez a cada três níveis)', prereq: '4 de Técnica' },
  { id: 'viver_para_servir', name: 'Viver para Servir', cat: 'Atributos', desc: 'Você pode pagar 1 Ponto de Aspecto ao conjurar uma magia de Cura para considerar a rolagem como o valor máximo. (Só pode ser escolhido uma vez)', prereq: '3 de Magia' },
  { id: 'adepto_elemental', name: 'Adepto Elemental', cat: 'Atributos', desc: 'Ao conjurar uma magia do Tipo Fogo, Gelo, Raio, Vento, Nuclear ou PSY, você pode trocar o dano que ela causa pelo dano de qualquer outro Tipo listado acima que a sua Persona possua. (Só pode ser escolhido uma vez. Só pode ser ativado se a sua Persona possui pelo menos dois dos Tipos listados)', prereq: '4 de Magia' },
  { id: 'volatil', name: 'Volátil', cat: 'Atributos', desc: 'Suas magias que atingem mais de um alvo podem acertar um alvo a mais, por rank. (Só pode ser escolhido uma vez a cada quatro níveis)', prereq: '4 de Magia' },
  { id: 'milagre', name: 'Milagre', cat: 'Atributos', desc: 'Uma vez por combate, se seu PV estiver acima de 1 e você receber dano que reduza seu PV para 0 ou menos, role SORd8. Se qualquer um dos seus dados resultar em 5 ou mais, você sobrevive com 1 PV. (Só pode ser escolhido uma vez)', prereq: '3 de Sorte' },
  { id: 'mira_certeira', name: 'Mira Certeira', cat: 'Atributos', desc: 'Você ganha 1 Carga de Sorte a mais no começo de cada combate, por rank. Isso pode exceder seu limite de Cargas. (Só pode ser escolhido quatro vezes)', prereq: '4 de Sorte' },

  // ── Convicção ──
  { id: 'teu_proprio_ser', name: 'Teu Próprio Ser', cat: 'Convicção', desc: 'Você pode alterar a Convicção da sua Persona inicial. (Só pode ser escolhido uma vez a cada quatro níveis)', prereq: 'CNv. 4' },
  { id: 'perseveranca', name: 'Perseverança', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e uma de suas Fraquezas. A Persona perde a Fraqueza selecionada. (Só pode ser escolhido uma vez a cada cinco níveis)', prereq: 'CNv. 10' },
  { id: 'feito_de_ferro', name: 'Feito de Ferro', cat: 'Convicção', desc: 'Cada vez que você escolher esse feito, escolha uma Persona e um Tipo ao qual ela não tem nenhuma interação. A Persona ganha Resistir a esse Tipo. (Só pode ser escolhido duas vezes)', prereq: 'CNv. 10' },
  { id: 'vontade_de_ferro', name: 'Vontade de Ferro', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e um Tipo que ela Resista. A Persona ganha Anular contra o Tipo selecionado. (Só pode ser escolhido duas vezes)', prereq: 'CNv. 10' },
  { id: 'inabalavel', name: 'Inabalável', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e um Tipo que ela Anule ou Reflita. Sacrifique o uso de uma magia do seu deck permanentemente para melhorar a interação do Tipo: De Anular para Refletir e Refletir para Drenar. (Só pode ser escolhido uma vez)', prereq: 'CNv. 10' },
  { id: 'intrinseco', name: 'Intrínseco', cat: 'Convicção', desc: 'Você pode adicionar um novo Aspecto Livre ao seu personagem. (Só pode ser escolhido duas vezes, a segunda escolha só pode ser feita no CNv. 20.)', prereq: 'CNv. 10' }
];
// ===== Lista de Condições (status negativos/temporários) =====
const CONDITIONS_LIST = [
  {
    id: 'charme',
    name: 'Charme',
    desc: 'Põe o personagem sob o controle do Narrador, ou faz um inimigo atacar os próprios aliados e conjurar magias benéficas para os jogadores.\nNo final do turno, chance de recuperação: 33%.'
  },
  {
    id: 'panico',
    name: 'Pânico',
    desc: 'Previne o uso da Persona ou o uso de habilidades especiais do inimigo.\nNo final do turno, chance de recuperação: 33%.'
  },
  {
    id: 'medo',
    name: 'Medo',
    desc: 'Role 2 dados e pegue o pior nas esquivas.\nNo final do turno, chance de recuperação: 33%.\nSe não se recuperar, perde um uso de magia aleatória ou 1 PM.'
  },
  {
    id: 'furia',
    name: 'Fúria',
    desc: 'Aumenta o dano físico causado e recebido em 50%.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.\nVocê pode optar por recusar o teste de recuperação.'
  },
  {
    id: 'atordoado',
    name: 'Atordoado',
    desc: 'Role 2 dados e pegue o pior na esquiva.\nNão pode usar ações Livres, Rápidas ou de Interromper.\nNo final do turno, chance de recuperação: 33%.'
  },
  {
    id: 'choque',
    name: 'Choque',
    desc: 'Todos os ataques recebidos têm sucesso automático.\nAtaques contra o alvo rolam 2 dados e pegam o melhor para críticos.\nNo final do turno, o alvo se recupera automaticamente.'
  },
  {
    id: 'lento',
    name: 'Lento',
    desc: 'Movimento reduzido pela metade.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.'
  },
  {
    id: 'veneno',
    name: 'Veneno',
    desc: 'Causa 20% do seu PV máximo como dano por turno.\nNo final do turno, chance de recuperação: 33%.'
  },
  {
    id: 'derrubado',
    name: 'Derrubado',
    desc: 'Você joga 3 dados de esquiva e pega o pior.\nNo final do turno do personagem o mesmo se recupera.\nUm aliado pode usar ação de movimento para recuperar um personagem instantaneamente.'
  }
];
function initArcanaSelects() {
  const arcSel1 = document.getElementById("CharArcana");
  const arcSel2 = document.getElementById("PerArcana");
  [arcSel1, arcSel2].forEach(sel=>{ if(sel) ARCANAS.forEach(a=>{ const o=document.createElement("option"); o.value=a; o.textContent=a; sel.appendChild(o);}); });
}

// ===== IDs principais =====
const ids = {
  CharClass: $("#CharClass"), CharLvl: $("#CharLvl"), CharArcana: $("#CharArcana"), CharPlayer: $("#CharPlayer"),
  CharSTR: $("#CharSTR"), CharMAG: $("#CharMAG"), CharTEC: $("#CharTEC"), CharAGI: $("#CharAGI"), CharVIT: $("#CharVIT"), CharLCK: $("#CharLCK"),
  MaxHP: $("#MaxHP"), CurrentHP: $("#CurrentHP"), EnergyMax: $("#EnergyMax"), CurrentPM: $("#CurrentPM"), DmgRed: $("#DmgRed"),
  KNOPts: $("#KNOPts"), DISPts: $("#DISPts"), EMPpts: $("#EMPpts"), EXPPts: $("#EXPPts"), COUPts: $("#COUPts"), CHAPts: $("#CHAPts"),
  Aspectos: $("#Aspectos"), AspectPoints: $("#AspectPoints"), Buffs: $("#Buffs"),
  PerName: $("#PerName"), PerArcana: $("#PerArcana"), PerNotes: $("#PerNotes"), Conviction: $("#Conviction"), NaturalSkill: $("#NaturalSkill"), PerLvl: $("#PerLvl"), PerSP: $("#PerSP"), PerTypes: $("#PerTypes"),
  Weapon: $("#Weapon"), WeaponDmg: $("#WeaponDmg"), WeaponReach: $("#WeaponReach"), WeaponEffect: $("#WeaponEffect"),
  Armor: $("#Armor"), ArmorDmgRed: $("#ArmorDmgRed"), ArmorEffect: $("#ArmorEffect"),
  Accessory: $("#Accessory"), AccessoryEffect: $("#AccessoryEffect"),
  Resistances: $("#Resistances"),
  NotesDiary: $("#NotesDiary"), NotesGoals: $("#NotesGoals")
};

// ===== Afinidades Persona =====
// ELEMENTS e EL_IDS já declarados acima
const RELS = ["Normal","Fraco","Resiste","Anula","Reflete","Absorve"];
function buildAffinityTable(){
  const afBody = document.getElementById('af-body');
  if(!afBody) return;
  afBody.innerHTML = '';
  for(let i=0;i<ELEMENTS.length;i+=2){
    const left = ELEMENTS[i]; const right = ELEMENTS[i+1];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${left}</td>
      <td><select id="AF_${EL_IDS[left]}"></select></td>
      ${ right ? `<td>${right}</td><td><select id="AF_${EL_IDS[right]}"></select></td>` : `<td></td><td></td>` }
    `;
    afBody.appendChild(tr);
  }
  const sels = Array.from(document.querySelectorAll("[id^='AF_']"));
  RELS.forEach(r=> sels.forEach(sel=>{ const o=document.createElement('option'); o.value=r; o.textContent=r; sel.appendChild(o); }));
}

// ===== Inicialização principal =====
function initApp() {
  initTabs();
  initArcanaSelects();
  buildAffinityTable();
  buildFeitosUI();
  buildConditionsUI();
  buildSocialUI();
  buildModifiersUI();
  // ...existing code...
}

// ===== FEITOS UI & Lógica =====
function buildFeitosUI(){
  const container = document.getElementById('feitos-list');
  if(!container) return;
  container.innerHTML = '';

  // Agrupar por categoria
  const categories = [];
  const catMap = {};
  FEITOS_LIST.forEach(f => {
    const c = f.cat || 'Outros';
    if(!catMap[c]){ catMap[c] = []; categories.push(c); }
    catMap[c].push(f);
  });

  categories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'feat-group';
    group.innerHTML = `<h3 class="feat-cat-title">${cat}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'feat-grid';

    catMap[cat].forEach(f => {
      const item = document.createElement('div');
      item.className = 'feat-item';
      item.dataset.featId = f.id;
      const prereqText = f.prereq || '';
      const prereqHtml = prereqText ? `<div class="feat-prereq">Pré-requisito: ${prereqText}</div>` : '';
      item.innerHTML = `<label class="feat-label"><input type="checkbox" class="feat-check" data-id="${f.id}"/><span class="feat-name">${f.name}</span></label><div class="feat-desc-text">${f.desc.replace(/\n/g, '<br>')}</div>${prereqHtml}`;
      grid.appendChild(item);
    });

    group.appendChild(grid);
    container.appendChild(group);
  });

  // No-op para compatibilidade
  window.addFeito = function(){};

  window.getFeitos = function(){
    return FEITOS_LIST.map(f => {
      const cb = container.querySelector(`.feat-check[data-id="${f.id}"]`);
      return { id: f.id, ativo: cb ? cb.checked : false };
    }).filter(f => f.ativo);
  };

  window.applyFeitos = function(list){
    container.querySelectorAll('.feat-check').forEach(cb => cb.checked = false);
    container.querySelectorAll('.feat-item').forEach(el => el.classList.remove('feat-active'));
    if(!list || !Array.isArray(list)) return;
    list.forEach(saved => {
      const cb = container.querySelector(`.feat-check[data-id="${saved.id}"]`);
      // Compatibilidade: formato antigo usa 'selected', novo usa 'ativo'
      const isActive = saved.ativo !== undefined ? saved.ativo : saved.selected;
      if(cb && isActive !== false){ cb.checked = true; cb.closest('.feat-item').classList.add('feat-active'); }
    });
  };

  // Toggle visual ao marcar/desmarcar
  container.addEventListener('change', e => {
    if(e.target.classList.contains('feat-check')){
      e.target.closest('.feat-item').classList.toggle('feat-active', e.target.checked);
    }
  });
}

// ===== CONDIÇÕES UI & Lógica =====
function buildConditionsUI(){
  const container = document.getElementById('conditions-list');
  if(!container) return;
  container.innerHTML = '';

  CONDITIONS_LIST.forEach(c => {
    const item = document.createElement('div');
    item.className = 'cond-item';
    item.dataset.condId = c.id;
    item.innerHTML = `<label class="cond-label"><input type="checkbox" class="cond-check" data-id="${c.id}"/><span class="cond-name">${c.name}</span></label><div class="cond-desc-text">${c.desc.replace(/\n/g, '<br>')}</div>`;
    container.appendChild(item);
  });

  // Expose for snapshot
  window.addCondition = function(){}; // no-op, kept for compat
  window.getConditions = function(){
    return CONDITIONS_LIST.map(c => {
      const cb = container.querySelector(`.cond-check[data-id="${c.id}"]`);
      return { id: c.id, ativa: cb ? cb.checked : false };
    }).filter(c => c.ativa);
  };
  window.applyConditions = function(list){
    // Reset all
    container.querySelectorAll('.cond-check').forEach(cb => cb.checked = false);
    container.querySelectorAll('.cond-item').forEach(el => el.classList.remove('cond-active'));
    if(!list || !Array.isArray(list)) return;
    list.forEach(saved => {
      const cb = container.querySelector(`.cond-check[data-id="${saved.id}"]`);
      if(cb && saved.ativa !== false){ cb.checked = true; cb.closest('.cond-item').classList.add('cond-active'); }
    });
  };

  // Toggle visual class on change
  container.addEventListener('change', e => {
    if(e.target.classList.contains('cond-check')){
      e.target.closest('.cond-item').classList.toggle('cond-active', e.target.checked);
    }
  });
}

// ===== Habilidades Sociais: UI e lógica de tiers =====
function buildSocialUI(){
  // Na criação do personagem, o jogador recebe 7 pontos iniciais para distribuir.
  // Após a criação, as habilidades podem crescer livremente sem limite máximo.
  const INITIAL_SOCIAL_POINTS = 7;
  const idsList = ['KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts'];
  const skillMeta = {
    KNOPts: {name:'Conhecimento', titles:['Preguiçoso','Ciente','Sabido','Estudado','Enciclopédico','Erudito'], desc:[
      'Título: Preguiçoso.',
      'Tier I — Ciente: uma vez por dia, revelar uma Fraqueza de uma Sombra que você possa ver.',
      'Tier II — Sabido: uma vez por combate, ganhe +1 DDC contra um ataque que exija teste de esquiva.',
      'Tier III — Estudado: bônus permanente de +1 FOR, +1 MAG ou +1 TEC, sua escolha.',
      'Tier IV — Enciclopédico: uma vez por dia conjurar uma magia Tier III ou menor sem gastar Energia.',
      'Tier V — Erudito: ganha um Aspecto baseado no conhecimento e uma vez por dia pode gastar ação rápida para obter Carga Mental/Carga Poderosa.'
    ]},
    DISPts: {name:'Disciplina', titles:['Desatento','Decente','Persistente','Minucioso','Magistral','Transcendente'], desc:[
      'Tier 0 — Desatento.',
      'Tier I — Decente: +10 PV e +1 de Limite de Energia.',
      'Tier II — Persistente: armaduras ganham +2 Redução de dano.',
      'Tier III — Minucioso: concede um Feito extra.',
      'Tier IV — Magistral: uma vez por combate, adicione metade do seu Tier de Disciplina (arredondado para baixo) a um teste não ofensivo.',
      'Tier V — Transcendente: uma vez por dia, ao invés de morrer, retorna com 50% de vida (conta como Interromper) e ganha um Aspecto de resiliência.'
    ]},
    EMPpts: {name:'Empatia', titles:['Indiferente','Inofensivo','Gentil','Generoso','Altruísta','Angelical'], desc:[
      'Tier 0 — Indiferente.',
      'Tier I — Inofensivo: uma vez por dia, sucesso automático em teste de resistência contra Status Mental.',
      'Tier II — Gentil: uma vez por dia, remover todos os Status Mentais de um aliado que possa ouvir você (ação livre).',
      'Tier III — Generoso: uma vez por dia (movimento) reproduz buff de aliado ou aplicar seu buff a aliado por 2 rodadas.',
      'Tier IV — Altruísta: uma vez por dia, quando consumível não-Especial for usado, role d4; com 3-4 o item não é consumido.',
      'Tier V — Angelical: até 3x/dia, ao curar, pode redirecionar cura para outro alvo; ganha Aspecto de empatia.'
    ]},
    EXPPts: {name:'Expressão', titles:['Monótono','Rudimentar','Eloquente','Inspirador','Tocante','Fascinante'], desc:[
      'Tier 0 — Monótono.',
      'Tier I — Rudimentar: uma vez por dia, como movimento, todos aliados podem tentar um Crítico sem gastar Cargas de Sorte.',
      'Tier II — Eloquente: uma vez por dia (ação rápida), aumentar categoria de esquiva de todos aliados em +1 até fim do próximo turno.',
      'Tier III — Inspirador: uma vez por dia (ação rápida), tentar causar Fúria em unidades em 12m (chance 25 + Tier*4%).',
      'Tier IV — Tocante: uma vez por dia (ação padrão), escolha alvo; por 2 rodadas alvo recebe Margem de Crítico -2 e ataques contra ele não podem errar.',
      'Tier V — Fascinante: uma vez por dia (ação padrão) gasta para dar ação de movimento extra a cada aliado; ganha Aspecto de liderança.'
    ]},
    COUPts: {name:'Coragem', titles:['Tímido','Comum','Determinado','Firme','Destemido','Fodão'], desc:[
      'Tier 0 — Tímido.',
      'Tier I — Comum: uma vez por dia, ao declarar ataque, pode adicionar Redução de Dano ao cálculo de dano (reduz RDM a 0 até fim do turno).',
      'Tier II — Determinado: pode escolher falhar resistência para aplicar o mesmo Status ao conjurador.',
      'Tier III — Firme: escolha ganhar +1 VIT, +1 AGI ou +2 SOR permanente.',
      'Tier IV — Destemido: quando toma dano de tipos elementais, pode ativar efeito Fortificar <Elemento> 1d10 até o fim do combate.',
      'Tier V — Fodão: ganha Aspecto de bravura e uma vez por dia pode ignorar penalties por exceder limite de Energia por um turno com custos posteriores.'
    ]},
    CHAPts: {name:'Charme', titles:['Sem Graça','Existente','Confiante','Suave','Popular','Debonair'], desc:[
      'Tier 0 — Sem Graça.',
      'Tier I — Existente: uma vez por dia, conjurar Pulinpa.',
      'Tier II — Confiante: uma vez por dia, conjurar Dekaja.',
      'Tier III — Suave: uma vez por dia, conjurar Marin Karin; pode usar o dobro do Tier de Charme no lugar de TEC.',
      'Tier IV — Popular: uma vez por dia, como Interromper, pode mudar alvo de ataque inimigo para outro alvo.',
      'Tier V — Debonair: ganha Aspecto de magnetismo e uma vez por bloco pode usar Tier+2 ao invés de Expressão/Empatia para qualquer teste.'
    ]}
  };

  const container = document.getElementById('social-tier-list');
  const remainingEl = document.getElementById('social-remaining');
  const msgEl = document.getElementById('social-msg');
  const poolInput = document.getElementById('socialPoolInput');
  const poolDisplay = document.getElementById('social-pool-display');
  if(!container || !remainingEl) return;

  // build initial UI blocks
  container.innerHTML = '';
  idsList.forEach(id=>{
    const meta = skillMeta[id];
    const wrapper = document.createElement('div'); wrapper.className = 'social-skill'; wrapper.style.padding='8px 0'; wrapper.style.borderBottom='1px dashed rgba(255,255,255,0.03)';
    wrapper.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div style="font-weight:800">${meta.name}</div><div style="text-align:right"><div id="${id}-tier" style="font-weight:900">Tier 0 — ${meta.titles[0]}</div><div id="${id}-short" style="font-size:13px;color:var(--ink-dim)"></div></div></div><div id="${id}-desc" style="margin-top:6px;color:var(--ink);font-size:13px"></div>`;
    container.appendChild(wrapper);
  });

  function updateAll(){
    // Cada habilidade funciona de forma independente, sem limites
    idsList.forEach((id)=>{
      const el = document.getElementById(id);
      if(!el) return;
      // Garantir que o valor seja >= 0
      let val = Number(el.value||0);
      if(val < 0){ el.value = 0; val = 0; }
      
      // update tier display
      const points = Math.max(0, val);
      const tier = Math.min(5, Math.floor(points / 5));
      const meta = skillMeta[id];
      const tierEl = document.getElementById(id+'-tier');
      const shortEl = document.getElementById(id+'-short');
      const descEl = document.getElementById(id+'-desc');
      
      // Se ultrapassar tier 5, manter o último tier conhecido
      const displayTier = tier;
      const displayTitle = meta.titles[displayTier] || meta.titles[meta.titles.length-1];
      const displayDesc = meta.desc[displayTier] || meta.desc[meta.desc.length-1];
      
      if(tierEl) tierEl.textContent = `Tier ${displayTier} — ${displayTitle} (${points} pts)`;
      if(shortEl) shortEl.textContent = displayTitle || '';
      if(descEl) descEl.textContent = displayDesc || '';
    });
    
    // Calcular soma total apenas para informação
    const newSum = idsList.reduce((s,id)=> s + Number(document.getElementById(id).value||0), 0);
    remainingEl.textContent = Math.max(0, INITIAL_SOCIAL_POINTS - newSum);
  }

  // attach listeners - inputs livres, apenas validando >= 0
  idsList.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', ()=>{
      // Validar apenas que não seja negativo
      let val = Number(el.value||0);
      if(val < 0){ el.value = 0; }
      updateAll();
    });
  });

  // initial render
  updateAll();

  // Manter funções para compatibilidade com snapshots antigos, mas sem funcionalidade
  window.setSocialPool = function(n){ 
    // Função mantida apenas para compatibilidade, não faz nada
    return INITIAL_SOCIAL_POINTS; 
  };
  window.getSocialPool = function(){ 
    // Retorna o valor inicial apenas para compatibilidade
    return INITIAL_SOCIAL_POINTS; 
  };
}

// ===== MODIFICADORES GLOBAIS UI & Lógica =====
const MOD_TARGETS = ['STR','MAG','TEC','AGI','VIT','LCK','HP','PM'];

function buildModifiersUI(){
  const body = document.querySelector('#tbl-mod tbody');
  if(!body) return;
  const btn = document.getElementById('add-mod');
  const summary = document.getElementById('mod-summary');

  function addMod(data={nome:'', tipo:'flat', valor:0, alvo:'STR', ativo:true}){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class="mod-nome" placeholder="Nome do modificador"/></td>
                    <td><select class="mod-tipo"><option value="flat">Flat (+/-)</option><option value="percentual">Percentual (%)</option></select></td>
                    <td><input class="mod-valor" type="number" value="0" style="width:80px;"/></td>
                    <td><select class="mod-alvo"></select></td>
                    <td style="text-align:center"><input type="checkbox" class="mod-ativo" checked/></td>
                    <td class="row-actions"><button class="mini del">Remover</button></td>`;
    body.appendChild(tr);
    const alvoSel = tr.querySelector('.mod-alvo');
    MOD_TARGETS.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; alvoSel.appendChild(o); });
    tr.querySelector('.mod-nome').value = data.nome||'';
    tr.querySelector('.mod-tipo').value = data.tipo||'flat';
    tr.querySelector('.mod-valor').value = data.valor||0;
    alvoSel.value = data.alvo||'STR';
    tr.querySelector('.mod-ativo').checked = data.ativo !== false;

    function onChange(){ updateModSummary(); if(typeof window._recalcWithMods === 'function') window._recalcWithMods(); }
    tr.querySelector('.mod-nome').addEventListener('input', onChange);
    tr.querySelector('.mod-tipo').addEventListener('change', onChange);
    tr.querySelector('.mod-valor').addEventListener('input', onChange);
    alvoSel.addEventListener('change', onChange);
    tr.querySelector('.mod-ativo').addEventListener('change', onChange);
    tr.querySelector('.del').addEventListener('click', ()=>{ tr.remove(); onChange(); });
  }

  function getMods(){
    return body ? Array.from(body.querySelectorAll('tr')).map(tr=>({
      nome: tr.querySelector('.mod-nome').value,
      tipo: tr.querySelector('.mod-tipo').value,
      valor: Number(tr.querySelector('.mod-valor').value)||0,
      alvo: tr.querySelector('.mod-alvo').value,
      ativo: !!tr.querySelector('.mod-ativo').checked
    })) : [];
  }

  function getActiveMods(){
    return getMods().filter(m=> m.ativo && m.valor !== 0);
  }

  function applyModifiers(baseValues){
    const result = {};
    MOD_TARGETS.forEach(t=> result[t] = baseValues[t] || 0);
    const actives = getActiveMods();
    // Apply flat first, then percentual
    actives.filter(m=> m.tipo === 'flat').forEach(m=>{
      if(result[m.alvo] !== undefined) result[m.alvo] += m.valor;
    });
    actives.filter(m=> m.tipo === 'percentual').forEach(m=>{
      if(result[m.alvo] !== undefined) result[m.alvo] = Math.round(result[m.alvo] * (1 + m.valor / 100));
    });
    // Clamp to 0 minimum
    MOD_TARGETS.forEach(t=>{ if(result[t] < 0) result[t] = 0; });
    return result;
  }

  function updateModSummary(){
    if(!summary) return;
    const actives = getActiveMods();
    if(actives.length === 0){ summary.style.display = 'none'; return; }
    summary.style.display = 'block';
    const parts = actives.map(m=>{
      const sign = m.valor >= 0 ? '+' : '';
      const suffix = m.tipo === 'percentual' ? '%' : '';
      return `<b>${m.alvo}</b> ${sign}${m.valor}${suffix} (${m.nome||'sem nome'})`;
    });
    summary.innerHTML = '⚡ Ativos: ' + parts.join(' · ');
  }

  // expose globally
  window.addMod = addMod;
  window.getMods = getMods;
  window.getActiveMods = getActiveMods;
  window.applyModifiers = applyModifiers;

  if(btn) btn.addEventListener('click', ()=> addMod());
  updateModSummary();
}

(function(){
  initApp();
  // ...existing code...

  // ===== Expand buttons for textareas =====
  function initExpandButtons(){
    Array.from(document.querySelectorAll('.expand-btn')).forEach(btn=>{
      const targetId = btn.dataset.target;
      const target = document.getElementById(targetId);
      if(!target) return;
      btn.addEventListener('click', ()=>{
        target.classList.toggle('expanded');
        btn.textContent = target.classList.contains('expanded') ? '⤢' : '⤡';
        // focus the textarea when expanded
        if(target.classList.contains('expanded')) target.focus();
      });
    });
  }
  // initialize after seed
  initExpandButtons();

  // ===== Auto-resize textareas =====
  function autoResizeTextarea(textarea){
    if(!textarea || textarea.tagName !== 'TEXTAREA') return;
    if(textarea.offsetParent === null) return;
    textarea.style.overflowY = 'auto';
    textarea.style.height = 'auto';
    const maxHeight = 420;
    const style = window.getComputedStyle(textarea);
    const minHeight = parseFloat(style.minHeight) || textarea.offsetHeight || 0;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = Math.max(newHeight, minHeight) + 'px';
  }
  function initAutoResizeTextareas(){
    Array.from(document.querySelectorAll('textarea')).forEach(textarea=>{
      autoResizeTextarea(textarea);
      if(textarea.dataset.autoresizeInit !== '1'){
        textarea.addEventListener('input', ()=> autoResizeTextarea(textarea));
        textarea.dataset.autoresizeInit = '1';
      }
    });
  }
  window.autoResizeTextarea = autoResizeTextarea;
  window.initAutoResizeTextareas = initAutoResizeTextareas;
  initAutoResizeTextareas();
  // also monitor for dynamically added textareas
  const observer = new MutationObserver(()=> initAutoResizeTextareas());
  observer.observe(document.body, { childList: true, subtree: true });

  function recalc(options = {}){
    const keepMaxValues = !!options.keepMaxValues;
    const lvl = clampInt(ids.CharLvl?.value||1,1,99);
  const vit = clampInt(ids.CharVIT?.value||1,1,12);
    if(ids.MaxHP && !keepMaxValues) ids.MaxHP.value = 25 + ((5 + vit) * lvl);
  const mag = clampInt(ids.CharMAG?.value||1,1,99);
    const pmBase = 15 + ((mag + 5) * 2);
    const pmMax = pmBase + ((lvl - 1) * 5);
    if(ids.EnergyMax && !keepMaxValues) ids.EnergyMax.value = Math.trunc(pmMax);

    // Aplicar modificadores globais nos badges e valores calculados
    if(typeof window.applyModifiers === 'function'){
      const baseVals = {
        STR: clampInt(ids.CharSTR?.value||1,1,12),
        MAG: clampInt(ids.CharMAG?.value||1,1,12),
        TEC: clampInt(ids.CharTEC?.value||1,1,12),
        AGI: clampInt(ids.CharAGI?.value||1,1,12),
        VIT: clampInt(ids.CharVIT?.value||1,1,12),
        LCK: clampInt(ids.CharLCK?.value||1,1,12),
        HP: Number(ids.MaxHP?.value||0),
        PM: Number(ids.EnergyMax?.value||0)
      };
      const modded = window.applyModifiers(baseVals);
      ["STR","MAG","TEC","AGI","VIT","LCK"].forEach(k=>{
        const el = document.getElementById("b"+k);
        if(el) el.textContent = modded[k] !== baseVals[k] ? `${modded[k]} (${baseVals[k]})` : baseVals[k];
      });
      if(ids.MaxHP && !keepMaxValues && modded.HP !== baseVals.HP) ids.MaxHP.value = modded.HP;
      if(ids.EnergyMax && !keepMaxValues && modded.PM !== baseVals.PM) ids.EnergyMax.value = modded.PM;
    } else {
      ["STR","MAG","TEC","AGI","VIT","LCK"].forEach(k=>{
        const el = document.getElementById("b"+k);
        if(el && ids["Char"+k]) el.textContent = ids["Char"+k].value;
      });
    }
    validateCurrentValues();
  }
  window._recalcWithMods = recalc;
  function validateCurrentValues(){
    const maxHP = clampInt(ids.MaxHP?.value||0,0,9999);
    if(ids.MaxHP) ids.MaxHP.value = maxHP;
    const currentHP = clampInt(ids.CurrentHP?.value||0,0,9999);
    if(ids.CurrentHP) ids.CurrentHP.value = Math.min(currentHP, maxHP);
    const maxPM = clampInt(ids.EnergyMax?.value||0,0,9999);
    if(ids.EnergyMax) ids.EnergyMax.value = maxPM;
    const currentPM = clampInt(ids.CurrentPM?.value||0,0,9999);
    if(ids.CurrentPM) ids.CurrentPM.value = Math.min(currentPM, maxPM);
  }
  [ids.CharLvl, ids.CharVIT, ids.CharAGI, ids.CharSTR, ids.CharMAG, ids.CharTEC, ids.CharLCK].forEach(el=>{ if(el) el.addEventListener("input", recalc); });
  if(ids.MaxHP) ids.MaxHP.addEventListener("input", validateCurrentValues);
  if(ids.EnergyMax) ids.EnergyMax.addEventListener("input", validateCurrentValues);
  if(ids.CurrentHP) ids.CurrentHP.addEventListener("input", validateCurrentValues);
  if(ids.CurrentPM) ids.CurrentPM.addEventListener("input", validateCurrentValues);
  recalc();

  // ====== Equipamentos ======
  const eqBody = $("#tbl-eq tbody");
  const addEqBtn = $("#add-eq");
  if(addEqBtn) addEqBtn.addEventListener("click", ()=> addEq());
  function addEq(data={tipo:"Item", nome:"", efeito:""}){
    if(!eqBody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><select class="eq-tipo"><option>Arma</option><option>Armadura</option><option>Acessório</option><option>Item</option></select></td>
                    <td><input class="eq-nome" placeholder="Nome"/></td>
                    <td><textarea class="eq-ef" rows="1" placeholder="Efeito/Notas"></textarea></td>
                    <td class="row-actions"><button class="mini del">Remover</button></td>`;
    eqBody.appendChild(tr);
    const [tipo,nome,ef] = [tr.querySelector('.eq-tipo'), tr.querySelector('.eq-nome'), tr.querySelector('.eq-ef')];
    tipo.value = data.tipo||"Item"; nome.value = data.nome||""; ef.value = data.efeito||"";
    tr.querySelector('.del').addEventListener('click', ()=> tr.remove());
  }
  function getEquip(){ return eqBody? Array.from(eqBody.querySelectorAll('tr')).map(tr=>({ tipo: tr.querySelector('.eq-tipo').value, nome: tr.querySelector('.eq-nome').value, efeito: tr.querySelector('.eq-ef').value })) : []; }

  // ====== Magias ======
  const spellBody = $("#tbl-spell tbody");
  const addSpellBtn = $("#add-spell");
  if(addSpellBtn) addSpellBtn.addEventListener("click", ()=> addSpell());
  
  function moveSpellRow(tr, direction){
    if(!tr || !spellBody) return;
    const rows = Array.from(spellBody.querySelectorAll('tr'));
    const idx = rows.indexOf(tr);
    if(idx === -1) return;
    if(direction === 'up' && idx > 0){
      spellBody.insertBefore(tr, rows[idx-1]);
    } else if(direction === 'down' && idx < rows.length - 1){
      spellBody.insertBefore(tr, rows[idx+2]);
    }
  }
  
    function addSpell(data={nome:"", tipo:"Físico", custo:"", efeito:""}){
    if(!spellBody) return;
    const tr = document.createElement("tr");
  tr.innerHTML = `<td><textarea class="sp-n" rows="1" placeholder="Magia/Técnica" style="width:100%;resize:vertical"></textarea></td>
          <td><input class="sp-c" placeholder="Alvo"/></td>
          <td><select class="sp-t"></select></td>
          <td><textarea class="sp-e" rows="2" placeholder="Efeito" style="width:100%;resize:vertical"></textarea></td>
          <td><input class="sp-tier" placeholder="Nível"/></td>
          <td><input class="sp-uses" placeholder="PM"/></td>
          <td class="row-actions"><button class="mini up" title="Mover para cima">↑</button><button class="mini down" title="Mover para baixo">↓</button><button class="mini del">X</button></td>`;
      spellBody.appendChild(tr);
      const tsel = tr.querySelector('.sp-t'); 
      ["Físico","Fogo","Gelo","Vento","Raio","Nuclear","PSY","Luz","Trevas","Suporte","Controle"].forEach(t=>{ 
        const o=document.createElement('option'); o.textContent=t; tsel.appendChild(o); 
      });
      // support both textarea and input fallback for older snapshots
      const nameEl = tr.querySelector('.sp-n');
      if(nameEl) nameEl.value = data.nome||"";
      tsel.value = data.tipo||"Físico"; 
      tr.querySelector('.sp-c').value = data.custo||""; 
      tr.querySelector('.sp-e').value = data.efeito||""; 
      if(data.tier != null) tr.querySelector('.sp-tier').value = data.tier;
      if(data.uses != null) tr.querySelector('.sp-uses').value = data.uses;
      tr.querySelector('.del').addEventListener('click', ()=> tr.remove());
      tr.querySelector('.up').addEventListener('click', ()=> moveSpellRow(tr, 'up'));
      tr.querySelector('.down').addEventListener('click', ()=> moveSpellRow(tr, 'down'));
  }
  function getSpells(){ return spellBody? Array.from(spellBody.querySelectorAll('tr')).map(tr=>({ nome: (tr.querySelector('.sp-n')?.value||''), tipo: tr.querySelector('.sp-t').value, custo: tr.querySelector('.sp-c').value, efeito: (tr.querySelector('.sp-e')?.value||''), tier: (tr.querySelector('.sp-tier')?.value||''), uses: (tr.querySelector('.sp-uses')?.value||'') })) : []; }

  // ====== Vínculos ======
  const linkBody = $("#tbl-link tbody");
  const addLinkBtn = $("#add-link");
  if(addLinkBtn) addLinkBtn.addEventListener("click", ()=> addLink());
  function addLink(data={nome:"", arcana:"", rank:1, obs:""}){
    if(!linkBody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input class="lk-n" placeholder="Nome do NPC"/></td>
                    <td><select class="lk-a"></select></td>
                    <td><input class="lk-r" type="number" min="1" max="10" value="1"/></td>
                    <td><textarea class="lk-o" rows="1" placeholder="Observações"></textarea></td>
                    <td class="row-actions"><button class="mini del">Remover</button></td>`;
    linkBody.appendChild(tr);
    const asel = tr.querySelector('.lk-a'); ARCANAS.forEach(a=>{ const o=document.createElement('option'); o.textContent=a; o.value=a; asel.appendChild(o); });
    tr.querySelector('.lk-n').value = data.nome||""; asel.value = data.arcana||""; tr.querySelector('.lk-r').value = data.rank||1; tr.querySelector('.lk-o').value = data.obs||"";
    tr.querySelector('.del').addEventListener('click', ()=> tr.remove());
  }
  function getLinks(){ return linkBody? Array.from(linkBody.querySelectorAll('tr')).map(tr=>({ nome: tr.querySelector('.lk-n').value, arcana: tr.querySelector('.lk-a').value, rank: clampInt(tr.querySelector('.lk-r').value,1,10), obs: tr.querySelector('.lk-o').value })) : []; }

  // ====== PISTAS ======
  const clueBody = $("#tbl-clue tbody");
  const addClueBtn = $("#add-clue");
  if(addClueBtn) addClueBtn.addEventListener("click", ()=> addClue());
  function addClue(data={titulo:"", desc:"", evid:"", status:"Aberta"}){
    if(!clueBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class="cl-t" placeholder="Título"/></td>
                    <td><textarea class="cl-d" rows="1" placeholder="Descrição / Ancoragem"></textarea></td>
                    <td><textarea class="cl-e" rows="1" placeholder="Evidência (onde/quem/como)"></textarea></td>
                    <td><select class="cl-s"><option>Aberta</option><option>Em andamento</option><option>Resolvida</option></select></td>
                    <td class="row-actions"><button class="mini del">Remover</button></td>`;
    clueBody.appendChild(tr);
    tr.querySelector('.cl-t').value = data.titulo||"";
    tr.querySelector('.cl-d').value = data.desc||"";
    tr.querySelector('.cl-e').value = data.evid||"";
    tr.querySelector('.cl-s').value = data.status||"Aberta";
    tr.querySelector('.del').addEventListener('click', ()=> tr.remove());
  }
  function getClues(){ return clueBody? Array.from(clueBody.querySelectorAll('tr')).map(tr=>({ titulo: tr.querySelector('.cl-t').value, desc: tr.querySelector('.cl-d').value, evid: tr.querySelector('.cl-e').value, status: tr.querySelector('.cl-s').value })) : []; }

  // ====== CONTATOS ======
  const cttBody = $("#tbl-ctt tbody");
  const addCttBtn = $("#add-ctt");
  if(addCttBtn) addCttBtn.addEventListener("click", ()=> addCtt());
  function addCtt(data={nome:"", tipo:"NPC", obs:""}){
    if(!cttBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class="ct-n" placeholder="Nome"/></td>
                    <td><select class="ct-t"><option>NPC</option><option>Local</option><option>Clube</option><option>Comércio</option></select></td>
                    <td><textarea class="ct-o" rows="1" placeholder="Observações / pistas / horários"></textarea></td>
                    <td class="row-actions"><button class="mini del">Remover</button></td>`;
    cttBody.appendChild(tr);
    tr.querySelector('.ct-n').value = data.nome||"";
    tr.querySelector('.ct-t').value = data.tipo||"NPC";
    tr.querySelector('.ct-o').value = data.obs||"";
    tr.querySelector('.del').addEventListener('click', ()=> tr.remove());
  }
  function getCtts(){ return cttBody? Array.from(cttBody.querySelectorAll('tr')).map(tr=>({ nome: tr.querySelector('.ct-n').value, tipo: tr.querySelector('.ct-t').value, obs: tr.querySelector('.ct-o').value })) : []; }

  // ====== Persistência ======
  function snapshot(){
    // collect affinities
    const affin = {}; ELEMENTS.forEach(e=>{ const id = 'AF_'+EL_IDS[e]; const sel = document.getElementById(id); affin[e] = sel? sel.value : 'Normal'; });
    // portrait src if present
    const portraitSrc = document.querySelector('#portraitPreview img')?.src || '';
    // background fields
    const bgEls = Array.from(document.querySelectorAll('[id^="bg"]'));
    const background = {};
    bgEls.forEach(el=> background[el.id] = el.value||'');

    return {
      id:"ficha-yby-p3r-skin",
      acessoRapido:{
        CharClass: ids.CharClass?.value||"", CharLvl: ids.CharLvl?.value||"", CharArcana: ids.CharArcana?.value||"", CharPlayer: ids.CharPlayer?.value||"",
        CharSTR: ids.CharSTR?.value||"", CharMAG: ids.CharMAG?.value||"", CharTEC: ids.CharTEC?.value||"", CharAGI: ids.CharAGI?.value||"", CharVIT: ids.CharVIT?.value||"", CharLCK: ids.CharLCK?.value||"",
        MaxHP: ids.MaxHP?.value||"", CurrentHP: ids.CurrentHP?.value||"", EnergyMax: ids.EnergyMax?.value||"", CurrentPM: ids.CurrentPM?.value||"", DmgRed: ids.DmgRed?.value||"",
        pvMax: ids.MaxHP?.value||"", pvAtual: ids.CurrentHP?.value||"", pmMax: ids.EnergyMax?.value||"", pmAtual: ids.CurrentPM?.value||"",
        KNOPts: ids.KNOPts?.value||"", DISPts: ids.DISPts?.value||"", EMPpts: ids.EMPpts?.value||"", EXPPts: ids.EXPPts?.value||"", COUPts: ids.COUPts?.value||"", CHAPts: ids.CHAPts?.value||"",
        Aspectos: ids.Aspectos?.value||"", AspectPoints: ids.AspectPoints?.value||"", Buffs: ids.Buffs?.value||"",
        PerName: ids.PerName?.value||"", PerArcana: ids.PerArcana?.value||"", PerLvl: ids.PerLvl?.value||"", PerNotes: ids.PerNotes?.value||"", PerSP: ids.PerSP?.value||"", PerTypes: ids.PerTypes?.value||"",
        Weapon: ids.Weapon?.value||"", WeaponDmg: ids.WeaponDmg?.value||"", WeaponReach: ids.WeaponReach?.value||"", WeaponEffect: ids.WeaponEffect?.value||"",
        Armor: ids.Armor?.value||"", ArmorDmgRed: ids.ArmorDmgRed?.value||"", ArmorEffect: ids.ArmorEffect?.value||"",
        Accessory: ids.Accessory?.value||"", AccessoryEffect: ids.AccessoryEffect?.value||"",
        Resistances: ids.Resistances?.value||""
      },
      persona: { PerName: ids.PerName?.value||"", PerArcana: ids.PerArcana?.value||"", PerLvl: ids.PerLvl?.value||1, PerNotes: ids.PerNotes?.value||"", Conviction: ids.Conviction?.value||"", NaturalSkill: ids.NaturalSkill?.value||"", PerSP: ids.PerSP?.value||0, PerTypes: ids.PerTypes?.value||"" },
      affinities: affin,
      spells: getSpells(),
      feitos: (window.getFeitos? window.getFeitos() : []),
      equip: getEquip(),
      links: getLinks(),
      notes: { diary: ids.NotesDiary?.value||"", goals: ids.NotesGoals?.value||"", clues: getClues(), contacts: getCtts() },
      portrait: { src: portraitSrc },
      background: background,
      conditions: (window.getConditions ? window.getConditions() : []),
      modifiers: (window.getMods ? window.getMods() : [])
    };
  }
  function applySnapshot(data){
    if(!data) return;
  const g = data.acessoRapido||{};
  Object.keys(g).forEach(k=>{ if(ids[k]){ if(ids[k].tagName==="DIV") ids[k].textContent=g[k]; else ids[k].value=g[k]; } });
  if(ids.MaxHP && g.pvMax != null && g.pvMax !== "") ids.MaxHP.value = g.pvMax;
  if(ids.CurrentHP && g.pvAtual != null && g.pvAtual !== "") ids.CurrentHP.value = g.pvAtual;
  if(ids.EnergyMax && g.pmMax != null && g.pmMax !== "") ids.EnergyMax.value = g.pmMax;
  if(ids.CurrentPM && g.pmAtual != null && g.pmAtual !== "") ids.CurrentPM.value = g.pmAtual;
  const hasCurrentHP = (g.CurrentHP != null && g.CurrentHP !== "") || (g.pvAtual != null && g.pvAtual !== "");
  const hasCurrentPM = (g.CurrentPM != null && g.CurrentPM !== "") || (g.pmAtual != null && g.pmAtual !== "");

  // persona
  if (data.persona) {
    if(ids.PerName) ids.PerName.value = data.persona.PerName || ids.PerName.value || '';
    if(ids.PerArcana) ids.PerArcana.value = data.persona.PerArcana || ids.PerArcana.value || '';
    if(ids.PerLvl) ids.PerLvl.value = data.persona.PerLvl || ids.PerLvl.value || 1;
    if(ids.PerNotes) ids.PerNotes.value = data.persona.PerNotes || ids.PerNotes.value || '';
    if(ids.Conviction) ids.Conviction.value = data.persona.Conviction || ids.Conviction.value || '';
    if(ids.NaturalSkill) ids.NaturalSkill.value = data.persona.NaturalSkill || ids.NaturalSkill.value || '';
    if(ids.PerSP) ids.PerSP.value = data.persona.PerSP || ids.PerSP.value || '';
    if(ids.PerTypes) ids.PerTypes.value = data.persona.PerTypes || ids.PerTypes.value || '';
  }

  // Afinidades
  if (data.affinities) {
    ELEMENTS.forEach(e=>{
      const sel = document.getElementById('AF_'+EL_IDS[e]); if (sel) sel.value = data.affinities[e] || 'Normal';
    });
  }

  // Recria tabelas dinâmicas
  eqBody.innerHTML = '';
  (data.equip||[]).forEach(addEq);

  spellBody.innerHTML = '';
  (data.spells||[]).forEach(addSpell);

  linkBody.innerHTML = '';
  (data.links||[]).forEach(addLink);

  clueBody.innerHTML = '';
  (data.notes?.clues||[]).forEach(addClue);

  cttBody.innerHTML = '';
  (data.notes?.contacts||[]).forEach(addCtt);

  // Feitos - restaurar checkboxes fixos
  try{
    if(window.applyFeitos){
      window.applyFeitos(data.feitos||[]);
    }
  }catch(e){}

  // Condições - restaurar checkboxes fixos
  try{
    if(window.applyConditions){
      window.applyConditions(data.conditions||[]);
    }
  }catch(e){}

  // Modificadores Globais - limpar e restaurar
  try{
    const mbody = document.querySelector('#tbl-mod tbody');
    if(mbody){ mbody.innerHTML = ''; }
    if(mbody && window.addMod){
      (data.modifiers||[]).forEach(m=>{
        window.addMod(m);
      });
    }
  }catch(e){}

  // Notas gerais
  if(ids.NotesDiary) ids.NotesDiary.value = data.notes?.diary || "";
  if(ids.NotesGoals) ids.NotesGoals.value = data.notes?.goals || "";

  // Portrait
  if (data.portrait && data.portrait.src) {
    const prev = document.getElementById('portraitPreview'); if (prev) prev.innerHTML = `<img src='${data.portrait.src}' alt='Retrato' style='max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);'/>`;
  }

  // Background
  if (data.background) {
    Object.entries(data.background).forEach(([id,val])=>{ const el = document.getElementById(id); if(el) el.value = val; });
  }

  // socialPool não é mais usado, mas mantemos compatibilidade silenciosa com snapshots antigos
  const hasSavedMax = (g.MaxHP != null && g.MaxHP !== "") || (g.pvMax != null && g.pvMax !== "") || (g.EnergyMax != null && g.EnergyMax !== "") || (g.pmMax != null && g.pmMax !== "");
  recalc({ keepMaxValues: hasSavedMax });
  if(ids.CurrentHP && !hasCurrentHP) ids.CurrentHP.value = ids.MaxHP?.value || 0;
  if(ids.CurrentPM && !hasCurrentPM) ids.CurrentPM.value = ids.EnergyMax?.value || 0;
  validateCurrentValues();
  if(typeof window.initAutoResizeTextareas === 'function') window.initAutoResizeTextareas();
  }

  const saveBtn = document.getElementById("save");
  if(saveBtn) saveBtn.addEventListener("click", ()=>{
    // Validação de campos obrigatórios
    const obrigatorios = [ids.CharClass, ids.CharPlayer, ids.PerName];
    let faltando = obrigatorios.filter(f => !f.value.trim());
    if (faltando.length > 0) {
      faltando.forEach(f => { f.classList.add('input-error'); f.focus(); });
      const camposNomes = faltando.map(f => {
        const label = f.closest('div').querySelector('label').textContent.trim();
        return label.split('*')[0].trim();
      }).join(', ');
      showToast(`Preencha: ${camposNomes}`, 'error', 3500);
      setTimeout(() => faltando.forEach(f => f.classList.remove('input-error')), 2000);
      return;
    }
    localStorage.setItem("ficha-yby-p3r-skin", JSON.stringify(snapshot()));
    showToast("✓ Ficha salva com sucesso", 'success');
  });
  const loadBtn = document.getElementById("load");
  if(loadBtn) loadBtn.addEventListener("click", ()=>{ 
    const raw=localStorage.getItem("ficha-yby-p3r-skin"); 
    if(!raw) return showToast("Nenhuma ficha salva", 'info'); 
    try{ applySnapshot(JSON.parse(raw)); showToast("✓ Ficha carregada", 'success'); }catch(e){ showToast("Erro ao carregar ficha", 'error'); } 
  });
  const exportBtn = document.getElementById("export");
  if(exportBtn) exportBtn.addEventListener("click", ()=>{ const blob = new Blob([JSON.stringify(snapshot(),null,2)], {type:"application/json"}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=((ids.CharPlayer?.value||'ficha')+".json"); a.click(); URL.revokeObjectURL(a.href); showToast("✓ Ficha exportada", 'success'); });
  const importBtn = document.getElementById("import");
  if(importBtn) importBtn.addEventListener("click", ()=>{ const i=document.createElement('input'); i.type='file'; i.accept='application/json'; i.onchange=()=>{ const f=i.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ applySnapshot(JSON.parse(r.result)); showToast("✓ Ficha importada", 'success'); }catch(e){ showToast("Erro ao importar ficha", 'error'); } }; r.readAsText(f); }; i.click(); });

  // ====== PDF ======
  const fillBtn = document.getElementById("fill");
  if(fillBtn) fillBtn.addEventListener("click", ()=> {
    const pdfFileBtn = document.getElementById("pdfFile");
    if(pdfFileBtn) pdfFileBtn.click();
  });
  const pdfFileEl = document.getElementById("pdfFile");
  if(pdfFileEl) pdfFileEl.addEventListener("change", async (ev)=>{
    const file = ev.target.files[0]; if(!file) return;
    const ab = await file.arrayBuffer(); const pdfDoc = await PDFLib.PDFDocument.load(ab); const form = pdfDoc.getForm();
    function setTxt(name, val){ try{ const field=form.getField(name); if(field.setText) field.setText(String(val??"")); else if(field.select) field.select(String(val??"")); }catch(e){} }
    const s = snapshot(); const g = s.acessoRapido || {}; const p = s.persona || {}; const n = s.notes || {};
    const map = {
      CharName: g.PerName || g.CharPlayer || '', CharPlayer: g.CharPlayer || '', CharClass: g.CharClass || '', CharLvl: g.CharLvl || '', CharArcana: g.CharArcana || '',
      CharSTR: g.CharSTR || '', CharMAG: g.CharMAG || '', CharTEC: g.CharTEC || '', CharAGI: g.CharAGI || '', CharVIT: g.CharVIT || '', CharLCK: g.CharLCK || '',
      MaxHP: g.MaxHP || '', CurrentHP: g.CurrentHP || '', EnergyMax: g.EnergyMax || '', CurrentPM: g.CurrentPM || '', DmgRed: g.DmgRed || '',
      KNOPts: g.KNOPts || '', DISPts: g.DISPts || '', EMPpts: g.EMPpts || '', CHAPts: g.CHAPts || '', EXPPts: g.EXPPts || '', COUPts: g.COUPts || '',
      PerName: p.PerName || g.PerName || '', PerArcana: p.PerArcana || g.PerArcana || '', PerLvl: p.PerLvl || g.PerLvl || '', PerNotes: p.PerNotes || g.PerNotes || '',
      EquipList: (s.equip||[]).map(e=>`[${e.tipo}] ${e.nome} — ${e.efeito}`).join("\n"),
      SpellList: (s.spells||[]).map(sp=>`${sp.nome} (${sp.tipo}, ${sp.custo}) — ${sp.efeito}`).join("\n"),
      LinksList: (s.links||[]).map(l=>`${l.nome} — ${l.arcana} Rk.${l.rank} ${l.obs?('— '+l.obs):''}`).join("\n"),
      NotesDiary: n.diary || '', NotesGoals: n.goals || '',
      NotesClues: (n.clues||[]).map(c=>`• ${c.titulo}: ${c.desc} [${c.evid}] (${c.status})`).join("\n"),
      NotesContacts: (n.contacts||[]).map(c=>`• ${c.nome} (${c.tipo}) — ${c.obs}`).join("\n")
    };
    const AF_MAP = {"Físico":"AF_Fisico","Fogo":"AF_Fogo","Gelo":"AF_Gelo","Vento":"AF_Vento","Raio":"AF_Raio","Nuclear":"AF_Nuclear","PSY":"AF_PSY","Luz":"AF_Luz","Trevas":"AF_Trevas","Onipotente":"AF_Onipotente"};
    // use saved affinities if present
    Object.entries(AF_MAP).forEach(([k,campo])=> setTxt(campo, (s.affinities && s.affinities[k]) || 'Normal'));
    Object.entries(map).forEach(([k,v])=> setTxt(k,v));

    const filled = await pdfDoc.save(); const blob = new Blob([filled], {type:"application/pdf"}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(g.CharName||'ficha')+" - Preenchida.pdf"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });

  // ====== PNG ======
  const pngBtn = document.getElementById("png");
  if(pngBtn) pngBtn.addEventListener("click", async ()=>{
    if(typeof html2canvas!=="function"){ showToast("html2canvas bloqueado no preview. Teste local.", 'error', 3500); return; }
    const node = document.getElementById('captureRoot');
    if(!node) return;
    const canvas = await html2canvas(node, {backgroundColor:null, scale:2, useCORS:true});
    canvas.toBlob((blob)=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=((ids.CharPlayer?.value||'ficha')+".png"); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); });
  });

  // ====== PRINT ======
  const printBtn = document.getElementById('print');
  if(printBtn) printBtn.addEventListener('click', ()=> window.print());

  // ====== TESTES ======
  function runTests(){
    const out = document.getElementById('tests-out');
    const card = document.getElementById('tests-card');
    if(card) card.style.display = 'block';
    const logs = [];
    function ok(name, cond, expect, got){ logs.push(`${cond?'✅':'❌'} ${name}${cond?'':` — esperado ${expect}, obtido ${got}`}`); }

    const backup = snapshot();

    ids.CharLvl.value = 1; ids.CharVIT.value = 1; ids.CharAGI.value = 2; recalc();
    ok('PV lvl1/VIT1 = 31', Number(ids.MaxHP.value) === 31, 31, ids.MaxHP.value);
    ok('EN lvl1/VIT1 = 20', Number(ids.EnergyMax.value) === 20, 20, ids.EnergyMax.value);

    ids.CharLvl.value = 10; ids.CharVIT.value = 4; ids.CharAGI.value = 3; recalc();
    ok('PV lvl10/VIT4 = 115', Number(ids.MaxHP.value) === 115, 115, ids.MaxHP.value);
    ok('EN lvl10/VIT4 = 65', Number(ids.EnergyMax.value) === 65, 65, ids.EnergyMax.value);
    // Init field not present; check AGI badge instead
    ok('Init = AGI (badge bAGI)', Number(document.getElementById('bAGI')?.textContent||0) === 3, 3, document.getElementById('bAGI')?.textContent||'');

    const afCount = document.querySelectorAll('[id^="AF_"]').length;
    ok('Afinidades — 10 selects', afCount === 10, 10, afCount);

    applySnapshot(backup);

    if(out) out.innerHTML = logs.map(l=>`<div>${l}</div>`).join('');
  }
  const testsBtn = document.getElementById('tests');
  if(testsBtn) testsBtn.addEventListener('click', runTests);

  // Seed visual
  function seed(){
    const btnEq = document.getElementById('add-eq');
    if(btnEq) btnEq.click();
    const btnSpell = document.getElementById('add-spell');
    if(btnSpell) btnSpell.click();
    const btnLink = document.getElementById('add-link');
    if(btnLink) btnLink.click();
    const btnClue = document.getElementById('add-clue');
    if(btnClue) btnClue.click();
    const btnCtt = document.getElementById('add-ctt');
    if(btnCtt) btnCtt.click();
  }
  seed();

  // ===== Auto-Load: restaurar dados do localStorage ao abrir =====
  try {
    const raw = localStorage.getItem("ficha-yby-p3r-skin");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object' && data.id === "ficha-yby-p3r-skin") {
        applySnapshot(data);
      } else {
        console.warn("Auto-load: dados inválidos no localStorage, ignorando.");
      }
    }
  } catch (e) {
    console.warn("Erro ao carregar auto-save:", e);
  }

  // ===== Auto-Save System =====
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Indicador visual de salvamento
  const saveIndicator = document.createElement('div');
  saveIndicator.id = 'auto-save-indicator';
  saveIndicator.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;background:rgba(30,30,30,0.85);opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999;backdrop-filter:blur(6px);';
  document.body.appendChild(saveIndicator);
  let saveIndicatorTimer = null;

  function showSaveStatus(text, duration) {
    saveIndicator.textContent = text;
    saveIndicator.style.opacity = '1';
    if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
    if (duration) {
      saveIndicatorTimer = setTimeout(() => { saveIndicator.style.opacity = '0'; }, duration);
    }
  }

  // Função central de auto-save
  function autoSave() {
    try {
      showSaveStatus('Salvando...');
      const data = snapshot();
      localStorage.setItem("ficha-yby-p3r-skin", JSON.stringify(data));
      showSaveStatus('Salvo \u2714', 2000);
    } catch (e) {
      console.warn("Erro ao salvar automaticamente:", e);
      showSaveStatus('Erro ao salvar', 3000);
    }
  }

  const debouncedAutoSave = debounce(autoSave, 500);

  // Listeners globais: qualquer input ou change dispara auto-save
  document.addEventListener('input', debouncedAutoSave);
  document.addEventListener('change', debouncedAutoSave);

  // MutationObserver para linhas adicionadas/removidas em tabelas dinâmicas
  const autoSaveTableIds = ['tbl-eq','tbl-spell','tbl-link','tbl-clue','tbl-ctt','tbl-mod'];
  const tableObserver = new MutationObserver(() => {
    setTimeout(debouncedAutoSave, 100);
  });
  autoSaveTableIds.forEach(id => {
    const tbody = document.querySelector('#' + id + ' tbody');
    if (tbody) tableObserver.observe(tbody, { childList: true, subtree: true });
  });

  // Salvar antes de fechar a página (safety net)
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem("ficha-yby-p3r-skin", JSON.stringify(snapshot()));
    } catch (e) {}
  });

  // Expor para uso externo se necessário
  window.autoSave = autoSave;
  window.debouncedAutoSave = debouncedAutoSave;
})();
