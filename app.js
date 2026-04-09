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
          portraitPreview.innerHTML = '';
          const img = document.createElement('img');
          img.src = portraitImgSrc;
          img.alt = 'Retrato';
          img.style.cssText = 'max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);';
          portraitPreview.appendChild(img);
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

// ===== App Principal =====
(function() {
'use strict';

// =============================================
// CONSTANTES E DADOS
// =============================================

const ELEMENTS = ["Físico","Fogo","Gelo","Vento","Raio","Nuclear","PSY","Luz","Trevas","Onipotente"];
const EL_IDS = {"Físico":"Fisico","Fogo":"Fogo","Gelo":"Gelo","Vento":"Vento","Raio":"Raio","Nuclear":"Nuclear","PSY":"PSY","Luz":"Luz","Trevas":"Trevas","Onipotente":"Onipotente"};
const RELS = ["Normal","Fraco","Resiste","Anula","Reflete","Absorve"];
const ARCANAS = ["","0 - Louco","I - Mago","II - Sacerdotisa","III - Imperatriz","IV - Imperador","V - Hierofante","VI - Enamorados","VII - Carruagem","VIII - Força","IX - Eremita","X - Roda da Fortuna","XI - Justiça","XII - Enforcado","XIII - Morte","XIV - Temperança","XV - Diabo","XVI - Torre","XVII - Estrela","XVIII - Lua","XIX - Sol","XX - Julgamento","XXI - Mundo"];
const MOD_TARGETS = ['STR','MAG','TEC','AGI','VIT','LCK','HP','PM'];

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

const CONDITIONS_LIST = [
  { id: 'charme', name: 'Charme', desc: 'Põe o personagem sob o controle do Narrador, ou faz um inimigo atacar os próprios aliados e conjurar magias benéficas para os jogadores.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'panico', name: 'Pânico', desc: 'Previne o uso da Persona ou o uso de habilidades especiais do inimigo.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'medo', name: 'Medo', desc: 'Role 2 dados e pegue o pior nas esquivas.\nNo final do turno, chance de recuperação: 33%.\nSe não se recuperar, perde um uso de magia aleatória ou 1 PM.' },
  { id: 'furia', name: 'Fúria', desc: 'Aumenta o dano físico causado e recebido em 50%.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.\nVocê pode optar por recusar o teste de recuperação.' },
  { id: 'atordoado', name: 'Atordoado', desc: 'Role 2 dados e pegue o pior na esquiva.\nNão pode usar ações Livres, Rápidas ou de Interromper.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'choque', name: 'Choque', desc: 'Todos os ataques recebidos têm sucesso automático.\nAtaques contra o alvo rolam 2 dados e pegam o melhor para críticos.\nNo final do turno, o alvo se recupera automaticamente.' },
  { id: 'lento', name: 'Lento', desc: 'Movimento reduzido pela metade.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'veneno', name: 'Veneno', desc: 'Causa 20% do seu PV máximo como dano por turno.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'derrubado', name: 'Derrubado', desc: 'Você joga 3 dados de esquiva e pega o pior.\nNo final do turno do personagem o mesmo se recupera.\nUm aliado pode usar ação de movimento para recuperar um personagem instantaneamente.' }
];

const SOCIAL_SKILL_META = {
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
const SOCIAL_IDS = ['KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts'];
const INITIAL_SOCIAL_POINTS = 7;

// =============================================
// UTILITÁRIOS
// =============================================

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
function clampInt(n, min, max) { n = Math.trunc(+n || 0); return Math.min(max, Math.max(min, n)); }

// =============================================
// CACHE DE ELEMENTOS DOM
// =============================================

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

// =============================================
// ESTADO CENTRAL
// =============================================

const state = {
  // Personagem
  CharClass: '', CharLvl: 1, CharArcana: '', CharPlayer: '',
  // Atributos de combate (base, antes de modificadores)
  CharSTR: 1, CharMAG: 1, CharTEC: 1, CharAGI: 1, CharVIT: 1, CharLCK: 1,
  // HP/PM
  MaxHP: 0, CurrentHP: 0, EnergyMax: 0, CurrentPM: 0, DmgRed: 0,
  // Social
  KNOPts: 0, DISPts: 0, EMPpts: 0, EXPPts: 0, COUPts: 0, CHAPts: 0,
  // Aspectos & Buffs
  Aspectos: '', AspectPoints: 0, Buffs: '',
  // Persona
  PerName: '', PerArcana: '', PerLvl: 1, PerNotes: '', PerSP: 0, PerTypes: '',
  Conviction: '',
  // Equipamento rápido
  Weapon: '', WeaponDmg: '', WeaponReach: '', WeaponEffect: '',
  Armor: '', ArmorDmgRed: '', ArmorEffect: '',
  Accessory: '', AccessoryEffect: '',
  Resistances: '',
  // Notas
  NotesDiary: '', NotesGoals: '',
  // Tabelas dinâmicas
  spells: [], equip: [], links: [], clues: [], contacts: [],
  // Listas de checagem
  feitos: [], conditions: [], modifiers: [],
  // Afinidades
  affinities: {},
  // Retrato
  portrait: { src: '' },
  // Background
  background: {},
  // Valores computados (preenchidos por recalcState)
  _computed: null
};

// Campos que mapeiam 1:1 entre state e DOM (por ID)
const FIELD_IDS = [
  'CharClass','CharLvl','CharArcana','CharPlayer',
  'CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK',
  'MaxHP','CurrentHP','EnergyMax','CurrentPM','DmgRed',
  'KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts',
  'Aspectos','AspectPoints','Buffs',
  'PerName','PerArcana','PerLvl','PerNotes','PerSP','PerTypes',
  'Conviction',
  'Weapon','WeaponDmg','WeaponReach','WeaponEffect',
  'Armor','ArmorDmgRed','ArmorEffect',
  'Accessory','AccessoryEffect',
  'Resistances','NotesDiary','NotesGoals'
];

// Campos numéricos (auto-convertidos em setState)
const NUMBER_FIELDS = new Set([
  'CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK',
  'MaxHP','CurrentHP','EnergyMax','CurrentPM','DmgRed',
  'KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts',
  'AspectPoints','PerLvl','PerSP'
]);

// Campos que exigem recálculo de HP/PM/badges quando alterados
const RECALC_FIELDS = new Set([
  'CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK'
]);

let _rendering = false;

/**
 * Atualiza o estado central e propaga para cálculos + UI.
 * @param {object} partial - Campos a atualizar (ex: {CharSTR: 5})
 * @param {object} [options] - skipRecalc, skipRender, skipSave, renderOptions
 */
function setState(partial, options) {
  if (!partial || typeof partial !== 'object') return;
  options = options || {};
  let needsRecalc = false;
  Object.keys(partial).forEach(function(key) {
    if (key.charAt(0) === '_') return;
    state[key] = NUMBER_FIELDS.has(key) ? (Number(partial[key]) || 0) : partial[key];
    if (RECALC_FIELDS.has(key)) needsRecalc = true;
  });
  if (needsRecalc && !options.skipRecalc) recalcState();
  validateState();
  if (!options.skipRender) render(options.renderOptions || {});
  if (!options.skipSave && window.debouncedAutoSave) window.debouncedAutoSave();
}

/**
 * Retorna uma cópia profunda do estado (exceto _computed).
 */
function getState() {
  var copy = {};
  Object.keys(state).forEach(function(k) {
    if (k.charAt(0) === '_') return;
    var v = state[k];
    copy[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  });
  return copy;
}

// =============================================
// CÁLCULOS PUROS
// =============================================

/**
 * Aplica modificadores sobre valores base.
 * @param {object} baseValues - {STR, MAG, TEC, AGI, VIT, LCK, HP, PM}
 * @param {Array} modifiers - lista de {nome, tipo, valor, alvo, ativo}
 * @returns {object} valores modificados
 */
function applyModifiers(baseValues, modifiers) {
  var result = {};
  MOD_TARGETS.forEach(function(t) { result[t] = baseValues[t] || 0; });
  var actives = (modifiers || []).filter(function(m) { return m.ativo && m.valor !== 0; });
  // Flat primeiro
  actives.filter(function(m) { return m.tipo === 'flat'; }).forEach(function(m) {
    if (result[m.alvo] !== undefined) result[m.alvo] += m.valor;
  });
  // Percentual depois
  actives.filter(function(m) { return m.tipo === 'percentual'; }).forEach(function(m) {
    if (result[m.alvo] !== undefined) result[m.alvo] = Math.round(result[m.alvo] * (1 + m.valor / 100));
  });
  // Clamp mínimo 0
  MOD_TARGETS.forEach(function(t) { if (result[t] < 0) result[t] = 0; });
  return result;
}

/**
 * Recalcula HP/PM máximos e valores de badges a partir do state.
 * Escreve diretamente em state.MaxHP, state.EnergyMax, state._computed.
 */
function recalcState() {
  var lvl = clampInt(state.CharLvl || 1, 1, 99);
  var vit = clampInt(state.CharVIT || 1, 1, 12);
  var mag = clampInt(state.CharMAG || 1, 1, 12);

  // HP: 25 + ((5 + VIT) * Nível)
  var baseHP = 25 + ((5 + vit) * lvl);
  // PM: 15 + ((MAG + 5) * 2) + ((Nível - 1) * 5)
  var basePM = 15 + ((mag + 5) * 2) + ((lvl - 1) * 5);

  var baseVals = {
    STR: clampInt(state.CharSTR || 1, 1, 12),
    MAG: mag,
    TEC: clampInt(state.CharTEC || 1, 1, 12),
    AGI: clampInt(state.CharAGI || 1, 1, 12),
    VIT: vit,
    LCK: clampInt(state.CharLCK || 1, 1, 12),
    HP: baseHP,
    PM: basePM
  };
  var modded = applyModifiers(baseVals, state.modifiers);

  state.MaxHP = modded.HP;
  state.EnergyMax = modded.PM;
  state._computed = { baseVals: baseVals, modded: modded };
}

/**
 * Garante que os valores de HP/PM são válidos (não NaN, dentro dos limites).
 */
function validateState() {
  state.MaxHP = Math.max(0, Math.trunc(state.MaxHP || 0));
  state.CurrentHP = Math.max(0, Math.min(Math.trunc(state.CurrentHP || 0), state.MaxHP));
  state.EnergyMax = Math.max(0, Math.trunc(state.EnergyMax || 0));
  state.CurrentPM = Math.max(0, Math.min(Math.trunc(state.CurrentPM || 0), state.EnergyMax));
}

// =============================================
// SISTEMA DE RENDERIZAÇÃO
// =============================================

/**
 * Renderiza campos simples + badges a partir do state.
 * Para renderização completa (tabelas, feitos, etc.) use renderAll.
 */
function render() {
  _rendering = true;
  try {
    renderFields();
    renderBadges();
    renderSocial();
  } finally {
    _rendering = false;
  }
}

function renderFields() {
  FIELD_IDS.forEach(function(key) {
    var el = ids[key];
    if (!el) return;
    var val = state[key];
    if (val === undefined || val === null) val = '';
    if (el.value !== String(val)) el.value = val;
  });
}

function renderBadges() {
  var comp = state._computed;
  if (!comp) return;
  var baseVals = comp.baseVals;
  var modded = comp.modded;
  ['STR','MAG','TEC','AGI','VIT','LCK'].forEach(function(k) {
    var el = document.getElementById('b' + k);
    if (el) el.textContent = modded[k] !== baseVals[k] ? (modded[k] + ' (' + baseVals[k] + ')') : baseVals[k];
  });
}

function renderSocial() {
  var remainingEl = document.getElementById('social-remaining');
  if (!remainingEl) return;
  var sum = 0;
  SOCIAL_IDS.forEach(function(id) {
    var val = Math.max(0, Number(state[id]) || 0);
    var tier = Math.min(5, Math.floor(val / 5));
    var meta = SOCIAL_SKILL_META[id];
    if (!meta) return;
    var displayTitle = meta.titles[tier] || meta.titles[meta.titles.length - 1];
    var displayDesc = meta.desc[tier] || meta.desc[meta.desc.length - 1];
    var tierEl = document.getElementById(id + '-tier');
    var shortEl = document.getElementById(id + '-short');
    var descEl = document.getElementById(id + '-desc');
    if (tierEl) tierEl.textContent = 'Tier ' + tier + ' \u2014 ' + displayTitle + ' (' + val + ' pts)';
    if (shortEl) shortEl.textContent = displayTitle;
    if (descEl) descEl.textContent = displayDesc;
    sum += val;
  });
  remainingEl.textContent = Math.max(0, INITIAL_SOCIAL_POINTS - sum);
}

function renderModSummary() {
  var summary = document.getElementById('mod-summary');
  if (!summary) return;
  var actives = (state.modifiers || []).filter(function(m) { return m.ativo && m.valor !== 0; });
  if (actives.length === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'block';
  var parts = actives.map(function(m) {
    var sign = m.valor >= 0 ? '+' : '';
    var suffix = m.tipo === 'percentual' ? '%' : '';
    return '<b>' + m.alvo + '</b> ' + sign + m.valor + suffix + ' (' + (m.nome || 'sem nome') + ')';
  });
  summary.innerHTML = '\u26A1 Ativos: ' + parts.join(' \u00B7 ');
}

// =============================================
// TEMA DINÂMICO
// =============================================

var themeSelect = document.getElementById('themeSelect');
var themeMap = {
  padrao: 'theme-padrao', roxo: 'theme-roxo', claro: 'theme-claro',
  vermelho: 'theme-vermelho', degrade: 'theme-degrade',
  corinthians: 'theme-corinthians', rosa: 'theme-rosa'
};
function applyTheme(theme) {
  Object.values(themeMap).forEach(function(cls) { document.body.classList.remove(cls); });
  document.body.classList.add(themeMap[theme] || themeMap.padrao);
}
function saveTheme(theme) { localStorage.setItem('ficha-theme', theme); }
function loadTheme() { return localStorage.getItem('ficha-theme') || 'padrao'; }
if (themeSelect) {
  themeSelect.value = loadTheme();
  applyTheme(themeSelect.value);
  themeSelect.addEventListener('change', function() { applyTheme(this.value); saveTheme(this.value); });
}

// =============================================
// TOAST
// =============================================

function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    setTimeout(function() {
      toast.classList.add('out');
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
  });
}

// =============================================
// TABS
// =============================================

function initTabs() {
  $$(".tab").forEach(function(btn) {
    btn.addEventListener("click", function() {
      $$(".tab").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      $$(".view").forEach(function(v) { v.classList.remove("active"); });
      var target = $("#" + btn.dataset.view);
      if (target) target.classList.add("active");
      requestAnimationFrame(function() {
        if (typeof window.initAutoResizeTextareas === 'function') window.initAutoResizeTextareas();
      });
    });
  });
}

// =============================================
// ARCANA + AFINIDADES
// =============================================

function initArcanaSelects() {
  var arcSel1 = document.getElementById("CharArcana");
  var arcSel2 = document.getElementById("PerArcana");
  [arcSel1, arcSel2].forEach(function(sel) {
    if (sel) ARCANAS.forEach(function(a) { var o = document.createElement("option"); o.value = a; o.textContent = a; sel.appendChild(o); });
  });
}

function buildAffinityTable() {
  var afBody = document.getElementById('af-body');
  if (!afBody) return;
  afBody.innerHTML = '';
  for (var i = 0; i < ELEMENTS.length; i += 2) {
    var left = ELEMENTS[i]; var right = ELEMENTS[i + 1];
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + left + '</td><td><select id="AF_' + EL_IDS[left] + '"></select></td>' +
      (right ? '<td>' + right + '</td><td><select id="AF_' + EL_IDS[right] + '"></select></td>' : '<td></td><td></td>');
    afBody.appendChild(tr);
  }
  var sels = Array.from(document.querySelectorAll("[id^='AF_']"));
  RELS.forEach(function(r) { sels.forEach(function(sel) { var o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); }); });
  // Sincronizar com state quando mudar
  sels.forEach(function(sel) {
    sel.addEventListener('change', function() {
      syncAffinityToState();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
  });
}

function syncAffinityToState() {
  var affin = {};
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    affin[e] = sel ? sel.value : 'Normal';
  });
  state.affinities = affin;
}

function renderAffinities() {
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    if (sel && state.affinities[e]) sel.value = state.affinities[e];
  });
}

// =============================================
// FEITOS UI
// =============================================

function buildFeitosUI() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  container.innerHTML = '';

  var categories = [];
  var catMap = {};
  FEITOS_LIST.forEach(function(f) {
    var c = f.cat || 'Outros';
    if (!catMap[c]) { catMap[c] = []; categories.push(c); }
    catMap[c].push(f);
  });

  categories.forEach(function(cat) {
    var group = document.createElement('div');
    group.className = 'feat-group';
    group.innerHTML = '<h3 class="feat-cat-title">' + cat + '</h3>';
    var grid = document.createElement('div');
    grid.className = 'feat-grid';
    catMap[cat].forEach(function(f) {
      var item = document.createElement('div');
      item.className = 'feat-item';
      item.dataset.featId = f.id;
      var prereqHtml = f.prereq ? '<div class="feat-prereq">Pré-requisito: ' + f.prereq + '</div>' : '';
      item.innerHTML = '<label class="feat-label"><input type="checkbox" class="feat-check" data-id="' + f.id + '"/><span class="feat-name">' + f.name + '</span></label><div class="feat-desc-text">' + f.desc.replace(/\n/g, '<br>') + '</div>' + prereqHtml;
      grid.appendChild(item);
    });
    group.appendChild(grid);
    container.appendChild(group);
  });

  container.addEventListener('change', function(e) {
    if (e.target.classList.contains('feat-check')) {
      e.target.closest('.feat-item').classList.toggle('feat-active', e.target.checked);
      syncFeitosToState();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
  });
}

function syncFeitosToState() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  state.feitos = FEITOS_LIST.map(function(f) {
    var cb = container.querySelector('.feat-check[data-id="' + f.id + '"]');
    return { id: f.id, ativo: cb ? cb.checked : false };
  }).filter(function(f) { return f.ativo; });
}

function renderFeitos() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  container.querySelectorAll('.feat-check').forEach(function(cb) { cb.checked = false; });
  container.querySelectorAll('.feat-item').forEach(function(el) { el.classList.remove('feat-active'); });
  (state.feitos || []).forEach(function(f) {
    var cb = container.querySelector('.feat-check[data-id="' + f.id + '"]');
    var isActive = f.ativo !== undefined ? f.ativo : f.selected;
    if (cb && isActive !== false) { cb.checked = true; cb.closest('.feat-item').classList.add('feat-active'); }
  });
}

