
if (typeof gettext === 'undefined') {
    window.gettext = function(text) { return text; };
}
//Nesta funcao ao fazer o logout os filtros sao atualizados para o defaul para o proximo utilizador nao entrar com os filtros do outro
function fazerLogout(logoutUrl) {
    //Limpar localStorage
    localStorage.removeItem('modoDaltonismo');
    localStorage.removeItem('modoContraste');
    

    const wrapper = document.getElementById('content-wrapper');
    const target = wrapper || document.body; 
    target.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    target.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    
    console.log('✓ Filtros limpos. Redirecionando...');
    
    if (!logoutUrl) {
        logoutUrl = '/logout/';
    }
    
    //Redireciona
    setTimeout(() => {
        window.location.href = logoutUrl;
    }, 100);
}



//basicamente ao carregar no carregar  no botao do perfil os outros menus que estiverem abertos fecham -se para nao ficarem 2 ou 3 menus abertos ao mesmo tempo
function PerfilMenu() {
    const menu = document.getElementById('perfil-menu');
    if (menu) {

        //fecha os outros menus de acessibilidade quando menu abre
        document.getElementById('daltonismo-menu')?.classList.add('hidden');
        document.getElementById('contraste-menu')?.classList.add('hidden');
        console.log('PerfilMenu() called — menu before toggle:', menu.classList.contains('hidden'));
        menu.classList.toggle('hidden');
        console.log('PerfilMenu() after toggle — hidden:', menu.classList.contains('hidden'));
    }
}




//serve para detetar cliques se o clique for na area de algum botao ele cintinua aberto, se for fora da area onde esta o botao ele é fechado
window.addEventListener('click', function(e) {
    const daltMenu = document.getElementById('daltonismo-menu');
    const contMenu = document.getElementById('contraste-menu');
    const perfMenu = document.getElementById('perfil-menu');
    
    //se carregar dentro da area do perfil a dropbox nao fecha
    if (e.target.closest('.profile-area')) {
        return; 
    }

    //se carregarmos dentro de um menu na acessibilidade o menu nao fecha
    if (e.target.closest('.accessibility-pill') || e.target.closest('.accessibility-menu')) {
        return;
    }

    //.hidden é para fechar o menu se detetar um clique fora da area
    if (perfMenu) perfMenu.classList.add('hidden');
    if (daltMenu) daltMenu.classList.add('hidden');
    if (contMenu) contMenu.classList.add('hidden');
});




//igual ao perfil, para ver se ha menus abertos e fecha los antes de abrir o menu do datonismo ou do contraste
function toggleDaltonismoMenu() {
    document.getElementById('perfil-menu')?.classList.add('hidden');
    document.getElementById('contraste-menu')?.classList.add('hidden');
    const menu = document.getElementById('daltonismo-menu');
    menu.classList.toggle('hidden');
}

function toggleContrasteMenu() {
    document.getElementById('perfil-menu')?.classList.add('hidden');
    document.getElementById('daltonismo-menu')?.classList.add('hidden');
    const menu = document.getElementById('contraste-menu');
    menu.classList.toggle('hidden');
}





//comunica com o backend via AJAX
//no post manda para o servidor os dados, o tipo de filtro e depois o valor que escolheram
//o X-CRFSTOKEN e para o django aceitar a requisicao, serve para dar seguranca
function guardarFiltroNoServidor(tipo, valor) {
    console.log(`Guardar filtro: ${tipo} = ${valor}`);
    
    fetch('/atividades/api/atualizar-filtros/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            tipo: tipo,
            valor: valor
        })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Resposta do servidor:', data);
        if (data.status === 'sucesso') {
            console.log('✓ ' + data.mensagem);
        } else {
            console.error('✗ Erro ao guardar filtro:', data.mensagem);
        }
    })
    .catch(error => {
        console.error('✗ Erro na requisição:', error);
    });
}





