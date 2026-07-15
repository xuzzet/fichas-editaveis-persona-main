// =============================================
// DESPERTAR TRAMA — Árvore de habilidades por Arcana
// Sistema aditivo: NÃO altera Persona, Arcana, atributos,
// combate, magias, rolagens ou cálculos existentes.
// Depende apenas de: state.js
// =============================================

import { state } from './state.js';

// =============================================
// MAPA DE ARCANAS (nome PT → chave / romano / exibição)
// A chave alimenta o caminho da imagem em ARCANA_CARD_IMAGES.
// =============================================
export const ARCANA_MAP = {
  'Louco':            { key: 'fool',        roman: '0',     display: 'O Louco' },
  'Mago':             { key: 'magician',    roman: 'I',     display: 'O Mago' },
  'Sacerdotisa':      { key: 'priestess',   roman: 'II',    display: 'A Sacerdotisa' },
  'Imperatriz':       { key: 'empress',     roman: 'III',   display: 'A Imperatriz' },
  'Imperador':        { key: 'emperor',     roman: 'IV',    display: 'O Imperador' },
  'Hierofante':       { key: 'hierophant',  roman: 'V',     display: 'O Hierofante' },
  'Enamorados':       { key: 'lovers',      roman: 'VI',    display: 'Os Enamorados' },
  'Carruagem':        { key: 'chariot',     roman: 'VII',   display: 'A Carruagem' },
  'Força':            { key: 'strength',    roman: 'VIII',  display: 'A Força' },
  'Eremita':          { key: 'hermit',      roman: 'IX',    display: 'O Eremita' },
  'Roda da Fortuna':  { key: 'fortune',     roman: 'X',     display: 'A Roda da Fortuna' },
  'Justiça':          { key: 'justice',     roman: 'XI',    display: 'A Justiça' },
  'Enforcado':        { key: 'hanged-man',  roman: 'XII',   display: 'O Enforcado' },
  'Morte':            { key: 'death',       roman: 'XIII',  display: 'A Morte' },
  'Temperança':       { key: 'temperance',  roman: 'XIV',   display: 'A Temperança' },
  'Diabo':            { key: 'devil',       roman: 'XV',    display: 'O Diabo' },
  'Torre':            { key: 'tower',       roman: 'XVI',   display: 'A Torre' },
  'Estrela':          { key: 'star',        roman: 'XVII',  display: 'A Estrela' },
  'Lua':              { key: 'moon',        roman: 'XVIII', display: 'A Lua' },
  'Sol':              { key: 'sun',         roman: 'XIX',   display: 'O Sol' },
  'Julgamento':       { key: 'judgement',   roman: 'XX',    display: 'O Julgamento' },
  'Mundo':            { key: 'world',       roman: 'XXI',   display: 'O Mundo' }
};

// Mapeamento Arcana → imagem da carta (com fallback textual no render).
// As imagens ficam na pasta ./Elements do projeto. Arcanas sem arquivo
// correspondente exibem automaticamente o numeral romano como fallback.
export const ARCANA_CARD_IMAGES = (function () {
  var base = './Elements/';
  var out = { back: base + 'card-back.png' };
  Object.keys(ARCANA_MAP).forEach(function (name) {
    var info = ARCANA_MAP[name];
    out[info.key] = base + info.key + '.png';
  });
  return out;
})();

/**
 * Extrai as informações da Arcana a partir do valor do <select> PerArcana.
 * Ex.: "XIII - Morte" → { key:'death', roman:'XIII', display:'A Morte', name:'Morte' }
 * @param {string} value
 * @returns {object|null}
 */
export function getArcanaInfo(value) {
  if (!value) return null;
  var parts = String(value).split(' - ');
  var name = (parts.length > 1 ? parts[1] : parts[0]).trim();
  var info = ARCANA_MAP[name];
  if (!info) return null;
  return { key: info.key, roman: info.roman, display: info.display, name: name };
}

// =============================================
// VERTENTES (6 cartas principais) + posição na composição
// =============================================
export const VERTENTES = [
  { key: 'impeto',      name: 'Ímpeto',      glyph: '\u2694', pos: 'top' },
  { key: 'cognicao',    name: 'Cognição',    glyph: '\u2726', pos: 'left-top' },
  { key: 'elo',         name: 'Elo',         glyph: '\u2766', pos: 'right-top' },
  { key: 'artificio',   name: 'Artifício',   glyph: '\u2699', pos: 'left-bottom' },
  { key: 'autocuidado', name: 'Autocuidado', glyph: '\u271A', pos: 'right-bottom' },
  { key: 'resolucao',   name: 'Resolução',   glyph: '\u2735', pos: 'bottom' }
];

// Níveis de desbloqueio por tier [principal, ampliação I, ampliação II].
// Cobrem os limiares: 2,4,6,8,9,10,12,14,16,18,20.
const TIER_LEVELS = {
  impeto:      [2, 8, 14],
  cognicao:    [4, 10, 16],
  elo:         [6, 12, 18],
  artificio:   [2, 9, 20],
  autocuidado: [4, 10, 20],
  resolucao:   [6, 12, 20]
};

// Conteúdo-base das habilidades. As descrições recebem o nome de exibição da
// Arcana atual (`a`), gerando uma leitura própria para cada Arcana.
// Pode ser sobrescrito por Arcana em AWAKENING_OVERRIDES (abaixo).
const CONTENT = {
  impeto: {
    main: { name: 'Golpe do Ímpeto',   desc: function (a) { return 'Desperta a agressividade latente de ' + a + '. Uma vez por cena, o primeiro ataque contra um inimigo carrega o peso da Arcana, somando um impulso extra ao dano.'; } },
    amp1: { name: 'Contra-Ímpeto',     desc: function (a) { return 'Quando ' + a + ' é atingida, a fúria responde: reduz levemente o próximo dano recebido e devolve parte da energia como ímpeto ofensivo.'; } },
    amp2: { name: 'Ápice do Ímpeto',   desc: function (a) { return 'O clímax da vontade de ' + a + '. Uma vez por combate, concentre todo o ímpeto em um golpe decisivo de efeito ampliado.'; } }
  },
  cognicao: {
    main: { name: 'Percepção Desperta', desc: function (a) { return 'A mente sob ' + a + ' enxerga além do véu: uma vez por cena, revela uma informação oculta ou uma fraqueza de um alvo.'; } },
    amp1: { name: 'Leitura Profunda',   desc: function (a) { return 'Antecipa intenções. Enquanto canaliza ' + a + ', ganha vantagem em testes de análise, investigação e percepção.'; } },
    amp2: { name: 'Presciência',        desc: function (a) { return 'A cognição de ' + a + ' atinge o auge: uma vez por combate, prevê uma ação inimiga e reage antes que ela ocorra.'; } }
  },
  elo: {
    main: { name: 'Vínculo Desperto',   desc: function (a) { return 'Os laços forjados sob ' + a + ' fortalecem os aliados próximos, concedendo um pequeno amparo em momentos de necessidade.'; } },
    amp1: { name: 'Ressonância',        desc: function (a) { return 'A presença de ' + a + ' inspira: aliados adjacentes compartilham parte da sua determinação enquanto o Elo está ativo.'; } },
    amp2: { name: 'Elo Inquebrável',    desc: function (a) { return 'O auge da conexão de ' + a + '. Uma vez por cena, proteja um aliado assumindo parte do risco destinado a ele.'; } }
  },
  artificio: {
    main: { name: 'Artifício Desperto', desc: function (a) { return 'A engenhosidade de ' + a + ' manifesta-se em truques versáteis, adaptando recursos e ferramentas a cada situação.'; } },
    amp1: { name: 'Improviso',          desc: function (a) { return 'Sob ' + a + ', transforma o inesperado em vantagem: reaproveita um recurso ou reação uma vez por cena.'; } },
    amp2: { name: 'Obra-Prima',         desc: function (a) { return 'O ápice do engenho de ' + a + ': cria um efeito único e poderoso, definido com o Narrador, uma vez por combate.'; } }
  },
  autocuidado: {
    main: { name: 'Autocuidado Desperto', desc: function (a) { return 'A resiliência de ' + a + ' permite recuperar-se: restaura uma fração dos próprios recursos uma vez por cena.'; } },
    amp1: { name: 'Fôlego Renovado',      desc: function (a) { return 'A vitalidade de ' + a + ' persiste: acelera a recuperação natural de efeitos negativos e status.'; } },
    amp2: { name: 'Renascimento',         desc: function (a) { return 'O auge da preservação de ' + a + ': uma vez por combate, evite ser derrubado ao resistir a um golpe que o levaria a 0.'; } }
  },
  resolucao: {
    main: { name: 'Resolução Desperta',   desc: function (a) { return 'A firmeza de ' + a + ' sustenta a mente: resiste com mais facilidade a efeitos de status, medo e controle.'; } },
    amp1: { name: 'Vontade Inflexível',   desc: function (a) { return 'A determinação de ' + a + ' não vacila: reduz a duração das penalidades e efeitos debilitantes sofridos.'; } },
    amp2: { name: 'Convicção Absoluta',   desc: function (a) { return 'O ápice da vontade de ' + a + ': uma vez por combate, ignore por completo um efeito debilitante ao ser afetado.'; } }
  }
};