// =============================================
// CONDIÇÕES UI
// =============================================

function buildConditionsUI() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  container.innerHTML = '';

  CONDITIONS_LIST.forEach(function(c) {
    var item = document.createElement('div');
    item.className = 'cond-item';
    item.dataset.condId = c.id;
    item.innerHTML = '<label class="cond-label"><input type="checkbox" class="cond-check" data-id="' + c.id + '"/><span class="cond-name">' + c.name + '</span></label><div class="cond-desc-text">' + c.desc.replace(/\n/g, '<br>') + '</div>';
    container.appendChild(item);
  });

  container.addEventListener('change', function(e) {
    if (e.target.classList.contains('cond-check')) {
      e.target.closest('.cond-item').classList.toggle('cond-active', e.target.checked);
      syncConditionsToState();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
  });
}

function syncConditionsToState() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  state.conditions = CONDITIONS_LIST.map(function(c) {
    var cb = container.querySelector('.cond-check[data-id="' + c.id + '"]');
    return { id: c.id, ativa: cb ? cb.checked : false };
  }).filter(function(c) { return c.ativa; });
}

function renderConditions() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  container.querySelectorAll('.cond-check').forEach(function(cb) { cb.checked = false; });
  container.querySelectorAll('.cond-item').forEach(function(el) { el.classList.remove('cond-active'); });
  (state.conditions || []).forEach(function(saved) {
    var cb = container.querySelector('.cond-check[data-id="' + saved.id + '"]');
    if (cb && saved.ativa !== false) { cb.checked = true; cb.closest('.cond-item').classList.add('cond-active'); }
  });
}

