/* As 18 tarefas de fábrica, em português do Brasil.
 *
 * Isto é CONTEÚDO clínico-pedagógico, não interface: nomes, passos e as três
 * quebras por nível. Mora fora do App.jsx de propósito, para uma terapeuta
 * editar sem abrir código — e porque um idioma novo não traduz este arquivo,
 * escreve o dele.
 *
 * Rotina é cultural: horário de café da manhã, o que entra na mochila e o
 * que a família chama de "lanche" mudam de país para país. Por isso a tarefa
 * inteira vem para cá, não só o texto — um mercado novo adapta, não traduz.
 *
 * Três regras ao mexer:
 *   - toda tarefa tem as TRÊS quebras (n.1, n.2, n.3). A do nível abaixo é
 *     o que o assistente empresta quando propõe "passos menores";
 *   - `arte` e `capa` apontam para ARTES, no App.jsx. Desenho novo entra lá,
 *     no estilo feltro recortado;
 *   - nada de infantilizar o nível 3: criança de 11 anos percebe e abandona.
 */

export const TODOS = [0, 1, 2, 3, 4, 5, 6];
export const SEMANA = [1, 2, 3, 4, 5];
export const FDS = [0, 6];

export default [
  {
    id: "cama", nome: "Arrumar a cama", momento: "fds", horario: "09:00", dias: FDS, capa: "cama4", figurinha: "🛏️",
    n: {
      1: [
        { t: "Pegue o cobertor", d: "Com as duas mãos.", arte: "cama1" },
        { t: "Puxe para cima", d: "Até o travesseiro.", arte: "cama2" },
        { t: "Passe a mão", d: "Alise o cobertor.", arte: "cama2" },
        { t: "Pegue o travesseiro", d: "Ele é macio.", arte: "cama3" },
        { t: "Coloque no lugar", d: "Na cabeceira da cama.", arte: "cama3" },
        { t: "Ponha o bichinho", d: "Escolha um amiguinho.", arte: "cama4" },
      ],
      2: [
        { t: "Estique o cobertor", d: "Puxe o cobertor até o travesseiro.", arte: "cama1" },
        { t: "Alise com as mãos", d: "Passe a mão para tirar as dobras.", arte: "cama2" },
        { t: "Coloque o travesseiro", d: "Deixe o travesseiro na cabeceira.", arte: "cama3" },
        { t: "Ponha seu bichinho", d: "Escolha um bichinho para descansar ali.", arte: "cama4" },
      ],
      3: [
        { t: "Estique e alise o cobertor", d: "Do pé da cama até a cabeceira, sem dobras.", arte: "cama2" },
        { t: "Ajuste travesseiro e almofadas", d: "Alinhe tudo na cabeceira.", arte: "cama3" },
        { t: "Confira o resultado", d: "Olhe de longe: ficou do jeito que você queria?", arte: "cama4" },
      ],
    },
  },
  {
    id: "dentes", nome: "Escovar os dentes", momento: "manha", horario: "07:15", dias: TODOS, capa: "dentes3", figurinha: "🪥",
    n: {
      1: [
        { t: "Pegue a escova", d: "Ela está no copo.", arte: "dentes1" },
        { t: "Molhe a escova", d: "Só um pouquinho de água.", arte: "dentes1" },
        { t: "Coloque a pasta", d: "Do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove em cima", d: "Faça bolinhas devagar.", arte: "dentes3", tempo: 20 },
        { t: "Escove embaixo", d: "Agora os dentes de baixo.", arte: "dentes4", tempo: 20 },
        { t: "Cuspa na pia", d: "Toda a espuma.", arte: "dentes5" },
        { t: "Guarde a escova", d: "De volta para o copo.", arte: "dentes1" },
      ],
      2: [
        { t: "Pegue a escova", d: "Molhe as cerdas com um pouquinho de água.", arte: "dentes1" },
        { t: "Coloque a pasta", d: "Uma quantidade do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove os de cima", d: "Faça bolinhas com a escova, sem apertar.", arte: "dentes3", tempo: 30 },
        { t: "Escove os de baixo", d: "Um lado de cada vez.", arte: "dentes4", tempo: 30 },
        { t: "Bocheche e guarde", d: "Cuspa, beba um gole de água e guarde a escova.", arte: "dentes5" },
      ],
      3: [
        { t: "Prepare a escova", d: "Molhe as cerdas e use pasta do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove os quatro cantos", d: "Fora, dentro e as pontas. Dois minutos no total.", arte: "dentes3", tempo: 120 },
        { t: "Finalize", d: "Bocheche, lave a escova e deixe secando em pé.", arte: "dentes5" },
      ],
    },
  },
  {
    id: "maos", nome: "Lavar as mãos", momento: "clinica", horario: "11:50", dias: SEMANA, capa: "maos4", figurinha: "🫧",
    n: {
      1: [
        { t: "Abra a torneira", d: "Água morninha.", arte: "maos1" },
        { t: "Molhe as mãos", d: "As duas mãos.", arte: "maos2" },
        { t: "Pegue o sabonete", d: "Uma vez só.", arte: "maos3" },
        { t: "Esfregue as palmas", d: "Faça espuma.", arte: "maos4", tempo: 10 },
        { t: "Entre os dedos", d: "Um dedinho de cada vez.", arte: "maos4", tempo: 10 },
        { t: "Tire a espuma", d: "Na água da torneira.", arte: "maos5" },
        { t: "Seque na toalha", d: "Aperte bem.", arte: "maos6" },
      ],
      2: [
        { t: "Abra a torneira", d: "Água morninha, devagar.", arte: "maos1" },
        { t: "Molhe as mãos", d: "Deixe a água cobrir as duas mãos.", arte: "maos2" },
        { t: "Pegue o sabonete", d: "Uma vez só já é o bastante.", arte: "maos3" },
        { t: "Esfregue tudo", d: "Palma, dedos e entre os dedinhos.", arte: "maos4", tempo: 20 },
        { t: "Enxágue", d: "Tire toda a espuma na água.", arte: "maos5" },
        { t: "Seque na toalha", d: "Até as mãos ficarem secas.", arte: "maos6" },
      ],
      3: [
        { t: "Ensaboe as mãos", d: "Palmas, dorso, entre os dedos e as unhas.", arte: "maos4", tempo: 20 },
        { t: "Enxágue", d: "Até não sobrar nenhuma espuma.", arte: "maos5" },
        { t: "Seque e feche a torneira", d: "Mãos secas antes de sair do banheiro.", arte: "maos6" },
      ],
    },
  },
  {
    id: "roupa", nome: "Se arrumar", momento: "manha", horario: "07:00", dias: TODOS, capa: "roupa1", figurinha: "👕",
    n: {
      1: [
        { t: "Olhe a roupa", d: "Está tudo aqui.", arte: "roupa1" },
        { t: "Cabeça na camiseta", d: "Passe a cabeça pelo buraco maior.", arte: "roupa2" },
        { t: "Um braço", d: "Depois o outro braço.", arte: "roupa2" },
        { t: "Sente-se", d: "Sentado é mais fácil.", arte: "roupa3" },
        { t: "Vista a calça", d: "Uma perna de cada vez.", arte: "roupa3" },
        { t: "Calce as meias", d: "Primeiro os dedinhos.", arte: "roupa4" },
        { t: "Calce os sapatos", d: "E feche bem.", arte: "roupa5" },
      ],
      2: [
        { t: "Separe a roupa", d: "Deixe tudo na cama, na ordem de vestir.", arte: "roupa1" },
        { t: "Vista a camiseta", d: "Cabeça primeiro, depois um braço de cada vez.", arte: "roupa2" },
        { t: "Vista a calça", d: "Sente para colocar uma perna de cada vez.", arte: "roupa3" },
        { t: "Calce as meias", d: "Calcanhar no lugar certo.", arte: "roupa4" },
        { t: "Calce os sapatos", d: "Pé direito, pé esquerdo, e feche bem.", arte: "roupa5" },
      ],
      3: [
        { t: "Escolha a roupa do dia", d: "Veja o tempo lá fora e o que você vai fazer hoje.", arte: "roupa1" },
        { t: "Vista de cima para baixo", d: "Camiseta, calça, e etiquetas para dentro.", arte: "roupa2" },
        { t: "Meias e calçados", d: "Confira se está tudo fechado antes de sair.", arte: "roupa5" },
      ],
    },
  },
  {
    id: "brinq", nome: "Guardar brinquedos", momento: "fds", horario: "10:30", dias: FDS, capa: "brinq4", figurinha: "🧸",
    n: {
      1: [
        { t: "Olhe o chão", d: "O que está fora do lugar?", arte: "brinq1" },
        { t: "Traga a caixa", d: "Deixe ela aberta.", arte: "brinq2" },
        { t: "Pegue um brinquedo", d: "Só um por vez.", arte: "brinq3" },
        { t: "Coloque na caixa", d: "Pode contar em voz alta.", arte: "brinq3" },
        { t: "Guarde a caixa", d: "Na prateleira.", arte: "brinq4" },
      ],
      2: [
        { t: "Olhe o chão", d: "Veja quais brinquedos estão fora do lugar.", arte: "brinq1" },
        { t: "Abra a caixa", d: "Deixe a caixa aberta pertinho de você.", arte: "brinq2" },
        { t: "Guarde um por um", d: "Pode contar cada brinquedo em voz alta.", arte: "brinq3" },
        { t: "Coloque na prateleira", d: "A caixa volta para o lugar dela.", arte: "brinq4" },
      ],
      3: [
        { t: "Separe por tipo", d: "Blocos com blocos, carrinhos com carrinhos.", arte: "brinq1" },
        { t: "Guarde nas caixas certas", d: "Cada caixa na prateleira de sempre.", arte: "brinq3" },
        { t: "Deixe o caminho livre", d: "Nada no chão entre a porta e a cama.", arte: "brinq4" },
      ],
    },
  },
  {
    id: "comer", nome: "Almoçar", momento: "clinica", horario: "12:00", dias: SEMANA, capa: "comer1", figurinha: "🍽️",
    n: {
      1: [
        { t: "Lave as mãos", d: "Com sabonete.", arte: "maos4" },
        { t: "Sente na cadeira", d: "Pés no chão.", arte: "comer1" },
        { t: "Coma devagar", d: "Mastigue bem.", arte: "comer2" },
        { t: "Beba água", d: "Um copo.", arte: "comer3" },
        { t: "Leve o prato", d: "Até a pia.", arte: "comer4" },
      ],
      2: [
        { t: "Sente à mesa", d: "Pés no chão e costas no encosto.", arte: "comer1" },
        { t: "Coma devagar", d: "Mastigue bem antes da próxima garfada.", arte: "comer2" },
        { t: "Beba água", d: "Um copo durante a refeição.", arte: "comer3" },
        { t: "Leve o prato", d: "Leve seu prato até a pia.", arte: "comer4" },
      ],
      3: [
        { t: "Prepare seu lugar", d: "Prato, copo e talheres antes de sentar.", arte: "comer1" },
        { t: "Coma com calma", d: "Pouse o garfo entre uma garfada e outra.", arte: "comer2" },
        { t: "Recolha e limpe", d: "Prato na pia e mesa sem migalhas.", arte: "comer4" },
      ],
    },
  },
  {
    id: "banho", nome: "Tomar banho", momento: "noite", horario: "19:00", dias: TODOS, duracao: 15, capa: "banho2", figurinha: "🚿",
    n: {
      1: [
        { t: "Tire a roupa", d: "Deixe no cesto.", arte: "banho1" },
        { t: "Teste a água", d: "Com a mão primeiro.", arte: "banho1" },
        { t: "Molhe o corpo", d: "Todo o corpo.", arte: "banho1" },
        { t: "Passe sabonete", d: "Braços e barriga.", arte: "banho2", tempo: 15 },
        { t: "Lave o cabelo", d: "Massageie a cabeça.", arte: "banho3", tempo: 15 },
        { t: "Tire a espuma", d: "Com bastante água.", arte: "banho4" },
        { t: "Seque com a toalha", d: "Cabelo e corpo.", arte: "banho5" },
      ],
      2: [
        { t: "Entre no chuveiro", d: "Teste a água antes com a mão.", arte: "banho1" },
        { t: "Passe o sabonete", d: "Braços, barriga, pernas e pés.", arte: "banho2" },
        { t: "Lave o cabelo", d: "Massageie a cabeça com as pontas dos dedos.", arte: "banho3", tempo: 20 },
        { t: "Enxágue tudo", d: "Até não ficar mais espuma.", arte: "banho4" },
        { t: "Seque com a toalha", d: "Cabelo, corpo e entre os dedos do pé.", arte: "banho5" },
      ],
      3: [
        { t: "Lave o corpo", d: "Incluindo pescoço, axilas e pés.", arte: "banho2", tempo: 30 },
        { t: "Lave o cabelo e enxágue", d: "Shampoo no couro cabeludo, não só nas pontas.", arte: "banho3", tempo: 30 },
        { t: "Seque e organize", d: "Toalha no varal e roupa suja no cesto.", arte: "banho5" },
      ],
    },
  },
  {
    id: "dormir", nome: "Hora de dormir", momento: "noite", horario: "21:30", dias: TODOS, capa: "dormir4", figurinha: "🌙",
    n: {
      1: [
        { t: "Vista o pijama", d: "O mais confortável.", arte: "dormir1" },
        { t: "Guarde a roupa", d: "No cesto.", arte: "dormir1" },
        { t: "Diminua a luz", d: "Só o abajur.", arte: "dormir2" },
        { t: "Deite e respire", d: "Devagar, cinco vezes.", arte: "dormir3", tempo: 20 },
        { t: "Boa noite", d: "Feche os olhinhos.", arte: "dormir4" },
      ],
      2: [
        { t: "Vista o pijama", d: "A roupa mais confortável do dia.", arte: "dormir1" },
        { t: "Deixe a luz baixinha", d: "Só o abajur aceso.", arte: "dormir2" },
        { t: "Deite e respire", d: "Puxe o ar devagar e solte, cinco vezes.", arte: "dormir3", tempo: 30 },
        { t: "Boa noite", d: "Feche os olhos. Amanhã tem mais.", arte: "dormir4" },
      ],
      3: [
        { t: "Prepare o quarto", d: "Pijama, luz baixa e telas desligadas.", arte: "dormir2" },
        { t: "Respiração longa", d: "Inspire em 4, segure 4, solte em 6.", arte: "dormir3", tempo: 60 },
        { t: "Durma", d: "Se a cabeça acelerar, volte à respiração.", arte: "dormir4" },
      ],
    },
  },

  /* ---------- rotina real, montada com o responsável ---------- */
  { id: "cabelo", nome: "Pentear o cabelo", momento: "manha", horario: "07:20", dias: TODOS, capa: "cabelo", figurinha: "💇",
    passos: [{ t: "Pentear o cabelo", d: "Comece pelas pontas e vá subindo, sem puxar.", arte: "cabelo" }] },
  { id: "desodorante", nome: "Passar desodorante", momento: "manha", horario: "07:25", dias: TODOS, capa: "desodorante", figurinha: "🧴",
    passos: [{ t: "Passar desodorante", d: "Nas duas axilas, com a pele seca.", arte: "desodorante" }] },
  { id: "remedio_manha", nome: "Remédios da manhã", momento: "manha", horario: "07:30", dias: TODOS, capa: "remedio", figurinha: "💊",
    passos: [{ t: "Tomar os remédios", d: "Confira com o adulto e beba água depois.", arte: "remedio" }] },

  { id: "trocar", nome: "Se trocar", momento: "clinica", horario: "12:40", dias: SEMANA, capa: "roupa2", figurinha: "🔁",
    passos: [
      { t: "Tirar a roupa de casa", d: "Uma peça de cada vez.", arte: "roupa1" },
      { t: "Vestir a roupa daqui", d: "Camiseta primeiro, depois a calça.", arte: "roupa2" },
    ] },
  { id: "mochila", nome: "Guardar a roupa na mochila", momento: "clinica", horario: "12:50", dias: SEMANA, capa: "mochila", figurinha: "🎒",
    passos: [
      { t: "Dobrar a roupa", d: "Dobre ao meio, sem pressa.", arte: "roupa1" },
      { t: "Guardar na mochila", d: "No bolso grande, e feche o zíper.", arte: "mochila" },
    ] },
  { id: "terapia", nome: "Terapia", momento: "clinica", horario: "13:30", dias: SEMANA, capa: "terapia", figurinha: "🧩",
    passos: [
      { t: "Ir para a sala", d: "O adulto mostra qual é a sala de hoje.", arte: "casa" },
      { t: "Fazer a atividade", d: "Um combinado de cada vez.", arte: "terapia" },
      { t: "Guardar o material", d: "Cada coisa no lugar antes de sair.", arte: "brinq4" },
    ] },
  { id: "ir_casa", nome: "Hora de ir pra casa", momento: "clinica", horario: "17:00", dias: SEMANA, capa: "casa", figurinha: "🏠",
    passos: [
      { t: "Pegar a mochila", d: "Confira se está tudo dentro.", arte: "mochila" },
      { t: "Despedida", d: "Tchau para quem ficou.", arte: "casa" },
    ] },

  { id: "licao", nome: "Lição de casa", momento: "noite", horario: "18:30", dias: SEMANA, duracao: 20, capa: "licao", figurinha: "📓",
    passos: [
      { t: "Separar o material", d: "Caderno, lápis e o que a professora pediu.", arte: "licao" },
      { t: "Fazer a lição", d: "Uma questão por vez. Pode parar e voltar.", arte: "licao", tempo: 900 },
      { t: "Guardar na mochila", d: "Lição feita já volta para a mochila.", arte: "mochila" },
    ] },
  { id: "estudar", nome: "Estudar para a prova", momento: "noite", horario: "18:00", dias: SEMANA, prova: true, duracao: 40, capa: "estudar", figurinha: "📚",
    passos: [
      { t: "Abrir o material", d: "Só a matéria da prova, o resto fica fechado.", arte: "estudar" },
      { t: "Estudar um bloco", d: "Leia e diga em voz alta o que entendeu.", arte: "estudar", tempo: 900 },
      { t: "Pausa", d: "Levante, beba água, respire.", arte: "comer3", tempo: 300 },
      { t: "Mais um bloco", d: "Agora a parte que ficou difícil.", arte: "estudar", tempo: 900 },
    ] },
  { id: "manta", nome: "Manta", momento: "noite", horario: "19:30", dias: TODOS, duracao: 20, capa: "manta", figurinha: "🟪",
    passos: [{ t: "Sessão da manta", d: "Deite, ajeite a manta e fique quietinho até o tempo acabar.", arte: "manta", tempo: 1200 }] },
  { id: "bone", nome: "Boné", momento: "noite", horario: "19:55", dias: TODOS, duracao: 20, capa: "bone", figurinha: "🧢",
    passos: [{ t: "Sessão do boné", d: "Coloque o boné ajustado e espere o tempo passar.", arte: "bone", tempo: 1200 }] },
  { id: "ilib", nome: "ILIB", momento: "noite", horario: "20:20", dias: TODOS, duracao: 30, capa: "ilib", figurinha: "🔦",
    passos: [{ t: "Sessão de ILIB", d: "Braço apoiado e parado até o tempo terminar.", arte: "ilib", tempo: 1800 }] },
  { id: "placa", nome: "Colocar a placa", momento: "noite", horario: "20:50", dias: TODOS, capa: "placa", figurinha: "🦷",
    passos: [
      { t: "Lavar a placa", d: "Água corrente antes de colocar.", arte: "placa" },
      { t: "Encaixar a placa", d: "Morda devagar até encaixar sozinha.", arte: "placa" },
    ] },
  { id: "remedio_noite", nome: "Remédios da noite", momento: "noite", horario: "21:10", dias: TODOS, capa: "remedio", figurinha: "💊",
    passos: [{ t: "Tomar os remédios", d: "Confira com o adulto e beba água depois.", arte: "remedio" }] },
  { id: "separar_roupa", nome: "Separar a roupa de amanhã", momento: "noite", horario: "21:15", dias: SEMANA, capa: "roupa1", figurinha: "👖",
    passos: [
      { t: "Escolher a roupa", d: "Veja a previsão do tempo para amanhã.", arte: "roupa1" },
      { t: "Deixar separada", d: "Na cadeira, na ordem de vestir.", arte: "roupa1" },
    ] },

  { id: "pet", nome: "Passear com o pet", momento: "noite", horario: "17:45", dias: TODOS, duracao: 20, capa: "pet", figurinha: "🐕",
    passos: [
      { t: "Colocar a coleira", d: "Chame o pet com calma e prenda a guia.", arte: "pet" },
      { t: "Passear", d: "Segure a guia firme e volte no horário combinado.", arte: "pet" },
      { t: "Guardar a guia", d: "Coleira e guia no lugar de sempre.", arte: "pet" },
    ] },

  { id: "sapatos", nome: "Guardar os sapatos", momento: "fds", horario: "10:15", dias: FDS, capa: "sapatos", figurinha: "👟",
    passos: [
      { t: "Juntar os pares", d: "Cada sapato com o seu par.", arte: "roupa5" },
      { t: "Colocar na prateleira", d: "Lado a lado, com a ponta para fora.", arte: "sapatos" },
    ] },
  { id: "praia", nome: "Ir à praia", momento: "fds", horario: "16:00", dias: FDS, duracao: 30, capa: "praia", figurinha: "🏖️",
    passos: [
      { t: "Escolher o tempo de hoje", d: "Combine antes de sair de casa.", arte: "praia", opcoes: [900, 1800] },
      { t: "Voltar quando o tempo acabar", d: "O combinado vale, mesmo se estiver bom.", arte: "casa" },
    ] },
];
