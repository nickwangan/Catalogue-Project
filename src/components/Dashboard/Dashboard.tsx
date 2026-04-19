import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProducts } from '../../hooks/useProducts'
import { Product } from '../../lib/supabase'
import { ProductTable } from './ProductTable'
import { ProductForm } from './ProductForm'

export function Dashboard() {
  const { user, isManager, logout } = useAuth()
  const { products, isLoading, addProduct, updateProduct, deleteProduct, isAdding, isUpdating, isDeleting } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')

  const handleAddProduct = async (data: Omit<Product, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    try {
      await addProduct(data)
      setShowForm(false)
      alert('Product added successfully!')
    } catch (err) {
      alert('Error adding product: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleUpdateProduct = async (data: Omit<Product, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!editingProduct) return
    try {
      await updateProduct({ id: editingProduct.id, ...data })
      setShowForm(false)
      setEditingProduct(undefined)
      alert('Product updated successfully!')
    } catch (err) {
      alert('Error updating product: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id)
      alert('Product deleted successfully!')
    } catch (err) {
      alert('Error deleting product: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(undefined)
  }

  // Filter products
  let filteredProducts = products
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(
      p => p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(p => p.category === categoryFilter)
  }
  if (genderFilter) {
    filteredProducts = filteredProducts.filter(p => p.gender === genderFilter)
  }

  const categories = [...new Set(products.map(p => p.category))].sort()
  const genders = [...new Set(products.map(p => p.gender))].sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Fashion Catalog Manager</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500">
                {isManager ? '👔 Manager' : '👥 Employee'}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showForm ? (
          <div className="mb-8">
            <ProductForm
              product={editingProduct}
              onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
              onCancel={handleCancel}
              isLoading={isAdding || isUpdating}
            />
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-end">
                  {isManager && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                      + Add Product
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder="Search by manufacturer or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-4 flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">All Genders</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>

                  {(searchTerm || categoryFilter || genderFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setCategoryFilter('')
                        setGenderFilter('')
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results info */}
            <div className="mb-4">
              <p className="text-gray-600">
                Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
              </p>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Loading products...</p>
              </div>
            ) : (
              <ProductTable
                products={filteredProducts}
                isManager={isManager}
                onEdit={handleEditClick}
                onDelete={handleDeleteProduct}
                isDeleting={isDeleting}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