// =============================================
// HABILIDADES SOCIAIS UI
// =============================================

function buildSocialUI() {
  var container = document.getElementById('social-tier-list');
  var remainingEl = document.getElementById('social-remaining');
  if (!container || !remainingEl) return;

  container.innerHTML = '';
  SOCIAL_IDS.forEach(function(id) {
    var meta = SOCIAL_SKILL_META[id];
    var wrapper = document.createElement('div');
    wrapper.className = 'social-skill';
    wrapper.style.padding = '8px 0';
    wrapper.style.borderBottom = '1px dashed rgba(255,255,255,0.03)';
    wrapper.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div style="font-weight:800">' + meta.name + '</div><div style="text-align:right"><div id="' + id + '-tier" style="font-weight:900">Tier 0 \u2014 ' + meta.titles[0] + '</div><div id="' + id + '-short" style="font-size:13px;color:var(--ink-dim)"></div></div></div><div id="' + id + '-desc" style="margin-top:6px;color:var(--ink);font-size:13px"></div>';
    container.appendChild(wrapper);
  });

  // Listeners sincronizam com state
  SOCIAL_IDS.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
      var val = Number(el.value || 0);
      if (val < 0) { el.value = 0; val = 0; }
      var partial = {};
      partial[id] = val;
      setState(partial, { skipRecalc: true });
    });
  });
}

// =============================================
// MODIFICADORES GLOBAIS UI
// =============================================

