from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

from django.views.i18n import JavaScriptCatalog

app_name = 'atividades'
urlpatterns = [
    path('home2/', views.home2, name='home2'),
    path('quiz/', views.quiz, name='quiz'),
    path('proximo/', views.proximo_passo, name='proximo_passo'),
    path('quiz_final/', views.quiz_final, name='quiz_final'),
    path('simulador/', views.simulador, name='simulador'),
    path('historico/', views.historico_atividades, name='historico'),
    path('detalhe_historico/<int:resultado_id>/', views.detalhe_historico, name='detalhe_historico'),
    path('api/atualizar-filtros/', views.atualizar_filtros_acessibilidade, name='atualizar_filtros'),
    path('guia_emergencia/', views.guia_emergencia, name='guia_emergencia'),
    path('mudar_lingua/<str:lang_code>/', views.mudar_lingua, name='mudar_lingua'),
    path('sabermais/', views.sabermais, name='sabermais'),
    path('simulador_final/', views.simulador_final, name='simulador_final'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('quiz_setup/', views.quiz_setup, name='quiz_setup'),
    path('preparar_quiz/', views.preparar_quiz, name='preparar_quiz'),
    path('preparar_simulador/', views.preparar_simulador, name='preparar_simulador'),
    path('simulador_setup/', views.simulador_setup, name='simulador_setup'),
    path('api/analisar-phishing-ia/', views.analisar_phishing_ia, name='analisar_phishing_ia'),
    path('detetor_ia/', views.detetor_ia, name='detetor_ia'),
    path('historico/simulador/<int:resultado_id>/', views.detalhe_simulador, name='detalhe_simulador'),
]
