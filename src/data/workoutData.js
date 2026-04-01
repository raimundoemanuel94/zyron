export const workoutData = {
  1: {
    title: "Peito + Tríceps",
    focus: "Hipertrofia - Empurre",
    image: "/images/chest.png",
    exercises: [
      { id: "p1", name: "Supino Reto com Barra", group: "Peito", sets: 4, reps: "8-12", rest: 90 },
      { id: "p2", name: "Supino Inclinado com Haltere", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "p_cm", name: "Crucifixo Máquina", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "p3", name: "Crossover na Polia", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "t2", name: "Tríceps na Corda", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t3", name: "Tríceps Francês", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t_mb", name: "Mergulho no Banco", group: "Tríceps", sets: 4, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  2: {
    title: "Costas + Bíceps",
    focus: "Hipertrofia - Puxe",
    image: "/images/back.png",
    exercises: [
      { id: "c1", name: "Puxada Frontal na Máquina", group: "Costas", sets: 4, reps: "8-12", rest: 90 },
      { id: "c_rc", name: "Remada Curvada com Barra", group: "Costas", sets: 3, reps: "8-12", rest: 90 },
      { id: "c_rm", name: "Remada Máquina", group: "Costas", sets: 3, reps: "8-12", rest: 60 },
      { id: "c_pd", name: "Puxada Alta na Polia", group: "Costas", sets: 3, reps: "8-12", rest: 60 },
      { id: "b1", name: "Rosca Direta com Barra", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b_ra", name: "Rosca Alternada com Haltere", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b3", name: "Rosca Concentrada", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  3: {
    title: "Pernas",
    focus: "Membros Inferiores",
    image: "/images/legs.png",
    exercises: [
      { id: "l1", name: "Agachamento Livre", group: "Perna", sets: 4, reps: "8-12", rest: 120 },
      { id: "l2", name: "Leg Press 45°", group: "Perna", sets: 4, reps: "8-12", rest: 90 },
      { id: "l3", name: "Cadeira Extensora", group: "Perna", sets: 3, reps: "8-12", rest: 60 },
      { id: "l4", name: "Cadeira Flexora", group: "Perna", sets: 3, reps: "8-12", rest: 60 },
      { id: "l_st", name: "Stiff", group: "Perna", sets: 3, reps: "8-12", rest: 90 },
      { id: "l_ep", name: "Elevação de Quadril (Hip Thrust)", group: "Perna", sets: 3, reps: "8-12", rest: 90 },
      { id: "ca1", name: "Panturrilha em Pé", group: "Panturrilha", sets: 4, reps: "8-12", rest: 60 },
      { id: "ca_s", name: "Panturrilha Sentado", group: "Panturrilha", sets: 3, reps: "8-12", rest: 60 },
    ],
    preCardio: "Esteira 10-15 min (Aquecimento)"
  },
  4: {
    title: "Ombro",
    focus: "Hipertrofia - Deltoides",
    image: "/images/shoulders.png",
    exercises: [
      { id: "s1", name: "Desenvolvimento com Haltere", group: "Ombro", sets: 4, reps: "8-12", rest: 90 },
      { id: "s2", name: "Elevação Lateral com Haltere", group: "Ombro", sets: 4, reps: "8-12", rest: 60 },
      { id: "s3", name: "Elevação Frontal com Haltere", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
      { id: "s4", name: "Crucifixo Inverso na Máquina", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
      { id: "s_et", name: "Encolhimento de Ombro (Shrug)", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  5: {
    title: "Bíceps + Tríceps",
    focus: "Braços e Definição",
    image: "/images/arms.png",
    exercises: [
      { id: "b_rw", name: "Rosca Barra W", group: "Bíceps", sets: 4, reps: "8-12", rest: 60 },
      { id: "b2", name: "Rosca Martelo com Haltere", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b_bi", name: "Rosca Banco Inclinado", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t3", name: "Tríceps Francês", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t2", name: "Tríceps na Corda", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t_mb", name: "Mergulho no Banco", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15 min (Pós-treino)"
  },
  0: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
  6: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
};