//usada para obter o crftoken
function getCookie(name) {
    let input = document.querySelector(`input[name="${name}"]`);
    if (input && input.value) {
        return input.value;
    }
    
    if (name === 'csrftoken') {
        input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (input && input.value) {
            return input.value;
        }
    }
    
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


//aplica as mudancas do visual em tempo real
//depois de carregar no filtro de datonismo ou contraste, vai ser verificado se ta com sessao iniciada, se tiver o filtro e guardado na bd, senao e guardado na localstorage
function setDaltonismo(tipo) {
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    
    if (tipo !== 'normal') {
        document.body.classList.add(tipo);
    }
    
    //Aqui vai guardar na Base de Dados ou na LocalStorage
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    if (isAuthenticated) {
        guardarFiltroNoServidor('daltonismo', tipo);
    } else {
        localStorage.setItem('modoDaltonismo', tipo);
    }
    
    document.getElementById('daltonismo-menu').classList.add('hidden');
}

function setContraste(tipo) {
    document.body.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    
    if (tipo !== 'normal') {
        document.body.classList.add(tipo);
    }

    const isAuthenticated = document.body.dataset.authenticated === 'true';
    if (isAuthenticated) {
        guardarFiltroNoServidor('contraste', tipo);
    } else {
        localStorage.setItem('modoContraste', tipo);
    }
    
  
    document.getElementById('contraste-menu').classList.add('hidden');
}


//aqui vamos ver se o utilizador ta autenticado, se tiver as preferencias dele sao aplicadas, senao vai a localstorage ver
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = document.body.dataset.authenticated === 'true';

    if (isAuthenticated) {
        //limpa a localstorage
        localStorage.removeItem('modoDaltonismo');
        localStorage.removeItem('modoContraste');
    } else {
        //se nao tiver login vai a localstorage buscar o filtro
        const daltSalvo = localStorage.getItem('modoDaltonismo');
        if (daltSalvo && daltSalvo !== 'normal') {
            document.body.classList.add(daltSalvo);
        }

        const contSalvo = localStorage.getItem('modoContraste');
        if (contSalvo && contSalvo !== 'normal') {
            document.body.classList.add(contSalvo);
        }
    }


    // Lógica do Avatar
    const avatarBtn = document.getElementById('btn-avatar-trigger');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            PerfilMenu();
        });
    }
});
//instrucoes que aparecem quando o utilizador precisa de ver os passos para o ajudar me caso de emergencia
const guias = {
            phishing: {
                titulo: gettext("Cliquei num link ou descarreguei algo:"),
                passos: [
                    gettext("Desliga a Internet (Wi-Fi ou Dados) imediatamente."),
                    gettext("Não introduzas mais nenhuma palavra-passe nesse dispositivo."),
                    gettext("Corre um antivírus completo para verificar se há malware."),
                    gettext("Se meteste dados num site, muda a password original noutro dispositivo seguro.")
                ]
            },
            password: {
                titulo: gettext("Perdi o acesso ou detetei login estranho:"),
                passos: [
                    gettext("Tenta fazer 'Reset Password' imediatamente."),
                    gettext("Usa a opção 'Terminar sessão em todos os dispositivos'."),
                    gettext("Ativa a Autenticação de Dois Fatores (2FA)."),
                    gettext("Verifica se o teu email de recuperação foi alterado.")
                ]
            },
            banco: {
                titulo: gettext("Exposição de Cartão ou MBWay:"),
                passos: [
                    gettext("Liga para a linha de cancelamento do teu banco (disponível 24h)."),
                    gettext("Bloqueia o cartão temporariamente através da App do banco."),
                    gettext("Verifica o extrato por movimentos que não reconheças."),
                    gettext("Faz queixa na polícia se houver roubo de dinheiro efetivo.")
                ]
            },
            mfa: {
            titulo: gettext("Como configurar a Autenticação de Dois Fatores (MFA):"),
            passos: [
                gettext("Instala uma App de autenticação (ex: Google Authenticator ou Bitwarden)."),
                gettext("Acede às definições de segurança da tua conta (E-mail, Redes Sociais)."),
                gettext("Escolhe 'Autenticação de 2 Passos' e faz scan do código QR fornecido."),
                gettext("Guarda os códigos de recuperação num local físico seguro (fora do PC).")
            ]
            },
            gestor: {
                titulo: gettext("Configurar um Gestor de Passwords:"),
                passos: [
                    gettext("Escolhe um gestor fiável (ex: Bitwarden, 1Password ou Keepass)."),
                    gettext("Cria uma 'Master Password' longa e memorizável."),
                    gettext("Importa ou guarda as tuas passwords atuais no cofre cifrado."),
                    gettext("Ativa a extensão do navegador para preenchimento automático seguro.")
                ]
            },
            updates: {
                titulo: gettext("Manter o Sistema Protegido:"),
                passos: [
                    gettext("Ativa as 'Atualizações Automáticas' no Windows ou macOS."),
                    gettext("Verifica regularmente as atualizações na App Store ou Play Store."),
                    gettext("Reinicia o dispositivo após grandes atualizações para aplicar os patches."),
                    gettext("Remove programas que já não usas e que podem ter falhas de segurança.")
                ]
            },
            phishing_vazio: {
                titulo: "🔒" + gettext("Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")
                ]
            },

            password_vazio: {
                titulo: "🔒" + gettext("Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")

                ]
            },

            banco_vazio: {
                titulo: "🔒" + gettext("Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")
                ]
            }
            };
