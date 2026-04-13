from gettext import translation
import os
import time
import random
from django.utils import timezone
from datetime import timedelta
from urllib import response
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from urllib3 import request
from users.views import perfil
from .models import QuizPergunta, OpcaoPergunta, ResultadoQuiz, HistoricoQuiz, ResultadoSimulador
from django.utils import translation
from django.conf import settings
import json
from django_otp import user_has_device
from django.views.decorators.vary import vary_on_cookie
from .models import emails
from users.models import Conquista, Perfil
from django.views.decorators.http import require_POST
from dotenv import load_dotenv
from openai import OpenAI
from django.views.decorators.cache import never_cache

load_dotenv(override=True)

#verifica se o utilizador tem login feito, se tiver vai ao perfil dele ver qual a lingua guardada e ativa, senao tenta ler um cookie da sessao
#o translation.activate(lang) faz com que o django use o ficheiro .po para a lingua
@never_cache
@vary_on_cookie # Evita que o browser mostre a versão em cache da língua errada
def home2(request):
    #Definir a língua padrão 
    lang = 'pt'
    hoje = timezone.now().date()
    mfa_ativo = False
    xp_ganho = 0
    
    if request.user.is_authenticated:


        perfil, created = Perfil.objects.get_or_create(user=request.user)
        lang = perfil.lingua
        nivel_antigo = perfil.nivel_geral
        #Atualizar a sessão se ela estiver diferente do perfil
        if request.session.get(settings.LANGUAGE_COOKIE_NAME) != lang:
            request.session[settings.LANGUAGE_COOKIE_NAME] = lang
            request.session['_language'] = lang

        

        if perfil.ultima_recompensa != hoje:
            ontem = hoje - timedelta(days=1)
            
            #ATUALIZAR A CHAMA
            if perfil.ultima_recompensa == ontem:
                perfil.streak_atual += 1
            else:
                perfil.streak_atual = 1

            if perfil.streak_atual > perfil.streak_maximo:
                perfil.streak_maximo = perfil.streak_atual
            
            if perfil.streak_maximo == 30:
                    msg += "Streak de 30 Completa! Desbloqueaste a Moldura Elite! Vai ao teu Perfil para a equipares."

            #DAR DICA 
            if perfil.streak_atual % 2 == 0:
                perfil.dicas_disponiveis += 1
                msg += f"Streak de {perfil.streak_atual} dias! Ganhaste +1 Dica."
            
            
            #Marco de 15 dias
            if perfil.streak_atual == 15:
                try:
                    m15 = Conquista.objects.get(codigo='streak_15')
                    if m15 not in perfil.conquistas.all():
                        perfil.conquistas.add(m15)
                        msg += f"Ganhaste a medalha: {m15.nome}!"
                except Conquista.DoesNotExist: 
                    pass

            messages.success(request, msg)
            perfil.ultima_recompensa = hoje

    #para saber se a data é de hoje ou ontem
        hoje_str = str(hoje)
        if request.session.get('data_referencia') != hoje_str:
            request.session['xp_inicial']=perfil.pontuacao_total_quiz
            request.session['data_referencia'] = hoje_str


        xp_inicial = request.session.get('xp_inicial', perfil.pontuacao_total_quiz)
        xp_ganho= perfil.pontuacao_total_quiz - xp_inicial

        if xp_ganho < 0:
            xp_ganho = perfil.pontuacao_total_quiz
            request.session['xp_inicial'] = 0
        
        #Verifica se o utilizador tem o dispositivo MFA configurado
        mfa_ativo = user_has_device(request.user)
        
        if mfa_ativo:
            try:
                #tenta encontrar a medalha
                medalha_mfa = Conquista.objects.get(codigo='mfa_ativo')
                #ve se o utilizador já tem esta medalha
                ja_tem_medalha = perfil.conquistas.filter(id=medalha_mfa.id).exists()
                if not ja_tem_medalha:
                    perfil.conquistas.add(medalha_mfa)
                    
                    perfil.xp_geral += 50 
                    
                    messages.success(request, f"CONQUISTA DESBLOQUEADA: {medalha_mfa.nome}! Ganhaste 50 XP de bónus por protegeres a tua conta.")
                
            except Conquista.DoesNotExist:
                print("Aviso: Criar medalha com código 'mfa_ativo' no Painel Admin!")


        #preciso de atualizar o nivel na home2 se o utilizador subir com os 50 pontos do mfa
        xp_necessario = perfil.nivel_geral * 100
        while perfil.xp_geral >= xp_necessario:
            perfil.xp_geral -= xp_necessario
            perfil.nivel_geral += 1  
            xp_necessario = perfil.nivel_geral * 100

        #o utilizador pode subir de nivel com o xp de ativar o mfa
        if nivel_antigo < 10 and perfil.nivel_geral >= 10:
            messages.success(request, "DESBLOQUEASTE: Moldura Néon Hacker de Elite! Vai ao teu Perfil para a equipares.")
        
        elif nivel_antigo < 5 and perfil.nivel_geral >= 5:
            messages.success(request, "DESBLOQUEASTE: Moldura de Ouro! Vai ao teu Perfil para a equipares.")
                
        perfil.save()   
        
    else:
        # Se NÃO estiver logado
        lang = request.session.get(settings.LANGUAGE_COOKIE_NAME, 'pt')
        
    translation.activate(lang)
             
    response = render(request, 'atividades/home2.html', {
        'mfa_ativo': mfa_ativo,
        'xp_ganho': xp_ganho,
        'meta':30
    })
    
    return response

