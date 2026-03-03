export const workoutData = {
  1: {
    title: "Peito + Tríceps",
    focus: "Hipertrofia - Empurre",
    image: "/images/chest.png",
    exercises: [
      { id: "p1", name: "Supino reto barra", group: "Peito", sets: 4, reps: "6-8", rest: 90 },
      { id: "p2", name: "Supino inclinado halter", group: "Peito", sets: 3, reps: "8-10", rest: 60 },
      { id: "p_cm", name: "Crucifixo máquina", group: "Peito", sets: 3, reps: "10-12", rest: 60 },
      { id: "p3", name: "Crossover polia", group: "Peito", sets: 3, reps: "12-15", rest: 60 },
      { id: "t2", name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "10-12", rest: 60 },
      { id: "t3", name: "Tríceps testa", group: "Tríceps", sets: 3, reps: "8-10", rest: 60 },
      { id: "t_mb", name: "Mergulho banco", group: "Tríceps", sets: 3, reps: "Falha", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Moderado)"
  },
  2: {
    title: "Costas + Bíceps",
    focus: "Hipertrofia - Puxe",
    image: "/images/back.png",
    exercises: [
      { id: "c1", name: "Puxada frente aberta", group: "Costas", sets: 4, reps: "8-10", rest: 90 },
      { id: "c_rc", name: "Remada curvada barra", group: "Costas", sets: 3, reps: "8-10", rest: 90 },
      { id: "c_rm", name: "Remada máquina", group: "Costas", sets: 3, reps: "10-12", rest: 60 },
      { id: "c_pd", name: "Pulldown", group: "Costas", sets: 3, reps: "12", rest: 60 },
      { id: "b1", name: "Rosca direta barra", group: "Bíceps", sets: 3, reps: "8-10", rest: 60 },
      { id: "b_ra", name: "Rosca alternada halter", group: "Bíceps", sets: 3, reps: "10", rest: 60 },
      { id: "b3", name: "Rosca concentrada", group: "Bíceps", sets: 3, reps: "12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Moderado)"
  },
  3: {
    title: "Pernas completas + Panturrilha",
    focus: "Membros Inferiores",
    image: "/images/legs.png",
    exercises: [
      { id: "l1", name: "Agachamento livre", group: "Perna", sets: 4, reps: "6-8", rest: 120 },
      { id: "l2", name: "Leg press", group: "Perna", sets: 4, reps: "10", rest: 90 },
      { id: "l3", name: "Cadeira extensora", group: "Perna", sets: 3, reps: "12", rest: 60 },
      { id: "l4", name: "Mesa flexora", group: "Perna", sets: 3, reps: "10-12", rest: 60 },
      { id: "l_st", name: "Stiff", group: "Perna", sets: 3, reps: "8-10", rest: 90 },
      { id: "l_ep", name: "Elevação pélvica", group: "Perna", sets: 3, reps: "10-12", rest: 90 },
      { id: "ca1", name: "Panturrilha em pé", group: "Panturrilha", sets: 4, reps: "12-15", rest: 60 },
      { id: "ca_s", name: "Panturrilha sentado", group: "Panturrilha", sets: 3, reps: "15", rest: 60 },
    ]
  },
  4: {
    title: "Ombro",
    focus: "Hipertrofia - Deltoides",
    image: "/images/shoulders.png",
    exercises: [
      { id: "s1", name: "Desenvolvimento halter", group: "Ombro", sets: 4, reps: "8-10", rest: 90 },
      { id: "s2", name: "Elevação lateral", group: "Ombro", sets: 4, reps: "12", rest: 60 },
      { id: "s3", name: "Elevação frontal", group: "Ombro", sets: 3, reps: "10", rest: 60 },
      { id: "s4", name: "Crucifixo invertido", group: "Ombro", sets: 3, reps: "12", rest: 60 },
      { id: "s_et", name: "Encolhimento trapézio", group: "Ombro", sets: 3, reps: "12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Moderado)"
  },
  5: {
    title: "Bíceps + Tríceps",
    focus: "Braços e Definição",
    image: "/images/arms.png",
    exercises: [
      { id: "b_rw", name: "Rosca barra W", group: "Bíceps", sets: 4, reps: "8", rest: 60 },
      { id: "b2", name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "10", rest: 60 },
      { id: "b_bi", name: "Rosca banco inclinado", group: "Bíceps", sets: 3, reps: "10-12", rest: 60 },
      { id: "t3", name: "Tríceps testa", group: "Tríceps", sets: 3, reps: "8-10", rest: 60 },
      { id: "t2", name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "12", rest: 60 },
      { id: "t_mb2", name: "Tríceps banco", group: "Tríceps", sets: 3, reps: "Falha", rest: 60 },
    ],
    cardio: "Esteira 15 min (Moderado)"
  },
  0: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
  6: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
};
