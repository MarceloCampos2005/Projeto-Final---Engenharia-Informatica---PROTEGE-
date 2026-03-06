//Nesta funcao ao fazer o logout os filtros sao atualizados para o defaul para o proximo utilizador nao entrar com os filtros do outro
function fazerLogout(logoutUrl) {
    // Limpar localStorage
    localStorage.removeItem('modoDaltonismo');
    localStorage.removeItem('modoContraste');
    
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    document.body.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    
    console.log('✓ Filtros limpos. Redirecionando...');
    
    if (!logoutUrl) {
        logoutUrl = '/logout/';
    }
    
    // Redireciona para logout
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
    if (tipo !== 'normal') document.body.classList.add(tipo);
    
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
    if (tipo !== 'normal') document.body.classList.add(tipo);
    
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
    //ver se ta autenticado
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    
    if (isAuthenticated) {
        localStorage.removeItem('modoDaltonismo');
        localStorage.removeItem('modoContraste');
    } else {
        const daltSalvo = localStorage.getItem('modoDaltonismo');
        if (daltSalvo && daltSalvo !== 'normal') {
            document.body.classList.add(daltSalvo);
        }
        const contSalvo = localStorage.getItem('modoContraste');
        if (contSalvo && contSalvo !== 'normal') {
            document.body.classList.add(contSalvo);
        }
    }

    //liga o botao do avatar ao meno do perfil
    const avatarBtn = document.getElementById('btn-avatar-trigger');
    if (avatarBtn) {
        console.log('avatarBtn found, attaching listener');
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('avatarBtn clicked');
            PerfilMenu();
        });
    } else {
        console.log('avatarBtn NOT found on DOMContentLoaded');
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
            O Phishing é a tentativa de obter informações sensíveis através de comunicações eletrónicas fraudulentas. 
            <br><br><b>Como funciona:</b> O atacante utiliza "iscos" (mensagens urgentes, prémios falsos, alertas de segurança) para manipular psicologicamente a vítima.
            <br><br><b>Tipos Comuns:</b>
            <ul>
                <li><b>Smishing (SMS):</b> Mensagens que parecem vir de bancos ou transportadoras (ex: CTT) com links para sites clonados.</li>
                <li><b>Vishing (Voz):</b> Chamadas telefónicas onde o burlão finge ser de um suporte técnico (ex: Microsoft) para obter acesso remoto ao PC.</li>
                <li><b>Spear Phishing:</b> Ataques ultra-personalizados dirigidos a uma pessoa específica, usando o seu nome e cargo.</li>
                <li><b>Whaling:</b> Ataques de phishing dirigidos a altos executivos (CEOs).</li>
            </ul>
            <br><b>Sinais de Alerta:</b> Erros gramaticais, remetentes estranhos (ex: info@banco123.com em vez do oficial) e pedidos de dados que o banco nunca pediria por e-mail.
        `),
        dica: gettext("Passa o rato sobre qualquer link antes de clicar para ver o destino real no canto do navegador.")
    },

    'senhas': {
        titulo: gettext("Gestão de Identidade e Senhas"),
        icon: '🔑',
        texto: gettext(`
            As passwords são a primeira linha de defesa, mas são também o elo mais fraco se forem previsíveis.
            <br><br><b>O que torna uma password forte?</b>
            <ul>
                <li><b>Comprimento:</b> Mínimo de 12 a 16 caracteres.</li>
                <li><b>Variedade:</b> Mistura de maiúsculas, minúsculas, números e símbolos (!@#$).</li>
                <li><b>Imprevisibilidade:</b> Evitar datas de nascimento, nomes de familiares ou sequências como '12345'.</li>
            </ul>
            <br><b>A Solução Moderna:</b> Em vez de memorizar 50 passwords, utiliza um <b>Gestor de Passwords</b> (ex: Bitwarden ou 1Password). Estes programas criam passwords aleatórias e únicas para cada site e guardam-nas num cofre cifrado.
            <br><br><b>Ataques comuns:</b> <i>Brute Force</i> (tentar milhares de combinações) e <i>Credential Stuffing</i> (usar uma password roubada de um site para tentar entrar em todos os outros).
        `),
        dica: gettext("Usa 'Passphrases': frases longas com espaços ou símbolos (ex: 'O.Meu.Gato.Gosta.De.Pizza!'). São quase impossíveis de quebrar.")
    },

    'mfa': {
        titulo: gettext("Autenticação Multi-Fator (MFA/2FA)"),
        icon: '📱',
        texto: gettext(`
            O MFA garante que, mesmo que um hacker descubra a tua password, ele continue sem acesso à tua conta.
            <br><br><b>As Três Categorias de Autenticação:</b>
            <ol>
                <li><b>Algo que sabes:</b> Password ou PIN.</li>
                <li><b>Algo que tens:</b> Telemóvel (App de autenticação) ou chave física (Yubikey).</li>
                <li><b>Algo que és:</b> Biometria (Impressão digital ou reconhecimento facial).</li>
            </ol>
            <br><b>Níveis de Segurança:</b>
            <ul>
                <li><b>SMS (Menos Seguro):</b> Os códigos podem ser intercetados através de 'SIM Swapping'.</li>
                <li><b>Apps de Autenticação (Recomendado):</b> Google Authenticator ou Microsoft Authenticator (geram códigos temporários offline).</li>
                <li><b>Chaves Físicas (Mais Seguro):</b> Dispositivos USB que requerem um toque físico para autorizar o login.</li>
            </ul>
        `),
        dica: gettext("Ativa o MFA obrigatoriamente no teu E-mail principal, pois ele é a 'chave mestre' para recuperar todas as outras contas.")
    },

    'privacidade': {
        titulo: gettext("Privacidade, Cookies e Pegada Digital"),
        icon: '📍',
        texto: gettext(`
            A privacidade online trata-se do controlo sobre quem tem acesso aos teus dados e como são usados.
            <br><br><b>Pegada Digital:</b> Tudo o que publicas (fotos, check-ins, comentários) fica registado permanentemente. Hackers usam isto para ataques de Engenharia Social.
            <br><br><b>O perigo dos Cookies:</b>
            <ul>
                <li><b>Cookies de Sessão:</b> Úteis para manter o login ativo.</li>
                <li><b>Cookies de Rastreamento (Terceiros):</b> Usados por redes de publicidade para criar um perfil dos teus hábitos de navegação.</li>
            </ul>
            <br><b>Geolocalização:</b> Muitas fotos contêm metadados (EXIF) que revelam as coordenadas GPS exatas de onde foram tiradas. Partilhar a localização em tempo real permite que estranhos saibam quando a tua casa está vazia.
        `),
        dica: gettext("Lê sempre as permissões das Apps: se uma calculadora pede acesso aos teus contactos e localização, desinstala-a imediatamente.")
    },

    'malware': {
        titulo: gettext("Malware: O Software Malicioso"),
        icon: '🦠',
        texto: gettext(`
            Malware é um termo genérico para qualquer software desenhado para causar danos ou roubar dados.
            <br><br><b>As Ameaças mais Perigosas:</b>
            <ul>
                <li><b>Ransomware:</b> Encripta os teus ficheiros e exige um pagamento (resgate) em Bitcoin. Nunca pagues, pois não há garantia de devolução.</li>
                <li><b>Spyware & Keyloggers:</b> Software invisível que regista tudo o que escreves (incluindo passwords bancárias) e tira prints do teu ecrã.</li>
                <li><b>Trojans:</b> Programas que parecem legítimos (ex: um jogo grátis) mas que instalam um 'Backdoor' para o atacante controlar o teu PC.</li>
                <li><b>Botnets:</b> Uma rede de PCs infetados ('zombies') usados para atacar sites do governo ou empresas (ataques DDoS).</li>
            </ul>
        `),
        dica: gettext("Utiliza um Antivírus atualizado e nunca ligues Pens USB encontradas na rua (podem executar scripts maliciosos instantaneamente).")
    },

    'redes': {
        titulo: gettext("Segurança de Redes, VPN e Criptografia"),
        icon: '🌐',
        texto: gettext(`
            Como os teus dados viajam pela Internet define se podem ser roubados a meio do caminho.
            <br><br><b>Criptografia SSL/TLS (HTTPS):</b> Quando vês o cadeado no browser, os teus dados estão "embrulhados" numa cifra que só o site destino consegue ler. 
            <br><br><b>Os Riscos do Wi-Fi Público:</b> Em redes de cafés ou aeroportos, um atacante pode realizar um ataque <i>'Man-in-the-Middle'</i>, intercetando todo o teu tráfego.
            <br><br><b>O papel da VPN:</b> Uma Virtual Private Network cria um túnel cifrado entre ti e a Internet, escondendo o teu endereço IP e protegendo os dados mesmo em redes inseguras.
            <br><br><b>Firewall:</b> Atua como um filtro que decide que ligações podem entrar ou sair do teu dispositivo, bloqueando acessos não autorizados.
        `),
        dica: gettext("Protocolos de Wi-Fi: Prefere sempre WPA3 ou WPA2. Evita o protocolo WEP, pois pode ser quebrado em poucos minutos.")
    },

    'dispositivos': {
        titulo: gettext("Proteção de Dispositivos e Manutenção"),
        icon: '💻',
        texto: gettext(`
            A segurança física e lógica do teu hardware é a base de tudo.
            <br><br><b>Atualizações de Software:</b> Não servem apenas para novas funcionalidades. Elas trazem 'Patches' de segurança que corrigem vulnerabilidades que os hackers já conhecem.
            <br><br><b>A Regra de Backup 3-2-1:</b>
            <ul>
                <li><b>3</b> Cópias dos teus dados importantes.</li>
                <li><b>2</b> Tipos de suporte diferentes (ex: Disco Externo e Nuvem).</li>
                <li><b>1</b> Cópia fora de casa (para o caso de incêndio ou roubo).</li>
            </ul>
            <br><b>Segurança Móvel:</b> Evita fazer 'Root' (Android) ou 'Jailbreak' (iOS). Estes processos removem as restrições de segurança do fabricante, permitindo que qualquer malware tome controlo total do sistema.
        `),
        dica: gettext("Tapa a tua webcam com um protetor físico. Muitos malwares ativam a câmara sem acender a luz indicadora.")
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