function buildModifiersUI() {
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  var btn = document.getElementById('add-mod');

  function addModRow(data) {
    data = data || { nome: '', tipo: 'flat', valor: 0, alvo: 'STR', ativo: true };
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><input class="mod-nome" placeholder="Nome do modificador"/></td>' +
      '<td><select class="mod-tipo"><option value="flat">Flat (+/-)</option><option value="percentual">Percentual (%)</option></select></td>' +
      '<td><input class="mod-valor" type="number" value="0" style="width:80px;"/></td>' +
      '<td><select class="mod-alvo"></select></td>' +
      '<td style="text-align:center"><input type="checkbox" class="mod-ativo" checked/></td>' +
      '<td class="row-actions"><button class="mini del">Remover</button></td>';
    body.appendChild(tr);
    var alvoSel = tr.querySelector('.mod-alvo');
    MOD_TARGETS.forEach(function(t) { var o = document.createElement('option'); o.value = t; o.textContent = t; alvoSel.appendChild(o); });
    tr.querySelector('.mod-nome').value = data.nome || '';
    tr.querySelector('.mod-tipo').value = data.tipo || 'flat';
    tr.querySelector('.mod-valor').value = data.valor || 0;
    alvoSel.value = data.alvo || 'STR';
    tr.querySelector('.mod-ativo').checked = data.ativo !== false;

    function onChange() {
      syncModifiersToState();
      recalcState();
      validateState();
      render();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
    tr.querySelector('.mod-nome').addEventListener('input', onChange);
    tr.querySelector('.mod-tipo').addEventListener('change', onChange);
    tr.querySelector('.mod-valor').addEventListener('input', onChange);
    alvoSel.addEventListener('change', onChange);
    tr.querySelector('.mod-ativo').addEventListener('change', onChange);
    tr.querySelector('.del').addEventListener('click', function() { tr.remove(); onChange(); });
  }

  if (btn) btn.addEventListener('click', function() { addModRow(); syncModifiersToState(); });

  // Expor para renderAll
  window._addModRow = addModRow;
}

function syncModifiersToState() {
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  state.modifiers = Array.from(body.querySelectorAll('tr')).map(function(tr) {
    return {
      nome: tr.querySelector('.mod-nome').value,
      tipo: tr.querySelector('.mod-tipo').value,
      valor: Number(tr.querySelector('.mod-valor').value) || 0,
      alvo: tr.querySelector('.mod-alvo').value,
      ativo: !!tr.querySelector('.mod-ativo').checked
    };
  });
  renderModSummary();
}

function renderModifiers() {
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  body.innerHTML = '';
  (state.modifiers || []).forEach(function(m) {
    if (window._addModRow) window._addModRow(m);
  });
  renderModSummary();
}

// =============================================
// FUNÇÕES DE TABELAS DINÂMICAS
// =============================================

var eqBody = $("#tbl-eq tbody");
var spellBody = $("#tbl-spell tbody");
var linkBody = $("#tbl-link tbody");
var clueBody = $("#tbl-clue tbody");
var cttBody = $("#tbl-ctt tbody");

// ---- Equipamentos ----
function addEq(data) {
  data = data || { tipo: "Item", nome: "", efeito: "" };
  if (!eqBody) return;
  var tr = document.createElement("tr");
  tr.innerHTML = '<td><select class="eq-tipo"><option>Arma</option><option>Armadura</option><option>Acessório</option><option>Item</option></select></td>' +
    '<td><input class="eq-nome" placeholder="Nome"/></td>' +
    '<td><textarea class="eq-ef" rows="1" placeholder="Efeito/Notas"></textarea></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  eqBody.appendChild(tr);
  tr.querySelector('.eq-tipo').value = data.tipo || "Item";
  tr.querySelector('.eq-nome').value = data.nome || "";
  tr.querySelector('.eq-ef').value = data.efeito || "";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncEquipToState(); });
}
function syncEquipToState() {
  state.equip = eqBody ? Array.from(eqBody.querySelectorAll('tr')).map(function(tr) {
    return { tipo: tr.querySelector('.eq-tipo').value, nome: tr.querySelector('.eq-nome').value, efeito: tr.querySelector('.eq-ef').value };
  }) : [];
}

// ---- Magias ----
function moveSpellRow(tr, direction) {
  if (!tr || !spellBody) return;
  var rows = Array.from(spellBody.querySelectorAll('tr'));
  var idx = rows.indexOf(tr);
  if (idx === -1) return;
  if (direction === 'up' && idx > 0) spellBody.insertBefore(tr, rows[idx - 1]);
  else if (direction === 'down' && idx < rows.length - 1) spellBody.insertBefore(tr, rows[idx + 2]);
  syncSpellsToState();
}
function addSpell(data) {
  data = data || { nome: "", tipo: "Físico", custo: "", efeito: "" };
  if (!spellBody) return;
  var tr = document.createElement("tr");
  tr.innerHTML = '<td><textarea class="sp-n" rows="1" placeholder="Magia/Técnica" style="width:100%;resize:vertical"></textarea></td>' +
    '<td><input class="sp-c" placeholder="Alvo"/></td>' +
    '<td><select class="sp-t"></select></td>' +
    '<td><textarea class="sp-e" rows="2" placeholder="Efeito" style="width:100%;resize:vertical"></textarea></td>' +
    '<td><input class="sp-tier" placeholder="Nível"/></td>' +
    '<td><input class="sp-uses" placeholder="PM"/></td>' +
    '<td class="row-actions"><button class="mini up" title="Mover para cima">\u2191</button><button class="mini down" title="Mover para baixo">\u2193</button><button class="mini del">X</button></td>';
  spellBody.appendChild(tr);
  var tsel = tr.querySelector('.sp-t');
  ["Físico","Fogo","Gelo","Vento","Raio","Nuclear","PSY","Luz","Trevas","Suporte","Controle"].forEach(function(t) { var o = document.createElement('option'); o.textContent = t; tsel.appendChild(o); });
  var nameEl = tr.querySelector('.sp-n');
  if (nameEl) nameEl.value = data.nome || "";
  tsel.value = data.tipo || "Físico";
  tr.querySelector('.sp-c').value = data.custo || "";
  tr.querySelector('.sp-e').value = data.efeito || "";
  if (data.tier != null) tr.querySelector('.sp-tier').value = data.tier;
  if (data.uses != null) tr.querySelector('.sp-uses').value = data.uses;
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncSpellsToState(); });
  tr.querySelector('.up').addEventListener('click', function() { moveSpellRow(tr, 'up'); });
  tr.querySelector('.down').addEventListener('click', function() { moveSpellRow(tr, 'down'); });
}
function syncSpellsToState() {
  state.spells = spellBody ? Array.from(spellBody.querySelectorAll('tr')).map(function(tr) {
    return { nome: (tr.querySelector('.sp-n') || {}).value || '', tipo: tr.querySelector('.sp-t').value, custo: tr.querySelector('.sp-c').value, efeito: (tr.querySelector('.sp-e') || {}).value || '', tier: (tr.querySelector('.sp-tier') || {}).value || '', uses: (tr.querySelector('.sp-uses') || {}).value || '' };
  }) : [];
}

// ---- Vínculos ----
function addLink(data) {
  data = data || { nome: "", arcana: "", rank: 1, obs: "" };
  if (!linkBody) return;
  var tr = document.createElement("tr");
  tr.innerHTML = '<td><input class="lk-n" placeholder="Nome do NPC"/></td>' +
    '<td><select class="lk-a"></select></td>' +
    '<td><input class="lk-r" type="number" min="1" max="10" value="1"/></td>' +
    '<td><textarea class="lk-o" rows="1" placeholder="Observações"></textarea></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  linkBody.appendChild(tr);
  var asel = tr.querySelector('.lk-a');
  ARCANAS.forEach(function(a) { var o = document.createElement('option'); o.textContent = a; o.value = a; asel.appendChild(o); });
  tr.querySelector('.lk-n').value = data.nome || "";
  asel.value = data.arcana || "";
  tr.querySelector('.lk-r').value = data.rank || 1;
  tr.querySelector('.lk-o').value = data.obs || "";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncLinksToState(); });
}
function syncLinksToState() {
  state.links = linkBody ? Array.from(linkBody.querySelectorAll('tr')).map(function(tr) {
    return { nome: tr.querySelector('.lk-n').value, arcana: tr.querySelector('.lk-a').value, rank: clampInt(tr.querySelector('.lk-r').value, 1, 10), obs: tr.querySelector('.lk-o').value };
  }) : [];
}

