import urllib.request
import urllib.parse
import re
import json

exercises = {
  'p1': 'Supino Reto Barra execução',
  'p2': 'Supino Inclinado Halter execução',
  'p3': 'Cross Over Polia execução',
  't1': 'Triceps Pulley execução',
  't2': 'Triceps Corda execução',
  'a1': 'Abdominal Rodinha execução correta',
  'c1': 'Puxada Aberta costas execução',
  'c2': 'Remada Baixa triângulo execução',
  'c3': 'Remada Serrote unilateral execução',
  'b1': 'Rosca Direta Barra W execução',
  'b2': 'Rosca Martelo execução',
  'l1': 'Agachamento Livre com barra execução',
  'l2': 'Leg Press 45 execução',
  'l3': 'Extensora cadeira execução',
  'l4': 'Mesa Flexora execução',
  'ca1': 'Gemeos em Pe panturrilha execução',
  'a2': 'Prancha Abdominal execução',
  's1': 'Desenvolvimento Halter ombros execução',
  's2': 'Elevacao Lateral halteres execução',
  's3': 'Elevacao Frontal execução',
  's4': 'Crucifixo Inverso execução',
  'b3': 'Rosca Concentrada halteres execução',
  't3': 'Triceps Testa barra w execução',
  'b4': 'Rosca Scott barra w execução',
  't4': 'Triceps Frances bilateral execução',
  'a3': 'Elevacao de Pernas infra execução',
  'a4': 'Crunch Maquina abdominal execução',
}

results = {}
for k, q in exercises.items():
    try:
        html = urllib.request.urlopen("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q)).read().decode()
        videos = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
        if videos:
            results[k] = videos[0]
            print(f"Found {k}: {videos[0]}")
    except Exception as e:
        results[k] = "error"

with open("videos_new.json", "w") as f:
    json.dump(results, f, indent=2)
