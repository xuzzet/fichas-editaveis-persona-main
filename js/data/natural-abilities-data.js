// =============================================
// HABILIDADES NATURAIS — DADOS ESTATICOS POR ARCANA
// Categoria propria: NAO se mistura com Magias nem com Despertar Trama.
// Sao caracteristicas permanentes da Arcana (nao compraveis por pontos,
// nao editaveis pelo jogador — exceto escolhas explicitas de configuracao,
// como a resistencia elemental de Julgamento).
//
// Estrutura por chave de Arcana (mesma chave de ARCANA_MAP em awakening-data):
//   {
//     arcana: 'Julgamento',   // nome PT exibido
//     number: 20,             // numero da Arcana (arabico)
//     abilities: [ { name, type, typeLabel, blocks:[...] }, ... ]
//   }
//
// Tipos de bloco suportados pelo render (js/natural-abilities.js):
//   { kind:'desc',      text }                      -> paragrafo(s) de descricao
//   { kind:'highlight', items:[...] }               -> destaques visuais (chips)
//   { kind:'list',      label, items:[...] }        -> lista rotulada (ex.: Imunidades)
//   { kind:'bonus',     items:[...] }               -> bonus iniciais (chips +)
//   { kind:'choice',    label, configKey, options } -> escolha salva na config
//                                    (option: {value,label,desc?} — desc mostra layout detalhado)
//   { kind:'social',    label, text }               -> efeito de cena social
//   { kind:'meta',      items:[{label,value}] }     -> Uso/Alcance/Duracao/Custo
//   { kind:'warning',   label, text, items, join }  -> aviso/restricao (caixa vermelha)
//   { kind:'check',     label, text, test, success, failure, successLabel, failLabel } -> teste resistido
//   { kind:'variant',   label, items:[{title,tag,effect,rules:[...]}] } -> manifestacoes/escolhas
//   { kind:'narrative', text }                       -> regra narrativa
//
// Tipos de habilidade (ability.type): 'special' | 'passive' | 'active'.
// Campo opcional ability.mechanic{} registra metadados mecanicos para uso
// futuro (ex.: maxHPMultiplier, PM_to_IncurableDamage) — nao sao aplicados
// automaticamente aos calculos da ficha.
//
// Para adicionar novas Arcanas, basta acrescentar novas entradas neste mapa.
// =============================================

