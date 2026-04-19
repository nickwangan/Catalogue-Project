import { Product } from '../../lib/supabase'

type ProductTableProps = {
  products: Product[]
  isManager: boolean
  onEdit?: (product: Product) => void
  onDelete?: (id: number) => Promise<void>
  isDeleting?: boolean
}

export function ProductTable({ products, isManager, onEdit, onDelete, isDeleting = false }: ProductTableProps) {
  const columns = ['Manufacturer', 'Brand', 'Category', 'Gender', 'Material', 'Quality', 'Price Range', 'Date']

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await onDelete?.(id)
      } catch (err) {
        alert('Error deleting product')
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {col}
                </th>
              ))}
              {isManager && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={isManager ? columns.length + 1 : columns.length} className="px-6 py-8 text-center text-gray-500">
                  No products found. {isManager && 'Click "Add Product" to create one.'}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{product.manufacturer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.brand}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.gender}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.material}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.quality}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.price_range}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(product.date).toLocaleDateString()}
                  </td>
                  {isManager && (
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => onEdit?.(product)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
