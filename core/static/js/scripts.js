
if (typeof gettext === 'undefined') {
    window.gettext = function (text) { return text; };
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

    console.log('✓ Filtros limpos. A redirecionar...');

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
window.addEventListener('click', function (e) {
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
        avatarBtn.addEventListener('click', function (e) {
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
    document.getElementById('painel-passos').style.display = 'block';

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
function fecharpopup() {
    document.querySelector('.overlay').style.display = 'none';
}


function mostrar_email() {

}



const baseConhecimento = {
    'phishing': {
        titulo: gettext("Phishing e Engenharia Social"),
        icon: '📩',
        texto: gettext("O Phishing é a espinha dorsal da maioria dos ataques cibernéticos modernos. Trata-se de uma técnica de manipulação que utiliza comunicações fraudulentas (e-mail, SMS, voz, redes sociais) para enganar utilizadores e obter dados sensíveis, como credenciais de acesso e números de cartões de crédito, ou para instalar malware silenciosamente.<br><br><b>A Psicologia da Engenharia Social:</b> Ao contrário de ataques técnicos que tentam forçar a entrada via software, a Engenharia Social foca na 'vulnerabilidade humana'. Os atacantes exploram emoções primárias:<ul><li><b>Urgência e Medo:</b> 'A sua conta será encerrada em 2 horas se não confirmar os seus dados.'</li><li><b>Curiosidade e Ganância:</b> 'Ganhaste o sorteio anual do supermercado X, clica aqui para reclamar.'</li><li><b>Autoridade:</b> Fingem ser o CEO da empresa, o banco ou a Autoridade Tributária a exigir um pagamento imediato.</li></ul><br><b>Variantes Avançadas:</b><ul><li><b>Smishing (SMS Phishing):</b> Mensagens rápidas, muitas vezes inseridas no mesmo fio de mensagens (histórico) de bancos reais ou transportadoras (ex: CTT, DHL), contendo links para sites clones perfeitos.</li><li><b>Vishing (Voice Phishing) e Deepfakes:</b> Chamadas telefónicas onde o burlão utiliza 'Spoofing' (falsificação do número de origem). Atualmente, usam IA para clonar a voz de familiares ou chefes, pedindo transferências urgentes.</li><li><b>Spear Phishing:</b> Um ataque cirúrgico e altamente personalizado. O atacante estuda as tuas redes sociais (OSINT) e sabe o teu nome, onde trabalhas e quem são os teus amigos para criar uma armadilha impossível de ignorar.</li><li><b>Whaling:</b> Foca-se em 'peixes grandes' (CEOs e executivos), frequentemente através de esquemas de 'Business Email Compromise' (BEC), induzindo desvios de fundos de alto valor.</li></ul><br><b>Sinais Vermelhos (Red Flags):</b> Saudações impessoais ('Caro Cliente'), erros gramaticais (embora a IA os esteja a eliminar), anexos inesperados (.zip ou .exe) e <b>Typosquatting</b> (domínios ligeiramente alterados, ex: @rnicrosoft.com com 'r' e 'n' em vez de 'm').<br><br><b>Controlo de Danos:</b> Se clicares num link suspeito, desliga imediatamente a internet do dispositivo, corre um antivírus e altera as tuas senhas a partir de <i>outro</i> aparelho seguro.") + `
            <div class="ataque-anatomy">
                <h4 style="color:var(--verde-escuro); margin-bottom:10px;">🔍 Anatomia de um E-mail Falso</h4>
                <div class="email-fake-card">
                    <div class="email-line"><b>De:</b> seguranca<span class="termo-glossario" data-tooltip="${gettext("Repara no 'rn' em vez de 'm'. Isto chama-se Typosquatting!")}">@rnicrosoft.com</span></div>
                    <div class="email-line"><b>Assunto:</b> <span class="termo-glossario" data-tooltip="${gettext("Os atacantes usam o medo para te fazer agir sem pensar.")}">${gettext("URGENTE: Conta Bloqueada!")}</span></div>
                    <div class="email-body">
                        ${gettext("Caro utilizador, detetámos algo estranho.")} <br>
                        ${gettext("Clique no botão abaixo para evitar a perda de dados.")} <br><br>
                        <center><button class="btn-fake" title="${gettext("Link real: http://hack-site.ru/roubo")}">LOGIN SEGURO</button></center>
                    </div>
                </div>
            </div>
        `,
        dica: gettext("Sempre que receberes uma mensagem urgente, aplica a regra dos 5 segundos. Respira, não cliques. Contacta a entidade pelo número oficial que tens no teu cartão físico ou digitando o endereço manualmente no browser.")
    },

    'senhas': {
        titulo: gettext("Gestão de Identidade e Senhas"),
        icon: '🔑',
        texto: gettext("As palavras-passe são as chaves da tua casa digital, mas na era da computação de alta performance, senhas curtas ou previsíveis são vulnerabilidades críticas. Hoje, um computador com boas placas gráficas consegue testar mil milhões de combinações por segundo.<br><br><b>Os Tipos de Ataque mais Comuns:</b><ul><li><b>Brute Force (Força Bruta):</b> Tentar todas as combinações possíveis do teclado até acertar.</li><li><b>Dictionary Attack:</b> Usar listas de palavras comuns, nomes, clubes de futebol e datas.</li><li><b>Credential Stuffing:</b> Se usares a mesma senha no site A e site B, e o site A for pirateado, os hackers testam automaticamente esse e-mail e senha no teu banco, redes sociais, etc.</li></ul><br><b>Critérios de uma Senha Invencível:</b><ul><li><b>Comprimento é Rei:</b> A matemática não mente. Uma senha de 8 caracteres complexos é quebrada em minutos; uma de 16 caracteres apenas com letras e números demora séculos. O ideal é ter +15 caracteres.</li><li><b>Unicidade Absoluta:</b> Nunca repitas senhas. Zero exceções.</li></ul><br><b>O Papel dos Gestores de Senhas (Vaults):</b> No mundo atual, é humanamente impossível memorizar 50 senhas únicas e fortes. Gestores como Bitwarden, 1Password ou Dashlane permitem guardar tudo num cofre cifrado (encriptação ponta-a-ponta). Tu só precisas de saber uma 'Master Password' extremamente forte. O gestor trata de gerar e preencher as restantes automaticamente, protegendo-te inclusive contra Keyloggers (malware que regista teclas).<br><br><b>O Futuro (Passkeys):</b> O mundo está a transitar para as Passkeys, que substituem as senhas tradicionais por chaves criptográficas geradas no teu telemóvel, validadas pela tua biometria, tornando o phishing de credenciais matematicamente impossível.") + `
            <div class="password-tester-box">
                <h4 style="margin-top:0;">🛠️ ${gettext("Testador de Força (Simulação)")}</h4>
                <input type="password" id="pass-test" placeholder="${gettext("Digita uma senha...")}" oninput="testarpass()" 
                       style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin:10px 0;">
                <div class="forca-barra-bg" style="height:8px; background:#ddd; border-radius:10px; overflow:hidden;">
                    <div id="forca-barra-fill" style="height:100%; width:0%; background:#ef4444; transition:0.3s;"></div>
                </div>
                <p id="pass-feedback" style="font-size:0.9rem; font-weight:bold; margin-top:5px; color:#666;">${gettext("Digita para ver a resistência.")}</p>
            </div>
        `,
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
        texto: gettext("Malware (Malicious Software) é o termo que abrange qualquer código criado para danificar, bloquear, roubar ou espiar sistemas informáticos. O que outrora era feito por hackers por 'diversão', é hoje uma indústria criminosa altamente organizada.<br><br><b>O Arsenal do Cibercrime:</b><ul><li><b>Ransomware (Sequestro de Dados):</b> A ameaça mais letal para empresas e particulares. Encripta todos os teus ficheiros (fotos, documentos, discos rígidos) e exige um pagamento em criptomoedas. Ficas impedido de aceder à tua própria vida digital.</li><li><b>Spyware e Keyloggers:</b> Instalam-se em silêncio e gravam tudo o que digitas (senhas, conversas), tiram capturas de ecrã e podem até ativar a tua webcam sem ligar a luz indicadora.</li><li><b>Trojans (Cavalos de Troia):</b> Disfarçam-se de software legítimo (ex: um jogo pirata, um leitor de PDF grátis ou um anexo de fatura). Ao abrires, eles abrem uma 'Backdoor' (porta das traseiras) para o hacker controlar o teu PC.</li><li><b>Botnets:</b> Malware que transforma o teu dispositivo num 'zombie' dormente. O teu telemóvel ou PC passa a fazer parte de um exército global usado para atacar sistemas governamentais ou enviar spam, gastando a tua rede e bateria.</li><li><b>Fileless Malware:</b> Malware altamente avançado que não guarda ficheiros no disco. Vive inteiramente na memória RAM do computador e aproveita ferramentas legítimas do Windows (como o PowerShell) para atacar, tornando-se quase invisível para antivírus comuns.</li></ul><br><b>Sinais de Infeção:</b> O computador fica subitamente lento, ventoinhas a disparar sem estares a fazer nada (sinal de mineração de criptomoedas oculta), bateria que dura muito pouco, pop-ups constantes ou a página inicial do browser que mudou sozinha.") + `
            <div class="checklist-box" style="background:#f0fdf4; border-left:5px solid var(--verde-principal); padding:15px; border-radius:8px; margin-top:20px;">
                <h4 style="margin-top:0;">✅ ${gettext("Checklist de Proteção")}</h4>
                <label style="display:block; margin-bottom:8px;"><input type="checkbox"> <span>${gettext("Sistema Operativo Atualizado")}</span></label>
                <label style="display:block; margin-bottom:8px;"><input type="checkbox"> <span>${gettext("Antivírus Ativo")}</span></label>
                <label style="display:block;"><input type="checkbox"> <span>${gettext("Não descarregar software pirata")}</span></label>
            </div>
        `,
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
    },
    'ia': {
        titulo: gettext("Ameaças com Inteligência Artificial"),
        icon: '🤖',
        texto: gettext("A Inteligência Artificial (IA) revolucionou o mundo, mas também armou os cibercriminosos com ferramentas de nível militar. O que antes exigia conhecimentos técnicos avançados, agora pode ser automatizado por algoritmos em segundos.<br><br><b>Como a IA está a ser usada contra ti:</b><ul><li><b>Phishing Perfeito:</b> Esquece os e-mails com erros ortográficos do passado. Ferramentas como o ChatGPT (ou variantes maliciosas criadas por hackers) permitem criar e-mails falsos indetetáveis, escritos em português perfeito e com um tom altamente persuasivo.</li><li><b>Clonagem de Voz (Vishing com IA):</b> Bastam 3 a 5 segundos de áudio retirados de um vídeo teu no Instagram ou TikTok para a IA clonar a tua voz com uma precisão assustadora. Os burlões usam isto para ligar aos teus familiares a chorar, dizendo que tiveram um acidente e precisam de dinheiro por MB WAY.</li><li><b>Deepfakes de Vídeo:</b> Vídeos manipulados de figuras públicas, políticos ou mesmo do CEO de uma empresa a recomendar falsos investimentos em criptomoedas ou a ordenar transferências urgentes a funcionários.</li><li><b>Malware Mutante:</b> Código malicioso escrito e reescrito por IA que altera a sua própria assinatura digital constantemente para escapar aos radares dos antivírus tradicionais.</li></ul><br><b>A Defesa na Era da IA:</b> Nunca confies apenas no que vês num ecrã ou ouves num telefonema. O ceticismo digital é a tua maior arma. Se algo parece demasiado urgente ou apela a emoções fortes (medo, ganância), faz uma pausa."),
        dica: gettext("Cria uma 'Palavra-Passe Familiar' (Uma palavra de segurança). Se alguém te ligar de um número estranho a pedir ajuda urgente com a voz de um familiar teu, pede essa palavra. Se a pessoa do outro lado não souber ou inventar desculpas, desliga imediatamente.")
    },

    'engenharia_social': {
        titulo: gettext("Engenharia Social e Manipulação"),
        icon: '🎭',
        texto: gettext("A Engenharia Social é a arte de 'hackear' os seres humanos em vez de computadores. Os sistemas de segurança atuais são extremamente robustos, por isso é muito mais fácil e barato para um atacante enganar-te para que sejas tu a abrir-lhe a porta.<br><br><b>Táticas de Manipulação:</b><ul><li><b>Pretexting:</b> O atacante cria um cenário falso. O exemplo clássico é a 'Fraude da Microsoft', onde te ligam a dizer que o teu PC está infetado e pedem que instales um programa de acesso remoto (como AnyDesk ou TeamViewer) para 'te ajudar'. Assim que instalas, eles controlam o teu banco.</li><li><b>Baiting (O Isco):</b> Explora a curiosidade natural humana. Um hacker deixa uma pen USB propositadamente no parque de estacionamento da tua empresa com o rótulo 'Salários_Direção_2026.xls'. Quem a encontrar e a ligar ao computador vai infetar a rede instantaneamente em silêncio.</li><li><b>Quid Pro Quo:</b> Oferecer um benefício falso em troca dos teus dados. Exemplos: 'Preencha este inquérito para ganhar um iPhone novo' ou falsas ofertas de emprego de luxo no LinkedIn que pedem as tuas informações bancárias antecipadamente.</li><li><b>Tailgating (Segurança Física):</b> Uma técnica onde uma pessoa sem autorização segue um funcionário legítimo num edifício seguro. O atacante aproxima-se com caixas pesadas nas mãos para forçar a empatia humana e fazer com que o funcionário lhe segure a porta, burlando a entrada com cartão.</li></ul>"),
        dica: gettext("Nunca aceites ajuda técnica (por telefone ou e-mail) que não solicitaste primeiro. Bancos, operadoras de telecomunicações, Microsoft ou Polícia NUNCA te vão ligar a pedir senhas, códigos de SMS ou para instalares aplicações de suporte remoto.")
    },

    'backups': {
        titulo: gettext("Backups e Recuperação de Desastres"),
        icon: '💾',
        texto: gettext("Existem apenas dois tipos de pessoas no mundo informático: as que já perderam dados importantes e as que ainda vão perder. Seja por um ataque de Ransomware, por roubo do portátil, ou uma falha de hardware, uma cópia de segurança (backup) limpa é a tua única salvação.<br><br><b>Sincronização NÃO É Backup:</b><br>Muitas pessoas acham que ter o Google Drive, OneDrive ou iCloud ativado no PC é ter um backup. <b>Isto é falso!</b> Estas ferramentas são plataformas de 'sincronização'. Se um vírus corromper os teus ficheiros locais, essa alteração é sincronizada imediatamente para a nuvem, destruindo também a cópia que lá estava.<br><br><b>A Estratégia Invencível (A Regra 3-2-1):</b><ul><li><b>3 Cópias:</b> Mantém sempre 3 cópias dos teus ficheiros essenciais (o original + 2 backups).</li><li><b>2 Suportes:</b> Usa formatos físicos diferentes (ex: o disco do teu PC + um Disco Rígido Externo USB).</li><li><b>1 Cópia Offsite:</b> Guarda uma cópia fora da tua casa/escritório (numa nuvem segura que mantenha um histórico de versões, ou um disco na casa dos teus pais). Isto garante que não perdes tudo em caso de incêndio ou assalto à tua casa.</li></ul><br><b>O Perigo Oculto dos Backups Locais:</b> Os malwares de Ransomware modernos procuram ativamente por discos externos ou pens USB ligadas ao PC para encriptar esses dados também.") + `
            <div class="info-box" style="background:#e0f2fe; border-left:5px solid #0ea5e9; padding:15px; border-radius:8px; margin-top:20px;">
                <h4 style="margin-top:0; color:#0369a1; margin-bottom:10px;">🔄 ${gettext("A Regra de Ouro do Restauro")}</h4>
                <p style="margin-bottom:0; font-size:0.9rem; color:#0c4a6e;">${gettext("Um backup que nunca foi testado é apenas uma esperança. Tenta restaurar ficheiros aleatórios do teu disco externo a cada 6 meses para garantir que o disco não avariou e que o processo funciona.")}</p>
            </div>
        `,
        dica: gettext("Desliga sempre o teu disco externo (cabo USB) assim que a cópia de segurança terminar. Um disco de backup só é 100% à prova de hackers se estiver desligado fisicamente da corrente e do computador.")
    },

    'compras': {
        titulo: gettext("Compras Online e Segurança Financeira"),
        icon: '🛒',
        texto: gettext("O e-commerce e as plataformas de classificados são convenientes, mas são também o principal campo de caça para o roubo de dados financeiros. Proteger o teu dinheiro é tão importante como proteger as tuas senhas.<br><br><b>Identificar Lojas Fraudulentas (Scam Stores):</b><ul><li><b>Preços Mirabolantes:</b> Se aquele smartphone, PS5 ou sapatilhas de marca estão com 70% de desconto num site desconhecido, é burla garantida.</li><li><b>Falta de Informação Legal:</b> Lojas legítimas têm de exibir NIF, morada física, Política de Devolução e Termos e Condições. Se o único contacto for um formulário web genérico, sai do site.</li><li><b>Anúncios Falsos nas Redes Sociais:</b> Cuidado extremo com anúncios patrocinados no Instagram, Facebook ou TikTok. É muito fácil e barato para um criminoso criar uma loja visualmente perfeita no Shopify, pagar anúncios, recolher milhares de euros em 48 horas e desaparecer.</li></ul><br><b>A Higiene no Pagamento:</b> Nunca guardes os detalhes do teu cartão de crédito real (número e CVV) na base de dados de uma loja online. Se a loja for invadida no mês seguinte, os teus dados vazam com ela.<br><br><b>O Escudo dos Cartões Virtuais (MB WAY / Revolut):</b> A melhor defesa financeira é a virtualização. Usa ferramentas para gerar um 'Cartão Virtual de Utilização Única' com o limite exato do produto que vais comprar. Assim que a compra for feita, o cartão expira e autodestrói-se. Mesmo que a loja seja pirata, não conseguem tirar de lá nem mais um cêntimo."),
        dica: gettext("Nas compras entre particulares (OLX, Vinted, Facebook Marketplace), nunca aceites sair do chat oficial da plataforma para o WhatsApp. O MB WAY NUNCA pede o teu PIN de acesso para 'receberes' dinheiro. Se te pedirem o PIN, estão a tentar aceder à tua conta bancária.")
    }
};

function mostrarTema(idTema) {
    const info = baseConhecimento[idTema];
    const container = document.getElementById('conteudo-dinamico');

    if (info) {
        container.innerHTML = `
            <div style="animation: popIn 0.3s ease-out; "id="pdf-area">
                
                
                <article class="doc-card tema-conteudo" style="position: relative;">
                    <div class="no-pdf" style="position: absolute; top: 30px; right: 30px; z-index: 99;">
                        <button onclick="imprimirPDF('${idTema}')" title="${gettext("Descarregar PDF")}" style="background-color: rgba(28, 136, 20, 0.1); cursor: pointer; border: none; width: 45px; height: 45px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s ease;" 
                            onmouseover="this.style.background='#1c8814'; this.querySelector('img').style.filter='brightness(0) invert(1)';" 
                            onmouseout="this.style.background='rgba(28, 136, 20, 0.1)'; this.querySelector('img').style.filter='none';"> 
                            
                            <img src="/static/img/download-seta.png" alt="PDF" style="width: 20px; height: 20px; transition: all 0.3s ease;"> 
                        </button>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div class="card-icon">${info.icon}</div>
                        ${info.tempo ? `<span style="font-size:0.8rem; background:rgba(0,0,0,0.05); padding:4px 12px; border-radius:20px; font-weight:bold; color:#666;">⏱️ ${info.tempo}</span>` : ''}
                    </div>
                    
                    <h2 style="font-size: 2rem; margin-bottom: 20px; color: var(--verde-escuro); padding-right: 60px;">${info.titulo}</h2>
                    
                    <div class="texto-principal" style="color: #4b5563; font-size: 1.1rem; line-height: 1.6;">
                        ${info.texto}
                    </div>

                    <div class="dica-box" style="margin-top: 30px; background: rgba(76,175,80,0.1); border-left: 6px solid var(--verde-principal); padding: 20px; border-radius: 0 20px 20px 0;">
                        <strong>💡 ${gettext("Dica:")}</strong> ${info.dica}
                    </div>
                </article>
            </div>
        `;


        document.querySelectorAll('.doc-sidebar a').forEach(link => {
            link.style.color = 'var(--verde-escuro)';
            link.style.transform = 'translateX(0)';
            link.style.fontWeight = '600';
        });

        const linkAtivo = document.querySelector(`.doc-sidebar a[onclick*="'${idTema}'"]`);
        if (linkAtivo) {
            linkAtivo.style.color = 'var(--verde-principal)';
            linkAtivo.style.transform = 'translateX(5px)';
            linkAtivo.style.fontWeight = '900';
        }


        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

//abrir o tema qaundo vem do quiz
window.addEventListener('DOMContentLoaded', () => {

    const hash = window.location.hash.replace('#', '');

    if (hash && baseConhecimento[hash]) {
        //garante que carrega tudo pa meter o tema
        setTimeout(() => mostrarTema(hash), 100);
    }
});


function testarpass(inputId = 'pass-test') {
    const inputEl = document.getElementById(inputId);
    const barra = document.getElementById('forca-barra-fill');
    const feedback = document.getElementById('pass-feedback');

    if (!inputEl || !barra || !feedback) return;

    const val = inputEl.value;

    if (!val) {
        barra.style.width = '0%';
        feedback.innerText = gettext("Escreve para testar a força.");
        barra.style.backgroundColor = '#ef4444';
        return;
    }

    let forca = 0;
    if (val.length >= 8) forca += 25;
    if (val.length >= 12) forca += 25;
    if (/[A-Z]/.test(val)) forca += 25;
    if (/[!@#$%^&*]/.test(val)) forca += 25;

    barra.style.width = forca + '%';

    if (forca < 50) {
        barra.style.backgroundColor = '#ef4444';
        feedback.innerText = gettext("Fraca: Um hacker descobre isto em segundos.");
    } else if (forca < 100) {
        barra.style.backgroundColor = '#eab308';
        feedback.innerText = gettext("Média: Melhor, mas ainda vulnerável.");
    } else {
        barra.style.backgroundColor = '#22c55e';
        feedback.innerText = gettext("Forte: Levaria séculos para ser descoberta!");
    }
}

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
    else {

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

//funcao para avançar passos no registar
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

function fecharpopup() {
    var introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) {
        introOverlay.style.opacity = '0';
        setTimeout(function () {
            introOverlay.style.display = 'none';
        }, 300);
    }
}

setTimeout(function () {
    let toasts = document.querySelectorAll('.toast-message');
    toasts.forEach(function (toast) {
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
        radio.addEventListener('change', function () {
            document.getElementById('avatar-upload').value = '';
            document.getElementById('nome-ficheiro').innerText = '';
        });
    });
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

//fazer valdidacao para nao deixar comecar o quiz sem temas selecionados
document.addEventListener('DOMContentLoaded', function () {
    const formQuizSetup = document.querySelector('.qs-form');
    const avisoErro = document.getElementById('aviso-temas');

    //Verifica se os elementos existem para não dar erro noutras páginas
    if (formQuizSetup && avisoErro) {
        formQuizSetup.addEventListener('submit', function (event) {

            // Verifica qual é o modo
            const modoSelecionado = document.querySelector('input[name="modo_jogo"]:checked');

            if (modoSelecionado && modoSelecionado.value === 'personalizado') {


                const temasSelecionados = document.querySelectorAll('input[name="temas"]:checked').length;

                if (temasSelecionados === 0) {

                    event.preventDefault();

                    avisoErro.classList.remove('hidden');

                    setTimeout(function () {
                        avisoErro.classList.add('hidden');
                    }, 4000);
                }
            }
        });
    }
});
//utilizar a sessionstorage para nao mostrar a notificaçao do mfa enquanto durar a sessao, 
//o localstorage bastava fechar 1 vez e nunaca mais aparecia 
document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem("esconderAlertaMFA") === "true") {
        const alerta = document.getElementById("mfa-alert-box");
        if (alerta) alerta.style.display = "none";
    }
});

function fecharAlertaMFA() {
    const alerta = document.getElementById("mfa-alert-box");
    if (alerta) {
        alerta.style.display = "none";
        sessionStorage.setItem("esconderAlertaMFA", "true");
    }
}



document.addEventListener('DOMContentLoaded', function () {

    const phishZones = document.querySelectorAll('.phish-zone');
    const contadorDisplay = document.getElementById('contador-pistas');
    const inputAcertos = document.getElementById('input-acertos');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const formResultado = document.getElementById('form-resultado');

    if (phishZones.length > 0 && formResultado) {
        let pistasClicadas = 0;


        phishZones.forEach(zone => {
            zone.addEventListener('click', function (e) {
                // Se o utilizador clicar num link dentro do corpo do email, evita que a página mude
                if (e.target.tagName.toLowerCase() === 'a') {
                    e.preventDefault();
                }

                // Liga ou desliga a seleção
                this.classList.toggle('selecionada');

                // Atualiza o número no contador do ecrã
                if (this.classList.contains('selecionada')) {
                    pistasClicadas++;
                } else {
                    pistasClicadas--;
                }

                if (contadorDisplay) {
                    contadorDisplay.innerText = pistasClicadas;
                }
            });
        });

        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', function (e) {
                e.preventDefault();

                // pistas selcionadas
                let acertosReais = document.querySelectorAll('.phish-zone.selecionada[data-is-phishing="true"]').length;


                if (inputAcertos) {
                    inputAcertos.value = acertosReais;
                }

                //formulário
                formResultado.submit();
            });
        }
    }
});


document.addEventListener('DOMContentLoaded', function () {
    //botões de modo do Simulador
    const radiosModo = document.querySelectorAll('input[name="modo_simulador"]');
    const zonaTemporizador = document.getElementById('zona-temporizador');
    const checkTemporizador = document.getElementById('check-temporizador');

    //avança se estivermos na página de Setup do Simulador
    if (radiosModo.length > 0 && zonaTemporizador) {
        radiosModo.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'rapido') {
                    //escolheu Rápido, mostra a opção do temporizador
                    zonaTemporizador.classList.remove('hidden');
                } else {
                    //escolheu Detetive, esconde e desmarca a caixa
                    zonaTemporizador.classList.add('hidden');
                    if (checkTemporizador) {
                        checkTemporizador.checked = false;
                    }
                }
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const emails = document.querySelectorAll('.correcao-email');
    const btnAnt = document.getElementById('btn-ant');
    const btnProx = document.getElementById('btn-prox');
    const contador = document.getElementById('contador-emails');

    let currentIndex = 0;

    if (emails.length > 0) {

        function atualizarCarrossel() {

            emails.forEach((el, index) => {
                if (index === currentIndex) {
                    el.style.display = 'block';
                    el.style.animation = 'none';
                    el.offsetHeight;
                    el.style.animation = 'fadeIn 0.4s ease-in-out';
                } else {
                    el.style.display = 'none';
                }
            });

            //botão Anterior
            if (btnAnt) {
                btnAnt.disabled = (currentIndex === 0);
                btnAnt.style.opacity = (currentIndex === 0) ? '0.5' : '1';
            }

            //botão Próximo
            if (btnProx) {
                btnProx.disabled = (currentIndex === emails.length - 1);
                btnProx.style.opacity = (currentIndex === emails.length - 1) ? '0.5' : '1';
            }
            if (contador) {
                contador.innerText = `E-mail ${currentIndex + 1} de ${emails.length}`;
            }
        }

        //Botão Anterior
        if (btnAnt) {
            btnAnt.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    atualizarCarrossel();
                }
            });
        }

        //Botão Próximo
        if (btnProx) {
            btnProx.addEventListener('click', () => {
                if (currentIndex < emails.length - 1) {
                    currentIndex++;
                    atualizarCarrossel();
                }
            });
        }


        atualizarCarrossel();
    }
});


// Variáveis para o simulador
let simRespondido = false;
let ePhishingReal = false;
let totalArmadilhas = 0;
let totalPistasView = 0;

document.addEventListener("DOMContentLoaded", function () {

    const simDados = document.getElementById('simulador-dados');


    if (simDados) {
        // Lê os dados do Django pelo HTML
        ePhishingReal = simDados.getAttribute('data-e-phishing') === 'true';
        totalArmadilhas = parseInt(simDados.getAttribute('data-total-armadilhas')) || 0;
        const temTimer = simDados.getAttribute('data-timer') === 'true';

        totalPistasView = totalArmadilhas + (ePhishingReal ? 2 : 0);

        if (temTimer) {
            iniciarCronometro();
        }
    }
});


window.avaliarEmail = function (escolhaDoUtilizador) {
    if (simRespondido) return;
    simRespondido = true;

    let acertou = false;

    if (escolhaDoUtilizador === 'phishing' && ePhishingReal) {
        acertou = true;
    } else if (escolhaDoUtilizador === 'seguro' && !ePhishingReal) {
        acertou = true;
    }

    const inputAcertos = document.getElementById('input-acertos');

    if (acertou) {
        inputAcertos.value = totalPistasView;
    } else {
        inputAcertos.value = 0;
    }

    const btnClicado = escolhaDoUtilizador === 'phishing'
        ? document.querySelector('.btn-phish')
        : document.querySelector('.btn-safe');

    btnClicado.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A registar...';

    document.querySelectorAll('.btn-decisao').forEach(btn => {
        btn.style.opacity = '0.6';
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });

    setTimeout(() => {
        document.getElementById('form-rapido').submit();
    }, 400);
};


function iniciarCronometro() {
    let timeLeft = 15;
    const tempoTotal = 15;
    const timerElement = document.getElementById('time-left');

    const countdown = setInterval(() => {
        if (simRespondido) {
            clearInterval(countdown);
            return;
        }

        timeLeft--;
        const percentage = (timeLeft / tempoTotal) * 100;

        if (timerElement) {
            timerElement.style.width = percentage + '%';

            if (timeLeft <= 5) {
                timerElement.style.backgroundColor = '#ef4444';
            }
        }

        if (timeLeft <= 0) {
            clearInterval(countdown);
            simRespondido = true;

            document.getElementById('input-acertos').value = 0;

            document.querySelectorAll('.btn-decisao').forEach(btn => {
                btn.innerHTML = 'Tempo Esgotado! ⏱️';
                btn.style.opacity = '0.6';
                btn.disabled = true;
            });

            setTimeout(() => {
                document.getElementById('form-rapido').submit();
            }, 600);
        }
    }, 1000);
}

//detetor ai
const btnAnalisar = document.getElementById('btn-analisar');
const btnText = document.getElementById('btn-text');
const spinner = document.getElementById('loading-spinner');
const iaResultado = document.getElementById('ia-resultado');
const textArea = document.getElementById('email-text');

if (btnAnalisar) {
    btnAnalisar.addEventListener('click', async () => {
        const texto = textArea.value.trim();
        if (texto.length < 10) {
            alert("Por favor, cola um texto mais longo para análise.");
            return;
        }

        // enquanto espera
        btnAnalisar.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
        if (iaResultado) iaResultado.classList.add('hidden');

        try {
            const response = await fetch("/atividades/api/analisar-phishing-ia/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'same-origin',
                body: JSON.stringify({ texto_email: texto })
            });

            const data = await response.json();
            if (!response.ok) {
                //se o django der uma mensagem mostra essa, senao mostra esta geral
                throw new Error(data.error || "Erro no servidor ao processar o pedido.");
            }

            if (data.erro) throw new Error(data.erro);

            //Preencher Resultados
            document.getElementById('result-status-text').innerText = data.status.toUpperCase();
            document.getElementById('result-risco').innerText = data.risco.toUpperCase();
            document.getElementById('result-risco').className = `risco-badge risk-${data.risco}`;
            document.getElementById('result-conselho-text').innerText = data.conselho;


            //lista dos motivos econtrados
            const listMotivos = document.getElementById('list-motivos');
            listMotivos.innerHTML = '';
            data.motivos.forEach(m => {
                const li = document.createElement('li');
                li.innerText = m;
                listMotivos.appendChild(li);
            });

            const iconDiv = document.getElementById('result-status-icon');
            const resultHeader = document.querySelector('.result-header');
            if (data.status === 'phishing') {
                iconDiv.innerHTML = '💀';
                resultHeader.style.color = '#ef4444';
                iaResultado.style.borderTop = '8px solid #ef4444';
            } else {
                iconDiv.innerHTML = '🛡️';
                resultHeader.style.color = '#22c55e';
                iaResultado.style.borderTop = '8px solid #22c55e';
            }

            //pa contar quandos usos da ia fez
            const contadorUsos = document.getElementById('contador-ia-usos');
            if (contadorUsos && data.usos_restantes !== undefined) {
                contadorUsos.innerText = data.usos_restantes;
            }

            iaResultado.classList.remove('hidden');
            iaResultado.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            alert(gettext("Erro ao analisar: ") + err.message);
        } finally {
            btnAnalisar.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    });
}

function reiniciarAnalise() {
    if (textArea && iaResultado) {
        textArea.value = '';
        iaResultado.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


//mensagem no perfil depois de atualzar
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        const toasts = document.querySelectorAll('.toast-msg');
        toasts.forEach(function (toast) {
            toast.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => toast.remove(), 500);
        });
    }, 4000);
});

