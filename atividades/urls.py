from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
app_name = 'atividades'
urlpatterns = [
    path('home2/', views.home2, name='home2'),
    path('quiz/', views.quiz, name='quiz'),
    path('proximo/', views.proximo_passo, name='proximo_passo'),
    path('quiz_final/', views.quiz_final, name='quiz_final'),
    path('simulador/', views.simulador, name='simulador'),
    path('proximo_email/', views.proximo_email, name='proximo_email'),
    path('historico/', views.historico_atividades, name='historico'),
    path('detalhe_historico/<int:resultado_id>/', views.detalhe_historico, name='detalhe_historico'),
    path('api/atualizar-filtros/', views.atualizar_filtros_acessibilidade, name='atualizar_filtros'),
    path('guia_emergencia/', views.guia_emergencia, name='guia_emergencia'),
    path('mudar_lingua/<str:lang_code>/', views.mudar_lingua, name='mudar_lingua'),
]
