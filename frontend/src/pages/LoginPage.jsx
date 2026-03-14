import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { login } from '../services/auth';
import Alert from '../components/Alert';

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const response = await login(values.email, values.password);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid credentials');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl mb-4 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to manage your inventory</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form className="space-y-4" onSubmit={formik.handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                {...formik.getFieldProps('email')}
                className={`input-premium ${formik.touched.email && formik.errors.email ? 'border-red-300' : ''}`}
                placeholder="you@example.com"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link to="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>
              <input
                name="password"
                type="password"
                {...formik.getFieldProps('password')}
                className={`input-premium ${formik.touched.password && formik.errors.password ? 'border-red-300' : ''}`}
                placeholder="••••••••"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{formik.errors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input 
                id="remember" 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600 cursor-pointer">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full btn-premium btn-primary-new py-2.5 text-sm"
            >
              {formik.isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              New user? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">Create an account</Link>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} ShopManager Inventory Systems.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
