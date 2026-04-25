from django.contrib import admin

from users.models import Conquista
from .models import QuizPergunta, OpcaoPergunta, ResultadoQuiz, HistoricoQuiz, emails, ResultadoSimulador
# Register your models here.

admin.site.register(QuizPergunta)
admin.site.register(OpcaoPergunta)
admin.site.register(ResultadoQuiz)
admin.site.register(HistoricoQuiz)
admin.site.register(emails)
admin.site.register(Conquista)
admin.site.register(ResultadoSimulador)