//funcao para o registar, nao dar para avancar sem ter tudo preenchido
function validarEAvancar(passoAtual, proximoPasso) {
    
    const stepDiv = document.getElementById('step' + passoAtual);
    
    const inputs = stepDiv.querySelectorAll('input');
    
    let tudoValido = true;
    for (let input of inputs) {
        if (!input.checkValidity()) {
            input.reportValidity();
            tudoValido = false;
            break; 
        }
    }

    //avanca se os campos tiverm preenchidos
    if (tudoValido) {
        goToStep(proximoPasso);
    }
}

//funcao para mostrar palavra-passe no login e no registo
document.addEventListener('DOMContentLoaded', function () {
    //seleciona os icones
    const togglers = document.querySelectorAll('.toggle-password-img');

    togglers.forEach(btn => {
        btn.addEventListener('click', function () {
            //Descobre qual o input que este botão controla
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input) {
                //muda entre password e text
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    });
});

//animacao no fundo
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('fundo-cibernetico');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    let mouse = { x: undefined, y: undefined, radius: 180 };

    window.addEventListener('mousemove', function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // Quando o rato sai do ecrã, apaga tudo
    window.addEventListener('mouseout', function () {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    class Particle {
        constructor(x, y, directionX, directionY, size) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
        }

        draw(opacidade) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = 'rgba(37, 77, 26, 0.9)';
            ctx.fill();
        }

        update() {
            //efeito de bater nas paredes e voltar
            if (this.x > canvas.width || this.x < 0) { this.directionX = -this.directionX; }
            if (this.y > canvas.height || this.y < 0) { this.directionY = -this.directionY; }
            this.x += this.directionX;
            this.y += this.directionY;
            let opacidade = 0;
            if (mouse.x != undefined) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distancia = Math.sqrt(dx * dx + dy * dy);

                if (distancia < mouse.radius) {
                    opacidade = 1 - (distancia / mouse.radius);
                }
            }
            if (opacidade > 0) {
                this.draw(opacidade);
            }
        }
    }

    function init() {
        particlesArray = [];

        let numberOfParticles = (canvas.height * canvas.width) / 8000;

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);

            let directionX = (Math.random() * 0.6) - 0.3;
            let directionY = (Math.random() * 0.6) - 0.3;
            particlesArray.push(new Particle(x, y, directionX, directionY, size));
        }
    }

    function connect() {

        if (mouse.x === undefined) return;

        for (let a = 0; a < particlesArray.length; a++) {

            let dxMouseA = mouse.x - particlesArray[a].x;
            let dyMouseA = mouse.y - particlesArray[a].y;
            let distMouseA = Math.sqrt(dxMouseA * dxMouseA + dyMouseA * dyMouseA);


            if (distMouseA > mouse.radius) continue;


            ctx.strokeStyle = `rgba(37, 77, 26, ${1 - (distMouseA / mouse.radius)})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();


            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distEntrePontos = Math.sqrt(dx * dx + dy * dy);


                if (distEntrePontos < 80) {
                    ctx.strokeStyle = `rgba(37, 77, 26, ${(1 - distEntrePontos / 80) * 0.6})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
    }

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    init();
    animate();
});

