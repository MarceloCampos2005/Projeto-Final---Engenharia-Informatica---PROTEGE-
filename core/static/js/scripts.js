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
    const wrapper = document.getElementById('content-wrapper');
    if (!wrapper) return;

    wrapper.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    
    if (tipo !== 'normal') wrapper.classList.add(tipo);
    
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    if (isAuthenticated) {
        guardarFiltroNoServidor('daltonismo', tipo);
    } else {
        localStorage.setItem('modoDaltonismo', tipo);
    }
    
    document.getElementById('daltonismo-menu').classList.add('hidden');
    wrapper.style.display = 'none';
    wrapper.offsetHeight; 
    wrapper.style.display = 'flex';
}

function setContraste(tipo) {
    const wrapper = document.getElementById('content-wrapper');
    if (!wrapper) return;

    wrapper.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    
    if (tipo !== 'normal') {
        wrapper.classList.add(tipo);
        
        if (tipo === 'modo-escuro') {
            document.body.style.backgroundColor = "#121212";
        } else if (tipo === 'contraste-invertido') {
            document.body.style.backgroundColor = "#000000";
        } else {
            document.body.style.backgroundColor = "#C2E0B1";
        }
    } else {
        document.body.style.backgroundColor = "#C2E0B1";
    }

    const isAuthenticated = document.body.dataset.authenticated === 'true';
    if (isAuthenticated) {
        guardarFiltroNoServidor('contraste', tipo);
    } else {
        localStorage.setItem('modoContraste', tipo);
    }
    
    document.getElementById('contraste-menu').classList.add('hidden');
    wrapper.style.display = 'none';
    wrapper.offsetHeight; 
    wrapper.style.display = 'flex';
}
//aqui vamos ver se o utilizador ta autenticado, se tiver as preferencias dele sao aplicadas, senao vai a localstorage ver
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    const wrapper = document.getElementById('content-wrapper'); 

    if (!wrapper) return;

    if (isAuthenticated) {
       //limpa a Localstorage
        localStorage.removeItem('modoDaltonismo');
        localStorage.removeItem('modoContraste');

        if (wrapper.classList.contains('modo-escuro')) {
            document.body.style.backgroundColor = "#121212";
        } else if (wrapper.classList.contains('contraste-invertido')) {
            document.body.style.backgroundColor = "#000000";
        }
    } else {
        
        const daltSalvo = localStorage.getItem('modoDaltonismo');
        if (daltSalvo && daltSalvo !== 'normal') {
            wrapper.classList.add(daltSalvo);
        }

        const contSalvo = localStorage.getItem('modoContraste');
        if (contSalvo && contSalvo !== 'normal') {
            wrapper.classList.add(contSalvo);
          
            if (contSalvo === 'modo-escuro') {
                document.body.style.backgroundColor = "#121212";
            } else if (contSalvo === 'contraste-invertido') {
                document.body.style.backgroundColor = "#000000";
            }
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
        texto: gettext(`
            O Phishing é a espinha dorsal da maioria dos ataques cibernéticos modernos. Trata-se de uma técnica de manipulação que utiliza comunicações fraudulentas (e-mail, SMS, voz) para enganar utilizadores e obter dados sensíveis como credenciais de acesso, números de cartões de crédito ou instalar malware silenciosamente.
            <br><br><b>A Psicologia da Engenharia Social:</b> Ao contrário de ataques técnicos que tentam forçar a entrada via software, a Engenharia Social foca na "vulnerabilidade humana". Os atacantes criam cenários de extrema urgência (ex: "A sua conta será encerrada em 2 horas") ou medo (ex: "Detetámos uma tentativa de login ilegal") para contornar o pensamento racional da vítima.
            <br><br><b>Variantes Avançadas:</b>
            <ul>
                <li><b>Smishing (SMS Phishing):</b> Mensagens rápidas, muitas vezes inseridas no mesmo fio de mensagens de bancos reais, contendo links para "atualizar dados" em sites clones perfeitos.</li>
                <li><b>Vishing (Voice Phishing):</b> Chamadas telefónicas onde o burlão utiliza software de alteração de voz ou "Spoofing" (falsificação do número de origem) para fingir ser de um suporte técnico ou autoridade policial.</li>
                <li><b>Spear Phishing:</b> Um ataque cirúrgico e personalizado. O atacante estuda as tuas redes sociais e sabe o teu nome, onde trabalhas e quem são os teus amigos para criar uma mensagem personalizada impossível de ignorar.</li>
                <li><b>Whaling:</b> Foca-se em "peixes grandes" (CEOs e executivos), tentando induzir transferências bancárias de alto valor através de e-mails que parecem ordens internas legítimas.</li>
            </ul>
            <br><b>Sinais Vermelhos (Red Flags):</b> Saudações impessoais, erros gramaticais subtis, anexos inesperados (mesmo de pessoas conhecidas) e domínios de e-mail ligeiramente alterados (ex: @microsoft-support.com em vez de @microsoft.com).
        `),
        dica: gettext("Sempre que receberes uma mensagem urgente, para. Não cliques. Contacta a entidade pelo número oficial que tens no teu cartão físico ou site oficial digitado manualmente no browser.")
    },

    'senhas': {
        titulo: gettext("Gestão de Identidade e Senhas"),
        icon: '🔑',
        texto: gettext(`
            As palavras-passe são as chaves da tua casa digital, mas na era da computação de alta performance, senhas curtas ou previsíveis são vulnerabilidades críticas. Um computador moderno consegue testar mil milhões de combinações por segundo em ataques de "Brute Force" ou "Dictionary Attacks".
            <br><br><b>Critérios de uma Senha Invencível:</b>
            <ul>
                <li><b>Comprimento é Rei:</b> Quanto maior a senha, mais exponencialmente difícil é quebrá-la. O ideal é ter entre 14 a 20 caracteres.</li>
                <li><b>Entropia (Complexidade):</b> Mistura aleatória de caracteres especiais (@, #, $, %), números, maiúsculas e minúsculas.</li>
                <li><b>Unicidade Absoluta:</b> Nunca, sob circunstância alguma, repitas uma senha. Se um site sofrer um ataque e a tua senha for exposta, os hackers usarão ferramentas automáticas para tentar essa mesma combinação em todos os outros sites (ataque de Credential Stuffing).</li>
            </ul>
            <br><b>O Papel dos Gestores de Senhas (Vaults):</b> No mundo atual, é humanamente impossível memorizar 50 senhas únicas e fortes. Gestores como Bitwarden, 1Password ou Dashlane permitem guardar tudo num cofre cifrado. Tu só precisas de saber uma "Master Password" extremamente forte; o gestor trata de gerar e preencher as restantes automaticamente.
            <br><br><b>Ameaças Locais:</b> Keyloggers (malware que regista teclas) podem roubar senhas no momento da digitação. Por isso, a utilização de gestores que permitem "copiar e colar" ou preenchimento automático é mais segura do que digitar manualmente.
        `),
        dica: gettext("Adota o método das 'Passphrases': usa quatro ou cinco palavras aleatórias e junta-as com símbolos. Exemplo: 'Cadeira#Elefante%Pizza$Porto'. É fácil de memorizar e levaria séculos para ser quebrada por máquinas.")
    },

    'mfa': {
        titulo: gettext("Autenticação Multi-Fator (MFA/2FA)"),
        icon: '📱',
        texto: gettext(`
            A Autenticação Multi-Fator é, atualmente, a ferramenta de segurança individual mais eficaz que existe. Ela parte do princípio que a senha (algo que sabes) já não é suficiente. É necessário provar a tua identidade através de um segundo canal independente.
            <br><br><b>As Três Categorias de Autenticação:</b>
            <ol>
                <li><b>Algo que sabes:</b> A tua password tradicional ou um código PIN.</li>
                <li><b>Algo que tens:</b> O teu telemóvel (recebe uma notificação push), uma App de autenticação (gera códigos temporários) ou uma chave USB física (Yubikey).</li>
                <li><b>Algo que és (Biometria):</b> A tua impressão digital, reconhecimento facial (FaceID) ou leitura da íris.</li>
            </ol>
            <br><b>Hierarquia de Segurança do MFA:</b>
            <ul>
                <li><b>SMS (Bronze):</b> O método mais comum, mas vulnerável a "SIM Swapping" (onde o hacker convence a operadora a clonar o teu cartão SIM).</li>
                <li><b>Apps de Autenticação (Ouro):</b> Apps como Google Authenticator ou Authy geram códigos offline (TOTP) que mudam a cada 30 segundos, sendo muito mais difíceis de intercetar.</li>
                <li><b>Chaves de Segurança Físicas (Platina):</b> Pequenos dispositivos USB/NFC que requerem um toque físico. São imunes a phishing remoto porque o atacante não pode "carregar no botão" fisicamente a partir de outro país.</li>
            </ul>
        `),
        dica: gettext("A tua conta de e-mail é a mais importante. Se um hacker entrar no teu e-mail, ele pode fazer 'Reset Password' em todas as tuas outras contas. Ativa o MFA no e-mail hoje mesmo!")
    },

    'privacidade': {
        titulo: gettext("Privacidade, Cookies e Pegada Digital"),
        icon: '📍',
        texto: gettext(`
            A privacidade online não é sobre "não ter nada a esconder", mas sim sobre ter o poder de decidir quem acede aos teus dados. Cada clique, pesquisa e movimento GPS contribui para a tua "Pegada Digital", um rasto permanente que pode ser usado para perfilar o teu comportamento ou facilitar ataques.
            <br><br><b>O Ecossistema dos Cookies:</b>
            <ul>
                <li><b>Cookies de Sessão:</b> Essenciais. Mantêm-te logado num site enquanto navegas entre páginas.</li>
                <li><b>Cookies de Terceiros (Tracking):</b> Colocados por redes de publicidade para te seguir por toda a Internet. Criam um perfil comercial detalhado sobre os teus gostos, doenças, orientação política e situação financeira.</li>
            </ul>
            <br><b>O Perigo dos Metadados (EXIF):</b> Quando tiras uma foto com o telemóvel e a envias sem proteção, ela contém dados ocultos: o modelo do telemóvel, a hora exata e, mais perigoso, as coordenadas GPS de onde a foto foi tirada. Partilhar uma foto do teu novo setup de gaming pode revelar a localização exata da tua casa a estranhos.
            <br><br><b>Permissões de Apps:</b> Muitas aplicações gratuitas sobrevivem da venda de dados. Se uma lanterna ou calculadora pedir acesso à tua lista de contactos, microfone e localização, os teus dados são o verdadeiro produto.
        `),
        dica: gettext("Utiliza extensões como 'uBlock Origin' e browsers focados em privacidade como o Brave ou Firefox para bloquear rastreadores automáticos que mapeiam a tua navegação.")
    },

    'malware': {
        titulo: gettext("Malware: O Software Malicioso"),
        icon: '🦠',
        texto: gettext(`
            Malware é um termo guarda-chuva para qualquer código desenhado para realizar ações indesejadas num sistema. A evolução do malware passou de simples vírus que "apagavam ficheiros" para indústrias de crime organizado multimilionárias.
            <br><br><b>As Ameaças de Elite:</b>
            <ul>
                <li><b>Ransomware:</b> Talvez o mais perigoso. Encripta todos os teus ficheiros (fotos, documentos, bases de dados) e exige um resgate em Bitcoin. Mesmo pagando, muitas vezes os dados não são devolvidos.</li>
                <li><b>Spyware e Keyloggers:</b> Software "espião" silencioso. O seu objetivo é permanecer indetetável enquanto envia para o atacante tudo o que escreves no teclado, capturas de ecrã e até acesso à webcam.</li>
                <li><b>Trojans (Cavalos de Troia):</b> Disfarçam-se de programas úteis (jogos, instaladores piratas). Quando os executas, abrem uma "porta traseira" (Backdoor) para o hacker controlar o teu PC remotamente.</li>
                <li><b>Botnets:</b> Transformam o teu dispositivo num "zombie". O teu computador passa a fazer parte de um exército global usado para atacar sites do governo ou espalhar spam sem tu saberes.</li>
            </ul>
            <br><b>Vetores de Infeção:</b> Além dos links, o malware pode vir em pens USB encontradas, ficheiros piratas (torrents) e até anúncios maliciosos em sites legítimos (Malvertising).
        `),
        dica: gettext("Não confies apenas no Antivírus. Mantém o teu sistema operativo (Windows/macOS/Linux) sempre atualizado, pois as atualizações corrigem os buracos de segurança que o malware usa para entrar.")
    },

    'redes': {
        titulo: gettext("Segurança de Redes, VPN e Criptografia"),
        icon: '🌐',
        texto: gettext(`
            A Internet é uma rede pública. Sem proteção, os teus dados viajam como "postais abertos" que qualquer pessoa no caminho pode ler. A segurança de redes foca-se em criar túneis privados e cifrar a informação.
            <br><br><b>Criptografia SSL/TLS (HTTPS):</b> Quando vês o cadeado verde, os dados entre ti e o servidor estão cifrados. No entanto, o HTTPS protege os dados, mas não esconde a que site te estás a ligar.
            <br><br><b>O Papel Vital da VPN:</b> Uma Virtual Private Network cria um túnel encriptado entre o teu dispositivo e um servidor seguro. Isto tem três benefícios:
            <ol>
                <li><b>Segurança em Wi-Fi Público:</b> Protege-te de ataques "Man-in-the-Middle" em cafés ou aeroportos.</li>
                <li><b>Anonimato de IP:</b> Esconde a tua localização geográfica real e o teu endereço IP dos sites que visitas.</li>
                <li><b>Contornar Censura:</b> Permite aceder a conteúdos bloqueados na tua região.</li>
            </ol>
            <br><b>Segurança de Wi-Fi Doméstico:</b> O teu router é a porta de entrada da tua casa. Protocolos antigos como WEP ou WPA podem ser quebrados em minutos. Utiliza sempre WPA2-AES ou WPA3 com uma password longa. Desativa o WPS (Wi-Fi Protected Setup), pois é uma falha de segurança conhecida.
        `),
        dica: gettext("Evita fazer login em contas bancárias ou introduzir cartões de crédito quando estiveres ligado a redes Wi-Fi públicas sem o uso de uma VPN confiável.")
    },

    'dispositivos': {
        titulo: gettext("Proteção de Dispositivos e Higiene Digital"),
        icon: '💻',
        texto: gettext(`
            A segurança física e a manutenção lógica dos teus aparelhos são a base da tua defesa. Se um atacante tiver acesso físico ao teu telemóvel ou portátil desprotegido, a maioria das defesas digitais pode ser contornada rapidamente.
            <br><br><b>A Regra de Ouro dos Backups (3-2-1):</b>
            Ter os teus ficheiros apenas no computador é um risco enorme (avaria, roubo ou ransomware). Deves seguir a estratégia:
            <ul>
                <li><b>3</b> Cópias de tudo o que é importante.</li>
                <li><b>2</b> Formatos diferentes (ex: um disco rígido externo e uma conta na Nuvem).</li>
                <li><b>1</b> Cópia fora do local habitual (ex: em casa de um familiar ou numa cloud cifrada) para prevenir desastres físicos como incêndios.</li>
            </ul>
            <br><b>Segurança de Hardware:</b>
            <ul>
                <li><b>Criptografia de Disco:</b> Ativa o BitLocker (Windows) ou FileVault (macOS). Se o teu portátil for roubado, os dados serão ilegíveis sem a tua senha de login.</li>
                <li><b>Iot (Internet das Coisas):</b> Lâmpadas inteligentes, câmaras IP e frigoríficos ligados à rede são frequentemente os elos mais fracos da rede doméstica por terem software desatualizado.</li>
            </ul>
            <br><b>Higiene Digital:</b> Remove aplicações que já não usas. Elas acumulam cache, podem ter permissões excessivas e tornam-se portas de entrada se o desenvolvedor abandonar as atualizações de segurança.
        `),
        dica: gettext("Tapa a tua webcam com um protetor físico. Além disso, desliga o Bluetooth e o Wi-Fi quando não estiverem em uso para reduzir a superfície de ataque do teu telemóvel em locais públicos.")
    }
};

