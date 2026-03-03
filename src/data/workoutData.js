export const workoutData = {
  1: {
    title: "Peito + Tríceps + Abdômen",
    focus: "Hipertrofia e Core",
    image: "/images/chest.png",
    exercises: [
      { id: "p1", name: "Supino Reto (Barra)", group: "Peito", sets: 4, reps: "8-12", rest: 90 },
      { id: "p2", name: "Supino Inclinado (Halter)", group: "Peito", sets: 3, reps: "10-12", rest: 60 },
      { id: "p3", name: "Cross Over", group: "Peito", sets: 3, reps: "12", rest: 60 },
      { id: "t1", name: "Tríceps Pulley", group: "Tríceps", sets: 3, reps: "12-15", rest: 60 },
      { id: "t2", name: "Tríceps Corda", group: "Tríceps", sets: 3, reps: "12", rest: 60 },
      { id: "a1", name: "Abdominal Rodinha", group: "Abdômen", sets: 3, reps: "15-20", rest: 45, special: "wheel" },
    ]
  },
  2: {
    title: "Costas + Bíceps",
    focus: "Amplitude e Pico",
    image: "/images/back.png",
    exercises: [
      { id: "c1", name: "Puxada Aberta (Polia)", group: "Costas", sets: 4, reps: "10-12", rest: 90 },
      { id: "c2", name: "Remada Baixa", group: "Costas", sets: 3, reps: "12", rest: 60 },
      { id: "c3", name: "Serrote", group: "Costas", sets: 3, reps: "10", rest: 60 },
      { id: "b1", name: "Rosca Direta (Barra W)", group: "Bíceps", sets: 3, reps: "10-12", rest: 60 },
      { id: "b2", name: "Rosca Martelo", group: "Bíceps", sets: 3, reps: "12", rest: 60 },
    ]
  },
  3: {
    title: "Perna Completa + Panturrilha + Abdômen",
    focus: "Membros Inferiores",
    image: "/images/legs.png",
    exercises: [
      { id: "l1", name: "Agachamento Livre", group: "Perna", sets: 4, reps: "8-10", rest: 120 },
      { id: "l2", name: "Leg Press 45", group: "Perna", sets: 3, reps: "12", rest: 90 },
      { id: "l3", name: "Extensora", group: "Perna", sets: 3, reps: "15", rest: 60 },
      { id: "l4", name: "Mesa Flexora", group: "Perna", sets: 3, reps: "12", rest: 60 },
      { id: "ca1", name: "Gêmeos em Pé", group: "Panturrilha", sets: 4, reps: "15-20", rest: 45 },
      { id: "a2", name: "Prancha Abdominal", group: "Abdômen", sets: 3, reps: "60s", rest: 45, special: "plank" },
    ]
  },
  4: {
    title: "Ombro",
    focus: "Deltoides",
    image: "/images/shoulders.png",
    exercises: [
      { id: "s1", name: "Desenvolvimento (Halter)", group: "Ombro", sets: 4, reps: "10-12", rest: 90 },
      { id: "s2", name: "Elevação Lateral", group: "Ombro", sets: 4, reps: "12-15", rest: 60 },
      { id: "s3", name: "Elevação Frontal", group: "Ombro", sets: 3, reps: "12", rest: 60 },
      { id: "s4", name: "Crucifixo Inverso", group: "Ombro", sets: 3, reps: "15", rest: 60 },
    ]
  },
  5: {
    title: "Bíceps + Tríceps + Abdômen",
    focus: "Braços e Definição",
    image: "/images/arms.png",
    exercises: [
      { id: "b3", name: "Rosca Concentrada", group: "Bíceps", sets: 3, reps: "12", rest: 60 },
      { id: "t3", name: "Tríceps Testa", group: "Tríceps", sets: 3, reps: "12", rest: 60 },
      { id: "b4", name: "Rosca Scott", group: "Bíceps", sets: 3, reps: "10-12", rest: 60 },
      { id: "t4", name: "Tríceps Francês", group: "Tríceps", sets: 3, reps: "12", rest: 60 },
      { id: "a3", name: "Elevação de Pernas", group: "Abdômen", sets: 3, reps: "15-20", rest: 45 },
      { id: "a4", name: "Crunch Máquina", group: "Abdômen", sets: 3, reps: "15", rest: 45 },
    ]
  },
  0: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
  6: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
};