// ---- Pistas ----
function addClue(data) {
  data = data || { titulo: "", desc: "", evid: "", status: "Aberta" };
  if (!clueBody) return;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input class="cl-t" placeholder="Título"/></td>' +
    '<td><textarea class="cl-d" rows="1" placeholder="Descrição / Ancoragem"></textarea></td>' +
    '<td><textarea class="cl-e" rows="1" placeholder="Evidência (onde/quem/como)"></textarea></td>' +
    '<td><select class="cl-s"><option>Aberta</option><option>Em andamento</option><option>Resolvida</option></select></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  clueBody.appendChild(tr);
  tr.querySelector('.cl-t').value = data.titulo || "";
  tr.querySelector('.cl-d').value = data.desc || "";
  tr.querySelector('.cl-e').value = data.evid || "";
  tr.querySelector('.cl-s').value = data.status || "Aberta";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncCluesToState(); });
}
function syncCluesToState() {
  state.clues = clueBody ? Array.from(clueBody.querySelectorAll('tr')).map(function(tr) {
    return { titulo: tr.querySelector('.cl-t').value, desc: tr.querySelector('.cl-d').value, evid: tr.querySelector('.cl-e').value, status: tr.querySelector('.cl-s').value };
  }) : [];
}

// ---- Contatos ----
function addCtt(data) {
  data = data || { nome: "", tipo: "NPC", obs: "" };
  if (!cttBody) return;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input class="ct-n" placeholder="Nome"/></td>' +
    '<td><select class="ct-t"><option>NPC</option><option>Local</option><option>Clube</option><option>Comércio</option></select></td>' +
    '<td><textarea class="ct-o" rows="1" placeholder="Observações / pistas / horários"></textarea></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  cttBody.appendChild(tr);
  tr.querySelector('.ct-n').value = data.nome || "";
  tr.querySelector('.ct-t').value = data.tipo || "NPC";
  tr.querySelector('.ct-o').value = data.obs || "";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncContactsToState(); });
}
function syncContactsToState() {
  state.contacts = cttBody ? Array.from(cttBody.querySelectorAll('tr')).map(function(tr) {
    return { nome: tr.querySelector('.ct-n').value, tipo: tr.querySelector('.ct-t').value, obs: tr.querySelector('.ct-o').value };
  }) : [];
}

// ---- Render todas as tabelas a partir do state ----
function renderTables() {
  if (eqBody) { eqBody.innerHTML = ''; (state.equip || []).forEach(addEq); }
  if (spellBody) { spellBody.innerHTML = ''; (state.spells || []).forEach(addSpell); }
  if (linkBody) { linkBody.innerHTML = ''; (state.links || []).forEach(addLink); }
  if (clueBody) { clueBody.innerHTML = ''; (state.clues || []).forEach(addClue); }
  if (cttBody) { cttBody.innerHTML = ''; (state.contacts || []).forEach(addCtt); }
}

// ---- Botões de adicionar ----
var addEqBtn = $("#add-eq");
if (addEqBtn) addEqBtn.addEventListener("click", function() { addEq(); syncEquipToState(); });
var addSpellBtn = $("#add-spell");
if (addSpellBtn) addSpellBtn.addEventListener("click", function() { addSpell(); syncSpellsToState(); });
var addLinkBtn = $("#add-link");
if (addLinkBtn) addLinkBtn.addEventListener("click", function() { addLink(); syncLinksToState(); });
var addClueBtn = $("#add-clue");
if (addClueBtn) addClueBtn.addEventListener("click", function() { addClue(); syncCluesToState(); });
var addCttBtn = $("#add-ctt");
if (addCttBtn) addCttBtn.addEventListener("click", function() { addCtt(); syncContactsToState(); });

// =============================================
// RENDERIZAÇÃO COMPLETA (renderAll)
// =============================================

function renderPortrait() {
  var prev = document.getElementById('portraitPreview');
  if (!prev) return;
  if (state.portrait && state.portrait.src) {
    prev.innerHTML = '';
    var img = document.createElement('img');
    img.src = state.portrait.src;
    img.alt = 'Retrato';
    img.style.cssText = 'max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);';
    prev.appendChild(img);
  } else {
    prev.innerHTML = '';
  }
}

function renderBackground() {
  if (!state.background) return;
  Object.entries(state.background).forEach(function(entry) {
    var el = document.getElementById(entry[0]);
    if (el) el.value = entry[1] || '';
  });
}

/**
 * Renderização completa: campos + badges + tabelas + feitos + condições + modificadores + afinidades + portrait + background.
 * Usado após applySnapshot, reset, ou carregamento inicial.
 */
function renderAll() {
  _rendering = true;
  try {
    renderFields();
    renderBadges();
    renderSocial();
    renderTables();
    renderFeitos();
    renderConditions();
    renderModifiers();
    renderAffinities();
    renderPortrait();
    renderBackground();
    renderModSummary();
    if (typeof window.initAutoResizeTextareas === 'function') window.initAutoResizeTextareas();
  } finally {
    _rendering = false;
  }
}

// =============================================
// PERSISTÊNCIA — SNAPSHOT
// =============================================

/**
 * Gera snapshot dos dados a partir do state.
 * Formato compatível com versões anteriores.
 */
