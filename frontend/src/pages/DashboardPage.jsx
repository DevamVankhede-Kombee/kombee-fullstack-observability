import { useState, useEffect } from 'react';
import { getProducts } from '../services/products';
import { getOrders } from '../services/orders';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData] = await Promise.all([
        getProducts(),
        getOrders(),
      ]);

      const products = Array.isArray(productsData) ? productsData : productsData.products || [];
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];

      const revenue = orders
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + parseFloat(o.totalPrice || 0), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'PENDING').length,
        completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
        totalRevenue: revenue.toFixed(2),
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
      PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
      CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' }
    };
    const config = configs[status] || configs.PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${config.bg} ${config.text} ${config.border}`}>
        {status}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-slide-up space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {user.name}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <Link to="/products" className="btn-premium btn-primary-new text-sm py-2">
            + New Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: `$${parseFloat(stats.totalRevenue).toLocaleString()}`, icon: '💰', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Products', value: stats.totalProducts, icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-lg ${stat.bg} ${stat.color} text-lg`}>{stat.icon}</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Section */}
        <div className="lg:col-span-2">
          <div className="card-premium h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Orders</h2>
              <Link to="/orders" className="text-xs font-semibold text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{order.Product?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400">{order.quantity} unit(s)</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">${parseFloat(order.totalPrice).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">{getStatusBadge(order.status)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">No recent activity</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-4">
          <div className="card-premium p-6 bg-slate-900 text-white border-0">
            <h3 className="font-bold text-lg mb-2">Growth Program</h3>
            <p className="text-slate-400 text-sm mb-6">Expand your catalog with high-performing items to increase revenue.</p>
            <Link to="/products" className="block w-full text-center bg-white text-slate-900 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors">
              Manage Catalog
            </Link>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Insights</h3>
            <div className="space-y-6">
              {[
                { label: 'Demand Trend', value: 'High', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'System Health', value: 'Optimal', color: 'bg-blue-100 text-blue-700' },
                { label: 'Fulfillment', value: '98%', color: 'bg-indigo-100 text-indigo-700' }
              ].map((insight, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{insight.label}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${insight.color}`}>{insight.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
