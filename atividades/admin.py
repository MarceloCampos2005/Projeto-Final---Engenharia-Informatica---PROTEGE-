from django.contrib import admin
from .models import QuizPergunta, OpcaoPergunta, ResultadoQuiz, HistoricoQuiz   
# Register your models here.

admin.site.register(QuizPergunta)
admin.site.register(OpcaoPergunta)
admin.site.register(ResultadoQuiz)
admin.site.register(HistoricoQuiz)