function snapshot() {
  // Sincronizar tabelas DOM → state antes do snapshot
  syncEquipToState();
  syncSpellsToState();
  syncLinksToState();
  syncCluesToState();
  syncContactsToState();
  syncModifiersToState();
  syncFeitosToState();
  syncConditionsToState();
  syncAffinityToState();
  // Portrait do DOM
  state.portrait.src = (document.querySelector('#portraitPreview img') || {}).src || '';
  // Background do DOM
  var bgEls = Array.from(document.querySelectorAll('[id^="bg"]'));
  var background = {};
  bgEls.forEach(function(el) { background[el.id] = el.value || ''; });
  state.background = background;

  return {
    id: "ficha-yby-p3r-skin",
    acessoRapido: {
      CharClass: state.CharClass || "", CharLvl: state.CharLvl || "", CharArcana: state.CharArcana || "", CharPlayer: state.CharPlayer || "",
      CharSTR: state.CharSTR || "", CharMAG: state.CharMAG || "", CharTEC: state.CharTEC || "", CharAGI: state.CharAGI || "", CharVIT: state.CharVIT || "", CharLCK: state.CharLCK || "",
      MaxHP: state.MaxHP || "", CurrentHP: state.CurrentHP || "", EnergyMax: state.EnergyMax || "", CurrentPM: state.CurrentPM || "", DmgRed: state.DmgRed || "",
      pvMax: state.MaxHP || "", pvAtual: state.CurrentHP || "", pmMax: state.EnergyMax || "", pmAtual: state.CurrentPM || "",
      KNOPts: state.KNOPts || "", DISPts: state.DISPts || "", EMPpts: state.EMPpts || "", EXPPts: state.EXPPts || "", COUPts: state.COUPts || "", CHAPts: state.CHAPts || "",
      Aspectos: state.Aspectos || "", AspectPoints: state.AspectPoints || "", Buffs: state.Buffs || "",
      PerName: state.PerName || "", PerArcana: state.PerArcana || "", PerLvl: state.PerLvl || "", PerNotes: state.PerNotes || "", PerSP: state.PerSP || "", PerTypes: state.PerTypes || "",
      Weapon: state.Weapon || "", WeaponDmg: state.WeaponDmg || "", WeaponReach: state.WeaponReach || "", WeaponEffect: state.WeaponEffect || "",
      Armor: state.Armor || "", ArmorDmgRed: state.ArmorDmgRed || "", ArmorEffect: state.ArmorEffect || "",
      Accessory: state.Accessory || "", AccessoryEffect: state.AccessoryEffect || "",
      Resistances: state.Resistances || ""
    },
    persona: { PerName: state.PerName || "", PerArcana: state.PerArcana || "", PerLvl: state.PerLvl || 1, PerNotes: state.PerNotes || "", Conviction: state.Conviction || "", NaturalSkill: "", PerSP: state.PerSP || 0, PerTypes: state.PerTypes || "" },
    affinities: JSON.parse(JSON.stringify(state.affinities || {})),
    spells: JSON.parse(JSON.stringify(state.spells || [])),
    feitos: JSON.parse(JSON.stringify(state.feitos || [])),
    equip: JSON.parse(JSON.stringify(state.equip || [])),
    links: JSON.parse(JSON.stringify(state.links || [])),
    notes: { diary: state.NotesDiary || "", goals: state.NotesGoals || "", clues: JSON.parse(JSON.stringify(state.clues || [])), contacts: JSON.parse(JSON.stringify(state.contacts || [])) },
    portrait: { src: state.portrait.src || '' },
    background: JSON.parse(JSON.stringify(state.background || {})),
    conditions: JSON.parse(JSON.stringify(state.conditions || [])),
    modifiers: JSON.parse(JSON.stringify(state.modifiers || []))
  };
}

/**
 * Carrega um snapshot para o state e renderiza tudo.
 * Compatível com formato antigo e novo.
 */
function applySnapshot(data) {
  if (!data) return;
  var g = data.acessoRapido || {};

  // Campos simples do acessoRapido
  FIELD_IDS.forEach(function(key) {
    if (g[key] !== undefined && g[key] !== '') {
      state[key] = NUMBER_FIELDS.has(key) ? (Number(g[key]) || 0) : g[key];
    }
  });

  // Compatibilidade com chaves antigas
  if (g.pvMax != null && g.pvMax !== '') state.MaxHP = Number(g.pvMax) || 0;
  if (g.pvAtual != null && g.pvAtual !== '') state.CurrentHP = Number(g.pvAtual) || 0;
  if (g.pmMax != null && g.pmMax !== '') state.EnergyMax = Number(g.pmMax) || 0;
  if (g.pmAtual != null && g.pmAtual !== '') state.CurrentPM = Number(g.pmAtual) || 0;

  // Persona (sobrescreve se existir)
  if (data.persona) {
    if (data.persona.PerName) state.PerName = data.persona.PerName;
    if (data.persona.PerArcana) state.PerArcana = data.persona.PerArcana;
    if (data.persona.PerLvl) state.PerLvl = Number(data.persona.PerLvl) || 1;
    if (data.persona.PerNotes) state.PerNotes = data.persona.PerNotes;
    if (data.persona.Conviction) state.Conviction = data.persona.Conviction;
    if (data.persona.PerSP) state.PerSP = Number(data.persona.PerSP) || 0;
    if (data.persona.PerTypes) state.PerTypes = data.persona.PerTypes;
  }

  // Arrays e objetos complexos
  state.affinities = data.affinities || {};
  state.spells = data.spells || [];
  state.equip = data.equip || [];
  state.links = data.links || [];
  state.clues = (data.notes && data.notes.clues) || [];
  state.contacts = (data.notes && data.notes.contacts) || [];
  if (data.notes) {
    if (data.notes.diary) state.NotesDiary = data.notes.diary;
    if (data.notes.goals) state.NotesGoals = data.notes.goals;
  }
  state.feitos = data.feitos || [];
  state.conditions = data.conditions || [];
  state.modifiers = data.modifiers || [];
  state.portrait = data.portrait || { src: '' };
  state.background = data.background || {};

  // Recalcular HP/PM com atributos + modificadores restaurados
  recalcState();

  // Restaurar HP/PM atuais do snapshot (sobrescrever o que recalc calculou)
  var savedCurrentHP = g.CurrentHP || g.pvAtual;
  var savedCurrentPM = g.CurrentPM || g.pmAtual;
  if (savedCurrentHP != null && savedCurrentHP !== '') {
    state.CurrentHP = Number(savedCurrentHP) || 0;
  } else {
    state.CurrentHP = state.MaxHP;
  }
  if (savedCurrentPM != null && savedCurrentPM !== '') {
    state.CurrentPM = Number(savedCurrentPM) || 0;
  } else {
    state.CurrentPM = state.EnergyMax;
  }

  validateState();
  renderAll();
}

// =============================================
// RESET
// =============================================

function resetFicha() {
  if (!confirm('Tem certeza que deseja resetar a ficha?\nTodos os dados serão perdidos permanentemente.')) return;

  // Resetar state para valores padrão
  FIELD_IDS.forEach(function(key) {
    state[key] = NUMBER_FIELDS.has(key) ? (RECALC_FIELDS.has(key) ? 1 : 0) : '';
  });
  state.CharLvl = 1; state.PerLvl = 1;
  state.spells = []; state.equip = []; state.links = [];
  state.clues = []; state.contacts = [];
  state.feitos = []; state.conditions = []; state.modifiers = [];
  state.affinities = {};
  state.portrait = { src: '' };
  state.background = {};

  // Recalcular HP/PM
  recalcState();
  state.CurrentHP = state.MaxHP;
  state.CurrentPM = state.EnergyMax;
  validateState();

  // Limpa afinidades DOM (reconstroi selects)
  var afBody = document.getElementById('af-body');
  if (afBody) { afBody.innerHTML = ''; }
  buildAffinityTable();

  // Renderizar tudo
  renderAll();

  // Reset de campos que não estão no state (tema, testes)
  var testsOut = document.getElementById('tests-out');
  if (testsOut) testsOut.textContent = 'Clique em Testes para rodar as verificações.';

  // Limpar localStorage
  try { localStorage.removeItem('ficha-yby-p3r-skin'); }
  catch (e) { console.warn("[Reset] Erro ao limpar localStorage:", e); }

  showToast("Ficha resetada", 'info');
}

// =============================================
// INICIALIZAÇÃO
// =============================================

function initApp() {
  initTabs();
  initArcanaSelects();
  buildAffinityTable();
  buildFeitosUI();
  buildConditionsUI();
  buildSocialUI();
  buildModifiersUI();
}
initApp();

// =============================================
// EXPAND BUTTONS
// =============================================

(function() {
  Array.from(document.querySelectorAll('.expand-btn')).forEach(function(btn) {
    var targetId = btn.dataset.target;
    var target = document.getElementById(targetId);
    if (!target) return;
    btn.addEventListener('click', function() {
      target.classList.toggle('expanded');
      btn.textContent = target.classList.contains('expanded') ? '\u2922' : '\u2921';
      if (target.classList.contains('expanded')) target.focus();
    });
  });
})();