@login_required
@require_http_methods(["POST"])
def atualizar_filtros_acessibilidade(request):
    
    #recebe os dados que vem do js    
    try:
        data = json.loads(request.body)
        tipo = data.get('tipo')  # 'daltonismo' ou 'contraste'
        valor = data.get('valor')
        
        perfil = request.user.perfil
        
        #depois de identificar o perfil, vai ser atualizado o contraste ou daltonismo na bd
        if tipo == 'daltonismo':
            perfil.filtro_daltonismo = valor
        elif tipo == 'contraste':
            perfil.filtro_contraste = valor
        
        perfil.save()#guarda na bd

        #caso de erro envia uma mensagem para o js
        return JsonResponse({'status': 'sucesso', 'mensagem': 'Filtros atualizados com sucesso'})
    except Exception as e:
        return JsonResponse({'status': 'erro', 'mensagem': str(e)}, status=400)


#aqui e pa receber os dados que o utilizador escolhe no formulario e preparar e filtrar o quiz
@login_required
def preparar_quiz(request):
    if request.method == 'POST':
        modo = request.POST.get('modo_jogo')
        temas = request.POST.getlist('temas')

        #apaga tudo para comecar um novo quiz
        for x in ['quiz_indice', 'pergunta_atual', 'pontuacao', 'respostas_utilizador', 'quiz_bonus_xp']:
            if x in request.session:
                del request.session[x]
        
        lingua = request.user.perfil.lingua
        nivel = request.user.perfil.nivel_quiz

        #buscar as perguntas, o quiz bonus da 2xp se for escolhido o modo aleatorio
        if modo == 'aleatorio':
            request.session['quiz_bonus_xp'] = True
            perguntas = list(QuizPergunta.objects.filter(lingua=lingua, nivel_dificuldade=request.user.perfil.nivel_quiz))
        else:
            request.session['quiz_bonus_xp'] = False




            if temas:
                perguntas = list(QuizPergunta.objects.filter(lingua=lingua, nivel_dificuldade=request.user.perfil.nivel_quiz,tema__in =temas))
            else:
                messages.error(request,'Tens de selecionar um tema')
                return redirect('atividades:quiz_setup')
            
        #ve se ha perguntas
        if not perguntas:
            messages.error(request,"Nao ha perguntas suficientes")
            return render('atividades:quiz_setup')
                
        #sleciona 7 perguntas do nivel do utulizador e guardo o id delas 
        indice = [p.id for p in random.sample(perguntas, min(len(perguntas), 7))]
        request.session['quiz_indice'] = indice
        request.session['pergunta_atual'] = 0
        request.session['pontuacao'] = 0
        request.session['respostas_utilizador'] = []
        request.session.modified = True

        return redirect('atividades:quiz')
        
    return redirect('atividades:quiz_setup')


