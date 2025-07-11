import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { productService } from "../../services/productService"

interface ProductsState {
  featured: any[]
  recent: any[]
  searchResults: any[]
  loading: boolean
  error: string | null
}

const initialState: ProductsState = {
  featured: [],
  recent: [],
  searchResults: [],
  loading: false,
  error: null,
}

export const fetchFeaturedProducts = createAsyncThunk("products/fetchFeatured", async () => {
  const response = await productService.getFeaturedProducts()
  return response
})

export const fetchRecentProducts = createAsyncThunk("products/fetchRecent", async () => {
  const response = await productService.getRecentProducts()
  return response
})

export const searchProducts = createAsyncThunk(
  "products/search",
  async ({ query, filters }: { query: string; filters?: any }) => {
    const response = await productService.searchProducts(query, filters)
    return response
  },
)

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false
        state.featured = action.payload
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch featured products"
      })
      .addCase(fetchRecentProducts.fulfilled, (state, action) => {
        state.recent = action.payload
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchResults = action.payload
      })
  },
})

export const { clearSearchResults } = productsSlice.actions
export default productsSlice.reducer