// Sobrescritas de conteúdo por Arcana (opcional). Estrutura:
// AWAKENING_OVERRIDES['death'] = { impeto: { main:{name,desc:fn}, ... } }
// Cada nó pode definir também `level` (nível de desbloqueio específico) e/ou
// `narrativeOnly: true` (desbloqueio exclusivamente narrativo).
// Deixe vazio para usar o conteúdo-base (que já incorpora o nome da Arcana).
export const AWAKENING_OVERRIDES = {
  // ── O Mago (I) ──
  magician: {
    impeto: {
      main: {
        name: 'Fórmula do Infinito',
        desc: 'Uma vez por rodada, ao conjurar uma Magia Ofensiva, pode aumentar o custo dela em 50%.\n' +
              'Ao fazer isso, a magia se torna Amplificada e soma metade de sua MAG novamente como Dados de Dano Bônus.\n' +
              'Esse efeito não é contabilizado em Acertos Críticos.'
      },
      amp1: {
        name: 'Equação Geminada',
        desc: 'Uma vez por combate, após conjurar uma Magia Amplificada, pode conjurar uma segunda Magia Ofensiva de custo igual ou inferior como Ação Livre, pagando seu custo normalmente.\n' +
              'A segunda magia deve ser diferente da primeira.'
      },
      amp2: {
        name: 'Ruptura do Impossível',
        desc: 'Suas Magias Amplificadas passam a ignorar Resistências Elementais.\n' +
              'O alvo é tratado como recebendo dano neutro daquele elemento.\n' +
              'Não atravessa: Anular, Defletir ou Absorver.'
      }
    },
    autocuidado: {
      main: {
        name: 'Lei da Conservação',
        desc: 'Para cada 30 de Mana consumidos durante um combate, recebe 1 Selo de Conservação.\n' +
              'Pode armazenar até 3 Selos simultaneamente.\n' +
              'Uma vez por rodada, com uma Ação de Interromper, pode consumir um Selo para elevar sua Reação Elemental contra um elemento em 1 Categoria Elemental durante uma rodada.\n' +
              'Categorias: Fraco → Normal → Resiste → Anula → Reflete → Absorve.\n' +
              'Todos os Selos desaparecem ao final do combate.'
      },
      amp1: {
        name: 'Transmutação Vital',
        desc: 'Ao consumir um Selo de Conservação, eleva sua afinidade contra o elemento escolhido em 2 Categorias Elementais em vez de 1.\n' +
              'Durante a mesma rodada, recebe sua MAG como Redução de Dano bônus.'
      },
      amp2: {
        name: 'Reserva de Emergência',
        desc: 'Ao final de um combate, pode conservar 1 Selo de Conservação para utilizar posteriormente.\n' +
              'A capacidade máxima aumenta: 3 Selos → 5 Selos.\n' +
              'Apenas 1 Selo pode ser mantido entre combates.'
      }
    },
    artificio: {
      main: {
        name: 'Princípio da Correspondência',
        desc: 'Todo Dano Elemental causado por você passa a possuir o Descritor: Magia.\n' +
              'Ataques básicos elementais e outras fontes de dano elemental podem receber efeitos que normalmente exigiriam uma Magia.\n' +
              'Itens Consumíveis não são afetados.'
      },
      amp1: {
        name: 'Como Acima...',
        desc: 'Todo Buff ou Efeito Especial que afete Ataques Básicos passa a afetar também suas Magias Ofensivas, desde que seja aplicável.'
      },
      amp2: {
        name: '...Assim Abaixo',
        desc: 'Todo Buff ou Efeito Especial que afete suas Magias passa a afetar também seus Ataques Básicos de Dano Elemental.'
      }
    },
    elo: {
      main: {
        name: 'Voto com Coração',
        desc: 'Ao adquirir esse Despertar Trama, recebe a capacidade de Melhorar uma Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou melhorar uma capacidade existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe a capacidade de Melhorar sua Habilidade de Combate uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe a capacidade de Melhorar sua Habilidade Natural uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Axioma do Catalisador',
        desc: 'Ao causar Dano Elemental contra um alvo, possui 40% de chance de aplicar uma Impressão Elemental correspondente ao elemento utilizado.\n' +
              'Se bem-sucedido, o próximo ataque ou magia do mesmo elemento contra esse alvo consome a Impressão e provoca uma Reação Elemental.\n' +
              'A Reação adiciona metade da MAG como Dados de Dano Bônus (não contam para Acertos Críticos).\n' +
              'Apenas uma Reação Elemental pode ocorrer por rodada.'
      },
      amp1: {
        name: 'Solve et Coagula',
        desc: 'Ao provocar uma Reação Elemental, reduz a afinidade do alvo contra o elemento marcado em 1 Categoria Elemental durante uma rodada.'
      },
      amp2: {
        name: 'Ciclo da Transmutação',
        desc: 'Após uma Impressão Elemental ser consumida, possui 40% de chance de reaplicá-la.\n' +
              'A nova Impressão não pode provocar outra Reação na mesma rodada.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu um ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Requer: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: desbloqueio exclusivamente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona alcança uma forma corrompida de sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: desbloqueio exclusivamente narrativo.'
      }
    }
  },

  // ── A Sacerdotisa (II) ──
  priestess: {
    impeto: {
      main: {
        name: 'Véu Entre os Pilares',
        desc: 'Sempre que utilizar um efeito de Cura sobre si ou um aliado, recebe uma Revelação.\n' +
              'Pode manter apenas uma Revelação por vez.\n' +
              'Uma vez por rodada, ao utilizar um Ataque ou Magia Ofensiva, pode consumir a Revelação para acrescentar seu [Conhecimento ou Empatia] como Dano Fixo Bônus.'
      },
      amp1: {
        name: 'Boaz, Pilar do Mistério',
        desc: 'Passa a somar sua [MAG ou TEC] novamente em qualquer efeito de Dano e Cura.\n' +
              'Pode armazenar até 2 Revelações simultaneamente.\n' +
              'Ainda só pode consumir uma Revelação por rodada.'
      },
      amp2: {
        name: 'Jachin, Pilar da Revelação',
        desc: 'Como Ação Livre, pode conceder uma de suas Revelações para um aliado.\n' +
              'Ao consumir essa Revelação em um ataque, o aliado acrescenta seu Tier de [Conhecimento ou Empatia] como Dados de Dano Bônus.'
      }
    },
    autocuidado: {
      main: {
        name: 'Véu da Intuição',
        desc: 'Uma vez por rodada, após utilizar um efeito de Cura sobre si ou um aliado, recebe um Véu da Intuição até o início do seu próximo turno.\n' +
              'Na primeira vez que receber dano durante esse período, aplica seu [Conhecimento ou Empatia] como RD Bônus contra o ataque, consumindo o Véu.\n' +
              'Apenas um Véu da Intuição pode permanecer ativo. O atributo é escolhido no momento da criação do Véu.\n' +
              'Efeitos de RD Bônus não acumulam — permanece apenas o maior valor.'
      },
      amp1: {
        name: 'Premonição Protetora',
        desc: 'Uma vez por combate, quando for escolhida como alvo de um Ataque ou Magia Ofensiva e não possuir um Véu da Intuição, pode criar um imediatamente como Reação.\n' +
              'Não precisa utilizar Cura.\n' +
              'O efeito passa a acumular com outros efeitos de RD.'
      },
      amp2: {
        name: 'Quietude Restauradora',
        desc: 'Caso seu Véu da Intuição permaneça ativo até o início do próximo turno sem ser consumido, ele desaparece e recupera a Habilidade Social escolhida como Recuperação de PM.'
      }
    },
    artificio: {
      main: {
        name: 'Oráculo do Véu',
        desc: 'No início de cada combate, role 2d20 + MAG. O resultado é armazenado como Presságios.\n' +
              'Antes de realizar uma rolagem, com uma Ação de Interromper, pode consumir uma quantidade X dos Presságios para adicionar ao resultado final do dado.\n' +
              'O uso deve ser declarado antes da rolagem original.\n' +
              'Presságios não utilizados desaparecem ao final do combate.'
      },
      amp1: {
        name: 'Profecia Favorável',
        desc: 'Seus Presságios também podem adicionar bônus em rolagens realizadas por aliados que você consiga ver ou ouvir.\n' +
              'O uso deve ser declarado antes da rolagem do aliado.'
      },
      amp2: {
        name: 'Profecia Funesta',
        desc: 'Seus Presságios também podem reduzir rolagens realizadas por inimigos que você consiga perceber.\n' +
              'Requer teste: MAG vs MAG.\n' +
              'O uso deve ser declarado antes da rolagem do inimigo.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Ecos Além do Véu',
        desc: 'Uma vez por cena, após derrotar diretamente uma Sombra, pode acessar os resquícios deixados por sua Cognição e visualizar um Fragmento de Memória.\n' +
              'Pode fazer uma pergunta ao Narrador sobre algo que a Sombra presenciou, conheceu ou vivenciou.\n' +
              'As informações são verdadeiras, mas limitadas ao conhecimento e percepção que a Sombra possuía.\n' +
              'Após acessar a memória, recebe +5 em um teste de Conhecimento ou Habilidade Social relacionado à informação descoberta.'
      },
      amp1: {
        name: 'Segredo Inconfessável',
        desc: 'Ao acessar um Fragmento de Memória, pode aprofundar-se na Cognição derrotada e realizar uma segunda pergunta ao Narrador.\n' +
              'Também pode procurar uma lembrança mais antiga relacionada ao assunto investigado.'
      },
      amp2: {
        name: 'Comunhão de Memórias',
        desc: 'Pode mergulhar em um Fragmento de Memória de pessoas ligadas à memória em questão enquanto estiver no Metaverso.\n' +
              'Pode levar aliados através de contato físico.\n' +
              'Personagens dentro do mergulho recebem +5 de bônus no próximo teste de Habilidade Social relacionado às informações compartilhadas.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: apenas narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida da sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: apenas narrativo.'
      }
    }
  },

  // ── A Imperatriz (III) ──
  empress: {
    impeto: {
      main: {
        name: 'Jardim da Soberana',
        desc: 'Uma vez por rodada, após causar dano, pode aplicar uma Semente Real.\n' +
              'Cada Semente aumenta em 5% a chance de efeitos que possuem chance menor que 50% de causarem seus efeitos em um inimigo atingido.\n' +
              'Um alvo pode acumular até 3 Sementes. Ao alcançar o limite, todas florescem e são consumidas, acrescentando seu Bônus de Charme como Dano Fixo Bônus contra o alvo.\n' +
              'O florescimento acontece após a resolução do ataque original.\n' +
              'Todas as Sementes desaparecem ao final do combate.'
      },
      amp1: {
        name: 'Rosa da Paixão',
        desc: 'Inimigos afetados por Encanto precisam acumular apenas 2 Sementes Reais para provocar o florescimento de Jardim da Soberana.'
      },
      amp2: {
        name: 'Primavera Eterna',
        desc: 'Sempre que suas Sementes Reais florescerem, poderá aplicar uma nova Semente em outro inimigo que consiga perceber.\n' +
              'Essa aplicação não é contabilizada no limite de uma Semente por rodada.'
      }
    },
    autocuidado: {
      main: {
        name: 'Florescer Imaculado',
        desc: 'Uma vez por combate, como Ação Rápida, pode remover uma Condição Negativa que esteja afetando você.\n' +
              'Caso exista um alvo inimigo sob seu Encanto, ao invés de receber a condição, ela será passada para seu escravo.\n' +
              'Não remove condições permanentes, narrativas ou que indiquem especificamente que não podem ser dissipadas.'
      },
      amp1: {
        name: 'Cuidado Maternal',
        desc: 'Pode utilizar Florescer Imaculado sobre um aliado que consiga tocar, removendo uma Condição Negativa dele.\n' +
              'Caso o aliado esteja adjacente a um de seus Escravos, a condição poderá ser redirecionada apenas uma vez por combate.'
      },
      amp2: {
        name: 'Primavera Perene',
        desc: 'Ao utilizar Florescer Imaculado, pode remover todas as Condições Negativas que estejam afetando você.\n' +
              'Também pode escolher receber Imunidade contra uma Condição de Status durante 2 rodadas.'
      }
    },
    artificio: {
      main: {
        name: 'Minha Corte, Minhas Regras',
        desc: 'No início de um combate, antes da definição dos turnos, pode escolher até 1 Aliado Voluntário para integrar sua Corte Real.\n' +
              'Esse aliado deixa de possuir turnos próprios e passa a agir exclusivamente durante o turno da Imperatriz.\n' +
              'Enquanto permanecer na Corte Real: recebe Imunidade contra Condições Negativas e uma Insígnia Real diferente. Cada membro mantém sua quantidade normal de ações.\n' +
              'Caso a Imperatriz fique Inconsciente ou Incapacitada, a Corte é desfeita e os aliados recuperam seus turnos na rodada seguinte.\n' +
              '\n' +
              'INSÍGNIAS REAIS:\n' +
              '\u2694\uFE0F Espada da Imperatriz — Ataques recebem metade do Charme da Imperatriz como Acerto Bônus. Contra alvo com penalidade, recebe o Tier de Charme como Dados de Dano Bônus.\n' +
              '\uD83D\uDEE1\uFE0F Escudo da Imperatriz — Danos recebidos aplicam metade do Charme da Imperatriz como RD Bônus.\n' +
              '\uD83D\uDC51 Cetro da Imperatriz — A primeira Cura por rodada recebe Charme da Imperatriz como Cura Bônus. Ao usar um Buff, sua duração aumenta em uma rodada.'
      },
      amp1: {
        name: 'Baile das Insígnias',
        desc: 'No início do turno, a Imperatriz pode redistribuir as Insígnias Reais entre membros da Corte.\n' +
              'Aumenta a quantidade de Aliados na Corte Real em +2.\n' +
              'Uma mesma Insígnia ainda não pode ser concedida para mais de um aliado.'
      },
      amp2: {
        name: 'Favor da Coroa',
        desc: 'No início de cada turno, escolha um membro da Corte Real como Favorito.\n' +
              'Até o final da rodada, os bônus concedidos pela Insígnia desse aliado utilizam o valor completo do Charme da Imperatriz em vez da metade.\n' +
              'Caso possua o Cetro da Imperatriz, a duração adicional dos Buffs aumenta para duas rodadas.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou sua Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade que já possua.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, poderá melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, poderá melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Majestade Inquestionável',
        desc: 'A Imperatriz reconhece o próprio valor e projeta essa certeza sobre todos ao seu redor.\n' +
              'Todos os seus testes de Charme passam a ser realizados com Vantagem.\n' +
              'Caso já possua Vantagem através de outra fonte, os efeitos não acumulam.'
      },
      amp1: {
        name: 'Privilégios da Coroa',
        desc: 'A quantidade máxima de usos das capacidades concedidas pelos seus Tiers de Habilidades Sociais aumenta em um valor igual ao respectivo Tier.\n' +
              'Exemplo: um Tier 3 que possuía 3 usos passa a possuir 6 usos.\n' +
              'Caso possua quantidade base diferente, apenas adiciona +3 usos.'
      },
      amp2: {
        name: 'A Vontade da Rainha',
        desc: 'Uma vez por cena, pode utilizar Charme no lugar de qualquer outra Habilidade Social exigida por um teste.\n' +
              'Esse teste também recebe a Vantagem concedida por Majestade Inquestionável.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto em que sua Trama finalmente começou a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: somente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida da sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── A Carruagem (VII) ──
  chariot: {
    impeto: {
      main: {
        name: 'Motor da Vitória',
        desc: 'Na primeira vez que causar dano durante uma rodada, recebe um acúmulo de Embalo. Pode armazenar até 3 Acúmulos.\n' +
              'Antes de realizar um Ataque ou Magia Ofensiva, pode consumir qualquer quantidade de Embalo. Cada acúmulo consumido adiciona +1 Dado de Dano Bônus.\n' +
              'Caso termine uma rodada sem causar dano contra um inimigo, perde todos os acúmulos.\n' +
              'Os Dados de Dano Bônus não são contabilizados em Acertos Críticos.'
      },
      amp1: {
        name: 'Dor como Combustível',
        desc: 'Na primeira vez durante uma rodada que perder ou sacrificar pelo menos 10% do seu PV Máximo, recebe imediatamente um acúmulo adicional de Embalo.\n' +
              'Também pode passar esse efeito para aliados afetados por Avançando Sem Parar!'
      },
      amp2: {
        name: 'Impacto Inevitável',
        desc: 'Ao consumir 3 Acúmulos de Embalo em um único ataque, ignora uma quantidade da RD do alvo igual à sua Disciplina ou Coragem.'
      }
    },
    autocuidado: {
      main: {
        name: 'Segundo Fôlego',
        desc: 'Uma vez por combate, quando estiver com metade ou menos do seu PV Máximo, pode utilizar uma Ação Rápida para recuperar VIT = d8 de Cura.\n' +
              'Só pode ser usado enquanto possuir pelo menos 1 PV e não estiver nos Portões da Morte.\n' +
              'Recebe normalmente o dado adicional concedido por Imparável & Indestrutível.'
      },
      amp1: {
        name: 'Ainda Não Terminei!',
        desc: 'Segundo Fôlego pode ser ativado quando chegar aos Portões da Morte. Nesse caso:\n' +
              '1. Realiza primeiro o ataque concedido por Imparável & Indestrutível.\n' +
              '2. Depois recebe a Cura.\n' +
              'Caso recupere pelo menos 1 PV, permanece consciente.'
      },
      amp2: {
        name: 'Blindado pela Vontade',
        desc: 'Após utilizar Segundo Fôlego, recebe sua Disciplina ou Coragem como RD Bônus até o final do combate.\n' +
              'Não acumula com outros efeitos — mantém apenas o maior valor.'
      }
    },
    artificio: {
      main: {
        name: 'Recuar para Avançar!',
        desc: 'Uma vez por rodada, antes que um aliado voluntário realize seu turno, pode atrasá-lo para a próxima rodada pagando um custo:\n' +
              '\uD83E\uDE78 25% PV (Carga): o próximo efeito de Dano Físico do aliado causará o dobro do dano.\n' +
              '\uD83D\uDD37 25% PM (Concentração): o próximo efeito de Dano Mágico do aliado causará o dobro do dano.\n' +
              'O aliado perde seu turno atual e age normalmente na rodada seguinte (não concede turno adicional).\n' +
              'Carga e Concentração são consumidas ao utilizar o efeito correspondente, acertando ou errando.'
      },
      amp1: {
        name: 'Largada Perfeita',
        desc: 'O aliado atrasado por Recuar para Avançar! poderá agir no início da próxima rodada, antes dos demais participantes, independente da ordem original.'
      },
      amp2: {
        name: 'Potência Híbrida',
        desc: 'Pode pagar simultaneamente 25% PV + 25% PM ao atrasar um aliado. Ele recebe Carga + Concentração.\n' +
              'Cada efeito é consumido separadamente pelo tipo de dano correspondente.\n' +
              'Caso um efeito seja considerado simultaneamente Físico e Mágico, apenas um multiplicador pode ser aplicado.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou sua Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Fora do Meu Caminho!',
        desc: 'Uma vez por combate, quando você ou um aliado conseguir um Acerto Crítico ou atingir uma Fraqueza, pode realizar imediatamente um Ataque Básico Físico como Reação contra um inimigo à escolha.\n' +
              'Caso acerte: o alvo não recebe dano e possui 80% de chance de ser Expulso do Combate.\n' +
              'Inimigos expulsos são removidos pelo restante do combate, mas não são considerados mortos.\n' +
              'Chefes, Minichefes e alvos narrativos importantes não podem ser expulsos.'
      },
      amp1: {
        name: 'Trajetória Perfeita',
        desc: 'O Ataque Básico Físico realizado por Fora do Meu Caminho! recebe Acerto Garantido.\n' +
              'Ainda não atravessa: Anular, Refletir ou Absorver Físico.'
      },
      amp2: {
        name: 'Chutando o Impossível',
        desc: 'Pode utilizar Fora do Meu Caminho! contra alvos que não possam ser expulsos. Nesse caso:\n' +
              '- causa dano normalmente;\n' +
              '- é considerado Acerto Crítico;\n' +
              '- adiciona metade da sua VIT como Dados de Dano Bônus.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto em que sua Trama finalmente começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: somente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida da sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── O Eremita (IX) ──
  hermit: {
    impeto: {
      main: {
        name: 'À Luz da Lanterna',
        desc: 'Como Ação Completa ou usando uma Ação de Interromper + 20 PM: escolha um inimigo que consiga perceber e analise silenciosamente suas ações.\n' +
              'Realize um teste de Conhecimento contra o maior valor entre MAG ou Charme do alvo.\n' +
              'Se bem-sucedido, o próximo Ataque ou Magia Ofensiva usado por você ou por um aliado contra esse inimigo recebe Vantagem e todas as afinidades defensivas do alvo são consideradas Normal.\n' +
              'A Análise permanece até o final do seu próximo turno e é consumida ao declarar o ataque, acertando ou errando.'
      },
      amp1: {
        name: 'Fraqueza Revelada',
        desc: 'O ataque preparado por À Luz da Lanterna passa a considerar o alvo como Fraco contra o tipo de dano utilizado.\n' +
              'Substitui o efeito de considerar apenas como Normal.'
      },
      amp2: {
        name: 'Retorno à Escuridão',
        desc: 'Caso você seja responsável pelo ataque preparado por À Luz da Lanterna, recupera imediatamente a proteção de Introspecção.\n' +
              'Volta a não ser um alvo válido para ataques de Alvo Único.'
      }
    },
    autocuidado: {
      main: {
        name: 'Retiro Interior',
        desc: 'Uma vez por combate, como Ação Completa, pode se retirar temporariamente do combate até o início do próximo turno.\n' +
              'Enquanto estiver em Retiro: não pode agir, não pode escolher alvos e não pode ser afetado por ataques ou habilidades.\n' +
              'Ao retornar, recupera 25% do PV Máximo + 25% do PM Máximo + 2 Contadores.\n' +
              'O Retiro não interrompe ataques ou efeitos já declarados. Durante esse período também não recebe efeitos de aliados ou inimigos.'
      },
      amp1: {
        name: 'Silêncio Restaurador',
        desc: 'Durante o Retiro, todas as Condições Negativas são removidas.'
      },
      amp2: {
        name: 'O Mundo Pode Esperar',
        desc: 'No momento em que deveria retornar, pode prolongar seu Retiro por mais uma rodada.\n' +
              'Caso faça isso, recupera novamente 15% do PV Máximo + 15% do PM Máximo + 1 Contador.\n' +
              'O Retiro só pode ser prolongado uma vez por utilização.'
      }
    },
    artificio: {
      main: {
        name: 'Hyper-Space',
        desc: 'Ao adquirir este Despertar Trama, passa a exercer a função de Navegador da Party.\n' +
              'Enquanto possuir essa função, não pode utilizar Ataques, Magias Ofensivas ou habilidades cuja função principal seja causar dano. Em troca, recebe acesso aos Protocolos de Navegação.\n' +
              '\n' +
              'PROTOCOLOS DE NAVEGAÇÃO:\n' +
              '\uD83D\uDC9A Suporte Vital (Ação Completa) — Todos os membros da Party recuperam 25% do PV Máximo.\n' +
              '\uD83D\uDD37 Suporte Espiritual (Ação Completa) — Todos os membros da Party recuperam 25% do PM Máximo.\n' +
              '\uD83D\uDD0D Análise Completa (Ação Completa + 30 PM) — Escolha um inimigo; o Narrador revela Afinidades, Fraquezas e Habilidade Natural Principal. Até o início do próximo turno, todos os aliados recebem Vantagem contra esse alvo.\n' +
              '\n' +
              'Regras: cada Protocolo pode ser usado uma vez por combate; não são considerados Magias; não quebram a proteção de Introspecção.'
      },
      amp1: {
        name: 'Overclock Cognitivo',
        desc: 'Uma vez por combate, como Ação Completa, concede Concentração para todos os aliados.\n' +
              'O próximo efeito de Dano Mágico de cada um causará o dobro do dano.\n' +
              'A Concentração é consumida independentemente de acertar ou errar.'
      },
      amp2: {
        name: 'Última Linha de Defesa',
        desc: 'Uma vez por combate, quando uma ação inimiga reduziria um ou mais aliados a Zero de Vida, pode usar uma Ação de Interromper para ativar Guarda Final.\n' +
              'Todo o dano causado por essa ação contra a Party é anulado.\n' +
              'Efeitos que não causam dano continuam sendo aplicados.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou sua Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Lanterna dos Vestígios',
        desc: 'Uma vez por cena, pode analisar detalhadamente um Local, Objeto ou Acontecimento.\n' +
              'No Mundo Real, a análise exige pelo menos 10 minutos. No Metaverso, pode ser feita como Ação Completa + 10 PM.\n' +
              'Realize um teste de Conhecimento contra a DT do Mistério definida pelo Narrador. Se bem-sucedido, identifica rastros, alterações e detalhes importantes e recebe uma Pista Relevante.\n' +
              'Pode encontrar vestígios físicos, sobrenaturais ou cognitivos, mas não cria informações quando nenhum rastro existe.'
      },
      amp1: {
        name: 'Reconstrução Dedutiva',
        desc: 'Após ser bem-sucedido em Lanterna dos Vestígios, pode reconstruir mentalmente a sequência dos acontecimentos.\n' +
              'Pode fazer até 2 perguntas ao Narrador sobre como a cena ocorreu. As respostas são limitadas às evidências disponíveis.'
      },
      amp2: {
        name: 'Rastro Entre Mundos',
        desc: 'Pode relacionar vestígios encontrados no Mundo Real com suas manifestações no Metaverso e vice-versa.\n' +
              'Ao encontrar uma pista ligada a uma pessoa, objeto ou local, recebe Vantagem nos testes para localizar sua contraparte ou descobrir a conexão entre os mundos.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: somente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida da sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── A Justiça (XI) ──
  justice: {
    impeto: {
      main: {
        name: 'Peso da Culpa',
        desc: 'Na primeira vez durante uma rodada em que um inimigo causar dano ou aplicar uma Condição Negativa em você ou em um aliado, esse inimigo recebe 1 acúmulo de Culpa (até 3).\n' +
              'Antes de usar um Ataque ou Magia Ofensiva contra esse inimigo, pode consumir todos os acúmulos. Cada acúmulo adiciona dano equivalente a 5% do PV Máximo do alvo (1 = +5%, 2 = +10%, 3 = +15%).\n' +
              'O dano adicional pode ser Luz ou Intel e não é contabilizado em Acertos Críticos.\n' +
              'Uma mesma ação inimiga concede apenas um acúmulo, mesmo causando múltiplos danos ou condições.'
      },
      amp1: {
        name: 'Circunstâncias Agravantes',
        desc: 'Caso o inimigo aplique uma Condição Negativa ou cause dano contra um personagem que esteja com metade ou menos do PV Máximo, recebe 2 acúmulos de Culpa ao invés de 1.'
      },
      amp2: {
        name: 'Sentença sem Apelação',
        desc: 'Ao consumir 3 Acúmulos de Culpa em um único ataque, o alvo não poderá utilizar Reações contra ele.\n' +
              'Além disso, o dano adicional de Peso da Culpa não poderá ser Reduzido, Anulado, Refletido, Absorvido ou Redirecionado.'
      }
    },
    autocuidado: {
      main: {
        name: 'Balança Interior',
        desc: 'Uma vez por rodada, como Ação Rápida, pode converter até 20 pontos entre seus recursos:\n' +
              '\uD83E\uDE78 PV → PM: perde PV e recupera a mesma quantidade de PM.\n' +
              '\uD83D\uDD37 PM → PV: consome PM e recupera a mesma quantidade de PV.\n' +
              'A conversão é 1 para 1. PV não pode ser reduzido abaixo de 1 e nenhum recurso pode ultrapassar seu máximo.\n' +
              'Não é considerado Dano, Cura ou Recuperação de PM e não recebe modificadores desses efeitos.'
      },
      amp1: {
        name: 'Cláusula de Emergência',
        desc: 'Uma vez por combate, quando for reduzido a Zero de Vida, pode ativar Balança Interior como Reação antes de ficar inconsciente.\n' +
              'Converte até 20 PM em PV. Caso recupere pelo menos 1 PV, permanece consciente.'
      },
      amp2: {
        name: 'Equilíbrio Compartilhado',
        desc: 'Pode utilizar Balança Interior sobre um aliado voluntário que consiga tocar, permitindo que ele converta seus próprios PV e PM.\n' +
              'Também pode transferir até 20 pontos dos seus recursos para restaurar PV ou PM desse aliado.\n' +
              'Nenhum personagem pode ter PV reduzido abaixo de 1 por essa transferência.'
      }
    },
    artificio: {
      main: {
        name: 'Balança do Veredito',
        desc: 'Sempre que causar dano com uma Magia de Luz ou Intel, recebe +10 de Veredito. Também recebe +10 ao rebater com sucesso dano ou efeito negativo através de Causa & Efeito.\n' +
              'Pode acumular até 100 de Veredito. Ao alcançar 100, pode consumir todo o Veredito antes de conjurar uma Magia de Luz ou Intel: todo o dano dessa Magia passa a ser considerado Onipotente.\n' +
              'A transformação deve ser declarada antes da rolagem e consome o Veredito mesmo se a magia errar. A magia transformada não gera novos pontos.'
      },
      amp1: {
        name: 'Provas Conclusivas',
        desc: 'Caso uma Magia de Luz ou Intel consiga um Acerto Crítico ou atinja uma Fraqueza, recebe +20 de Veredito ao invés de +10.'
      },
      amp2: {
        name: 'Precedente Vinculante',
        desc: 'Após consumir 100 de Veredito para transformar uma Magia em Onipotente, conserva 20 de Veredito — não retorna completamente ao zero.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou sua Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Minha Vontade é Lei',
        desc: 'Você não pode ser obrigado, através de Habilidades Sociais, a tomar decisões ou realizar ações contra sua própria vontade.\n' +
              'Tentativas de Intimidação, Coerção, Sedução, Manipulação emocional ou Imposição de autoridade não retiram seu poder de escolha.\n' +
              'Não impede que seja convencido voluntariamente através de argumentos.\n' +
              'Não concede imunidade contra efeitos sobrenaturais ou Condições Negativas de controle mental.'
      },
      amp1: {
        name: 'Defesa do Livre-Arbítrio',
        desc: 'Uma vez por cena, quando um aliado perceptível for alvo de uma tentativa de coerção ou manipulação social, pode realizar um teste de Disciplina contra o resultado do manipulador.\n' +
              'Caso tenha sucesso, o aliado ignora completamente a influência e toma sua própria decisão.'
      },
      amp2: {
        name: 'Direito de Resposta',
        desc: 'Após resistir ou impedir uma tentativa de manipulação, recebe Vantagem em todos os testes de Habilidades Sociais realizados contra o responsável até o final da cena.\n' +
              'Também reconhece qual decisão ou comportamento ele pretendia impor.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: somente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida de sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── A Força (VIII) ──
  strength: {
    impeto: {
      main: {
        name: 'A Força Decide!',
        desc: 'Uma vez por rodada, após errar um Ataque Corpo a Corpo ou Magia Física, pode sacrificar 15 PV para realizar novamente o teste de acerto.\n' +
              'A nova rolagem recebe metade da Coragem como Bônus de Acerto. O novo resultado deverá ser mantido.\n' +
              'O sacrifício de Vida não pode ser Reduzido, Anulado ou Recuperado por efeitos que reajam à perda de PV.'
      },
      amp1: {
        name: 'Insistência Brutal',
        desc: 'Caso a segunda tentativa também erre, ainda causa metade do dano que seria provocado pelo ataque.\n' +
              'Não atravessa: Anular, Refletir ou Absorver Físico.'
      },
      amp2: {
        name: 'Impacto Irrecusável',
        desc: 'Caso a segunda tentativa seja bem-sucedida, o alvo não poderá utilizar Ações de Interromper contra esse ataque.\n' +
              'Além disso, acrescenta seu Tier de Coragem como Dados de Dano Bônus.'
      }
    },
    autocuidado: {
      main: {
        name: 'Domínio Sobre a Dor',
        desc: 'Uma vez por rodada, quando pagar ou sacrificar PV para ativar uma Habilidade ou Magia Física, pode realizar um teste de Coragem contra DT 20.\n' +
              'Caso seja bem-sucedido, o custo de Vida será reduzido pela metade. O custo mínimo será sempre 1 PV.'
      },
      amp1: {
        name: 'Respiração Controlada',
        desc: 'Uma vez por combate, quando receber dano, pode utilizar Domínio Sobre a Dor como Reação.\n' +
              'Caso seja bem-sucedido no teste de Coragem, reduz o dano recebido pela metade.'
      },
      amp2: {
        name: 'A Fera se Recusa a Cair',
        desc: 'Uma vez por missão, caso o pagamento ou dano recebido fosse reduzir você a Zero de Vida, permanece com 1 PV.\n' +
              'Recupera Coragem + VIT como Cura. Depois disso, conclui normalmente a habilidade utilizada.'
      }
    },
    artificio: {
      main: {
        name: 'Liberto das Correntes do Medo',
        desc: 'Como Ação Rápida, pode entrar no estado Fera Liberta. Ao ativar e no início de cada turno seguinte, sacrifica 25 PV para manter o efeito.\n' +
              'Enquanto estiver em Fera Liberta:\n' +
              '\uD83E\uDD81 Pode utilizar Força no lugar de Técnica para Testes de Ataque.\n' +
              '\uD83E\uDE78 Pode utilizar Vitalidade no lugar do atributo normalmente utilizado em Reações contra Ataques.\n' +
              'Os atributos substituem os valores originais — não são somados.\n' +
              'O estado termina ao ficar Inconsciente, ao final do Combate, ou quando decidir encerrar como Ação Livre no início do turno.'
      },
      amp1: {
        name: 'Predador Absoluto',
        desc: 'Uma vez por rodada, quando acertar um ataque utilizando Força como atributo de acerto, acrescenta metade da Força como Dados de Dano Bônus.'
      },
      amp2: {
        name: 'Ataque por Instinto',
        desc: 'Uma vez por rodada, após ser bem-sucedido em uma Reação utilizando Vitalidade, pode realizar imediatamente um Ataque Básico Corpo a Corpo contra o atacante como Ação Livre.\n' +
              'O alvo deve estar ao alcance.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou sua Habilidade de Combate.\n' +
              'Pode adicionar um terceiro efeito ou aprimorar uma capacidade existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.\n' +
              'Caso ela já tenha sido aprimorada por Voto do Coração, pode melhorá-la uma segunda vez.'
      }
    },
    cognicao: {
      main: {
        name: 'Punhos em Sangue e um Coração Pulsando',
        desc: 'Para cada 50 PV que estiverem faltando em relação ao PV Máximo, recebe +1 de Chance Crítica em todos os ataques.\n' +
              'O bônus é recalculado sempre que o PV mudar. Recuperar Vida reduz a Chance Crítica recebida.\n' +
              'Tabela: 50 PV faltando = +1 · 100 PV faltando = +2 · 150 PV faltando = +3.'
      },
      amp1: {
        name: 'Feridas Profundas',
        desc: 'Passa a receber +1 Chance Crítica para cada 40 PV faltando, ao invés de 50.'
      },
      amp2: {
        name: 'Cicatrizes Recentes',
        desc: 'A Cura não reduz imediatamente o bônus de Punhos em Sangue e um Coração Pulsando.\n' +
              'A maior quantidade de Chance Crítica alcançada será mantida até o início do próximo turno.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou decisão narrativa do Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona atinge o ápice de sua forma.\n' +
              'Alcança a Forma Verdadeira do Coração.\n' +
              'Requisito: somente narrativo.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona atinge uma forma corrompida da sua verdadeira forma.\n' +
              'Perde suas capacidades comuns e se torna uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  }
};

const TIER_KEYS = ['main', 'amp1', 'amp2'];
const TIER_LABELS = ['Habilidade Principal', 'Amplificação I', 'Amplificação II'];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIV'];

/**
 * Constrói a árvore (6 vertentes × 3 tiers) para a Arcana informada,
 * resolvendo nomes/descrições com base no conteúdo (ou overrides).
 * @param {object} arcanaInfo - retorno de getArcanaInfo (pode ser null)
 * @returns {Array}
 */
export function buildTree(arcanaInfo) {
  var display = arcanaInfo ? arcanaInfo.display : 'a Arcana';
  var overrides = (arcanaInfo && AWAKENING_OVERRIDES[arcanaInfo.key]) || {};
  return VERTENTES.map(function (v) {
    var base = CONTENT[v.key];
    var ovr = overrides[v.key] || {};
    var levels = TIER_LEVELS[v.key];
    var nodes = TIER_KEYS.map(function (tk, i) {
      var src = (ovr[tk] || base[tk]);
      var name = src.name;
      var descFn = src.desc;
      var narrativeOnly = !!src.narrativeOnly;
      return {
        id: v.key + '_' + tk,
        tierKey: tk,
        tierLabel: TIER_LABELS[i],
        name: name,
        desc: (typeof descFn === 'function') ? descFn(display) : String(descFn || ''),
        // Nível de desbloqueio: override específico da Arcana > padrão da vertente.
        // Nós exclusivamente narrativos não têm nível (level = null).
        level: narrativeOnly ? null : ((src.level != null) ? src.level : levels[i]),
        narrativeOnly: narrativeOnly
      };
    });
    return {
      key: v.key,
      name: v.name,
      glyph: v.glyph,
      pos: v.pos,
      nodes: nodes
    };
  });
}

// =============================================
// ESTADO DE PROGRESSÃO — ÁRVORE DE ESCOLHAS
// personaAwakenings[arcanaKey] = { acquired: [nodeId], narrative: [nodeId] }
//   acquired  → habilidades efetivamente obtidas (✔)
//   narrative → liberações narrativas da principal de Resolução (abaixo do Lv.10)
// =============================================

// Níveis em que o jogador ganha UMA escolha de aquisição.
var ACQ_LEVELS = [2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20];

function ensureStore(arcanaKey) {
  if (!state.personaAwakenings || typeof state.personaAwakenings !== 'object') {
    state.personaAwakenings = {};
  }
  var s = state.personaAwakenings[arcanaKey];
  if (!s) { s = { acquired: [], narrative: [] }; state.personaAwakenings[arcanaKey] = s; }
  if (!Array.isArray(s.acquired)) s.acquired = [];
  if (!Array.isArray(s.narrative)) s.narrative = [];
  return s;
}

function personaLevel() {
  return Math.max(1, Math.trunc(Number(state.PerLvl) || 1));
}

function isNarrative(arcanaKey, nodeId) {
  return ensureStore(arcanaKey).narrative.indexOf(nodeId) >= 0;
}

/** Número de escolhas de aquisição concedidas pelo nível atual da Persona. */
function earnedChoices() {
  var lvl = personaLevel();
  return ACQ_LEVELS.filter(function (l) { return lvl >= l; }).length;
}

/**
 * Calcula o estado de cada nó como uma ÁRVORE DE ESCOLHAS.
 * Retorna { states:{id->estado}, remaining, earned, used }.
 * Estados: 'acquired' | 'available' | 'available-res' | 'available-narr'
 *          | 'locked-choices' | 'locked-prereq' | 'locked-res' | 'lost'
 */
function computeStates(arcanaKey, tree) {
  var store = ensureStore(arcanaKey);
  var acq = store.acquired;
  var lvl = personaLevel();

  // Escolhas normais consumidas (a vertente Resolução não consome escolhas).
  var used = 0;
  tree.forEach(function (b) {
    if (b.key === 'resolucao') return;
    b.nodes.forEach(function (n) { if (acq.indexOf(n.id) >= 0) used++; });
  });
  var earned = earnedChoices();
  var remaining = Math.max(0, earned - used);

  var states = {};
  tree.forEach(function (b) {
    var isRes = (b.key === 'resolucao');
    var main = b.nodes[0], a1 = b.nodes[1], a2 = b.nodes[2];

    // Habilidade principal
    if (acq.indexOf(main.id) >= 0) {
      states[main.id] = 'acquired';
    } else if (isRes) {
      states[main.id] = (lvl >= 10 || isNarrative(arcanaKey, main.id)) ? 'available-res' : 'locked-res';
    } else {
      states[main.id] = remaining > 0 ? 'available' : 'locked-choices';
    }

    // Amplificações — uma OU outra (mutuamente exclusivas)
    [[a1, a2], [a2, a1]].forEach(function (pair) {
      var node = pair[0], sib = pair[1];
      if (acq.indexOf(node.id) >= 0) { states[node.id] = 'acquired'; return; }
      if (acq.indexOf(main.id) < 0) { states[node.id] = 'locked-prereq'; return; }
      if (acq.indexOf(sib.id) >= 0) { states[node.id] = 'lost'; return; }
      if (isRes) { states[node.id] = 'available-narr'; return; }
      states[node.id] = remaining > 0 ? 'available' : 'locked-choices';
    });
  });

  return { states: states, remaining: remaining, earned: earned, used: used };
}

function acquireNode(arcanaKey, nodeId) {
  var store = ensureStore(arcanaKey);
  if (store.acquired.indexOf(nodeId) < 0) store.acquired.push(nodeId);
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

/** Remove um nó adquirido. Ao remover a principal, remove também suas amplificações. */
function unacquireNode(arcanaKey, branch, nodeId) {
  var store = ensureStore(arcanaKey);
  var remove = [nodeId];
  if (nodeId === branch.nodes[0].id) {
    remove.push(branch.nodes[1].id, branch.nodes[2].id);
    if (branch.key === 'resolucao') {
      store.narrative = store.narrative.filter(function (id) { return id !== nodeId; });
    }
  }
  store.acquired = store.acquired.filter(function (id) { return remove.indexOf(id) < 0; });
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

/** Libera narrativamente a principal de Resolução (quando abaixo do Nível 10). */
function grantResolucaoNarrative(arcanaKey, nodeId) {
  var store = ensureStore(arcanaKey);
  if (store.narrative.indexOf(nodeId) < 0) store.narrative.push(nodeId);
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

// =============================================
// HELPERS DOM
// =============================================
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Estado transitório de UI (não persiste): vertente selecionada + arcana anterior.
var selectedVertente = null;
var lastArcanaKey = null;
var cardEls = {}; // key → { card, inner }

// =============================================
// CONSTRUÇÃO DO DECK (idempotente)
// =============================================
export function initAwakening() {
  var deck = document.getElementById('awakening-deck');
  if (!deck || deck.dataset.built === '1') { renderAwakening(); return; }

  VERTENTES.forEach(function (v) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'awakening-card pos-' + v.pos;
    card.dataset.vertente = v.key;
    card.setAttribute('aria-label', 'Carta ' + v.name);

    var inner = document.createElement('div');
    inner.className = 'awakening-card-inner';

    var back = document.createElement('div');
    back.className = 'awakening-card-back';
    back.innerHTML =
      '<div class="awakening-back-frame">' +
        '<div class="awakening-back-emblem">\u2727</div>' +
        '<div class="awakening-back-label">Despertar</div>' +
      '</div>';
    // Imagem do verso (card-back.png). Se falhar ao carregar, permanece o
    // desenho em CSS acima como fallback.
    var backImg = document.createElement('img');
    backImg.className = 'awakening-card-back-img';
    backImg.alt = '';
    backImg.setAttribute('aria-hidden', 'true');
    backImg.src = ARCANA_CARD_IMAGES.back;
    backImg.onerror = function () { backImg.remove(); };
    back.appendChild(backImg);

    var front = document.createElement('div');
    front.className = 'awakening-card-front';

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    deck.appendChild(card);

    cardEls[v.key] = { card: card, inner: inner, front: front };

    card.addEventListener('click', function () {
      var info = getArcanaInfo(state.PerArcana);
      if (!info) return; // sem Arcana selecionada, não abre
      selectedVertente = (selectedVertente === v.key) ? null : v.key;
      renderAwakening();
    });
  });

  deck.dataset.built = '1';

  // Atualiza ao trocar Arcana ou nível da Persona (aditivo — não substitui os
  // listeners existentes que já sincronizam o state). O render é adiado com
  // setTimeout(0) para garantir que o state já foi atualizado pelos listeners
  // genéricos de campo antes da leitura.
  var deferredRender = function () { setTimeout(renderAwakening, 0); };
  var perArc = document.getElementById('PerArcana');
  var perLvl = document.getElementById('PerLvl');
  if (perArc) {
    perArc.addEventListener('change', deferredRender);
    perArc.addEventListener('input', deferredRender);
  }
  if (perLvl) perLvl.addEventListener('input', deferredRender);

  renderAwakening();
}

// =============================================
// RENDER
// =============================================
export function renderAwakening() {
  var deck = document.getElementById('awakening-deck');
  if (!deck) return;

  var info = getArcanaInfo(state.PerArcana);
  var arcanaKey = info ? info.key : null;

  // Ao trocar de Arcana, fecha a carta aberta.
  if (arcanaKey !== lastArcanaKey) {
    selectedVertente = null;
    lastArcanaKey = arcanaKey;
  }

  // Cabeçalho.
  var nameEl = document.getElementById('awakening-arcana-name');
  var lvlEl = document.getElementById('awakening-level');
  var nextEl = document.getElementById('awakening-next');
  if (nameEl) nameEl.textContent = info ? (info.display + ' \u00b7 ' + info.roman) : 'Nenhuma Arcana selecionada';
  if (lvlEl) lvlEl.textContent = info ? ('Nível da Persona: ' + personaLevel()) : '';

  var tree = buildTree(info);
  var comp = info ? computeStates(arcanaKey, tree) : null;

  // Escolhas de Despertar disponíveis.
  if (nextEl) {
    nextEl.textContent = info ? ('Escolhas de Despertar disponíveis: ' + comp.remaining) : '';
  }

  deck.classList.toggle('is-disabled', !info);

  // Cartas.
  tree.forEach(function (branch) {
    var refs = cardEls[branch.key];
    if (!refs) return;
    var isFlipped = (selectedVertente === branch.key) && !!info;
    refs.inner.classList.toggle('is-flipped', isFlipped);

    var mainNode = branch.nodes[0];
    var mainState = comp ? comp.states[mainNode.id] : null;
    var mainAcquired = (mainState === 'acquired');
    refs.card.classList.toggle('is-selected', isFlipped);
    refs.card.classList.toggle('is-locked', info ? !mainAcquired : true);

    // Conteúdo da frente (reconstruído a cada render p/ refletir Arcana atual).
    refs.front.innerHTML = '';
    var vert = document.createElement('div');
    vert.className = 'awakening-card-vertente';
    vert.textContent = branch.name;

    var symbol = document.createElement('div');
    symbol.className = 'awakening-card-symbol';
    var roman = document.createElement('span');
    roman.className = 'awakening-card-roman';
    roman.textContent = info ? info.roman : branch.glyph;
    symbol.appendChild(roman);

    if (info) {
      var img = document.createElement('img');
      img.className = 'awakening-card-img';
      img.alt = info.display;
      img.loading = 'lazy';
      img.src = ARCANA_CARD_IMAGES[arcanaKey] || '';
      img.onerror = function () { img.remove(); }; // fallback: mantém o numeral romano
      symbol.appendChild(img);
    }

    var arc = document.createElement('div');
    arc.className = 'awakening-card-arcana';
    arc.textContent = info ? info.display : '—';

    var skill = document.createElement('div');
    skill.className = 'awakening-card-skill';
    skill.textContent = mainNode.name;

    var cs = cardStatus(mainState);
    var status = document.createElement('div');
    status.className = 'awakening-card-status ' + cs.cls;
    status.textContent = cs.txt;

    refs.front.appendChild(vert);
    refs.front.appendChild(symbol);
    refs.front.appendChild(arc);
    refs.front.appendChild(skill);
    refs.front.appendChild(status);
  });

  renderPanel(info, arcanaKey, tree);
}

/** Rótulo/classe de status da PRINCIPAL exibido na frente da carta. */
function cardStatus(mainState) {
  switch (mainState) {
    case 'acquired':      return { cls: 'status-level',     txt: '\u2714 Despertar Obtido' };
    case 'available':     return { cls: 'status-narrative', txt: '\u2728 Disponível' };
    case 'available-res': return { cls: 'status-narrative', txt: '\u2728 Disponível' };
    case 'locked-res':    return { cls: 'status-locked',    txt: '\uD83D\uDD12 Nível 10 / Narrativo' };
    case 'locked-choices':return { cls: 'status-locked',    txt: '\u2728 Requer escolha' };
    default:              return { cls: 'status-locked',    txt: '\u2014' };
  }
}

function renderPanel(info, arcanaKey, tree) {
  var panel = document.getElementById('awakening-panel');
  if (!panel) return;

  if (!info) {
    panel.innerHTML = '<p class="awakening-panel-empty">Selecione uma <b>Arcana</b> na Persona para revelar seu baralho de Despertar Trama.</p>';
    return;
  }
  if (!selectedVertente) {
    panel.innerHTML = '<p class="awakening-panel-empty">Clique em uma carta acima para virá-la e revelar as habilidades desta vertente.</p>';
    return;
  }

  var branch = tree.filter(function (b) { return b.key === selectedVertente; })[0];
  if (!branch) { panel.innerHTML = ''; return; }

  var comp = computeStates(arcanaKey, tree);
  var st = comp.states;

  var nodesHtml = branch.nodes.map(function (node) {
    var s = st[node.id];
    var statusHtml, actionHtml = '', cls = 'is-locked';

    if (s === 'acquired') {
      cls = 'is-acquired';
      statusHtml = '<span class="awk-status awk-status-unlocked">\u2714 Despertar Obtido</span>';
      actionHtml = '<button type="button" class="mini awk-remove-btn" data-node="' + esc(node.id) + '">Remover</button>';
    } else if (s === 'available' || s === 'available-res') {
      cls = 'is-available';
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Disponível para aquisição</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar</button>';
    } else if (s === 'available-narr') {
      cls = 'is-available';
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Despertar Narrativo</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar Narrativo</button>';
    } else if (s === 'locked-choices') {
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Disponível</span>';
      actionHtml = '<span class="awk-note">Sem escolhas restantes — suba o nível da Persona.</span>';
    } else if (s === 'locked-prereq') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Requer a Habilidade Principal</span>';
    } else if (s === 'locked-res') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Requer Nível 10 ou liberação narrativa</span>';
      actionHtml = '<button type="button" class="mini awk-narr-btn" data-node="' + esc(node.id) + '">\u2728 Liberar (Narrativo)</button>';
    } else if (s === 'lost') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Caminho não escolhido</span>';
      actionHtml = '<span class="awk-note">Outra evolução já foi selecionada.</span>';
    }

    return '' +
      '<div class="awakening-upgrade ' + cls + '">' +
        '<div class="awakening-upgrade-head">' +
          '<span class="awakening-upgrade-tier">' + esc(node.tierLabel) + '</span>' +
          statusHtml +
        '</div>' +
        '<div class="awakening-upgrade-name">' + esc(node.name) + '</div>' +
        '<p class="awakening-upgrade-desc">' + esc(node.desc) + '</p>' +
        (actionHtml ? '<div class="awakening-upgrade-actions">' + actionHtml + '</div>' : '') +
      '</div>';
  }).join('');

  panel.innerHTML =
    '<div class="awakening-panel-header">' +
      '<span class="awakening-panel-glyph">' + esc(branch.glyph) + '</span>' +
      '<div class="awakening-panel-titles">' +
        '<span class="awakening-panel-vertente">Vertente</span>' +
        '<h3 class="awakening-panel-name">' + esc(branch.name) + '</h3>' +
      '</div>' +
      '<span class="awakening-panel-arcana">' + esc(info.display) + ' \u00b7 ' + esc(info.roman) + '</span>' +
    '</div>' +
    '<div class="awakening-choice-note">Escolhas de Despertar disponíveis: <b>' + comp.remaining + '</b>' +
      ' <span class="awk-choice-hint">(cada nível de aquisição concede uma escolha; as amplificações são caminhos alternativos)</span></div>' +
    '<div class="awakening-upgrade-list">' + nodesHtml + '</div>';

  // Aquisição (consome escolha para nós normais; Resolução/narrativo não consomem).
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-acquire-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      acquireNode(arcanaKey, btn.dataset.node);
      renderAwakening();
    });
  });
  // Remoção / redefinição de uma escolha.
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-remove-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      unacquireNode(arcanaKey, branch, btn.dataset.node);
      renderAwakening();
    });
  });
  // Liberação narrativa da principal de Resolução.
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-narr-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      grantResolucaoNarrative(arcanaKey, btn.dataset.node);
      renderAwakening();
    });
  });
}