//para conseguir traduzir as instruçoes tenho que usar o gettext para o django identificar as str e mete las no ficheiro .po de traducoes
//o ficheiro de msg de traducao para o js é o makemessages -d django -l en
//o phishing, password e banco _vazio e para quando o utilizador esta sem login, quando tenta ver os passos tem de fazer login para os ver
function switchMode(modo) {
    const secEmergencia = document.getElementById('section-emergencia');
    const secMitigacao = document.getElementById('section-mitigacao');
    const btnEmergencia = document.getElementById('btn-emergencia');
    const btnMitigacao = document.getElementById('btn-mitigacao');
    const instrucoesTexto = document.getElementById('guia-instrucoes');
    const painelPassos = document.getElementById('painel-passos');

    if (modo === 'emergencia') {
        secEmergencia.classList.remove('hidden');
        secMitigacao.classList.add('hidden');
        btnEmergencia.classList.add('active');
        btnMitigacao.classList.remove('active');
        instrucoesTexto.innerText = gettext("Escolhe o incidente que aconteceu para saberes o que fazer agora:");
    } else {
        secEmergencia.classList.add('hidden');
        secMitigacao.classList.remove('hidden');
        btnEmergencia.classList.remove('active');
        btnMitigacao.classList.add('active');
        instrucoesTexto.innerText = gettext("Segue estes conselhos para reforçar a tua segurança preventiva:");
        
        // Verifica se o painel existe antes de tentar esconder
        if (painelPassos) {
            painelPassos.style.display = 'none';
        }
    }
}
function mostrarInstrucoes(tipo) {

            const painel = document.getElementById('painel-passos');
            const lista = document.getElementById('lista-passos');
            const titulo = document.getElementById('titulo-incidente');
            
            titulo.innerText = guias[tipo].titulo;
            lista.innerHTML = guias[tipo].passos.map(p => `<div class="step-item">${p}</div>`).join('');

            // quando o utilizador ta sem login e tenta ver os passos
            if (tipo === 'phishing_vazio' || tipo === 'password_vazio' || tipo === 'banco_vazio') {
            const loginBtn = document.createElement('a');
            loginBtn.href = "/login/";
            loginBtn.className = "btn-cta";
            loginBtn.style.marginTop = "20px";
            loginBtn.style.display = "inline-block";
            loginBtn.innerText = "Fazer Login Agora";
            lista.appendChild(loginBtn);
            
            
            }
            painel.style.display = 'block';
            window.scrollTo({ top: painel.offsetTop - 50, behavior: 'smooth' });
        }

//para fechar o popup no quiz final meti para redirecionar para a propria pagina e deu erro porque dava refresh e o quiz indice nao existe e manda para a home2
//acho que fica melhor fechar o popup e ficar na pagina do fim do que ir po home
function fecharpopup()
{
    document.querySelector('.overlay').style.display = 'none';
}


function mostrar_email(){
    
}