@login_required
def quiz(request):
    lang = request.session.get('django_language', 'pt')
    translation.activate(lang)
    
    #se nao houver indice na sessao, vai a bd buscar perguntas do nivel do utilizador
    if 'quiz_indice' not in request.session:
        return redirect('atividades:quiz_setup')
        
    indice = request.session['quiz_indice']
    atual = request.session['pergunta_atual']
    
    #quando chega a utlima pergunta manda pa pagina final
    if atual >= len(indice):
        return redirect('atividades:quiz_final')
    

    #vai buscar a pergunta e as ocoes para a resposta
    pergunta = QuizPergunta.objects.get(id=indice[atual])
    opcoes = pergunta.opcoes.all().order_by('id') 
    perfil = request.user.perfil
    dica_revelada = request.session.pop('dica_revelada', False)
    
    
    mostrar_intro = False
    if atual == 0:
        # Garante que só mostra 1 vez por quiz e NÃO mostra se a dica foi pedida
        if request.session.get('intro_visto_quiz') != indice[0] and not dica_revelada:
            mostrar_intro = True
            request.session['intro_visto_quiz'] = indice[0]

    #o que vai ser mostrado no html
    #popup false porque so e para a parecer depois de clicar na resposta
    context = {
        'pergunta': pergunta,
        'opcoes': opcoes,
        'numero': atual + 1,
        'total': len(indice),
        'mostrar_popup': False,
        'tema_da_pergunta': pergunta.tema,
        'dica_revelada': dica_revelada,
        'mostrar_intro': mostrar_intro,
    }


    if request.method == 'POST':
        resposta_letra = request.POST.get('resposta')

        #ve o resultado do post e compara com a resposta que e correta
        
        #mete as respostas numa lista pa depois mostrar
        respostas = request.session.get('respostas_utilizador', [])
        if request.POST.get('pedir_dica') == '1':
            if perfil.dicas_disponiveis > 0:
                perfil.dicas_disponiveis -= 1
                perfil.save()
                # Avisa a página para mostrar a dica e recarrega
                request.session['dica_revelada'] = True
            else:
                messages.error(request, "Não tens dicas suficientes! Volta amanhã.")
            return redirect('atividades:quiz')
        
        resposta_letra = request.POST.get('resposta')
        esta_correto = (resposta_letra == pergunta.resposta_correta)

        respostas.append({
            'pergunta': pergunta.id,
            'resposta_dada': resposta_letra,
            'correta': esta_correto
        })
        request.session['respostas_utilizador'] = respostas

        #se acertar aumenta a pontuacao
        if esta_correto:
            request.session['pontuacao'] += 1
        
        if esta_correto:
            #se acertar soma 1 à sequência de perguntas
            perfil.perguntas_consecutivas += 1
            
            # Se chegou às 7, dá a medalha
            if perfil.perguntas_consecutivas >= 7:
                try:
                    #aqui ve se o utilizador ja tem a medalha
                    medalha_7 = Conquista.objects.get(codigo='7_seguidas')
                    if medalha_7 not in perfil.conquistas.all():
                        perfil.conquistas.add(medalha_7)
                        messages.success(request, f"Estás imparável! Ganhaste a medalha: {medalha_7.nome}!")
                except Conquista.DoesNotExist:
                    pass
        else:
            
            perfil.perguntas_consecutivas = 0
            
        

        #mete o popup a mostrar a explicacao e se ta correto ou errado depois de carregar no botao de resposta
        context.update({
            'mostrar_popup': True,
            'esta_correto': esta_correto,
            'explicacao': pergunta.explicacao,
            'tema_da_pergunta': pergunta.tema
        })

        #salva a sessao na bd
        request.session.modified = True

    return render(request, 'atividades/quiz.html', context)



@login_required
def proximo_passo(request):

    #ve se a pergunta ta na sessao se sim aumenta 1 na pergunta para mostrar a proxima
    if 'pergunta_atual' in request.session:
        request.session['pergunta_atual'] += 1
        request.session.modified = True 

        #quando ta na ultima pergunta manda para a pagina final
        if request.session['pergunta_atual'] >= len(request.session['quiz_indice']):
            return redirect('atividades:quiz_final')

    return redirect('atividades:quiz')





