from gettext import translation
import random
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from urllib3 import request
from .models import QuizPergunta, OpcaoPergunta, ResultadoQuiz, HistoricoQuiz
from django.utils import translation
from django.conf import settings
import json
from django_otp import user_has_device

#verifica se o utilizador tem login feito, se tiver vai ao perfil dele ver qual a lingua guardada e ativa, senao tenta ler um cookie da sessao
#o translation.activate(lang) faz com que o django use o ficheiro .po para a lingua
def home2(request):
    lang = 'pt'
    if request.user.is_authenticated:
        lang = request.user.perfil.lingua
    else:
        lang = request.session.get('django_language', 'pt') 
    translation.activate(lang)

    mfa_ativo = False
    if request.user.is_authenticated:
        mfa_ativo = user_has_device(request.user)
    return render(request, 'atividades/home2.html',{'mfa_ativo': mfa_ativo})


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
    



@login_required
def quiz(request):
    lang = request.session.get('django_language', 'pt')
    translation.activate(lang)
    
    #se nao houver indice na sessao, vai a bd buscar perguntas do nivel do utilizador
    if 'quiz_indice' not in request.session:
        lingua = request.user.perfil.lingua
        perguntas = list(QuizPergunta.objects.filter(lingua=lingua, nivel_dificuldade=request.user.perfil.nivel_quiz))

        if not perguntas:
            messages.error(request, "Não há perguntas disponíveis para o seu nível e língua.")
            return redirect('atividades:home2')
        
        #sleciona 7 perguntas do nivel do utulizador e guardo o id delas 
        indice = [p.id for p in random.sample(perguntas, min(len(perguntas), 7))]
        request.session['quiz_indice'] = indice
        request.session['pergunta_atual'] = 0
        request.session['pontuacao'] = 0
        request.session['respostas_utilizador'] = []

    indice = request.session['quiz_indice']
    atual = request.session['pergunta_atual']
    
    #quando chega a utlima pergunta manda pa pagina final
    if atual >= len(indice):
        return redirect('atividades:quiz_final')
    

    #vai buscar a pergunta e as ocoes para a resposta
    pergunta = QuizPergunta.objects.get(id=indice[atual])
    opcoes = pergunta.opcoes.all().order_by('id') 

    #o que vai ser mostrado no html(
    #popup false porque so e para a parecer depois de clicar na resposta
    context = {
        'pergunta': pergunta,
        'opcoes': opcoes,
        'numero': atual + 1,
        'total': len(indice),
        'mostrar_popup': False,
        'tema_da_pergunta': pergunta.tema
    }


    if request.method == 'POST':
        resposta_letra = request.POST.get('resposta')

        #ve o resultado do post e compara com a resposta que e correta
        esta_correto = (resposta_letra == pergunta.resposta_correta)

        #mete as respostas numa lista pa depois mostrar
        respostas = request.session.get('respostas_utilizador', [])

        respostas.append({
            'pergunta': pergunta.id,
            'resposta_dada': resposta_letra,
            'correta': esta_correto
        })
        request.session['respostas_utilizador'] = respostas

        #se acertar aumenta a pontuacao
        if esta_correto:
            request.session['pontuacao'] += 1

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
    perfil.quizzes_realizados += 1

    #aumenta a soma das percentagens que serve para calcular a media de acertos
    perfil.soma_percentagens += percentagem

    #o subiu so vai para true se o utilizador passar de 30 pontos
    subiu  = False

    #fiz o perfil.pontuacao_total_quiz -=30, assim se o utilizador tiver 29 pontos e acertar as 7 perguntas, ele fica com os 6 pontos ja no proximo nuvel
    perfil.pontuacao_total_quiz += pontos
    if perfil.pontuacao_total_quiz >=30:
        perfil.nivel_quiz += 1
        perfil.pontuacao_total_quiz -=30
        subiu = True

    perfil.save()

    #limpa a  para depois comecar na pergunta 1 e com pontuacao 0 e respostas vazias
    del request.session['quiz_indice']
    del request.session['pergunta_atual']
    del request.session['pontuacao']
    del request.session['respostas_utilizador']

    #vai mostar no html 
    return render(request, 'atividades/quiz_final.html',{
        'pontos': pontos,
        'total': total,
        'resultado': resultado,
        'xp_atual': perfil.pontuacao_total_quiz,
        'nivel_atual': perfil.nivel_quiz,
        'subiu': subiu
    })






@login_required
def historico_atividades(request):
    #vai buscar os resultados do quiz do utilizadore ordenados pela data
    resultados = ResultadoQuiz.objects.filter(perfil=request.user.perfil).order_by('-data_conclusao')
    
    return render(request, 'atividades/historico.html', {
        'resultados': resultados
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


@login_required
def simulador(request):
    lang = request.session.get('django_language' , 'pt')
    translation.activate(lang)
 
    return render(request, 'atividades/simulador.html')


def proximo_email(request):
    return redirect('simulador')

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

        #guarda a lingua na sessao para dar para o resto do site
        request.session['django_language'] = lang_code#(2 para garantir que da)

        #se o utilizador mudar a lingua a meio do quiz, reinicia o quiz
        if 'quiz_indice' in request.session:
            del request.session['quiz_indice']

        response = redirect(request.META.get('HTTP_REFERER', 'atividades:home2'))
        response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang_code)  #laguage cookie name é django_language
        return response

    return redirect(request.META.get('HTTP_REFERER', 'atividades:home2'))
7

def sabermais(request):
    return render(request, 'atividades/sabermais.html')