// =============================================
// AUTO-RESIZE TEXTAREAS
// =============================================

function autoResizeTextarea(textarea) {
  if (!textarea || textarea.tagName !== 'TEXTAREA') return;
  if (textarea.offsetParent === null) return;
  textarea.style.overflowY = 'auto';
  textarea.style.height = 'auto';
  var maxHeight = 420;
  var style = window.getComputedStyle(textarea);
  var minHeight = parseFloat(style.minHeight) || textarea.offsetHeight || 0;
  var newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = Math.max(newHeight, minHeight) + 'px';
}
function initAutoResizeTextareas() {
  Array.from(document.querySelectorAll('textarea')).forEach(function(textarea) {
    autoResizeTextarea(textarea);
    if (textarea.dataset.autoresizeInit !== '1') {
      textarea.addEventListener('input', function() { autoResizeTextarea(textarea); });
      textarea.dataset.autoresizeInit = '1';
    }
  });
}
window.autoResizeTextarea = autoResizeTextarea;
window.initAutoResizeTextareas = initAutoResizeTextareas;
initAutoResizeTextareas();
var textareaObserver = new MutationObserver(function() { initAutoResizeTextareas(); });
textareaObserver.observe(document.body, { childList: true, subtree: true });

// =============================================
// EVENTOS — CAMPOS SIMPLES
// =============================================

// Campos de atributos de combate (range sliders + nível): disparam recalc via setState
['CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial);
  });
});

// HP/PM máximos: atualiza state sem recalc (o recalc sobrescreveria)
['MaxHP','EnergyMax'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial, { skipRecalc: true });
  });
});

// HP/PM atuais: atualiza state sem recalc, valida clamp
['CurrentHP','CurrentPM'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial, { skipRecalc: true });
  });
});

// Todos os outros campos simples: atualiza state sem recalc
FIELD_IDS.forEach(function(key) {
  if (RECALC_FIELDS.has(key)) return; // já wired acima
  if (['MaxHP','CurrentHP','EnergyMax','CurrentPM'].indexOf(key) >= 0) return;
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = NUMBER_FIELDS.has(key) ? (Number(el.value) || 0) : el.value;
    setState(partial, { skipRecalc: true });
  });
});

// Calculo inicial
recalcState();
state.CurrentHP = state.MaxHP;
state.CurrentPM = state.EnergyMax;
validateState();
render();

// =============================================
// BOTÕES DE AÇÃO
// =============================================

var resetBtn = document.getElementById('reset');
if (resetBtn) resetBtn.addEventListener('click', resetFicha);

var saveBtn = document.getElementById("save");
if (saveBtn) saveBtn.addEventListener("click", function() {
  var obrigatorios = [ids.CharClass, ids.CharPlayer, ids.PerName].filter(Boolean);
  var faltando = obrigatorios.filter(function(f) { return !f.value.trim(); });
  if (faltando.length > 0) {
    faltando.forEach(function(f) { f.classList.add('input-error'); f.focus(); });
    var camposNomes = faltando.map(function(f) {
      var label = f.closest('div') && f.closest('div').querySelector('label');
      return (label ? label.textContent.trim() : 'Campo').split('*')[0].trim();
    }).join(', ');
    showToast('Preencha: ' + camposNomes, 'error', 3500);
    setTimeout(function() { faltando.forEach(function(f) { f.classList.remove('input-error'); }); }, 2000);
    return;
  }
  try {
    localStorage.setItem("ficha-yby-p3r-skin", JSON.stringify(snapshot()));
    showToast("\u2713 Ficha salva com sucesso", 'success');
  } catch (e) {
    console.error("[Salvar] Erro ao salvar ficha:", e);
    showToast("Erro ao salvar a ficha", 'error');
  }
});

var loadBtn = document.getElementById("load");
if (loadBtn) loadBtn.addEventListener("click", function() {
  var raw = localStorage.getItem("ficha-yby-p3r-skin");
  if (!raw) return showToast("Nenhuma ficha salva", 'info');
  try { applySnapshot(JSON.parse(raw)); showToast("\u2713 Ficha carregada", 'success'); }
  catch (e) { showToast("Erro ao carregar ficha", 'error'); }
});

var exportBtn = document.getElementById("export");
if (exportBtn) exportBtn.addEventListener("click", function() {
  try {
    var json = JSON.stringify(snapshot(), null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.CharPlayer || 'ficha') + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("\u2713 Ficha exportada", 'success');
  } catch (e) {
    console.error("[Exportar] Erro ao exportar ficha:", e);
    showToast("Erro ao exportar ficha", 'error');
  }
});

var importBtn = document.getElementById("import");
if (importBtn) importBtn.addEventListener("click", function() {
  var i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json';
  i.onchange = function() {
    var f = i.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function() {
      try { applySnapshot(JSON.parse(r.result)); showToast("\u2713 Ficha importada", 'success'); }
      catch (e) { showToast("Erro ao importar ficha", 'error'); }
    };
    r.readAsText(f);
  };
  i.click();
});

// =============================================
// PDF
// =============================================

var fillBtn = document.getElementById("fill");
if (fillBtn) fillBtn.addEventListener("click", function() {
  var pdfFileBtn = document.getElementById("pdfFile");
  if (pdfFileBtn) pdfFileBtn.click();
});
var pdfFileEl = document.getElementById("pdfFile");
if (pdfFileEl) pdfFileEl.addEventListener("change", async function(ev) {
  var file = ev.target.files[0]; if (!file) return;
  var ab = await file.arrayBuffer();
  var pdfDoc = await PDFLib.PDFDocument.load(ab);
  var form = pdfDoc.getForm();
  function setTxt(name, val) { try { var field = form.getField(name); if (field.setText) field.setText(String(val != null ? val : "")); else if (field.select) field.select(String(val != null ? val : "")); } catch (e) {} }
  var s = snapshot(); var g = s.acessoRapido || {}; var p = s.persona || {}; var n = s.notes || {};
  var map = {
    CharName: g.PerName || g.CharPlayer || '', CharPlayer: g.CharPlayer || '', CharClass: g.CharClass || '', CharLvl: g.CharLvl || '', CharArcana: g.CharArcana || '',
    CharSTR: g.CharSTR || '', CharMAG: g.CharMAG || '', CharTEC: g.CharTEC || '', CharAGI: g.CharAGI || '', CharVIT: g.CharVIT || '', CharLCK: g.CharLCK || '',
    MaxHP: g.MaxHP || '', CurrentHP: g.CurrentHP || '', EnergyMax: g.EnergyMax || '', CurrentPM: g.CurrentPM || '', DmgRed: g.DmgRed || '',
    KNOPts: g.KNOPts || '', DISPts: g.DISPts || '', EMPpts: g.EMPpts || '', CHAPts: g.CHAPts || '', EXPPts: g.EXPPts || '', COUPts: g.COUPts || '',
    PerName: p.PerName || g.PerName || '', PerArcana: p.PerArcana || g.PerArcana || '', PerLvl: p.PerLvl || g.PerLvl || '', PerNotes: p.PerNotes || g.PerNotes || '',
    EquipList: (s.equip || []).map(function(e) { return '[' + e.tipo + '] ' + e.nome + ' \u2014 ' + e.efeito; }).join("\n"),
    SpellList: (s.spells || []).map(function(sp) { return sp.nome + ' (' + sp.tipo + ', ' + sp.custo + ') \u2014 ' + sp.efeito; }).join("\n"),
    LinksList: (s.links || []).map(function(l) { return l.nome + ' \u2014 ' + l.arcana + ' Rk.' + l.rank + (l.obs ? (' \u2014 ' + l.obs) : ''); }).join("\n"),
    NotesDiary: n.diary || '', NotesGoals: n.goals || '',
    NotesClues: (n.clues || []).map(function(c) { return '\u2022 ' + c.titulo + ': ' + c.desc + ' [' + c.evid + '] (' + c.status + ')'; }).join("\n"),
    NotesContacts: (n.contacts || []).map(function(c) { return '\u2022 ' + c.nome + ' (' + c.tipo + ') \u2014 ' + c.obs; }).join("\n")
  };
  var AF_MAP = {"Físico":"AF_Fisico","Fogo":"AF_Fogo","Gelo":"AF_Gelo","Vento":"AF_Vento","Raio":"AF_Raio","Nuclear":"AF_Nuclear","PSY":"AF_PSY","Luz":"AF_Luz","Trevas":"AF_Trevas","Onipotente":"AF_Onipotente"};
  Object.entries(AF_MAP).forEach(function(entry) { setTxt(entry[1], (s.affinities && s.affinities[entry[0]]) || 'Normal'); });
  Object.entries(map).forEach(function(entry) { setTxt(entry[0], entry[1]); });
  var filled = await pdfDoc.save();
  var blob = new Blob([filled], { type: "application/pdf" });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (g.CharName || 'ficha') + " - Preenchida.pdf";
  a.click();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
});

