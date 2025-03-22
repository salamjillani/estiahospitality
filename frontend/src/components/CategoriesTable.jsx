import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { api } from "../utils/api";
import { Loader2, Save, X, Edit, Plus, Trash2, AlertTriangle } from 'lucide-react';

const DeleteCategoryDialog = ({ isOpen, onClose, onConfirm, categoryName, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-4 sm:p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="p-3 sm:p-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Delete {categoryName || "Category"}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Are you sure you want to delete{" "}
                {categoryName ? (
                  <span className="font-medium">
                    &quot;{categoryName}&quot;
                  </span>
                ) : (
                  "this category"
                )}
                ? This may affect properties using this category.
              </p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 justify-end mt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 flex items-center gap-2 hover:shadow-lg shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isLoading ? "Deleting..." : "Delete Category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesTable = React.memo(({
  categories,
  user,
  editingCategory,
  categoryForm,
  categoryUpdateLoading,
  onStartEdit,
  onCancelEdit,
  onUpdateCategory,
  onInputChange,
  setCategories
}) => {
  const currencySymbols = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥"
  };

  const [newCategory, setNewCategory] = useState({
    type: "",
    description: "",
    lowSeason: "",
    highSeason: "",
    currency: "EUR"
  });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, categoryType: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddCategory = async () => {
    try {
      // Validate inputs
      if (!newCategory.type || !newCategory.description || !newCategory.lowSeason || !newCategory.highSeason) {
        alert("Please fill in all fields");
        return;
      }
      
      const response = await api.put(`/api/category-prices/${newCategory.type}`, newCategory);
      setCategories(prev => [...prev, response]);
      setNewCategory({ type: "", description: "", lowSeason: "", highSeason: "", currency: "EUR" });
    } catch (err) {
      console.error("Failed to add category:", err);
      alert(`Failed to add category: ${err.message}`);
    }
  };

  const handleDeleteClick = (categoryType) => {
    setDeleteDialog({
      isOpen: true,
      categoryType
    });
  };

  
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/api/category-prices/${deleteDialog.categoryType}`);
      setCategories(prev => 
        prev.filter(category => category.type !== deleteDialog.categoryType)
      );
      setDeleteDialog({ isOpen: false, categoryType: null });
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert(`Failed to delete category: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 animate-fadeIn border border-blue-50">
      <DeleteCategoryDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, categoryType: null })}
        onConfirm={handleDeleteConfirm}
        categoryName={deleteDialog.categoryType}
        isLoading={deleteLoading}
      />
    
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Pricing Categories
        </h2>
        {editingCategory && (
          <button onClick={onCancelEdit} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 flex items-center gap-1">
            <X className="w-4 h-4" /> Cancel Editing
          </button>
        )}
      </div>

       {/* Add New Category Form */}
       {user?.role === "admin" && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Category Type"
              className="p-2 border rounded"
              value={newCategory.type}
              onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
            />
            <input
              type="text"
              placeholder="Description"
              className="p-2 border rounded"
              value={newCategory.description}
              onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
            />
            <input
              type="number"
              placeholder="Low Season Price"
              className="p-2 border rounded"
              value={newCategory.lowSeason}
              onChange={(e) => setNewCategory({...newCategory, lowSeason: e.target.value})}
            />
            <input
              type="number"
              placeholder="High Season Price"
              className="p-2 border rounded"
              value={newCategory.highSeason}
              onChange={(e) => setNewCategory({...newCategory, highSeason: e.target.value})}
            />
            <select
              className="p-2 border rounded"
              value={newCategory.currency}
              onChange={(e) => setNewCategory({...newCategory, currency: e.target.value})}
            >
              {Object.keys(currencySymbols).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-4 px-4 text-indigo-700">Category</th>
              <th className="text-center py-4 px-4 text-indigo-700">Low Season</th>
              <th className="text-center py-4 px-4 text-indigo-700">High Season</th>
              <th className="text-left py-4 px-4 text-indigo-700">Description</th>
              {user?.role === "admin" && <th className="text-right py-4 px-4 text-indigo-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.type} className={`border-b border-gray-50 ${editingCategory === category.type ? "bg-blue-50" : "hover:bg-blue-50"}`}>
                <td className="py-4 px-4 font-medium">{category.type}</td>
                
                {editingCategory === category.type ? (
                  <>
                    <td className="text-center py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <select
                          name="currency"
                          value={categoryForm.currency}
                          onChange={onInputChange}
                          className="p-1 border rounded"
                        >
                          {Object.keys(currencySymbols).map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          name="lowSeason"
                          value={categoryForm.lowSeason}
                          onChange={onInputChange}
                          className="w-20 p-1 border rounded"
                          autoFocus
                        />
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <input
                        type="number"
                        name="highSeason"
                        value={categoryForm.highSeason}
                        onChange={onInputChange}
                        className="w-20 p-1 border rounded"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        name="description"
                        value={categoryForm.description}
                        onChange={onInputChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-center py-4 px-4 text-blue-600 font-medium">
                      {currencySymbols[category.currency]}{category.lowSeason}/night
                    </td>
                    <td className="text-center py-4 px-4 text-blue-600 font-medium">
                      {currencySymbols[category.currency]}{category.highSeason}/night
                    </td>
                    <td className="py-4 px-4">{category.description}</td>
                  </>
                )}

                {user?.role === "admin" && (
                  <td className="py-4 px-4 text-right">
                    {editingCategory === category.type ? (
                      <button
                        onClick={() => onUpdateCategory(category.type)}
                        disabled={categoryUpdateLoading}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 ml-auto"
                      >
                        {categoryUpdateLoading ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onStartEdit(category)}
                          className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category.type)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DeleteCategoryDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  categoryName: PropTypes.string,
  isLoading: PropTypes.bool,
};

CategoriesTable.displayName = 'CategoriesTable';

CategoriesTable.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      lowSeason: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      highSeason: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
    })
  ).isRequired,
  user: PropTypes.shape({
    role: PropTypes.string.isRequired,
  }).isRequired,
  editingCategory: PropTypes.string,
  categoryForm: PropTypes.shape({
    currency: PropTypes.string,
    lowSeason: PropTypes.string,
    highSeason: PropTypes.string,
    description: PropTypes.string,
  }),
  categoryUpdateLoading: PropTypes.bool.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onUpdateCategory: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  setCategories: PropTypes.func.isRequired,
};

export default CategoriesTable;