const baseConhecimento = {
    'phishing': {
        titulo: gettext("Phishing e Engenharia Social"),
        icon: '📩',
        texto: gettext("O Phishing é a espinha dorsal da maioria dos ataques cibernéticos modernos. Trata-se de uma técnica de manipulação que utiliza comunicações fraudulentas (e-mail, SMS, voz, redes sociais) para enganar utilizadores e obter dados sensíveis, como credenciais de acesso e números de cartões de crédito, ou para instalar malware silenciosamente.<br><br><b>A Psicologia da Engenharia Social:</b> Ao contrário de ataques técnicos que tentam forçar a entrada via software, a Engenharia Social foca na 'vulnerabilidade humana'. Os atacantes exploram emoções primárias:<ul><li><b>Urgência e Medo:</b> 'A sua conta será encerrada em 2 horas se não confirmar os seus dados.'</li><li><b>Curiosidade e Ganância:</b> 'Ganhaste o sorteio anual do supermercado X, clica aqui para reclamar.'</li><li><b>Autoridade:</b> Fingem ser o CEO da empresa, o banco ou a Autoridade Tributária a exigir um pagamento imediato.</li></ul><br><b>Variantes Avançadas:</b><ul><li><b>Smishing (SMS Phishing):</b> Mensagens rápidas, muitas vezes inseridas no mesmo fio de mensagens (histórico) de bancos reais ou transportadoras (ex: CTT, DHL), contendo links para sites clones perfeitos.</li><li><b>Vishing (Voice Phishing) e Deepfakes:</b> Chamadas telefónicas onde o burlão utiliza 'Spoofing' (falsificação do número de origem). Atualmente, usam IA para clonar a voz de familiares ou chefes, pedindo transferências urgentes.</li><li><b>Spear Phishing:</b> Um ataque cirúrgico e altamente personalizado. O atacante estuda as tuas redes sociais (OSINT) e sabe o teu nome, onde trabalhas e quem são os teus amigos para criar uma armadilha impossível de ignorar.</li><li><b>Whaling:</b> Foca-se em 'peixes grandes' (CEOs e executivos), frequentemente através de esquemas de 'Business Email Compromise' (BEC), induzindo desvios de fundos de alto valor.</li></ul><br><b>Sinais Vermelhos (Red Flags):</b> Saudações impessoais ('Caro Cliente'), erros gramaticais (embora a IA os esteja a eliminar), anexos inesperados (.zip ou .exe) e <b>Typosquatting</b> (domínios ligeiramente alterados, ex: @rnicrosoft.com com 'r' e 'n' em vez de 'm').<br><br><b>Controlo de Danos:</b> Se clicares num link suspeito, desliga imediatamente a internet do dispositivo, corre um antivírus e altera as tuas senhas a partir de <i>outro</i> aparelho seguro."),
        dica: gettext("Sempre que receberes uma mensagem urgente, aplica a regra dos 5 segundos. Respira, não cliques. Contacta a entidade pelo número oficial que tens no teu cartão físico ou digitando o endereço manualmente no browser.")
    },

    'senhas': {
        titulo: gettext("Gestão de Identidade e Senhas"),
        icon: '🔑',
        texto: gettext("As palavras-passe são as chaves da tua casa digital, mas na era da computação de alta performance, senhas curtas ou previsíveis são vulnerabilidades críticas. Hoje, um computador com boas placas gráficas consegue testar mil milhões de combinações por segundo.<br><br><b>Os Tipos de Ataque mais Comuns:</b><ul><li><b>Brute Force (Força Bruta):</b> Tentar todas as combinações possíveis do teclado até acertar.</li><li><b>Dictionary Attack:</b> Usar listas de palavras comuns, nomes, clubes de futebol e datas.</li><li><b>Credential Stuffing:</b> Se usares a mesma senha no site A e site B, e o site A for pirateado, os hackers testam automaticamente esse e-mail e senha no teu banco, redes sociais, etc.</li></ul><br><b>Critérios de uma Senha Invencível:</b><ul><li><b>Comprimento é Rei:</b> A matemática não mente. Uma senha de 8 caracteres complexos é quebrada em minutos; uma de 16 caracteres apenas com letras e números demora séculos. O ideal é ter +15 caracteres.</li><li><b>Unicidade Absoluta:</b> Nunca repitas senhas. Zero exceções.</li></ul><br><b>O Papel dos Gestores de Senhas (Vaults):</b> No mundo atual, é humanamente impossível memorizar 50 senhas únicas e fortes. Gestores como Bitwarden, 1Password ou Dashlane permitem guardar tudo num cofre cifrado (encriptação ponta-a-ponta). Tu só precisas de saber uma 'Master Password' extremamente forte. O gestor trata de gerar e preencher as restantes automaticamente, protegendo-te inclusive contra Keyloggers (malware que regista teclas).<br><br><b>O Futuro (Passkeys):</b> O mundo está a transitar para as Passkeys, que substituem as senhas tradicionais por chaves criptográficas geradas no teu telemóvel, validadas pela tua biometria, tornando o phishing de credenciais matematicamente impossível."),
        dica: gettext("Adota o método das 'Passphrases' para a tua Master Password: junta quatro palavras aleatórias com símbolos. Exemplo: 'Cadeira#Elefante%Pizza$Porto'. Verifica também o site 'Have I Been Pwned' para veres se o teu e-mail já esteve envolvido em fugas de dados.")
    },

    'mfa': {
        titulo: gettext("Autenticação Multi-Fator (MFA/2FA)"),
        icon: '📱',
        texto: gettext("A Autenticação Multi-Fator (MFA) é a diferença entre perderes uma conta ou bloqueares um hacker à porta. Ela parte do princípio que a senha (algo que sabes) já não é suficiente e que tens de provar quem és por um segundo canal independente.<br><br><b>As Três Categorias de Autenticação:</b><ol><li><b>Algo que sabes:</b> A tua password tradicional, um código PIN ou resposta secreta.</li><li><b>Algo que tens:</b> O teu telemóvel (recebe uma notificação), uma App de autenticação ou uma chave física (Smartcard/USB).</li><li><b>Algo que és (Biometria):</b> A tua impressão digital, reconhecimento facial (FaceID) ou padrão de voz.</li></ol><br><b>Hierarquia de Segurança do MFA:</b><ul><li><b>SMS e E-mail (Nível Base):</b> Melhor que nada, mas altamente vulnerável. E-mails podem ser intercetados e SMS sofrem de 'SIM Swapping' (onde o hacker suborna ou engana a operadora para clonar o teu número de telemóvel).</li><li><b>Apps de Autenticação (Ouro):</b> Google Authenticator, Authy ou Aegis. Geram códigos offline (TOTP) que mudam a cada 30 segundos. Não dependem da rede móvel e não podem ser clonados remotamente.</li><li><b>Chaves de Segurança Físicas (Platina):</b> YubiKey ou Google Titan. Requerem que insiras a pen e lhe toques fisicamente. São a única defesa 100% imune a ataques de phishing avançados.</li></ul><br><b>Fadiga de MFA (MFA Fatigue):</b> Uma tática onde o hacker, tendo a tua senha, envia dezenas de pedidos de 'Aprovar Login' para o teu telemóvel a meio da noite, esperando que tu cliques 'Sim' por engano ou cansaço. Se receberes um aviso de login que não pediste, clica sempre em 'Rejeitar' e muda a senha de imediato!"),
        dica: gettext("Guarda os 'Códigos de Backup' (Backup Codes) que os sites te dão quando ativas o MFA. Imprime-os e guarda-os numa gaveta segura. Se perderes o telemóvel amanhã, esses códigos são a única forma de voltares a entrar nas tuas contas.")
    },

    'privacidade': {
        titulo: gettext("Privacidade, Cookies e Pegada Digital"),
        icon: '📍',
        texto: gettext("A privacidade online não é sobre 'não ter nada a esconder', mas sim sobre ter o poder de decidir quem acede, lucra e te manipula com os teus dados. Cada clique, tempo de ecrã e movimento GPS contribui para a tua 'Pegada Digital', um rasto indelével.<br><br><b>A Indústria dos Data Brokers:</b> Existem empresas bilionárias cujo único propósito é recolher os teus dados dispersos (o que compras, a tua orientação política, problemas de saúde e histórico de localização), empacotá-los num perfil exato e vendê-los a quem pagar mais — desde anunciantes a companhias de seguros.<br><br><b>O Ecossistema de Rastreamento:</b><ul><li><b>Cookies de Terceiros (Tracking):</b> Ficheiros colocados no teu browser por redes de publicidade para te seguir entre o site A, B e C.</li><li><b>Browser Fingerprinting:</b> Uma técnica avançada que te identifica sem usar cookies, recolhendo detalhes técnicos da tua máquina (tamanho do ecrã, fontes instaladas, versão do sistema operativo), criando uma 'impressão digital' única do teu computador.</li></ul><br><b>O Perigo dos Metadados (EXIF):</b> Quando tiras uma foto e a envias diretamente do rolo da câmara, ela contém dados ocultos: modelo do telemóvel, hora exata e as coordenadas GPS exatas. Partilhar uma foto da tua nova TV pode dar a localização da tua casa a estranhos.<br><br><b>Permissões de Apps (O Cavalo de Troia moderno):</b> Se uma simples app de lanterna ou uma calculadora pedir acesso ao teu microfone, lista de contactos e localização, recusa! Se o produto é gratuito, o produto real são os teus dados."),
        dica: gettext("Faz auditorias regulares às tuas redes sociais: coloca os perfis em modo privado e limita quem pode ver o teu histórico. Usa extensões como o 'uBlock Origin' para travar rastreadores e nunca faças login em sites através de botões 'Entrar com o Facebook/Google' a menos que confies plenamente neles.")
    },

    'malware': {
        titulo: gettext("Malware: Ameaças e Software Malicioso"),
        icon: '🦠',
        texto: gettext("Malware (Malicious Software) é o termo que abrange qualquer código criado para danificar, bloquear, roubar ou espiar sistemas informáticos. O que outrora era feito por hackers por 'diversão', é hoje uma indústria criminosa altamente organizada.<br><br><b>O Arsenal do Cibercrime:</b><ul><li><b>Ransomware (Sequestro de Dados):</b> A ameaça mais letal para empresas e particulares. Encripta todos os teus ficheiros (fotos, documentos, discos rígidos) e exige um pagamento em criptomoedas. Ficas impedido de aceder à tua própria vida digital.</li><li><b>Spyware e Keyloggers:</b> Instalam-se em silêncio e gravam tudo o que digitas (senhas, conversas), tiram capturas de ecrã e podem até ativar a tua webcam sem ligar a luz indicadora.</li><li><b>Trojans (Cavalos de Troia):</b> Disfarçam-se de software legítimo (ex: um jogo pirata, um leitor de PDF grátis ou um anexo de fatura). Ao abrires, eles abrem uma 'Backdoor' (porta das traseiras) para o hacker controlar o teu PC.</li><li><b>Botnets:</b> Malware que transforma o teu dispositivo num 'zombie' dormente. O teu telemóvel ou PC passa a fazer parte de um exército global usado para atacar sistemas governamentais ou enviar spam, gastando a tua rede e bateria.</li><li><b>Fileless Malware:</b> Malware altamente avançado que não guarda ficheiros no disco. Vive inteiramente na memória RAM do computador e aproveita ferramentas legítimas do Windows (como o PowerShell) para atacar, tornando-se quase invisível para antivírus comuns.</li></ul><br><b>Sinais de Infeção:</b> O computador fica subitamente lento, ventoinhas a disparar sem estares a fazer nada (sinal de mineração de criptomoedas oculta), bateria que dura muito pouco, pop-ups constantes ou a página inicial do browser que mudou sozinha."),
        dica: gettext("A prevenção é tudo. Mantém o teu sistema operativo (Windows, macOS, Android, iOS) sempre atualizado na última versão. As atualizações não trazem apenas designs novos, elas fecham as falhas de código que os hackers usam para injetar malware.")
    },

    'redes': {
        titulo: gettext("Segurança de Redes, VPN e Criptografia"),
        icon: '🌐',
        texto: gettext("A Internet é uma autoestrada pública. Sem proteção, os teus dados (senhas, e-mails, conversas) viajam em 'texto limpo', podendo ser lidos por qualquer pessoa que esteja na mesma rede. A segurança de redes visa criar túneis blindados para a tua informação.<br><br><b>Criptografia e Protocolos:</b><ul><li><b>HTTPS e SSL/TLS:</b> Quando vês o cadeado no browser, significa que a comunicação entre o teu PC e o servidor está encriptada. Se um site pedir senha e apresentar apenas HTTP (sem o S de Seguro), foge!</li><li><b>Cifra Ponta-a-Ponta (E2EE):</b> Usada no Signal ou WhatsApp. As mensagens são trancadas no teu telemóvel e só são destrancadas no telemóvel de quem recebe. Nem sequer os donos da app conseguem ler o conteúdo.</li></ul><br><b>O Perigo das Redes Wi-Fi Públicas (Evil Twins):</b> Ligar-se ao 'Wi-Fi Grátis do Aeroporto' é um risco massivo. Atacantes criam redes falsas com o mesmo nome (Evil Twin) para que o teu telemóvel se ligue a eles. A partir daí, executam ataques 'Man-in-the-Middle', intercetando e roubando tudo o que procuras na net.<br><br><b>O Escudo da VPN (Virtual Private Network):</b> Uma VPN de confiança cria um túnel encriptado e reencaminha o teu tráfego por um servidor seguro. Isto impede que a rede local (ou o dono do café) veja o que estás a fazer e esconde o teu IP real, dando-te maior anonimato geográfico.<br><br><b>A Tua Rede Doméstica:</b> O teu Router é a principal porta de entrada da tua casa. Se usas os dados de origem ('admin' e 'password'), a tua rede está comprometida. Altera a senha do painel de controlo, desativa protocolos velhos e usa sempre encriptação WPA2 ou WPA3 para a rede Wi-Fi."),
        dica: gettext("Desativa a funcionalidade do teu telemóvel de se ligar automaticamente a redes Wi-Fi conhecidas. Além disso, se precisares de aceder ao banco na rua, é muito mais seguro usar os teus Dados Móveis (4G/5G) do que a rede Wi-Fi de um restaurante.")
    },

    'dispositivos': {
        titulo: gettext("Proteção de Dispositivos e Higiene Digital"),
        icon: '💻',
        texto: gettext("De nada valem senhas complexas se o teu dispositivo físico for roubado ou comprometido. A segurança começa no hardware e nas práticas de manutenção dos aparelhos.<br><br><b>Criptografia de Disco Inteiro (FDE):</b> É a defesa física definitiva. No Windows chama-se 'BitLocker' e no Mac 'FileVault'. Ao ser ativada, codifica todo o teu disco rígido. Se alguém te roubar o portátil e tentar tirar o disco para ler noutro computador, só verá lixo digital sem a tua palavra-passe.<br><br><b>A Regra de Ouro dos Backups (Estratégia 3-2-1):</b> Contra perdas, roubos e ataques de Ransomware, deves implementar esta estratégia militar:<ul><li><b>3</b> Cópias dos teus dados importantes (a original + 2 cópias de segurança).</li><li><b>2</b> Tipos de suporte diferentes (ex: Num Disco Externo SSD e numa Cloud/Nuvem).</li><li><b>1</b> Cópia 'Offsite' (fora de casa). Pode ser a nuvem, ou um disco guardado em casa de um familiar. Se houver um incêndio na tua casa, não perdes os originais e os backups locais ao mesmo tempo.</li></ul><br><b>IoT (A Internet das Coisas):</b> Lâmpadas, frigoríficos, TVs inteligentes e aspiradores-robô. Estes aparelhos raramente recebem atualizações de segurança das marcas e ligam-se ao teu Wi-Fi, tornando-se o elo mais fraco e uma porta de entrada fácil para invadir os teus computadores domésticos.<br><br><b>Higiene Digital e Limpeza:</b><ul><li>Apaga apps que não usas há mais de 6 meses. O seu código desatualizado pode ser explorado.</li><li>Antes de venderes um PC ou telemóvel antigo, faz um 'Wipe' (limpeza segura com reposição de fábrica). Apenas apagar ficheiros e esvaziar a reciclagem não os elimina permanentemente.</li></ul>"),
        dica: gettext("Tapa a tua webcam com um autocolante ou protetor deslizante. Bloqueia o ecrã instantaneamente quando te levantas numa biblioteca ou escritório (Usa o atalho Win + L no Windows, ou Ctrl + Cmd + Q no Mac). O tempo que vais beber água é suficiente para instalarem algo malicioso na tua máquina.")
    }
};