// =============================================
// PNG
// =============================================

var pngBtn = document.getElementById("png");
if (pngBtn) pngBtn.addEventListener("click", async function() {
  if (typeof html2canvas !== "function") { showToast("html2canvas bloqueado no preview. Teste local.", 'error', 3500); return; }
  var node = document.getElementById('captureRoot');
  if (!node) return;
  var canvas = await html2canvas(node, { backgroundColor: null, scale: 2, useCORS: true });
  canvas.toBlob(function(blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.CharPlayer || 'ficha') + ".png";
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
  });
});

// =============================================
// PRINT
// =============================================

var printBtn = document.getElementById('print');
if (printBtn) printBtn.addEventListener('click', function() { window.print(); });

// =============================================
// TESTES
// =============================================

function runTests() {
  var out = document.getElementById('tests-out');
  var card = document.getElementById('tests-card');
  if (card) card.style.display = 'block';
  var logs = [];
  function ok(name, cond, expect, got) { logs.push((cond ? '\u2705' : '\u274C') + ' ' + name + (cond ? '' : ' \u2014 esperado ' + expect + ', obtido ' + got)); }

  var backup = snapshot();

  // Teste 1: HP/PM lvl1
  setState({ CharLvl: 1, CharVIT: 1, CharMAG: 1, CharAGI: 2 }, { skipSave: true });
  ok('PV lvl1/VIT1 = 31', state.MaxHP === 31, 31, state.MaxHP);
  ok('PM lvl1/MAG1 = 27', state.EnergyMax === 27, 27, state.EnergyMax);

  // Teste 2: HP/PM lvl10
  setState({ CharLvl: 10, CharVIT: 4, CharMAG: 3, CharAGI: 3 }, { skipSave: true });
  ok('PV lvl10/VIT4 = 115', state.MaxHP === 115, 115, state.MaxHP);
  ok('PM lvl10/MAG3 = 76', state.EnergyMax === 76, 76, state.EnergyMax);

  // Badge check
  var bAGI = document.getElementById('bAGI');
  ok('Init = AGI (badge bAGI)', Number((bAGI || {}).textContent || 0) === 3, 3, (bAGI || {}).textContent || '');

  // Afinidades
  var afCount = document.querySelectorAll('[id^="AF_"]').length;
  ok('Afinidades \u2014 10 selects', afCount === 10, 10, afCount);

  // State integration check
  ok('getState() retorna objeto', typeof getState() === 'object', 'object', typeof getState());
  ok('state.CharLvl === 10', state.CharLvl === 10, 10, state.CharLvl);

  // Restaurar
  applySnapshot(backup);

  if (out) out.innerHTML = logs.map(function(l) { return '<div>' + l + '</div>'; }).join('');
}
var testsBtn = document.getElementById('tests');
if (testsBtn) testsBtn.addEventListener('click', runTests);

// =============================================
// SEED (linhas vazias iniciais)
// =============================================

function seed() {
  addEq(); syncEquipToState();
  addSpell(); syncSpellsToState();
  addLink(); syncLinksToState();
  addClue(); syncCluesToState();
  addCtt(); syncContactsToState();
}

// =============================================
// AUTO-LOAD
// =============================================

var _autoLoaded = false;
try {
  var raw = localStorage.getItem("ficha-yby-p3r-skin");
  if (raw) {
    var data = JSON.parse(raw);
    if (data && typeof data === 'object' && data.id === "ficha-yby-p3r-skin") {
      applySnapshot(data);
      _autoLoaded = true;
    } else {
      console.warn("[Auto-load] Dados inválidos no localStorage, ignorando.");
    }
  }
} catch (e) {
  console.warn("[Auto-load] Erro ao carregar:", e);
}
if (!_autoLoaded) seed();

// =============================================
// AUTO-SAVE
// =============================================

function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var self = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(self, args); }, delay);
  };
}

var saveIndicator = document.createElement('div');
saveIndicator.id = 'auto-save-indicator';
saveIndicator.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;background:rgba(30,30,30,0.85);opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999;backdrop-filter:blur(6px);';
document.body.appendChild(saveIndicator);
var saveIndicatorTimer = null;

function showSaveStatus(text, duration) {
  saveIndicator.textContent = text;
  saveIndicator.style.opacity = '1';
  if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
  if (duration) {
    saveIndicatorTimer = setTimeout(function() { saveIndicator.style.opacity = '0'; }, duration);
  }
}

var _saving = false;
function autoSave() {
  if (_saving || _rendering) return;
  _saving = true;
  try {
    showSaveStatus('Salvando...');
    var json = JSON.stringify(snapshot());
    localStorage.setItem("ficha-yby-p3r-skin", json);
    showSaveStatus('Salvo \u2714', 2000);
  } catch (e) {
    console.warn("[Auto-save] Erro ao salvar:", e);
    showSaveStatus('Erro ao salvar', 3000);
  } finally {
    _saving = false;
  }
}

var debouncedAutoSave = debounce(autoSave, 500);
window.debouncedAutoSave = debouncedAutoSave;

// Eventos globais de auto-save (captura edições em tabelas e outros campos não wired)
document.addEventListener('input', function() { if (!_rendering) debouncedAutoSave(); });
document.addEventListener('change', function() { if (!_rendering) debouncedAutoSave(); });

// Observer para tabelas dinâmicas
var autoSaveTableIds = ['tbl-eq','tbl-spell','tbl-link','tbl-clue','tbl-ctt','tbl-mod'];
var tableObserver = new MutationObserver(function() {
  setTimeout(debouncedAutoSave, 100);
});
autoSaveTableIds.forEach(function(id) {
  var tbody = document.querySelector('#' + id + ' tbody');
  if (tbody) tableObserver.observe(tbody, { childList: true, subtree: true });
});

// Safety net: salvar ao fechar
window.addEventListener('beforeunload', function() {
  try { localStorage.setItem("ficha-yby-p3r-skin", JSON.stringify(snapshot())); }
  catch (e) {}
});

// Expor API global
window.state = state;
window.setState = setState;
window.getState = getState;
window.autoSave = autoSave;

})();
