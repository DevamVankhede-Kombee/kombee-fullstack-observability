import { useState, useEffect } from 'react';
import { getOrders, createOrder, updateOrder } from '../services/orders';
import { getProducts } from '../services/products';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [formData, setFormData] = useState({
        productId: '',
        quantity: ''
    });

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getOrders();
            const orderList = Array.isArray(data) ? data : data.orders || [];
            setOrders(orderList);
        } catch (error) {
            showAlert('Failed to fetch orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            const productList = Array.isArray(data) ? data : data.products || [];
            setProducts(productList);
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const filterOrders = () => {
        let filtered = orders;
        if (statusFilter !== 'All') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }
        setFilteredOrders(filtered);
        setCurrentPage(1);
    };

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4000);
    };

    const handleOpenModal = () => {
        setFormData({ productId: '', quantity: '' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ productId: '', quantity: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.productId || !formData.quantity) {
            showAlert('Please specify product and quantity', 'error');
            return;
        }

        try {
            const orderData = {
                productId: formData.productId,
                quantity: parseInt(formData.quantity, 10)
            };

            await createOrder(orderData);
            showAlert('Order placed successfully!', 'success');
            handleCloseModal();
            fetchOrders();
        } catch (error) {
            showAlert(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrder(orderId, { status: newStatus });
            showAlert(`Order status updated to ${newStatus}`, 'success');
            fetchOrders();
        } catch (error) {
            showAlert('Failed to update status', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
            PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
            COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100'
        };
        return <span className={`badge ${configs[status] || configs.PENDING}`}>{status}</span>;
    };

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {alert && (
                    <div className="fixed top-20 right-8 z-50 w-full max-w-sm">
                        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
                        <p className="mt-1 text-slate-500 text-sm">Track and manage customer orders and fulfillment.</p>
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="btn btn-primary px-6"
                    >
                        + Create Order
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Orders', value: orders.length, color: 'text-indigo-600' },
                        { label: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: 'text-amber-600' },
                        { label: 'Processing', value: orders.filter(o => o.status === 'PROCESSING').length, color: 'text-blue-600' },
                        { label: 'Completed', value: orders.filter(o => o.status === 'COMPLETED').length, color: 'text-emerald-600' },
                    ].map((stat, i) => (
                        <div key={i} className="card p-4 text-center">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="card p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Filter Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input w-40 py-1"
                        >
                            <option>All</option>
                            <option>PENDING</option>
                            <option>PROCESSING</option>
                            <option>COMPLETED</option>
                            <option>CANCELLED</option>
                        </select>
                    </div>
                    <span className="text-sm text-slate-500">Showing {filteredOrders.length} records</span>
                </div>

                {paginatedOrders.length > 0 ? (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-semibold">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{order.product?.name || order.Product?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{order.product?.category || order.Product?.category || 'General'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-700">{order.quantity}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">${parseFloat(order.totalPrice).toLocaleString()}</td>
                                            <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className="input py-1 text-xs w-32 border-slate-200"
                                                >
                                                    <option>PENDING</option>
                                                    <option>PROCESSING</option>
                                                    <option>COMPLETED</option>
                                                    <option>CANCELLED</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card p-20 text-center">
                        <div className="text-4xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
                        <p className="text-slate-500 mb-6">No records match your current criteria.</p>
                        <button onClick={handleOpenModal} className="btn btn-primary">Create Your First Order</button>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center mt-10">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {showModal && (
                    <Modal onClose={handleCloseModal} title="Create New Order">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Product *</label>
                                    <select
                                        value={formData.productId}
                                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Choose a product...</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} — ${product.price} ({product.stock} in stock)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="input"
                                        placeholder="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline flex-1">Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Place Order</button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </div>
    );
}
