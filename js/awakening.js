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
  { key: 'impeto',      name: 'Ímpeto',      glyph: '\u2694\uFE0E', pos: 'top' },
  { key: 'cognicao',    name: 'Cognição',    glyph: '\u2726', pos: 'left-top' },
  { key: 'elo',         name: 'Elo',         glyph: '\u2766', pos: 'right-top' },
  { key: 'artificio',   name: 'Artifício',   glyph: '\u2699\uFE0E', pos: 'left-bottom' },
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

  // ── O Imperador (IV) ──
  emperor: {
    impeto: {
      main: {
        name: 'Decreto de Execução',
        desc: 'Uma vez por rodada, no início do seu turno, escolha um inimigo perceptível. Ele recebe Condenado até o início da sua próxima rodada.\n' +
              'A primeira Ofensiva realizada por cada Súdito contra o Condenado, seguindo uma ordem do Imperador, recebe +1 Dado de Dano e +1 de Margem Crítica.\n' +
              'Somente ações realizadas por ordem direta recebem os benefícios; ações voluntárias dos Súditos não recebem bônus.'
      },
      amp1: {
        name: 'Ataque Coordenado',
        desc: 'Quando pelo menos 2 Súditos diferentes atingirem o mesmo Condenado na mesma rodada, o alvo possui 50% de chance de ficar Derrubado por 1 Rodada.\n' +
              'Apenas uma rolagem por rodada.'
      },
      amp2: {
        name: 'Exemplo Público',
        desc: 'Quando um inimigo Condenado for derrotado, todos os inimigos que presenciarem possuem 50% de chance de receber Medo por 1d3 Rodadas.'
      }
    },
    autocuidado: {
      main: {
        name: 'Sua Vida pela Coroa',
        desc: 'Uma vez por rodada, quando um Ataque ou Magia de alvo único confirmar acerto contra você, antes do dano pode utilizar uma Ação de Interromper e ordenar que um Súdito intercepte o ataque.\n' +
              'O Súdito torna-se o novo alvo, recebe todo o dano e todos os efeitos da ofensiva.\n' +
              'O Súdito precisa: perceber você, possuir Reação disponível e conseguir alcançá-lo utilizando metade do Movimento.'
      },
      amp1: {
        name: 'Guarda Real',
        desc: 'O Súdito utilizado recebe RD Bônus equivalente ao Tier de Charme contra o dano redirecionado.\n' +
              'Também recebe Vantagem para resistir às Condições aplicadas.'
      },
      amp2: {
        name: 'A Coroa Não Pode Cair',
        desc: 'Uma vez por combate, quando uma ofensiva reduziria seu PV a zero, pode utilizar Sua Vida pela Coroa mesmo que já tenha usado naquela rodada.\n' +
              'Ainda precisa possuir um Súdito válido.'
      }
    },
    artificio: {
      main: {
        name: 'Tributo ao Trono',
        desc: 'No início do combate, pode substituir o controle normal dos Súditos pelo Regime de Tributo.\n' +
              'Enquanto ativo, não pode ordenar ações dos Súditos. Em troca, uma vez por rodada, como Ação Rápida, escolha um Súdito perceptível:\n' +
              '\u2022 Tributo de Sangue: o Súdito perde 10 × Tier de Charme de PV Máximo; você recebe o mesmo valor como PV Bônus Máximo.\n' +
              '\u2022 Tributo do Espírito: o Súdito perde 10 × Tier de Charme de PM Máximo; você recebe o mesmo valor como PM Bônus Máximo.\n' +
              'PV Bônus recebe dano antes do PV Atual; PM Bônus é consumido antes do PM normal. Não é considerado Dano, Cura ou Sacrifício voluntário.\n' +
              'Limite: armazena até 20 × Tier de Charme em PV Bônus e PM Bônus.'
      },
      amp1: {
        name: 'Dízimo Coletivo',
        desc: 'Pode dividir o Tributo entre um número de Súditos igual ao seu Tier de Charme.\n' +
              'O limite de armazenamento aumenta para 15 × Tier de Charme.'
      },
      amp2: {
        name: 'Tudo Pertence à Coroa',
        desc: 'Permite manipular os recursos armazenados.\n' +
              'Pode converter PV → PM ou PM → PV.'
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
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Vassalo da Coroa',
        desc: 'Substitui Autoridade Subjugada. Ao invés de afetar todos, escolha apenas um alvo e realize Charme vs Conhecimento.\n' +
              'Caso falhe, o alvo se torna Súdito durante todo o combate.\n' +
              'Enquanto agir sob controle direto, recebe Imunidade contra Condições Negativas. Condições existentes ficam Suspensas durante a ação controlada.'
      },
      amp1: {
        name: 'Obediência Imaculada',
        desc: 'Uma vez por rodada, após um Súdito concluir uma ação controlada, pode remover permanentemente uma Condição Negativa suspensa.'
      },
      amp2: {
        name: 'Linha de Sucessão',
        desc: 'Uma vez por combate, caso o Vassalo escolhido seja derrotado, escolha outro alvo e realize novamente Charme vs Conhecimento.\n' +
              'Caso falhe, ele se torna o novo Vassalo até o final do combate.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── O Hierofante (V) ──
  hierophant: {
    impeto: {
      main: {
        name: 'Fé que Move Montanhas',
        desc: 'Uma vez por rodada, antes de um aliado afetado por Tradição Acima de Tudo realizar um Ataque ou Magia Ofensiva, ele pode converter parte do bônus de Acerto em poder ofensivo.\n' +
              'Cada +1 de Acerto removido gera +1 Dado de Dano, caso a ofensiva acerte.\n' +
              'Limite: máximo de Dados convertidos igual ao Tier de Charme ou Conhecimento.'
      },
      amp1: {
        name: 'Convicção Absoluta',
        desc: 'Caso o aliado converta o máximo permitido pelo Tier, a ofensiva não recebe Desvantagem e recebe +1 de Margem Crítica.'
      },
      amp2: {
        name: 'A Fé se Propaga',
        desc: 'Quando uma ofensiva fortalecida por Fé que Move Montanhas derrotar um inimigo, escolha outro aliado.\n' +
              'Ele recebe Tradição Acima de Tudo por 2 Turnos, sem pagar PM.'
      }
    },
    autocuidado: {
      main: {
        name: 'A Fé é um Escudo',
        desc: 'Sempre que utilizar Tradição Acima de Tudo em um aliado, você e o aliado recebem Vida Temporária.\n' +
              'Valor: 10 × Tier de Charme ou Conhecimento.\n' +
              'A Vida Temporária recebe dano antes do PV, não acumula, e reaplicar apenas restaura o valor.'
      },
      amp1: {
        name: 'Comunhão dos Fiéis',
        desc: 'Quando a Vida Temporária de um dos ligados chegar a zero, o outro pode transferir sua própria Vida Temporária utilizando uma Ação de Interromper.'
      },
      amp2: {
        name: 'Dogma Inabalável',
        desc: 'Enquanto possuir Vida Temporária de A Fé é um Escudo, recebe Vantagem contra Condições Negativas.\n' +
              'Além disso, Crer em Algo Maior também protege contra Encanto e Dominação.'
      }
    },
    artificio: {
      main: {
        name: 'Liturgia da Consagração',
        desc: 'Uma vez por rodada, antes de realizar uma ação, pode pagar um Rito para aprimorá-la.\n' +
              '\n' +
              'RITOS:\n' +
              '\u2694\uFE0F Arma Consagrada (5 PM) — O próximo Ataque Básico recebe +1 Dado de Dano e pode causar Dano de Luz.\n' +
              '\u2728 Milagre Intensificado (10 PM) — Aumenta em +1 QD o Dano ou a Cura de uma Magia.\n' +
              '\u23F3 Palavra Duradoura (10 PM) — Aumenta em +1 Rodada a duração de uma Melhoria ou Condição.\n' +
              '\uD83D\uDCDC Dogma Irrefutável (10 PM) — Os efeitos utilizados recebem +15% de Chance de Aplicação.'
      },
      amp1: {
        name: 'Liturgia Composta',
        desc: 'Pode aplicar 2 Ritos diferentes na mesma ação, pagando ambos normalmente.'
      },
      amp2: {
        name: 'Coro dos Fiéis',
        desc: 'Um aliado afetado por Tradição Acima de Tudo pode receber um Rito aplicado pelo Hierofante, utilizando uma Ação de Interromper.\n' +
              'O custo é pago normalmente.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Amparo da Comunidade',
        desc: 'Enquanto estiver consciente e presente na Cena, todos os aliados recebem Bem-Estar.\n' +
              'As Curas recebidas recebem +5 por Tier de Charme ou Conhecimento.\n' +
              'A chance natural de remover Condições Negativas aumenta em +5% × Tier de Charme ou Conhecimento.'
      },
      amp1: {
        name: 'Palavras de Conforto',
        desc: 'Uma vez por rodada, quando um aliado falhar ao remover uma Condição Negativa, permite uma nova rolagem.'
      },
      amp2: {
        name: 'Corpo e Espírito',
        desc: 'Ao final de um Combate ou Descanso Curto, os aliados recebem:\n' +
              'PV: 10 × Tier de Charme ou Conhecimento.\n' +
              'PM: 5 × Tier de Charme ou Conhecimento.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── Os Enamorados (VI) ──
  lovers: {
    impeto: {
      main: {
        name: 'Paixão Transbordante',
        desc: 'Uma vez por rodada, antes de um aliado realizar um Ataque ou Magia Ofensiva, ele pode consumir a Vida Extra recebida por Escolhas por Amor.\n' +
              'A cada 10 Pontos de Vida Extra consumidos, recebe +1 Dado de Dano.\n' +
              'Limite: máximo de Dados igual ao Tier de Expressão.'
      },
      amp1: {
        name: 'Corações em Sintonia',
        desc: 'Permite utilizar a Vida Extra de outro personagem voluntário.\n' +
              'A Vida Extra pode ser dividida entre até dois personagens.'
      },
      amp2: {
        name: 'Do Amor ao Amargor',
        desc: 'Quando uma ofensiva fortalecida por Paixão Transbordante atingir um inimigo, pode aplicar Amargor até o início da próxima rodada.'
      }
    },
    autocuidado: {
      main: {
        name: 'Amor Recíproco',
        desc: 'Uma vez por rodada, após utilizar Cura em si mesmo ou em um aliado, compartilha 50% da Cura com outro personagem.\n' +
              'Ao curar um aliado, você recebe metade da Cura; ao curar a si mesmo, escolhe um aliado para receber metade.\n' +
              'A Cura excedente vira Vida Extra.'
      },
      amp1: {
        name: 'Amor sem Medidas',
        desc: 'Caso você ou o aliado esteja sob Amor, a Cura compartilhada aumenta de 50% para 100%.'
      },
      amp2: {
        name: 'Na Saúde e na Doença',
        desc: 'Quando alguém receber Cura compartilhada por Amor Recíproco, pode remover uma Condição Negativa.'
      }
    },
    artificio: {
      main: {
        name: 'Afeto Invertido',
        desc: 'Uma vez por rodada, como Ação Rápida + 12 PM, pode trocar entre Amor ou Amargor.\n' +
              '\n' +
              '\uD83D\uDC95 Aspecto do Amor — As Curas funcionam normalmente: pode recuperar PV, criar Vida Extra e, caso o alvo esteja com PV completo, recebe PM e PV Temporário equivalente à metade da Cura.\n' +
              '\uD83D\uDC94 Aspecto do Amargor — As Curas tornam-se Magias Ofensivas de Psy: o valor que seria curado torna-se dano. Não afeta aliados; mantém Custo, Alcance, Ação e Quantidade de alvos; necessita teste de Acerto de Magia.'
      },
      amp1: {
        name: 'Remédio Amargo',
        desc: 'Caso a Cura invertida removesse Condições Negativas, ela passa a remover Melhorias dos inimigos atingidos.'
      },
      amp2: {
        name: 'Coração Dividido',
        desc: 'Uma vez por combate, mantém Amor e Amargor simultaneamente durante 2 Rodadas.\n' +
              'Cada alvo pode receber Cura ou Dano Psy.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Mediação dos Corações',
        desc: 'Uma vez por cena, pode utilizar sua capacidade de mediação.\n' +
              '\n' +
              'ENTRE PESSOAS — Teste: Expressão vs Conhecimento ou Disciplina. Em caso de sucesso, descobre uma concessão que cada lado aceitaria e todos os testes para alcançar acordo recebem Vantagem.\n' +
              'COM SOMBRAS — Quando uma Sombra estiver Derrubada, pode iniciar Negociação. Teste: Expressão vs MAG ou Conhecimento da Sombra.\n' +
              'Concessões: 1) a Sombra abandona o combate; 2) entrega Item/Recurso; 3) responde sinceramente uma pergunta; 4) realiza uma ação razoável pelo grupo.'
      },
      amp1: {
        name: 'Mesmo Corações Partidos podem se Curar',
        desc: 'Uma vez por combate, pode negociar com uma Sombra ainda não Derrubada, utilizando uma Ação Completa.\n' +
              'A Sombra interrompe ações hostis até o resultado.'
      },
      amp2: {
        name: 'Uma Escolha sem Violência',
        desc: 'Ao vencer uma Negociação, escolhe até 2 Concessões.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
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
              '▸ PV → PM: perde PV e recupera a mesma quantidade de PM.\n' +
              '▸ PM → PV: consome PM e recupera a mesma quantidade de PV.\n' +
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
  },

  // ── A Morte (XIII) ──
  death: {
    impeto: {
      main: {
        name: 'Uma Notícia Ruim',
        desc: 'Uma vez por rodada, após atingir um inimigo com uma Magia de Trevas ou após ele resistir a um efeito de Morte Instantânea, pode pagar 13 PM para aplicar Perda de Entropia durante os próximos 2 turnos do alvo.\n' +
              '\n' +
              'PERDA DE ENTROPIA:\n' +
              'O dano causado pelo alvo é reduzido com base na sua MAG. A RD do alvo é reduzida em valor equivalente à metade da sua MAG.\n' +
              '\n' +
              'Enquanto estiver em Portões da Morte — Morrendo, a condição é agravada: além da penalidade normal, o alvo perde sua MAG como Dano Bônus, sofre -2 Dados de Dano e a redução de RD passa a utilizar o valor completo da MAG.'
      },
      amp1: {
        name: 'Mal Contagioso',
        desc: 'Quando um inimigo afetado por Perda de Entropia morrer, pode aplicar a condição em outro inimigo perceptível. A duração é renovada completamente.\n' +
              'Ao fazer isso, recupera MAG + Nível em PM.'
      },
      amp2: {
        name: 'Colapso Terminal',
        desc: 'Enquanto estiver Morrendo, suas Magias de Trevas recebem +2 Dados de Dano contra inimigos afetados por Perda de Entropia.\n' +
              'Efeitos de Morte Instantânea recebem +10% de Chance adicional.'
      }
    },
    autocuidado: {
      main: {
        name: 'A Falsa Sensação de Viver',
        desc: 'Enquanto estiver em Portões da Morte — Morrendo, pode armazenar efeitos de Cura como Vida Falsa.\n' +
              'Limite: 50% do PV Máximo + Empatia.\n' +
              '\n' +
              'REGRAS:\n' +
              'Vida Falsa funciona como HP Bônus e recebe dano antes do PV. Não remove a condição Morrendo. No início de cada rodada perde 10 pontos de Vida Falsa.\n' +
              '\n' +
              'Pode utilizar uma Ação de Interromper para consumir toda a Vida Falsa restante, convertê-la em PV Atual e sair dos Portões da Morte.'
      },
      amp1: {
        name: 'Mentira Reconfortante',
        desc: 'No início da rodada, pode pagar 13 × Tier PM para receber Empatia como RD. Essa RD protege apenas a Vida Falsa.\n' +
              'Caso um aliado esteja nos Portões da Morte, pode transferir sua cura de A Falsa Sensação de Viver para ele, retirando-o automaticamente dos Portões da Morte.'
      },
      amp2: {
        name: 'A Mentira se Torna Verdade',
        desc: 'Ao consumir Vida Falsa para sair dos Portões da Morte, recupera Empatia em PM e remove Condições Negativas que estejam afetando você.'
      }
    },
    artificio: {
      main: {
        name: 'Rumo ao Pós-Vida',
        desc: 'Uma vez por combate, pode utilizar uma Ação de Interromper para reduzir seu PV Atual a zero e entrar automaticamente nos Portões da Morte — Morrendo.\n' +
              '\n' +
              'EFEITO: Metade do PV perdido dessa forma é convertido em PM Bônus, podendo ultrapassar o limite normal de PM.\n' +
              '\n' +
              'Enquanto estiver no Estado Pós-Vida, O Começo do Fim recebe melhorias:\n' +
              '• Magias de Trevas: +2 Dados de Dano.\n' +
              '• Morte Instantânea: +10% de Chance e +10% de Vida necessária para Execução.\n' +
              '\n' +
              'MAGIA EXCLUSIVA — Presságio Soturno:\n' +
              'Disponível apenas no Estado Pós-Vida. Custo: 13 PM × Tier de Magia.\n' +
              'Alvos: quantidade de inimigos igual ao Tier de Magia (Tier 4: todos os inimigos).\n' +
              'Efeito: causa Dano Médio (D8) de Trevas, com aumento da quantidade de dados conforme o Tier, e aplica Sentença por 2 turnos.\n' +
              'Sentença: o alvo possui duas rodadas para removê-la. Caso falhe, recebe Desespero.'
      },
      amp1: {
        name: 'Pressentimento Ruim',
        desc: 'Enquanto estiver no Estado Pós-Vida, alvos em Medo ou Desespero possuem desvantagem para resistir a Morte Instantânea.\n' +
              'Contra inimigos Imunes, recebe MAG + Empatia ou Conhecimento como Dano Onipotente.'
      },
      amp2: {
        name: 'O Presságio se Cumpre',
        desc: 'Ao sair do Estado Pós-Vida, todas as Sentenças aplicadas por você chegam imediatamente à resolução.\n' +
              'O alvo possui uma última chance:\n' +
              '• Falha: recebe Desespero.\n' +
              '• Sucesso: remove Sentença.'
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
        name: 'Anjo do Coração Despedaçado',
        desc: 'Uma vez por rodada, quando um aliado visível for alvo de Morte Instantânea de Trevas, pode utilizar uma Ação de Interromper para redirecionar o efeito para si.\n' +
              '\n' +
              'REGRAS: A chance é recalculada utilizando suas afinidades, resistências e defesas. O aliado deixa de ser alvo.'
      },
      amp1: {
        name: 'Ainda Não Era Sua Hora',
        desc: 'Ao redirecionar Morte Instantânea, o aliado protegido recebe Imunidade contra Morte Instantânea de Trevas até o início da próxima rodada.\n' +
              'Caso resista, você e o aliado recuperam 13 PM.'
      },
      amp2: {
        name: 'Um Nome por Outro',
        desc: 'Pode redirecionar Morte Instantânea de outros elementos.\n' +
              'Quantidade máxima de alvos protegidos: Tier de Empatia ou Conhecimento.'
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
        desc: 'A Persona alcança uma forma corrompida da sua verdadeira forma.\n' +
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── A Temperança (XIV) ──
  temperance: {
    impeto: {
      main: {
        name: 'Reação Exotérmica',
        desc: 'Uma vez por rodada, após um inimigo causar dano a um ou mais aliados, pode utilizar Por um Propósito para curar pelo menos um dos personagens atingidos.\n' +
              'Após resolver a cura, o responsável pelo ataque recebe Dano Fixo do tipo Físico equivalente a 50% do HP utilizado naquela ativação. O HP Temporário utilizado como cura também conta.\n' +
              '\n' +
              'Esse dano não recebe bônus adicionais, não causa Acerto Crítico e apenas atinge o responsável pelo efeito original.'
      },
      amp1: {
        name: 'Reação em Cadeia',
        desc: 'Para cada aliado adicional ferido pelo mesmo efeito e curado pela ativação de Por um Propósito, o dano de Reação Exotérmica aumenta em +25%.\n' +
              'Máximo: +100% do PV utilizado.'
      },
      amp2: {
        name: 'Solução Corrosiva',
        desc: 'Após sofrer o dano de Reação Exotérmica, a afinidade defensiva do inimigo contra o tipo de dano retornado é reduzida em 1 Categoria até o final da próxima rodada.\n' +
              'Categorias: Fraco → Normal → Resiste → Anula → Reflete → Absorve.'
      }
    },
    autocuidado: {
      main: {
        name: 'Retorno ao Equilíbrio',
        desc: 'Uma vez por rodada, após sacrificar PV ou sofrer dano equivalente a 40 + VIT em um único efeito, seu corpo inicia um processo de restauração.\n' +
              'No início da próxima rodada, recupera VIT = d6 de Cura.\n' +
              '\n' +
              'Vida Temporária não ativa esse efeito. Não pode acumular mais de uma vez.'
      },
      amp1: {
        name: 'Purificação pelas Águas',
        desc: 'Quando receber a cura de Retorno ao Equilíbrio, pode remover uma Condição Negativa que esteja afetando você.'
      },
      amp2: {
        name: 'Nenhuma Gota Desperdiçada',
        desc: 'Toda Cura excedente de Retorno ao Equilíbrio é convertida em Vida Temporária.\n' +
              'Limite: VIT × 5.\n' +
              'Pode ser utilizada normalmente através de Por um Propósito. A Vida Temporária criada desaparece ao final do combate.'
      }
    },
    artificio: {
      main: {
        name: 'Vasos Comunicantes',
        desc: 'Uma vez por combate, como Ação Padrão, estabelece uma Confluência Vital entre você e aliados voluntários. Quantidade de aliados: VIT. A ligação permanece até o final do combate.\n' +
              '\n' +
              'Uma vez por rodada, quando um único efeito fizer personagens ligados perderem ou recuperarem PV, pode redistribuir livremente o valor total entre os integrantes:\n' +
              '• Dano: soma todo o dano final e distribui entre os ligados.\n' +
              '• Cura: soma toda a cura recebida e redistribui.\n' +
              'O valor total não muda.\n' +
              '\n' +
              'O dano é redistribuído após Afinidades e RD. Custos e sacrifícios de PV não podem ser redistribuídos.'
      },
      amp1: {
        name: 'Fluxo Contínuo',
        desc: 'Pode utilizar Vasos Comunicantes duas vezes por rodada: uma vez para redistribuir dano e uma vez para redistribuir cura.'
      },
      amp2: {
        name: 'A Última Gota do Cálice',
        desc: 'Uma vez por combate, quando um aliado ligado seria reduzido a zero PV, pode ativar Vasos Comunicantes mesmo que já tenha utilizado a redistribuição na rodada.\n' +
              'Todo dano que reduziria qualquer aliado ligado abaixo de 1 PV é transferido para você. O dano transferido pode reduzir seu PV a zero.'
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
        name: 'A Dor Pode Esperar',
        desc: 'Uma vez por rodada, ao sofrer dano, pode utilizar uma Ação de Interromper para colocar metade do dano final em Suspensão, sofrendo a outra metade imediatamente.\n' +
              'O Dano Suspenso será aplicado no início da próxima rodada.\n' +
              '\n' +
              'O Dano Suspenso ignora Afinidades e RD, não pode ser reduzido, não pode ser redirecionado e não pode ser colocado novamente em Suspensão. Pode ser absorvido por Vida Temporária.'
      },
      amp1: {
        name: 'Tempo Emprestado',
        desc: 'Pode utilizar A Dor Pode Esperar quando um aliado perceptível sofrer dano.\n' +
              'O aliado sofre metade imediatamente e a outra metade fica em Suspensão. Continua limitado a uma utilização por rodada.'
      },
      amp2: {
        name: 'Longa Decantação',
        desc: 'O Dano Suspenso passa a ser dividido igualmente e aplicado no início das próximas 2 rodadas.\n' +
              'Cada parcela continua sendo parte do mesmo dano original. Não pode ser colocado novamente em Suspensão.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou liberação narrativa pelo Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona alcança sua Forma Verdadeira do Coração.\n' +
              'Aquisição exclusivamente narrativa.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona alcança uma forma corrompida da sua verdadeira forma.\n' +
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Aquisição exclusivamente narrativa.'
      }
    }
  },

  // ── A Estrela (XVII) ──
  star: {
    impeto: {
      main: {
        name: 'Colapso Luminoso',
        desc: 'Uma vez por rodada, após causar dano em um inimigo afetado por Brilho Estelar, pode consumir essa condição para provocar uma Explosão Estelar.\n' +
              'O alvo recebe Dados de Dano Bônus equivalente ao Tier de Charme ou Empatia.\n' +
              '\n' +
              'REGRAS: os dados da Explosão Estelar não são multiplicados por Acertos Críticos. Consumir Brilho Estelar encerra todos os efeitos da condição.'
      },
      amp1: {
        name: 'Estrela Cadente',
        desc: 'Caso o inimigo seja derrotado pelo ataque fortalecido por Colapso Luminoso, pode aplicar Brilho Estelar em outro inimigo perceptível sem pagar o custo de Ofuscando Espírito.\n' +
              'Pode acontecer apenas uma vez por rodada.'
      },
      amp2: {
        name: 'Supernova',
        desc: 'Ao provocar uma Explosão Estelar, todos os outros inimigos afetados por Brilho Estelar recebem metade dos Dados gerados pela explosão como Dano de Luz. O Brilho Estelar dos alvos secundários não é consumido.\n' +
              'Arredondar para baixo. Mínimo: 1 Dado. O dano não pode gerar outra Explosão Estelar.'
      }
    },
    autocuidado: {
      main: {
        name: 'Águas Cristalinas da Renovação',
        desc: 'Ao final de uma rodada em que tenha utilizado uma habilidade benéfica para curar, fortalecer, proteger ou acalmar um aliado, recupera Tier de Charme ou Empatia = d8 de Cura.\n' +
              '\n' +
              'REGRA: utiliza o maior Tier entre Charme e Empatia. Pode ativar apenas uma vez por rodada e somente durante combate.'
      },
      amp1: {
        name: 'Cântaro Inesgotável',
        desc: 'Sempre que receber a cura de Águas Cristalinas da Renovação, recupera também 4 × Tier de Charme ou Empatia em PM.'
      },
      amp2: {
        name: 'Esperança Inabalável',
        desc: 'Quando Águas Cristalinas da Renovação for ativada, pode remover uma Condição Mental Negativa sua ou de um aliado visível.\n' +
              'Caso não exista nenhuma condição, recebe Imunidade a Medo e Desespero até o início da próxima rodada.'
      }
    },
    artificio: {
      main: {
        name: 'A Estrela que Guia a Flecha',
        desc: 'No início do combate, antes de ativar Ofuscando Espírito, pode transformar Brilho Estelar em Mira Celestial. A escolha permanece até o final do combate.\n' +
              '\n' +
              'MAGIA EXTRA — Mira Celestial (Custo: 12 PM): um alvo recebe Mira Celestial.\n' +
              'Efeitos: o alvo não perde ações. Ataques e Magias Ofensivas contra ele recebem +2 Bônus de Acerto e +2 Margem Crítica. Efeitos ofensivos com chance percentual recebem +15% de Chance.\n' +
              '\n' +
              'REGRA: Mira Celestial conta como Brilho Estelar para Colapso Luminoso, pré-requisitos e demais habilidades da Estrela.'
      },
      amp1: {
        name: 'Estrela Guia',
        desc: 'Uma vez por rodada, quando você ou um aliado errar um Ataque ou Magia Ofensiva contra um alvo com Mira Celestial, pode realizar novamente o teste de acerto.\n' +
              'O novo resultado deve ser mantido.'
      },
      amp2: {
        name: 'Destino Traçado nas Estrelas',
        desc: 'Uma vez por rodada, quando um efeito ofensivo baseado em chance percentual falhar contra um alvo com Mira Celestial, pode rolar novamente a chance de aplicação. O novo resultado deve ser mantido.\n' +
              'Afeta: Condições Negativas, Morte Instantânea e outros efeitos percentuais.'
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
        name: 'Quando as Estrelas se Alinham',
        desc: 'Inimigos afetados por Brilho Estelar passam a ser considerados Derrubados apenas para cumprir requisitos de All-Out-Attack.\n' +
              '\n' +
              'REGRA: quando todos os inimigos estiverem afetados por Brilho Estelar, Derrubado ou ambos, o grupo pode declarar All-Out-Attack normalmente. Ao fazer isso, Brilho Estelar é consumido.\n' +
              '\n' +
              'IMPORTANTE: não aplica os demais efeitos de Derrubado. Inimigos sobreviventes agem imediatamente. Pode ser utilizado apenas uma vez por rodada.'
      },
      amp1: {
        name: 'Constelação Reativa',
        desc: 'Uma vez por rodada, quando você ou um aliado ativar o efeito de Ampliar sobre uma Condição afetando um inimigo, pode aplicar Brilho Estelar nesse alvo por 1 rodada, sem pagar Ofuscando Espírito.'
      },
      amp2: {
        name: 'Luz Depois da Queda',
        desc: 'Após participar de um All-Out-Attack ativado por Quando as Estrelas se Alinham, todos os participantes recebem Vantagem em Reações contra ações imediatas dos inimigos sobreviventes.\n' +
              'Dura até todos os inimigos sobreviventes concluírem suas ações.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou liberação narrativa pelo Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona alcança sua Forma Verdadeira do Coração.\n' +
              'Aquisição exclusivamente narrativa.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona alcança uma forma corrompida da sua verdadeira forma.\n' +
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Aquisição exclusivamente narrativa.'
      }
    }
  },

  // ── A Lua (XVIII) ──
  moon: {
    impeto: {
      main: {
        name: 'Pesadelo Manifesto',
        desc: 'Uma vez por rodada, quando um inimigo afetado pelo Medo aplicado por você falhar sua chance de agir, pode transformar seus temores em realidade.\n' +
              'O alvo sofre Tier de Empatia = d8 como Dano de Psy.\n' +
              'Como o alvo está sob Medo, o status é automaticamente Ampliado: Medo → Desespero.\n' +
              '\n' +
              'REGRAS: não exige teste de acerto. Não causa Acerto Crítico. Não conta como Ataque. Não ativa Derrubado.'
      },
      amp1: {
        name: 'O Medo é Contagioso',
        desc: 'Quando Pesadelo Manifesto transformar Medo em Desespero, escolha outro inimigo perceptível.\n' +
              'Ele possui 50% de Chance de receber Medo por 1 rodada.'
      },
      amp2: {
        name: 'Noite sem Amanhecer',
        desc: 'O Desespero provocado por Pesadelo Manifesto começa com -1 contador.\n' +
              'O alvo será levado a 0 PV após permanecer 2 rodadas sob Desespero.\n' +
              'Amplificar não reduz o contador inicial abaixo de 2 rodadas.'
      }
    },
    autocuidado: {
      main: {
        name: 'Íntimo da Inconsciência',
        desc: 'Torna-se completamente Imune a Medo e Desespero.\n' +
              'Uma vez por rodada, quando um efeito inimigo tentar aplicar essas condições, pode utilizar uma Ação de Interromper. Escolha:\n' +
              '\n' +
              '\uD83C\uDF11 Abraçar o Próprio Medo: recupera MAG = d8 de Cura.\n' +
              '\n' +
              '\uD83C\uDF15 Compartilhar Lucidez: escolha um aliado perceptível. Remove Medo e Desespero e concede Imunidade às duas condições até o início da próxima rodada.'
      },
      amp1: {
        name: 'Todos Sob a Mesma Lua',
        desc: 'Ao utilizar Compartilhar Lucidez, pode afetar até +2 aliados.\n' +
              'Íntimo da Inconsciência também passa a proteger contra Sono, Confuso e Encantado.'
      },
      amp2: {
        name: 'Senhor dos Próprios Pesadelos',
        desc: 'Ao utilizar Abraçar o Próprio Medo, recupera 4 × Tier de Empatia em PM.\n' +
              'Também remove uma Condição Mental Negativa.'
      }
    },
    artificio: {
      main: {
        name: 'A Luz que não me Pertence',
        desc: 'Uma vez por rodada, após um inimigo afetado por uma Condição Mental aplicada por você falhar ao conjurar uma Magia, pode utilizar uma Ação de Interromper. Cria Reflexo Lunar.\n' +
              '\n' +
              'REFLEXO LUNAR: a magia copiada é adicionada temporariamente ao Deck e não ocupa limite normal. Pode ser conjurada usando seus atributos, custo normal, alcance original, quantidade de alvos e efeitos originais.\n' +
              'Caso a magia não possua PM, seu custo é MAG × Tier da Magia.\n' +
              '\n' +
              'REGRAS: apenas um Reflexo Lunar pode existir. Copiar uma nova magia substitui a anterior. A magia deve possuir Tier igual ou inferior ao usuário. Desaparece ao final do combate.'
      },
      amp1: {
        name: 'Duas Faces da Lua',
        desc: 'Pode manter 2 Reflexos Lunares simultaneamente.\n' +
              'Também pode copiar Magias de aliados.\n' +
              'Necessita cumprir os requisitos da magia.'
      },
      amp2: {
        name: 'Reflexo Perfeito',
        desc: 'Uma vez por combate, após criar um Reflexo Lunar, pode conjurar imediatamente a magia copiada como parte da mesma Ação de Interromper.\n' +
              'Paga o custo normalmente. Pode escolher novos alvos.\n' +
              'O Reflexo Lunar permanece no Deck.'
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
        name: 'Minhas Faces Além do Reflexo',
        desc: 'Ao ser bem-sucedido em Leitura de Caráter, além do Segredo da Alma, cria um Perfil da Alma. Escolha duas perguntas:\n' +
              '\uD83C\uDF11 Qual emoção o personagem tenta esconder?\n' +
              '\uD83C\uDF12 O que ele deseja conseguir?\n' +
              '\uD83C\uDF18 O que ele teme que seja descoberto?\n' +
              '\uD83C\uDF15 Está escondendo alguma informação importante?\n' +
              '\n' +
              'Após a análise, recebe Vantagem no próximo teste Social ou de Investigação relacionado ao personagem analisado.\n' +
              '\n' +
              'REGRAS: não lê pensamentos. Não revela informações desconhecidas pelo alvo. Um personagem só pode ter Perfil da Alma analisado uma vez por Cena.'
      },
      amp1: {
        name: 'Fases da Alma',
        desc: 'Perfil da Alma permanece até o final da Sessão.\n' +
              'Percebe automaticamente quando comportamento ou emoção contradizem informações anteriores.\n' +
              'Após observar por 1 minuto em nova Cena, pode fazer +1 pergunta sem novo teste.'
      },
      amp2: {
        name: 'Nenhuma Máscara Sob o Luar',
        desc: 'Ao criar Perfil da Alma, também descobre se existe influência de Condição Mental, Magia, Persona, Sombra ou Interferência Cognitiva.\n' +
              'Revela a natureza da influência.\n' +
              'Não revela automaticamente origem ou responsável.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou liberação narrativa pelo Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona alcança a Forma Verdadeira do Coração.\n' +
              'Aquisição exclusivamente narrativa.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona alcança uma forma corrompida da sua verdadeira forma.\n' +
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Aquisição exclusivamente narrativa.'
      }
    }
  },

  // ── O Sol (XIX) ──
  sun: {
    impeto: {
      main: {
        name: 'O Sol que me Queima a Pele',
        desc: 'Uma vez por rodada, após um efeito de Cura utilizado por você recuperar 50+ PV de um ou mais personagens, escolha um inimigo perceptível.\n' +
              'Ele recebe 10 × Tier de Empatia ou Expressão como Dano Fixo de Fogo ou Luz.\n' +
              'O tipo é escolhido no momento da ativação. Não exige teste de acerto.'
      },
      amp1: {
        name: 'Clarão Escaldante',
        desc: 'Inimigos atingidos por O Sol que me Queima a Pele possuem 50% de Chance de receber Queimando.'
      },
      amp2: {
        name: 'Vento Solar',
        desc: 'Caso o inimigo já esteja Queimando antes de receber O Sol que me Queima a Pele, recebe a capacidade de Ampliar Queimadura.\n' +
              'Funciona como uma ofensiva do tipo Vento. Aumenta +10% o dano periódico de Queimando.\n' +
              '\n' +
              'REGRAS: não altera o tipo original do dano. Uma condição aplicada por Clarão Escaldante não pode ser ampliada pela mesma ativação.'
      }
    },
    autocuidado: {
      main: {
        name: 'Alvorada Benevolente',
        desc: 'Ao adquirir este Despertar Trama, recebe acesso à Magia Exclusiva: Alvorada Benevolente.\n' +
              '\n' +
              'MAGIA EXCLUSIVA — Alvorada Benevolente (Custo: 40 PM, Ação Padrão, Alvos: Tier de Empatia ou Expressão): realiza Cura Média = d10 em todos os alvos e remove 1 Condição Negativa diferente de cada alvo.\n' +
              '\n' +
              'REGRAS: utiliza o maior Tier entre Empatia e Expressão. Mínimo de 1 alvo. Recebe normalmente o bônus de Cura de Vitalidade Sofrida.'
      },
      amp1: {
        name: 'Calor Revigorante',
        desc: 'Alvorada Benevolente: Cura Média d10 se torna Cura Alta d12.'
      },
      amp2: {
        name: 'Luz Purificadora',
        desc: 'Alvorada Benevolente passa a remover até 2 Condições Negativas de cada alvo.\n' +
              'Após remover, os personagens recebem Imunidade às condições removidas até o início da próxima rodada.\n' +
              '\n' +
              'RESTRIÇÕES: não remove Condições Narrativas, Características de Arcana ou efeitos que declaram não poder ser purificados.'
      }
    },
    artificio: {
      main: {
        name: 'Positividade Incandescente',
        desc: 'Sempre que uma habilidade sua conceder RD aos aliados, pode transformar a RD em Fulgor Solar (mesma duração).\n' +
              '\n' +
              'Personagens com Fulgor Solar não recebem a RD original. Em troca, a primeira Ofensiva que acertarem por rodada recebe Dano Fixo Bônus Onipotente equivalente à RD convertida e +1 Margem Crítica.\n' +
              '\n' +
              'REGRAS: a escolha entre RD e Fulgor Solar acontece quando o efeito é aplicado. Dano Bônus Onipotente não é multiplicado por Acerto Crítico.'
      },
      amp1: {
        name: 'Entusiasmo Renovado',
        desc: 'Uma vez por rodada, quando utilizar Cura em um aliado que já ativou Fulgor Solar, ele poderá aplicar novamente o Dano Bônus na próxima Ofensiva.\n' +
              'Também recebe a Margem Crítica adicional.'
      },
      amp2: {
        name: 'Falsa Alegria Contagiante',
        desc: 'Uma vez por rodada, quando uma Ofensiva fortalecida por Fulgor Solar causar Acerto Crítico ou derrotar um inimigo, escolha outro aliado afetado por Fulgor.\n' +
              'A próxima Ofensiva desse aliado recebe Vantagem.\n' +
              'Duração: até o final da próxima rodada.'
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
        name: 'O Brilho Radiante que Esconde as Lágrimas',
        desc: 'Uma vez por rodada, após utilizar Cura ou Melhoria, escolha aliados afetados equivalente ao Tier de Empatia ou Expressão.\n' +
              'Cada escolhido recebe Empatia ou Expressão como Vida Temporária.\n' +
              '\n' +
              'Enquanto possuir Vida Temporária, recebe +3 metros de Movimento e +5 de Bônus em uma Habilidade Social escolhida.\n' +
              '\n' +
              'REGRAS: o bônus pode aumentar o Tier da Habilidade Social. Não pode ultrapassar 25. Vida Temporária não acumula. Desaparece ao final do combate.'
      },
      amp1: {
        name: 'O Sol Nunca se Põe',
        desc: 'No início da rodada, cada personagem afetado pela Vida Temporária recupera 2 × Tier de Empatia ou Expressão.\n' +
              'Não ultrapassa o valor recebido originalmente.'
      },
      amp2: {
        name: 'Horizontes Abertos',
        desc: 'O bônus de Movimento aumenta de +3 metros para +9 metros.\n' +
              'Além disso, pode sacrificar Vida Temporária para receber +1 Ação de Ataque na rodada.'
      }
    },
    resolucao: {
      main: {
        name: '"Quem eu Devo ser..."',
        level: 10,
        desc: 'O personagem atingiu o ponto onde sua Trama começa a chegar em uma Resolução graças aos seus Vínculos.\n' +
              'Desperta um novo poder.\n' +
              'Pode ser adquirido após: Persona Nível 10 ou liberação narrativa pelo Narrador.'
      },
      amp1: {
        name: '"Ó Mundo Meu..."',
        narrativeOnly: true,
        desc: 'A Persona alcança a Forma Verdadeira do Coração.\n' +
              'Aquisição exclusivamente narrativa.'
      },
      amp2: {
        name: '"... Ó Fome que me Consome"',
        narrativeOnly: true,
        desc: 'A Persona alcança uma forma corrompida da sua verdadeira forma.\n' +
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Aquisição exclusivamente narrativa.'
      }
    }
  },

  // ── A Roda da Fortuna (X) ──
  fortune: {
    impeto: {
      main: {
        name: 'Dobro ou Nada',
        desc: 'Uma vez por rodada, após acertar um Ataque ou Magia Ofensiva, antes de calcular o dano pode gastar 1 Ponto de Sorte e rolar 1d6.\n' +
              'Resultado Par: dobra o Dano Final. Resultado Ímpar: a ofensiva não causa dano e o Narrador recebe 1 Ponto de Azar.\n' +
              'Não pode ser usado em ataques que já sejam Acerto Crítico, nem acumula com efeitos de multiplicação de dano.'
      },
      amp1: {
        name: 'Giro Extra',
        desc: 'Após um resultado Ímpar, pode gastar outro Ponto de Sorte e rolar novamente o d6.\n' +
              'O novo resultado deve ser mantido.'
      },
      amp2: {
        name: 'Jackpot!',
        desc: 'Caso o resultado natural seja 6, o dano é aumentado para o Triplo e você recupera o Ponto de Sorte utilizado.'
      }
    },
    autocuidado: {
      main: {
        name: 'Cara ou Coroa',
        desc: 'Uma vez por rodada, quando for alvo de um Ataque ou Magia Ofensiva, pode usar uma Ação de Interromper, gastar 1 Ponto de Sorte e rolar 1d6.\n' +
              'Par: esquiva automática. Ímpar: o ataque acerta automaticamente e é considerado Acerto Crítico.'
      },
      amp1: {
        name: 'Passando por um Triz',
        desc: 'Após esquivar, pode se mover até metade do Movimento sem provocar Reações.'
      },
      amp2: {
        name: 'A Roda Gira Outra Vez',
        desc: 'Uma vez por combate, após falhar em Cara ou Coroa, pode repetir o d6 sem gastar Ponto de Sorte.'
      }
    },
    artificio: {
      main: {
        name: 'A Sorte Está Lançada',
        desc: 'Uma vez por combate, com uma Ação Padrão + 10 PM, escolhe um inimigo e cria o estado Jogo do Destino por 3 Rodadas.\n' +
              'Todo dano entre os dois participantes, após aplicar Afinidades, RD e Modificadores, vai para o Prêmio Acumulado.\n' +
              'Ao final da rodada, ambos rolam 1d6. O usuário pode gastar até 2 Pontos de Sorte (+1 na rolagem cada) e o Narrador até 2 Pontos de Azar (+1 cada).\n' +
              'O maior resultado recebe todo o Prêmio Acumulado como Dano Onipotente. Em caso de empate, o Prêmio continua acumulado.'
      },
      amp1: {
        name: 'Dados Marcados',
        desc: 'Uma vez durante o Jogo do Destino, após ver os resultados, pode gastar 1 Ponto de Sorte para obrigar uma nova rolagem.'
      },
      amp2: {
        name: 'Aposta Máxima',
        desc: 'Antes da rolagem, dobra todo o Prêmio Acumulado.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'A Fortuna Está nos Detalhes',
        desc: 'Ao final de uma Cena no Mundo Real, recupera metade dos Pontos de Sorte utilizados naquela cena (arredondando sempre para cima).\n' +
              'Limite máximo: 5 Pontos de Sorte.\n' +
              'Tabela: 1 gasto → recupera 1; 2 gastos → 1; 3 gastos → 2; 4 gastos → 2; 5 gastos → 3.'
      },
      amp1: {
        name: 'Juros da Fortuna',
        desc: 'Caso 3 ou mais Pontos de Sorte sejam utilizados, recupera +1 Ponto adicional.'
      },
      amp2: {
        name: 'Coincidência Conveniente',
        desc: 'Uma vez por cena, gasta 1 Ponto de Sorte para criar uma pequena coincidência favorável.\n' +
              'Exemplos: encontrar um objeto comum, chegar no momento certo, encontrar alguém por acaso ou evitar um contratempo simples.\n' +
              'Não pode: resolver uma investigação inteira, criar itens raros ou alterar eventos importantes.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── O Diabo (XV) ──
  devil: {
    impeto: {
      main: {
        name: 'As Correntes da Minha Obsessão',
        desc: 'Uma vez por rodada, quando um inimigo afetado por Aprisionamento utilizar uma Ação ou Reação, recebe 10 × Tier de Charme como Dano Fixo de Trevas.\n' +
              'Não necessita teste de acerto e não causa crítico.\n' +
              'Também ativa quando o alvo tenta escapar do Aprisionamento.'
      },
      amp1: {
        name: 'Pânico do Cativeiro',
        desc: 'Após sofrer o dano de As Correntes da Minha Obsessão, o inimigo possui 40% de chance de receber Medo por 1d3 Rodadas.'
      },
      amp2: {
        name: 'Execução Acorrentada',
        desc: 'Quando o Aprisionamento for consumido para criar um Acerto Automático contra um alvo com Medo, o ataque recebe +2 Dados de Dano.'
      }
    },
    autocuidado: {
      main: {
        name: 'Banquete dos Condenados',
        desc: 'Uma vez por rodada, quando um inimigo sob Aprisionamento sofrer dano, recupera 10 × Tier de Charme em PV.'
      },
      amp1: {
        name: 'Nunca é o Bastante',
        desc: 'A Cura excedente vira Vida Temporária.\n' +
              'Limite: 10 × Tier de Charme.'
      },
      amp2: {
        name: 'Vício Insaciável',
        desc: 'Caso o inimigo possua uma Condição Mental Negativa, recupera também 5 × Tier de Charme em PM.'
      }
    },
    artificio: {
      main: {
        name: 'Contrato de Letra Miúda',
        desc: 'Uma vez por combate por alvo, com uma Ação Padrão, pode oferecer um Contrato a um aliado voluntário ou a um inimigo sob Aprisionamento.\n' +
              '\n' +
              'TENTAÇÕES (duram 2 Rodadas):\n' +
              '\u2022 Poder — +5 de Acerto e +2 Dados de Dano em Ofensivas.\n' +
              '\u2022 Liberdade — remove todas as Condições Negativas e concede Imunidade contra elas até o fim do combate.\n' +
              '\u2022 Sobrevida — recupera 50% do PV Máximo e 25% do PM Máximo.\n' +
              '\n' +
              'PAGAMENTOS (após 2 Rodadas, escolha um):\n' +
              '\u2022 Sangue — o alvo perde 25% do PV Máximo como Dano Onipotente.\n' +
              '\u2022 Alma — o alvo perde 25% do PM Máximo.\n' +
              '\u2022 Serviço — você controla imediatamente 1 Ação Padrão do alvo.'
      },
      amp1: {
        name: 'Cláusula Oculta',
        desc: 'Pode escolher 2 Pagamentos diferentes.'
      },
      amp2: {
        name: 'Juros Infernais',
        desc: 'Recebe um benefício conforme o Pagamento cobrado:\n' +
              '\u2022 Sangue — recupera metade do dano causado.\n' +
              '\u2022 Alma — recupera metade do PM perdido pelo alvo.\n' +
              '\u2022 Serviço — recebe uma Ação de Interromper Bônus.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Todo Desejo Tem um Preço',
        desc: 'Uma vez por cena, após conversar ou observar um personagem por 1 minuto, realize um teste de Charme vs Conhecimento ou Disciplina.\n' +
              'Em caso de sucesso, descobre o desejo imediato do alvo, algo que ele teme perder e um benefício que valoriza.\n' +
              'Pode solicitar Concessões: informação; acesso a local/pessoa/recurso; serviço razoável; ou interrupção temporária de hostilidade.\n' +
              'Não é controle mental e não força ações contra os valores pessoais do alvo.'
      },
      amp1: {
        name: 'Letras Miúdas',
        desc: 'Após cumprir sua parte, cria um Favor.\n' +
              'Durante 30 dias pode cobrar ajuda adicional razoável.'
      },
      amp2: {
        name: 'Tentação Universal',
        desc: 'Pode utilizar Todo Desejo Tem um Preço contra Sombras capazes de comunicação, mesmo que não estejam Derrubadas.\n' +
              'Pode conseguir: um Item, uma Informação ou o abandono do combate.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── A Torre (XVI) ──
  tower: {
    impeto: {
      main: {
        name: 'Queda Inevitável',
        desc: 'Uma vez por rodada, ao causar dano em um inimigo afetado por Mudança Súbita, pode Desmoronar um Buff invertido.\n' +
              'Remove o efeito invertido e recebe Tier de Conhecimento em Dados de Dano Bônus Onipotente.\n' +
              'Não conta como dano crítico. Somente Buffs originalmente aplicados podem ser Desmoronados.'
      },
      amp1: {
        name: 'Efeito Dominó',
        desc: 'Após Desmoronar um efeito, escolha outro inimigo.\n' +
              'Ele possui 50% de chance de receber o mesmo Debuff por 1 Rodada.'
      },
      amp2: {
        name: 'Tudo Vem Abaixo',
        desc: 'Após Desmoronar, se o alvo possuir 2 ou mais Efeitos Negativos, possui 50% de chance de ficar Derrubado.\n' +
              'Com 4 ou mais, a aplicação é automática.'
      }
    },
    autocuidado: {
      main: {
        name: 'Reconstrução Súbita',
        desc: 'Uma vez por rodada, quando um Buff, Debuff, Melhoria ou Penalidade que esteja afetando você for removido, dissipado ou invertido, recebe 10 × Tier de Conhecimento em Vida Temporária.\n' +
              'Não acumula, pode renovar o valor e desaparece ao final do combate.'
      },
      amp1: {
        name: 'Estrutura Reforçada',
        desc: 'Enquanto possuir Vida Temporária, todas as Afinidades Elementais aumentam em 1 Categoria.\n' +
              'Máximo: Anula.'
      },
      amp2: {
        name: 'Erguer-se dos Escombros',
        desc: 'No início da rodada, pode consumir toda a Vida Temporária, recuperando esse valor como PV e removendo um Debuff ou Penalidade.'
      }
    },
    artificio: {
      main: {
        name: 'Demolição Controlada',
        desc: 'Adiciona uma nova utilização para Desastre Iminente, criando Ruptura Estrutural.\n' +
              '\n' +
              'CONTRA INIMIGOS — Remove Buffs e Efeitos de Melhoria (quantidade igual ao Tier de Conhecimento). Cada efeito removido causa +25 de Dano Onipotente.\n' +
              'CONTRA ALIADOS — Remove Debuffs e Penalidades. Cada efeito removido permite escolher entre recuperar 25 PV ou 15 PM.'
      },
      amp1: {
        name: 'Demolição Total',
        desc: 'Os Buffs destruídos não podem ser reaplicados até o final da próxima rodada.\n' +
              'Caso destrua 3 efeitos, o alvo fica Derrubado automaticamente.'
      },
      amp2: {
        name: 'Reconstrução Planejada',
        desc: 'Após usar Ruptura Estrutural em um aliado, ele recebe Vantagem no próximo teste ou reação e Imunidade ao primeiro Debuff recebido.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'A Culpa Pesa em Seu Coração',
        desc: 'Uma vez por cena, escolhe um alvo capaz de compreender consequências e realiza um teste de Conhecimento vs Disciplina.\n' +
              'Em caso de sucesso, aplica Peso da Culpa por 2 Rodadas ou pelo restante da Cena Social.\n' +
              '\n' +
              'PESO DA CULPA — Desvantagem em Mentir, Intimidar, Justificar ações e Prejudicar intencionalmente. Antes da primeira ação hostil, possui 25% de chance de Hesitar (a ação é perdida). Também revela uma emoção, uma memória ou um fragmento relacionado à culpa.'
      },
      amp1: {
        name: 'Confissão Tardia',
        desc: 'Recebe Vantagem ao usar Caindo em Desespero contra alguém com Peso da Culpa.\n' +
              'Em caso de sucesso, o alvo deve explicar completamente uma ação passada.'
      },
      amp2: {
        name: 'O Passado se Repete',
        desc: 'Uma vez por alvo por cena, caso alguém com Peso da Culpa prejudique outra pessoa, recebe Desespero até o final da próxima rodada.\n' +
              'Depois, o Peso da Culpa retorna caso ainda possua duração.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── O Julgamento (XX) — Arcana Especial ──
  judgement: {
    impeto: {
      main: {
        name: 'A Verdadeira Justiça, é Aquela que Pune!',
        desc: 'Custo: 30 PM.\n' +
              'Permite adicionar uma Fraqueza em um alvo. Também pode alterar suas próprias Reações Elementais, aumentando uma categoria (limite: Reflete).\n' +
              'Duração: até o alvo utilizar uma habilidade especial ou magia que remova todos os Debuffs.'
      },
      amp1: {
        name: 'Coração Pesado...',
        desc: 'Pode adicionar Fraquezas em uma quantidade de inimigos igual ao Tier de Disciplina.'
      },
      amp2: {
        name: 'Pena de Morte!',
        desc: 'Quando um alvo receber Morte Instantânea de uma de suas Fraquezas, role 1d100.\n' +
              'Acima de 50%: sobrevive e perde a Fraqueza aplicada por A Verdadeira Justiça. Abaixo de 50%: Morte Instantânea.\n' +
              'Exceção — Chefes, Lordes e alvos narrativos importantes não recebem Morte Instantânea; recebem MAGd10 de Dano Onipotente.'
      }
    },
    autocuidado: {
      main: {
        name: 'Prenúncio d\'A Última Trombeta',
        desc: 'Recebe Anular Luz e Anular Trevas nas Reações Elementais.\n' +
              'Uma vez por combate, quando chegar a 0 PV, pode usar uma Ação de Interromper para permanecer com 1 PV, remover todas as Condições Negativas e receber 15 × Tier de Disciplina em Vida Temporária.\n' +
              'Não funciona para perda voluntária de PV. A Vida Temporária desaparece no final do combate.'
      },
      amp1: {
        name: 'Levanta-te e Caminha!',
        desc: 'Ao ativar, recupera imediatamente 25% do PV Máximo e mantém a Vida Temporária.'
      },
      amp2: {
        name: 'Nenhuma Alma Será Deixada para Trás',
        desc: 'Pode utilizar em um aliado reduzido a 0 PV. O aliado recebe todos os efeitos.\n' +
              'Consome o uso da habilidade no combate.'
      }
    },
    artificio: {
      main: {
        name: 'As Vozes do Rio de Almas',
        desc: 'Uma vez por combate, como Ação de Interromper (Custo: 20 PM), escolhe um aliado e cria um Eco de Arcana até o final do combate.\n' +
              'Permite acessar uma Habilidade de Combate da Arcana do aliado, usando seus próprios atributos, recursos e custos.\n' +
              'Não pode copiar: Características de Arcana, aumento permanente de atributos, PV/PM máximos, Elo, Resolução ou a própria habilidade.'
      },
      amp1: {
        name: 'Um Coro de Vinte Vozes',
        desc: 'Permite escolher dois aliados e criar dois Ecos.\n' +
              'Somente um Eco fica ativo por vez; pode alternar como Ação Rápida.'
      },
      amp2: {
        name: 'O Legado dos Despertos',
        desc: 'Pode copiar uma Habilidade Principal de Despertar Trama do aliado.\n' +
              'Não copia: Amplificações, Artifício, Elo ou Resolução.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Nenhuma Alma Antes da Hora',
        desc: 'Enquanto estiver consciente, os aliados não podem ser alvo de Morte Instantânea.\n' +
              'Caso seja um efeito de alvo único, ele é redirecionado para você e anulado pela sua imunidade.\n' +
              'Caso seja em área, somente a Morte Instantânea é anulada; os demais efeitos continuam.'
      },
      amp1: {
        name: 'O Último Dia Pode Esperar',
        desc: 'Impede efeitos que reduziriam automaticamente um aliado a 0 PV (exemplo: Desespero).\n' +
              'Uma vez por aliado, ele permanece com 1 PV e remove a condição responsável.'
      },
      amp2: {
        name: 'O Carrasco Também Será Julgado!',
        desc: 'Quando um inimigo tentar causar Morte Instantânea, ele recebe Fraqueza ao elemento utilizado até o final da próxima rodada.\n' +
              'Pode usar uma Ação de Interromper para conjurar uma Magia de Luz ou Trevas contra ele.\n' +
              'A Fraqueza conta como aplicada por A Verdadeira Justiça, é Aquela que Pune!'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
              'Requisito: somente narrativo.'
      }
    }
  },

  // ── O Enforcado (XII) ──
  'hanged-man': {
    impeto: {
      main: {
        name: 'Milagre pelo Martírio',
        desc: 'Uma vez por rodada, ao conjurar uma Magia Ofensiva fora do Deck através de Auto Sacrifício, pode aumentar o custo em +50%.\n' +
              'O custo adicional torna-se Dano Incurável.\n' +
              'Benefícios: +1 QD de dano (limite: D12) e +15% de Chance de Aplicação.'
      },
      amp1: {
        name: 'Aperte Mais a Corda',
        desc: 'Pode aumentar o custo em 100%.\n' +
              'Bônus: +2 QD e +25% de Chance de Aplicação.'
      },
      amp2: {
        name: 'Toda Dádiva Tem seu Preço',
        desc: 'Permite usar Milagre pelo Martírio em Magias do próprio Deck.\n' +
              'O custo normal é pago em PM e o custo adicional vira Dano Incurável.'
      }
    },
    autocuidado: {
      main: {
        name: 'Entre o Corpo e a Alma',
        desc: 'Uma vez por rodada, quando receber Dano Incurável causado pelas próprias habilidades, pode usar uma Ação de Interromper e escolher:\n' +
              '\u2022 Sacrifício Espiritual — converte até 50% do Dano Incurável em perda de PM (proporção 1 PM = 1 Dano).\n' +
              '\u2022 Dor Suspensa — adia todo o Dano Incurável para o início da próxima rodada.'
      },
      amp1: {
        name: 'A Alma Assume o Fardo',
        desc: 'Sacrifício Espiritual pode converter 100% do Dano Incurável.\n' +
              'Caso não tenha PM suficiente, o valor restante vira Dano Incurável.'
      },
      amp2: {
        name: 'O Tempo na Corda',
        desc: 'Dor Suspensa divide o dano em duas parcelas, aplicadas nas próximas duas rodadas.'
      }
    },
    artificio: {
      main: {
        name: 'Cabo de Guerra com a Morte',
        desc: 'Uma vez por combate, ao usar Com a Corda no Pescoço, pode escolher uma Sombra e alterar a conexão: os custos de magia deixam de ser transferidos.\n' +
              'Novo efeito: todo dano direto entre os dois vira Dano Onipotente e, após o cálculo, também reduz o PV Máximo (ex.: 200 PV Máx. recebendo 40 de dano → novo PV Máx. 160).\n' +
              'Durante a conexão, ambos recebem Anular Elemento. Termina quando alguém chega a 0 PV, morre ou fica Incapacitado.'
      },
      amp1: {
        name: 'A Corda se Aperta',
        desc: 'No início da rodada, recebe Cura Persistente, removendo VIT × 5 de Dano Incurável.'
      },
      amp2: {
        name: 'Ao Vencedor, a Vida',
        desc: 'Caso vença, recupera o PV Máximo perdido.\n' +
              'Além disso, recupera metade da redução sofrida e recebe Nível de Persona como Vida Permanente.'
      }
    },
    elo: {
      main: {
        name: 'Voto do Coração',
        desc: 'Ao adquirir este Despertar Trama, pode Melhorar sua Habilidade Natural ou Habilidade de Combate.\n' +
              'Pode adicionar um novo efeito ou aprimorar uma capacidade já existente.'
      },
      amp1: {
        name: 'Coração de Batalha',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade de Combate.'
      },
      amp2: {
        name: 'Coração com o Mundo',
        desc: 'Recebe uma Melhoria Adicional para sua Habilidade Natural.'
      }
    },
    cognicao: {
      main: {
        name: 'Uma Perspectiva Emprestada',
        desc: 'Durante um Descanso Curto ou antes do Combate, pode escolher uma quantidade de aliados igual ao Tier de Empatia. Cada aliado empresta uma Magia do Deck.\n' +
              'A Magia entra temporariamente no seu Deck, usa PM normalmente e não causa Dano Incurável.\n' +
              'Não pode emprestar: Magias Únicas, exclusivas de Persona, Transformações ou capacidades intransferíveis.'
      },
      amp1: {
        name: 'O Mesmo Mundo por Outros Olhos',
        desc: 'O dono da Magia continua podendo utilizá-la.'
      },
      amp2: {
        name: 'Carregando o Fardo Juntos',
        desc: 'Ao conjurar uma Magia emprestada, pode dividir o custo em PM entre você e o dono.\n' +
              'Requisitos: o aliado deve estar consciente, ser perceptível e aceitar pagar.'
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
              'Torna-se uma Persona Suprimida da Fome.\n' +
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
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Custo: 1 ponto de Despertar</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar</button>';
    } else if (s === 'available-narr') {
      cls = 'is-available';
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Despertar Narrativo</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar Narrativo</button>';
    } else if (s === 'locked-choices') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Necessário 1 ponto de Despertar Trama</span>';
      actionHtml = '<span class="awk-note">Sem pontos restantes — suba o nível da Persona.</span>';
    } else if (s === 'locked-prereq') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Requer: ' + esc(branch.nodes[0].name) + '</span>';
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
      ' <span class="awk-choice-hint">(cada nível de aquisição concede 1 ponto; tanto Habilidades Principais quanto Amplificações custam 1 ponto)</span></div>' +
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