function mostrarTema(idTema) {
    const info = baseConhecimento[idTema];
    const container = document.getElementById('conteudo-dinamico');

    if (info) {
        container.innerHTML = `
            <div style="animation: popIn 0.3s ease-out;">
                <article class="doc-card tema-conteudo">
                    <div class="card-icon" style="margin-bottom: 15px;">${info.icon}</div>
                    <h2 style="font-size: 2rem; margin-bottom: 20px;">${info.titulo}</h2>
                    <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.6;">
                        ${info.texto}
                    </p>
                    <div class="dica-box" style="margin-top: 30px;">
                        <strong>💡 Dica:</strong> ${info.dica}
                    </div>
                </article>
            </div>
        `;
        

        const todosLinks = document.querySelectorAll('.doc-sidebar a');
        todosLinks.forEach(link => {
            link.style.color = 'var(--verde-escuro)';
            link.style.transform = 'translateX(0)';
            link.style.fontWeight = '600';
        });


        const linkAtivo = document.querySelector(`.doc-sidebar a[onclick="mostrarTema('${idTema}')"]`);
        if(linkAtivo) {
            linkAtivo.style.color = 'var(--verde-principal)';
            linkAtivo.style.transform = 'translateX(5px)';
            linkAtivo.style.fontWeight = '900';
        }
       
     
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('conteudo-dinamico');

    if (container) {
        const hash = window.location.hash.replace('#', '');
        if (hash && baseConhecimento[hash]) {
            mostrarTema(hash);
        } else {
            mostrarTema('phishing'); 
        }
    }
});



