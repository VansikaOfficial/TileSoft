import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset, 4=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    // Simulate OTP send (in real app, call backend)
    await new Promise(r => setTimeout(r, 1000));
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    console.log('OTP (demo):', code); // Show in console for demo
    setLoading(false);
    setStep(2);
    alert(`Demo OTP sent! Check browser console for OTP code.\n\nYour OTP: ${code}`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== generatedOtp) { setError('Invalid OTP. Please try again.'); return; }
    setError('');
    setStep(3);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    // In real app: call backend to update password
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setStep(4);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1e293b,#334155)', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:900, color:'#1e293b' }}>TileSoft</div>
          <div style={{ color:'#94a3b8', fontSize:13 }}>Password Recovery</div>
        </div>

        {/* Progress steps */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
          {['Email', 'OTP', 'Reset', 'Done'].map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', flex: i < 3 ? 1 : 'none' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background: step > i + 1 ? '#10b981' : step === i + 1 ? '#6366f1' : '#f1f5f9', color: step >= i + 1 ? 'white' : '#94a3b8', flexShrink:0 }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <div style={{ fontSize:11, color: step === i + 1 ? '#6366f1' : '#94a3b8', marginLeft:4, fontWeight: step === i + 1 ? 700 : 400, whiteSpace:'nowrap' }}>{s}</div>
              {i < 3 && <div style={{ flex:1, height:2, background: step > i + 1 ? '#10b981' : '#f1f5f9', margin:'0 8px' }} />}
            </div>
          ))}
        </div>

        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ fontSize:18, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Forgot Password? 🔑</div>
            <div style={{ color:'#94a3b8', fontSize:13, marginBottom:20 }}>Enter your email and we'll send a reset OTP</div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>Email Address</label>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Sending...' : '📧 Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ fontSize:18, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Enter OTP 🔢</div>
            <div style={{ color:'#94a3b8', fontSize:13, marginBottom:4 }}>OTP sent to <strong>{email}</strong></div>
            <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#065f46', marginBottom:20 }}>
              ℹ️ Demo mode: OTP shown in browser console (F12)
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>6-digit OTP</label>
              <input style={{ ...inp, textAlign:'center', fontSize:24, fontWeight:800, letterSpacing:8 }} value={otp} onChange={e => setOtp(e.target.value.slice(0,6))} placeholder="000000" maxLength={6} required autoFocus />
            </div>
            <button type="submit" style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
              ✅ Verify OTP
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ width:'100%', padding:10, background:'none', border:'none', color:'#6366f1', fontSize:13, cursor:'pointer', marginTop:8 }}>← Back to email</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset}>
            <div style={{ fontSize:18, fontWeight:800, color:'#1e293b', marginBottom:4 }}>New Password 🔒</div>
            <div style={{ color:'#94a3b8', fontSize:13, marginBottom:20 }}>Create a strong new password</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>New Password</label>
              <input style={inp} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required autoFocus />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>Confirm Password</label>
              <input style={{ ...inp, borderColor: confirmPassword && newPassword !== confirmPassword ? '#ef4444' : '#e2e8f0' }} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1e293b', marginBottom:8 }}>Password Reset!</div>
            <div style={{ color:'#94a3b8', fontSize:14, marginBottom:24 }}>Your password has been successfully reset. You can now sign in with your new password.</div>
            <Link to="/login" style={{ display:'block', padding:13, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', borderRadius:10, fontSize:15, fontWeight:700, textDecoration:'none' }}>
              🚀 Sign In Now
            </Link>
          </div>
        )}

        {step < 4 && (
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#94a3b8' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color:'#6366f1', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