function imprimirPDF(idTema) {
    const elemento = document.getElementById('pdf-area');
    if (!elemento) return;

    const botaoPDF = elemento.querySelector('.no-pdf');
    const btnTextoOriginal = botaoPDF.querySelector('button').innerHTML;

    //Feedback visual
    botaoPDF.querySelector('button').disabled = true;
    botaoPDF.querySelector('button').innerHTML = "A descarregar...";
    botaoPDF.style.display = 'none';

    //Configurações inteligentes do PDF
    const opcoes = {
        margin: [20, 15, 20, 15],
        filename: `Protege+_Guia_${idTema}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'avoid-all'] }
    };

    //Constroi o PDF
    html2pdf().set(opcoes).from(elemento).save().then(() => {

        botaoPDF.style.display = 'block';
        botaoPDF.querySelector('button').disabled = false;
        botaoPDF.querySelector('button').innerHTML = btnTextoOriginal;
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-show');
            } else {
            }
        });
    }, {
        threshold: 0.15
    });
    const hiddenElements = document.querySelectorAll('.scroll-hidden');
    hiddenElements.forEach((el) => observer.observe(el));
});



document.addEventListener("DOMContentLoaded", function () {
    const toasts = document.querySelectorAll('.toast-item');

    toasts.forEach(toast => {
        //apaga a msg quadno acaba o tempo
        setTimeout(() => {
            fecharToast(toast.querySelector('.toast-close'));
        }, 4000);
    });
});

//fechar a mensagem
function fecharToast(botao) {
    const toast = botao.closest('.toast-item');
    if (toast) {
        toast.style.animation = 'slideOutRight 0.4s ease forwards';

        
        setTimeout(() => {
            toast.remove();
        }, 400);
    }
}