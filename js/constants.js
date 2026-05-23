// =============================================
// CONSTANTES E DADOS DO SISTEMA
// Responsabilidade: exportar todas as listas e
// dados fixos usados pelos demais módulos.
// =============================================

export const ELEMENTS = [
  'Físico','Fogo','Gelo','Vento','Raio','Nuclear','PSY','Luz','Trevas','Onipotente'
];

export const EL_IDS = {
  'Físico':'Fisico','Fogo':'Fogo','Gelo':'Gelo','Vento':'Vento','Raio':'Raio',
  'Nuclear':'Nuclear','PSY':'PSY','Luz':'Luz','Trevas':'Trevas','Onipotente':'Onipotente'
};

export const RELS = ['Normal','Fraco','Resiste','Anula','Reflete','Absorve'];

export const ARCANAS = [
  '','0 - Louco','I - Mago','II - Sacerdotisa','III - Imperatriz','IV - Imperador',
  'V - Hierofante','VI - Enamorados','VII - Carruagem','VIII - Força','IX - Eremita',
  'X - Roda da Fortuna','XI - Justiça','XII - Enforcado','XIII - Morte','XIV - Temperança',
  'XV - Diabo','XVI - Torre','XVII - Estrela','XVIII - Lua','XIX - Sol',
  'XX - Julgamento','XXI - Mundo'
];

export const MOD_TARGETS = ['STR','MAG','TEC','AGI','VIT','LCK','HP','PM'];

// =============================================
// FEITOS
// =============================================

