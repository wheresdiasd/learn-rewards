interface LandingProps {
  onOpenModal: () => void;
}

function Landing({ onOpenModal }: LandingProps) {
  return (
    <div>
      <div style={{
        textAlign: 'center',
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        marginBottom: '4rem',
        color: '#fff',
        boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '3.5rem',
            marginBottom: '1.5rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
            color: '#fff'
          }}>
            The More You Learn,<br />The More You Earn
          </h1>
          <p style={{
            fontSize: '1.4rem',
            marginBottom: '2.5rem',
            maxWidth: '800px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.6',
            fontWeight: '400',
            color: 'rgba(255, 255, 255, 0.95)'
          }}>
            Your free education platform, unlock rewards as<br/> scholarships, laptops and more!
          </p>
          <button
            onClick={onOpenModal}
            style={{
              background: '#fff',
              color: '#667eea',
              padding: '1.25rem 3rem',
              fontSize: '1.15rem',
              fontWeight: '700',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            Connect Wallet to Get Started →
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '4rem', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '3rem', fontSize: '2.25rem', textAlign: 'center', fontWeight: '700', color: '#1e293b' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
          <div style={{ textAlign: 'center', transition: 'transform 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              🎓
            </div>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '700' }}>
              1. Learn
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Watch tech education tutorials and complete hands-on assignments.
            </p>
          </div>

          <div style={{ textAlign: 'center', transition: 'transform 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              📝
            </div>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '700' }}>
              2. Submit
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Complete assignments and submit your work for review.
            </p>
          </div>

          <div style={{ textAlign: 'center', transition: 'transform 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              💰
            </div>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.5rem', fontWeight: '700' }}>
              3. Earn
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Receive LEARN tokens directly to your wallet as rewards.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '4rem 2rem',
        marginBottom: '4rem',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-8%',
          width: '450px',
          height: '450px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-35%',
          left: '-6%',
          width: '380px',
          height: '380px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
          filter: 'blur(45px)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '3rem', fontSize: '2.25rem', textAlign: 'center', fontWeight: '700', color: '#fff' }}>
            What You'll Learn
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{
              padding: '2rem',
              background: 'transparent',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            }}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
                Free Courses
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7', margin: 0, fontSize: '1.05rem' }}>
                Access high-quality tech education at no cost. Learn blockchain, web development, and more without any barriers.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              background: 'transparent',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            }}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
                Unlock Rewards
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7', margin: 0, fontSize: '1.05rem' }}>
                Earn real tokens for every milestone you achieve. Your learning journey translates into tangible rewards.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              background: 'transparent',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            }}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
                Engage the Community
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7', margin: 0, fontSize: '1.05rem' }}>
                Join a vibrant community of learners and builders. Share knowledge, collaborate, and grow together.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{
        background: '#fff',
        border: '2px solid #8b5cf6',
        textAlign: 'center',
        padding: '3rem 2rem'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '2rem', fontWeight: '700' }}>
          Ready to Start Learning?
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Connect your wallet to begin your tech education journey and start earning rewards.
        </p>
        <button
          onClick={onOpenModal}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#fff',
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

export default Landing;