export const NATURAL_ABILITIES = {
  judgement: {
    arcana: 'Julgamento',
    number: 20,
    abilities: [
      {
        name: 'Caminhando pelo Rio de Almas',
        type: 'special',
        typeLabel: 'Habilidade Natural Especial',
        blocks: [
          {
            kind: 'desc',
            text:
              'A Arcana de Julgamento conta como uma Arcana Especial.\n\n' +
              'Seu acesso não ocorre normalmente através da progressão comum.\n\n' +
              'O personagem deve adquirir essa Arcana durante a campanha ou possuir ' +
              'uma autorização narrativa do Narrador para utilizá-la desde o início.'
          },
          {
            kind: 'highlight',
            items: ['Arcana Especial.', 'Requer desbloqueio narrativo.']
          }
        ]
      },
      {
        name: 'A Minha Visão do que é Certo!',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'list',
            label: 'Imunidades:',
            items: [
              'Dano baseado em porcentagem da Vida.',
              'Efeitos de Morte Instantânea.'
            ]
          },
          {
            kind: 'choice',
            label: 'Escolha uma resistência elemental:',
            configKey: 'elementResistance',
            options: [
              { value: 'light', label: 'Luz' },
              { value: 'dark', label: 'Trevas' }
            ]
          }
        ]
      },
      {
        name: 'Apenas a Minha Verdade é a Justa!',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { disciplineBonus: 5, attribute: 'MAG', value: 1 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+5 Disciplina', '+1 MAG']
          },
          {
            kind: 'social',
            label: 'Durante Cenas Sociais:',
            text:
              'O usuário consegue discernir a índole das pessoas presentes ' +
              'sem realizar testes de Disciplina.'
          },
          {
            kind: 'narrative',
            text:
              'Caso o jogador escolha não revelar as intenções percebidas das ' +
              'pessoas ao redor, o Narrador pode recompensá-lo com Pontos de Aspecto.'
          }
        ]
      }
    ]
  },

  'hanged-man': {
    arcana: 'O Enforcado',
    number: 12,
    abilities: [
      {
        name: 'Arcana Sacrificial+',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        // Metadados mecanicos registrados para uso futuro (nao aplicados
        // automaticamente ao calculo de HP — caracteristica de referencia).
        mechanic: { effect: 'maxHPMultiplier', value: 25 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Como parte do Arquétipo de Arcanas que arrancam muito da própria vida, ' +
              'recebe uma bonificação de +25% de Vida Final Máxima.'
          },
          {
            kind: 'bonus',
            items: ['+25% Vida Final Máxima']
          }
        ]
      },
      {
        name: 'Auto Sacrifício',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { conversion: 'PM_to_IncurableDamage' },
        blocks: [
          {
            kind: 'desc',
            text:
              'Além das Magias presentes no seu Deck, o usuário pode conjurar qualquer ' +
              'Magia não Física ou Onipotente que pertença ao seu Tier Atual de Conjuração.'
          },
          {
            kind: 'list',
            label: 'Regra:',
            items: [
              'Magias que não pertencem ao Deck atual não utilizam PM como custo.',
              'O custo dessas Magias é convertido em HP perdido como Dano Incurável.'
            ]
          },
          {
            kind: 'warning',
            label: 'Dano Incurável',
            text: 'O Dano Incurável causado por Auto Sacrifício só pode ser removido através de:',
            items: [
              'Descanso Longo.',
              'Um efeito de Cura que ultrapasse o dobro da Vida Máxima do alvo afetado.'
            ],
            join: 'OU'
          }
        ]
      },
      {
        name: 'Com a Corda no Pescoço',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { targetResources: ['HP', 'PM'], duration: '1d4+1 rounds', check: 'Empatia vs Conhecimento' },
        blocks: [
          {
            kind: 'meta',
            items: [
              { label: 'Uso', value: '1 vez por Descanso Curto.' },
              { label: 'Alcance', value: 'Curto (9 metros).' },
              { label: 'Duração', value: '1d4+1 rodadas.' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Escolha 1 alvo Humano em alcance curto (9 metros).\n\n' +
              'O usuário conecta sua própria dor ao sofrimento interno do alvo.'
          },
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Durante a duração, todos os custos de Magia utilizam os recursos do alvo conectado.',
              'Recursos possíveis: HP ou PM.'
            ]
          },
          {
            kind: 'check',
            label: 'Teste contra a vontade',
            text: 'Caso o alvo não aceite a conexão:',
            test: 'Empatia vs Conhecimento',
            success: 'O alvo fica conectado.',
            failure: 'O usuário se torna o alvo da habilidade.'
          }
        ]
      }
    ]
  },

  tower: {
    arcana: 'A Torre',
    number: 16,
    abilities: [
      {
        name: 'Desastre Iminente',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { cost: '15 PM', duration: 'combat' },
        blocks: [
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '15 PM' },
              { label: 'Tipo', value: 'Ativável' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Por 15 de PM, o usuário pode causar uma ruptura na estrutura dos efeitos ' +
              'presentes em um alvo, escolhendo uma das duas manifestações abaixo.'
          },
          {
            kind: 'variant',
            label: 'Escolha uma manifestação:',
            items: [
              {
                title: 'Mudança Súbita',
                tag: 'Alvo: 1 inimigo',
                effect:
                  'Todo e qualquer Buff que esteja afetando o alvo se torna Debuff ' +
                  'pelo restante do combate.',
                rules: [
                  'O efeito permanece até o final do combate.',
                  'Só pode ser removido por Magias ou efeitos que removam Buffs/Penalidades.',
                  'Não altera efeitos permanentes ou características de Arcana.'
                ]
              },
              {
                title: 'Revelação Súbita',
                tag: 'Alvo: 1 aliado ou inimigo',
                effect:
                  'Todo e qualquer Debuff que esteja afetando o alvo se torna Buff ' +
                  'pelo restante do combate.',
                rules: [
                  'O efeito permanece até o final do combate.',
                  'Só pode ser removido por Magias ou efeitos que removam Buffs/Penalidades.',
                  'Não altera Condições Negativas.'
                ]
              }
            ]
          }
        ]
      },
      {
        name: 'Caindo em Desespero',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva + Social',
        mechanic: { attribute: 'Conhecimento', value: 2, check: 'Conhecimento vs Conhecimento' },
        blocks: [
          {
            kind: 'bonus',
            items: ['+2 Conhecimento']
          },
          {
            kind: 'desc',
            text: 'A Torre possui a capacidade de destruir ilusões e obrigar a verdade a emergir.'
          },
          {
            kind: 'check',
            label: 'Subjugar Verdade',
            text:
              'Escolha um alvo Humano e realize um teste de Conhecimento contra o ' +
              'Conhecimento do alvo.',
            test: 'Conhecimento vs Conhecimento',
            success: 'Durante 1 Cena, ele deve falar apenas verdades.',
            successLabel: 'Alvo falha',
            failure: 'O efeito não é aplicado.',
            failLabel: 'Alvo tem sucesso'
          }
        ]
      }
    ]
  },

  devil: {
    arcana: 'O Diabo',
    number: 15,
    abilities: [
      {
        name: 'Prisão Viciosa',
        type: 'active',
        typeLabel: 'Habilidade Natural Passiva + Ativável',
        mechanic: { cost: '12 PM', condition: 'Aprisionamento' },
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, o Usuário causa [Aprisionamento] em um dos ' +
              'alvos inimigos.'
          },
          {
            kind: 'list',
            label: 'Aprisionamento:',
            items: [
              'O alvo perde a capacidade de se mover por 1d4+1 Turnos.',
              'Se o alvo estiver sob efeito de (Medo) durante Prisão Viciosa, ' +
                'fica incapaz de reagir ao próximo ataque contra ele — um ' +
                '(Acerto Automático) —, consumindo o efeito de [Aprisionamento].',
              'Após isso, "Prisão Viciosa" se torna uma magia extra e utilizável.'
            ]
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo (Ativável)', value: '12 PM' },
              { label: 'Tipo', value: 'Ativável' }
            ]
          },
          {
            kind: 'check',
            label: 'Prisão Viciosa (Ativável)',
            text:
              'Role um teste de Charme contra o Conhecimento do alvo.',
            test: 'Charme vs Conhecimento',
            success: 'O alvo recebe o efeito de [Aprisionamento].',
            successLabel: 'Alvo falha',
            failure: 'O efeito não é aplicado.',
            failLabel: 'Alvo tem sucesso'
          }
        ]
      },
      {
        name: 'Presença Cativante',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva + Social',
        mechanic: { attribute: 'Charme', value: 4 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+4 Charme inicial']
          },
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Testes relacionados a (Sedução ou Intimidar) somam seu Charme ' +
                '(2 vezes) como bônus.'
            ]
          },
          {
            kind: 'choice',
            label: 'Escolha uma característica:',
            configKey: 'presence',
            options: [
              {
                value: 'irresistivel',
                label: 'Charme Irresistível',
                desc:
                  'Todos acham você irresistível: vantagem em testes de Seduzir, ' +
                  'mas penalidade em testes de Intimidar.'
              },
              {
                value: 'intimidadora',
                label: 'Aura Intimidadora',
                desc:
                  'Todos acham você assustador e sua presença causa desconforto: ' +
                  'vantagem em testes de Intimidar, mas penalidade em testes de Sedução.'
              }
            ]
          }
        ]
      }
    ]
  },

  fortune: {
    arcana: 'A Roda da Fortuna',
    number: 10,
    abilities: [
      {
        name: 'Afortunado',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { critMargin: 1, luckPoints: 5 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+1 Margem Crítica em ataques']
          },
          {
            kind: 'highlight',
            items: ['5 Pontos de Sorte']
          },
          {
            kind: 'desc',
            text:
              'Os [Pontos de Sorte] são recuperados após o início de uma nova ' +
              'sessão e podem ser utilizados pelo Usuário e por seus aliados.'
          }
        ]
      },
      {
        name: 'Se Entregando ao Destino',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativável',
        mechanic: { cost: '50% PM', duration: '1 Cena' },
        blocks: [
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '50% dos PM' },
              { label: 'Duração', value: '1 Cena' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Causa um distúrbio em seu destino. Enquanto o efeito durar, todo ' +
              'sucesso em testes de Ataque é reinterpretado conforme o resultado:'
          },
          {
            kind: 'variant',
            label: 'Reinterpretação do sucesso:',
            items: [
              {
                title: 'Sucesso (Par)',
                tag: 'Acerto Crítico',
                effect:
                  'Considerado um [Acerto Crítico] que não causa dano bônus — ' +
                  'apenas o acerto automático.'
              },
              {
                title: 'Sucesso (Ímpar)',
                tag: 'Erro Crítico',
                effect:
                  'Considerado um [Erro Crítico] que causa a falha automática do ataque.'
              }
            ]
          },
          {
            kind: 'warning',
            label: 'Pontos de Azar (Narrador)',
            text:
              'Para todo Erro Crítico deste personagem, o Narrador recebe ' +
              '[1 Ponto de Azar] (limite de 5 Pontos de Azar). Esses pontos podem ' +
              'causar penalidades em qualquer um que esteja participando da cena.'
          }
        ]
      }
    ]
  },

  lovers: {
    arcana: 'Os Enamorados',
    number: 6,
    abilities: [
      {
        name: 'Amor & Amargor',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, o Usuário pode escolher uma das ' +
              'manifestações abaixo:'
          },
          {
            kind: 'variant',
            label: 'Escolha uma manifestação:',
            items: [
              {
                title: 'Amor',
                tag: 'Vantagem',
                effect:
                  'Concede (Vantagem) em testes de ataque de um aliado.'
              },
              {
                title: 'Amargor',
                tag: 'Penalidade',
                effect:
                  'Faz um alvo inimigo receber (Penalidade) em testes de ataque.'
              }
            ]
          }
        ]
      },
      {
        name: 'Escolhas por Amor',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { attribute: 'Expressão', value: 4 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+4 Expressão inicial']
          },
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Efeitos de [Cura] somam sua [Expressão] como cura bônus.',
              'Se o aliado estiver com a Vida total ao ser curado, a cura bônus ' +
                'é recebida como (Vida Extra).'
            ]
          }
        ]
      }
    ]
  },

  hierophant: {
    arcana: 'O Hierofante',
    number: 5,
    abilities: [
      {
        name: 'Idade Espiritual Avançada',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { bonusPM: ['Conhecimento', 'Charme'] },
        blocks: [
          {
            kind: 'highlight',
            items: ['PM bônus = Conhecimento + Charme']
          },
          {
            kind: 'desc',
            text:
              'Por conta de seu espírito maduro, recebe seu [Conhecimento] e ' +
              '[Charme] como [PM] bônus.'
          }
        ]
      },
      {
        name: 'Crer em algo Maior',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'list',
            label: 'Imunidade:',
            items: [
              'Você e todos os seus aliados são imunes aos efeitos de (Medo).'
            ]
          }
        ]
      },
      {
        name: 'Tradição Acima de Tudo',
        type: 'active',
        typeLabel: 'Habilidade Natural Passiva + Ativável',
        mechanic: {
          cost: '8 PM',
          duration: '2 Turnos',
          attribute: ['Charme', 'Conhecimento'],
          value: 3
        },
        blocks: [
          {
            kind: 'bonus',
            items: ['+3 Charme inicial', '+3 Conhecimento inicial']
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo (Ativável)', value: '8 PM' },
              { label: 'Alvo', value: '1 Aliado' },
              { label: 'Duração', value: '2 Turnos' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Pagando [8 PM], escolha [1 Aliado] para ser auxiliado. Durante ' +
              '(2 Turnos), ele recebe seu [Tier de Charme ou Conhecimento] como ' +
              'bônus de (Esquiva).'
          }
        ]
      }
    ]
  },

  emperor: {
    arcana: 'O Imperador',
    number: 4,
    abilities: [
      {
        name: 'Dominar',
        type: 'active',
        typeLabel: 'Magia Única',
        mechanic: { cost: '12 PM', chance: '50%', duration: '1d3 Turnos' },
        blocks: [
          {
            kind: 'highlight',
            items: ['Recebe Magia Única']
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '12 PM' },
              { label: 'Chance', value: '50%' },
              { label: 'Duração', value: '1d3 Turnos' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Tem [50% de Chance] de dominar um alvo por (1d3 Turnos).'
          }
        ]
      },
      {
        name: 'Autoridade Subjugada',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, faça uma rolagem de [Charme vs Conhecimento] ' +
              'contra todos no combate (Aliados & Inimigos).'
          },
          {
            kind: 'check',
            label: 'Autoridade Subjugada',
            test: 'Charme vs Conhecimento',
            success: 'Torna-se [Súdito] do Imperador por (1d4 Turnos).',
            successLabel: 'Alvo falha',
            failure: 'Não é afetado.',
            failLabel: 'Alvo tem sucesso'
          },
          {
            kind: 'social',
            label: 'Súditos:',
            text:
              'Alvos que se tornaram Súditos estão sob a influência do Imperador. ' +
              'Podem agir normalmente e não estão impossibilitados de agir, mas ' +
              'durante a rodada do Usuário do Imperador ele pode fazer seus Súditos ' +
              'agirem por ele, controlando-os.'
          }
        ]
      },
      {
        name: 'Comandar & Obedecer',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { attribute: 'Charme', value: 5 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+5 Charme inicial']
          },
          {
            kind: 'variant',
            label: 'Ação de um Súdito:',
            items: [
              {
                title: 'Age por vontade própria',
                tag: 'Penalidade',
                effect:
                  'Recebe penalidade equivalente ao (Tier de Charme) do Imperador ' +
                  'em (Acerto) e o total de (Charme) em dano causado.'
              },
              {
                title: 'Forçado a agir pelo Imperador',
                tag: 'Bônus',
                effect:
                  'Recebe os mesmos valores como bônus, em vez de penalidade.'
              }
            ]
          }
        ]
      }
    ]
  },

  sun: {
    arcana: 'O Sol',
    number: 19,
    abilities: [
      {
        name: 'Vitalidade Sofrida',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'list',
            label: 'Cura bônus:',
            items: [
              'Todo efeito de (Cura) que você utilizar recebe sua ' +
                '[Empatia ou Expressão] como cura bônus.'
            ]
          },
          {
            kind: 'meta',
            items: [{ label: 'Cura Total', value: '1× por Descanso Longo' }]
          },
          {
            kind: 'desc',
            text:
              'Pode curar (1 Alvo) completamente, deixando-o com [100% de HP] e ' +
              'retirando todos os (Debuffs ou Penalidades) que ele estivesse sob ' +
              'efeito no momento da cura.'
          }
        ]
      },
      {
        name: 'Positividade Mascarada',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva + Social',
        mechanic: { attribute: ['Expressão', 'Empatia'], value: 2 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+2 Expressão inicial', '+2 Empatia inicial']
          },
          {
            kind: 'check',
            label: 'Divertir os Colegas (Interlúdio)',
            text:
              'Durante cenas de (Interlúdio), pode rolar um teste de ' +
              '(Expressão ou Empatia) para divertir todos os seus colegas.',
            test: 'DT 15',
            success:
              'Na próxima missão, todos os colegas recebem sua ' +
              '[Empatia ou Expressão] como redução de dano.',
            failure: 'O efeito não é aplicado.'
          }
        ]
      }
    ]
  },

  moon: {
    arcana: 'A Lua',
    number: 18,
    abilities: [
      {
        name: 'Arcana do Pavor',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'highlight',
            items: ['Recebe Magia: Evil Touch']
          },
          {
            kind: 'list',
            label: 'Limite de Deck:',
            items: [
              '(Evil Touch) quebra o limite do seu (Deck) — não conta para ele.',
              'Caso adquira (Evil Smile) no futuro, ela também não contará para o ' +
                'limite do seu (Deck).'
            ]
          }
        ]
      },
      {
        name: 'Lado Escuro da Lua',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, role [1d100] representando a chance de causar ' +
              '(Medo) em todos os alvos inimigos do combate.'
          },
          {
            kind: 'meta',
            items: [
              { label: 'Chance Base', value: '80%' },
              { label: 'Alvo Imune/Resistente', value: '30%' }
            ]
          },
          {
            kind: 'list',
            label: 'Contra Imunidade ou Resistência:',
            items: [
              'Personagens de Lua ignoram a Imunidade/Resistência do alvo; a ' +
                '(Chance) é apenas reduzida para (30%).',
              'A (%) necessária para recuperação é aumentada de [33% para 25%].'
            ]
          }
        ]
      },
      {
        name: 'Leitura de Caráter',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva + Social',
        mechanic: { attribute: 'Empatia', value: 4 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+4 Empatia inicial']
          },
          {
            kind: 'desc',
            text:
              'Pode reconhecer a [Arcana] de qualquer pessoa no seu campo de visão.'
          },
          {
            kind: 'check',
            label: 'Reconhecer Arcana (alvo de Nível Acima)',
            text:
              'Caso o alvo seja de [Nível Acima], role um teste para ter a ' +
              'capacidade de reconhecer a Arcana dele.',
            test: 'Magia vs Magia',
            success: 'Reconhece a [Arcana] do alvo.',
            failure: 'Não consegue reconhecer.'
          },
          {
            kind: 'check',
            label: 'Segredo da Alma',
            text:
              'Com sucesso em um teste de [Empatia] contra um (NPC) ou (Jogador), ' +
              'pode descobrir um Segredo da Alma.',
            test: 'Empatia',
            success: 'Descobre um Segredo da Alma.',
            failure: 'Nada é revelado.'
          },
          {
            kind: 'narrative',
            text:
              'A informação pode ser uma emoção reprimida, um lapso de uma ' +
              'memória ou algo que o Narrador achar mais adequado.'
          }
        ]
      }
    ]
  },

  star: {
    arcana: 'A Estrela',
    number: 17,
    abilities: [
      {
        name: 'Ofuscando Espírito!',
        type: 'active',
        typeLabel: 'Habilidade Natural Passiva + Ativável',
        mechanic: { cost: '12 PM', condition: 'Brilho Estelar' },
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, o Usuário causa [Brilho Estelar] em todos os ' +
              'alvos inimigos.'
          },
          {
            kind: 'list',
            label: 'Brilho Estelar:',
            items: [
              'Alvos sob [Brilho Estelar] perdem suas ações por [1 Rodada].',
              'Após isso, "Ofuscando Espírito" se torna uma magia extra e utilizável.'
            ]
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo (Ativável)', value: '12 PM' },
              { label: 'Tipo', value: 'Ativável' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Ofuscando Espírito (Ativável): um alvo do combate recebe a condição ' +
              '[Brilho Estelar].'
          }
        ]
      },
      {
        name: 'Beldade & Serenidade',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva + Social',
        mechanic: { attribute: ['Charme', 'Empatia'], value: 3 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+3 Charme inicial', '+3 Empatia inicial']
          },
          {
            kind: 'check',
            label: 'Acalmar Aliado com Medo',
            text:
              'Quando um [Aliado] recebe a condição (Medo), você pode usar ' +
              '[Charme ou Empatia] como bônus extra na sua rolagem para acalmá-lo.',
            test: 'Rolagem para Acalmar + (Charme ou Empatia)',
            success:
              'O Aliado torna-se [Imune a Medo] por (1d3 Turnos).',
            failure: 'O efeito não é aplicado.'
          },
          {
            kind: 'warning',
            label: 'Limite:',
            text:
              'O bônus inicial não ultrapassa o limite de 5 de Habilidade Social ' +
              'Inicial.'
          }
        ]
      }
    ]
  },

  temperance: {
    arcana: 'A Temperança',
    number: 14,
    abilities: [
      {
        name: 'Arcana Sacrificial',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { effect: 'maxHPMultiplier', value: 15 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Como parte do Arquétipo de Arcanas que arrancam a própria vida, ' +
              'recebe uma bonificação de +15% de Vida Final Máxima.'
          },
          {
            kind: 'bonus',
            items: ['+15% Vida Final Máxima']
          }
        ]
      },
      {
        name: 'Por um Propósito',
        type: 'active',
        typeLabel: 'Ação de Interromper',
        blocks: [
          {
            kind: 'meta',
            items: [{ label: 'Ação', value: 'Interromper' }]
          },
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Pode utilizar seu [HP] como cura.',
              '[VIG = Quantidade de Alvos] que podem receber a cura por ação de cura.',
              'Pode converter [PM] em vida temporária, que também pode ser usada ' +
                'para curar aliados.'
            ]
          }
        ]
      },
      {
        name: 'Buscando um Significado',
        type: 'active',
        typeLabel: 'Ação de Interromper',
        mechanic: { attribute: 'VIT', value: 2, cost: '50% do HP' },
        blocks: [
          {
            kind: 'bonus',
            items: ['+2 VIT inicial']
          },
          {
            kind: 'warning',
            label: 'Limite:',
            text: 'O bônus inicial ainda respeita o limite de 5 iniciais.'
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '50% do HP' },
              { label: 'Ação', value: 'Interromper' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Sacrifique [50% do seu HP] para utilizar um dos efeitos abaixo:'
          },
          {
            kind: 'variant',
            label: 'Escolha um alvo do sacrifício:',
            items: [
              {
                title: 'Usado em Aliados',
                tag: 'Buff',
                effect:
                  'Por 2 Rodadas: +3 de Margem Crítica e +1 de Dano Fixo Bônus ' +
                  'para cada 25 de Vida Sacrificada.'
              },
              {
                title: 'Usado em si mesmo',
                tag: 'Carga',
                effect:
                  'Recebe os efeitos da Magia "Carga": causa o Dobro de Dano na ' +
                  'próxima ofensiva Física e +1 de Margem Crítica.'
              }
            ]
          }
        ]
      }
    ]
  },

  death: {
    arcana: 'A Morte',
    number: 13,
    abilities: [
      {
        name: 'Portões da Morte',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'warning',
            label: 'Ao Morrer:',
            text: 'Sofre penalidades permanentes:',
            items: [
              'Perde permanentemente [5 de HP e 5 de PM].',
              'Efeitos de (Reviver) só trazem você de volta com [1 de HP], não ' +
                'importa a força do efeito.'
            ]
          },
          {
            kind: 'desc',
            text:
              'Esses valores só podem ser recuperados se você pegar o [Final Hit] ' +
              'no alvo que causou sua morte.'
          }
        ]
      },
      {
        name: 'O Começo do Fim',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'desc',
            text:
              'Sempre que entrar em (Morrendo), pode continuar agindo normalmente ' +
              'e não morre automaticamente ao receber dano.'
          },
          {
            kind: 'list',
            label: 'Enquanto estiver (Morrendo):',
            items: [
              'Suas magias do tipo [Trevas] causam (+1 Dado) como dano bônus.',
              'Magias que causam [Morte Instantânea] têm (+10%) de chance de ' +
                'atingir o alvo.'
            ]
          }
        ]
      },
      {
        name: 'Mudanças fazem parte da Vida',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        blocks: [
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Sempre que fizer um teste, utiliza sua [Empatia ou Conhecimento] no ' +
                'lugar do bônus.',
              'Testes afetados: Habilidade Social e Dano Bônus.'
            ]
          },
          {
            kind: 'warning',
            label: 'Intercalar Testes:',
            text:
              'É necessário ficar intercalando entre os testes. Caso utilize um ' +
              'teste repetido, você perde [5 de HP e PM].'
          },
          {
            kind: 'narrative',
            text:
              'Exemplo: o Personagem de Morte usou um Ataque contra uma sombra; ' +
              'na próxima rodada precisa usar outra coisa (não um Ataque) para não ' +
              'sofrer a penalidade, então usa sua ação padrão para auxiliar um ' +
              'aliado — assim, na rodada seguinte, pode atacar novamente.'
          }
        ]
      }
    ]
  },
  strength: {
    arcana: 'A Força',
    number: 11,
    abilities: [
      {
        name: 'Arcana Sacrificial',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { maxHPPercentBonus: 15 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Como parte do Arquétipo de Arcanas que arrancam a própria vida, ' +
              'recebe uma bonificação em sua vida final máxima.'
          },
          {
            kind: 'bonus',
            items: ['+15% Vida Máxima Final']
          }
        ]
      },
      {
        name: 'Batendo de Frente',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { firstRoundCourageAsDamageBonus: true, upkeepCostPV: 5 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Quando iniciar um [Combate] contra uma sombra, durante a primeira ' +
              'rodada você recebe sua [Coragem] como (Dano Bônus) para golpes corpo ' +
              'a corpo ou magias físicas.'
          },
          {
            kind: 'meta',
            items: [
              { label: 'Gatilho', value: 'Início de Combate contra sombra' },
              { label: 'Duração', value: '1ª rodada' },
              { label: 'Manutenção', value: '5 de PV por turno' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Após o efeito acabar, você pode pagar [5 de PV] por turno para ' +
              'manter o efeito ativo.'
          }
        ]
      },
      {
        name: 'Poder da Coragem',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { initialCourageBonus: 4, mentalConditionEscapeCostPV: 5, mentalConditionEscapeBonus: 5 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+4 Coragem inicial']
          },
          {
            kind: 'desc',
            text:
              'Quando recebe uma condição mental, pode pagar [5 de PV] para receber ' +
              '(+5 de Bônus) no teste para se livrar desse efeito.'
          },
          {
            kind: 'warning',
            label: 'Limite:',
            text:
              'A Coragem inicial não ultrapassa o limite de [5 de Habilidade ' +
              'Social Inicial].'
          }
        ]
      }
    ]
  },
  justice: {
    arcana: 'A Justiça',
    number: 8,
    abilities: [
      {
        name: 'Causa & Efeito',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { costPM: 10, reflectDamage: true, reflectElements: ['Luz', 'Intel'], reflectedEffectDuration: 1 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Após sofrer dano, gaste [10 de PM] para causar a mesma quantidade ' +
              'de dano ao atacante.'
          },
          {
            kind: 'list',
            label: 'Usos:',
            items: [
              'O dano causado pode ser de [Luz] ou [Intel].',
              'Pode pagar o mesmo custo de [PM] para rebater efeitos negativos.'
            ]
          },
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '10 de PM' },
              { label: 'Gatilho', value: 'Após sofrer dano' }
            ]
          },
          {
            kind: 'warning',
            label: 'Efeito Retornado:',
            text: 'O efeito negativo rebatido só dura (1 Turno) ao ser retornado.'
          }
        ]
      },
      {
        name: 'Lei, Verdade & Ordem',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { disciplineBonus: 4, liePenaltyEqualsDiscipline: true, lieImmunityPerSession: 1 },
        blocks: [
          {
            kind: 'bonus',
            items: ['+4 Disciplina']
          },
          {
            kind: 'desc',
            text:
              'Mentiras não passam despercebidas pela Justiça: toda ação ' +
              'relacionada a [Mentiras] recebe sua [Disciplina] como penalidade no ' +
              'teste.'
          },
          {
            kind: 'meta',
            items: [
              { label: 'Uso', value: '1 vez por sessão' },
              { label: 'Efeito', value: 'Imune a mentiras por uma cena' }
            ]
          },
          {
            kind: 'narrative',
            text:
              'O Mestre pode recompensar o jogador caso ele escolha não revelar ' +
              'uma das mentiras percebidas para o grupo.'
          }
        ]
      }
    ]
  },
  hermit: {
    arcana: 'O Eremita',
    number: 9,
    abilities: [
      {
        name: 'Introspecção',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { dodgeBonus: 2, immuneToSingleTargetUntilAttack: true, exposedUntilNextTurnAfterAttack: true },
        blocks: [
          {
            kind: 'bonus',
            items: ['+2 para Esquivar']
          },
          {
            kind: 'desc',
            text:
              'Não pode ser alvo de ataques de (Alvo Único) até que declare um ' +
              '[Ataque].'
          },
          {
            kind: 'warning',
            label: 'Após Atacar:',
            text:
              'Você se torna alvejável normalmente até o início da sua próxima ' +
              'rodada.'
          }
        ]
      },
      {
        name: 'Isolamento Caloroso',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { attributeBonus: 2, soloSceneBonus: 5 },
        blocks: [
          {
            kind: 'choice',
            label: 'Recebe +2 no atributo escolhido:',
            configKey: 'hermitAttribute',
            options: [
              { value: 'conhecimento', label: '+2 Conhecimento' },
              { value: 'disciplina', label: '+2 Disciplina' }
            ]
          },
          {
            kind: 'social',
            label: 'Sozinho em Cena:',
            text:
              'Sente-se mais confortável quando está sozinho em uma cena, recebendo ' +
              '(+5 de Bônus) em qualquer teste que não seja de [Ataque ou Reação].'
          }
        ]
      }
    ]
  },
  chariot: {
    arcana: 'A Carruagem',
    number: 7,
    abilities: [
      {
        name: 'Arcana Sacrificial',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { maxHPPercentBonus: 15 },
        blocks: [
          {
            kind: 'desc',
            text:
              'Como parte do Arquétipo de Arcanas que arrancam a própria vida, ' +
              'recebe uma bonificação em sua vida final máxima.'
          },
          {
            kind: 'bonus',
            items: ['+15% Vida Máxima Final']
          }
        ]
      },
      {
        name: 'Avançando Sem Parar!',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { costPercentPV: 25, allyHeal: 'VIT = d6', allyGrantsStandardAction: true, alliesActImmediately: true },
        blocks: [
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '25% do PV' },
              { label: 'Alvo', value: 'Todos os aliados' }
            ]
          },
          {
            kind: 'list',
            label: 'Efeito:',
            items: [
              'Todos os aliados recuperam [VIT = d6 de Cura].',
              'Todos os aliados recebem uma [Ação Padrão].',
              'Todos os aliados (Agem Imediatamente).'
            ]
          }
        ]
      },
      {
        name: 'Imparável & Indestrutível',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { disciplineBonus: 2, healReceivedBonusDice: 1, firstZeroHPImmediateAttack: true },
        blocks: [
          {
            kind: 'bonus',
            items: ['+2 Disciplina inicial']
          },
          {
            kind: 'list',
            label: 'Efeitos:',
            items: [
              '(Efeitos de Cura) em você recebem [+1 Dado].',
              'Ao chegar pela primeira vez a (Zero de Vida), pode realizar um ' +
                '[Ataque] de imediato antes de cair.'
            ]
          }
        ]
      }
    ]
  },
  empress: {
    arcana: 'A Imperatriz',
    number: 3,
    abilities: [
      {
        name: 'Arcana do Encanto',
        type: 'special',
        typeLabel: 'Habilidade Natural Especial',
        mechanic: { grantsSpell: 'Marin Karin', ignoresDeckLimit: ['Marin Karin', 'Marin Karin+'] },
        blocks: [
          {
            kind: 'desc',
            text:
              'Recebe inicialmente (Marin Karin) como Magia, que quebra o Limite do ' +
              'seu (Deck).'
          },
          {
            kind: 'list',
            label: 'Não contam para o limite do Deck:',
            items: [
              '(Marin Karin) — concedida inicialmente.',
              'Caso adquira ("Marin Karin+") no futuro, ela também não contará.'
            ]
          }
        ]
      },
      {
        name: 'Beleza Natural',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { rollOnCombatStart: '1d100', charmBaseChance: 80, charmChanceVsResist: 30, recoveryThreshold: 25 },
        blocks: [
          {
            kind: 'desc',
            text:
              'No início do combate, role [1d100] representando a chance de causar ' +
              '(Encanto) em todos os alvos inimigos do combate.'
          },
          {
            kind: 'meta',
            items: [
              { label: 'Rolagem', value: '1d100 (início de combate)' },
              { label: 'Chance base', value: '80%' }
            ]
          },
          {
            kind: 'list',
            label: 'Contra [Imunidade ou Resistência]:',
            items: [
              'Personagens de Imperatriz ignoram a Imunidade/Resistência.',
              'A (Chance) é reduzida para (30%).',
              'A [%] para recuperação aumenta de [33% para 25%].'
            ]
          }
        ]
      },
      {
        name: 'Tratamento de Rainha & Beijando meus Pés',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { charmBonus: 5, consumableSaveChance: 50, charmedEnemyAidCost: 'Ação Rápida' },
        blocks: [
          {
            kind: 'bonus',
            items: ['+5 Charme inicial']
          },
          {
            kind: 'list',
            label: 'Efeitos:',
            items: [
              'Ao utilizar [Itens Consumíveis], eles têm [50% de Chance] de não ' +
                'serem consumidos (ativável 1 vez por item).',
              'Inimigos sob efeito de (Charme) gastam apenas [Ação Rápida] para ' +
                'qualquer Ação que seja para auxiliar você.'
            ]
          }
        ]
      }
    ]
  },
  priestess: {
    arcana: 'A Sacerdotisa',
    number: 2,
    abilities: [
      {
        name: 'Mistérios Velados',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { attributeBonus: 3, healBonusFromAttribute: true, healBonusDiceFromTier: true, grantsFeat: 'Sacerdotisa' },
        blocks: [
          {
            kind: 'choice',
            label: 'Recebe +3 no atributo escolhido:',
            configKey: 'priestessAttribute',
            options: [
              { value: 'conhecimento', label: '+3 Conhecimento' },
              { value: 'empatia', label: '+3 Empatia' }
            ]
          },
          {
            kind: 'list',
            label: 'Efeitos de Cura:',
            items: [
              'Todo efeito de (Cura) que você utilizar recebe seu [Conhecimento ou ' +
                'Empatia] como cura bônus.',
              'Recebe seu Tier de [Conhecimento ou Empatia] como dados de cura bônus.'
            ]
          },
          {
            kind: 'highlight',
            items: ['Ganha o feito de Sacerdotisa automaticamente.']
          }
        ]
      },
      {
        name: 'Voz Interior',
        type: 'active',
        typeLabel: 'Habilidade Natural Ativa',
        mechanic: { costPM: 5, test: 'Conhecimento ou Empatia', dt: 15, amplifyDTBonus: 15, amplifyFailLossChance: 50 },
        blocks: [
          {
            kind: 'meta',
            items: [
              { label: 'Custo', value: '5 de PM' },
              { label: 'Teste', value: 'Conhecimento ou Empatia' },
              { label: 'DT', value: '15' }
            ]
          },
          {
            kind: 'desc',
            text:
              'Em caso de sucesso no teste, pode pedir [1 Dica] ao Narrador sobre a ' +
              'investigação ou Enigma.'
          },
          {
            kind: 'variant',
            label: 'Amplificação',
            items: [
              {
                title: 'Amplificação',
                tag: 'DT +15',
                effect:
                  'Aumenta a (DT em +15) para receber uma informação mais crucial ' +
                  'sobre o local.',
                rules: [
                  'Caso falhe, essa informação terá [50% de Chance] de ser perdida ' +
                    'por completo.'
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  magician: {
    arcana: 'O Mago',
    number: 1,
    abilities: [
      {
        name: 'Concentrado',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { nullifyMentalStatusInCombat: true, freeSpellOnMentalAttempt: true, fullMentalImmunity: true },
        blocks: [
          {
            kind: 'highlight',
            items: ['Em combate: (Anular — Status Mental).']
          },
          {
            kind: 'desc',
            text:
              'Se mesmo assim alguma (Sombra ou Alvo Hostil) tentar utilizar algum ' +
              'efeito mental em você, ganha a capacidade de Conjurar uma Magia do ' +
              'seu Deck como ação livre [Sem Custo].'
          },
          {
            kind: 'highlight',
            items: ['Imunidade Total a efeitos negativos mentais.']
          }
        ]
      },
      {
        name: 'Disciplina Mágica',
        type: 'passive',
        typeLabel: 'Habilidade Natural Passiva',
        mechanic: { spellDamageBonusFromMAG: true, disciplineForSocialTests: true, sceneBonus: 5 },
        blocks: [
          {
            kind: 'list',
            label: 'Efeitos:',
            items: [
              'Todas as suas [Magias] somam sua [MAG] como (Dano Bônus).',
              'Pode utilizar [Disciplina] no lugar de qualquer outra para testes de ' +
                'Habilidade Social.'
            ]
          },
          {
            kind: 'meta',
            items: [
              { label: 'Uso', value: '1 vez por Cena' },
              { label: 'Efeito', value: '+5 de Bônus em um tipo de rolagem' }
            ]
          }
        ]
      }
    ]
  }
};

/**
 * Retorna o pacote de Habilidades Naturais para uma chave de Arcana.
 * @param {string|null} arcanaKey - chave (ex.: 'judgement')
 * @returns {object|null}
 */
export function getNaturalAbilities(arcanaKey) {
  if (!arcanaKey) return null;
  return NATURAL_ABILITIES[arcanaKey] || null;
}