function focarNoHeader(tipo) {
    const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true';
    window.scrollTo({ top: 0, behavior: 'smooth' });


    const botoesNav = document.querySelectorAll('.header-nav .btn-dashboard');
    const botaoEmergencia = document.querySelector('.btn-emergencia-dashboard');
    const btnEntrarHome = document.getElementById('btn-entrar-topo');
    let alvo = [];  

    if (!isAuthenticated) {
        if (btnEntrarHome) alvo.push(btnEntrarHome);
        
    }
    else
        {

        if (tipo === 'quiz' && botoesNav[1]) alvo.push(botoesNav[1]);
        if (tipo === 'simulador' && botoesNav[2]) alvo.push(botoesNav[2]);
        if (tipo === 'aprender' && botaoEmergencia) alvo.push(botaoEmergencia);
        
        }

    if (alvo.length > 0) {

        const todos = [...botoesNav, botaoEmergencia, btnEntrarHome,].filter(el => el);
        todos.forEach(el => el.classList.remove('piscar-alerta'));
        
     
        setTimeout(() => {
            alvo.forEach(el => {
                el.classList.add('piscar-alerta');
                
                setTimeout(() => {
                    el.classList.remove('piscar-alerta');
                }, 5000);
            });
        }, 400);
    }
}


function goToStep(step) {
   
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3')
    ];

    
    steps.forEach((s, index) => {
        if (s) {
            if (index + 1 === step) {
                s.classList.remove('hidden');
            } else {
                s.classList.add('hidden');
            }
        }
    });

    
    updateStepper(step);
}

