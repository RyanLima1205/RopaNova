export async function getProduct(id: string | number) {
  // Enhanced mock data with seller and condition details
  const mockProduct = {
    id,
    title: "Vestido Elegante de Noche Zara",
    price: 2500,
    originalPrice: 4200,
    condition: "Nuevo",
    location: "Santo Domingo",
    brand: "Zara",
    size: "M",
    color: "Negro",
    material: "95% Poliéster, 5% Elastano",
    images: [
      "/placeholder.svg?height=600&width=600&text=Vestido+Principal",
      "/placeholder.svg?height=600&width=600&text=Vestido+Detalle+1",
      "/placeholder.svg?height=600&width=600&text=Vestido+Detalle+2",
      "/placeholder.svg?height=600&width=600&text=Etiqueta",
    ],
    description:
      "Vestido elegante de noche de la marca Zara, usado solo una vez para un evento especial. Se encuentra en perfectas condiciones, sin manchas, roturas o desgaste. Incluye etiqueta original. Perfecto para bodas, graduaciones o eventos formales.",
    conditionDetails: {
      overall: "Nuevo",
      rating: 5,
      details: [
        { aspect: "Tela", condition: "Perfecta", description: "Sin manchas, roturas o desgaste" },
        { aspect: "Cremallera", condition: "Perfecta", description: "Funciona perfectamente, sin problemas" },
        { aspect: "Costuras", condition: "Perfecta", description: "Todas las costuras intactas" },
        { aspect: "Etiquetas", condition: "Incluidas", description: "Etiqueta original de la marca presente" },
      ],
      photos: [
        "/placeholder.svg?height=300&width=300&text=Condición+General",
        "/placeholder.svg?height=300&width=300&text=Detalle+Tela",
        "/placeholder.svg?height=300&width=300&text=Etiqueta+Original",
      ],
    },
    seller: {
      id: "seller1",
      name: "María González",
      username: "@maria_vintage",
      avatar: "/placeholder.svg?height=80&width=80&text=MG",
      rating: 4.8,
      reviewCount: 127,
      totalSales: 89,
      responseRate: 95,
      averageResponseTime: "2 horas",
      memberSince: "Marzo 2022",
      location: "Santo Domingo",
      verified: true,
      badges: [
        { name: "Vendedor Verificado", type: "verified" },
        { name: "Respuesta Rápida", type: "fast_response" },
        { name: "Top Seller", type: "top_seller" },
      ],
      bio: "Amante de la moda vintage y sostenible. Vendiendo piezas únicas desde 2022. ✨",
      stats: {
        thisMonth: {
          sales: 12,
          newListings: 8,
          responseTime: "1.5 horas",
        },
      },
    },
    postedDate: "2024-01-15",
    views: 234,
    favorites: 18,
    category: "Vestidos",
    subcategory: "Vestidos de Noche",
  }

  // Simulate API latency
  await new Promise((r) => setTimeout(r, 300))
  return mockProduct
}
