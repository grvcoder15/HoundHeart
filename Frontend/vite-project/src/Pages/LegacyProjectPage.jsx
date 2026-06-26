import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import forestHero from '../assets/images/legacy_forest_hero.png';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components — structured so admin-wired data can replace props later
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ExpandableCard — fixes grid overflow by enforcing minWidth:0
 */
const ExpandableCard = ({ children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} {...props}>
    {children}
  </div>
);

/**
 * ClampedText — shows up to 3 lines then a "Show more" toggle
 */
const ClampedText = ({ text, color = '#5a7a62' }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop: '0.25rem' }}>
      <p style={{
        margin: 0,
        color,
        fontSize: '0.85rem',
        lineHeight: 1.5,
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        ...(expanded ? {} : {
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        })
      }}>
        {text}
      </p>
      {text && text.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none', padding: '2px 0', marginTop: '2px',
            color: '#22c55e', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          {expanded ? 'Show less ▲' : 'Show more ▼'}
        </button>
      )}
    </div>
  );
};

/**
 * PhotoGallery
 * @param {string[]} photos  - Array of image URLs. Pass [] or omit for placeholder state.
 * @param {string}   label   - Section label shown above the gallery
 */
const PhotoGallery = ({ photos = [], label = 'Photos' }) => {
  const hasPhotos = photos && photos.length > 0;

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '3px', height: '20px', borderRadius: '2px',
          background: 'linear-gradient(to bottom, #d97706, #92400e)'
        }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>
          {label}
        </h3>
      </div>

      {hasPhotos ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {photos.map((src, i) => (
            <div key={i} style={{
              borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <img
                src={src}
                alt={`${label} ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Placeholder grid — swap out when admin uploads are wired */
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                style={{
                  aspectRatio: '4/3',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #f0faf0 50%, #e8f5e9 100%)',
                  border: '1.5px dashed #a7c5a0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3C8.13 3 5 6.13 5 10c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
                    fill="#86c78a" opacity="0.6"
                  />
                  <rect x="9" y="18" width="6" height="2" rx="1" fill="#86c78a" opacity="0.5" />
                </svg>
                <span style={{ fontSize: '0.7rem', color: '#5a8a60', fontWeight: 600, textAlign: 'center', padding: '0 0.5rem' }}>
                  Photo coming soon
                </span>
              </div>
            ))}
          </div>
          <p style={{
            marginTop: '1rem', fontSize: '0.8rem', color: '#7a9480',
            textAlign: 'center', fontStyle: 'italic'
          }}>
            📷 Real photos will appear here as the program grows
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * ImpactStat
 * @param {string|number} value - Stat value (pass null/undefined for placeholder)
 * @param {string} label        - Stat label
 * @param {string} icon         - Emoji icon
 */
const ImpactStat = ({ value, label, icon }) => {
  const isPlaceholder = value === null || value === undefined;
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      boxShadow: '0 2px 12px rgba(26,58,42,0.08)',
      border: '1px solid #e0ede2',
      flex: '1',
      minWidth: '140px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(to right, #d97706, #f59e0b)'
      }} />
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      {isPlaceholder ? (
        <div style={{
          height: '2rem', background: 'linear-gradient(90deg, #e8f5e9, #f0faf0, #e8f5e9)',
          borderRadius: '8px', marginBottom: '0.5rem',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite'
        }} />
      ) : (
        <div style={{
          fontSize: '1.75rem', fontWeight: 800, color: '#1a3a2a',
          lineHeight: 1, marginBottom: '0.5rem'
        }}>
          {value}
        </div>
      )}
      <div style={{ fontSize: '0.8rem', color: '#5a7a62', fontWeight: 600 }}>{label}</div>
      {isPlaceholder && (
        <div style={{
          position: 'absolute', bottom: '0.4rem', right: '0.6rem',
          fontSize: '0.6rem', color: '#9aaa9c', fontStyle: 'italic'
        }}>
          illustrative
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab content sections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProjectUpdates — renders the list of admin updates
 */
const ProjectUpdates = ({ updates = [] }) => {
  if (!updates || updates.length === 0) return null;
  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #d97706, #92400e)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Project Updates</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {updates.map(u => (
          <div key={u.id || u.Id} style={{ background: '#fdf8f0', borderRadius: '8px', padding: '1rem', borderLeft: '3px solid #d97706' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a3a2a', fontWeight: 500 }}>{u.content || u.Content}</p>
            <span style={{ fontSize: '0.75rem', color: '#8a9a8c', marginTop: '0.25rem', display: 'block' }}>
              {new Date(u.date || u.Date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MemorialForestSection = ({ adminData }) => (
  <div style={{ animation: 'fadeInUp 0.4s ease' }}>
    {/* Hero banner */}
    <div style={{
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      height: '280px',
      marginBottom: '2rem',
      boxShadow: '0 8px 32px rgba(26,58,42,0.2)'
    }}>
      <img
        src={forestHero}
        alt="HoundHeart Memorial Forest"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(10,30,18,0.75) 0%, rgba(10,30,18,0.2) 60%, transparent 100%)',
        display: 'flex', alignItems: 'flex-end', padding: '2rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(217,119,6,0.9)', borderRadius: '20px',
            padding: '0.3rem 0.9rem', marginBottom: '0.75rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>
              🌳 LIVING LEGACY
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800,
            color: 'white', margin: 0, lineHeight: 1.2,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            The HoundHeart<br />Memorial Forest™
          </h2>
        </div>
      </div>
    </div>

    {/* Description card */}
    <div style={{
      background: 'linear-gradient(135deg, #f0faf0 0%, #fdf8f0 100%)',
      borderRadius: '16px',
      padding: '1.75rem',
      borderLeft: '4px solid #22c55e',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 8px rgba(26,58,42,0.06)'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🌿</span>
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1a3a2a', fontWeight: 700, fontSize: '1.05rem' }}>
            Trees planted in honor of beloved dogs
          </h3>
          <p style={{ margin: 0, color: '#3d5a44', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
            {adminData?.description || `Members may dedicate trees to current or departed companions, creating a living legacy
that continues to grow for generations. Every tree planted is a testament to the
unbreakable bond between humans and their dogs.`}
          </p>
        </div>
      </div>
    </div>
    
    {/* Admin Updates */}
    <ProjectUpdates updates={adminData?.updates} />

    {/* How it works */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem', marginBottom: '2rem'
    }}>
      {[
        { icon: '🐾', title: 'Dedicate a Tree', desc: 'Name a tree in honour of your companion — past or present' },
        { icon: '🌱', title: 'Watch It Grow', desc: 'Receive updates as your dedicated tree takes root and thrives' },
        { icon: '📸', title: 'Share the Memory', desc: "Add a photo and story to your tree's memorial page" },
        { icon: '♾️', title: 'Forever Legacy', desc: 'Your tree stands as a living tribute for generations to come' }
      ].map((step, i) => (
        <div key={i} style={{
          background: 'white',
          borderRadius: '14px',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(26,58,42,0.07)',
          border: '1px solid #e0ede2',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,58,42,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,58,42,0.07)';
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>{step.icon}</div>
          <div style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
            {step.title}
          </div>
          <div style={{ color: '#5a7a62', fontSize: '0.8rem', lineHeight: 1.5 }}>{step.desc}</div>
        </div>
      ))}
    </div>

    <TreeDedicationSection adminData={adminData} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tree Dedication Section (Interactive)
// ─────────────────────────────────────────────────────────────────────────────
const TreeDedicationSection = ({ adminData }) => {
  const [liveTrees, setLiveTrees] = useState([]);
  const [userTrees, setUserTrees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Form State
  const [dogName, setDogName] = useState('');
  const [tributeMessage, setTributeMessage] = useState('');
  const [dedicationType, setDedicationType] = useState('Honor');
  const [base64Image, setBase64Image] = useState('');

  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      const liveRes = await apiService.getLiveTreeDedications();
      if (liveRes && liveRes.data) setLiveTrees(liveRes.data);

      const userRes = await apiService.getUserTreeDedications();
      if (userRes && userRes.data) setUserTrees(userRes.data);
    } catch (err) {
      console.error('Failed to fetch trees:', err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dogName || !tributeMessage || !base64Image) {
      alert("Please fill in all fields and upload a photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.submitTreeDedication({
        dogName,
        tributeMessage,
        base64Image,
        dedicationType
      });
      setSubmitMessage("Thank you. Your dedication is being reviewed and will appear in the gallery soon.");
      setDogName('');
      setTributeMessage('');
      setBase64Image('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage(null);
        fetchTrees();
      }, 4000);
    } catch (err) {
      alert("Error submitting dedication: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dedication? This cannot be undone.")) {
      try {
        await apiService.deleteTreeDedication(id);
        fetchTrees();
      } catch (err) {
        alert("Error deleting dedication: " + err.message);
      }
    }
  };

  const renderGallery = (trees, label, adminPhotos = []) => (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '3px', height: '20px', borderRadius: '2px',
          background: 'linear-gradient(to bottom, #d97706, #92400e)'
        }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>
          {label}
        </h3>
        {label === "Memorial Forest Gallery" && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              marginLeft: 'auto',
              background: '#22c55e', color: 'white', border: 'none',
              padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            + Dedicate a Tree
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {trees.map((tree) => (
          <ExpandableCard key={tree.id || tree.Id}>
            {/* The fixed-size Image Card */}
            <div style={{
              position: 'relative', aspectRatio: '4/3',
              borderRadius: '12px', overflow: 'hidden', background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e0ede2',
            }}>
              <img
                src={tree.photoUrl || tree.PhotoUrl}
                alt={tree.dogName || tree.DogName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(255,255,255,0.9)', padding: '4px 8px',
                borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                color: '#1a3a2a', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex', gap: '0.5rem'
              }}>
                {(tree.status === 'PendingReview' || tree.Status === 'PendingReview') && (
                   <span style={{ color: '#d97706' }}>⏳ Pending</span>
                )}
                <span>{tree.growthStage || tree.GrowthStage || '🌱 Sapling'}</span>
              </div>
            </div>
            
            {/* The Text outside the card */}
            <div style={{ padding: '0.75rem 0.25rem 0', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: '0 0 0.25rem', color: '#1a3a2a', fontSize: '1.05rem', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
                  {tree.dogName || tree.DogName}
                </h4>
                {userTrees.some(u => (u.id || u.Id) === (tree.id || tree.Id)) && (
                  <button 
                    onClick={() => handleDelete(tree.id || tree.Id)}
                    style={{
                      background: 'none', border: 'none', color: '#ef4444', 
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      padding: '2px 6px', borderRadius: '4px', flexShrink: 0
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Delete
                  </button>
                )}
              </div>
              {label === "Others Gallery Posts" && (tree.userFullName || tree.UserFullName) && (
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: '#6b7280' }}>
                  By {tree.userFullName || tree.UserFullName}
                </p>
              )}
              <ClampedText text={`"${tree.tributeMessage || tree.TributeMessage}"`} color="#5a7a62" />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7a9480' }}>
                In {tree.dedicationType || tree.DedicationType}
              </div>
            </div>
          </ExpandableCard>
        ))}
        
        {/* Admin uploaded photos */}
        {adminPhotos.map((url, i) => (
          <ExpandableCard key={`admin-${i}`}>
            <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e0ede2' }}>
              <img src={url} alt="Gallery photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </ExpandableCard>
        ))}

        {/* Fill with placeholders if less than 3 total items */}
        {label === "Memorial Forest Gallery" && (trees.length + adminPhotos.length) < 3 && 
          [...Array(3 - trees.length - adminPhotos.length)].map((_, i) => (
            <div
                key={`placeholder-${i}`}
                style={{
                  aspectRatio: '4/3',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #f0faf0 50%, #e8f5e9 100%)',
                  border: '1.5px dashed #a7c5a0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🌳</span>
                <span style={{ fontSize: '0.7rem', color: '#5a8a60', fontWeight: 600 }}>
                  Awaiting Dedication
                </span>
              </div>
          ))
        }
      </div>
    </div>
  );

  const allTreesMap = new Map();
  userTrees.forEach(t => allTreesMap.set(t.id || t.Id, t));
  const combinedTrees = Array.from(allTreesMap.values()).sort((a, b) => new Date(b.createdAt || b.CreatedAt) - new Date(a.createdAt || a.CreatedAt));
  const othersTrees = liveTrees.filter(item => !userTrees.some(u => (u.id || u.Id) === (item.id || item.Id)));

  return (
    <>
      {userTrees.some(t => t.status === 'PendingReview' || t.Status === 'PendingReview') && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', marginTop: '2rem' }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', lineHeight: 1.5 }}>
            <strong>ℹ️ Note:</strong> Your newly dedicated tree is pending review. It is currently only visible to you. Once approved by our team, it will become publicly visible to everyone.
          </p>
        </div>
      )}
      {renderGallery(combinedTrees, "Memorial Forest Gallery", adminData?.adminPhotos)}

      {/* Others Gallery Posts */}
      {/* Others Gallery Posts */}
      <div style={{ marginTop: '3rem' }}>
        {othersTrees.length > 0 ? (
          renderGallery(othersTrees, "Others Gallery Posts")
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #16a34a, #15803d)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Others Gallery Posts</h3>
            </div>
            <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.9rem' }}>No approved posts from the community yet.</p>
          </div>
        )}
      </div>

      {/* Dedication Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1a3a2a', fontSize: '1.25rem' }}>Dedicate a Tree</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {submitMessage ? (
              <div style={{ padding: '1rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', textAlign: 'center' }}>
                {submitMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Dog's Name *</label>
                  <input required value={dogName} onChange={e => setDogName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Dedication Type</label>
                  <select value={dedicationType} onChange={e => setDedicationType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="Honor">In Honor Of (Current companion)</option>
                    <option value="Memory">In Memory Of (Departed companion)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Tribute Message * (Max 300 chars)</label>
                  <textarea required maxLength="300" rows="3" value={tributeMessage} onChange={e => setTributeMessage(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Photo *</label>
                  {base64Image && (
                    <img src={base64Image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />
                  )}
                  <input required={!base64Image} type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%' }} />
                </div>

                <button disabled={isSubmitting} type="submit" style={{
                  background: '#22c55e', color: 'white', padding: '1rem',
                  borderRadius: '8px', border: 'none', fontWeight: 700,
                  marginTop: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Dedication'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const SeniorDogSection = ({ adminData }) => {
  const statsFromAdmin = adminData?.stats || {};
  const impactStats = [
    { value: statsFromAdmin.beds || null, label: 'Beds Donated', icon: '🛏️' },
    { value: statsFromAdmin.dogs || null, label: 'Dogs Supported', icon: '🐕' },
    { value: statsFromAdmin.medical || null, label: 'Medical Assists', icon: '💊' },
    { value: statsFromAdmin.adopted || null, label: 'Adopted This Year', icon: '🏠' },
  ];

  const [liveItems, setLiveItems] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dogName, setDogName] = useState('');
  const [story, setStory] = useState('');
  const [base64Image, setBase64Image] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  const fetchItems = async () => {
    try {
      const [liveRes, userRes] = await Promise.all([
        apiService.getLiveSeniorDogSubmissions(),
        apiService.getUserSeniorDogSubmissions()
      ]);
      const live = Array.isArray(liveRes?.data) ? liveRes.data : Array.isArray(liveRes) ? liveRes : [];
      const user = Array.isArray(userRes?.data) ? userRes.data : Array.isArray(userRes) ? userRes : [];
      setLiveItems(live);
      setUserItems(user);
    } catch (err) {
      console.error('Failed to fetch senior dog submissions:', err);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBase64Image(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiService.submitSeniorDogSubmission({ DogName: dogName, Story: story, PhotoUrl: base64Image });
      setSubmitMessage('Thank you! Your submission is being reviewed and will appear in the gallery soon.');
      setDogName(''); setStory(''); setBase64Image('');
      setTimeout(() => { setIsModalOpen(false); setSubmitMessage(null); fetchItems(); }, 4000);
    } catch (err) {
      alert('Error submitting: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try { await apiService.deleteSeniorDogSubmission(id); fetchItems(); }
      catch (err) { alert('Error deleting: ' + err.message); }
    }
  };

  const allMap = new Map();
  userItems.forEach(t => allMap.set(t.id || t.Id, t));
  const combined = Array.from(allMap.values()).sort((a, b) => new Date(b.createdAt || b.CreatedAt) - new Date(a.createdAt || a.CreatedAt));
  const othersItems = liveItems.filter(item => !userItems.some(u => (u.id || u.Id) === (item.id || item.Id)));

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Hero strip */}
      <div style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a47 50%, #1a3a2a 100%)',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        marginBottom: '2rem', position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(26,58,42,0.25)'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(217,119,6,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(34,197,94,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(217,119,6,0.9)', borderRadius: '20px', padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>🐾 COMMUNITY CARE</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, color: 'white', margin: '0 0 0.75rem', lineHeight: 1.2 }}>The Senior Dog Project™</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {adminData?.description || `Supporting senior dogs who face greater challenges finding homes. Community contributions help provide medical care, supplies, rehabilitation, and adoption assistance.`}
          </p>
        </div>
      </div>

      {/* Impact stats */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #d97706, #92400e)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Program Impact</h3>
          <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', borderRadius: '20px', padding: '0.2rem 0.6rem', fontWeight: 600, border: '1px solid #fde68a' }}>Stats updated as program grows</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {impactStats.map((stat, i) => (<ImpactStat key={i} value={stat.value} label={stat.label} icon={stat.icon} />))}
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#8a9a8c', textAlign: 'center', fontStyle: 'italic', background: '#f9fafb', borderRadius: '8px', padding: '0.6rem 1rem' }}>
          ℹ️ Impact figures shown above are illustrative placeholders. Real data will populate here as the program launches and community contributions are tracked.
        </p>
      </div>
      
      {/* Admin Updates */}
      <ProjectUpdates updates={adminData?.updates} />

      {/* How you can help */}
      <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fdf8f0 100%)', borderRadius: '16px', padding: '1.75rem', borderLeft: '4px solid #d97706', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(217,119,6,0.08)' }}>
        <h3 style={{ color: '#92400e', fontWeight: 700, margin: '0 0 1rem', fontSize: '1rem' }}>🤝 How This Project Helps</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {['🏥 Medical care for senior dogs in shelters','🛏️ Comfortable beds and supplies for aging dogs','💪 Rehabilitation support and physical therapy','🏠 Adoption assistance and placement programs','🍖 Nutritional support tailored for senior needs','❤️ Community advocacy and awareness campaigns'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#5a4020', lineHeight: 1.4 }}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending note */}
      {userItems.some(t => t.status === 'PendingReview' || t.Status === 'PendingReview') && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', lineHeight: 1.5 }}>
            <strong>ℹ️ Note:</strong> Your submission is pending review. Once approved by our team, it will become publicly visible.
          </p>
        </div>
      )}

      {/* Gallery */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #d97706, #92400e)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Senior Dog Project Gallery</h3>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            + Share a Story
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {combined.map((item) => (
            <ExpandableCard key={item.id || item.Id}>
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e0ede2' }}>
                <img src={item.photoUrl || item.PhotoUrl} alt={item.dogName || item.DogName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {(item.status === 'PendingReview' || item.Status === 'PendingReview') && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ color: '#d97706' }}>⏳ Pending</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '0.75rem 0.25rem 0', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#1a3a2a', fontSize: '1.05rem', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>{item.dogName || item.DogName}</h4>
                  {userItems.some(u => (u.id || u.Id) === (item.id || item.Id)) && (
                    <button onClick={() => handleDelete(item.id || item.Id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete</button>
                  )}
                </div>
                <ClampedText text={item.story || item.Story} color="#5a7a62" />
              </div>
            </ExpandableCard>
          ))}

          {/* Admin uploaded photos */}
          {adminData?.adminPhotos?.map((url, i) => (
            <ExpandableCard key={`admin-${i}`}>
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e0ede2' }}>
                <img src={url} alt="Gallery photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </ExpandableCard>
          ))}

          {combined.length + (adminData?.adminPhotos?.length || 0) < 3 && [...Array(3 - (combined.length + (adminData?.adminPhotos?.length || 0)))].map((_, i) => (
            <div key={`ph-${i}`} style={{ aspectRatio: '4/3', borderRadius: '12px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f0faf0 50%, #e8f5e9 100%)', border: '1.5px dashed #a7c5a0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐕</span>
              <span style={{ fontSize: '0.7rem', color: '#5a8a60', fontWeight: 600 }}>Awaiting Story</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1a3a2a', fontSize: '1.25rem' }}>Share a Senior Dog Story</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {submitMessage ? (
              <div style={{ padding: '1rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', textAlign: 'center' }}>{submitMessage}</div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Dog's Name *</label>
                  <input required value={dogName} onChange={e => setDogName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Story * (Max 500 chars)</label>
                  <textarea required maxLength="500" rows="3" value={story} onChange={e => setStory(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Photo *</label>
                  {base64Image && <img src={base64Image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />}
                  <input required={!base64Image} type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: '#22c55e', color: 'white', padding: '1rem', borderRadius: '8px', border: 'none', fontWeight: 700, marginTop: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Story'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Others Gallery Posts - approved stories from other users */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #d97706, #92400e)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Others Gallery Posts</h3>
        </div>
        {othersItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {othersItems.map((item) => (
              <div key={item.id || item.Id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0ede2', background: 'white' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={item.photoUrl || item.PhotoUrl} alt={item.dogName || item.DogName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#1a3a2a', fontSize: '1rem' }}>{item.dogName || item.DogName}</h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: '#6b7280' }}>By {item.userFullName || item.UserFullName}</p>
                  <ClampedText text={item.story || item.Story} color="#4b5563" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.9rem' }}>No approved posts from the community yet.</p>
        )}
      </div>
    </div>
  );
};



const ResearchSection = ({ adminData }) => {
  const [liveItems, setLiveItems] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [base64Image, setBase64Image] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  const fetchItems = async () => {
    try {
      const [liveRes, userRes] = await Promise.all([
        apiService.getLiveResearchSubmissions(),
        apiService.getUserResearchSubmissions()
      ]);
      const live = Array.isArray(liveRes?.data) ? liveRes.data : Array.isArray(liveRes) ? liveRes : [];
      const user = Array.isArray(userRes?.data) ? userRes.data : Array.isArray(userRes) ? userRes : [];
      setLiveItems(live);
      setUserItems(user);
    } catch (err) {
      console.error('Failed to fetch research submissions:', err);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBase64Image(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiService.submitResearchSubmission({ Title: title, Description: description, PhotoUrl: base64Image });
      setSubmitMessage('Thank you! Your submission is being reviewed and will appear in the gallery soon.');
      setTitle(''); setDescription(''); setBase64Image('');
      setTimeout(() => { setIsModalOpen(false); setSubmitMessage(null); fetchItems(); }, 4000);
    } catch (err) {
      alert('Error submitting: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try { await apiService.deleteResearchSubmission(id); fetchItems(); }
      catch (err) { alert('Error deleting: ' + err.message); }
    }
  };

  const allMap = new Map();
  userItems.forEach(t => allMap.set(t.id || t.Id, t));
  const combined = Array.from(allMap.values()).sort((a, b) => new Date(b.createdAt || b.CreatedAt) - new Date(a.createdAt || a.CreatedAt));
  const othersItems = liveItems.filter(item => !userItems.some(u => (u.id || u.Id) === (item.id || item.Id)));

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Hero strip */}
      <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,27,75,0.3)' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139,92,246,0.8)', borderRadius: '20px', padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>🔬 RESEARCH & SCIENCE</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, color: 'white', margin: '0 0 0.75rem', lineHeight: 1.2 }}>The HoundHeart<br />Research Initiative™</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6 }}>
            Advancing understanding of human-dog co-regulation and wellness through anonymized community data, member participation, and future partnerships with researchers and academic institutions.
          </p>
        </div>
      </div>

      {/* Status notice */}
      <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #c4b5fd', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(139,92,246,0.1)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
          <span style={{ fontSize: '1.4rem' }}>🔭</span>
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#4c1d95', fontWeight: 700, fontSize: '1rem' }}>Partnerships in Development</h3>
          <p style={{ margin: 0, color: '#5b21b6', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {adminData?.description || `Research partnerships are currently in development. This initiative will launch in collaboration with researchers and academic institutions — community data participation details will be shared with members when the program opens. No data collection is currently active.`}
          </p>
        </div>
      </div>

      {/* Admin Updates */}
      <ProjectUpdates updates={adminData?.updates} />

      {/* Focus areas */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #7c3aed, #a78bfa)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Research Focus Areas</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '💓', title: 'Co-regulation Science', desc: 'Studying how humans and dogs mutually regulate stress, heart rate, and emotional state through proximity and interaction.' },
            { icon: '🧠', title: 'Wellness & Bonding', desc: 'Understanding how the depth of the human-dog bond correlates with measurable wellness outcomes for both species.' },
            { icon: '📊', title: 'Community Data', desc: "Anonymized, opt-in member participation data will help build the world's first large-scale human-dog wellness dataset." },
            { icon: '🤝', title: 'Academic Partnerships', desc: 'Future collaborations with veterinary schools, psychology departments, and wellness research institutions.' }
          ].map((area, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(30,27,75,0.07)', border: '1px solid #ede9fe', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(30,27,75,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,27,75,0.07)'; }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>{area.icon}</div>
              <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem', marginBottom: '0.4rem' }}>{area.title}</div>
              <div style={{ color: '#4c1d95', fontSize: '0.82rem', lineHeight: 1.55 }}>{area.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending note */}
      {userItems.some(t => t.status === 'PendingReview' || t.Status === 'PendingReview') && (
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: '#5b21b6', fontSize: '0.9rem', lineHeight: 1.5 }}>
            <strong>ℹ️ Note:</strong> Your submission is pending review. Once approved by our team, it will become publicly visible.
          </p>
        </div>
      )}

      {/* Gallery */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #7c3aed, #a78bfa)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Research Initiative Gallery</h3>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            + Share a Story
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {combined.map((item) => (
            <ExpandableCard key={item.id || item.Id}>
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #ede9fe' }}>
                <img src={item.photoUrl || item.PhotoUrl} alt={item.title || item.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {(item.status === 'PendingReview' || item.Status === 'PendingReview') && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ color: '#7c3aed' }}>⏳ Pending</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '0.75rem 0.25rem 0', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#1e1b4b', fontSize: '1.05rem', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>{item.title || item.Title}</h4>
                  {userItems.some(u => (u.id || u.Id) === (item.id || item.Id)) && (
                    <button onClick={() => handleDelete(item.id || item.Id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete</button>
                  )}
                </div>
                <ClampedText text={`"${item.description || item.Description}"`} color="#5b21b6" />
              </div>
            </ExpandableCard>
          ))}

          {/* Admin uploaded photos */}
          {adminData?.adminPhotos?.map((url, i) => (
            <ExpandableCard key={`admin-${i}`}>
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #ede9fe' }}>
                <img src={url} alt="Gallery photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </ExpandableCard>
          ))}

          {combined.length + (adminData?.adminPhotos?.length || 0) < 3 && [...Array(3 - (combined.length + (adminData?.adminPhotos?.length || 0)))].map((_, i) => (
            <div key={`ph-${i}`} style={{ aspectRatio: '4/3', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1.5px dashed #c4b5fd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔬</span>
              <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600 }}>Awaiting Submission</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1.25rem' }}>Share a Research Story</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {submitMessage ? (
              <div style={{ padding: '1rem', background: '#f5f3ff', color: '#5b21b6', borderRadius: '8px', textAlign: 'center' }}>{submitMessage}</div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Title *</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Description * (Max 500 chars)</label>
                  <textarea required maxLength="500" rows="3" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Photo *</label>
                  {base64Image && <img src={base64Image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />}
                  <input required={!base64Image} type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%' }} />
                </div>
                <button disabled={isSubmitting} type="submit" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', padding: '1rem', borderRadius: '8px', border: 'none', fontWeight: 700, marginTop: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Story'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Others Gallery Posts - approved stories from other users */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, #7c3aed, #a78bfa)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Others Gallery Posts</h3>
        </div>
        {othersItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {othersItems.map((item) => (
              <div key={item.id || item.Id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #ede9fe', background: 'white' }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={item.photoUrl || item.PhotoUrl} alt={item.title || item.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#1e1b4b', fontSize: '1rem' }}>{item.title || item.Title}</h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: '#6b7280' }}>By {item.userFullName || item.UserFullName}</p>
                  <ClampedText text={item.description || item.Description} color="#4b5563" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.9rem' }}>No approved posts from the community yet.</p>
        )}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: 'forest',
    label: '🌳 Memorial Forest',
    shortLabel: 'Forest',
    component: MemorialForestSection
  },
  {
    key: 'senior',
    label: '🐾 Senior Dog Project',
    shortLabel: 'Senior Dogs',
    component: SeniorDogSection
  },
  {
    key: 'research',
    label: '🔬 Research Initiative',
    shortLabel: 'Research',
    component: ResearchSection
  }
];

const LegacyProjectPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('forest');
  const [adminData, setAdminData] = useState({ description: '', stats: {}, updates: [], adminPhotos: [] });
  const [hasPremiumAccess, setHasPremiumAccess] = useState(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const subRes = await apiService.getSubscriptionDetails();
        const subData = subRes?.data;
        
        let isPremium = false;
        if (subData && (subData.planName || subData.PlanName)) {
          const planName = (subData.planName || subData.PlanName).toLowerCase();
          if (planName.includes('premium')) {
            isPremium = true;
          }
        } else {
          // Fallback to local storage role if API fails but they have a hardcoded role
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (Number(user.roleId || user.RoleId) === 2) {
              isPremium = true;
            }
          }
        }
        setHasPremiumAccess(isPremium);
      } catch (err) {
        console.error("Failed to verify subscription:", err);
        setHasPremiumAccess(false);
      }
    };
    verifyAccess();
  }, []);

  useEffect(() => {
    if (hasPremiumAccess === false) return; // Don't fetch if access denied

    const fetchAdminData = async () => {
      try {
        const [contentRes, updatesRes, photosRes] = await Promise.all([
          apiService.getLegacyContent(activeTab),
          apiService.getLegacyUpdates(activeTab),
          apiService.getLegacyPhotos(activeTab)
        ]);
        
        let stats = {};
        if (contentRes.success && activeTab === 'senior' && contentRes.data?.impactStatsJson) {
          try { stats = JSON.parse(contentRes.data.impactStatsJson); } catch (e) {}
        }
        
        setAdminData({
          description: contentRes.success ? contentRes.data?.description : '',
          stats,
          updates: updatesRes.success ? updatesRes.data || [] : [],
          adminPhotos: photosRes.success ? photosRes.data?.map(p => p.photoUrl) || [] : []
        });
      } catch (error) {
        console.error("Failed to fetch admin data for legacy project", error);
      }
    };
    fetchAdminData();
  }, [activeTab]);

  const ActiveComponent = TABS.find(t => t.key === activeTab)?.component ?? MemorialForestSection;

  if (hasPremiumAccess === null) return null; // Wait for check
  
  if (hasPremiumAccess === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', margin: '1rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fef3c7', border: '2px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>
            ⭐
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a3a2a', marginBottom: '1rem' }}>Premium Access Required</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            The HoundHeart Legacy Project is an exclusive initiative reserved strictly for our Premium members. 
            Upgrade your membership to gain full access to the Memorial Forest, Senior Dog Project, and Research Initiative.
          </p>
          <button 
            onClick={() => navigate('/subscription')}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217,119,6,0.3)', transition: 'transform 0.2s' }}
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fdf9', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .legacy-tab-btn {
          position: relative;
          padding: 0.75rem 1.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          color: #6b7280;
          transition: color 0.2s ease;
          white-space: nowrap;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .legacy-tab-btn:hover { color: #1a3a2a; }

        .legacy-tab-btn.active {
          color: #1a3a2a;
        }

        .legacy-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0.75rem;
          right: 0.75rem;
          height: 3px;
          border-radius: 3px 3px 0 0;
          background: linear-gradient(to right, #1a3a2a, #22c55e);
          animation: slideIn 0.25s ease;
        }

        @keyframes slideIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @media (max-width: 640px) {
          .legacy-tab-btn { padding: 0.65rem 0.85rem; font-size: 0.8rem; }
        }
      `}</style>


      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a47 40%, #1a3a2a 100%)',
        padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '250px', height: '250px', borderRadius: '50%',
          background: 'rgba(217,119,6,0.12)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '10%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(34,197,94,0.06)'
        }} />

        <div style={{
          maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1,
          textAlign: 'center'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)',
            borderRadius: '20px', padding: '0.4rem 1rem', marginBottom: '1.25rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 700, letterSpacing: '0.08em' }}>
              🌿 MEMBER-EXCLUSIVE INITIATIVES
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.75rem)',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 1rem',
            lineHeight: 1.15
          }}>
            The HoundHeart<br />
            <span style={{
              background: 'linear-gradient(to right, #fcd34d, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Legacy Project
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7
          }}>
            Three community-driven initiatives that honour the dogs we love,
            support those in need, and advance the science of the human-dog bond.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 clamp(0.5rem, 3vw, 1.5rem)' }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`legacy-tab-btn${activeTab === tab.key ? ' active' : ''}`}
                id={`legacy-tab-${tab.key}`}
              >
                <span className="tab-full-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 1.5rem)'
      }}>
        <div style={{ marginTop: '2.5rem', animation: 'fadeInUp 0.4s ease' }}>
          <ActiveComponent adminData={adminData} />
        </div>
      </div>

      {/* Footer note */}
      <div style={{
        maxWidth: '900px', margin: '0 auto 3rem',
        padding: '0 clamp(1rem, 4vw, 1.5rem)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0faf0 0%, #fdf8f0 100%)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e0ede2',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '1.25rem' }}>🌿</span>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#3d5a44', lineHeight: 1.6 }}>
            <strong>These initiatives grow with our community.</strong>{' '}
            More details, contribution options, and program updates will be shared
            with members as each initiative formally launches.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegacyProjectPage;