function mostrarTema(idTema) {
    const info = baseConhecimento[idTema];
    const container = document.getElementById('conteudo-dinamico');

    if (info) {
        container.innerHTML = `
            <article class="doc-card tema-conteudo">
                <div class="card-icon">${info.icon}</div>
                <h2>${info.titulo}</h2>
                <p>${info.texto}</p>
                <div class="dica-box">
                    <strong>Dica:</strong> ${info.dica}
                </div>
            </article>
        `;
        
       
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
    window.scrollTo({ top: 0, behavior: 'smooth' });


    const botoesNav = document.querySelectorAll('.header-nav .btn-dashboard');
    const botaoEmergencia = document.querySelector('.btn-emergencia-dashboard');
    
    let alvo = null;

    if (tipo === 'quiz') alvo = botoesNav[1];
    if (tipo === 'simulador') alvo = botoesNav[2];
    
   
    if (tipo === 'aprender') alvo = botaoEmergencia;

    if (alvo) {

        botoesNav.forEach(b => b.classList.remove('piscar-alerta'));
        if (botaoEmergencia) botaoEmergencia.classList.remove('piscar-alerta');
        
     
        setTimeout(() => {
            alvo.classList.add('piscar-alerta');
            
            setTimeout(() => {
                alvo.classList.remove('piscar-alerta');
            }, 5000);
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