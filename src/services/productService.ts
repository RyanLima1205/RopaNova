import axios from "axios"

const API_BASE_URL = "https://your-api-domain.com/api"

class ProductService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  })

  async getFeaturedProducts() {
    try {
      const response = await this.api.get("/products/featured")
      return response.data
    } catch (error) {
      console.error("Error fetching featured products:", error)
      // Return mock data for development
      return this.getMockFeaturedProducts()
    }
  }

  async getRecentProducts() {
    try {
      const response = await this.api.get("/products/recent")
      return response.data
    } catch (error) {
      console.error("Error fetching recent products:", error)
      // Return mock data for development
      return this.getMockRecentProducts()
    }
  }

  async getProduct(id: string) {
    try {
      const response = await this.api.get(`/products/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching product:", error)
      throw error
    }
  }

  async searchProducts(query: string, filters?: any) {
    try {
      const response = await this.api.get("/products/search", {
        params: { q: query, ...filters },
      })
      return response.data
    } catch (error) {
      console.error("Error searching products:", error)
      throw error
    }
  }

  // Mock data for development
  private getMockFeaturedProducts() {
    return [
      {
        id: 1,
        title: "Vestido Elegante de Noche Zara",
        price: 2500,
        condition: "Nuevo",
        location: "Santo Domingo",
        brand: "Zara",
        image: "https://picsum.photos/300/300?random=1",
      },
      {
        id: 2,
        title: "Bolso de Cuero Genuino Coach",
        price: 1800,
        condition: "Usado",
        location: "Santiago",
        brand: "Coach",
        image: "https://picsum.photos/300/300?random=2",
      },
      {
        id: 3,
        title: "Zapatos de Tacón Steve Madden",
        price: 2200,
        condition: "Nuevo",
        location: "La Romana",
        brand: "Steve Madden",
        image: "https://picsum.photos/300/300?random=3",
      },
    ]
  }

  private getMockRecentProducts() {
    return [
      {
        id: 4,
        title: "Camisa Formal Azul H&M",
        price: 1200,
        condition: "Nuevo",
        location: "Puerto Plata",
        brand: "H&M",
        size: "M",
        image: "https://picsum.photos/300/300?random=4",
      },
      {
        id: 5,
        title: "Vestido Floral Verano",
        price: 900,
        condition: "Usado",
        location: "Punta Cana",
        brand: "Forever 21",
        size: "S",
        image: "https://picsum.photos/300/300?random=5",
      },
      {
        id: 6,
        title: "Jeans Skinny Azul Levi's",
        price: 1500,
        condition: "Usado",
        location: "Santo Domingo",
        brand: "Levi's",
        size: "28",
        image: "https://picsum.photos/300/300?random=6",
      },
      {
        id: 7,
        title: "Chaqueta de Cuero Vintage",
        price: 4500,
        condition: "Usado",
        location: "Barahona",
        brand: "Vintage",
        size: "L",
        image: "https://picsum.photos/300/300?random=7",
      },
    ]
  }
}

export const productService = new ProductService()