@login_required
def quiz_final(request):
    #vai gravar os dados na bd 
    if 'quiz_indice' not in request.session:
        return redirect('atividades:home2')
    
    
    pontos = request.session['pontuacao'] #pontos do quiz
    total = len(request.session['quiz_indice'])#perguntas do quiz
    percentagem = (pontos / total) * 100

    resultado = ResultadoQuiz.objects.create(
        perfil = request.user.perfil,
        nivel = request.user.perfil.nivel_quiz,
        pontuacao = pontos,
        total_perguntas = total,
        percentagem = percentagem
    )

    #Grava o historico do quiz
    for item in request.session['respostas_utilizador']:
        HistoricoQuiz.objects.create(
            resultado_quiz = resultado,
            pergunta_id = item['pergunta'],
            escolha_utilizador = item['resposta_dada'],
            foi_correta = item['correta']
        )

    #aumenta o numero de quizzes feitos
    perfil = request.user.perfil
    nivel_antigo = perfil.nivel_geral

    perfil.quizzes_realizados += 1

    #aumenta a soma das percentagens que serve para calcular a media de acertos
    perfil.soma_percentagens += percentagem

    #o subiu so vai para true se o utilizador passar de 30 pontos
    subiu  = False

    perfil.pontuacao_total_quiz += pontos
    

    xp_ganho = pontos * 7 
    perfil.xp_geral += xp_ganho


    #adiciona +2xp se o utilizador escolher o modo aleatorio
    if request.session.get('quiz_bonus_xp', False):
        perfil.pontuacao_total_quiz += 2
        perfil.xp_geral += 2


    subiu_geral = False

    while True:
        meta_atual_quiz = perfil.nivel_quiz * 30 
        if perfil.pontuacao_total_quiz >= meta_atual_quiz:
            perfil.pontuacao_total_quiz -= meta_atual_quiz
            perfil.nivel_quiz += 1
            subiu = True
        else:
            break

    subiu_geral = False
    while True:
        meta_atual_geral = perfil.nivel_geral * 100
        if perfil.xp_geral >= meta_atual_geral:
            perfil.xp_geral -= meta_atual_geral
            perfil.nivel_geral += 1
            subiu_geral = True
        else:
            break
    

    
    xp_necessario = perfil.nivel_geral * 100

   

    if nivel_antigo < 10 and perfil.nivel_geral >= 10:
        messages.success(request, "DESBLOQUEASTE: Moldura Néon Hacker de Elite! Vai ao teu Perfil para a equipares.")
        
    elif nivel_antigo < 5 and perfil.nivel_geral >= 5:
        messages.success(request, "DESBLOQUEASTE: Moldura de Ouro! Vai ao teu Perfil para a equipares.")

    if percentagem == 100:
        perfil.quizzes_perfeitos_consecutivos += 1
        
        if perfil.quizzes_perfeitos_consecutivos >= 10:
            try:
                medalha = Conquista.objects.get(codigo='quiz_perfeito_10')
                if medalha not in perfil.conquistas.all():
                    perfil.conquistas.add(medalha)
                    messages.success(request, f"INCRÍVEL! Ganhaste a medalha: {medalha.nome}!")
            except Conquista.DoesNotExist:
                pass
    else:
        perfil.quizzes_perfeitos_consecutivos = 0


    perfil.save()

    #limpa a  para depois comecar na pergunta 1 e com pontuacao 0 e respostas vazias
    del request.session['quiz_indice']
    del request.session['pergunta_atual']
    del request.session['pontuacao']
    del request.session['respostas_utilizador']
    del request.session['quiz_bonus_xp']

    #vai mostar no html 
    return render(request, 'atividades/quiz_final.html',{
        'pontos': pontos,
        'total': total,
        'resultado': resultado,
        'xp_atual': perfil.pontuacao_total_quiz,
        'nivel_atual': perfil.nivel_quiz,
        'subiu': subiu,

        'subiu_geral': subiu_geral,
        'xp_ganho': xp_ganho,
        'nivel_geral': perfil.nivel_geral,
        'xp_geral_atual': perfil.xp_geral,
        'xp_para_proximo': xp_necessario
    })






