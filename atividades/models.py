from django.db import models
from users.models import Perfil



class QuizPergunta(models.Model):
    LINGUA_CHOICES = [
        ('pt', 'Português'),
        ('en', 'English'),
    ]
    id = models.BigAutoField(primary_key=True)
    pergunta = models.TextField()
    nivel_dificuldade = models.IntegerField()
    lingua = models.CharField(max_length=20, choices=LINGUA_CHOICES, default='pt')
    explicacao = models.TextField()
    resposta_correta = models.CharField(max_length=1)

    def __str__(self):
        return f"({self.lingua}) Nivel {self.nivel_dificuldade} - {self.pergunta[:50]}"


class OpcaoPergunta(models.Model):
    id = models.BigAutoField(primary_key=True)
    pergunta = models.ForeignKey(QuizPergunta, on_delete=models.CASCADE, related_name='opcoes')
    letra = models.CharField(max_length=1)
    texto = models.CharField(max_length=255)

    class Meta:
        unique_together = ('pergunta', 'letra')

    def __str__(self):
        return f"{self.pergunta.id} - {self.letra}: {self.texto}"


class ResultadoQuiz(models.Model):
    id = models.BigAutoField(primary_key=True)
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='resultados_quiz')
    nivel = models.IntegerField()
    pontuacao = models.IntegerField()
    total_perguntas = models.IntegerField()
    percentagem = models.FloatField()
    data_conclusao = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('perfil', 'nivel', 'data_conclusao')

    def __str__(self):
        return f"{self.perfil.user.username} - Nível {self.nivel}: {self.percentagem}%"


class HistoricoQuiz(models.Model):
    RESPOSTA_CHOICES = [('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')]
    id = models.BigAutoField(primary_key=True)
    resultado_quiz = models.ForeignKey(ResultadoQuiz, on_delete=models.CASCADE, related_name='detalhes')
    pergunta = models.ForeignKey(QuizPergunta, on_delete=models.CASCADE)
    escolha_utilizador = models.CharField(max_length=1, choices=RESPOSTA_CHOICES)
    foi_correta = models.BooleanField()
    data_resposta = models.DateTimeField(auto_now_add=True)

    def __str__(self): 
        return f"Resposta de {self.resultado_quiz.perfil.user.username} à pergunta {self.pergunta.id} - {'Correta' if self.foi_correta else 'Errada'}"
