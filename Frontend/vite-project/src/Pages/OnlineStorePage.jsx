import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreRegisterModal from '../components/PreRegisterModal';

const OnlineStorePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpgrade = () => navigate('/subscription');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/store/products`);
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error('Error fetching merchandise:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handlePreRegister = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hound Heart Merchandise</h1>
          <p className="text-sm text-gray-600 mt-1">
            Exclusive apparel, accessories, and resources to celebrate the bond with your dog. Expected to launch in Phase 2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <article key={product.id} className="bg-white rounded-2xl shadow-lg border border-purple-100 flex flex-col overflow-hidden group">
              {/* Image Section */}
              <div className="relative h-48 w-full bg-gray-100 flex-shrink-0">
                <img 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400&h=400'} 
                  alt={product.name} 
                  className="w-full h-full object-cover filter blur-[4px] brightness-75 transition-all duration-300 group-hover:blur-sm group-hover:scale-105" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/90 text-purple-700 px-3 py-1.5 rounded-full font-bold text-xs border border-purple-100 shadow-sm uppercase tracking-wide">
                    {product.isComingSoon ? 'Coming Soon' : 'Available'}
                  </span>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">{product.name}</h2>
                <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                <div className="mt-auto">
                  <div className="mb-4">
                    <span className="text-lg font-bold text-purple-700">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handlePreRegister}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                  >
                    Pre Register
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <PreRegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default OnlineStorePage;