@login_required
def historico_atividades(request):
    #vai buscar os resultados do quiz do utilizadore ordenados pela data
    resultados = ResultadoQuiz.objects.filter(perfil=request.user.perfil).order_by('-data_conclusao')
    resultados_simulador = ResultadoSimulador.objects.filter(perfil=request.user.perfil).order_by('-data_conclusao')
    
    return render(request, 'atividades/historico.html', {
        'resultados': resultados,
        'simuladores': resultados_simulador
    })





@login_required
def detalhe_historico(request, resultado_id):
    #procura o resultado garantindo que pertence ao utilizador atual
    resultado = ResultadoQuiz.objects.get(id=resultado_id, perfil=request.user.perfil)
    
    #todas as respostas do quiz
    respostas = resultado.detalhes.all()

    #e para mostrar as repostas e corretas no hsitorico mas escritas, ele vai buscar o texto das opcoes
    for item in respostas:
        item.texto_escolha = item.pergunta.opcoes.filter(letra=item.escolha_utilizador).first()
        item.texto_correta = item.pergunta.opcoes.filter(letra=item.pergunta.resposta_correta).first()
    
    return render(request, 'atividades/detalhe_historico.html', {
        'resultado': resultado,
        'respostas': respostas
    })

from .models import ResultadoSimulador

@login_required
def detalhe_simulador(request, resultado_id):
    resultado = ResultadoSimulador.objects.get(id=resultado_id, perfil=request.user.perfil)
    
    return render(request, 'atividades/detalhe_simulador.html', {
        'resultado': resultado
    })
    
    
@login_required
def simulador_setup(request):
    return render(request, 'atividades/simulador_setup.html')

#meter o utilizador a poder escolher se quer analisar email ou detetar o phishing
@login_required
def preparar_simulador(request):
    
    if request.method == 'POST':
            modo = request.POST.get('modo_simulador')
            quantidade = int(request.POST.get('num_emails',5))
            tempo = request.POST.get('com_tempo') == 'on'


            lingua = request.user.perfil.lingua
            nivel = request.user.perfil.nivel_simulador

            #vai buscar os emails
            lista_emails = list(emails.objects.filter(lingua=lingua, nivel_dificuldade__lte = nivel))

            if not lista_emails:
                messages.error(request,"Não ha simuladores para o seu nivel!")
                return redirect('atividades:simulador_setup')
                
            num_final = min(len(lista_emails), quantidade)

            selecionados = [e.id for e in random.sample(lista_emails, num_final)]
            request.session['sim_indice'] = selecionados
            request.session['sim_atual'] = 0
            request.session['sim_pontuacao'] = 0
            request.session['sim_modo'] = modo
            request.session['sim_timer'] = tempo

            return redirect('atividades:simulador')

    return redirect('atividades:simulador_setup')


@login_required
def simulador(request):
    #ve se a lista foi criada
    if 'sim_indice' not in request.session:
        return redirect('atividades:simulador_setup')
    
    indice = request.session['sim_indice']
    atual = request.session['sim_atual']

    #se ja jogou os emails todos vai para o fim
    if atual >= len(indice):
        return redirect('atividades:simulador_final')
        

    # Escolhe um e-mail aleatoriamente
    email_atual = emails.objects.get(id = indice[atual])
    
    modo = request.session.get('sim_modo', 'detetive')
    tempo = request.session.get('sim_timer',False)



    context = {
        'email': email_atual,
        'numero': atual + 1,
        'total':len(indice),
        'modo':modo,
        'timer': tempo
    }

    if modo =='rapido':
        return render (request, 'atividades/simulador_escolha.html',context)
    else:
        return render (request, 'atividades/simulador.html',context)