export const FEITOS_LIST = [
  // ── Geral ──
  { id: 'mente_aberta', name: 'Mente Aberta', cat: 'Geral', desc: 'Durante uma cena de Interlúdio, pode selecionar uma Magia de seu Deck como principal de Mente Aberta. Em combate pode utilizá-la por apenas 1 PM. Pode ser utilizado igual à sua MAG (Limitado a 3 Usos).' },
  { id: 'longe_do_fim', name: 'Longe do Fim', cat: 'Geral', desc: 'Recebe +5 de PM Máximo extra para cada Novo Nível (Afeta Níveis posteriores).' },
  { id: 'habil', name: 'Hábil', cat: 'Geral', desc: 'Concede +1 para uma Habilidade de Combate ou +3 para uma Habilidade Social. (Pode ser adquirido várias vezes)' },
  // ── Social ──
  { id: 'furioso', name: 'Furioso', cat: 'Social', desc: 'Você pode, como uma Ação Rápida, receber os efeitos de Fúria. Você não pode ser curado desse Status ou se recuperar naturalmente dele até o final do seu próximo turno e não recebe mais a Penalidade de Acerto enquanto enfurecido.', prereq: 'Tier I em Coragem' },
  { id: 'auxilio_altruista', name: 'Auxílio Altruísta', cat: 'Social', desc: 'Como uma Ação Padrão, você pode sacrificar até 50% do seu PV atual para aumentar o PV Máximo de um alvo adjacente igual à quantidade sacrificada. Alvos dessa habilidade que estiverem com 0 PV só recebem o sacrifício como Cura.', prereq: 'Tier I em Empatia' },
  { id: 'um_em_espirito', name: 'Um em Espírito', cat: 'Social', desc: 'Quando você atingir uma Fraqueza pela primeira vez em uma Sombra ou atingir um Golpe Crítico, você pode Atacar novamente com uma Ação Livre. (O Ataque Extra causado por atingir uma Fraqueza só é ativado uma única vez por combate, mas Golpes Críticos continuam aplicando os Ataques Extras.)', prereq: 'Tier I em Conhecimento ou Disciplina' },
  { id: 'explorador', name: 'Explorador', cat: 'Social', desc: 'Qualquer teste de Disciplina relacionado à ação de Procurar e Investigar no Metaverso; o Narrador tratará seu personagem como permanentemente procurando. Você pode re-rolar qualquer teste relacionado à procura de itens ou aparatos, uma vez por teste.', prereq: 'Tier I em Disciplina' },
  { id: 'prodigio_auxilio', name: 'Prodígio em Auxílio', cat: 'Social', desc: 'Sempre que utilizar uma magia que conceda buff ou efeitos especiais semelhantes, a duração é aumentada em 1 rodada e o efeito é aumentado equivalente ao seu Tier de Empatia.', prereq: '8 de Magia e Tier I em Empatia' },
  { id: 'prodigio_recuperacao', name: 'Prodígio em Recuperação', cat: 'Social', desc: 'Sempre que estiver sofrendo um efeito negativo ou status, quando for se recuperar recebe sua MAG ou VIT como porcentagem bônus para a recuperação desse efeito. Sempre que se recuperar de uma penalidade, recebe Vitalidade como PV ou Magia como PM.', prereq: '6 de Magia ou Vitalidade e Tier I em Coragem ou Disciplina' },
  { id: 'prodigio_cura', name: 'Prodígio em Cura', cat: 'Social', desc: 'Sempre que utilizar uma magia de cura, independente do Tier, pode escolher utilizar a média do dado arredondada para baixo sem precisar rolar os dados. Em troca, o custo da magia de cura é reduzido pela metade. Esse efeito pode ser utilizado uma quantidade de vezes igual à metade da sua MAG por descanso longo.', prereq: '8 de MAG e Tier I em Conhecimento' },
  { id: 'prodigio_provocar', name: 'Prodígio em Provocar', cat: 'Social', desc: 'Reduz o custo de PM de qualquer magia de status equivalente à sua MAG. Sempre que um alvo inimigo não conseguir se recuperar do efeito negativo, você recebe PM Temporário equivalente à sua MAG. O PM Temporário dura apenas até o fim do combate.', prereq: '8 de Magia e Tier I em Charme' },
  { id: 'prodigio_aprendizado', name: 'Prodígio em Aprendizado', cat: 'Social', desc: 'Você tem a capacidade de subir 1 Habilidade Social que esteja no Tier 0 para se tornar automaticamente Tier I.', prereq: 'Nível 4 de personagem e Tier II em Disciplina ou Tier II em Conhecimento' },
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
  { id: 'prodigio_ataque', name: 'Prodígio em Ataque', cat: 'Combate', desc: 'Enquanto empunhar uma arma corpo a corpo, sempre que utilizar uma magia, pode utilizar a arma empunhada para atacar com uma ação livre, caso haja um alvo em seu alcance.', prereq: '8 de Técnica e Tier I em Disciplina' },
  { id: 'prodigio_defesa', name: 'Prodígio em Defesa', cat: 'Combate', desc: 'Você se torna capaz de utilizar sua TEC em testes para reagir a ataques no lugar de sua Agilidade.', prereq: '8 de Técnica e Tier I em Disciplina' },
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
  { id: 'prodigio_corrida', name: 'Prodígio em Corrida', cat: 'Atributos', desc: 'O movimento padrão do personagem é dobrado. Quando se movimenta em direção a um alvo inimigo, o movimento gasto se torna Vida Temporária que dura até o final do seu próximo turno. Agora também é possível se movimentar em paredes e superfícies extremas sem necessidade de testes.', prereq: '8 de Agilidade e Tier I em Disciplina' },
  { id: 'prodigio_protecao', name: 'Prodígio em Proteção', cat: 'Atributos', desc: 'Sua Redução de Dano passiva passa a reduzir todo tipo de dano que não seja do tipo Onipotente.', prereq: '8 de Vitalidade e Tier I em Coragem' },
  // ── Convicção ──
  { id: 'teu_proprio_ser', name: 'Teu Próprio Ser', cat: 'Convicção', desc: 'Você pode alterar a Convicção da sua Persona inicial. (Só pode ser escolhido uma vez a cada quatro níveis)', prereq: 'CNv. 4' },
  { id: 'perseveranca', name: 'Perseverança', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e uma de suas Fraquezas. A Persona perde a Fraqueza selecionada. (Só pode ser escolhido uma vez a cada cinco níveis)', prereq: 'CNv. 10' },
  { id: 'feito_de_ferro', name: 'Feito de Ferro', cat: 'Convicção', desc: 'Cada vez que você escolher esse feito, escolha uma Persona e um Tipo ao qual ela não tem nenhuma interação. A Persona ganha Resistir a esse Tipo. (Só pode ser escolhido duas vezes)', prereq: 'CNv. 10' },
  { id: 'vontade_de_ferro', name: 'Vontade de Ferro', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e um Tipo que ela Resista. A Persona ganha Anular contra o Tipo selecionado. (Só pode ser escolhido duas vezes)', prereq: 'CNv. 10' },
  { id: 'inabalavel', name: 'Inabalável', cat: 'Convicção', desc: 'Cada vez que você escolher esse Feito, escolha uma Persona e um Tipo que ela Anule ou Reflita. Sacrifique o uso de uma magia do seu deck permanentemente para melhorar a interação do Tipo: De Anular para Refletir e Refletir para Drenar. (Só pode ser escolhido uma vez)', prereq: 'CNv. 10' },
  { id: 'intrinseco', name: 'Intrínseco', cat: 'Convicção', desc: 'Você pode adicionar um novo Aspecto Livre ao seu personagem. (Só pode ser escolhido duas vezes, a segunda escolha só pode ser feita no CNv. 20.)', prereq: 'CNv. 10' }
];

// =============================================
// CONDIÇÕES
// =============================================

export const CONDITIONS_LIST = [
  { id: 'charme',    name: 'Charme',    desc: 'Põe o personagem sob o controle do Narrador, ou faz um inimigo atacar os próprios aliados e conjurar magias benéficas para os jogadores.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'panico',    name: 'Pânico',    desc: 'Previne o uso da Persona ou o uso de habilidades especiais do inimigo.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'medo',      name: 'Medo',      desc: 'Role 2 dados e pegue o pior nas esquivas.\nNo final do turno, chance de recuperação: 33%.\nSe não se recuperar, perde um uso de magia aleatória ou 1 PM.' },
  { id: 'furia',     name: 'Fúria',     desc: 'Aumenta o dano físico causado e recebido em 50%.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.\nVocê pode optar por recusar o teste de recuperação.' },
  { id: 'atordoado', name: 'Atordoado', desc: 'Role 2 dados e pegue o pior na esquiva.\nNão pode usar ações Livres, Rápidas ou de Interromper.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'choque',    name: 'Choque',    desc: 'Todos os ataques recebidos têm sucesso automático.\nAtaques contra o alvo rolam 2 dados e pegam o melhor para críticos.\nNo final do turno, o alvo se recupera automaticamente.' },
  { id: 'lento',     name: 'Lento',     desc: 'Movimento reduzido pela metade.\nRole 2 dados e pegue o pior no ataque.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'veneno',    name: 'Veneno',    desc: 'Causa 20% do seu PV máximo como dano por turno.\nNo final do turno, chance de recuperação: 33%.' },
  { id: 'derrubado', name: 'Derrubado', desc: 'Você joga 3 dados de esquiva e pega o pior.\nNo final do turno do personagem o mesmo se recupera.\nUm aliado pode usar ação de movimento para recuperar um personagem instantaneamente.' }
];

// =============================================
// HABILIDADES SOCIAIS — METADADOS
// =============================================

export const SOCIAL_SKILL_META = {
  KNOPts: { name: 'Conhecimento', titles: ['Preguiçoso','Ciente','Sabido','Estudado','Enciclopédico','Erudito'], desc: [
    'Título: Preguiçoso.',
    'Tier I — Ciente: uma vez por cena, revela uma Fraqueza de uma Sombra que você possa ver.',
    'Tier II — Sabido: Essa habilidade pode ser utilizada igual ao seu Tier de Conhecimento. Quando um alvo que você possa ver declara um ataque utilizando uma [Magia], pode gastar sua reação para rolar um teste de (MAG vs MAG), se for bem sucedido impede o uso da magia inimiga.',
    'Tier III — Estudado: bônus permanente de +1 MAG e +1 TEC.',
    'Tier IV — Enciclopédico: uma vez por Combate, pode conjurar uma magia sem gastar Energia e suas [Magias] somam (Metade do Bônus total) da habilidade social como (Dano Bônus).',
    'Tier V — Erudito: crie uma característica especial relacionado a Conhecimento e uma vez por descanso longo pode recuperar Metade de seus Pontos de Magia.'
  ]},
  DISPts: { name: 'Disciplina', titles: ['Desatento','Decente','Persistente','Minucioso','Magistral','Transcendente'], desc: [
    'Tier 0 — Desatento.',
    'Tier I — Recebe permanentemente [+10 de PV] e [+10 de PM].',
    'Tier II — Persistente: passa a receber (+2 de PM) por nível e uma vez por rodada pode reduzir em (-2) o teste de acerto de um Inimigo que você possa ver, pode ser utilizado quantidade de vezes igual sua TEC e recupera 1 uso por descanso longo.',
    'Tier III — Minucioso: concede Vantagem em testes relacionados a Perceber, Investigar e Focar. Se estiver sob condição mental o efeito dessa habilidade não funcionará.',
    'Tier IV — Magistral: Soma o Tier em testes de Ataque como acerto bônus.',
    'Tier V — Transcendente: uma vez por combate, pode escolher causar um (Ataque Crítico) automático, pode ser utilizado quantidade de vezes igual metade de sua TEC e recupera 1 uso por descanso longo.'
  ]},
  EMPpts: { name: 'Empatia', titles: ['Indiferente','Inofensivo','Gentil','Generoso','Altruísta','Angelical'], desc: [
    'Tier 0 — Indiferente.',
    'Tier I — Inofensivo: uma vez por combate, pode conceder um sucesso automático em teste de resistência contra Status Mental de um aliado que possa ouvir você.',
    'Tier II — Gentil: uma vez por descanso longo, remove toda e qualquer Condições Negativa, Penalidades e Status Mentais que esteja afetando você (ação livre).',
    'Tier III — Generoso: uma vez por combate pode escolher, aumentar a duração de Buff\'s em aliados em (+3 Rodadas) ou copiar os mesmos efeitos para um outro aliado que você possa ver.',
    'Tier IV — Altruísta: enquanto estiver no combate, seus aliados recebem seu (Tier de Empatia) como bônus em testes para resistir a condições negativas, caso seja em (Porcentagem %), para cada Tier aumenta a chance de seu aliado superar o teste em [5%].',
    'Tier V — Angelical: Se torna (Imune) a condições negativas enquanto estiver adjacente a um aliado e recebe a Reação Elemental (Refletir) ao elemento que o Aliado próximo possui como fraqueza. Se o aliado for afetado por uma condição negativa os efeitos dessa habilidade são retiradas.'
  ]},
  EXPPts: { name: 'Expressão', titles: ['Monótono','Rudimentar','Eloquente','Inspirador','Tocante','Fascinante'], desc: [
    'Tier 0 — Monótono: Nenhum benefício. A habilidade ainda não foi desenvolvida o suficiente para gerar efeitos.',
    'Tier I — Rudimentar: Essa habilidade pode ser utilizada igual ao seu Tier de Expressão, com uma Ação de Interromper, todos aliados recebe (+1 de Margem Crítica) sem gastar Cargas de Sorte.',
    'Tier II — Eloquente: Essa habilidade pode ser utilizada igual ao seu Tier de Expressão. Com uma Ação de Interromper pode conceder (Vantagem) em testes de esquiva de um aliado que você possa ver, até fim do próximo turno dele.',
    'Tier III — Inspirador: uma vez por combate, marca um alvo inimigo que você possa ver e causa "Debochar". Alvos sob o efeito de "Debochar" têm desvantagens em testes para superar condições e status negativos por 1 Cena.',
    'Tier IV — Tocante: escolha um aliado assim que iniciar um combate para se tornar um "Ajudante", esse aliado recebe (+2 em Margem Crítica), e uma vez por combate esse aliado não pode (Errar Ataques) por 2 rodadas.',
    'Tier V — Fascinante: uma vez por descanso longo aumenta todos os atributos de combate em +2 de todos os seus aliados por 1 Cena. Esse efeito dura 1 Cena e pode superar o limite de 12 em Atributos de Combate.'
  ]},
  COUPts: { name: 'Coragem', titles: ['Tímido','Comum','Determinado','Firme','Destemido','Fodão'], desc: [
    'Tier 0 — Tímido: Nenhum benefício. A habilidade ainda não foi desenvolvida o suficiente para gerar efeitos.',
    'Tier I — Comum: Essa habilidade pode ser utilizada igual ao seu Tier de Coragem, ao declarar ataque, pode adicionar Redução de Dano ao cálculo de dano.',
    'Tier II — Determinado: Recebe [+25 de PV] permanente e +1 de VIG. E uma vez por combate pode replicar efeitos negativos afetando você para um alvo inimigo que você possa ver.',
    'Tier III — Firme: recebe +1 FOR e +1 VIG permanente. E sempre que for alvo de um efeito de (Medo) recebe seu Tier de Coragem como bônus para resistir. Cada ponto de Tier aumenta em [5%] para superar o efeito.',
    'Tier IV — Destemido: quando receber Dano Elemental que não seja a sua Fraqueza, recebe seu Tier de Coragem como [Dados de Dano Bônus] para seu próximo ataque. (Esses dados não são multiplicados em acertos críticos ou dobrados por efeitos de fraqueza.)',
    'Tier V — Fodão: Possui imunidade total a efeitos de Pavor & Medo. E recebe uma Reação Elemental nova, podendo ser entre: Resistir, Refletir, Absorver ou Anular.'
  ]},
  CHAPts: { name: 'Charme', titles: ['Sem Graça','Existente','Confiante','Suave','Popular','Debonair'], desc: [
    'Tier 0 — Sem Graça.',
    'Tier I — Existente: Essa habilidade pode ser utilizada igual ao seu Tier de Charme, aumenta em [5%] a dificuldade para superar uma Condição ou Status negativa de um alvo que você possa ver.',
    'Tier II — Confiante: Recebe +1 de MAG e sempre que fizer um teste de Charme, adicione o Tier como bônus extra.',
    'Tier III — Suave: Magias de (Stats) custam apenas [Metade do Custo] de PM. ',
    'Tier IV — Popular: Essa habilidade pode ser utilizada igual ao seu Tier de Charme, quando um alvo inimigo efetuar um Ataque pode utilizar uma Ação de Interromper como Reação. Faz um teste de [Charme vs Conhecimento], se o alvo inimigo falhar pode mudar o alvo de ataque para outro alvo do combate, se não houver um alvo no combate para o ataque ser redirecionado o alvo apenas errará.',
    'Tier V — Debonair: recebe +2 de MAG e toda condição que for aplicada por você tem sua duração aumentada em [+3 Rodadas], e todo e qualquer teste para superar uma Condição ou Status tem desvantagem. Alvos que estiverem sob efeitos de suas condições negativas tem seu bônus de [Acerto & Esquiva] reduzidos igual a seu Tier.'
  ]}
};

export const SOCIAL_IDS = ['KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts'];
export const INITIAL_SOCIAL_POINTS = 7;

// =============================================
// HABILIDADES SOCIAIS — EFEITOS POR TIER
// Tiers são acumulativos. computeSocialModifiers()
// coleta todos os tiers de 1 até o tier atual.
// =============================================

export const SOCIAL_EFFECTS = {
  KNOPts: [
    { auto: [], manual: [] },
    { auto: [], manual: ['Uma vez por cena: revela uma Fraqueza de uma Sombra visível.'] },
    { auto: [], manual: ['Pode usar essa habilidade igual ao Tier de Conhecimento.', 'Reação: teste MAG vs MAG para cancelar Magia inimiga declarada.'] },
    { auto: [{ alvo: 'MAG', tipo: 'flat', valor: 1, label: '+1 MAG (Conhecimento III)' }, { alvo: 'TEC', tipo: 'flat', valor: 1, label: '+1 TEC (Conhecimento III)' }], manual: [] },
    { auto: [], manual: ['Uma vez por Combate: conjura uma magia sem gastar PM.', 'Magias somam metade do bônus total de Conhecimento como Dano Bônus.'] },
    { auto: [], manual: ['Crie uma característica especial relacionada a Conhecimento.', 'Uma vez por descanso longo: recupera metade dos PM.'] }
  ],
  DISPts: [
    { auto: [], manual: [] },
    { auto: [{ alvo: 'HP', tipo: 'flat', valor: 10, label: '+10 PV (Disciplina I)' }, { alvo: 'PM', tipo: 'flat', valor: 10, label: '+10 PM (Disciplina I)' }], manual: [] },
    { auto: [], manual: ['Recebe +2 de PM por nível.', 'Uma vez por rodada: reduz em -2 o teste de acerto de um inimigo visível (usa TEC, recupera 1 uso por descanso longo).'] },
    { auto: [], manual: ['Vantagem em testes de Perceber, Investigar e Focar (exceto sob condição mental).'] },
    { auto: [], manual: ['Soma o Tier de Disciplina como acerto bônus em testes de Ataque.'] },
    { auto: [], manual: ['Uma vez por combate: causa Ataque Crítico automático (usa metade da TEC, recupera 1 por descanso longo).'] }
  ],
  EMPpts: [
    { auto: [], manual: [] },
    { auto: [], manual: ['Uma vez por combate: concede sucesso automático em resistência a Status Mental de um aliado que ouça você.'] },
    { auto: [], manual: ['Uma vez por descanso longo: remove todas as Condições Negativas, Penalidades e Status Mentais de você mesmo (Ação Livre).'] },
    { auto: [], manual: ['Uma vez por combate: aumenta duração de Buffs em aliados em +3 Rodadas, OU copia os mesmos efeitos para outro aliado visível.'] },
    { auto: [], manual: ['Aliados recebem Tier de Empatia como bônus em testes contra condições negativas (+5% por Tier).'] },
    { auto: [], manual: ['Imune a condições negativas enquanto adjacente a um aliado.', 'Reação Elemental: Refletir o elemento fraqueza do aliado próximo.'] }
  ],
  EXPPts: [
    { auto: [], manual: [] },
    { auto: [], manual: ['Ação de Interromper: concede +1 Margem Crítica a todos os aliados sem gastar Cargas de Sorte (usa Tier vezes).'] },
    { auto: [], manual: ['Ação de Interromper: concede Vantagem em esquiva a um aliado visível até fim do próximo turno (usa Tier vezes).'] },
    { auto: [], manual: ['Uma vez por combate: marca inimigo visível com "Debochar" — desvantagem em testes contra condições por 1 Cena.'] },
    { auto: [], manual: ['Ao iniciar combate: escolhe um aliado "Ajudante" (+2 Margem Crítica), que uma vez por combate não pode errar ataques por 2 rodadas.'] },
    { auto: [], manual: ['Uma vez por descanso longo: +2 em todos os atributos de combate de todos os aliados por 1 Cena (pode superar limite de 12).'] }
  ],
  COUPts: [
    { auto: [], manual: [] },
    { auto: [], manual: ['Ao declarar ataque: pode adicionar Redução de Dano ao cálculo de dano (usa Tier vezes).'] },
    { auto: [{ alvo: 'HP', tipo: 'flat', valor: 25, label: '+25 PV (Coragem II)' }, { alvo: 'VIT', tipo: 'flat', valor: 1, label: '+1 VIT (Coragem II)' }], manual: ['Uma vez por combate: replica efeitos negativos sofridos para um inimigo visível.'] },
    { auto: [{ alvo: 'STR', tipo: 'flat', valor: 1, label: '+1 STR (Coragem III)' }, { alvo: 'VIT', tipo: 'flat', valor: 1, label: '+1 VIT (Coragem III)' }], manual: ['Ao sofrer efeito de Medo: +Tier de Coragem como bônus para resistir (+5% por Tier).'] },
    { auto: [], manual: ['Ao receber Dano Elemental (exceto Fraqueza): próximo ataque ganha +Tier de Coragem em Dados de Dano Bônus.'] },
    { auto: [], manual: ['Imune a Pavor e Medo.', 'Recebe nova Reação Elemental (escolha: Resistir, Refletir, Absorver ou Anular).'] }
  ],
  CHAPts: [
    { auto: [], manual: [] },
    { auto: [], manual: ['Aumenta em 5% a dificuldade para superar Condição ou Status de um alvo visível (usa Tier vezes).'] },
    { auto: [{ alvo: 'MAG', tipo: 'flat', valor: 1, label: '+1 MAG (Charme II)' }], manual: ['Em testes de Charme: adiciona o Tier como bônus extra.'] },
    { auto: [], manual: ['Magias de Stats custam apenas metade do PM.'] },
    { auto: [], manual: ['Reação (Ação de Interromper): teste Charme vs Conhecimento — se inimigo falhar, redireciona ataque dele para outro alvo.'] },
    { auto: [{ alvo: 'MAG', tipo: 'flat', valor: 2, label: '+2 MAG (Charme V)' }], manual: ['Condições aplicadas por você: duração +3 Rodadas.', 'Testes para superar condições suas: desvantagem.', 'Alvos com suas condições: Acerto & Esquiva reduzidos pelo Tier.'] }
  ]
};
