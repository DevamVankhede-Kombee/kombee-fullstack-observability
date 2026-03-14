import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { register } from '../services/auth';
import Alert from '../components/Alert';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        await register(values.name, values.email, values.password);
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setError(
          err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Registration failed'
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 animate-fade-in text-slate-900">
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex shadow-indigo-200/50 border border-white/50">
        {/* Left Side: Brand/Visual */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700 p-12 text-white relative flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight">ShopManager</span>
            </div>
            
            <h2 className="text-5xl font-black leading-tight mb-6 font-display">Scale your <br/> business <br/> globally.</h2>
            <p className="text-rose-100 text-lg font-medium leading-relaxed max-w-md">Join thousands of retailers who trust ShopManager to power their digital commerce and inventory operations.</p>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] font-black">+2k</div>
             </div>
             <p className="text-xs font-bold text-rose-100 uppercase tracking-widest">Trusted by 2,000+ businesses</p>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white/40 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2 font-display">Create Account</h1>
              <p className="text-slate-500 font-bold">Start your 14-day free trial today</p>
            </div>

            {error && <div className="mb-6"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            {success && <div className="mb-6"><Alert type="success" message="Account created! Redirecting..." /></div>}

            <form className="space-y-4" onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    {...formik.getFieldProps('name')}
                    className={`w-full px-5 py-3 bg-white/50 border ${formik.touched.name && formik.errors.name ? 'border-rose-300' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold`}
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    {...formik.getFieldProps('email')}
                    className={`w-full px-5 py-3 bg-white/50 border ${formik.touched.email && formik.errors.email ? 'border-rose-300' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold`}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Password</label>
                    <input
                      name="password"
                      type="password"
                      {...formik.getFieldProps('password')}
                      className={`w-full px-5 py-3 bg-white/50 border ${formik.touched.password && formik.errors.password ? 'border-rose-300' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold`}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Confirm</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      {...formik.getFieldProps('confirmPassword')}
                      className={`w-full px-5 py-3 bg-white/50 border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-rose-300' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start pt-2 pl-1">
                <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label className="ml-3 text-xs font-bold text-slate-500 leading-relaxed">
                  I agree to the <Link to="#" className="text-indigo-600 underline">Terms of Service</Link> and <Link to="#" className="text-indigo-600 underline">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={formik.isSubmitting || success}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center mt-4 group"
              >
                {formik.isSubmitting ? 'Creating account...' : (
                  <>
                    Create Account
                    <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 font-bold">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in instead</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