@login_required
def simulador_final(request):
    if request.method != 'POST' or 'sim_indice' not in request.session:
        return redirect('atividades:home2')

    indice = request.session.get('sim_indice', [])
    atual = request.session.get('sim_atual', 0)

    #Avaliar o email atual antes de avançar
    email_jogado = emails.objects.get(id=indice[atual])
    acertos = int(request.POST.get('acertos', 0))
    modo = request.session.get('sim_modo', 'detetive')

    total_pistas_real = email_jogado.total_armadilhas + (2 if email_jogado.e_phishing else 0)
    
    if modo == 'rapido':
        tipo_sim = 'classificacao'
        foi_sucesso = (acertos >= total_pistas_real) if total_pistas_real > 0 else True
    else:
        tipo_sim = 'identificacao'
        # No modo detetive, acertou se encontrou todas as armadilhas
        foi_sucesso = (acertos == email_jogado.total_armadilhas) if email_jogado.e_phishing else True
        
        
    ResultadoSimulador.objects.create(
        perfil=request.user.perfil,
        email=email_jogado,
        tipo_simulacao=tipo_sim,
        acertou=foi_sucesso,
        armadilhas_encontradas=acertos if tipo_sim == 'identificacao' else 0
    )
    
    if total_pistas_real > 0:
        precisao_atual = (acertos / total_pistas_real) * 100
    else:
        precisao_atual = 100.0

    if precisao_atual == 100:
        pontos = 10
    elif precisao_atual >= 70:
        pontos = 5
    elif precisao_atual >= 0:
        pontos = 1
    else:
        pontos = 0

    #Acumula na sessão
    request.session['sim_pontuacao'] = request.session.get('sim_pontuacao', 0) + pontos
    request.session['sim_soma_precisao'] = request.session.get('sim_soma_precisao', 0) + precisao_atual

    #Avança para o proximo e-mail
    request.session['sim_atual'] += 1
    novo_atual = request.session['sim_atual']

    if novo_atual < len(indice):
        return redirect('atividades:simulador')

    perfil = request.user.perfil
    quantidade_emails = len(indice)
    pontos_totais = request.session.get('sim_pontuacao', 0)
    media_precisao = request.session.get('sim_soma_precisao', 0) / quantidade_emails
    nivel_antigo = perfil.nivel_geral

    # Atualizar Perfil
    perfil.simuladores_realizados += quantidade_emails
    perfil.soma_percentagens_simulador += media_precisao
    perfil.pontuacao_total_simulador += pontos_totais
    
    subiu = False
    pontos_necessarios = perfil.nivel_simulador * 30


    while perfil.pontuacao_total_simulador >= pontos_necessarios:
        perfil.pontuacao_total_simulador -= pontos_necessarios
        perfil.nivel_simulador += 1
        subiu = True


        pontos_necessarios = perfil.nivel_simulador * 30

    xp_geral_ganho = pontos_totais * 3 
    perfil.xp_geral += xp_geral_ganho
    subiu_geral = False
    
    xp_necessario = perfil.nivel_geral * 100
    while perfil.xp_geral >= xp_necessario:
        perfil.xp_geral -= xp_necessario
        perfil.nivel_geral += 1
        subiu_geral = True
        xp_necessario = perfil.nivel_geral * 100

    

    if nivel_antigo < 10 and perfil.nivel_geral >= 10:
        messages.success(request, "DESBLOQUEASTE: Moldura Néon Hacker de Elite! Vai ao teu Perfil para a equipares.")
        
    elif nivel_antigo < 5 and perfil.nivel_geral >= 5:
        messages.success(request, "DESBLOQUEASTE: Moldura de Ouro! Vai ao teu Perfil para a equipares.")
    
    perfil.save()
    emails_jogados = emails.objects.filter(id__in=indice)
    modo_jogado = request.session.get('sim_modo', 'detetive')
    
    context = {
        'pontos_totais': pontos_totais,
        'xp_geral_ganho': xp_geral_ganho,
        'media_precisao': round(media_precisao, 1),
        'quantidade_emails': quantidade_emails,
        'xp_atual': perfil.pontuacao_total_simulador,
        'nivel_atual': perfil.nivel_simulador,
        'subiu': subiu,
        'subiu_geral': subiu_geral,
        'nivel_geral': perfil.nivel_geral,
        'emails_jogados': emails_jogados,
        'modo': modo_jogado,
        'xp_necessario':pontos_necessarios
    }

    # Limpa a sessão no final de tudo
    x = ['sim_indice', 'sim_atual', 'sim_pontuacao', 'sim_soma_precisao', 'sim_modo', 'sim_timer']
    for chave in x:
        if chave in request.session:
            del request.session[chave]

    return render(request, 'atividades/simulador_final.html', context)