function updateStepper(step) {
   
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('dot' + i);
        const line = document.getElementById('line' + i);
        
        if (dot) {
            if (i <= step) dot.classList.add('active');
            else dot.classList.remove('active');
        }
        
        if (line) {
            if (i < step) line.classList.add('active');
            else line.classList.remove('active');
        }
    }
}

function fecharpopup()
{
            var introOverlay = document.getElementById('intro-overlay');
            if (introOverlay) 
                {
                introOverlay.style.opacity = '0';
                setTimeout(function() {
                    introOverlay.style.display = 'none';
                }, 300); 
            }
}

setTimeout(function() {
            let toasts = document.querySelectorAll('.toast-message');
            toasts.forEach(function(toast) {
                toast.style.animation = 'slideOutRight 0.4s ease forwards';
                setTimeout(() => toast.remove(), 400); 
            });
        }, 4000);


 function abrirModalAvatar() {
    const modal = document.getElementById('modal-avatar');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function fecharModalAvatar() {
    const modal = document.getElementById('modal-avatar');
    if (modal) {
        modal.classList.add('hidden');

        document.getElementById('form-avatar').reset(); 
        document.getElementById('nome-ficheiro').innerText = '';
    }
}

function mostrarNomeFicheiro() {
    const input = document.getElementById('avatar-upload');
    const nomeFicheiro = document.getElementById('nome-ficheiro');
    
    if (input.files && input.files[0]) {
        nomeFicheiro.innerText = "✓ Ficheiro: " + input.files[0].name;
        
        // Se escolheu uma foto própria, desmarca qualquer avatar padrão que estivesse selecionado
        document.querySelectorAll('input[name="avatar_padrao"]').forEach(radio => {
            radio.checked = false;
        });
    }
}

// Limpa o ficheiro carregado caso o utilizador mude de ideias e clique num avatar padrão
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="avatar_padrao"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('avatar-upload').value = ''; 
            document.getElementById('nome-ficheiro').innerText = '';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const zonas = document.querySelectorAll('.phish-zone');
    if (zonas.length === 0) return;

    // Conta quantas armadilhas REAIS existem no email
    const totalPistas = Array.from(zonas).filter(zona => zona.getAttribute('data-is-phishing') === 'true').length;
    let selecionadas = 0;
    
    const elTotal = document.getElementById('total-pistas');
    const elContador = document.getElementById('contador-pistas');
    const formResultado = document.getElementById('form-resultado');
    const inputAcertos = document.getElementById('input-acertos');

    if(elTotal) elTotal.innerText = totalPistas;

    // Se for um E-mail Seguro, mostra logo o botão de avançar
    if (totalPistas === 0) {
        if(elContador) elContador.innerHTML = "E-mail Seguro (0 Ameaças)";
        if(formResultado) formResultado.classList.remove('hidden');
        return; 
    }

    zonas.forEach(zona => {
        zona.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            // Marca ou desmarca a zona 
            this.classList.toggle('selecionada');
            
            // Conta quantas zonas o utilizador marcou
            selecionadas = document.querySelectorAll('.phish-zone.selecionada').length;
            if(elContador) elContador.innerHTML = `${selecionadas} / <span class="total">${totalPistas}</span>`;

            if (selecionadas === totalPistas) {
                let acertos = 0;
                
    
                document.querySelectorAll('.phish-zone.selecionada').forEach(sel => {
                    if (sel.getAttribute('data-is-phishing') === 'true') {
                        acertos++; 
                    }
                });
      
                // Guarda a nota no input escondido e mostra o botão do formulário
                if(inputAcertos) inputAcertos.value = acertos;
                if(formResultado) formResultado.classList.remove('hidden');
            } else {
                if(formResultado) formResultado.classList.add('hidden');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const btnDica = document.getElementById('btn-dica');
    const caixaDica = document.getElementById('caixa-dica');
    const badgeDicas = document.getElementById('badge-dicas');

    if (btnDica && caixaDica) {
        const questaoAtual = parseInt(btnDica.getAttribute('data-questao'));
        
        const isNovoQuiz = document.getElementById('intro-overlay') !== null;
        
        if (questaoAtual === 1 && isNovoQuiz) {
            sessionStorage.setItem('dicasQuiz', '2');
        }

        let dicasRestantes = parseInt(sessionStorage.getItem('dicasQuiz') || '2');
        
        if (badgeDicas) {
            badgeDicas.innerText = dicasRestantes;
        }
        
        // Se já não houver dicas ao carregar a página, fica logo cinzento
        if (dicasRestantes === 0) {
            btnDica.style.filter = 'grayscale(100%)';
            btnDica.style.opacity = '0.6';
            btnDica.style.cursor = 'not-allowed';
        }

        let dicaDesbloqueadaNestaPergunta = false;

        btnDica.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            const estaEscondida = window.getComputedStyle(caixaDica).display === 'none';

            if (estaEscondida) {
                if (!dicaDesbloqueadaNestaPergunta) {
                    if (dicasRestantes > 0) {
                        dicasRestantes--;
                        sessionStorage.setItem('dicasQuiz', dicasRestantes.toString()); 
                        if(badgeDicas) badgeDicas.innerText = dicasRestantes;
                        dicaDesbloqueadaNestaPergunta = true; 
                    } else {
                
                        return; 
                    }
                }
                
                // Mostrar a caixa da dica
                caixaDica.style.display = 'block';
                btnDica.style.transform = 'scale(1.2) rotate(10deg)';
                
                // Manter cinzento se gastou a última agora, senão fica brilhante
                if (dicasRestantes === 0) {
                    btnDica.style.filter = 'grayscale(100%)';
                    btnDica.style.cursor = 'not-allowed';
                } else {
                    btnDica.style.filter = 'drop-shadow(0 0 10px #fbbf24)';
                }

            } else {
                caixaDica.style.display = 'none';
                btnDica.style.transform = 'scale(1)';
                
                // Se ainda tiver dicas, tira os filtros. Se não, volta a cinzento
                if (dicasRestantes > 0) {
                    btnDica.style.filter = 'none';
                } else {
                    btnDica.style.filter = 'grayscale(100%)';
                }
            }
        });
    }
});


function toggleTemas(mostrar) {
            const areaTemas = document.getElementById('area-temas');
            if (mostrar) {
                areaTemas.classList.remove('hidden');
            } else {
                areaTemas.classList.add('hidden');
                // Desmarca todas as checkboxs se voltar ao Aleatório
                document.querySelectorAll('input[name="temas"]').forEach(cb => cb.checked = false);
            }
        }



function mudarnemails(delta) {
        const input = document.getElementById('num_emails');
        let value = parseInt(input.value) + delta;
        if (value >= 1 && value <= 15) {
            input.value = value;
        }
    }