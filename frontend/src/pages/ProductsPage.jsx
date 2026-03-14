import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [alert, setAlert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [formData, setFormData] = useState({
        name: '',
        category: 'Electronics',
        price: '',
        stock: '',
        description: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchTerm, categoryFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            const productList = Array.isArray(data) ? data : data.products || [];
            setProducts(productList);
        } catch (error) {
            showAlert('Failed to fetch products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'All Categories') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        setFilteredProducts(filtered);
        setCurrentPage(1);
    };

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4000);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                description: product.description || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', category: 'Electronics', price: '', stock: '', description: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.stock) {
            showAlert('Please fill all required fields', 'error');
            return;
        }

        try {
            const productData = {
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock, 10),
                description: formData.description || ''
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
                showAlert('Product updated successfully!', 'success');
            } else {
                await createProduct(productData);
                showAlert('Product created successfully!', 'success');
            }
            handleCloseModal();
            fetchProducts();
        } catch (error) {
            showAlert(error.response?.data?.errors?.[0]?.msg || 'Operation failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await deleteProduct(id);
            showAlert('Product deleted successfully', 'success');
            fetchProducts();
        } catch (error) {
            showAlert('Failed to delete product', 'error');
        }
    };

    const getStockStatus = (stock) => {
        if (stock > 50) return { label: 'Healthy', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };
        if (stock > 10) return { label: 'Low', class: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' };
        return { label: 'Critical', class: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' };
    };

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="py-8 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {alert && (
                    <div className="fixed top-24 right-8 z-[100] w-full max-w-sm">
                        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                    </div>
                )}

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Inventory System</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Product Catalog</h1>
                        <p className="mt-2 text-slate-500 font-bold max-w-md">Real-time inventory management with instant updates and category filtering.</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="group flex items-center bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl hover:shadow-indigo-200 active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Product
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Products</p>
                            <p className="text-2xl font-black text-slate-900">{products.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Low Stock Alert</p>
                            <p className="text-2xl font-black text-slate-900">{products.filter(p => p.stock <= 10).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Value</p>
                            <p className="text-2xl font-black text-slate-900">${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-4 mb-10 flex flex-col md:flex-row gap-4 items-center border border-white/50 shadow-xl shadow-slate-200/50">
                    <div className="flex-1 w-full relative group">
                        <input
                            type="text"
                            placeholder="Search by name, category, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold placeholder:text-slate-400"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-slate-700 appearance-none bg-no-repeat bg-[right_1.5rem_center] cursor-pointer"
                        >
                            <option>All Categories</option>
                            <option>Electronics</option>
                            <option>Clothing</option>
                            <option>Food</option>
                            <option>Other</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <button 
                        onClick={fetchProducts}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                        title="Refresh Data"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Product Grid */}
                {paginatedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {paginatedProducts.map((product) => {
                            const stockInfo = getStockStatus(product.stock);
                            return (
                                <div key={product.id} className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col overflow-hidden">
                                     {/* Action Hover Menu */}
                                     <div className="absolute top-4 right-4 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                     </div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-[0.15em]">
                                                {product.category}
                                            </span>
                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black flex items-center ${stockInfo.class}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${stockInfo.dot}`}></span>
                                                {stockInfo.label}
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                                        <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-6 flex-1">
                                            {product.description || 'Intelligent resource management with real-time analytics.'}
                                        </p>
                                        
                                        <div className="pt-6 border-t border-slate-50 flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                                                <p className="text-2xl font-black text-slate-900 leading-none">
                                                    <span className="text-indigo-600 text-sm align-top mr-0.5">$</span>
                                                    {parseFloat(product.price).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-900">{product.stock}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom visual accent */}
                                    <div className="h-2 w-full bg-slate-50 group-hover:bg-indigo-600 transition-colors"></div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-6xl">📦</div>
                        <h3 className="text-3xl font-black text-slate-900 mb-3 font-display">No Products Yet</h3>
                        <p className="text-slate-500 font-bold mb-10 max-w-sm mx-auto uppercase tracking-widest text-xs">Your inventory is currently empty. Start building your catalog today.</p>
                        <button onClick={() => handleOpenModal()} className="group bg-indigo-600 hover:bg-slate-900 text-white px-10 py-5 rounded-3xl font-black transition-all shadow-2xl shadow-indigo-200 flex items-center mx-auto">
                            Add Your First Product
                            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Upsert Modal */}
                {showModal && (
                    <Modal onClose={handleCloseModal} title={editingProduct ? 'Update Product' : 'Add New Product'}>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Product Identity</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-400"
                                        placeholder="Enter product title..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Classification</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-slate-700 appearance-none bg-no-repeat bg-[right_1.5rem_center] cursor-pointer"
                                        >
                                            <option>Electronics</option>
                                            <option>Clothing</option>
                                            <option>Food</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Unit Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-400"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Inventory Stock Count</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-400"
                                        placeholder="Number of units"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Product Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-400 min-h-[120px] resize-none"
                                        placeholder="Add detailed specs or features..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95">
                                    {editingProduct ? 'Commit Changes' : 'Publish Product'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </div>
    );
}