#aqui ativa a traducao na pagina do guia_emergencia
def guia_emergencia(request):
    lang = request.session.get('django_language', 'pt')
    translation.activate(lang)
    return render(request, 'atividades/guia_emergencia.html')


#vai ser uasdo ao carregar no botao pt en
@login_required
def mudar_lingua(request, lang_code):
     
     #guarda no perfil do utilizador a lingua escolhida
    if lang_code in ['pt', 'en']:
        perfil = request.user.perfil
        perfil.lingua = lang_code
        perfil.save()

        # ativar a lingua na sessao atual
        translation.activate(lang_code)

        request.session['_language'] = lang_code

        #se o utilizador mudar a lingua a meio do quiz, reinicia o quiz
        if 'quiz_indice' in request.session:
            del request.session['quiz_indice']

        response = redirect(request.META.get('HTTP_REFERER', 'atividades:home2'))
        response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang_code)  #laguage cookie name é django_language
        return response

    return redirect('atividades:home2')


def sabermais(request):
    return render(request, 'atividades/sabermais.html')


@login_required
def leaderboard(request):
    top_geral = Perfil.objects.select_related('user').order_by('-nivel_geral', '-xp_geral')
    top_quiz = Perfil.objects.select_related('user').order_by('-nivel_quiz', '-pontuacao_total_quiz')
    top_simulador = Perfil.objects.select_related('user').order_by('-nivel_simulador', '-pontuacao_total_simulador')
    context = {
        'top_geral': top_geral,
        'top_quiz': top_quiz,
        'top_simulador': top_simulador
    }
    return render(request, 'atividades/leaderboard.html', context)


@login_required
def quiz_setup(request):
    return render(request, 'atividades/quiz_setup.html')






@login_required 
@require_POST
def analisar_phishing_ia(request):
    try:
        cliente_ia = OpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
        )
        
        perfil = request.user.perfil
        hoje = timezone.now().date()
        
        if perfil.data_ultima_analise_ia != hoje:
            perfil.analises_ia_hoje = 0
            perfil.data_ultima_analise_ia = hoje
            perfil.save()

        #bloquear ao passar o limite
        LIMITE_DIARIO = 5
        if perfil.analises_ia_hoje >= LIMITE_DIARIO:
            return JsonResponse({
                'erro': f'Já atingiste o limite de {LIMITE_DIARIO} análises por dia. Volta amanhã!'
            }, status=429)

        data = json.loads(request.body)
        texto_email = data.get('texto_email', '')
        
        if not texto_email.strip():
            return JsonResponse({'erro': 'O texto do e-mail está vazio.'}, status=400)

        # Prompt exigindo JSON
        prompt = f"""
        És um especialista de cibersegurança. Analisa este e-mail suspeito e devolve APENAS um objeto JSON.
        O JSON deve ter exatamente estas chaves:
        "status": (escreve "phishing" ou "seguro"),
        "risco": (escreve "alto", "medio" ou "baixo"),
        "motivos": (uma lista com 2 ou 3 frases do porquê),
        "conselho": (uma frase direta do que fazer).
        
        E-mail a analisar:
        "{texto_email}"
        """

        #chamar a ia com o prompt
        resposta = cliente_ia.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"} 
        )

        texto_resposta = resposta.choices[0].message.content.strip()
        resultado_json = json.loads(texto_resposta)
        perfil.analises_ia_hoje += 1
        perfil.save()
        resultado_json['usos_restantes'] = LIMITE_DIARIO - perfil.analises_ia_hoje
        
        return JsonResponse(resultado_json)

    except Exception as e:
        print(f"ERRO REAL NO TERMINAL (GROQ): {e}")
        return JsonResponse({'erro': 'Erro técnico na IA. Vê o terminal.'}, status=500)


def detetor_ia(request):
    return render(request, 'atividades/detetor_ia.html')