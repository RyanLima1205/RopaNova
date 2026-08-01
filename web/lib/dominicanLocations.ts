export const DOMINICAN_PROVINCES = [
  "Azua", "Baoruco", "Barahona", "Dajabón", "Duarte", "Elías Piña", "El Seibo", "Espaillat",
  "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega",
  "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales",
  "Peravia", "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan",
  "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", "Santo Domingo",
  "Valverde",
]

export const DOMINICAN_MUNICIPALITIES: Record<string, string[]> = {
  Azua: ["Azua de Compostela", "Estebanía", "Guayabal", "Las Charcas", "Las Yayas de Viajama", "Padre Las Casas", "Peralta", "Pueblo Viejo", "Sabana Yegua", "Tábara Arriba"],
  Baoruco: ["Neiba", "Galván", "Los Ríos", "Tamayo", "Villa Jaragua"],
  Barahona: ["Santa Cruz de Barahona", "Cabral", "El Peñón", "Enriquillo", "Fundación", "Jaquimeyes", "La Ciénaga", "Las Salinas", "Paraíso", "Polo", "Vicente Noble"],
  Dajabón: ["Dajabón", "El Pino", "Loma de Cabrera", "Partido", "Restauración"],
  Duarte: ["San Francisco de Macorís", "Arenoso", "Castillo", "Eugenio María de Hostos", "Las Guáranas", "Pimentel", "Villa Riva"],
  "Elías Piña": ["Comendador", "Bánica", "El Llano", "Hondo Valle", "Juan Santiago", "Pedro Santana"],
  "El Seibo": ["Santa Cruz de El Seibo", "Miches"],
  Espaillat: ["Moca", "Cayetano Germosén", "Gaspar Hernández", "Jamao al Norte"],
  "Hato Mayor": ["Hato Mayor del Rey", "El Valle", "Sabana de la Mar"],
  "Hermanas Mirabal": ["Salcedo", "Tenares", "Villa Tapia"],
  Independencia: ["Jimaní", "Cristóbal", "Duvergé", "La Descubierta", "Mella", "Postrer Río"],
  "La Altagracia": ["Higüey", "San Rafael del Yuma", "La Otra Banda", "Verón", "Bávaro", "Punta Cana"],
  "La Romana": ["La Romana", "Guaymate", "Villa Hermosa"],
  "La Vega": ["Concepción de La Vega", "Constanza", "Jarabacoa", "Jima Abajo"],
  "María Trinidad Sánchez": ["Nagua", "Cabrera", "El Factor", "Río San Juan"],
  "Monseñor Nouel": ["Bonao", "Maimón", "Piedra Blanca"],
  "Monte Cristi": ["San Fernando de Monte Cristi", "Castañuela", "Guayubín", "Las Matas de Santa Cruz", "Pepillo Salcedo", "Villa Vásquez"],
  "Monte Plata": ["Monte Plata", "Bayaguana", "Peralvillo", "Sabana Grande de Boyá", "Yamasá"],
  Pedernales: ["Pedernales", "Oviedo"],
  Peravia: ["Baní", "Nizao", "Matanzas", "Paya", "Sabana Buey", "Villa Fundación", "Villa Sombrero"],
  "Puerto Plata": ["Puerto Plata", "Altamira", "Guananico", "Imbert", "Los Hidalgos", "Luperón", "Sosúa", "Villa Isabela", "Villa Montellano"],
  Samaná: ["Santa Bárbara de Samaná", "Las Terrenas", "Sánchez"],
  "San Cristóbal": ["San Cristóbal", "Bajos de Haina", "Cambita Garabitos", "Los Cacaos", "Sabana Grande de Palenque", "San Gregorio de Nigua", "Villa Altagracia", "Yaguate"],
  "San José de Ocoa": ["San José de Ocoa", "Rancho Arriba", "Sabana Larga"],
  "San Juan": ["San Juan de la Maguana", "Bohechío", "El Cercado", "Juan de Herrera", "Las Matas de Farfán", "Vallejuelo"],
  "San Pedro de Macorís": ["San Pedro de Macorís", "Consuelo", "Guayacanes", "Quisqueya", "Ramón Santana"],
  "Sánchez Ramírez": ["Cotuí", "Cevicos", "Fantino", "La Mata"],
  Santiago: ["Santiago de los Caballeros", "Bisonó", "Jánico", "Licey al Medio", "Puñal", "Sabana Iglesia", "San José de las Matas", "Tamboril", "Villa González", "Villa Bisonó"],
  "Santiago Rodríguez": ["San Ignacio de Sabaneta", "Monción", "Villa Los Almácigos"],
  "Santo Domingo": ["Santo Domingo Este", "Santo Domingo Norte", "Santo Domingo Oeste", "Boca Chica", "Los Alcarrizos", "Pedregal", "San Antonio de Guerra", "Distrito Nacional"],
  Valverde: ["Mao", "Esperanza", "Laguna Salada"],
}

export const GENDERS = [
  { label: "Masculino", value: "Masculino" },
  { label: "Femenino", value: "Femenino" },
  { label: "Otro", value: "Otro" },
]

export const ACCOUNT_TYPES = [
  {
    id: "particular",
    icon: "🧍",
    title: "Usuario Particular",
    subtitle: "Uso personal",
    description: "Ideal para personas que desean comprar y vender ropa de forma casual.",
  },
  {
    id: "virtual",
    icon: "🛍️",
    title: "Tienda Virtual",
    subtitle: "Negocio sin local físico",
    description: "Crea tu boutique en línea, publica productos y gestiona tus ventas desde cualquier lugar.",
  },
  {
    id: "fisica",
    icon: "🏪",
    title: "Tienda Física",
    subtitle: "Negocio con local comercial",
    description: "Vende a través de RopaNova y destaca tu tienda física mostrando dirección, horarios y contacto.",
  },
]

export const FORBIDDEN_USERNAMES = ["admin", "support", "root", "administrator", "moderator"]
export const USERNAME_REGEX = /^[a-z0-9._-]{3,20}$/

/** Sin fecha futura, mínimo 13 años — misma regla que mobile-app RegisterScreen. */
export function validateBirthDate(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  if (date > now) return "La fecha no puede ser en el futuro."
  const minAge = 13
  const minDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate())
  if (date > minDate) return "Debes tener al menos 13 años."
  return ""
}
