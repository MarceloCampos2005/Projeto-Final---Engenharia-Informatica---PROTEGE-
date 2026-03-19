from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', auth_views.LoginView.as_view(template_name = 'users/login.html'), name='login'),
    path('registar/', views.registar, name='registar'),
    path('sobrenos/', views.sobrenos, name='sobrenos'),
    path('perfil/', views.perfil, name='perfil'),
    path('logout/', views.logout_view, name='logout'),
    path('salvar_acessibilidade/', views.salvar_acessibilidade, name='salvar_acessibilidade'),
    path('perfil/editar/', views.editar_perfil, name='editar_perfil'),
    path('atualizar-avatar/', views.atualizar_avatar, name='atualizar_avatar'),
    path('desativar-mfa-seguro/', views.desativar_mfa_seguro, name='desativar_mfa_seguro'),
    
]
